// (c) 2026 Jose AI (https://www.linhut.cn)
// https://github.com/linhut/dsh-stock-terminal
// Licensed under the MIT License. See the LICENSE file for details.

// tests/client.test.js — 浏览器端（client half）形态测试：验证官方 ModuleLoader
// bundle 形态、客户端服务注入声明、以及动态文本全部走 textContent（防 XSS 基线）。

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const clientSrc = readFileSync(join(ROOT, "lib", "client.js"), "utf8");

test("客户端 bundle 采用官方 ModuleLoader 形态", () => {
	assert.match(clientSrc, /window\.__ModuleLoader__\.load\(\{/);
	assert.match(clientSrc, /id:\s*["']@linxin666\/dsh-client-ui-skin-stock["']/);
	assert.match(clientSrc, /factory:\s*\(require\)\s*=>/);
});

test("客户端声明需要的 cordis 服务（exports.inject 两侧一致）", () => {
	assert.match(clientSrc, /exports\.inject\s*=\s*\["slots",\s*"settingsScope"\]/);
});

test("客户端应用入口存在（exports.apply）", () => {
	assert.match(clientSrc, /exports\.apply\s*=\s*apply/);
});

test("动态行情/名称渲染使用 textContent（防 XSS 基线）", () => {
	// 抽取动态赋值模式：真实数据必须经 textContent 写入，而不是 innerHTML 拼接。
	// 白名单：直接字符串字面量（"⚙" 等静态图标）与全大写下划线常量
	// （CANDLE_SVG / FAVICON_SVG 等模块级静态 SVG，无插值、无用户输入）。
	const dangerous = [...clientSrc.matchAll(/\.innerHTML\s*=\s*([^;]+)/g)]
		.map((m) => m[1].trim())
		.filter((rhs) => !/^["']/.test(rhs) && !/^[A-Z][A-Z0-9_]*$/.test(rhs));
	assert.deepEqual(dangerous, [], "动态数据不得经 innerHTML 写入: " + dangerous.join("; "));
	// 数据渲染路径确实使用 textContent
	assert.match(clientSrc, /\.textContent\s*=/);
	// 静态 SVG 常量本身必须是字面量拼接（无模板插值）
	for (const ident of ["CANDLE_SVG", "FAVICON_SVG"]) {
		const def = clientSrc.match(new RegExp("const\\s+" + ident + "\\s*=\\s*\\[([^\\]]*)\\].join\\(\"\"\\)"));
		assert.ok(def !== null, ident + " 应为字面量数组 join 定义");
		assert.ok(!def[1].includes("${"), ident + " 不得含模板插值");
	}
});

test("客户端设置卡片走 slots + settingsScope（最新 UI 接线）", () => {
	assert.match(clientSrc, /slots\.inject\(\s*["']settings\.section["']/);
	assert.match(clientSrc, /settingsScope/);
	assert.match(clientSrc, /namespace:\s*["']dsh-stock["']/);
});