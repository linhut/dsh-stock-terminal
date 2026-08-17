// dsh-stock-terminal · 宿主端 (server half)
// 行情聚合代理：GET /plugins/dsh-stock/api/quotes?symbols=sh000001,hk00700,usAAPL,BTCUSDT,USD/CNY
// 数据源：
//   - 腾讯行情 qt.gtimg.cn  (A股/港股/美股/指数，返回 GBK 文本，用 TextDecoder('gbk') 解码)
//   - Binance data-api.binance.vision / api.binance.com（加密 24h ticker）
//   - Frankfurter api.frankfurter.dev / .app（外汇，昨日基准价计算涨跌）
// 形态与 dsh-client-ui-skin-center 一致：cordis entry + ctx.webServer.register。

import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "schemastery";

export const name = "ui-skin-stock";
export const inject = ["webServer"];

// 设置命名空间，使本插件在系统设置 → 插件配置中可见
const STOCK_NS = settingsNamespace("dsh-stock");
const StockSettingsSchema = z.object({
  refreshMs: z.number().min(5000).max(120000).default(30000),
  showTape: z.boolean().default(true)
});

const API_PREFIX = "/plugins/dsh-stock/api";
const TENCENT_ENDPOINT = "https://qt.gtimg.cn/q=";
const BINANCE_ENDPOINTS = [
	"https://data-api.binance.vision/api/v3/ticker/24hr",
	"https://api.binance.com/api/v3/ticker/24hr"
];
const FRANKFURTER_ENDPOINTS = [
	"https://api.frankfurter.dev/v1",
	"https://api.frankfurter.app/v1"
];
const SUGGEST_ENDPOINT = "https://suggest3.sinajs.cn/suggest/?type=11&key=";
const FETCH_TIMEOUT_MS = 8000;
const PREV_DAYS_BACK = 4;
// 短 TTL 缓存 + in-flight 去重：多客户端/多面板轮询同一批符号时只打一次上游，
// 既降低上游限流风险，也让并发请求共享同一次在途请求，响应更快更稳。
const QUOTES_CACHE_TTL_MS = 5000;
const SUGGEST_CACHE_TTL_MS = 30000;
const CACHE_MAX_ENTRIES = 128;
const quotesCache = new Map();
const suggestCache = new Map();

function cacheGet(cache, key) {
	const entry = cache.get(key);
	if (entry === undefined) return undefined;
	if (entry.expires <= Date.now()) {
		cache.delete(key);
		return undefined;
	}
	return entry.promise;
}

function cacheSet(cache, key, promise, ttl) {
	cache.set(key, { expires: Date.now() + ttl, promise });
	// 简单 FIFO 上限，防止无界增长
	if (cache.size > CACHE_MAX_ENTRIES) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
}

// 加密币展示名（与 dsh-fun-ticker 命名习惯一致）
const CRYPTO_NAMES = {
	BTCUSDT: "比特币",
	ETHUSDT: "以太坊",
	BNBUSDT: "BNB",
	SOLUSDT: "Solana",
	XRPUSDT: "瑞波币",
	DOGEUSDT: "狗狗币",
	ADAUSDT: "Cardano",
	AVAXUSDT: "Avalanche",
	LINKUSDT: "Chainlink",
	LTCUSDT: "莱特币",
	DOTUSDT: "Polkadot",
	TRXUSDT: "波场",
	SHIBUSDT: "SHIB",
	TONUSDT: "TON",
	BCHUSDT: "BCH",
	UNIUSDT: "Uniswap",
	ATOMUSDT: "Cosmos",
	NEARUSDT: "NEAR",
	APTUSDT: "Aptos",
	ARBUSDT: "Arbitrum",
	OPUSDT: "Optimism",
	FILUSDT: "Filecoin",
	SUIUSDT: "SUI",
	PEPEUSDT: "PEPE"
};

// 货币中文名（Frankfurter 外汇展示）
const FX_CURRENCY_NAMES = {
	CNY: "人民币",
	USD: "美元",
	EUR: "欧元",
	JPY: "日元",
	GBP: "英镑",
	HKD: "港元",
	AUD: "澳元",
	CAD: "加元",
	CHF: "瑞士法郎",
	KRW: "韩元",
	SGD: "新加坡元",
	TWD: "新台币",
	THB: "泰铢",
	RUB: "卢布",
	INR: "卢比",
	BRL: "雷亚尔",
	MXN: "比索",
	TRY: "里拉",
	ZAR: "兰特",
	SEK: "瑞典克朗",
	NOK: "挪威克朗",
	DKK: "丹麦克朗",
	NZD: "新西兰元",
	CZK: "捷克克朗",
	PLN: "兹罗提",
	HUF: "福林"
};

function json(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}

function requireMethod(req, res, method) {
	if (req.method === method) return true;
	json(res, 405, { ok: false, error: "method-not-allowed" });
	return false;
}

// 同源护栏：仅允许本地页面（Sec-Fetch-Site / Origin 与本机 Host 一致）访问，
// 防止恶意网页通过 localhost CSRF 拉行情。与 skin-center 同一策略。
function isSameOriginRequest(req) {
	const site = req.headers["sec-fetch-site"];
	if (typeof site === "string" && site === "cross-site") return false;
	const origin = req.headers.origin;
	if (typeof origin === "string" && origin !== "" && origin !== "null") {
		const host = req.headers.host;
		if (typeof host !== "string" || host === "") return false;
		try {
			if (new URL(origin).host !== host) return false;
		} catch {
			return false;
		}
	}
	return true;
}

function requireSameOrigin(req, res) {
	if (isSameOriginRequest(req)) return true;
	json(res, 403, { ok: false, error: "cross-site-request-rejected" });
	return false;
}

function timeoutSignal(ms) {
	return AbortSignal.timeout(ms);
}

function toNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
	if (typeof value === "string") {
		const n = Number.parseFloat(value);
		return Number.isFinite(n) ? n : NaN;
	}
	return NaN;
}

/**
 * 解析一条 v_<sym>="..." 载荷。腾讯以 ~ 分隔字段，稳定索引（经 sh/sz/hk/us 家族验证）：
 *   1 name, 3 last, 4 prevClose, 30 time, 31 change, 32 changePct, 33 high, 34 low。
 * @param raw - 不带 v_<sym>= 前缀的原始串。
 */
function parseTencentRow(raw) {
	const f = raw.split("~");
	if (f.length < 35) return null;
	const price = toNumber(f[3]);
	if (!Number.isFinite(price)) return null;
	return {
		name: f[1] !== undefined && f[1] !== "" ? f[1] : f[2] ?? "",
		price,
		prevClose: toNumber(f[4]),
		change: toNumber(f[31]),
		changePct: toNumber(f[32]),
		high: toNumber(f[33]),
		low: toNumber(f[34])
	};
}

/** 规范化符号：大写市场前缀（SH/SZ/HK/US）统一转小写，避免被误判为加密货币；外汇对（含 /）保持原样。 */
function normalizeSymbol(symbol) {
	const value = String(symbol).trim();
	if (value.includes("/")) return value;
	const match = value.match(/^(SH|SZ|HK|US)([A-Za-z0-9.]+)$/);
	return match === null ? value : match[1].toLowerCase() + match[2];
}

function classifySymbol(symbol) {
	const value = normalizeSymbol(symbol);
	if (/^(?:sh|sz|hk|us)[A-Za-z0-9.]+$/.test(value)) return "tencent";
	if (/^(?=.*[A-Z])[A-Z0-9]{4,12}$/.test(value)) return "crypto";
	if (/^[A-Z]{3}\/[A-Z]{3}$/.test(value)) return "fx";
	return null;
}

async function fetchTencentQuotes(symbols) {
	const out = new Map();
	if (symbols.length === 0) return out;
	try {
		const url = `${TENCENT_ENDPOINT}${symbols.join(",")}&_t=${Date.now()}`;
		const response = await fetch(url, { signal: timeoutSignal(FETCH_TIMEOUT_MS) });
		if (!response.ok) return out;
		const buffer = new Uint8Array(await response.arrayBuffer());
		const text = new TextDecoder("gbk").decode(buffer);
		for (const match of text.matchAll(/v_([A-Za-z0-9.]+)="([^"]*)"/g)) {
			const row = parseTencentRow(match[2]);
			if (row !== null) out.set(match[1], row);
		}
	} catch {
		// 整族降级为空
	}
	return out;
}

async function fetchBinanceQuotes(symbols) {
	const out = new Map();
	if (symbols.length === 0) return out;
	for (const endpoint of BINANCE_ENDPOINTS) {
		try {
			const response = await fetch(`${endpoint}?symbols=${encodeURIComponent(JSON.stringify(symbols))}`, { signal: timeoutSignal(FETCH_TIMEOUT_MS) });
			if (!response.ok) continue;
			const rows = await response.json();
			for (const row of rows) {
				const symbol = String(row.symbol ?? "");
				const price = toNumber(row.lastPrice);
				if (symbol === "" || !Number.isFinite(price)) continue;
				out.set(symbol, {
					symbol,
					name: CRYPTO_NAMES[symbol] ?? symbol,
					price,
					changeAbs: toNumber(row.priceChange),
					changePct: toNumber(row.priceChangePercent),
					high: NaN,
					low: NaN,
					source: "binance"
				});
			}
			if (out.size > 0) return out;
		} catch {
			// 尝试下一个端点
		}
	}
	return out;
}

function isoDaysAgo(date, days) {
	return new Date(date.getTime() - days * 864e5).toISOString().slice(0, 10);
}

async function frankfurterRates(base, targets) {
	const symbols = targets.join(",");
	const date = new Date();
	for (const endpoint of FRANKFURTER_ENDPOINTS) {
		try {
			const latestUrl = `${endpoint}/latest?base=${base}&symbols=${symbols}`;
			const latestResponse = await fetch(latestUrl, { signal: timeoutSignal(FETCH_TIMEOUT_MS) });
			if (!latestResponse.ok) continue;
			const latest = await latestResponse.json();
			if (latest.rates === undefined) continue;
			const rates = new Map();
			for (const [code, value] of Object.entries(latest.rates)) {
				const n = toNumber(value);
				if (Number.isFinite(n)) rates.set(code, n);
			}
			let prev = new Map();
			for (let back = 1; back <= PREV_DAYS_BACK && prev.size === 0; back += 1) {
				const prevUrl = `${endpoint}/${isoDaysAgo(date, back)}?base=${base}&symbols=${symbols}`;
				try {
					const prevResponse = await fetch(prevUrl, { signal: timeoutSignal(6000) });
					if (!prevResponse.ok) continue;
					const prevJson = await prevResponse.json();
					prev = new Map();
					for (const [code, value] of Object.entries(prevJson.rates ?? {})) {
						const n = toNumber(value);
						if (Number.isFinite(n)) prev.set(code, n);
					}
				} catch {
					// 再往前一天
				}
			}
			return { base, rates, prev };
		} catch {
			// 尝试下一个端点
		}
	}
	return null;
}

async function fetchFrankfurterQuotes(pairs) {
	const out = new Map();
	if (pairs.length === 0) return out;
	const byBase = new Map();
	for (const pair of pairs) {
		const [base, target] = pair.split("/");
		if (base === undefined || target === undefined || base === target) continue;
		const list = byBase.get(base) ?? [];
		list.push(target);
		byBase.set(base, list);
	}
	const results = await Promise.all([...byBase.entries()].map(([base, targets]) => frankfurterRates(base, targets)));
	for (const result of results) {
		if (result === null) continue;
		for (const [target, rate] of result.rates) {
			const symbol = `${result.base}/${target}`;
			const prevRate = result.prev.get(target);
			const changeAbs = Number.isFinite(prevRate) && prevRate !== 0 ? rate - prevRate : 0;
			const changePct = Number.isFinite(prevRate) && prevRate !== 0 ? (rate - prevRate) / prevRate * 100 : 0;
			out.set(symbol, {
				symbol,
				name: `${FX_CURRENCY_NAMES[result.base] ?? result.base}/${FX_CURRENCY_NAMES[target] ?? target}`,
				price: rate,
				changeAbs,
				changePct,
				high: NaN,
				low: NaN,
				source: "frankfurter"
			});
		}
	}
	return out;
}

/**
 * 聚合三类行情。任何一类失败都返回空切片，绝不整体报错。
 * @param symbols - 原始符号列表（自动分类）。
 */
async function fetchQuotes(symbols) {
	const tencentSymbols = [];
	const cryptoSymbols = [];
	const fxSymbols = [];
	for (const symbol of symbols) {
		const category = classifySymbol(symbol);
		if (category === "tencent") tencentSymbols.push(symbol);
		else if (category === "crypto") cryptoSymbols.push(symbol);
		else if (category === "fx") fxSymbols.push(symbol);
	}
	const [tencent, crypto, fx] = await Promise.all([
		fetchTencentQuotes(tencentSymbols),
		fetchBinanceQuotes(cryptoSymbols),
		fetchFrankfurterQuotes(fxSymbols)
	]);
	const quotes = [];
	for (const [symbol, row] of tencent) {
		quotes.push({
			symbol,
			name: row.name !== "" ? row.name : symbol,
			price: row.price,
			changeAbs: row.change,
			changePct: row.changePct,
			high: row.high,
			low: row.low,
			source: "tencent"
		});
	}
	for (const quote of crypto.values()) quotes.push(quote);
	for (const quote of fx.values()) quotes.push(quote);
	return quotes;
}

// GET /plugins/dsh-stock/api/quotes?symbols=...
function quotesRoute() {
	return {
		kind: "exact",
		path: `${API_PREFIX}/quotes`,
		handler: (req, res) => {
			if (!requireMethod(req, res, "GET")) return;
			if (!requireSameOrigin(req, res)) return;
			let symbols;
			try {
				const query = new URL(req.url ?? "/", "http://x").searchParams.get("symbols") ?? "";
				symbols = query.split(",").map((s) => normalizeSymbol(s)).filter((s) => s.length > 0);
				if (symbols.length > 200) throw new Error("too-many-symbols");
				for (const symbol of symbols) {
					if (classifySymbol(symbol) === null) throw new Error(`invalid-symbol: ${symbol}`);
				}
			} catch (error) {
				json(res, 400, { ok: false, error: error instanceof Error ? error.message : String(error) });
				return;
			}
			const cacheKey = symbols.join(",");
			let promise = cacheGet(quotesCache, cacheKey);
			if (promise === undefined) {
				promise = fetchQuotes(symbols);
				promise.catch(() => quotesCache.delete(cacheKey));
				cacheSet(quotesCache, cacheKey, promise, QUOTES_CACHE_TTL_MS);
			}
			promise.then(
				(quotes) => json(res, 200, { ok: true, ts: Date.now(), quotes }),
				(error) => json(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) })
			);
		}
	};
}

/**
 * 解析新浪建议 API 的 GBK 响应（suggestvalue 格式），返回统一结果数组。
 */
function parseSuggestResponse(text) {
	const match = text.match(/var suggestvalue="([^"]*)"/);
	if (!match) return [];
	const raw = match[1];
	if (!raw) return [];
	const results = [];
	for (const entry of raw.split(";").filter(Boolean)) {
		const fields = entry.split(",");
		if (fields.length < 4) continue;
		const name = fields[0];
		const fullCode = fields[3]; // e.g. sz000158
		const code = fields[2];     // e.g. 000158
		if (!name || !fullCode) continue;
		const prefix = fullCode.slice(0, 2).toLowerCase();
		const mkt = prefix === "sh" || prefix === "sz" ? "A股" : prefix === "hk" ? "港股" : prefix === "us" ? "美股" : "";
		results.push({ sym: fullCode, name, code, mkt });
	}
	return results;
}

/** 拉取并解析新浪建议（带 TTL 缓存 + in-flight 去重，同一关键字共享在途请求）。 */
function suggestResults(key) {
	const cached = cacheGet(suggestCache, key);
	if (cached !== undefined) return cached;
	const promise = fetch(`${SUGGEST_ENDPOINT}${encodeURIComponent(key)}`, { signal: timeoutSignal(FETCH_TIMEOUT_MS) })
		.then((response) => {
			if (!response.ok) throw new Error(`sina-${response.status}`);
			return response.arrayBuffer();
		})
		.then((buffer) => parseSuggestResponse(new TextDecoder("gbk").decode(new Uint8Array(buffer))));
	promise.catch(() => suggestCache.delete(key));
	cacheSet(suggestCache, key, promise, SUGGEST_CACHE_TTL_MS);
	return promise;
}

/** GET /plugins/dsh-stock/api/suggest?key=csbm — 新浪股票建议代理（GBK解码）。 */
function suggestRoute() {
	return {
		kind: "exact",
		path: `${API_PREFIX}/suggest`,
		handler: (req, res) => {
			if (!requireMethod(req, res, "GET")) return;
			if (!requireSameOrigin(req, res)) return;
			const key = new URL(req.url ?? "/", "http://x").searchParams.get("key") ?? "";
			if (key.trim().length < 1 || key.length > 50) {
				json(res, 400, { ok: false, error: "invalid-key" });
				return;
			}
			suggestResults(key).then(
				(results) => json(res, 200, { ok: true, results }),
				(error) => json(res, 200, { ok: true, results: [], error: error instanceof Error ? error.message : String(error) })
			);
		}
	};
}

/**
 * 挂载路由。失败只记日志、绝不让 GUI 启动失败（与 skin-center 同策略）。
 * @param ctx - cordis context。
 */
export function apply(ctx) {
	// 注册设置命名空间（系统设置 → 插件配置 可见）；失败只记日志，绝不影响启动
	try {
		installSettingsSection(ctx, STOCK_NS, StockSettingsSchema, {}, {
			setSource: () => {},
			onChange: () => {}
		});
	} catch (error) {
		console.error("[ui-skin-stock] settings registration failed:", error);
	}
	try {
		ctx.effect(() => {
			const disposers = [];
			try {
				for (const route of [quotesRoute(), suggestRoute()]) disposers.push(ctx.webServer.register(route));
			} catch (error) {
				for (const dispose of disposers) dispose();
				throw error;
			}
			return () => {
				for (const dispose of disposers) dispose();
			};
		}, "ui-skin-stock: routes");
	} catch (error) {
		console.error("[ui-skin-stock] route registration failed:", error);
	}
}