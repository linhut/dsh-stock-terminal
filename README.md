# 📈 dsh-stock-terminal · 股市行情皮肤 + 功能插件

> **DSH Web GUI（DeepSeek Harness）行情皮肤与功能插件**：全局交易终端视觉 + 实时行情面板。
> 自选跑马灯、首字母模糊搜索、持仓盈亏管理，A股 / 港股 / 美股 / 指数 / 加密 / 外汇一站式盯盘。

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-DSH%20Web%20GUI-4a5568.svg)](#安装)
[![Version](https://img.shields.io/badge/version-0.1.0-orange.svg)](../../releases)

---

## ✨ 功能亮点

| 能力 | 说明 |
| --- | --- |
| 🎨 交易终端皮肤 | 顶栏 K 线品牌 + 自选芯片 + 设置入口；红涨绿跌（亮/暗双主题）；仿终端窗口外框 |
| 📢 实时行情跑马灯 | 自选列表无缝循环滚动，hover 暂停；空自选时静默展示默认指数 |
| 🧭 自选列表 | 增删 / ↑↓ 排序 / 移除；**拼音首字母 + 代码 + 名称模糊搜索联想**（如 `gzmt`→贵州茅台、`600519`、`茅台`） |
| 💼 持仓管理 | 代码 + 数量 + 成本价 → 现价 / 市值 / 浮动盈亏 / 盈亏率，底部汇总总市值 / 总盈亏 / 总盈亏率 |
| ⏱ 交易时段 | 状态栏实时显示 A股 / 港股 / 美股 盘中·午休·盘前·休市 |
| 📊 指数快照 | 上证 / 深成 / 创业板 / 恒指 / 道指 / 纳指实时快照 |
| ⚙ 双设置入口 | 状态栏「设置」按钮 + 标题栏齿轮 + 面板内「设置」页签；系统设置 → 插件配置 也可见行情配置 |
| 🗃 数据持久化 | 自选 / 持仓存浏览器 localStorage，重开不丢 |

## 📦 安装

本插件为 **DSH Web GUI 外部插件**，通过 home 层补丁单点挂载（详见 [集成方式](#-集成方式)）。

```yaml
# ~/.dsh/cordis.patch.yml（home 层，只写这一处，勿在多层重复写同一 id）
- insert:
    - id: ui-skin-stock
      name: '@linxin666/dsh-client-ui-skin-stock'
```

然后：
1. 把本仓库克隆/复制为 `~/.dsh/profiles/web/node_modules/@linxin666/dsh-client-ui-skin-stock/`；
2. **重启 `dsh web`**（新增插件 entry 需要重启生效）；
3. 刷新浏览器 → 应看到股市主题与「行情」面板按钮。

> 卸载：删掉上面那一行 insert + 重启即可，**不影响 DSH 本体**（宿主 apply 全部 try/catch，
> 模块零第三方依赖，坏也只影响自身功能）。

## 🎯 数据源与符号语法

| 语法 | 示例 | 含义 | 数据源 |
| --- | --- | --- | --- |
| `sh` + 6 位 | `sh600519` 贵州茅台 | 沪市 A 股 / 上证指数 | 腾讯行情 |
| `sz` + 6 位 | `sz000001` 平安银行 · `sz399001` 深证成指 | 深市 | 腾讯行情 |
| `hk` + 5 位 | `hk00700` 腾讯控股 · `hkHSI` 恒生指数 | 港股 / 恒指 | 腾讯行情 |
| `us` + 代码 | `usAAPL` 苹果 · `usDJI` 道指 · `usIXIC` 纳指 | 美股 / 美指 | 腾讯行情 |
| 大写组合 | `BTCUSDT` `ETHUSDT`… | 加密货币（24h） | Binance |
| `AAA/BBB` | `USD/CNY` | 外汇（美元等基准） | Frankfurter |

> 数据由**宿主端聚合代理**统一拉取（`/plugins/dsh-stock/api/quotes`，GBK 解码、超时降级），
> 浏览器零 CORS；代理不可用时自动降级为浏览器直连（与 Trading 皮肤同款逻辑）。

## 🔍 搜索联想

内置 130+ 常用品种词典，支持以下方式模糊匹配（取前 8 条）：

- **拼音首字母**：`gzmt` → 贵州茅台、`hszs` → 恒生指数、`zsyh` → 招商银行
- **代码**：`600519`、`0700`、`AAPL`、`BTC`…
- **名称**：`茅台`、`茅台`、`苹果`、`比亚迪`…（中英文子串）

键盘 ↑↓ 选择、Enter 添加、Esc 关闭。

## 📁 项目结构

```
dsh-stock-terminal/
├── lib/
│   ├── index.js      # 宿主端：行情聚合代理 /plugins/dsh-stock/api/quotes + 设置命名空间
│   └── client.js     # 浏览器端：皮肤 chrome + 行情面板（自选/持仓/设置）+ 搜索联想 + 系统设置卡
├── skin.json         # 皮肤注册元数据（id: stock，wiring: ui-skin-stock）
├── package.json      # DSH 插件包清单（dsh.client / dsh.bundle 元数据）
├── cordis.patch.yml  # 插件接线
└── README.md
```

## ⚙️ 集成方式

- 插件接线**只写一层**（home 层 `~/.dsh/cordis.patch.yml`），方便整体移除。
- ⚠️ 切勿把同一 insert 同时写进 profile patch 与 home patch —— 两层叠加会产生重复 loader
  entry id，触发 DSH fail-loud 启动保护（曾因此导致 web 无法启动，务必遵守）。
- 皮肤中心（dsh-client-ui-skin-center）可识别本皮肤（`skin.json` 位于
  `node_modules/@linxin666/` 下）；其切换皮肤时可能将本行视为 legacy 皮肤行移除，重加该行即可。
- 系统设置 → 插件配置 中的行情配置卡依赖宿主设置命名空间（`refreshMs` / `showTape`），
  与面板内「设置」页签双向同步。

## 🛠 技术要点

- 红涨绿跌配色：up `#e02e3d` / dark `#f23645`，down `#089981`，平灰；深色主题整套 CSS 变量切换。
- `Intl.DateTimeFormat` 按 Asia/Shanghai、Asia/Hong_Kong、America/New_York 实时判定交易时段。
- 数据轮询 30s（可调 15/30/60s），`ctx.effect` 一次性收回所有 DOM / 定时器。
- 客户端形态：`window.__ModuleLoader__.load({ id, factory })`，`exports.apply` + `exports.inject`。

## 🧩 标签 / Topics

`dsh-plugin` · `deepseek-harness` · `web-ui` · `skin` · `stock` · `行情` · `跑马灯` ·
`自选股` · `持仓` · `trading-terminal` · `ticker` · `longbridge-alternative`（自研实现）

## 📄 License

[Apache-2.0](LICENSE)

---

*由 linhut 维护。灵感来自 dsh-web-ui 全家桶的 Trading Terminal 皮肤，功能部分为自研自包含实现。*