// (c) 2026 Jose AI (https://www.linhut.cn)
// https://github.com/linhut/dsh-stock-terminal
// Licensed under the MIT License. See the LICENSE file for details.

// tests/plugin.test.js — 宿主端（server half）单元测试：以真实 apply(ctx, config)
// 驱动路由注册与设置命名空间接入（对应 awesome-dsh-plugin Checklist「真实可调用」）。

import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const { name, inject, Config, apply } = await import(pathToFileURL(join(ROOT, "lib", "index.js")).href);

/** 构造一个最小 Cordis ctx：webServer.register 记录路由，settings 可选注入。 */
function makeCtx({ withSettings = true, registerError = null } = {}) {
	const routes = [];
	const disposers = [];
	const calls = { settingsInstall: false, effects: 0 };
	const ctx = {
		logger: { warn: () => {} },
		routes,
		calls,
		inject(services, callback) {
			if (withSettings && services.includes("settings")) {
				callback({
					settings: {
						installSection(owner, ns, schema, entry, hooks) {
							calls.settingsInstall = true;
							assert.equal(typeof hooks.setSource, "function");
							assert.equal(typeof hooks.onChange, "function");
							// 与官方实现一致：立即把源接入并通知一次
							hooks.setSource(() => entry);
							hooks.onChange();
						}
					}
				});
			}
		},
		effect(fn) {
			calls.effects += 1;
			const disposer = fn();
			if (typeof disposer === "function") disposers.push(disposer);
			return disposer;
		},
		webServer: {
			register(route) {
				if (registerError) throw registerError;
				routes.push(route);
				return () => {};
			}
		}
	};
	return { ctx, routes, disposers, calls };
}

/** 构造极简 req/res 桩（JSON 响应捕获）。 */
function stubExchange(url, headers = {}) {
	let status = 0;
	const bodyChunks = [];
	const res = {
		writeHead(code) { status = code; },
		end(chunk) { if (chunk !== undefined) bodyChunks.push(String(chunk)); },
		get status() { return status; },
		get body() { return JSON.parse(bodyChunks.join("")); }
	};
	const req = { url, method: "GET", headers: { host: "127.0.0.1:3080", ...headers } };
	return { req, res };
}

test("模块导出符合 DSH 插件形状", () => {
	assert.equal(name, "ui-skin-stock");
	assert.deepEqual(inject, ["webServer"]);
	assert.equal(typeof apply, "function");
	assert.equal(typeof Config, "function"); // schemastery schema 以可调用函数形态导出
});

test("apply 注册 4 条 API 路由（真实调用路径）", () => {
	const { ctx, routes, disposers } = makeCtx();
	const returned = apply(ctx, { refreshMs: 30000, showTape: true });
	assert.equal(routes.length, 4);
	const paths = routes.map((r) => r.path);
	assert.ok(paths.includes("/plugins/dsh-stock/api/quotes"));
	assert.ok(paths.includes("/plugins/dsh-stock/api/suggest"));
	assert.ok(paths.includes("/plugins/dsh-stock/api/kline"));
	assert.ok(paths.includes("/plugins/dsh-stock/api/minute"));
	assert.ok(routes.every((r) => r.kind === "exact" && typeof r.handler === "function"));
	// 回收：effect disposer 存在且可执行
	assert.equal(typeof returned, "undefined"); // apply 本身无返回，回收经 ctx.effect
	assert.equal(disposers.length >= 1, true);
	disposers.forEach((d) => d());
	assert.equal(routes.length, 4); // disposer 不主动清空外部数组，仅象征生命周期
});

test("设置命名空间走最新 installSection API（ctx.inject 可选注入）", () => {
	const { ctx, calls } = makeCtx({ withSettings: true });
	apply(ctx, {});
	assert.equal(calls.settingsInstall, true);

	// 设置服务缺席时不得抛错（可选接线）
	const { ctx: ctx2 } = makeCtx({ withSettings: false });
	assert.doesNotThrow(() => apply(ctx2, {}));
});

test("quotes 路由拒绝非法符号（400 + invalid-symbol）", async () => {
	const { ctx, routes } = makeCtx();
	apply(ctx, {});
	const route = routes.find((r) => r.path === "/plugins/dsh-stock/api/quotes");
	const { req, res } = stubExchange("/plugins/dsh-stock/api/quotes?symbols=%3Brm%20-rf", {
		"sec-fetch-site": "same-origin"
	});
	await route.handler(req, res);
	assert.equal(res.status, 400);
	assert.equal(res.body.ok, false);
	assert.match(res.body.error, /invalid-symbol|too-many/);
});

test("quotes 路由拒绝跨站请求（403 同源护栏）", async () => {
	const { ctx, routes } = makeCtx();
	apply(ctx, {});
	const route = routes.find((r) => r.path === "/plugins/dsh-stock/api/quotes");
	const { req, res } = stubExchange("/plugins/dsh-stock/api/quotes?symbols=sh600519", {
		"sec-fetch-site": "cross-site"
	});
	await route.handler(req, res);
	assert.equal(res.status, 403);
	assert.equal(res.body.error, "cross-site-request-rejected");
});

test("suggest 路由拒绝超长 key（400 invalid-key）", async () => {
	const { ctx, routes } = makeCtx();
	apply(ctx, {});
	const route = routes.find((r) => r.path === "/plugins/dsh-stock/api/suggest");
	const { req, res } = stubExchange("/plugins/dsh-stock/api/suggest?key=" + "a".repeat(51), {
		"sec-fetch-site": "same-origin"
	});
	await route.handler(req, res);
	assert.equal(res.status, 400);
	assert.equal(res.body.error, "invalid-key");
});

test("minute 路由拒绝非法符号（与 kline 同源校验）", async () => {
	const { ctx, routes } = makeCtx();
	apply(ctx, {});
	const route = routes.find((r) => r.path === "/plugins/dsh-stock/api/minute");
	const { req, res } = stubExchange("/plugins/dsh-stock/api/minute?symbol=%3B%2Fetc%2Fpasswd", {
		"sec-fetch-site": "same-origin"
	});
	await route.handler(req, res);
	assert.equal(res.status, 400);
	assert.match(res.body.error, /invalid-symbol/);
});

test("kline 路由拒绝非法符号（400 invalid-symbol）", async () => {
	const { ctx, routes } = makeCtx();
	apply(ctx, {});
	const route = routes.find((r) => r.path === "/plugins/dsh-stock/api/kline");
	const { req, res } = stubExchange("/plugins/dsh-stock/api/kline?symbol=../../etc%2Fpasswd", {
		"sec-fetch-site": "same-origin"
	});
	await route.handler(req, res);
	assert.equal(res.status, 400);
	assert.match(res.body.error, /invalid-symbol/);
});

test("路由注册失败被捕获，不会向上抛出（GUI 启动不受影响）", () => {
	const { ctx } = makeCtx({ registerError: new Error("boom") });
	assert.doesNotThrow(() => apply(ctx, {}));
});