#!/usr/bin/env node
/**
 * install-local.mjs — 将 dsh-stock-terminal 本地安装到指定 DSH web profile。
 *
 * 为什么需要它（吸取教训 · 2026-08-19）：
 *   npm registry 上 @linxin666/dsh-client-ui-skin-stock 已被删除（E404），
 *   任何 dsh plugin add / pnpm add 都会失败；且中断的 install 会留下残缺
 *   node_modules（文件缺失但 lockfile 显示 "up to date"），是上次事故的根因。
 *   本脚本完全绕过 npm registry：直接文件拷贝 + 写入 patch，绝不触发 install。
 *
 * 用法：
 *   node tools/install-local.mjs [--profile <path>] [--dispose]
 *
 *   --profile   目标 profile 根目录，默认 ~/.dsh/profiles/web
 *   --dispose   卸载模式：移除文件与 patch 条目
 *
 * 安全特性：
 *   - 拷贝前校验本项目文件齐全
 *   - 拷贝后逐文件比对（源目录 vs 目标目录，文件名 + 字节数）
 *   - patch 写入采用幂等逻辑，重复运行不会重复
 */
import { cpSync, existsSync, mkdirSync, readFileSync, statSync, readdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(HERE, "..");

const args = process.argv.slice(2);
const arg = (name, fallback) => {
	const i = args.indexOf(name);
	return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const PROFILE = resolve(arg("--profile", join(homedir(), ".dsh", "profiles", "web")));
const DISPOSE = args.includes("--dispose");
const PKG_ID = "@linxin666/dsh-client-ui-skin-stock";
const ENTRY_ID = "ui-skin-stock";
const DEST = join(PROFILE, "node_modules", ...PKG_ID.split("/"));
const HOME_PATCH = join(homedir(), ".dsh", "cordis.patch.yml");
const REQUIRED = ["lib/client.js", "lib/index.js", "skin.json", "package.json"];

function g(s) { return "\x1b[32m" + s + "\x1b[0m"; }
function r(s) { return "\x1b[31m" + s + "\x1b[0m"; }
function y(s) { return "\x1b[33m" + s + "\x1b[0m"; }

function walk(dir, base) {
	if (!base) base = dir;
	const out = [];
	let names;
	try { names = readdirSync(dir); } catch { return out; }
	for (const name of names) {
		if (name.startsWith(".")) continue;
		const p = join(dir, name);
		const rel = p.slice(base.length + 1).replace(/\\/g, "/");
		let isDir = false;
		try { isDir = statSync(p).isDirectory(); } catch { continue; }
		if (isDir) out.push(...walk(p, base));
		else out.push({ rel, size: statSync(p).size });
	}
	return out;
}

function checkSource() {
	const missing = REQUIRED.filter((f) => !existsSync(join(SRC, f)));
	if (missing.length > 0) {
		console.error(r("[失败] 源目录不完整，缺少:"), missing.join(", "));
		process.exit(1);
	}
}

function compareDirs(label, a, b) {
	const filesA = walk(a);
	const filesB = existsSync(b) ? walk(b) : [];
	const mapB = new Map(filesB.map((f) => [f.rel, f.size]));
	let missing = 0, mismatch = 0;
	for (const f of filesA) {
		const bf = mapB.get(f.rel);
		if (bf === undefined) missing++;
		else if (bf !== f.size) mismatch++;
	}
	const same = missing === 0 && mismatch === 0;
	console.log(
		(same ? g("[OK]") : r("[差异]")) +
		" " + label + ": 源 " + filesA.length + " 个 / 目标 " + filesB.length +
		(missing > 0 ? "，缺 " + missing : "") + (mismatch > 0 ? "，大小不符 " + mismatch : "")
	);
	return same;
}

function patchInsert() {
	if (!existsSync(HOME_PATCH)) return;
	let text = readFileSync(HOME_PATCH, "utf8");
	if (text.includes(PKG_ID)) {
		console.log(y("[跳过] patch 已包含"), PKG_ID);
		return;
	}
	const block = "\n" +
		"# " + PKG_ID + " (dsh-stock-terminal) 本地安装 " + new Date().toISOString().slice(0, 10) + "\n" +
		"- insert:\n" +
		"    - id: " + ENTRY_ID + "\n" +
		"      name: '" + PKG_ID + "'";
	if (text.trim() === "[]" || text.trim() === "") {
		text = text.trim() === "[]" ? text.replace(/\[\s*\]/, block) : (text + block);
	} else {
		text = text.trimEnd() + block;
	}
	writeFileSync(HOME_PATCH, text, "utf8");
	console.log(g("[OK] 已写入 home patch"));
}

function dispose() {
	if (existsSync(DEST)) {
		rmSync(DEST, { recursive: true, force: true });
		console.log(g("[OK] 已删除安装副本"));
	}
	if (existsSync(HOME_PATCH)) {
		let text = readFileSync(HOME_PATCH, "utf8");
		// 移除包含 PKG_ID 的段落
		const lines = text.split(/\r?\n/);
		const kept = [];
		let skip = false;
		for (const line of lines) {
			if (line.includes(PKG_ID)) { skip = true; continue; }
			if (skip && line.trim().startsWith("-")) { skip = false; }
			if (!skip) kept.push(line);
		}
		writeFileSync(HOME_PATCH, kept.join("\n").trim() + "\n", "utf8");
		console.log(g("[OK] 已清理 patch"));
	}
	console.log(g("[完成] 已卸载"));
}

function main() {
	if (DISPOSE) { dispose(); return; }
	checkSource();
	if (existsSync(DEST)) {
		const COPY_ITEMS = ["lib", "skin.json", "package.json", "cordis.patch.yml"];
		const allMatch = COPY_ITEMS.every((n) => existsSync(join(DEST, n)));
		if (allMatch) {
			console.log(y("[跳过] 已有安装完整"));
			patchInsert();
			console.log(g("[完成] 已就绪，刷新浏览器"));
			return;
		}
		console.log(y("[更新] 检测到安装不完整，重新拷贝"));
	}
	mkdirSync(DEST, { recursive: true });
	for (const name of ["lib", "skin.json", "package.json", "cordis.patch.yml"]) {
		const src = join(SRC, name);
		if (existsSync(src)) cpSync(src, join(DEST, name), { recursive: true, force: true });
	}
	compareDirs("安装副本", SRC, DEST);
	patchInsert();
	console.log(g("[完成] 本地安装成功\n重启 dsh web 后刷新浏览器"));
}
main();
