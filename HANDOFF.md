# 上线记录 · dsh-stock-terminal（股市行情皮肤+功能插件）

> 状态：**已上线本地运行**（2026-08-17），崩溃已修复，本体恢复正常。

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