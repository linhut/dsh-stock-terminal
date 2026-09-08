# Changelog

本仓库所有值得注意的变更都会记录在此。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [v1.6.0] - 2026-09-08

### 🔧 宿主 1.3（0.1.3-alpha.2）API 适配核对整改（核心）

针对官方最新版本（npm dist-tag `alpha` = 0.1.3-alpha.2，即"1.3"）逐项核对插件 API 与宿主契约，
发现并修复 3 处残留旧 API / 声明问题（此前 v1.5.0 整改未覆盖客户端侧）：

- 客户端读回系统设置改用 `settingsScope` 的 `getSnapshot()`（宿主 `SettingsScope` 只有
  `getSnapshot()/set()/unset()/mutate()/subscribe()`，**无 `get(field)`**；旧 `get()` 被 try/catch 吞掉
  导致设置卡永远读不回已保存的刷新间隔/跑马灯开关）
- 状态栏"工作区"计数从旧 `connection.api.workspace.list()` 迁移到新 `ctx.remote.session.list()`
  （`ConnectionHandle` 无 `.api`；`workspace` remote 已移除 `list`，替代为 session 域）；
  `exports.inject` 同步声明 `remote` 服务
- `dsh.client.inject` 移除已停更的 `@deepseek-ai/dsh-client-runtime`（npm 最高 0.1.1-rc.2，
  1.3 不再提供该平台模块），补上 `@deepseek-ai/dsh-api-remotes`（`remote` 服务提供方，
  两侧一致检查通过）

### ✅ 合规与工程化

- `cordis.patch.yml` 的 insert `id` 还原为短标识 `ui-skin-stock`（与 skin.json `wiring.id`、
  install-local.mjs `ENTRY_ID` 一致；官方 patch 约定 id 是短加载器标识、name 才是包名），
  修复 `patch.format` 自检 FAIL
- 合规检查映射表补充 `remote → @deepseek-ai/dsh-api-remotes`；客户端测试断言同步
- 全面验证：`node tools/verify-pack.mjs`（产物/语法/白名单）+ `node tools/check-dsh-compliance.mjs`
  （21 项全绿）+ `node --test`（形态与宿主端用例）

### 📦 安装/升级

- 本地升级：`node tools/install-local.mjs`（推荐；npm registry 已下架该包，E404，不支持 npm 安装）
- CLI 升级（若已通过 git 源安装）：`dsh plugin --profile web update @linxin666/dsh-client-ui-skin-stock`
- 支持 DSH：**0.1.2-rc.1 及以上（含 0.1.3-alpha.2）**（建议跟随 DSH 官方最新 rc 版本）

## [v1.5.0] - 2026-09-06

### 🔧 面向 DSH 新版本的兼容性整改（核心）

本版本**针对 DSH 0.1.2-rc.1+ 官方 API 变更**进行整改。旧版本插件在最新 DSH 上会因导入
已移除的 `installSettingsSection` / `settingsNamespace` 而**加载失败**，本版本彻底修复：

- 设置接入迁移到最新官方 API：`ctx.inject(["settings"])` 可选注入 + `ctx.settings.installSection(...)`
  （与 `dsh-bash-local` 等官方插件同款形态；dsh-settings ≥ 0.1.2-rc.1 已删除旧导出）
- 新增 `export const Config`（schemastery schema）：支持在 cordis.yml 中通过 `config` 字段组合配置
- 依赖迁移：`schemastery` → `@deepseek-ai/schemastery`（官方 vendored 3.18.2，与 dsh-settings 一致）
- 客户端 `require("react")` 契约补齐：`react` 声明为 `peerDependencies`（^18.2.0，skin-center 同款）
- `dsh.client.inject` 从空列表补全为运行时/语言/渲染器/设置提供方，与客户端 `exports.inject`
  （`slots` / `settingsScope`）两侧一致

### 🛡 防御式整改

- `minute` 路由补齐符号分类校验（此前唯一未校验的入口；与 `kline`/`quotes` 同源 `classifySymbol`）
- 分时点数上限 `MAX_MINUTE_POINTS = 480`（防御上游异常超大响应）
- 日志统一走 cordis `ctx.logger`（缺失时回退 console）

### ✅ 合规与工程化

- 合规检查 13 项 → **21 项**：新增 settings API 兼容性、Config 导出、react peer、client-inject 两侧一致、
  prepare 脚本、files 白名单覆盖截图、minute 符号校验、CI 存在
- 新增 `tools/verify-pack.mjs`（`prepare` / `verify` 自检：必备文件 + JSON 可解析 + `node --check` 语法 + 白名单自洽）
- 新增 `tests/`（14 个 node:test 用例：真实 `apply` → 注册路由 → 执行 handler → 断言；
  客户端 ModuleLoader 形态与防 XSS 基线）
- 新增 `.github/workflows/ci.yml`（Node 20/22：合规 + 自检 + 单测 + `npm pack --dry-run` 断言 tarball 完整性）
- `files` 白名单补齐 `assets`（修复 `screenshots.json` 引用截图不在发布包的问题）
- `tools/install-local.mjs` 拷贝清单补齐 `screenshots.json` + `assets`

### 📦 安装/升级

- 本地升级：`node tools/install-local.mjs`（推荐；npm registry 已下架该包，E404，不支持 npm 安装）
- CLI 升级（若已通过 git 源安装）：`dsh plugin --profile web update @linxin666/dsh-client-ui-skin-stock`
- 支持 DSH：**0.1.2-rc.1 及以上**（建议跟随 DSH 官方最新 rc 版本）
