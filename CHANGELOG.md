# Changelog

本仓库所有值得注意的变更都会记录在此。格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [Unreleased]

## [v1.7.2] - 2026-09-14

### 🐛 修复：未开盘（9:30 前/休市）时段 K 线图被压扁失效

- **根因**：未开盘时腾讯行情返回 `price=0/open=0`，而 K 线弹窗「今日柱合并」逻辑只校验
  `Number.isFinite()`（对 0 也放行），向 K 线尾部追加一根 `{o:0,h:0,l:0,c:0}` 全零柱，
  导致价格轴下界被拉到 0，真实 K 线被压缩成一条线
- **修复**：今日柱合并条件升级为**正值才合并**（`q.open > 0 && q.price > 0`），
  未开盘/休市时跳过，K 线保持纯历史数据；开盘后仍实时拼接今日柱
- 该缺陷 v1.7.0 即存在，与 v1.7.1 更新无关（v1.7.1 未改动任何 K 线代码）

### ✅ 验证

- 合规检查 21/21、产物自检通过、单元测试 15/15
- 宿主 kline 各源（腾讯/港股/美股/分时/报价）实测 200 真实数据

## [v1.7.1] - 2026-09-13

### 🔧 配置永久化（更新插件/换浏览器后不再需要重新配置）

- **根因**：配置此前只存浏览器 localStorage（per-origin，更新插件、换浏览器、清理站点数据即丢）；
  且客户端启动时从不回读 DSH settings 服务，系统设置里保存的值形同虚设
- **修复**：DSH settings 服务（`dsh-settings-file` → `$DSH_HOME/settings.yaml` 落盘）成为配置权威源，
  localStorage 降级为启动缓存
  - 启动时 `settingsCtrl.getSnapshot()` 回读 `refreshMs`/`showTape` 合并进 `state.settings` 并持久化
  - `settingsCtrl.subscribe()` 订阅服务变化，外部改动即时重排轮询/跑马灯
- 新增持久化回归测试断言（启动回读 + 订阅变化 + 本地缓存三要素）

### 🎨 皮肤图标替换为 dsh-manager 官网 logo

- 顶栏品牌图标 → `https://dsh.linhut.cn/assets/images/logo.png`
- 标签页 favicon → `https://dsh.linhut.cn/assets/images/favicon.png`
- `brand` 改 `createElement("img")` 挂载（符合防 XSS 基线）；移除旧 `CANDLE_SVG`/`FAVICON_SVG` 内嵌 SVG

### ✅ 验证

- 合规检查 21/21、产物自检通过、单元测试 15/15（含新增持久化测试）

## [v1.7.0] - 2026-09-11

### 🔧 客户端旧 API 清理（对齐 DSH 官方 0.1.2-rc.1+ 契约）

- `settingsCtrl.get("refreshMs"/"showTape")` → `settingsCtrl.getSnapshot()`（官方 `SettingsScope`
  只有 `getSnapshot()/subscribe()/set()/mutate()/unset()`，无 `get(field)`；修复系统设置里
  保存过的刷新间隔/跑马灯开关**读不回来**的问题——此前初始值恒为 30000/true）
- `connection.api.workspace.list({})` → `ctx.get("remote") → remote.session.list({})`
  （官方 dsh-api-session-controller 形态；`ConnectionHandle` 无 `.api`、`workspace` remote 无
  `list`——修复状态栏「工作区」计数恒显示 "--" 的问题）
- 全文件确认无 `connection.api` / `workspace.list` / `settingsCtrl.get(` 残留

### 📦 发布完整性整改

- `.gitignore` 移除 `tools/` 排除（此前 git 源安装 `prepare: node tools/verify-pack.mjs`
  因脚本不在源码包中而失败——阻断性修复）
- `cordis.patch.yml` insert `id` 改为 `ui-skin-stock`（与 `skin.json` 的 `wiring.id` 一致；
  YAML 值不带引号，符合 `ui-skin-*` 接线规范）
- 新增 `screenshots.json`（引用 `assets/screenshot.png`，dsh-market 截图声明 1-8 张相对路径约定）
- 新增 `.github/workflows/ci.yml`（Node 20/22：合规检查 + 产物自检 + 单测 +
  `npm pack --dry-run` 断言 tarball 完整性；满足 awesome-dsh-plugin 收录 Checklist 的 CI 证明）

### ✅ 验证

- 合规检查 21/21 通过；`verify-pack.mjs` 产物自检通过；单元测试 28/28 通过
- 支持 DSH：**0.1.2-rc.1 及以上**（官方最新 rc 同步跟进）

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
