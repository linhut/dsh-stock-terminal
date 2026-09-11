#!/usr/bin/env node
// (c) 2026 Jose AI (https://www.linhut.cn)
// https://github.com/linhut/dsh-stock-terminal
// Licensed under the MIT License. See the LICENSE file for details.

/**
 * verify-pack.mjs — 发布/安装前的自检脚本（作为 package.json 的 prepare/verify）。
 *
 * 为什么需要它（awesome-dsh-plugin 维护者 Checklist）：
 *   - prepare 脚本：git 源安装时自动执行，本插件是手写无构建产物（lib/ 已提交），
 *     prepare 只需证明“产物齐全、语法合法”，避免 git 安装得到残缺包。
 *   - files 白名单自检：确认 screenshots.json 引用的截图、皮肤元数据等都在发布白名单内。
 *
 * 用法：
 *   node tools/verify-pack.mjs
 *   退出码：0 = 通过；1 = 存在缺失/语法错误
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

const REQUIRED = [
	"lib/client.js",
	"lib/index.js",
	"skin.json",
	"cordis.patch.yml",
	"package.json",
	"screenshots.json",
	"assets/screenshot.png"
];

const JS_FILES = ["lib/client.js", "lib/index.js", "tools/verify-pack.mjs"];

const failures = [];

function check(name, ok, detail) {
	if (!ok) failures.push(`${name}: ${detail}`);
	console.log((ok ? "[PASS] " : "[FAIL] ") + name + (detail ? " — " + detail : ""));
}

// 1. 必备文件存在
for (const rel of REQUIRED) {
	const p = join(ROOT, rel);
	const ok = existsSync(p) && statSync(p).isFile();
	check("file:" + rel, ok, ok ? "" : "缺失");
}

// 2. JSON 清单可解析
for (const rel of ["package.json", "skin.json", "screenshots.json"]) {
	const p = join(ROOT, rel);
	if (!existsSync(p)) continue;
	try {
		const parsed = JSON.parse(readFileSync(p, "utf8"));
		check("json:" + rel, parsed !== null && typeof parsed === "object", "");
	} catch (error) {
		check("json:" + rel, false, error.message);
	}
}

// 3. JS 语法检查（node --check，零依赖）
for (const rel of JS_FILES) {
	const p = join(ROOT, rel);
	if (!existsSync(p)) continue;
	const result = spawnSync(process.execPath, ["--check", p], { encoding: "utf8" });
	check("syntax:" + rel, result.status === 0, result.status === 0 ? "" : (result.stderr || result.stdout || "").trim().split("\n")[0]);
}

// 4. screenshots.json 引用都在 files 白名单内（发布包自洽）
try {
	const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
	const shots = JSON.parse(readFileSync(join(ROOT, "screenshots.json"), "utf8"));
	const list = Array.isArray(shots) ? shots : Array.isArray(shots.screenshots) ? shots.screenshots : [];
	const files = Array.isArray(pkg.files) ? pkg.files : [];
	const missing = list.filter((p) => !files.some((f) => p === f || p.startsWith(f + "/")));
	check("pack.screenshots-covered", missing.length === 0, missing.length === 0 ? "" : "files 白名单未覆盖: " + missing.join(", "));
} catch (error) {
	check("pack.screenshots-covered", false, error.message);
}

// 5. 目录完整（assets 非空）
try {
	const assetsDir = join(ROOT, "assets");
	const entries = existsSync(assetsDir) ? readdirSync(assetsDir).filter((n) => /\.png$/i.test(n)) : [];
	check("pack.assets", entries.length > 0, entries.length > 0 ? "assets/" + entries.join(",") : "assets 下无 png");
} catch (error) {
	check("pack.assets", false, error.message);
}

console.log("");
if (failures.length > 0) {
	console.error("[结果] " + failures.length + " 个检查未通过");
	process.exit(1);
}
console.log("[结果] 全部通过 ✓（产物齐全、语法合法、发布白名单自洽）");
