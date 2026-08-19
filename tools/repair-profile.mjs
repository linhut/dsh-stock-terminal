#!/usr/bin/env node
// (c) 2026 Jose AI (https://www.linhut.cn)
// https://github.com/linhut/dsh-stock-terminal
// Licensed under the MIT License. See the LICENSE file for details.

/**
 * repair-profile.mjs — 校验并修复 DSH profile node_modules 残缺。
 *
 * 背景（吸取教训 · 2026-08-19）：
 *   pnpm/npm install 被中断可能留下残缺依赖树：文件缺失但 install/--offline
 *   显示 "up to date"，仅凭 install 状态无法判断完整性。本次事故 105 个包
 *   文件残缺（@deepseek-ai 47 个 + 其他 58 个），逐个报 ERR_MODULE_NOT_FOUND。
 *
 * 校验法（经验沉淀）：对比 profile 与全局同名包的文件数。
 *   文件数少于全局 → 残缺。修复法：从全局副本整体覆盖，比重装更可靠更快。
 *
 * 用法：
 *   node tools/repair-profile.mjs [--profile <path>] [--repair] [--list]
 *
 *   --profile  目标 profile，默认 ~/.dsh/profiles/web
 *   --repair   对残缺包执行修复（从全局 @deepseek-ai/dsh/node_modules 覆盖拷贝）
 *   --list     列出全部对比结果（默认只输出异常项与汇总）
 *   --dry      仅报告不落地（默认）
 */
import { existsSync, readdirSync, statSync, cpSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const arg = (name, fallback) => {
	const i = args.indexOf(name);
	return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : fallback;
};
const PROFILE = resolve(arg("--profile", join(homedir(), ".dsh", "profiles", "web")));
const REPAIR = args.includes("--repair");
const LIST = args.includes("--list");
// 全局完整副本：dsh 自身 node_modules（本次修复的成功来源）
const GLOBAL = process.env.DSH_GLOBAL || join(process.env.APPDATA ? process.cwd() : "", "");

function g(s) { return "\x1b[32m" + s + "\x1b[0m"; }
function r(s) { return "\x1b[31m" + s + "\x1b[0m"; }
function y(s) { return "\x1b[33m" + s + "\x1b[0m"; }

/** 统计目录下文件数（递归）。 */
function fileCount(dir) {
	if (!existsSync(dir)) return -1;
	let n = 0;
	let names;
	try { names = readdirSync(dir); } catch { return n; }
	for (const name of names) {
		if (name.startsWith(".")) continue;
		const p = join(dir, name);
		let isDir = false;
		try { isDir = statSync(p).isDirectory(); } catch { continue; }
		if (isDir) n += fileCount(p);
		else n += 1;
	}
	return n;
}

function main() {
	// 定位全局副本
	const candidates = [
		// E: 盘全局安装（npm-global 目录）
		"E:/npm-global/node_modules/@deepseek-ai/dsh/node_modules",
		"E:/npm-global/node_modules",
		// 备用：从 APPDATA 向上回溯
		process.env.APPDATA ? join(process.env.APPDATA, "..", "..", "npm-global", "node_modules", "@deepseek-ai", "dsh", "node_modules") : "",
		process.env.APPDATA ? join(process.env.APPDATA, "..", "..", "npm-global", "node_modules") : "",
	].filter(Boolean);

	const globalRoot = candidates.find((c) => existsSync(c));
	if (!globalRoot) {
		console.error(r("[失败] 未找到全局 node_modules，请设置 DSH_GLOBAL 环境变量指定"));
		process.exit(1);
	}
	console.log(y("[基准] 全局副本:"), globalRoot);

	const profileNM = join(PROFILE, "node_modules");
	if (!existsSync(profileNM)) {
		console.error(r("[失败] profile node_modules 不存在:"), profileNM);
		process.exit(1);
	}

	// 收集 profile 顶层包（含 scoped）
	const profDirs = [];
	for (const name of readdirSync(profileNM)) {
		if (name.startsWith(".")) continue;
		const p = join(profileNM, name);
		if (!statSync(p).isDirectory()) continue;
		if (name.startsWith("@")) {
			for (const sub of readdirSync(p)) {
				if (sub.startsWith(".")) continue;
				const sp = join(p, sub);
				if (statSync(sp).isDirectory()) profDirs.push({ name: name + "/" + sub, dir: sp });
			}
		} else {
			profDirs.push({ name, dir: p });
		}
	}

	const anomalies = [];
	let repairable = 0;
	const rows = [];
	for (const { name, dir } of profDirs) {
		// 查找全局同名包
		const globalPkg = join(globalRoot, name);
		const pc = fileCount(dir), gc = fileCount(globalPkg);
		const status = pc === -1 ? "orphan" : gc === -1 ? "global-missing" : pc < gc ? "broken" : pc > gc ? "extra" : "ok";
		if (LIST || status !== "ok") {
			rows.push({ name, pc, gc, status });
		}
		if (status === "broken" || status === "global-missing") {
			anomalies.push({ name, dir, globalPkg, pc, gc });
			if (status === "broken") repairable++;
		}
	}

	rows.sort((a, b) => a.name.localeCompare(b.name));
	for (const row of rows) {
		const color = row.status === "ok" ? g : row.status === "broken" ? r : row.status === "global-missing" ? y : y;
		console.log(color("[" + row.status.padEnd(13) + "]") + " " + row.name.padEnd(50) + " profile=" + (row.pc === -1 ? "n/a" : row.pc) + " global=" + (row.gc === -1 ? "n/a" : row.gc));
	}
	console.log("\n[汇总] profile 顶层包 " + profDirs.length + " 个，异常 " + anomalies.length + " 个（可修复 " + repairable + " 个）");

	// 修复
	if (REPAIR && anomalies.length > 0) {
		console.log("\n[修复] 开始从全局覆盖拷贝残缺包…");
		for (const a of anomalies) {
			if (!existsSync(a.globalPkg)) {
				console.log(y("  [跳过] 全局无此包:"), a.name);
				continue;
			}
			try {
				// 删除残缺目录后整体覆盖
				rmSync(a.dir, { recursive: true, force: true });
				mkdirSync(join(a.dir, ".."), { recursive: true });
				cpSync(a.globalPkg, a.dir, { recursive: true, force: true });
				const after = fileCount(a.dir);
				console.log(g("  [OK] 已修复 ") + a.name + " (" + a.pc + " → " + after + " 文件)");
			} catch (e) {
				console.log(r("  [失败] ") + a.name + ": " + e.message);
			}
		}
		console.log(g("[完成] 修复结束，请重启 dsh web 验证"));
	} else if (REPAIR) {
		console.log(g("[完成] 无异常，无需修复"));
	}
}
main();
