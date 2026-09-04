#!/usr/bin/env node
// (c) 2026 Jose AI (https://www.linhut.cn)
// https://github.com/linhut/dsh-stock-terminal
// Licensed under the Apache License, Version 2.0. See the LICENSE file for details.

/**
 * check-dsh-compliance.mjs — DSH 插件规范合规检查（按最新 DSH 要求与规则）。
 *
 * 依据：
 *   - awesome-dsh-plugin 收录审核规则（dsh.bundle 必须声明、@deepseek-ai/* 用
 *     peerDependencies 且范围带显式预发布分支、描述必须属实、仓库有真实代码）
 *   - DeepSeek Harness 官方文档（defensive-patterns：结果独立上报/公共约定两侧
 *     一致；web-styling：皮肤元数据）
 *   - dsh-client-ui-skin-center 接线规则（skin.json 的 id/package/wiring.id 正则、
 *     bundleWired 静态事实、SKILL.md 等文本文件须为 UTF-8 无 BOM）
 *
 * 用法：
 *   node tools/check-dsh-compliance.mjs [--fix] [--profile <path>] [--quiet]
 *
 *   --fix      自动修复可修复项（补依赖声明 / bundleWired / screenshots.json）
 *   --profile  目标 profile 根目录（默认 ~/.dsh/profiles/web），用于判定接线方式
 *   --quiet    只输出 FAIL 项
 *   退出码：0 = 全通过（或已修复）；1 = 存在未修复的 FAIL；2 = 工具自身错误
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const args = process.argv.slice(2);
const arg = (name, fallback) => {
	const i = args.indexOf(name);
	return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const FIX = args.includes("--fix");
const QUIET = args.includes("--quiet");
const PROFILE = resolve(arg("--profile", join(homedir(), ".dsh", "profiles", "web")));

/* ---------- 常量（与官方规则保持同步） ---------- */
// skin-center 的 NPM_PACKAGE_NAME_RE / WIRING_ID_RE / skin id 正则
const NPM_PACKAGE_NAME_RE = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;
const WIRING_ID_RE = /^ui-skin-[a-z0-9-]+$/;
const SKIN_ID_RE = /^[a-z0-9-]+$/;
// 官方包：必须走 peerDependencies
const OFFICIAL_SCOPES = ["@deepseek-ai/"];
// 需要校验编码的文本文件（相对仓库根）
const TEXT_FILES = [
	"package.json",
	"skin.json",
	"cordis.patch.yml",
	"README.md",
	"lib/index.js",
	"lib/client.js"
];
const PLUGIN_PKG = "@linxin666/dsh-client-ui-skin-stock";

/* ---------- 工具函数 ---------- */
function g(s) { return "\x1b[32m" + s + "\x1b[0m"; }
function r(s) { return "\x1b[31m" + s + "\x1b[0m"; }
function y(s) { return "\x1b[33m" + s + "\x1b[0m"; }

function readUtf8(p) {
	return readFileSync(p, "utf8"); // 显式 utf8，绝不依赖 Windows 默认编码
}

function readJson(p) {
	try { return JSON.parse(readUtf8(p)); }
	catch (e) { return { __parseError: e.message }; }
}

/** 统计目录下文件数（递归，跳过隐藏项）。 */
function fileCount(dir) {
	if (!existsSync(dir)) return -1;
	let n = 0;
	for (const name of readdirSync(dir)) {
		if (name.startsWith(".")) continue;
		const p = join(dir, name);
		let isDir = false;
		try { isDir = statSync(p).isDirectory(); } catch { continue; }
		if (isDir) n += fileCount(p); else n += 1;
	}
	return n;
}

/** 扫描一个 JS 文件里的 import 目标（支持 import x from "y" / import "y" / import * as x from "y"）。 */
function scanImports(file) {
	const src = readUtf8(file);
	const out = new Set();
	for (const m of src.matchAll(/import[\s\S]*?from\s*["']([^"']+)["']|import\s*["']([^"']+)["']/g)) {
		const target = m[1] ?? m[2];
		if (target && !target.startsWith(".") && !target.startsWith("node:")) out.add(target);
	}
	return out;
}

/* ---------- 逐项检查 ---------- */
const results = [];
const importTargets = new Set();
function check(name, ok, detail, fixable = false) {
	results.push({ name, ok, detail, fixable });
	if (!QUIET || !ok) {
		console.log((ok ? g("[PASS]") : r("[FAIL]")) + " " + name + (detail ? " — " + detail : ""));
	}
}

// 1. package.json 结构与 dsh.bundle
const pkgRaw = readJson(join(ROOT, "package.json"));
if (pkgRaw.__parseError) {
	check("pkg.manifest", false, "package.json 解析失败: " + pkgRaw.__parseError, true);
} else {
	const bundle = pkgRaw.dsh && pkgRaw.dsh.bundle;
	const bundleOk = bundle && typeof bundle.patch === "string";
	check("pkg.manifest", bundleOk,
		bundleOk ? "dsh.bundle.patch=" + bundle.patch : "缺少 dsh.bundle.patch（只有 dsh.client 不可安装）", true);
	if (bundleOk && !existsSync(join(ROOT, bundle.patch))) {
		check("pkg.bundle-patch-exists", false, "bundle.patch 指向的文件不存在: " + bundle.patch, true);
	} else if (bundleOk) {
		check("pkg.bundle-patch-exists", true, bundle.patch);
	}

	// 2. dsh.client（仅带 UI 时需要）
	const client = pkgRaw.dsh && pkgRaw.dsh.client;
	const clientOk = client && typeof client === "object" && client.platform === "web";
	check("pkg.client", clientOk, clientOk ? "platform=web" : (client ? "platform 应为 web" : "缺少 dsh.client"), false);

	// 3. 官方包 peerDependencies + 显式预发布分支
	const peers = pkgRaw.peerDependencies && typeof pkgRaw.peerDependencies === "object" ? pkgRaw.peerDependencies : {};
	const deps = pkgRaw.dependencies && typeof pkgRaw.dependencies === "object" ? pkgRaw.dependencies : {};
	const devs = pkgRaw.devDependencies && typeof pkgRaw.devDependencies === "object" ? pkgRaw.devDependencies : {};
	const officialMissing = [];
	for (const [name, range] of Object.entries(peers)) {
		if (!OFFICIAL_SCOPES.some((s) => name.startsWith(s))) continue;
		// 显式预发布分支：要求范围在 0.x tuple 上带预发布比较符（如 >=0.1.0-rc.1）
		const hasPrereleaseBranch = /(?:>=|\^|~)\s*\d+\.\d+\.\d+-[A-Za-z0-9.-]+/.test(range) || range.includes("||");
		check("pkg.peer-deps:" + name, hasPrereleaseBranch,
			hasPrereleaseBranch ? range : "官方包 peer 范围缺少显式预发布分支（会静默排除 rc 构建）: " + range, true);
	}
	// 扫描 import，检查声明完整性
	for (const f of ["lib/index.js", "lib/client.js"]) if (existsSync(join(ROOT, f))) {
		for (const t of scanImports(join(ROOT, f))) importTargets.add(t);
	}
	const declared = new Set([...Object.keys(peers), ...Object.keys(deps), ...Object.keys(devs)]);
	const undeclared = [...importTargets].filter((t) => !declared.has(t));
	check("pkg.imports", undeclared.length === 0,
		undeclared.length === 0 ? "" : "未声明依赖: " + undeclared.join(", "), true);
}

// 4. cordis.patch.yml 结构与 id 规范
const patchPath = join(ROOT, "cordis.patch.yml");
if (!existsSync(patchPath)) {
	check("patch.format", false, "缺少 cordis.patch.yml", true);
} else {
	const text = readUtf8(patchPath);
	const ids = [...text.matchAll(/^\s*-\s+id:\s*([^\s#]+)/gm)].map((m) => m[1]);
	const hasInsert = text.includes("- insert:");
	const namesOk = /name:/m.test(text);
	const idOk = ids.length > 0 && ids.every((id) => WIRING_ID_RE.test(id));
	check("patch.format", hasInsert && namesOk && idOk,
		(hasInsert ? "" : "缺少 insert 节; ") + (namesOk ? "" : "缺少 name 行; ") + (idOk ? "id=" + ids.join(",") : "id 不合法: " + ids.join(",")), true);
	check("patch.unique-id", new Set(ids).size === ids.length, ids.length > 0 ? "id 无重复" : "无 id", false);
}

// 5. skin.json 元数据（skin-center 规则）
const skinPath = join(ROOT, "skin.json");
if (!existsSync(skinPath)) {
	check("skin.json", false, "缺少 skin.json", true);
} else {
	const skin = readJson(skinPath);
	if (skin.__parseError) {
		check("skin.json", false, "skin.json 解析失败", true);
	} else {
		const idOk = typeof skin.id === "string" && SKIN_ID_RE.test(skin.id);
		const pkgOk = typeof skin.package === "string" && NPM_PACKAGE_NAME_RE.test(skin.package);
		const wiring = skin.wiring && typeof skin.wiring === "object" ? skin.wiring : null;
		const wiringIdOk = wiring && typeof wiring.id === "string" && WIRING_ID_RE.test(wiring.id);
		check("skin.json.meta", idOk && pkgOk && wiringIdOk,
			(idOk ? "" : "id 不合法; ") + (pkgOk ? "" : "package 不合法; ") + (wiringIdOk ? "" : "wiring.id 不合法"), true);
		// bundleWired 与 profile 接线一致性（manifest bundles/dependencies 含本包 → 应 true）
		const manifestPath = join(PROFILE, "package.json");
		let wiredViaBundle = false;
		if (existsSync(manifestPath)) {
			const m = readJson(manifestPath);
			const bundles = (m.dsh && Array.isArray(m.dsh.profile && m.dsh.profile.bundles)) ? m.dsh.profile.bundles : [];
			const depNames = m.dependencies && typeof m.dependencies === "object" ? Object.keys(m.dependencies) : [];
			wiredViaBundle = bundles.includes(skin.package) || depNames.includes(skin.package);
		}
		const bundleWired = wiring && wiring.bundleWired === true;
		if (wiredViaBundle) {
			check("skin.bundleWired", bundleWired,
				bundleWired ? "profile 已按 bundle 接线且标记一致" : "profile 已按 bundle 接线，但 skin.json bundleWired=false", true);
		} else {
			check("skin.bundleWired", true, "profile 未接入（或不可读），保持仓库静态事实", false);
		}
	}
}

// 6. screenshots.json（dsh-market 截图声明，可选但推荐）
const shotsPath = join(ROOT, "screenshots.json");
if (!existsSync(shotsPath)) {
	check("screenshots.json", false, "缺失（可选推荐，市场截图用）", true);
} else {
	const shots = readJson(shotsPath);
	const list = Array.isArray(shots) ? shots : Array.isArray(shots.screenshots) ? shots.screenshots : null;
	const nOk = list !== null && list.length >= 1 && list.length <= 8;
	const pathOk = nOk && list.every((p) => typeof p === "string" && !p.startsWith("/") && !p.includes("..") && existsSync(join(ROOT, p)));
	check("screenshots.json", nOk && pathOk,
		(nOk ? "" : "需为 1-8 张; ") + (pathOk ? (list ? list.join(",") : "") : "路径不合法或文件不存在"), true);
}

// 7. 文本文件编码：UTF-8 无 BOM（Windows GBK 默认解码会乱码/报错）
const encodingIssues = [];
for (const rel of TEXT_FILES) {
	const p = join(ROOT, rel);
	if (!existsSync(p)) continue;
	const buf = readFileSync(p); // 以 Buffer 读原始字节
	const hasBom = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
	let validUtf8 = true;
	try { new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch { validUtf8 = false; }
	if (hasBom || !validUtf8) encodingIssues.push(rel + (hasBom ? "(BOM)" : "(非法UTF-8/疑似GBK)"));
}
// 若有 SKILL.md（技能文件），一并校验
const skillPath = join(ROOT, "SKILL.md");
if (existsSync(skillPath)) {
	const buf = readFileSync(skillPath);
	const hasBom = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
	let validUtf8 = true;
	try { new TextDecoder("utf-8", { fatal: true }).decode(buf); } catch { validUtf8 = false; }
	if (hasBom || !validUtf8) encodingIssues.push("SKILL.md" + (hasBom ? "(BOM)" : "(非法UTF-8/疑似GBK)"));
}
check("encoding.utf8-no-bom", encodingIssues.length === 0,
	encodingIssues.length === 0 ? "全部文本文件均为 UTF-8 无 BOM" : "编码异常: " + encodingIssues.join(", ") + "（Windows 默认 GBK 解码会乱码）", true);


// 8. 前后端符号校验一致性（公共约定两侧都要遵守）
// 比对两侧共享的符号分类/规范化正则字面量（变量名与缩进允许不同，规则必须一致）
const SHARED_SYMBOL_RULES = [
	"sh|sz|hk|us",   // tencent 前缀分类
	"(?=.*[A-Z])",   // crypto 需含大写字母
	"A-Z]{3}",       // fx 三字码/三字码（两侧同构）
	"SH|SZ|HK|US",   // 大写市场前缀规范化（normalize）
	"[A-Za-z0-9.]+"  // 市场代码字符集
];
let symbolSyncOk = false;
try {
	const idx = readUtf8(join(ROOT, "lib/index.js"));
	const cli = readUtf8(join(ROOT, "lib/client.js"));
	symbolSyncOk = SHARED_SYMBOL_RULES.every((rule) => idx.includes(rule) && cli.includes(rule));
} catch { symbolSyncOk = false; }
check("sync.symbol-rules", symbolSyncOk, symbolSyncOk ? "前后端符号分类/规范化正则一致（5 条共享规则）" : "前后端符号规则不一致（缺少共享正则）", false);

// 9. suggest key 校验统一（trim 后 min/max 一致）
let keyOk = false;
try {
	const idx = readUtf8(join(ROOT, "lib/index.js"));
	const badMixed = idx.includes("key.trim().length < 1");
	const goodUniform = idx.includes("if (key.length < 1 || key.length > 50)");
	keyOk = !badMixed && goodUniform;
} catch { keyOk = false; }
check("input.key-trim", keyOk, keyOk ? "suggest key 校验基于 trim 后的值（min/max 同源）" : "suggest key 校验混用 trim/未 trim 长度", true);

/* ---------- 汇总 ---------- */
const fails = results.filter((x) => !x.ok);
const fixables = results.filter((x) => !x.ok && x.fixable);
console.log("");
console.log("\n[汇总] 检查项 " + results.length + " 个，FAIL " + fails.length + " 个" + (FIX ? "（本次 --fix 模式）" : ""));

/* ---------- --fix 自动修复 ---------- */
if (FIX && fails.length > 0) {
	console.log("\n[修复] 开始自动修复…");
	// a. package.json 补依赖
	const pkgPath = join(ROOT, "package.json");
	const pkg = readJson(pkgPath);
	if (!pkg.__parseError) {
		let changed = false;
		// 官方包 peerDependencies（显式预发布分支）
		const peerAdd = {
			"@deepseek-ai/dsh-settings": ">=0.0.1-rc.1 <0.1.0 || >=0.1.0-rc.1 <0.2.0-0"
		};
		if (importTargets !== undefined) {
			for (const t of importTargets) {
				if (OFFICIAL_SCOPES.some((s) => t.startsWith(s)) && !(pkg.peerDependencies || {})[t]) {
					pkg.peerDependencies = pkg.peerDependencies || {};
					pkg.peerDependencies[t] = peerAdd[t] || ">=0.0.0-0 <0.2.0-0";
					changed = true;
				} else if (!OFFICIAL_SCOPES.some((s) => t.startsWith(s)) && !t.startsWith("node:") &&
					!(pkg.dependencies || {})[t] && !(pkg.devDependencies || {})[t]) {
					pkg.dependencies = pkg.dependencies || {};
					if (t === "schemastery") pkg.dependencies[t] = "^3.18.0";
					else pkg.dependencies[t] = "*";
					changed = true;
				}
			}
		}
		if (changed) {
			writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
			console.log(g("  [OK] package.json 依赖声明已补全"));
		}
	}
	// b. skin.json bundleWired → true（检测到 profile bundle 接线时）
	const skinJson = readJson(skinPath);
	if (!skinJson.__parseError && skinJson.wiring && skinJson.wiring.bundleWired === false) {
		const manifestPath = join(PROFILE, "package.json");
		let wiredViaBundle = false;
		if (existsSync(manifestPath)) {
			const m = readJson(manifestPath);
			const bundles = (m.dsh && Array.isArray(m.dsh.profile && m.dsh.profile.bundles)) ? m.dsh.profile.bundles : [];
			const depNames = m.dependencies && typeof m.dependencies === "object" ? Object.keys(m.dependencies) : [];
			wiredViaBundle = bundles.includes(skinJson.package) || depNames.includes(skinJson.package);
		}
		if (wiredViaBundle) {
			skinJson.wiring.bundleWired = true;
			writeFileSync(skinPath, JSON.stringify(skinJson, null, 2) + "\n", "utf8");
			console.log(g("  [OK] skin.json bundleWired → true"));
		}
	}
	// c. 生成 screenshots.json（assets 下有 png 时）
	if (!existsSync(shotsPath)) {
		const assetsDir = join(ROOT, "assets");
		const candidates = existsSync(assetsDir) ? readdirSync(assetsDir).filter((f) => /\.png$/i.test(f)).sort() : [];
		if (candidates.length > 0) {
			writeFileSync(shotsPath, JSON.stringify(["assets/" + candidates[0]], null, 2) + "\n", "utf8");
			console.log(g("  [OK] screenshots.json 已生成（assets/" + candidates[0] + "）"));
		} else {
			console.log(y("  [跳过] assets/ 无 png，无法生成 screenshots.json"));
		}
	}
	// d. SKILL.md 等编码问题：提示人工处理（不自动改写文件编码，避免破坏内容）
	if (encodingIssues.length > 0) {
		console.log(y("  [提示] 编码异常文件需用 utf8 无 BOM 重新保存: " + encodingIssues.join(", ")));
	}
	console.log(g("[完成] 修复结束，请重跑 check 验证"));
	process.exitCode = 0;
} else if (fails.length > 0) {
	console.log(r("\n[结果] 存在 " + fails.length + " 个未修复检查项（可修复 " + fixables.length + " 个；运行 --fix 自动修复）"));
	process.exitCode = 1;
} else {
	console.log(g("\n[结果] 全部通过 ✓"));
	process.exitCode = 0;
}