# 📈 dsh-stock-terminal · 股市行情皮肤 + 功能插件

> **DSH Web GUI（DeepSeek Harness）行情皮肤与功能插件**：全局交易终端视觉 + 实时行情面板。
> 自选跑马灯、首字母模糊搜索、持仓盈亏管理，A股 / 港股 / 美股 / 指数 / 加密 / 外汇一站式盯盘。

<p align="center">
  <img src="assets/screenshot.png" alt="dsh-stock-terminal 截图" width="100%">
</p>

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-DSH%20Web%20GUI-4a5568.svg)](#安装)
[![Version](https://img.shields.io/badge/version-1.2.0-orange.svg)](./package.json)
[![awesome-dsh-plugin](https://img.shields.io/badge/awesome--dsh--plugin-PR%20%231766-8b5cf6)](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/1766)

---

## ✨ 功能亮点

| 能力 | 说明 |
| --- | --- |
| 🎨 **交易终端皮肤** | 顶栏 K 线品牌图标 + 标题 + 持仓摘要芯片 + 设置齿轮 + 仿终端窗口按钮；红涨绿跌（亮/暗双主题完整 CSS 变量切换）；自定义 K 线 favicon 和页面标题 |
| 📢 **实时行情跑马灯** | 自选列表无缝循环滚动，hover 暂停；**点击任一品种弹出个股 K 线图**（日K/周K/月K 可切换） |
| 📈 **个股 K 线弹窗** | 日K / 周K / 月K 一键切换；**鼠标滚轮缩放**（锚点缩放，20~200 根）+ **拖拽平移**查看历史/近期；**十字光标**（hover 竖线+横线 + OHLC 浮层 + 价格轴/日期轴联动标注）；蜡烛图 + MA5/MA10 均线 + 成交量幅图 + 价格/日期轴 + 网格 + 区间涨跌统计；Esc/遮罩/✕ 关闭；窗口 resize 自适应重绘；A股/港股/指数走腾讯前复权，美股腾讯不足时回退 Yahoo，加密货币走 Binance；服务端 60s 缓存 + 在途去重 |
| 🧭 **自选列表** | 增删 / ↑↓ 排序 / 移除；**拼音首字母 + 代码 + 名称模糊搜索联想**（如 `gzmt` → 贵州茅台、`600519`、`茅台`），内置 130+ 品种词典 + 在线 API 兜底，键盘 ↑↓ Enter Esc 操作 |
| 💼 **持仓管理** | 模糊搜索添加持仓（与自选同款联想体验）；代码 + 数量 + 成本价 → 现价 / 市值 / 浮动盈亏 / 盈亏率，底部汇总总市值 / 总盈亏 / 总盈亏率；编辑 / 删除持仓 |
| 🏷 **标题栏持仓摘要** | 持仓个股名称 + 涨跌幅按标题栏宽度自适应显示，超宽时自动收起为「等 N 只」+ 总盈亏芯片；窗口 resize 重新适配 |
| 📏 **伸缩条** | 拖动面板顶部伸缩条调整面板高度（替代 CSS resize 右下角把手），高度持久化到 localStorage |
| ⏱ **交易时段** | 状态栏实时显示 A股 / 港股 / 美股 盘中·午休·盘前·休市，每分钟自动刷新（`Intl.DateTimeFormat` 按 Asia/Shanghai、Asia/Hong_Kong、America/New_York 判定） |
| 📊 **指数快照** | 状态栏中部实时快照：上证 / 深成 / 创业板 / 恒指 / 道指 / 纳指 |
| 🔔 **状态栏总盈亏** | 状态栏右侧显示持仓总盈亏 / 总盈亏率，随行情实时更新 |
| ⚙ **三入口设置** | 状态栏「行情」按钮 + 标题栏齿轮 + 面板内「设置」页签；DSH 系统设置侧边栏出现独立「股市行情」分区（可管理刷新间隔 / 跑马灯开关 / 自选 / 持仓） |
| 🔄 **刷新间隔可调** | 15 / 30 / 60 秒可调（系统设置卡与面板内设置同步），页面隐藏时暂停轮询、回到前台立即刷新 |
| 🗃 **数据持久化** | 自选 / 持仓 / 面板高度 / 刷新间隔 / 跑马灯开关 全部存浏览器 localStorage，重开不丢 |
| 🌙 **亮暗双主题** | 完整跟随 DSH 深色/浅色主题，全套 CSS 变量切换，跑马灯 / K 线 / 面板 / 状态栏所有元素适配 |
| 🛡 **故障容错** | 全部数据源失败 toast 一次性提示并自动重试；代理失败自动降级浏览器直连；宿主 apply 全部 try/catch 容错，模块零第三方依赖，坏也只影响自身功能，不影响 DSH 本体 |

---

## 📦 安装

本插件为 **DSH Web GUI 外部插件**，支持以下三种安装方式。

### 方式一：CLI 一键安装（推荐 ⭐）

DSH 自带 `dsh plugin` 命令（对 pnpm 的封装），会自动完成依赖安装 + bundle 注册：

```sh
dsh plugin --profile web add github:linhut/dsh-stock-terminal
```

执行后你会看到类似输出：

```
dependencies:
+ @linxin666/dsh-client-ui-skin-stock github:linhut/dsh-stock-terminal
Done in 8.3s using pnpm v11.22.0
```

它自动做了三件事：

1. **安装依赖** → 写入 `~/.dsh/profiles/web/package.json` 的 `dependencies`
2. **注册 bundle** → 把 `@linxin666/dsh-client-ui-skin-stock` 追加进 `dsh.profile.bundles`（与 `dsh-web-ui-all`、`modlens` 同队列）
3. **文件就位** → `node_modules/@linxin666/dsh-client-ui-skin-stock/` 下 lib/skin.json/patch 齐全

然后**重启 dsh web** 使 bundle 加载生效：

```sh
# 找到当前 dsh web 进程 PID 杀掉后重新启动
# 重启命令：node E:\npm-global\node_modules\@deepseek-ai\dsh\lib\bin.js web
```

> **常见问题**
> - 提示 `allowBuilds` / `Ignored build scripts` → 把 `@linxin666/dsh-client-ui-skin-stock` 加入 `~/.dsh/profiles/web/pnpm-workspace.yaml` 的 `allowBuilds` 列表后重跑该命令
> - `dsh plugin` 命令不存在 → DSH 版本过旧，升级至 **0.1.0-rc.6 或更新**
> - 已安装过旧版本想更新 → `dsh plugin --profile web update @linxin666/dsh-client-ui-skin-stock`

### 方式二：手动安装

适合离线环境 / 二次开发调试：

**① 编辑 `~/.dsh/cordis.patch.yml`**（home 层补丁，只写这一处，勿在多层重复写同一 id）：

```yaml
- insert:
    - id: ui-skin-stock
      name: '@linxin666/dsh-client-ui-skin-stock'
```

**② 把仓库复制到 profile 的 node_modules**：

```sh
git clone https://github.com/linhut/dsh-stock-terminal.git \
  ~/.dsh/profiles/web/node_modules/@linxin666/dsh-client-ui-skin-stock
```

**③ 重启 dsh web**（见方式一的重启说明），刷新浏览器即可。

### 方式三：插件市场安装

DSH 官方插件市场（dsh-market）的插件目录来自 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 精选列表（线上 https://awesome-dsh-plugin.com/plugins.json 实时生成）。

本插件已提交收录 [PR #1766](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/1766)，合并后（通常 1 天内）即可在 **设置 → 插件市场** 搜索 `stock` 一键安装。

### 安装后

1. **重启 dsh web**（杀进程重新启动，或 Ctrl+C 后重跑启动命令）
2. **刷新浏览器**（`Ctrl+F5` 硬刷新清除缓存）
3. 应看到股市主题的标题栏，底部状态栏出现「行情」按钮
4. 点击「行情」打开面板 → 添加自选股开始使用

### 卸载

```sh
# CLI 方式安装的
dsh plugin --profile web remove @linxin666/dsh-client-ui-skin-stock

# 手动方式安装的，删除 home 补丁行
# 编辑 ~/.dsh/cordis.patch.yml，删掉 ui-skin-stock 那一块 insert，保存

# 重启 dsh web 生效
```

> 卸载**不影响 DSH 本体运行**。宿主 apply 全部 try/catch 容错，模块零第三方依赖，坏也只影响自身功能。
> 回退到旧版本：`dsh plugin --profile web install @linxin666/dsh-client-ui-skin-stock@<旧版本>` 或手动切换 git tag。

---

## 🎯 数据源与符号语法

| 语法 | 示例 | 含义 | 数据源 |
| --- | --- | --- | --- |
| `sh` + 6 位 | `sh600519` 贵州茅台 | 沪市 A 股 / 上证指数 | 腾讯行情 |
| `sz` + 6 位 | `sz000001` 平安银行 · `sz399001` 深证成指 | 深市 | 腾讯行情 |
| `hk` + 5 位 | `hk00700` 腾讯控股 · `hkHSI` 恒生指数 | 港股 / 恒指 | 腾讯行情 |
| `us` + 代码 | `usAAPL` 苹果 · `usDJI` 道指 · `usIXIC` 纳指 | 美股 / 美指 | 腾讯行情 |
| 大写组合 | `BTCUSDT` `ETHUSDT`… | 加密货币（24h） | Binance |
| `AAA/BBB` | `USD/CNY` | 外汇（美元等基准） | Frankfurter |

> 数据由**宿主端聚合代理**统一拉取（`/plugins/dsh-stock/api/quotes`，GBK 解码、超时降级），浏览器零 CORS；代理不可用时自动降级为浏览器直连。

---

## 🔍 搜索联想

支持以下方式模糊匹配（取前 8 条）：

- **拼音首字母**：`gzmt` → 贵州茅台、`csbm` → 常山北明、`zsyh` → 招商银行
- **代码**：`600519`、`000158`、`AAPL`、`BTC`…
- **名称**：`茅台`、`苹果`、`比亚迪`…（中英文子串）

内置 130+ 常用品种词典秒出结果；**词典未收录的品种自动走在线兜底**——宿主代理新浪股票建议 API（`/plugins/dsh-stock/api/suggest`，GBK 解码、300ms 防抖），任意 A股 / 港股 / 美股 / 指数输入代码、简称或拼音首字母即可联想。

键盘 ↑↓ 选择、Enter 添加、Esc 关闭。

---

## 📁 项目结构

```
dsh-stock-terminal/
├── lib/
│   ├── index.js      # 宿主端：行情聚合代理 /plugins/dsh-stock/api/quotes + /suggest + /kline
│   └── client.js     # 浏览器端：皮肤 chrome + 行情面板（自选/持仓/设置）+ K 线弹窗 + 系统设置卡
├── skin.json         # 皮肤注册元数据（id: stock，wiring: ui-skin-stock）
├── package.json      # DSH 插件包清单（dsh.client / dsh.bundle 元数据）
├── cordis.patch.yml  # 插件接线
├── assets/
│   └── screenshot.png
└── README.md
```

---

## ⚙️ 集成方式

### 两种接线机制

| 方式 | 注册位置 | 适用场景 |
|------|----------|----------|
| **profile bundle**（CLI 安装自动） | `~/.dsh/profiles/web/package.json` → `dsh.profile.bundles` | 推荐；与 `dsh-web-ui-all`、`modlens` 同队列 |
| **home patch**（手动安装） | `~/.dsh/cordis.patch.yml` → `insert` | 离线 / 二次开发 |

### ⚠️ 重要注意事项

- **切勿把同一 `insert` 同时写进 profile patch 与 home patch** —— 两层叠加会产生重复 loader entry id，触发 DSH fail-loud 启动保护（曾因此导致 web 无法启动）
- 皮肤中心（dsh-client-ui-skin-center）可识别本皮肤（`skin.json` 位于 `node_modules/@linxin666/` 下）；其切换皮肤时可能将本行视为 legacy 皮肤行移除，重加该行即可（CLI 方式装的 bundle 不受此影响）
- DSH 系统设置侧边栏出现独立「股市行情」分区 —— 可管理刷新间隔、自选列表、持仓信息，与面板内数据双向同步（同一份 localStorage 读写）

---

## 🛠 技术要点

- 红涨绿跌配色：up `#e02e3d` / dark `#f23645`，down `#089981`，平灰；深色主题整套 CSS 变量切换
- `Intl.DateTimeFormat` 按 Asia/Shanghai、Asia/Hong_Kong、America/New_York 实时判定交易时段
- 数据轮询 30s（可调 15/30/60s），`ctx.effect` 一次性收回所有 DOM / 定时器
- 客户端形态：`window.__ModuleLoader__.load({ id, factory })`，`exports.apply` + `exports.inject`
- Canvas 蜡烛图绘制：日K/周K/月K 自适应、MA5/MA10 均线、成交量幅图、网格+价格+日期轴

---

## 🛡 可靠性设计

- **宿主端短 TTL 缓存 + 在途请求去重**：quotes 5s / suggest 30s / kline 60s 缓存，并发同参数请求共享同一次上游拉取（上限 128 条防无界增长）
- **符号规范化**：`SH600519` 等大写市场前缀自动转小写（外汇对 `USD/CNY` 保持原样）
- **轮询调度**：setTimeout 链式调度（上一次完成再排下一次）+ 在途请求守卫；页面隐藏时暂停轮询，回到前台立即刷新
- **跑马灯不闪跳**：行情刷新只原地更新数字，不重建 DOM，动画位置不被重置
- **联想防竞态**：搜索建议加序号计数器，慢的旧请求不会覆盖新输入的结果
- **故障降级提示**：全部数据源失败时 toast 一次性提示并自动重试；代理失败自动降级浏览器直连
- **设置双向即时生效**：系统设置卡修改刷新间隔/跑马灯后，面板轮询与跑马灯立即重排（自定义事件同步）
- **K 线周期自适应**：服务端原生支持 day/week/month（腾讯 fqkline / Binance / Yahoo）；客户端聚合 fallback 确保不重启也能用

---

## 🧩 标签 / Topics

`dsh-plugin` · `deepseek-harness` · `web-ui` · `skin` · `stock` · `行情` · `跑马灯` ·
`自选股` · `持仓` · `K线` · `trading-terminal` · `ticker`

---

## 📄 License

[Apache-2.0](LICENSE)

---

*由 [linhut](https://github.com/linhut) 维护，已提交 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 收录。*