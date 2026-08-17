# 上线记录 · dsh-stock-terminal（股市行情皮肤+功能插件）

> 状态：**已上线本地运行**（2026-08-17），崩溃已修复，本体恢复正常。
> **v0.2.0（2026-08-18）**：可靠性强化一轮，详见文末「可靠性强化记录」。

## 事件回顾

1. 完成插件开发（宿主行情代理 + 浏览器皮肤/自选/持仓面板），语法与 stub 冒烟测试全过。
2. 安装到 web profile，并在 **profile patch 与 home patch 两层各写了一个相同的
   `ui-skin-stock` insert** → loader 「duplicate loader entry id」→ DSH fail-loud，
   **web 无法启动**（本体崩溃，本次事故根因）。
3. 修复：移除了 profile 层重复行，只保留 home 层单行 → 本体正常启动，插件随之生效。

## 当前可用状态（已逐项验证）

| 项目 | 结果 |
| --- | --- |
| DSH web 服务（127.0.0.1:3080） | ✅ 运行中（PID 80116） |
| 主页返回 200 | ✅ |
| 启动清单含插件 client 条目 | ✅ `@linxin666/dsh-client-ui-skin-stock` |
| client bundle `/plugins/@linxin666/dsh-client-ui-skin-stock/client.js` | ✅ 200（56KB） |
| 行情代理 `/plugins/dsh-stock/api/quotes?symbols=…` | ✅ 200，沪深港美/加密/外汇全源实时 |
| 皮肤中心 active | ✅ stock |

## 追加更新（2026-08 后续迭代）

1. **搜索联想在线兜底**：宿主新增 `GET /plugins/dsh-stock/api/suggest`（新浪建议 API 代理，GBK 解码）；
   客户端词典秒出 + 300ms 防抖调 API 合并去重 —— 任意 A股/港股/美股（如 `csbm`→常山北明）可联想。
   ⚠️ 宿主路由需重启 `dsh web` 生效。
2. **设置入口升级**：系统设置侧边栏注册独立「股市行情」分区（`settings.section` 槽位，
   `label: "股市行情"`），内容含 行情设置（刷新间隔/跑马灯）+ 自选列表（搜索联想增删）
   + 持仓管理（代码/数量/成本增删更新），与面板同一份 localStorage，实时双向一致。
3. **上线发布**：GitHub public（linhut/dsh-stock-terminal）+ AtomGit + GitCode 多仓同步。

## 验证命令（可随时复跑）

```powershell
Invoke-WebRequest 'http://127.0.0.1:3080/plugins/dsh-stock/api/quotes?symbols=sh000001,sz399001,hk00700,usAAPL,usDJI,BTCUSDT,ETHUSDT,USD%2FCNY'
Invoke-WebRequest 'http://127.0.0.1:3080/plugins/@linxin666/dsh-client-ui-skin-stock/client.js'
Invoke-WebRequest 'http://127.0.0.1:3080/api/skin-center/state'
```

## 现场清理

- ✅ 已删除守护脚本与重启日志（`~/.dsh/web-restart.*`）
- ✅ profile patch 恢复为 `[]`（用户修复，保持不动）
- ✅ 插件安装副本与源码 SHA1 一致

## 注意事项（防再犯）

- 插件接线**只在 `~/.dsh/cordis.patch.yml` 写一行**，绝不两层重复。
- 卸载 = 删除该行 + 重启 `dsh web`，不影响本体。
- 皮肤中心切换皮肤可能移除该行（legacy 皮肤行识别），重加即可。
- 数据是浏览器 localStorage，重装/换浏览器不共享。

## 可靠性强化记录（v0.2.0 · 2026-08-18）

修复 + 强化（均通过 node --check 与 stub 冒烟测试，含真实上游拉取验证）：

1. **修复实 bug**：面板改刷新间隔调用 `startTimers()` 但该函数从未定义 → ReferenceError；已重构为 setTimeout 链式调度。
2. **宿主端缓存**：quotes 5s / suggest 30s TTL 缓存 + in-flight 去重（上限 128 条），并发同参数请求共享上游拉取。
3. **符号规范化**：`SH600519` 大写前缀自动转小写；外汇对含 `/` 保持原样（曾因规范化误伤 `USD/CNY`，冒烟测试抓出后修复）。
4. **跑马灯原地更新**：刷新不再重建 DOM，动画不重置跳变。
5. **轮询健壮性**：在途守卫防堆叠；页面隐藏暂停、回前台立即刷新；全源失败一次性 toast 提示并自动重试恢复。
6. **联想防竞态**：seq 计数器防旧响应覆盖新输入；移除 `window._suggestTimer` 全局泄漏。
7. **设置双向即时生效**：设置卡改动经 `dsh-stock:settings` 自定义事件即时重排面板定时器/跑马灯。
8. **字典去重**：移除 SYMBOL_DICT 3 条重复条目（601899/600809/600309）。
9. `armButton` 确认定时器纳入 dispose 清理。

冒烟测试要点（可复跑）：stub `@deepseek-ai/dsh-settings` 与 `schemastery` 后 import lib/index.js，
假 ctx 注册路由，验证 大写前缀 200 / 非法符号 400 / 跨站 403 / POST 405 / suggest 缓存与真实拉取。