# dsh-stock-terminal 插件 API 与宿主适配核对报告

> 核对基准①：开发环境 `C:\Users\Administrator\.dsh\profiles\web\node_modules\@deepseek-ai` 实际安装的宿主包（0.1.2-rc.1，`dsh-client-runtime`/`dsh-host-apiproxy`/`dsh-tool-subagent-report` 为 0.1.0-rc.8）。
> 核对基准②：官方最新发布 0.1.3-alpha.2（npm dist-tag `alpha`，2026-09-07；用户所称"官方最新版本 1.3"，即 0.1.3）。通过 `npm pack @deepseek-ai/<pkg>@0.1.3-alpha.2` 下载 15 个关键包 tarball 与 0.1.2-rc.1 逐文件 diff。
> 核对方式：插件 `lib/index.js`（宿主端）与 `lib/client.js`（浏览器端）逐 API 对照宿主类型定义（`*.d.ts`）与实现。
> 生成时间：2026 会话内核对。

---

## 〇、0.1.2-rc.1 → 0.1.3-alpha.2 官方 API 变更摘要（对本插件相关）

| 包 | 0.1.3-alpha.2 变化 | 对本插件影响 |
|---|-------------------|-------------|
| dsh-settings | **零差异**（`installSection` 签名不变） | 无 ✅ |
| dsh-host-webserver | **零差异**（`register(route)` 不变） | 无 ✅ |
| dsh-client-ui-settings | **零差异**（`SettingsScope` 仍只有 getSnapshot/set/unset/mutate/subscribe，**无 get**） | 问题①依旧 |
| dsh-client-ui-renderer | **零差异**（`ctx.slots` SlotRegistry 不变） | 无 ✅ |
| dsh-client-connection | `ConnectionConfig` → `ConnectionRecoveryConfig`（仅 `start()` 参数改名）；`ConnectionHandle` 仍无 `.api` | 问题②依旧 |
| dsh-api-workspace-controller | **零差异**（`workspace` remote 仍无 `list`） | 问题②依旧 |
| dsh-api-session-controller | **零差异**（`session.list()` 仍存在） | 修复路径有效 ✅ |
| dsh-client-modules | **零差异**（`window.__ModuleLoader__.load({id, factory})` 保留） | 无 ✅ |
| dsh-cordis-client-runner | 仅新增 inspect catalog 元数据；加载/守卫逻辑一致 | 无 ✅ |
| dsh-client-locale | **零差异** | 无 ✅ |
| dsh-client-web（**新增**） | 新 web boot 内核：`__ModuleLoader__.create()` 新增、`load()` 保留 | 无 ✅ |
| dsh-client-ui-slots（**新增**） | 独立成包；`SlotCore.register(options, component)` 契约与插件用法兼容；`SlotLabel = string \| (() => string)` | 无 ✅ |
| dsh-client-store / dsh-client-ui-primitives（新增） | slots 内部依赖 / 纯 React 原子 | 无 ✅ |
| dsh / dsh-web-app | `dsh.bundle.patch` 解析契约不变 | 无 ✅ |
| **dsh-client-runtime** | **0.1.3-alpha.2 无新版**（最高 0.1.1-rc.2），不再被任何官方包依赖 | ⚠️ 见问题③ |

> 结论：0.1.3-alpha.2 对本插件无新增破坏性 API；前两轮发现的 2 个旧 API 残留问题（settingsCtrl.get、connection.api.workspace.list）在 0.1.3-alpha.2 依然存在，修复方向不变。

---

## 一、宿主端（lib/index.js）— 全部适配 ✅

| # | 插件用法 | 宿主 0.1.2-rc.1 契约 | 结论 |
|---|---------|----------------------|------|
| 1 | `export const name = "@linxin666/..."` | cordis 标准插件名 | ✅ |
| 2 | `export const inject = ["webServer"]` | cordis 4.0.2 顶层 inject 数组 | ✅ |
| 3 | `ctx.inject(["settings"], (settingsCtx) => ...)` | cordis 4.0.2 `inject(deps, callback)`（registry.d.ts:111/185） | ✅ |
| 4 | `ctx.settings.installSection(ctx, "dsh-stock", schema, config, { setSource, onChange })` | dsh-settings 0.1.2-rc.1 `installSection(owner: Context, ns, schema, entry: T, hooks: SettingsSectionHooks<T>)`（index.d.ts:228） | ✅ 签名完全匹配 |
| 5 | `ctx.webServer.register({ kind: "exact", path, handler })` | dsh-host-webserver 0.1.2-rc.1 `register(route: WebRoute)`，`WebRoute = { kind: 'exact'\|'prefix', path, handler }`（index.d.ts:33-39, 90） | ✅ |
| 6 | `ctx.effect(fn, "label")` | cordis 4.0.2 `effect(execute, label?)`（fiber.d.ts:157-159） | ✅ |
| 7 | `export const Config = z.object({...})` | cordis 插件 Config（schemastery schema） | ✅ |
| 8 | `@deepseek-ai/schemastery` 3.18.2 | 与宿主 dsh-settings 同版本 | ✅ |
| 9 | `ctx.logger.warn` + console fallback | cordis logger（有兜底） | ✅ |
| 10 | 同源护栏 / 路由 kind 取值 | 与宿主契约无冲突 | ✅ |

宿主端 v1.5.0 已按 0.1.2-rc.1 整改（CHANGELOG 第 15 行），**本次核对未发现宿主端适配问题**。

---

## 二、浏览器端（lib/client.js）— 2 处旧 API 残留 ⚠️

### 加载与注入形态 — 全部适配 ✅

| # | 插件用法 | 宿主 0.1.2-rc.1 契约 | 结论 |
|---|---------|----------------------|------|
| 1 | `window.__ModuleLoader__.load({ id, factory: (require) => ... })` | 官方模块加载形态；`dsh-cordis-client-runner` 自身也用同一入口（client.js:1） | ✅ |
| 2 | `exports.apply = apply` | runner 读取插件 `apply`（client.js:618） | ✅ |
| 3 | `exports.inject = ["slots", "settingsScope"]` | runner 读取插件 `inject`；两服务均存在 | ✅ |
| 4 | `slots` 服务 | dsh-client-ui-renderer 0.1.2-rc.1 `SlotRegistry`（`ctx.slots`） | ✅ |
| 5 | `settingsScope` 服务 | dsh-client-ui-settings 0.1.2-rc.1 `SettingsScopeBinder`（`ctx.settingsScope`） | ✅ |
| 6 | `slots.inject("settings.section", () => slots.register({...}, C))` | `settings.section` 是 `{kind:'list', scope:'root'}`（settings-general client.js:620）；官方 settings-general / settings-plugins 同款用法 | ✅ |
| 7 | `scope.bind({ namespace: "dsh-stock" })` | `SettingsScopeBinder.bind(spec: SettingsScopeSpec<T>)`，spec = `{ namespace: string; decode? }`（settings-scope.d.ts:139） | ✅ 与宿主端 installSection 的 "dsh-stock" 命名空间对应 |
| 8 | `settingsCtrl.set("refreshMs", v)` / `set("showTape", v)` | `SettingsScope.set(field, value)`（settings-contract.d.ts:77） | ✅ 写入侧可用 |
| 9 | `body[data-ds-dark-theme]` 暗色主题选择器 | `dsh-client-ui-layout` 仍定义 `DARK_ATTRIBUTE = "data-ds-dark-theme"` | ✅ |
| 10 | `dsh.client.inject` 声明的 4 个包 | runtime / locale / ui-renderer / ui-settings 均存在于宿主 | ✅ |
| 11 | `dsh.bundle.patch` / `dsh.client.platform: "web"` | dsh-web-app 仍解析 bundle patch；dsh-client-modules 仍扫描 `dsh.client` 双面声明 | ✅ |

### 适配问题 ①：`settingsCtrl.get(field)` 不存在（读不回已保存设置）

- **位置**：`lib/client.js:942-943`（`StockSettingsCard` 的 useEffect 内）
- **宿主契约**：0.1.2-rc.1 的 `SettingsScope<T>` 只有 `getSnapshot() / subscribe() / mutate() / set() / unset()`（settings-contract.d.ts:50-85），**没有 `get(field)`**
- **影响**：`state.settingsCtrl.get("refreshMs")` 抛 TypeError → 被内层 `try/catch` 吞掉 → 设置卡初始值恒为 `30000 / true`，**用户在系统设置里保存过的值读不回来**（写入侧 `set()` 正常，是单向的）
- **修复方向**：
  ```js
  const snap = state.settingsCtrl.getSnapshot();
  if (snap.status === "ready" && snap.value) {
    setRefreshMs(snap.value.refreshMs ?? 30000);
    setShowTape(snap.value.showTape ?? true);
  }
  ```
- **严重度**：中（功能静默降级，不崩溃）

### 适配问题 ②：`connection.api.workspace.list({})` 为已移除的旧 API（工作区计数失效）

- **位置**：`lib/client.js:1408, 1430`
- **宿主契约**（0.1.2-rc.1 与 0.1.3-alpha.2 相同）：
  - `ConnectionHandle` 只有 `isLoopback / generation / state / rpc / reconnect / registerGenerationSource / start`（index.d.ts:72-102），**没有 `.api`**
  - `workspace` remote namespace（`ctx.remote.workspace`）只有 `archiveSession / create / delete / follow / insertBefore / insertSessionBefore / rename`，**没有 `list`**（dsh-api-workspace-controller typert.remote-client.d.ts；0.1.3-alpha.2 与 0.1.2-rc.1 零差异）
  - `connection.api.workspace.list` 是 **0.1.0-rc.8 `dsh-host-apiproxy` 时代**的 `WorkspaceApi.list(request): RpcResponse<{ items }>`（旧 api/workspace.d.ts:42）
- **影响**：`connection.api` 为 undefined → `connection.api.workspace` 抛 TypeError → 外层 `try/catch` 吞掉 → 状态栏"工作区"计数**恒显示 "--"**（v1.5.0 整改未覆盖此残留）
- **替代 API**（0.1.2-rc.1 与 0.1.3-alpha.2 相同）：`ctx.remote.session.list(request, signal): Promise<SessionListValue>`（dsh-api-session-controller），列表展示改用 session 域：
  ```js
  // 需将 "remote" 加入 inject 声明（或 ctx.get("remote") 可选读取）
  const list = await ctx.remote.session.list({});
  if (!list.ok) return;
  wsCell.textContent = `工作区 ${list.value.items.length}`;
  ```
- **严重度**：中（状态栏一项信息静默失效，不崩溃）

> 备注：`ctx.get("connection")` 未在 `exports.inject` 中声明。宿主对未声明服务的读取有守卫（动态插件路径明确拒绝，静态 bundle 路径视加载器而定）；插件此处已有 try/catch 兜底，最坏情况即 `connection` 为 undefined → 1430 行提前 return，仍是静默降级。

### 适配问题 ③（0.1.3-alpha.2 新增）：`dsh.client.inject` 声明了 `dsh-client-runtime`，该包在 1.3 不再提供

- **位置**：`package.json` → `dsh.client.inject` 第 1 项 `"@deepseek-ai/dsh-client-runtime"`
- **事实**：npm 上 `@deepseek-ai/dsh-client-runtime` 最高版本为 0.1.1-rc.2，**0.1.3-alpha.2 无新版**，且 0.1.3-alpha.2 的任何官方包（dsh-client-web / dsh-client-modules / dsh-web-app 等）都不再依赖它——其能力被 `dsh-client-store` / `dsh-client-web` 组合取代。官方 0.1.3-alpha.2 插件（brand-official、agent-preset、settings-plugins、cordis-client-runner）的 `dsh.client.inject` **均不再声明 runtime**
- **实际影响**：**无运行影响**——`dsh-client-modules` 对 `dsh.client.inject` 只做字符串数组结构校验（不校验存在性），且插件 `client.js` 只 `require("react")` / `react/jsx-runtime`（均在 0.1.3-alpha.2 平台模块表内），从不 require dsh-client-runtime
- **建议**：从 `dsh.client.inject` 移除 `@deepseek-ai/dsh-client-runtime`（与官方 1.3 插件形态对齐），保留 locale / ui-renderer / ui-settings
- **严重度**：低（仅声明冗余；若未来插件 require 该包会解析失败）

### 适配问题 ④（独立于版本，宿主加载契约）：`cordis.patch.yml` 的 insert `id` 应为短标识而非包名

- **位置**：`cordis.patch.yml`（`id: '@linxin666/dsh-client-ui-skin-stock'`）
- **官方约定**（dsh-web-app 0.1.2-rc.1 与 0.1.3-alpha.2 的 cordis.patch.yml）：insert 行 **`id` 是短加载器标识、`name` 是 npm 包名**，例如 `- id: workspace / name: '@deepseek-ai/dsh-workspace'`、`- id: code-runtime / name: '@deepseek-ai/dsh-code-runtime-worker-thread'`
- **本项目现状**：`id` 与 `name` 都写成完整包名。宿主 loader 可接受（id 是任意 entry 标识），但与官方约定不符；项目自检 `tools/check-dsh-compliance.mjs` 的 `patch.format` 检查（`WIRING_ID_RE = /^ui-skin-[a-z0-9-]+$/`）因此 FAIL
- **建议**：改为 `- id: ui-skin-stock / name: '@linxin666/dsh-client-ui-skin-stock'`——`ui-skin-stock` 恰好与 `skin.json` 的 `wiring.id` 一致；改后合规检查通过，且 `dsh-client-modules` 的 client 路由 `/plugins/<entry.id>/client.js` 随构建自动同步
- **严重度**：低（不影响 0.1.2-rc.1 / 0.1.3-alpha.2 加载，但自检 FAIL）

---

## 三、适配度总评

| 维度 | 0.1.2-rc.1 | 0.1.3-alpha.2 | 说明 |
|------|-----------|---------------|------|
| 宿主端 API | **100%** | **100%** | 关键包逐文件 diff 零差异（settings / webserver），v1.5.0 已整改到位 |
| 客户端加载/注入形态 | **100%** | **100%** | `__ModuleLoader__.load` 保留（官方 14 个包同形态）；slots / settingsScope / 暗色属性 / settings.section 全兼容 |
| 客户端业务 API | **约 85%** | **约 85%** | 相同的 2 处旧 API 残留（settingsCtrl.get、connection.api.workspace.list），均为"静默降级不崩溃"型 |
| 打包/声明层面 | 基本达标 | **有 2 处建议清理** | ③client.inject 声明已停更的 dsh-client-runtime（无运行影响）；④patch insert id 用包名不符官方短 id 约定（自检 FAIL） |
| 整体 | **高** | **高** | 插件在 0.1.2-rc.1 与 0.1.3-alpha.2 均可正常加载运行；0.1.3 无新增破坏性 API |

## 四、建议处置

1. `settingsCtrl.get()` → 改 `getSnapshot()`（改动小，收益明确；两个版本均需）
2. `connection.api.workspace.list()` → 改 `ctx.remote.session.list()` 或在未配置 remote 时移除工作区计数（保守做法：直接隐藏该单元格，避免显示恒 "--"；两个版本均需）
3. `package.json` 的 `dsh.client.inject` 移除 `@deepseek-ai/dsh-client-runtime`（对齐官方 0.1.3-alpha.2 插件形态；无运行影响，但避免语义歧义）
4. `cordis.patch.yml` 的 insert id 改为 `ui-skin-stock`（name 保持包名），与 `skin.json` wiring.id 一致，同时消除 `patch.format` 自检 FAIL
5. 建议补一条客户端测试断言：源码不得再出现 `.api.workspace` / `settingsCtrl.get(`（防止旧 API 回归）
