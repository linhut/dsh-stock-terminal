// dsh-stock-terminal · 浏览器端 (client half)
// 股市行情皮肤 + 功能面板：
//   - 皮肤 chrome：顶栏（品牌 + 自选摘要芯片 + 设置齿轮）、自选跑马灯、状态栏（交易时段/指数快照/持仓盈亏）
//   - 功能面板：自选列表（增删/排序/模糊搜索联想）、持仓（数量/成本/盈亏）、设置；数据持久化到 localStorage
//   - 系统设置卡：在 DSH 设置 → 插件配置中显示行情配置入口
//   - 行情数据优先走宿主代理 /plugins/dsh-stock/api/quotes，失败则浏览器直连降级
// 加载形态与 dsh-client-ui-skin-trading 一致：window.__ModuleLoader__.load({...})。

window.__ModuleLoader__.load({
	id: "@linxin666/dsh-client-ui-skin-stock",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		// 引入 React 供系统设置卡使用
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region \0dsh-css:src/client/stock.module.css
		const css = [
			`body[data-dsh-stock]{--dsw-font-family:"PingFang SC","Hiragino Sans GB","Microsoft YaHei","WenQuanYi Micro Hei","Segoe UI",sans-serif;--ds-font-family-code:"SFMono-Regular","Menlo","Consolas","Liberation Mono",monospace;--stk-desktop:#eef1f5;--stk-panel:#fff;--stk-titlebar-bg:linear-gradient(180deg,#fff,#f2f5f8);--stk-tape-bg:#fff;--stk-statusbar-bg:#f2f5f8;--stk-text:#1b2431;--stk-dim:#6b7788;--stk-border:#d4dce5;--stk-up:#e02e3d;--stk-down:#089981;--stk-flat:#8b96a5;--stk-warn:#c08a35;--stk-brand:#e02e3d;--stk-head:#f6f8fa;--stk-hover:#eef1f5;--stk-input:#fff;--stk-row-alt:#fafbfc;color:#1b2431;box-sizing:border-box;background-color:#eef1f5;padding:66px 10px 26px}`,
			`body[data-dsh-stock][data-ds-dark-theme]{--stk-desktop:#0a0e15;--stk-panel:#10151d;--stk-titlebar-bg:linear-gradient(180deg,#161d27,#10151d);--stk-tape-bg:#0e131b;--stk-statusbar-bg:#0e131b;--stk-text:#dbe2ec;--stk-dim:#7c8897;--stk-border:#222b39;--stk-up:#f23645;--stk-down:#089981;--stk-flat:#5f6b7a;--stk-warn:#d69a3a;--stk-brand:#f23645;--stk-head:#151b25;--stk-hover:#1a222e;--stk-input:#151b25;--stk-row-alt:#131a23;color:#dbe2ec;background-color:#0a0e15}`,
			`body[data-dsh-stock] [id=root]{box-sizing:border-box;background:var(--stk-panel);border:1px solid var(--stk-border);box-shadow:0 1px #fff,0 3px 12px #17202d1f}`,
			`body[data-dsh-stock][data-ds-dark-theme] [id=root]{border-color:#232c3a;box-shadow:0 1px #0a0e15,0 3px 12px #00000080}`,
			`body[data-dsh-stock] *{border-radius:3px!important}`,
			`body[data-dsh-stock] ::-webkit-scrollbar{width:10px;height:10px}body[data-dsh-stock] ::-webkit-scrollbar-track{background:0 0}body[data-dsh-stock] ::-webkit-scrollbar-thumb{background:var(--stk-border);background-clip:content-box;border:2px solid #0000;border-radius:5px}`,
			// ---- titlebar ----
			`.dsh-stk-titlebar{z-index:1000000;background:var(--stk-titlebar-bg);border-bottom:1px solid var(--stk-border);height:34px;color:var(--stk-text);font:600 13px/34px var(--dsw-font-family);user-select:none;align-items:center;gap:6px;padding:0 8px;display:flex;position:fixed;top:0;left:0;right:0}`,
			`.dsh-stk-titlebarIcon{background:var(--stk-brand);border-radius:5px;justify-content:center;align-items:center;width:20px;height:20px;display:inline-flex;box-shadow:inset 0 1px #ffffff40}.dsh-stk-titlebarIcon svg{width:14px;height:14px;display:block}`,
			`.dsh-stk-titlebarTitle{color:var(--stk-text);letter-spacing:.02em;white-space:nowrap}`,
			`.dsh-stk-titlebarChips{align-items:center;gap:14px;margin-left:auto;display:inline-flex;overflow:hidden}`,
			`.dsh-stk-chip{font:500 12px/1 var(--ds-font-family-code);font-variant-numeric:tabular-nums;white-space:nowrap;align-items:baseline;gap:5px;display:inline-flex}.dsh-stk-chipName{color:var(--stk-dim)}.dsh-stk-chipVal{color:var(--stk-text);font-weight:600}.dsh-stk-chipChg[data-trend=up]{color:var(--stk-up);font-weight:600}.dsh-stk-chipChg[data-trend=down]{color:var(--stk-down);font-weight:600}.dsh-stk-chipChg:not([data-trend]){color:var(--stk-flat)}.dsh-stk-posChip{font:500 12px/1 var(--ds-font-family-code);font-variant-numeric:tabular-nums;white-space:nowrap;align-items:center;gap:8px;margin-left:auto;padding-left:8px;border-left:1px solid var(--stk-border);display:flex;flex:0 1 auto;min-width:0;overflow:hidden}.dsh-stk-posChip .posItem{display:inline-flex;align-items:baseline;gap:3px}.dsh-stk-posChip .posItem[data-trend=up]{color:var(--stk-up)}.dsh-stk-posChip .posItem[data-trend=down]{color:var(--stk-down)}.dsh-stk-posChip .posItem:not([data-trend]){color:var(--stk-flat)}.dsh-stk-posChip .posItem .posSym{color:var(--stk-dim);font-size:11px}.dsh-stk-posChip[data-trend=up]{color:var(--stk-up)}.dsh-stk-posChip[data-trend=down]{color:var(--stk-down)}.dsh-stk-posChip:not([data-trend]){color:var(--stk-flat)}`,
			`.dsh-stk-titlebarBtn{text-align:center;width:26px;color:var(--stk-dim);border-radius:4px;border:0;background:0 0;cursor:pointer;font-size:14px;display:inline-flex;align-items:center;justify-content:center;height:26px;padding:0}.dsh-stk-titlebarBtn:hover{background:var(--stk-hover);color:var(--stk-text)}`,
			// ---- tape ----
			`.dsh-stk-tape{z-index:999999;background:var(--stk-tape-bg);border-bottom:1px solid var(--stk-border);user-select:none;height:30px;position:fixed;top:34px;left:0;right:0;overflow:hidden}`,
			`.dsh-stk-tapeTrack{white-space:nowrap;will-change:transform;align-items:center;height:100%;animation:60s linear infinite dsh-stk-tapeMove;display:inline-flex}`,
			`.dsh-stk-tape:hover .dsh-stk-tapeTrack{animation-play-state:paused}`,
			`.dsh-stk-tapeItem{border-right:1px solid var(--stk-border);height:100%;font:500 12px/30px var(--ds-font-family-code);font-variant-numeric:tabular-nums;align-items:baseline;gap:6px;padding:0 16px;display:inline-flex;cursor:pointer}.dsh-stk-tapeItem:hover{background:var(--stk-hover)}`,
			`.dsh-stk-tapeName{color:var(--stk-dim);white-space:nowrap}.dsh-stk-tapePrice{color:var(--stk-text);font-weight:600}`,
			`.dsh-stk-tapeChg[data-trend=up]{color:var(--stk-up);font-weight:600}.dsh-stk-tapeChg[data-trend=down]{color:var(--stk-down);font-weight:600}.dsh-stk-tapeChg:not([data-trend]){color:var(--stk-flat)}`,
			`@keyframes dsh-stk-tapeMove{0%{transform:translate(0)}to{transform:translate(-50%)}}@media (prefers-reduced-motion:reduce){.dsh-stk-tapeTrack{animation:none}}`,
			// ---- statusbar ----
			`.dsh-stk-statusbar{z-index:1000000;background:var(--stk-statusbar-bg);border-top:1px solid var(--stk-border);height:26px;color:var(--stk-dim);font:500 12px/26px var(--ds-font-family-code);font-variant-numeric:tabular-nums;user-select:none;white-space:nowrap;align-items:center;gap:14px;padding:0 10px;display:flex;position:fixed;bottom:0;left:0;right:0;overflow:hidden}`,
			`.dsh-stk-statusbarGroup{align-items:center;gap:12px;display:inline-flex}.dsh-stk-statusbarSpacer{flex:1}`,
			`.dsh-stk-statusbarCell{color:var(--stk-dim);align-items:baseline;gap:4px;display:inline-flex}.dsh-stk-statusbarCell[data-phase=trading]{color:var(--stk-up)}.dsh-stk-statusbarCell[data-phase=lunch],.dsh-stk-statusbarCell[data-phase=pre]{color:var(--stk-warn)}.dsh-stk-statusbarCell[data-trend=up]{color:var(--stk-up)}.dsh-stk-statusbarCell[data-trend=down]{color:var(--stk-down)}`,
			`.dsh-stk-statusbarLabel{color:var(--stk-brand);font-weight:600}`,
			`.dsh-stk-statusbarBtn{cursor:pointer;border:1px solid var(--stk-border);color:var(--stk-text);background:var(--stk-hover);font:500 12px/20px var(--ds-font-family-code);padding:0 10px;border-radius:4px;user-select:none}.dsh-stk-statusbarBtn:hover{color:var(--stk-brand);border-color:var(--stk-brand)}`,
			// ---- panel (bigger, resizable) ----
			`.dsh-stk-panel{z-index:1000002;position:fixed;right:12px;bottom:38px;width:min(600px,calc(100vw - 24px));height:75vh;max-height:calc(100vh - 150px);min-width:400px;min-height:260px;overflow:hidden;display:flex;flex-direction:column;background:var(--stk-panel);border:1px solid var(--stk-border);box-shadow:0 8px 30px #17202d33;color:var(--stk-text);font:400 13px/1.5 var(--dsw-font-family)}`,
			`.dsh-stk-panel[hidden]{display:none}`,
				`.dsh-stk-dragbar{flex:none;height:5px;cursor:ns-resize;background:var(--stk-border);user-select:none;position:relative}.dsh-stk-dragbar:after{content:'';position:absolute;left:50%;top:1px;width:30px;height:3px;border-radius:2px;background:var(--stk-dim);transform:translateX(-50%);opacity:.5}.dsh-stk-dragbar:hover:after{opacity:1}.dsh-stk-dragbar[data-dragging]{background:var(--stk-brand)}.dsh-stk-dragbar[data-dragging]:after{background:#fff;opacity:1}`,
			`.dsh-stk-panelHead{flex:none;background:var(--stk-head);border-bottom:1px solid var(--stk-border);align-items:center;gap:8px;padding:6px 8px;display:flex;user-select:none}`,
			`.dsh-stk-panelTitle{font-weight:600;font-size:13px;color:var(--stk-text)}`,
			`.dsh-stk-tabs{flex-direction:row;align-items:center;gap:4px;margin-left:auto;display:flex}`,
			`.dsh-stk-tab{border:1px solid transparent;background:0 0;color:var(--stk-dim);font:500 12px/1 var(--dsw-font-family);cursor:pointer;padding:4px 10px;border-radius:4px}.dsh-stk-tab:hover{color:var(--stk-text);background:var(--stk-hover)}.dsh-stk-tab[aria-selected=true]{color:var(--stk-brand);border-color:var(--stk-brand);background:var(--stk-hover)}`,
			`.dsh-stk-panelClose{cursor:pointer;border:0;background:0 0;color:var(--stk-dim);font-size:15px;padding:2px 6px}.dsh-stk-panelClose:hover{color:var(--stk-up)}`,
			`.dsh-stk-panelBody{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain}`,
			`.dsh-stk-section{padding:10px}.dsh-stk-section[hidden]{display:none}`,
			// ---- panel bits ----
			`.dsh-stk-addrow{position:relative;display:flex;gap:6px;margin-bottom:8px}.dsh-stk-addinput{flex:1;min-width:0;border:1px solid var(--stk-border);background:var(--stk-input);color:var(--stk-text);font:400 13px var(--dsw-font-family);padding:5px 8px}.dsh-stk-addinput:focus{outline:none;border-color:var(--stk-brand)}`,
			`.dsh-stk-btn{border:1px solid var(--stk-border);background:var(--stk-hover);color:var(--stk-text);font:500 12px var(--dsw-font-family);cursor:pointer;padding:5px 12px;white-space:nowrap}.dsh-stk-btn:hover{border-color:var(--stk-brand);color:var(--stk-brand)}.dsh-stk-btn[data-armed]{border-color:var(--stk-up);color:var(--stk-up);font-weight:600}`,
			`.dsh-stk-btnPrimary{border:1px solid var(--stk-brand);background:var(--stk-brand);color:#fff}.dsh-stk-btnPrimary:hover{border-color:var(--stk-up);color:#fff;opacity:.9}`,
			`.dsh-stk-btnDanger{border:1px solid transparent;background:0 0;color:var(--stk-dim);cursor:pointer;font:500 12px var(--dsw-font-family);padding:3px 6px}.dsh-stk-btnDanger:hover{color:var(--stk-up)}`,
			`.dsh-stk-hint{color:var(--stk-dim);margin:8px 0 0;font-size:11px;line-height:1.6}`,
			`.dsh-stk-empty{color:var(--stk-dim);margin:12px 0;font-size:12px;text-align:center}`,
			// autocomplete dropdown
			`.dsh-stk-autocomplete{position:absolute;left:0;right:0;top:100%;z-index:1000004;background:var(--stk-panel);border:1px solid var(--stk-border);box-shadow:0 4px 12px #17202d33;max-height:300px;overflow-y:auto;display:none}.dsh-stk-autocomplete.open{display:block}`,
			`.dsh-stk-acItem{padding:6px 8px;cursor:pointer;display:flex;gap:6px;align-items:center;font-size:12px}.dsh-stk-acItem:hover,.dsh-stk-acItem[aria-selected=true]{background:var(--stk-hover)}.dsh-stk-acItem .acSym{color:var(--stk-dim);font-size:11px;white-space:nowrap}.dsh-stk-acItem .acCode{color:var(--stk-text);font-weight:500;white-space:nowrap}.dsh-stk-acItem .acName{flex:1;min-width:0;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.dsh-stk-acItem .acMarket{color:var(--stk-dim);font-size:10px;padding:1px 4px;border:1px solid var(--stk-border);border-radius:3px;white-space:nowrap}`,
			// watchlist rows
			`.dsh-stk-wlList{flex-direction:column;display:flex}.dsh-stk-wlRow{align-items:center;gap:6px;padding:5px 6px;border-bottom:1px solid var(--stk-border);display:flex}.dsh-stk-wlRow:hover{background:var(--stk-hover)}`,
			`.dsh-stk-wlName{flex:1 1 auto;min-width:0;font-weight:500;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.dsh-stk-wlSym{color:var(--stk-dim);font-size:11px;white-space:nowrap}`,
			`.dsh-stk-wlPrice{font:600 13px var(--ds-font-family-code);font-variant-numeric:tabular-nums;white-space:nowrap;min-width:64px;text-align:right}`,
			`.dsh-stk-wlChg{font:600 12px var(--ds-font-family-code);font-variant-numeric:tabular-nums;white-space:nowrap;min-width:64px;text-align:right}`,
			`.dsh-stk-wlChg[data-trend=up]{color:var(--stk-up)}.dsh-stk-wlChg[data-trend=down]{color:var(--stk-down)}.dsh-stk-wlChg:not([data-trend]){color:var(--stk-flat)}`,
			`.dsh-stk-rowbtn{flex:none;width:24px;height:24px;border:1px solid var(--stk-border);background:0 0;color:var(--stk-dim);cursor:pointer;font-size:12px;padding:0}.dsh-stk-rowbtn:hover{color:var(--stk-text);border-color:var(--stk-text)}.dsh-stk-rowbtn.danger:hover{color:var(--stk-up);border-color:var(--stk-up)}`,
			// positions
			`.dsh-stk-posToolbar{display:flex;gap:8px;margin-bottom:8px;align-items:center}`,
			`.dsh-stk-posform{flex-direction:column;gap:6px;border:1px dashed var(--stk-border);padding:8px;margin-bottom:8px;display:flex}.dsh-stk-posform[hidden]{display:none}`,
			`.dsh-stk-formrow{display:flex;gap:6px;align-items:center;position:relative}.dsh-stk-formrow label{color:var(--stk-dim);font-size:12px;flex:none;width:44px}.dsh-stk-formrow input{flex:1;min-width:0;border:1px solid var(--stk-border);background:var(--stk-input);color:var(--stk-text);font:400 13px var(--dsw-font-family);padding:4px 6px;font-variant-numeric:tabular-nums}`,
			`.dsh-stk-posTable{width:100%;border-collapse:collapse;font:400 12px/1.5 var(--dsw-font-family);font-variant-numeric:tabular-nums}.dsh-stk-posTable th{color:var(--stk-dim);font-weight:500;text-align:right;padding:4px 6px;border-bottom:1px solid var(--stk-border);white-space:nowrap}.dsh-stk-posTable th:first-child{text-align:left}.dsh-stk-posTable td{padding:4px 6px;border-bottom:1px solid var(--stk-border);text-align:right;white-space:nowrap}.dsh-stk-posTable td:first-child{text-align:left}.dsh-stk-posTable tr:nth-child(even){background:var(--stk-row-alt)}`,
			`.dsh-stk-posName{font-weight:500}.dsh-stk-posSym{color:var(--stk-dim);font-size:11px}`,
			`.dsh-stk-trend[data-trend=up]{color:var(--stk-up)}.dsh-stk-trend[data-trend=down]{color:var(--stk-down)}.dsh-stk-trend:not([data-trend]){color:var(--stk-flat)}`,
			`.dsh-stk-posSummary{margin-top:8px;padding-top:6px;border-top:1px solid var(--stk-border);display:flex;gap:14px;flex-wrap:wrap;color:var(--stk-text);font-weight:500}`,
			`.dsh-stk-posSummary .dsh-stk-dim{color:var(--stk-dim);font-weight:400}`,
			// settings
			`.dsh-stk-setrow{display:flex;align-items:center;gap:10px;margin-bottom:10px}.dsh-stk-setrow label{color:var(--stk-text);font-size:13px}.dsh-stk-setrow select{border:1px solid var(--stk-border);background:var(--stk-input);color:var(--stk-text);font:400 13px var(--dsw-font-family);padding:4px 6px}`,
			`.dsh-stk-note{color:var(--stk-dim);margin:10px 0;font-size:11px;line-height:1.7;border:1px solid var(--stk-border);padding:8px;background:var(--stk-hover)}`,
			`.dsh-stk-danger-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}`,
		// stock popup (K线弹窗)
		`.dsh-stk-modal{z-index:1000005;position:fixed;inset:0;background:#17202d99;display:flex;align-items:center;justify-content:center;padding:24px}`,
		`.dsh-stk-modalCard{width:min(720px,calc(100vw - 48px));max-height:calc(100vh - 96px);display:flex;flex-direction:column;background:var(--stk-panel);border:1px solid var(--stk-border);box-shadow:0 12px 40px #17202d55;color:var(--stk-text);font:400 13px/1.5 var(--dsw-font-family)}`,
		`.dsh-stk-modalHead{flex:none;display:flex;align-items:baseline;gap:10px;padding:10px 12px;border-bottom:1px solid var(--stk-border);user-select:none;flex-wrap:wrap}`,
		`.dsh-stk-modalName{font-weight:600;font-size:15px;white-space:nowrap}`,
		`.dsh-stk-modalSym{color:var(--stk-dim);font:500 11px var(--ds-font-family-code);white-space:nowrap}`,
		`.dsh-stk-modalQuote{margin-left:auto;display:inline-flex;align-items:baseline;gap:8px;font:600 13px var(--ds-font-family-code);font-variant-numeric:tabular-nums;white-space:nowrap}
		.dsh-stk-modalPeriods{display:inline-flex;gap:2px;margin-left:4px;font:500 12px/1 var(--dsw-font-family)}
		.dsh-stk-modalPeriods button{padding:2px 8px;border:1px solid transparent;border-radius:4px;background:transparent;color:var(--stk-dim);cursor:pointer;font:inherit;white-space:nowrap}
		.dsh-stk-modalPeriods button:hover{color:var(--stk-text);background:var(--stk-hover)}
		.dsh-stk-modalPeriods button[data-active]{color:var(--stk-brand);border-color:var(--stk-brand);background:var(--stk-hover)}`,
		`.dsh-stk-modalQuote [data-trend=up]{color:var(--stk-up)}.dsh-stk-modalQuote [data-trend=down]{color:var(--stk-down)}.dsh-stk-modalQuote [data-trend=flat],.dsh-stk-modalQuote [data-trend=""]{color:var(--stk-flat)}`,
		`.dsh-stk-modalClose{flex:none;cursor:pointer;border:0;background:0 0;color:var(--stk-dim);font-size:16px;line-height:1;padding:2px 6px}.dsh-stk-modalClose:hover{color:var(--stk-up)}`,
		`.dsh-stk-modalBody{flex:1;min-height:0;position:relative}`,
		`.dsh-stk-modalBody canvas{display:block;width:100%;height:340px}`,
		`.dsh-stk-modalMsg{position:absolute;inset:0;display:flex;flex-direction:column;gap:10px;align-items:center;justify-content:center;color:var(--stk-dim);font-size:13px;background:var(--stk-panel);text-align:center;padding:0 20px}`,
		`.dsh-stk-modalFoot{flex:none;display:flex;gap:14px;padding:6px 12px;border-top:1px solid var(--stk-border);color:var(--stk-dim);font:500 11px var(--ds-font-family-code);font-variant-numeric:tabular-nums;flex-wrap:wrap}`,
		// toast
		`.dsh-stk-toast{z-index:1000003;position:fixed;left:50%;bottom:44px;transform:translateX(-50%);background:#2b3948;color:#fff;font:500 12px/1 var(--dsw-font-family);padding:8px 14px;border-radius:4px;box-shadow:0 4px 16px #0004;opacity:0;transition:opacity .2s;pointer-events:none}.dsh-stk-toast.show{opacity:1}`
		].join("");
		const tagId = "@linxin666/dsh-client-ui-skin-stock/stock.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "@linxin666/dsh-client-ui-skin-stock";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/client/quotes.ts
		/** 统一涨跌方向：红涨绿跌，平灰。 */
		function trendOf(q) {
			if (q.changeAbs > 0) return "up";
			if (q.changeAbs < 0) return "down";
			if (q.changePct > 0) return "up";
			if (q.changePct < 0) return "down";
			return "flat";
		}
		function timeoutSignal(ms) {
			if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") return AbortSignal.timeout(ms);
			const controller = new AbortController();
			setTimeout(() => controller.abort(), ms);
			return controller.signal;
		}
		function toNumber(value) {
			if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
			if (typeof value === "string") return Number.parseFloat(value);
			return NaN;
		}
		function parseTencentRow(raw) {
			const f = raw.split("~");
			if (f.length < 35) return null;
			const price = toNumber(f[3]);
			if (!Number.isFinite(price)) return null;
			return { name: f[1] !== void 0 && f[1] !== "" ? f[1] : f[2] ?? "", price, prevClose: toNumber(f[4]), change: toNumber(f[31]), changePct: toNumber(f[32]), high: toNumber(f[33]), low: toNumber(f[34]) };
		}
		function loadTencentQuotes(symbols, timeoutMs = 8e3) {
			return new Promise((resolve) => {
				if (symbols.length === 0) { resolve(new Map()); return; }
				const globals = symbols.map((s) => `v_${s}`);
				let settled = false;
				const script = document.createElement("script");
				const finish = (out) => { if (settled) return; settled = true; clearTimeout(timer); script.remove(); for (const g of globals) try { delete window[g]; } catch {} resolve(out); };
				const timer = window.setTimeout(() => finish(new Map()), timeoutMs);
				script.onload = () => {
					const out = new Map();
					for (const s of symbols) { const raw = window[`v_${s}`]; if (typeof raw !== "string") continue; const row = parseTencentRow(raw); if (row !== null) out.set(s, row); }
					finish(out);
				};
				script.onerror = () => finish(new Map());
				script.src = `https://qt.gtimg.cn/q=${symbols.join(",")}&_t=${Date.now()}`;
				document.head.append(script);
			});
		}
		const BINANCE_ENDPOINTS = ["https://api.binance.com/api/v3/ticker/24hr", "https://data-api.binance.vision/api/v3/ticker/24hr"];
		const CRYPTO_NAMES = { BTCUSDT: "比特币", ETHUSDT: "以太坊", BNBUSDT: "BNB", SOLUSDT: "Solana", XRPUSDT: "瑞波币", DOGEUSDT: "狗狗币", ADAUSDT: "Cardano", AVAXUSDT: "Avalanche", LINKUSDT: "Chainlink", LTCUSDT: "莱特币", DOTUSDT: "Polkadot", TRXUSDT: "波场", SHIBUSDT: "SHIB", TONUSDT: "TON", BCHUSDT: "BCH", UNIUSDT: "Uniswap", ATOMUSDT: "Cosmos", NEARUSDT: "NEAR", APTUSDT: "Aptos", ARBUSDT: "Arbitrum", OPUSDT: "Optimism", FILUSDT: "Filecoin", SUIUSDT: "SUI", PEPEUSDT: "PEPE" };
		async function fetchBinanceQuotes(symbols, timeoutMs = 8e3) {
			const out = new Map();
			if (symbols.length === 0) return out;
			for (const endpoint of BINANCE_ENDPOINTS) {
				try {
					const response = await fetch(`${endpoint}?symbols=${encodeURIComponent(JSON.stringify(symbols))}`, { signal: timeoutSignal(timeoutMs) });
					if (!response.ok) continue;
					const rows = await response.json();
					for (const row of rows) {
						const symbol = String(row.symbol ?? ""); const price = toNumber(row.lastPrice);
						if (symbol === "" || !Number.isFinite(price)) continue;
						out.set(symbol, { symbol, name: CRYPTO_NAMES[symbol] ?? symbol, price, changeAbs: toNumber(row.priceChange), changePct: toNumber(row.priceChangePercent), source: "binance" });
					}
					if (out.size > 0) return out;
				} catch {}
			}
			return out;
		}
		const FRANKFURTER_ENDPOINTS = ["https://api.frankfurter.dev/v1", "https://api.frankfurter.app/v1"];
		const FX_CURRENCY_NAMES = { CNY: "人民币", USD: "美元", EUR: "欧元", JPY: "日元", GBP: "英镑", HKD: "港元", AUD: "澳元", CAD: "加元", CHF: "瑞士法郎", KRW: "韩元", SGD: "新加坡元", TWD: "新台币", THB: "泰铢", RUB: "卢布", INR: "卢比", BRL: "雷亚尔", MXN: "比索", TRY: "里拉", ZAR: "兰特", SEK: "瑞典克朗", NOK: "挪威克朗", DKK: "丹麦克朗", NZD: "新西兰元" };
		function isoDaysAgo(date, days) { return new Date(date.getTime() - days * 864e5).toISOString().slice(0, 10); }
		async function frankfurterRates(base, targets) {
			const symbols = targets.join(",");
			const date = new Date();
			for (const endpoint of FRANKFURTER_ENDPOINTS) {
				try {
					const latestResponse = await fetch(`${endpoint}/latest?base=${base}&symbols=${symbols}`, { signal: timeoutSignal(8e3) });
					if (!latestResponse.ok) continue;
					const latest = await latestResponse.json();
					if (latest.rates === void 0) continue;
					const rates = new Map();
					for (const [code, value] of Object.entries(latest.rates)) { const n = toNumber(value); if (Number.isFinite(n)) rates.set(code, n); }
					let prev = new Map();
					for (let back = 1; back <= 4 && prev.size === 0; back += 1) {
						try {
							const prevResponse = await fetch(`${endpoint}/${isoDaysAgo(date, back)}?base=${base}&symbols=${symbols}`, { signal: timeoutSignal(6e3) });
							if (!prevResponse.ok) continue;
							const prevJson = await prevResponse.json();
							prev = new Map();
							for (const [code, value] of Object.entries(prevJson.rates ?? {})) { const n = toNumber(value); if (Number.isFinite(n)) prev.set(code, n); }
						} catch {}
					}
					return { base, rates, prev };
				} catch {}
			}
			return null;
		}
		async function fetchFrankfurterQuotes(pairs, timeoutMs = 8e3) {
			const out = new Map();
			if (pairs.length === 0) return out;
			const byBase = new Map();
			for (const pair of pairs) {
				const [base, target] = pair.split("/");
				if (base === void 0 || target === void 0 || base === target) continue;
				const list = byBase.get(base) ?? []; list.push(target); byBase.set(base, list);
			}
			const results = await Promise.all([...byBase.entries()].map(([base, targets]) => frankfurterRates(base, targets)));
			for (const result of results) {
				if (result === null) continue;
				for (const [target, rate] of result.rates) {
					const symbol = `${result.base}/${target}`;
					const prevRate = result.prev.get(target);
					const changeAbs = Number.isFinite(prevRate) && prevRate !== 0 ? rate - prevRate : 0;
					const changePct = Number.isFinite(prevRate) && prevRate !== 0 ? (rate - prevRate) / prevRate * 100 : 0;
					out.set(symbol, { symbol, name: `${FX_CURRENCY_NAMES[result.base] ?? result.base}/${FX_CURRENCY_NAMES[target] ?? target}`, price: rate, changeAbs, changePct, source: "frankfurter" });
				}
			}
			return out;
		}
		const STOCK_API_BASE = "/plugins/dsh-stock/api";
		async function fetchQuotes(symbols, timeoutMs = 8e3) {
			const list = symbols.filter((s) => typeof s === "string" && s.length > 0);
			if (list.length === 0) return [];
			try {
				const response = await fetch(`${STOCK_API_BASE}/quotes?symbols=${encodeURIComponent(list.join(","))}`, { signal: timeoutSignal(timeoutMs) });
				if (response.ok) { const data = await response.json(); if (data.ok === true && Array.isArray(data.quotes)) return data.quotes; }
			} catch {}
			return fetchDirectQuotes(list, timeoutMs);
		}
		/** 规范化符号：大写市场前缀（SH/SZ/HK/US）统一转小写，避免被误判为加密货币；外汇对（含 /）保持原样。 */
		function normalizeSymbol(symbol) {
			const value = symbol.trim();
			if (value.includes("/")) return value;
			const m = value.match(/^(SH|SZ|HK|US)([A-Za-z0-9.]+)$/);
			return m ? m[1].toLowerCase() + m[2] : value;
		}
		function classifyDirectSymbol(symbol) {
			const value = normalizeSymbol(symbol.trim());
			if (/^(?:sh|sz|hk|us)[A-Za-z0-9.]+$/.test(value)) return "tencent";
			if (/^(?=.*[A-Z])[A-Z0-9]{4,12}$/.test(value)) return "crypto";
			if (/^[A-Z]{3}\/[A-Z]{3}$/.test(value)) return "fx";
			return null;
		}
		async function fetchDirectQuotes(symbols, timeoutMs = 8e3) {
			const tencentSymbols = [], cryptoSymbols = [], fxSymbols = [];
			for (const symbol of symbols) {
				const category = classifyDirectSymbol(symbol);
				if (category === "tencent") tencentSymbols.push(symbol);
				else if (category === "crypto") cryptoSymbols.push(symbol);
				else if (category === "fx") fxSymbols.push(symbol);
			}
			const [tencent, crypto, fx] = await Promise.all([loadTencentQuotes(tencentSymbols, timeoutMs), fetchBinanceQuotes(cryptoSymbols, timeoutMs), fetchFrankfurterQuotes(fxSymbols, timeoutMs)]);
			const quotes = [];
			for (const [symbol, row] of tencent) quotes.push({ symbol, name: row.name !== "" ? row.name : symbol, price: row.price, changeAbs: row.change, changePct: row.changePct, source: "tencent" });
	for (const quote of crypto.values()) quotes.push(quote); for (const quote of fx.values()) quotes.push(quote);
	return quotes;
	}
	//#endregion
	//#region src/client/kline.ts
	/** 宿主 /api/kline 代理拉日 K；失败抛错由弹窗降级为错误态。 */
	async function fetchKline(symbol, count = 120, period = "day", timeoutMs = 1e4) {
		const response = await fetch(`${STOCK_API_BASE}/kline?symbol=${encodeURIComponent(symbol)}&count=${count}&period=${period}`, { signal: timeoutSignal(timeoutMs) });
		if (!response.ok) throw new Error(`http-${response.status}`);
		const data = await response.json();
		if (data === null || typeof data !== "object" || data.ok !== true || !Array.isArray(data.bars) || data.bars.length === 0) {
			const reason = data && typeof data.error === "string" && data.error !== "" ? data.error : "kline-empty";
			throw new Error(reason);
		}
		return data.bars;
	}
	/** ISO 周键（YYYY-Www） */
	function isoWeekKey(dateStr) {
		const d = new Date(dateStr + "T00:00:00"); const day = (d.getDay() + 6) % 7;
		d.setDate(d.getDate() - day + 3); const first = new Date(d.getFullYear(), 0, 4);
		const w = 1 + Math.round((d - first + (first.getDay() + 6) % 7 * 864e5) / 6048e5);
		return d.getFullYear() + "-W" + String(w).padStart(2, "0");
	}
	/** 将日K聚合为周K/月K。若数据间隔已满足目标周期（服务端已返回原生数据），则跳过聚合。 */
	function aggregateToPeriod(bars, period) {
		if (!period || period === "day" || bars.length < 2) return bars;
		let gapSum = 0, gapN = 0;
		for (let i = 1; i < Math.min(bars.length, 20); i++) {
			const d0 = Date.parse(bars[i - 1].t), d1 = Date.parse(bars[i].t);
			if (Number.isFinite(d0) && Number.isFinite(d1) && d1 >= d0) { gapSum += (d1 - d0) / 864e5; gapN++; }
		}
		const avgGap = gapN > 0 ? gapSum / gapN : 1;
		const needAgg = period === "week" ? avgGap < 5 : period === "month" ? avgGap < 25 : false;
		if (!needAgg) return bars;
		const keyFn = period === "week" ? isoWeekKey : (t) => t.slice(0, 7);
		const groups = new Map();
		for (const b of bars) {
			const k = keyFn(b.t); const g = groups.get(k);
			if (!g) groups.set(k, { t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v || 0 });
			else { if (b.h > g.h) g.h = b.h; if (b.l < g.l) g.l = b.l; g.c = b.c; g.v = (g.v || 0) + (b.v || 0); }
		}
		return [...groups.values()];
	}
	function klinePriceText(p) { return p >= 1000 ? p.toFixed(0) : p.toFixed(2); }
	/**
	 * Canvas 绘制日 K：蜡烛 + MA5/MA10 + 成交量副图 + 网格/轴标签。
	 * 颜色取自皮肤 CSS 变量，自动适配明暗主题；按 devicePixelRatio 缩放保证清晰。
	 */
	function drawKlineChart(canvas, bars) {
		const cssW = canvas.clientWidth || 640, cssH = canvas.clientHeight || 320;
		if (cssW <= 0 || cssH <= 0) return;
		const dpr = window.devicePixelRatio || 1;
		canvas.width = Math.round(cssW * dpr);
		canvas.height = Math.round(cssH * dpr);
		const g = canvas.getContext("2d");
		if (g === null) return;
		g.setTransform(dpr, 0, 0, dpr, 0, 0);
		g.clearRect(0, 0, cssW, cssH);
		const style = getComputedStyle(document.body);
		const cUp = style.getPropertyValue("--stk-up").trim() || "#e02e3d";
		const cDown = style.getPropertyValue("--stk-down").trim() || "#089981";
		const cDim = style.getPropertyValue("--stk-dim").trim() || "#6b7788";
		const cBorder = style.getPropertyValue("--stk-border").trim() || "#d4dce5";
		const codeFont = style.getPropertyValue("--ds-font-family-code").trim() || "monospace";
		const padL = 8, padR = 58, padT = 10, padB = 18;
		const volH = Math.min(64, Math.max(34, cssH * 0.18));
		const volGap = 16;
		const priceH = cssH - padT - padB - volH - volGap;
		const plotW = cssW - padL - padR;
		const n = bars.length;
		if (n < 2 || priceH <= 10 || plotW <= 10) return;
		let hi = -Infinity, lo = Infinity, maxVol = 0;
		for (const b of bars) { if (b.h > hi) hi = b.h; if (b.l < lo) lo = b.l; if (b.v > maxVol) maxVol = b.v; }
		if (hi === lo) { hi += 1; lo -= 1; }
		const rawSpan = hi - lo;
		hi += rawSpan * 0.05; lo -= rawSpan * 0.05;
		const yPrice = (p) => padT + priceH * (1 - (p - lo) / (hi - lo));
		const step = plotW / n;
		const bodyW = Math.max(1, Math.min(12, step * 0.62));
		const xCenter = (i) => padL + step * (i + 0.5);
		const volTop = padT + priceH + volGap, volBase = volTop + volH;
		// 网格 + 价格轴
		g.font = `10px ${codeFont}`;
		g.textBaseline = "middle";
		for (let k = 0; k <= 4; k += 1) {
			const p = lo + (hi - lo) * k / 4, y = yPrice(p);
			g.strokeStyle = cBorder; g.globalAlpha = 0.45;
			g.beginPath(); g.moveTo(padL, y); g.lineTo(padL + plotW, y); g.stroke();
			g.globalAlpha = 1;
			g.fillStyle = cDim; g.textAlign = "left";
			g.fillText(klinePriceText(p), padL + plotW + 6, y);
		}
		// 日期轴（首/中/尾）
		g.textAlign = "center"; g.fillStyle = cDim;
		for (const i of [0, Math.floor(n / 2), n - 1]) g.fillText(String(bars[i].t).slice(0, 10), xCenter(i), cssH - padB / 2);
		// 成交量副图
		for (let i = 0; i < n; i += 1) {
			const b = bars[i], up = b.c >= b.o;
			const h = maxVol > 0 ? b.v / maxVol * volH : 0;
			g.fillStyle = up ? cUp : cDown; g.globalAlpha = 0.5;
			g.fillRect(xCenter(i) - bodyW / 2, volBase - Math.max(h, 0.5), bodyW, Math.max(h, 0.5));
		}
		g.globalAlpha = 1;
		// 价格/成交量分隔线
		g.strokeStyle = cBorder; g.globalAlpha = 0.6;
		g.beginPath(); g.moveTo(padL, volTop - volGap / 2); g.lineTo(padL + plotW, volTop - volGap / 2); g.stroke();
		g.globalAlpha = 1;
		// 蜡烛（先影线后实体）
		for (let i = 0; i < n; i += 1) {
			const b = bars[i], up = b.c >= b.o, x = xCenter(i);
			g.strokeStyle = up ? cUp : cDown; g.lineWidth = 1;
			g.beginPath(); g.moveTo(x, yPrice(b.h)); g.lineTo(x, yPrice(b.l)); g.stroke();
			g.fillStyle = up ? cUp : cDown;
			const top = Math.min(yPrice(b.o), yPrice(b.c));
			g.fillRect(x - bodyW / 2, top, bodyW, Math.max(Math.abs(yPrice(b.c) - yPrice(b.o)), 1));
		}
		// MA5 / MA10
		const maSeries = (period) => bars.map((_, i) => {
			if (i < period - 1) return NaN;
			let s = 0;
			for (let j = i - period + 1; j <= i; j += 1) s += bars[j].c;
			return s / period;
		});
		const drawMA = (series, color) => {
			g.strokeStyle = color; g.lineWidth = 1;
			g.beginPath();
			let started = false;
			for (let i = 0; i < n; i += 1) {
				const v = series[i];
				if (!Number.isFinite(v)) continue;
				const x = xCenter(i), y = yPrice(v);
				if (!started) { g.moveTo(x, y); started = true; } else g.lineTo(x, y);
			}
			g.stroke();
		};
		drawMA(maSeries(5), "#c08a35");
		drawMA(maSeries(10), "#4a7ede");
	}
	//#endregion
	//#region src/client/session.ts
	function tzWeekday(timeZone, date) { return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date); }
	function tzMinutes(timeZone, date) {
		const parts = new Intl.DateTimeFormat("en-US", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
		return Number(parts.find((p) => p.type === "hour")?.value ?? 0) * 60 + Number(parts.find((p) => p.type === "minute")?.value ?? 0);
	}
	function isWeekday(timeZone, now) { const day = tzWeekday(timeZone, now); return day !== "Sat" && day !== "Sun"; }
	function continuousPhase(minutes, open, close, preOpen) { if (minutes >= open && minutes < close) return "trading"; if (preOpen !== void 0 && minutes >= preOpen && minutes < open) return "pre"; return "closed"; }
	function splitPhase(minutes, open, lunch, resume, close) { if (minutes >= open && minutes < lunch) return "trading"; if (minutes >= lunch && minutes < resume) return "lunch"; if (minutes >= resume && minutes < close) return "trading"; return "closed"; }
	function marketSessions(now = new Date()) {
		const aShareOpen = isWeekday("Asia/Shanghai", now), hkOpen = isWeekday("Asia/Hong_Kong", now), usOpen = isWeekday("America/New_York", now);
		return { aShare: aShareOpen ? splitPhase(tzMinutes("Asia/Shanghai", now), 570, 690, 780, 900) : "closed", hk: hkOpen ? splitPhase(tzMinutes("Asia/Hong_Kong", now), 570, 720, 780, 960) : "closed", us: usOpen ? continuousPhase(tzMinutes("America/New_York", now), 570, 960, 240) : "closed" };
	}
	function phaseLabel(phase) { switch (phase) { case "trading": return "盘中"; case "lunch": return "午休"; case "pre": return "盘前"; case "closed": return "休市"; } }
	//#endregion
	//#region src/client/storage.ts
	const WATCHLIST_KEY = "dsh.stock.watchlist.v1", POSITIONS_KEY = "dsh.stock.positions.v1", SETTINGS_KEY = "dsh.stock.settings.v1", PANEL_HEIGHT_KEY = "dsh.stock.panelHeight.v1";
	function loadJSON(key, fallback) { try { const raw = localStorage.getItem(key); if (raw === null || raw === "") return fallback; const value = JSON.parse(raw); return value === void 0 || value === null ? fallback : value; } catch { return fallback; } }
	function saveJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
	//#endregion
	//#region src/client/dict.ts — 行情符号字典（首字母 / 代码 / 名称模糊搜索）
	const SYMBOL_DICT = [
		// 指数
		{sym:"sh000001",code:"000001",name:"上证指数",initials:"szzs",mkt:"A股"},
		{sym:"sz399001",code:"399001",name:"深证成指",initials:"szcz",mkt:"A股"},
		{sym:"sz399006",code:"399006",name:"创业板指",initials:"cybz",mkt:"A股"},
		{sym:"sh000300",code:"000300",name:"沪深300",initials:"hs300",mkt:"A股"},
		{sym:"hkHSI",code:"HSI",name:"恒生指数",initials:"hszs",mkt:"港股"},
		{sym:"hkHSTECH",code:"HSTECH",name:"恒生科技",initials:"hskj",mkt:"港股"},
		{sym:"usDJI",code:"DJI",name:"道琼斯",initials:"dqs",mkt:"美股"},
		{sym:"usINX",code:"INX",name:"标普500",initials:"bp500",mkt:"美股"},
		{sym:"usIXIC",code:"IXIC",name:"纳斯达克",initials:"nsdk",mkt:"美股"},
		// A 股
		{sym:"sh600519",code:"600519",name:"贵州茅台",initials:"gzmt",mkt:"A股"},
		{sym:"sz000858",code:"000858",name:"五粮液",initials:"wly",mkt:"A股"},
		{sym:"sz300750",code:"300750",name:"宁德时代",initials:"ndsd",mkt:"A股"},
		{sym:"sz002594",code:"002594",name:"比亚迪",initials:"byd",mkt:"A股"},
		{sym:"sh601012",code:"601012",name:"隆基绿能",initials:"ljln",mkt:"A股"},
		{sym:"sh601318",code:"601318",name:"中国平安",initials:"zgpa",mkt:"A股"},
		{sym:"sh600036",code:"600036",name:"招商银行",initials:"zsyh",mkt:"A股"},
		{sym:"sh601398",code:"601398",name:"工商银行",initials:"gsyh",mkt:"A股"},
		{sym:"sh601288",code:"601288",name:"农业银行",initials:"nyyh",mkt:"A股"},
		{sym:"sh601988",code:"601988",name:"中国银行",initials:"zgyh",mkt:"A股"},
		{sym:"sh601939",code:"601939",name:"建设银行",initials:"jsyh",mkt:"A股"},
		{sym:"sh601166",code:"601166",name:"兴业银行",initials:"xyyh",mkt:"A股"},
		{sym:"sh600030",code:"600030",name:"中信证券",initials:"zxzq",mkt:"A股"},
		{sym:"sz300059",code:"300059",name:"东方财富",initials:"dfcf",mkt:"A股"},
		{sym:"sh688981",code:"688981",name:"中芯国际",initials:"zxgj",mkt:"A股"},
		{sym:"sh603259",code:"603259",name:"药明康德",initials:"ymkd",mkt:"A股"},
		{sym:"sh600276",code:"600276",name:"恒瑞医药",initials:"hryy",mkt:"A股"},
		{sym:"sz300760",code:"300760",name:"迈瑞医疗",initials:"mryl",mkt:"A股"},
		{sym:"sz300015",code:"300015",name:"爱尔眼科",initials:"aeyk",mkt:"A股"},
		{sym:"sh600436",code:"600436",name:"片仔癀",initials:"pzh",mkt:"A股"},
		{sym:"sz000538",code:"000538",name:"云南白药",initials:"ynby",mkt:"A股"},
		{sym:"sh600031",code:"600031",name:"三一重工",initials:"syzg",mkt:"A股"},
		{sym:"sz000333",code:"000333",name:"美的集团",initials:"mdjt",mkt:"A股"},
		{sym:"sz000651",code:"000651",name:"格力电器",initials:"gldq",mkt:"A股"},
		{sym:"sh600690",code:"600690",name:"海尔智家",initials:"hezj",mkt:"A股"},
		{sym:"sz000002",code:"000002",name:"万科A",initials:"wk",mkt:"A股"},
		{sym:"sh600048",code:"600048",name:"保利发展",initials:"blfz",mkt:"A股"},
		{sym:"sh601888",code:"601888",name:"中国中免",initials:"zgzm",mkt:"A股"},
		{sym:"sh601857",code:"601857",name:"中国石油",initials:"zgsy",mkt:"A股"},
		{sym:"sh600028",code:"600028",name:"中国石化",initials:"zgsh",mkt:"A股"},
		{sym:"sh601088",code:"601088",name:"中国神华",initials:"zgsh",mkt:"A股"},
		{sym:"sh601899",code:"601899",name:"紫金矿业",initials:"zjky",mkt:"A股"},
		{sym:"sh600309",code:"600309",name:"万华化学",initials:"whhx",mkt:"A股"},
		{sym:"sh603288",code:"603288",name:"海天味业",initials:"htwy",mkt:"A股"},
		{sym:"sh600887",code:"600887",name:"伊利股份",initials:"ylgf",mkt:"A股"},
		{sym:"sz000895",code:"000895",name:"双汇发展",initials:"shfz",mkt:"A股"},
		{sym:"sh600600",code:"600600",name:"青岛啤酒",initials:"qdpj",mkt:"A股"},
		{sym:"sz000568",code:"000568",name:"泸州老窖",initials:"lzlj",mkt:"A股"},
		{sym:"sh600809",code:"600809",name:"山西汾酒",initials:"sxfj",mkt:"A股"},
		{sym:"sz002304",code:"002304",name:"洋河股份",initials:"yhgf",mkt:"A股"},
		{sym:"sz000596",code:"000596",name:"古井贡酒",initials:"gjgj",mkt:"A股"},
		{sym:"sh600585",code:"600585",name:"海螺水泥",initials:"hlsn",mkt:"A股"},
		{sym:"sh600104",code:"600104",name:"上汽集团",initials:"sqjt",mkt:"A股"},
		{sym:"sz002415",code:"002415",name:"海康威视",initials:"hkws",mkt:"A股"},
		{sym:"sh600900",code:"600900",name:"长江电力",initials:"cjdl",mkt:"A股"},
		{sym:"sh601985",code:"601985",name:"中国核电",initials:"zghd",mkt:"A股"},
		{sym:"sh600050",code:"600050",name:"中国联通",initials:"zglt",mkt:"A股"},
		{sym:"sh601728",code:"601728",name:"中国电信",initials:"zgdx",mkt:"A股"},
		{sym:"sh600941",code:"600941",name:"中国移动",initials:"zgyd",mkt:"A股"},
		{sym:"sh601668",code:"601668",name:"中国建筑",initials:"zgjz",mkt:"A股"},
		{sym:"sh601390",code:"601390",name:"中国中铁",initials:"zgzt",mkt:"A股"},
		{sym:"sh601766",code:"601766",name:"中国中车",initials:"zgzc",mkt:"A股"},
		{sym:"sh601111",code:"601111",name:"中国国航",initials:"zggk",mkt:"A股"},
		{sym:"sh600029",code:"600029",name:"南方航空",initials:"nfhk",mkt:"A股"},
		{sym:"sh601006",code:"601006",name:"大秦铁路",initials:"dqtl",mkt:"A股"},
		{sym:"sh601225",code:"601225",name:"陕西煤业",initials:"sxmy",mkt:"A股"},
		{sym:"sh600547",code:"600547",name:"山东黄金",initials:"sdhj",mkt:"A股"},
		{sym:"sz002460",code:"002460",name:"赣锋锂业",initials:"gfly",mkt:"A股"},
		{sym:"sz002466",code:"002466",name:"天齐锂业",initials:"tqly",mkt:"A股"},
		// 港股
		{sym:"hk00700",code:"0700",name:"腾讯控股",initials:"txkg",mkt:"港股"},
		{sym:"hk09988",code:"9988",name:"阿里巴巴",initials:"albb",mkt:"港股"},
		{sym:"hk03690",code:"3690",name:"美团",initials:"mt",mkt:"港股"},
		{sym:"hk01810",code:"1810",name:"小米集团",initials:"xmjt",mkt:"港股"},
		{sym:"hk09618",code:"9618",name:"京东集团",initials:"jdjt",mkt:"港股"},
		{sym:"hk09999",code:"9999",name:"网易",initials:"wy",mkt:"港股"},
		{sym:"hk01024",code:"1024",name:"快手",initials:"ks",mkt:"港股"},
		{sym:"hk01211",code:"1211",name:"比亚迪股份",initials:"bydgf",mkt:"港股"},
		{sym:"hk00941",code:"0941",name:"中国移动",initials:"zgyd",mkt:"港股"},
		{sym:"hk02318",code:"2318",name:"中国平安",initials:"zgpa",mkt:"港股"},
		{sym:"hk00005",code:"0005",name:"汇丰控股",initials:"hfkg",mkt:"港股"},
		{sym:"hk00388",code:"0388",name:"香港交易所",initials:"gajys",mkt:"港股"},
		{sym:"hk01299",code:"1299",name:"友邦保险",initials:"ybbx",mkt:"港股"},
		{sym:"hk09633",code:"9633",name:"农夫山泉",initials:"nfsq",mkt:"港股"},
		{sym:"hk09961",code:"9961",name:"携程集团",initials:"xcjt",mkt:"港股"},
		{sym:"hk02015",code:"2015",name:"理想汽车",initials:"lxqc",mkt:"港股"},
		{sym:"hk09866",code:"9866",name:"蔚来",initials:"wl",mkt:"港股"},
		{sym:"hk09626",code:"9626",name:"哔哩哔哩",initials:"bldy",mkt:"港股"},
		{sym:"hk09888",code:"9888",name:"百度集团",initials:"bdjt",mkt:"港股"},
		{sym:"hk00300",code:"0300",name:"中国交建",initials:"zgjj",mkt:"港股"},
		// 美股
		{sym:"usAAPL",code:"AAPL",name:"苹果",initials:"pg",mkt:"美股"},
		{sym:"usNVDA",code:"NVDA",name:"英伟达",initials:"ywd",mkt:"美股"},
		{sym:"usTSLA",code:"TSLA",name:"特斯拉",initials:"tsl",mkt:"美股"},
		{sym:"usMSFT",code:"MSFT",name:"微软",initials:"wr",mkt:"美股"},
		{sym:"usGOOGL",code:"GOOGL",name:"谷歌",initials:"gg",mkt:"美股"},
		{sym:"usMETA",code:"META",name:"Meta",initials:"meta",mkt:"美股"},
		{sym:"usAMZN",code:"AMZN",name:"亚马逊",initials:"ymx",mkt:"美股"},
		{sym:"usAMD",code:"AMD",name:"超威半导体",initials:"cwbdt",mkt:"美股"},
		{sym:"usINTC",code:"INTC",name:"英特尔",initials:"yte",mkt:"美股"},
		{sym:"usNFLX",code:"NFLX",name:"奈飞",initials:"nf",mkt:"美股"},
		{sym:"usDIS",code:"DIS",name:"迪士尼",initials:"dsn",mkt:"美股"},
		{sym:"usKO",code:"KO",name:"可口可乐",initials:"kkkl",mkt:"美股"},
		{sym:"usPEP",code:"PEP",name:"百事",initials:"bs",mkt:"美股"},
		{sym:"usJPM",code:"JPM",name:"摩根大通",initials:"mgdt",mkt:"美股"},
		{sym:"usWMT",code:"WMT",name:"沃尔玛",initials:"wem",mkt:"美股"},
		{sym:"usHD",code:"HD",name:"家得宝",initials:"jdb",mkt:"美股"},
		{sym:"usNKE",code:"NKE",name:"耐克",initials:"nk",mkt:"美股"},
		{sym:"usSBUX",code:"SBUX",name:"星巴克",initials:"xbk",mkt:"美股"},
		{sym:"usMCD",code:"MCD",name:"麦当劳",initials:"mdl",mkt:"美股"},
		{sym:"usXOM",code:"XOM",name:"埃克森美孚",initials:"aksmf",mkt:"美股"},
		{sym:"usJNJ",code:"JNJ",name:"强生",initials:"qs",mkt:"美股"},
		{sym:"usPFE",code:"PFE",name:"辉瑞",initials:"hr",mkt:"美股"},
		{sym:"usMRK",code:"MRK",name:"默沙东",initials:"msd",mkt:"美股"},
		{sym:"usUNH",code:"UNH",name:"联合健康",initials:"lhjk",mkt:"美股"},
		{sym:"usV",code:"V",name:"Visa",initials:"visa",mkt:"美股"},
		{sym:"usMA",code:"MA",name:"万事达",initials:"wsd",mkt:"美股"},
		{sym:"usAVGO",code:"AVGO",name:"博通",initials:"bt",mkt:"美股"},
		{sym:"usORCL",code:"ORCL",name:"甲骨文",initials:"jgw",mkt:"美股"},
		{sym:"usCRM",code:"CRM",name:"赛富时",initials:"sfs",mkt:"美股"},
		{sym:"usADBE",code:"ADBE",name:"Adobe",initials:"adobe",mkt:"美股"},
		{sym:"usCSCO",code:"CSCO",name:"思科",initials:"sk",mkt:"美股"},
		{sym:"usQCOM",code:"QCOM",name:"高通",initials:"gt",mkt:"美股"},
		{sym:"usIBM",code:"IBM",name:"IBM",initials:"ibm",mkt:"美股"},
		{sym:"usUBER",code:"UBER",name:"优步",initials:"yb",mkt:"美股"},
		{sym:"usPYPL",code:"PYPL",name:"贝宝",initials:"bb",mkt:"美股"},
		{sym:"usCOIN",code:"COIN",name:"Coinbase",initials:"coinbase",mkt:"美股"},
		{sym:"usSNAP",code:"SNAP",name:"Snap",initials:"snap",mkt:"美股"},
		{sym:"usSHOP",code:"SHOP",name:"Shopify",initials:"shopify",mkt:"美股"},
		{sym:"usSPOT",code:"SPOT",name:"Spotify",initials:"spotify",mkt:"美股"},
		{sym:"usTSM",code:"TSM",name:"台积电",initials:"tjd",mkt:"美股"},
		{sym:"usBA",code:"BA",name:"波音",initials:"by",mkt:"美股"},
		{sym:"usGE",code:"GE",name:"通用电气",initials:"tydq",mkt:"美股"},
		{sym:"usMMM",code:"MMM",name:"3M",initials:"3m",mkt:"美股"},
		{sym:"usCAT",code:"CAT",name:"卡特彼勒",initials:"ktbl",mkt:"美股"},
		{sym:"usCVX",code:"CVX",name:"雪佛龙",initials:"xfl",mkt:"美股"},
		// 加密
		{sym:"BTCUSDT",code:"BTCUSDT",name:"比特币",initials:"btc",mkt:"加密"},
		{sym:"ETHUSDT",code:"ETHUSDT",name:"以太坊",initials:"eth",mkt:"加密"},
		{sym:"BNBUSDT",code:"BNBUSDT",name:"BNB",initials:"bnb",mkt:"加密"},
		{sym:"SOLUSDT",code:"SOLUSDT",name:"Solana",initials:"sol",mkt:"加密"},
		{sym:"XRPUSDT",code:"XRPUSDT",name:"瑞波币",initials:"xrp",mkt:"加密"},
		{sym:"DOGEUSDT",code:"DOGEUSDT",name:"狗狗币",initials:"doge",mkt:"加密"},
		{sym:"ADAUSDT",code:"ADAUSDT",name:"Cardano",initials:"ada",mkt:"加密"},
		{sym:"AVAXUSDT",code:"AVAXUSDT",name:"Avalanche",initials:"avax",mkt:"加密"},
		{sym:"LINKUSDT",code:"LINKUSDT",name:"Chainlink",initials:"link",mkt:"加密"},
		{sym:"LTCUSDT",code:"LTCUSDT",name:"莱特币",initials:"ltc",mkt:"加密"},
		{sym:"DOTUSDT",code:"DOTUSDT",name:"Polkadot",initials:"dot",mkt:"加密"},
		{sym:"TRXUSDT",code:"TRXUSDT",name:"波场",initials:"trx",mkt:"加密"},
		{sym:"SHIBUSDT",code:"SHIBUSDT",name:"SHIB",initials:"shib",mkt:"加密"},
		{sym:"TONUSDT",code:"TONUSDT",name:"TON",initials:"ton",mkt:"加密"},
		{sym:"SUIUSDT",code:"SUIUSDT",name:"SUI",initials:"sui",mkt:"加密"},
		{sym:"PEPEUSDT",code:"PEPEUSDT",name:"PEPE",initials:"pepe",mkt:"加密"},
		// 外汇
		{sym:"USD/CNY",code:"USD/CNY",name:"美元/人民币",initials:"usdcny",mkt:"外汇"},
		{sym:"EUR/USD",code:"EUR/USD",name:"欧元/美元",initials:"eurusd",mkt:"外汇"},
		{sym:"GBP/USD",code:"GBP/USD",name:"英镑/美元",initials:"gbpusd",mkt:"外汇"},
		{sym:"USD/JPY",code:"USD/JPY",name:"美元/日元",initials:"usdjpy",mkt:"外汇"},
		{sym:"USD/HKD",code:"USD/HKD",name:"美元/港元",initials:"usdhkd",mkt:"外汇"},
		{sym:"USD/KRW",code:"USD/KRW",name:"美元/韩元",initials:"usdkrw",mkt:"外汇"},
		{sym:"USD/SGD",code:"USD/SGD",name:"美元/新加坡元",initials:"usdsgd",mkt:"外汇"},
		{sym:"USD/AUD",code:"USD/AUD",name:"美元/澳元",initials:"usdaud",mkt:"外汇"},
		{sym:"USD/CAD",code:"USD/CAD",name:"美元/加元",initials:"usdcad",mkt:"外汇"}
	];
	/** 首字母/代码/名称模糊搜索，返回前 8 条。 */
	function suggestSymbols(input) {
		if (!input || input.length < 1) return [];
		const q = input.trim().toLowerCase();
		const scored = [];
		const seen = new Set();
		for (const entry of SYMBOL_DICT) {
			if (seen.has(entry.sym)) continue;
			const sym = entry.sym.toLowerCase(), code = entry.code.toLowerCase(), initials = entry.initials.toLowerCase(), name = entry.name.toLowerCase();
			let score = 0;
			if (sym === q) score = 100;
			else if (code === q) score = 95;
			else if (initials === q) score = 90;
			else if (name === q) score = 85;
			else if (sym.startsWith(q)) score = 80;
			else if (code.startsWith(q)) score = 75;
			else if (initials.startsWith(q)) score = 70;
			else if (name.startsWith(q)) score = 65;
			else if (sym.includes(q)) score = 50;
			else if (code.includes(q)) score = 45;
			else if (initials.includes(q)) score = 40;
			else if (name.includes(q)) score = 35;
			else continue;
			seen.add(entry.sym);
			scored.push({ entry, score });
		}
		scored.sort((a, b) => b.score - a.score);
		return scored.slice(0, 8).map((s) => s.entry);
	}
	/** 调用宿主 suggest 代理（新浪股票建议 API），GBK 已由宿主解码。 */
	async function fetchSuggestions(key) {
		try {
			const response = await fetch(`${STOCK_API_BASE}/suggest?key=${encodeURIComponent(key)}`, { signal: timeoutSignal(5000) });
			if (!response.ok) return [];
			const data = await response.json();
			if (data.ok !== true || !Array.isArray(data.results)) return [];
			return data.results;
		} catch { return []; }
	}
	//#endregion
	//#region src/client/index.ts
	const SKIN_TITLE = "股市行情 · DeepSeek 在线";
	const QUOTES_REFRESH_MS = 3e4;
	const SESSION_REFRESH_MS = 6e4;
	const WORKSPACES_REFRESH_MS = 3e4;
	const TITLEBAR_GLYPHS = ["–", "□", "×"];
	const DEFAULT_WATCHLIST = ["sh000001", "sz399001", "sz399006", "hkHSI", "hk00700", "hk09988", "usDJI", "usIXIC", "usNVDA", "usAAPL", "usTSLA", "BTCUSDT", "ETHUSDT", "USD/CNY"];
	const INDEX_SYMBOLS = ["sh000001", "sz399001", "sz399006", "hkHSI", "usDJI", "usIXIC"];
	const CANDLE_SVG = ['<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="14" width="8" height="20" fill="#fff"/><rect x="9" y="6" width="2" height="36" fill="#fff"/><rect x="17" y="20" width="8" height="18" fill="#fff"/><rect x="20" y="12" width="2" height="34" fill="#fff"/><rect x="28" y="10" width="8" height="16" fill="#fff"/><rect x="31" y="4" width="2" height="28" fill="#fff"/></svg>'].join("");
	const FAVICON_SVG = ['<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect x="2" y="2" width="60" height="60" rx="14" fill="#e02e3d"/><rect x="14" y="24" width="8" height="16" rx="1" fill="#fff"/><rect x="17" y="18" width="2" height="28" rx="1" fill="#fff"/><rect x="28" y="30" width="8" height="14" rx="1" fill="#fff"/><rect x="31" y="24" width="2" height="26" rx="1" fill="#fff"/><rect x="42" y="22" width="8" height="12" rx="1" fill="#fff"/><rect x="45" y="16" width="2" height="24" rx="1" fill="#fff"/></svg>'].join("");
	function placeholderQuote(symbol) { return { symbol, name: symbol, price: NaN, changePct: NaN, changeAbs: NaN, source: "tencent" }; }
	function pctText(trend, pct) { if (trend === "flat") return "—"; return `${trend === "up" ? "+" : ""}${Math.abs(pct).toFixed(2)}%`; }
	function priceText(price) { return Number.isFinite(price) ? price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "--"; }
	function moneyText(value) { return Number.isFinite(value) ? value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "--"; }
	function signedMoneyText(value) { if (!Number.isFinite(value)) return "--"; return `${value > 0 ? "+" : ""}${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
	function applyTrend(el, trend) { if (trend === "flat") delete el.dataset.trend; else el.dataset.trend = trend; }
	/** 当前状态（含持久化配置）。watchlist/positions 存 localStorage，通用设置向 settingsScope 双向同步。 */
	const state = {
		watchlist: loadJSON(WATCHLIST_KEY, []).filter((s) => typeof s === "string" && s.length > 0),
		positions: loadJSON(POSITIONS_KEY, []).filter((p) => p && typeof p.symbol === "string"),
		settings: Object.assign({ refreshMs: QUOTES_REFRESH_MS, showTape: true, showPanel: false, tab: "watchlist" }, loadJSON(SETTINGS_KEY, {})),
		quotes: new Map(),
		toastTimer: 0,
		settingsCtrl: null
	};
	function persistWatchlist() { saveJSON(WATCHLIST_KEY, state.watchlist); }
	function persistPositions() { saveJSON(POSITIONS_KEY, state.positions); }
	function persistSettings() { saveJSON(SETTINGS_KEY, state.settings); }
	function quoteOf(symbol) { return state.quotes.get(symbol) ?? placeholderQuote(symbol); }
	function toast(message) {
		if (!document.body) return;
		let el = document.querySelector(".dsh-stk-toast");
		if (!el) { el = document.createElement("div"); el.className = "dsh-stk-toast"; document.body.append(el); }
		el.textContent = message; el.classList.add("show"); clearTimeout(state.toastTimer);
		state.toastTimer = window.setTimeout(() => el.classList.remove("show"), 2200);
	}
	let armTimer = 0;
	function armButton(btn, label, fn) {
		if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = label; fn(); return; }
		btn.dataset.armed = "1"; btn.textContent = "再点一次确认";
		clearTimeout(armTimer);
		armTimer = window.setTimeout(() => { if (btn.dataset.armed) { delete btn.dataset.armed; btn.textContent = label; } }, 3000);
	}
	function buildQuoteLine(container, quote, nameClass, valueClass, chgClass) {
		const name = document.createElement("span"); name.className = nameClass;
		const price = document.createElement("span"); price.className = valueClass;
		const chg = document.createElement("span"); chg.className = chgClass;
		container.append(name, price, chg);
		updateQuoteLine(container, quote);
	}
	/** 原地更新一行行情（不重建 DOM，避免跑马灯动画被重置）。 */
	function updateQuoteLine(container, quote) {
		const [name, price, chg] = container.children;
		if (name === void 0 || price === void 0 || chg === void 0) return;
		const trend = trendOf(quote);
		name.textContent = quote.name;
		price.textContent = priceText(quote.price);
		chg.textContent = `${trend === "up" ? "▲" : trend === "down" ? "▼" : ""}${pctText(trend, quote.changePct)}`;
		applyTrend(chg, trend);
	}
	function renderQuoteLine(container, quote, nameClass, valueClass, chgClass) {
		container.textContent = "";
		buildQuoteLine(container, quote, nameClass, valueClass, chgClass);
	}
	/** 系统设置卡（settings.section 分区，在设置侧边栏出现独立入口）。 */
	/** 设置页「股市行情」分区组件：行情设置 + 自选列表 + 持仓管理。 */
	function StockSettingsCard(props) {
		const [refreshMs, setRefreshMs] = react.useState(30000);
		const [showTape, setShowTape] = react.useState(true);
		const [wlItems, setWlItems] = react.useState([]);
		const [wlInput, setWlInput] = react.useState("");
		const [wlAc, setWlAc] = react.useState([]);
		const [wlAcIdx, setWlAcIdx] = react.useState(-1);
		const [posItems, setPosItems] = react.useState([]);
		const [posSym, setPosSym] = react.useState("");
		const [posQty, setPosQty] = react.useState("");
		const [posCost, setPosCost] = react.useState("");
		const wlTimer = react.useRef(null);
		react.useEffect(() => {
			setWlItems([...state.watchlist]);
			setPosItems([...state.positions]);
			if (state.settingsCtrl) {
				try { setRefreshMs(state.settingsCtrl.get("refreshMs") ?? 30000); } catch {}
				try { setShowTape(state.settingsCtrl.get("showTape") ?? true); } catch {}
			}
		}, []);
	const notifySettingsChanged = () => { try { window.dispatchEvent(new CustomEvent("dsh-stock:settings")); } catch {} };
	const hRefresh = (e) => { const v = Number(e.target.value); setRefreshMs(v); state.settings.refreshMs = v; persistSettings(); if (state.settingsCtrl) state.settingsCtrl.set("refreshMs", v); notifySettingsChanged(); };
	const hTape = (e) => { const v = e.target.checked; setShowTape(v); state.settings.showTape = v; persistSettings(); if (state.settingsCtrl) state.settingsCtrl.set("showTape", v); notifySettingsChanged(); };
		const hWlInput = (e) => {
			const v = e.target.value; setWlInput(v); const q = v.trim();
			if (q.length < 1) { setWlAc([]); setWlAcIdx(-1); return; }
			const dict = suggestSymbols(q); setWlAc(dict); setWlAcIdx(-1);
			if (wlTimer.current) clearTimeout(wlTimer.current);
			wlTimer.current = setTimeout(async () => {
				const api = await fetchSuggestions(q);
				const seen = new Set(dict.map((x) => x.sym));
				const merged = dict.slice();
				for (const r of api) { if (!seen.has(r.sym)) { seen.add(r.sym); merged.push({ sym: r.sym, code: r.code, name: r.name, initials: "", mkt: r.mkt }); } }
				setWlAc(merged);
			}, 300);
		};
		const hWlKey = (e) => {
			if (e.key === "ArrowDown") { e.preventDefault(); setWlAcIdx((i) => Math.min(i + 1, wlAc.length - 1)); }
			else if (e.key === "ArrowUp") { e.preventDefault(); setWlAcIdx((i) => Math.max(i - 1, -1)); }
			else if (e.key === "Enter" && wlAcIdx >= 0 && wlAcIdx < wlAc.length) { e.preventDefault(); addWl(wlAc[wlAcIdx].sym); }
			else if (e.key === "Escape") { setWlAc([]); setWlAcIdx(-1); }
		};
	const addWl = (sym) => {
		const s = normalizeSymbol(String(sym));
		if (!s) return;
		if (!state.watchlist.includes(s)) { state.watchlist.push(s); persistWatchlist(); setWlItems([...state.watchlist]); }
		setWlInput(""); setWlAc([]); setWlAcIdx(-1);
	};
	const delWl = (sym) => { state.watchlist = state.watchlist.filter((s) => s !== sym); persistWatchlist(); setWlItems([...state.watchlist]); };
	const addPos = () => {
		const sym = normalizeSymbol(posSym.trim()), qty = Number(posQty), cost = Number(posCost);
			if (!sym || !isFinite(qty) || !isFinite(cost)) return;
			const idx = state.positions.findIndex((p) => p.symbol === sym);
			if (idx >= 0) { state.positions[idx] = { symbol: sym, qty, cost }; } else { state.positions.push({ symbol: sym, qty, cost }); }
			persistPositions(); setPosItems([...state.positions]); setPosSym(""); setPosQty(""); setPosCost("");
		};
		const delPos = (sym) => { state.positions = state.positions.filter((p) => p.symbol !== sym); persistPositions(); setPosItems([...state.positions]); };
		// 内联样式
		const s = { st: { fontSize: "14px", fontWeight: 600, marginBottom: "12px", paddingBottom: "8px", borderBottom: "1px solid var(--dsw-alias-border-divider, #e8eaed)" }, row: { marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }, lbl: { fontSize: "13px", minWidth: "70px" }, inp: { padding: "4px 8px", fontSize: "13px", border: "1px solid var(--dsw-alias-border-divider, #e8eaed)", borderRadius: "4px", background: "var(--dsw-alias-bg-layer-2, #fff)", color: "var(--dsw-alias-label-primary, #1b2431)" }, btn: { padding: "4px 12px", fontSize: "12px", border: "none", borderRadius: "4px", cursor: "pointer", background: "var(--dsw-alias-interactive-bg-hover, #eef1f5)", color: "var(--dsw-alias-label-primary, #1b2431)" }, dbtn: { padding: "2px 8px", fontSize: "11px", border: "none", borderRadius: "4px", cursor: "pointer", background: "#e02e3d20", color: "#e02e3d" }, tag: { display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", background: "var(--dsw-alias-interactive-bg-hover, #eef1f5)", borderRadius: "4px", fontSize: "12px", margin: "2px 4px 2px 0" }, dim: { fontSize: "12px", color: "var(--dsw-alias-label-tertiary, #666)" }, acPos: { position: "relative", display: "inline-block" }, acBox: { position: "absolute", top: "100%", left: 0, zIndex: 1000004, background: "var(--dsw-alias-bg-layer-2, #fff)", border: "1px solid var(--dsw-alias-border-divider, #e8eaed)", boxShadow: "0 4px 12px #17202d33", maxHeight: "200px", overflowY: "auto", minWidth: "260px" }, acIt: { padding: "4px 8px", cursor: "pointer", fontSize: "12px", display: "flex", gap: "8px" } };
		return react.createElement("div", { style: { padding: "4px 0" } },
			// === 行情设置 ===
			react.createElement("div", { style: s.st }, "行情设置"),
			react.createElement("div", { style: s.row },
				react.createElement("label", { style: s.lbl }, "刷新间隔"),
				react.createElement("select", { value: refreshMs, onChange: hRefresh, style: s.inp },
					react.createElement("option", { value: 15000 }, "15 秒"),
					react.createElement("option", { value: 30000 }, "30 秒"),
					react.createElement("option", { value: 60000 }, "60 秒")
				)
			),
			react.createElement("div", { style: s.row },
				react.createElement("label", { style: { ...s.lbl, display: "flex", alignItems: "center", gap: "6px" } },
					react.createElement("input", { type: "checkbox", checked: showTape, onChange: hTape }),
					" 跑马灯"
				)
			),
			// === 自选列表 ===
			react.createElement("div", { style: { ...s.st, marginTop: "20px" } }, "自选列表"),
			react.createElement("div", { style: s.row },
				react.createElement("div", { style: s.acPos },
					react.createElement("input", { style: { ...s.inp, width: "180px" }, value: wlInput, onChange: hWlInput, onKeyDown: hWlKey, placeholder: "代码/名称/首字母" }),
					wlAc.length > 0 && react.createElement("div", { style: s.acBox },
						wlAc.map((entry, i) => react.createElement("div", { key: entry.sym, style: i === wlAcIdx ? { ...s.acIt, background: "var(--dsw-alias-interactive-bg-hover, #eef1f5)" } : s.acIt, onMouseDown: () => addWl(entry.sym) },
							react.createElement("span", { style: { color: "var(--dsw-alias-label-tertiary, #666)", minWidth: "80px" } }, entry.sym),
							react.createElement("span", { style: { flex: 1 } }, entry.name),
							react.createElement("span", { style: { color: "var(--dsw-alias-label-tertiary, #666)", width: "30px", textAlign: "right" } }, entry.mkt)
						))
					)
				),
				react.createElement("button", { onClick: () => addWl(wlInput.trim()), style: s.btn }, "添加")
			),
			react.createElement("div", { style: { marginBottom: "10px" } },
				wlItems.length === 0
					? react.createElement("span", { style: s.dim }, "暂无自选。在上方输入代码/名称/首字母搜索后添加。")
					: wlItems.map((sym) => react.createElement("span", { key: sym, style: s.tag },
						react.createElement("span", null, sym),
						react.createElement("button", { style: s.dbtn, onClick: () => delWl(sym) }, "✕")
					))
			),
			// === 持仓管理 ===
			react.createElement("div", { style: { ...s.st, marginTop: "20px" } }, "持仓管理"),
			react.createElement("div", { style: s.row },
				react.createElement("input", { style: { ...s.inp, width: "100px" }, value: posSym, onChange: (e) => setPosSym(e.target.value), placeholder: "代码" }),
				react.createElement("input", { style: { ...s.inp, width: "70px" }, value: posQty, onChange: (e) => setPosQty(e.target.value), placeholder: "数量", type: "number" }),
				react.createElement("input", { style: { ...s.inp, width: "90px" }, value: posCost, onChange: (e) => setPosCost(e.target.value), placeholder: "成本价", type: "number" }),
				react.createElement("button", { onClick: addPos, style: s.btn }, "添加/更新")
			),
			react.createElement("div", { style: { fontSize: "12px" } },
				posItems.length === 0
					? react.createElement("span", { style: s.dim }, "暂无持仓。填入代码、数量、成本价后添加。")
					: posItems.map((p) => react.createElement("div", { key: p.symbol, style: { display: "flex", alignItems: "center", gap: "8px", padding: "3px 0", fontSize: "12px" } },
						react.createElement("span", { style: { minWidth: "80px", fontWeight: 500 } }, p.symbol),
						react.createElement("span", { style: { color: "var(--dsw-alias-label-tertiary, #666)" } }, `${p.qty} 股 @ ${Number(p.cost).toFixed(2)}`),
						react.createElement("button", { style: s.dbtn, onClick: () => delPos(p.symbol) }, "删除")
					))
			)
		);
	}
	/** 应用皮肤：body 属性、chrome 骨架、面板、轮询、系统设置卡。全部写操作由 effect disposer 收回。 */
	function apply(ctx) {
		const body = document.body;
		const originalTitle = document.title;
		body.dataset.dshStock = "";
		let disposed = false;
		// ---- 初始化 settingsScope ----
		try {
			const scope = ctx.get("settingsScope");
			if (scope) state.settingsCtrl = scope.bind({ namespace: "dsh-stock" });
		} catch {}
		// ---- 注册系统设置卡（settings.section = 在 设置 侧边栏出现独立分区） ----
		try {
			const slots = ctx.get("slots");
			if (slots) {
				slots.inject("settings.section", () => slots.register({
					name: "settings.section",
					id: "stock-terminal",
					order: 100,
					label: "股市行情",
					locale: "settings",
					inject: () => ({})
				}, StockSettingsCard));
			}
		} catch {}
		// ---- titlebar ----
		const titlebar = document.createElement("div");
		titlebar.className = "dsh-stk-titlebar"; titlebar.dataset.skinChrome = "titlebar";
		const brand = document.createElement("span"); brand.className = "dsh-stk-titlebarIcon"; brand.innerHTML = CANDLE_SVG;
		const title = document.createElement("span"); title.className = "dsh-stk-titlebarTitle"; title.textContent = SKIN_TITLE;
		const chips = document.createElement("span"); chips.className = "dsh-stk-titlebarChips"; chips.hidden = true;
		const posChip = document.createElement("span"); posChip.className = "dsh-stk-posChip"; titlebar.append(brand, title, posChip);
		// 设置齿轮按钮（标题栏右侧）
		const gearBtn = document.createElement("button");
		gearBtn.className = "dsh-stk-titlebarBtn"; gearBtn.title = "设置";
		gearBtn.innerHTML = "⚙"; gearBtn.setAttribute("aria-label", "设置");
		gearBtn.onclick = () => { state.settings.showPanel = true; state.settings.tab = "settings"; panel.hidden = false; persistSettings(); };
		titlebar.append(gearBtn);
		for (const glyph of TITLEBAR_GLYPHS) {
			const btn = document.createElement("span"); btn.className = "dsh-stk-titlebarBtn"; btn.setAttribute("aria-hidden", "true"); btn.textContent = glyph; titlebar.append(btn);
		}
		// ---- tape ----
		const tape = document.createElement("div"); tape.className = "dsh-stk-tape"; tape.dataset.skinChrome = "tape";
		const track = document.createElement("div"); track.className = "dsh-stk-tapeTrack"; tape.append(track);
		// ---- statusbar ----
		const statusbar = document.createElement("div"); statusbar.className = "dsh-stk-statusbar"; statusbar.dataset.skinChrome = "statusbar";
		const leftGroup = document.createElement("span"); leftGroup.className = "dsh-stk-statusbarGroup";
		const sessionCells = new Map(); const sessionLabels = [["aShare", "A股"], ["hk", "港股"], ["us", "美股"]];
		for (const [key, label] of sessionLabels) {
			const cell = document.createElement("span"); cell.className = "dsh-stk-statusbarCell"; cell.textContent = `${label} 休市`;
			sessionCells.set(key, cell); leftGroup.append(cell);
		}
		const idxGroup = document.createElement("span"); idxGroup.className = "dsh-stk-statusbarGroup";
		const idxLabel = document.createElement("span"); idxLabel.className = "dsh-stk-statusbarLabel"; idxLabel.textContent = "指数";
		const idxCells = [];
		for (let i = 0; i < INDEX_SYMBOLS.length; i += 1) {
			const cell = document.createElement("span"); cell.className = "dsh-stk-statusbarCell"; cell.textContent = "-- --";
			idxCells.push(cell); idxGroup.append(cell);
		}
		idxGroup.prepend(idxLabel);
		const pnlCell = document.createElement("span"); pnlCell.className = "dsh-stk-statusbarCell"; pnlCell.textContent = "总盈亏 --";
		const toggleBtn = document.createElement("button"); toggleBtn.className = "dsh-stk-statusbarBtn"; toggleBtn.type = "button"; toggleBtn.textContent = "行情";
		const setBtn = document.createElement("button"); setBtn.className = "dsh-stk-statusbarBtn"; setBtn.type = "button"; setBtn.textContent = "设置";
		const rightGroup = document.createElement("span"); rightGroup.className = "dsh-stk-statusbarGroup";
		for (const nodeState of ["就绪", "已连接", "在线"]) {
			const cell = document.createElement("span"); cell.className = "dsh-stk-statusbarCell"; cell.textContent = nodeState; rightGroup.append(cell);
		}
		const wsCell = document.createElement("span"); wsCell.className = "dsh-stk-statusbarCell"; wsCell.textContent = "工作区 --";
		rightGroup.append(wsCell);
		statusbar.append(leftGroup, idxGroup, pnlCell, toggleBtn, setBtn, rightGroup);
		// ---- panel ----
		const panel = document.createElement("div"); panel.className = "dsh-stk-panel"; panel.dataset.skinChrome = "panel";
		panel.hidden = !state.settings.showPanel;
		const dragbar = document.createElement("div"); dragbar.className = "dsh-stk-dragbar";
		const panelHead = document.createElement("div"); panelHead.className = "dsh-stk-panelHead";
		const panelTitle = document.createElement("span"); panelTitle.className = "dsh-stk-panelTitle"; panelTitle.textContent = "行情面板";
		const tabs = document.createElement("div"); tabs.className = "dsh-stk-tabs";
		const tabDefs = [["watchlist", "自选"], ["positions", "持仓"], ["settings", "设置"]];
		for (const [id, label] of tabDefs) {
			const tab = document.createElement("button"); tab.type = "button"; tab.className = "dsh-stk-tab"; tab.dataset.tab = id; tab.textContent = label; tabs.append(tab);
		}
		const closeBtn = document.createElement("button"); closeBtn.type = "button"; closeBtn.className = "dsh-stk-panelClose"; closeBtn.textContent = "×"; closeBtn.title = "关闭面板";
		panelHead.append(panelTitle, tabs, closeBtn);
		const panelBody = document.createElement("div"); panelBody.className = "dsh-stk-panelBody";
		panel.append(dragbar, panelHead, panelBody);
		// 面板各 section
		const sectionWatchlist = document.createElement("div"); sectionWatchlist.className = "dsh-stk-section"; sectionWatchlist.dataset.section = "watchlist";
		const wlForm = document.createElement("form"); wlForm.className = "dsh-stk-addrow";
		const wlInput = document.createElement("input"); wlInput.className = "dsh-stk-addinput"; wlInput.placeholder = "输入代码、名称或拼音首字母搜索"; wlInput.autocomplete = "off"; wlInput.spellcheck = false;
		const wlAddBtn = document.createElement("button"); wlAddBtn.type = "submit"; wlAddBtn.className = "dsh-stk-btn dsh-stk-btnPrimary"; wlAddBtn.textContent = "添加";
		// 自动补全下拉
		const acDropdown = document.createElement("div"); acDropdown.className = "dsh-stk-autocomplete";
		wlForm.append(wlInput, wlAddBtn, acDropdown);
		const wlList = document.createElement("div"); wlList.className = "dsh-stk-wlList";
		const wlHint = document.createElement("p"); wlHint.className = "dsh-stk-hint"; wlHint.textContent = "搜索联想：输入代码、名称或拼音首字母（如 600519 / 茅台 / gzmt）";
		sectionWatchlist.append(wlForm, wlList, wlHint);
		const sectionPositions = document.createElement("div"); sectionPositions.className = "dsh-stk-section"; sectionPositions.dataset.section = "positions";
		const posToolbar = document.createElement("div"); posToolbar.className = "dsh-stk-posToolbar";
		const addPosBtn = document.createElement("button"); addPosBtn.type = "button"; addPosBtn.className = "dsh-stk-btn dsh-stk-btnPrimary"; addPosBtn.textContent = "添加持仓";
		posToolbar.append(addPosBtn);
		const posForm = document.createElement("div"); posForm.className = "dsh-stk-posform"; posForm.hidden = true; posForm.dataset.mode = "add";
		const fSym = document.createElement("div"); fSym.className = "dsh-stk-formrow";
		const lSym = document.createElement("label"); lSym.textContent = "代码"; const iSym = document.createElement("input"); iSym.placeholder = "搜索代码、名称或拼音"; iSym.autocomplete = "off"; const acDropdownPos = document.createElement("div"); acDropdownPos.className = "dsh-stk-autocomplete"; fSym.append(lSym, iSym, acDropdownPos);
		const fQty = document.createElement("div"); fQty.className = "dsh-stk-formrow";
		const lQty = document.createElement("label"); lQty.textContent = "数量"; const iQty = document.createElement("input"); iQty.type = "number"; iQty.min = "0"; iQty.step = "any"; iQty.placeholder = "股数/张数"; fQty.append(lQty, iQty);
		const fCost = document.createElement("div"); fCost.className = "dsh-stk-formrow";
		const lCost = document.createElement("label"); lCost.textContent = "成本价"; const iCost = document.createElement("input"); iCost.type = "number"; iCost.min = "0"; iCost.step = "any"; iCost.placeholder = "买入均价"; fCost.append(lCost, iCost);
		const fBtns = document.createElement("div"); fBtns.className = "dsh-stk-formrow";
		const savePosBtn = document.createElement("button"); savePosBtn.type = "button"; savePosBtn.className = "dsh-stk-btn dsh-stk-btnPrimary"; savePosBtn.textContent = "保存";
		const cancelPosBtn = document.createElement("button"); cancelPosBtn.type = "button"; cancelPosBtn.className = "dsh-stk-btn"; cancelPosBtn.textContent = "取消";
		fBtns.append(savePosBtn, cancelPosBtn); posForm.append(fSym, fQty, fCost, fBtns);
		const posTable = document.createElement("table"); posTable.className = "dsh-stk-posTable";
		const posThead = document.createElement("thead");
		const headTr = document.createElement("tr");
		for (const th of ["代码/名称", "数量", "成本", "现价", "市值", "盈亏", "盈亏%", "操作"]) { const cell = document.createElement("th"); cell.textContent = th; headTr.append(cell); }
		posThead.append(headTr);
		const posTbody = document.createElement("tbody"); posTable.append(posThead, posTbody);
		const posSummary = document.createElement("div"); posSummary.className = "dsh-stk-posSummary";
		sectionPositions.append(posToolbar, posForm, posTable, posSummary);
		const sectionSettings = document.createElement("div"); sectionSettings.className = "dsh-stk-section"; sectionSettings.dataset.section = "settings";
		const setRow1 = document.createElement("div"); setRow1.className = "dsh-stk-setrow";
		const setLabel1 = document.createElement("label"); setLabel1.textContent = "行情刷新间隔";
		const refreshSelect = document.createElement("select");
		for (const ms of [15000, 30000, 60000]) { const opt = document.createElement("option"); opt.value = String(ms); opt.textContent = `${ms / 1000} 秒`; if (ms === state.settings.refreshMs) opt.selected = true; refreshSelect.append(opt); }
		setRow1.append(setLabel1, refreshSelect);
		const setRow2 = document.createElement("div"); setRow2.className = "dsh-stk-setrow";
		const tapeCheck = document.createElement("input"); tapeCheck.type = "checkbox"; tapeCheck.checked = state.settings.showTape;
		const setLabel2 = document.createElement("label"); setLabel2.textContent = "显示行情跑马灯"; setRow2.append(tapeCheck, setLabel2);
		const note = document.createElement("div"); note.className = "dsh-stk-note"; note.textContent = "行情来源：腾讯行情（A股/港股/美股/指数，当地代理解码 GBK）、Binance（加密货币 24h）、Frankfurter（外汇基准）。默认 30 秒刷新。自选与持仓保存在浏览器 localStorage。";
		const dangerRow = document.createElement("div"); dangerRow.className = "dsh-stk-danger-row";
		const clearWlBtn = document.createElement("button"); clearWlBtn.type = "button"; clearWlBtn.className = "dsh-stk-btn"; clearWlBtn.textContent = "清空自选";
		const clearPosBtn = document.createElement("button"); clearPosBtn.type = "button"; clearPosBtn.className = "dsh-stk-btn"; clearPosBtn.textContent = "清空持仓";
		dangerRow.append(clearWlBtn, clearPosBtn); sectionSettings.append(setRow1, setRow2, note, dangerRow);
		panelBody.append(sectionWatchlist, sectionPositions, sectionSettings);
		// ---- favicon / title ----
		const favicon = document.createElement("link"); favicon.rel = "icon"; favicon.href = `data:image/svg+xml;utf8,${encodeURIComponent(FAVICON_SVG)}`;
		document.title = SKIN_TITLE; document.head.append(favicon);
		body.append(titlebar, tape, statusbar, panel);
		// ---- render helpers ----
	let tapeSignature = "";
	function renderTape() {
		const active = state.settings.showTape && state.watchlist.length > 0;
		const shownSymbols = active ? state.watchlist : DEFAULT_WATCHLIST;
		const signature = `${active ? "1" : "0"}|${shownSymbols.join(",")}`;
		if (signature !== tapeSignature) {
			// 自选列表/开关变化时才重建结构；日常刷新只原地更新数字，跑马灯动画不重置
			tapeSignature = signature;
			track.textContent = "";
			for (let copy = 0; copy < 2; copy += 1) for (const symbol of shownSymbols) {
				const item = document.createElement("span"); item.className = "dsh-stk-tapeItem"; item.dataset.symbol = symbol;
				buildQuoteLine(item, quoteOf(symbol), "dsh-stk-tapeName", "dsh-stk-tapePrice", "dsh-stk-tapeChg");
				track.append(item);
			}
			track.style.animationDuration = `${Math.max(30, shownSymbols.length * 4)}s`;
		} else {
			for (const item of track.children) updateQuoteLine(item, quoteOf(item.dataset.symbol ?? ""));
		}
		track.style.animationPlayState = active ? "" : "paused";
	}
		function renderPosChip() {
		posChip.textContent = "";
		const all = state.positions.slice();
		if (all.length === 0) return;
		function getName(sym) {
			const q = state.quotes.get(sym);
			if (q && q.name && q.name !== sym) return q.name;
			const entry = SYMBOL_DICT.find((e) => e.sym === sym);
			return entry ? entry.name : sym;
		}
		function makeItem(p) {
			const quote = state.quotes.get(p.symbol);
			const qty = Number(p.qty), cost = Number(p.cost);
			const item = document.createElement("span"); item.className = "posItem"; item.dataset.symbol = p.symbol;
			const sym = document.createElement("span"); sym.className = "posSym"; sym.textContent = getName(p.symbol);
			item.append(sym);
			if (quote && Number.isFinite(quote.price) && Number.isFinite(qty) && Number.isFinite(cost)) {
				const mv = quote.price * qty, costBasis = cost * qty;
				const pnl = mv - costBasis;
				const pct = costBasis > 0 ? (pnl / costBasis) * 100 : NaN;
				const val = document.createElement("span");
				val.textContent = `${pnl >= 0 ? "+" : ""}${Number.isFinite(pct) ? pct.toFixed(1) + "%" : "--"}`;
				if (pnl > 0) item.dataset.trend = "up"; else if (pnl < 0) item.dataset.trend = "down";
				item.append(val);
			}
			return item;
		}
		const itemEls = all.map(makeItem);
		itemEls.forEach((el) => posChip.append(el));
		const stats = portfolioStats();
		let totalEl = null;
		if (Number.isFinite(stats.totalPnl) && Math.abs(stats.totalPnl) > 0.01) {
			totalEl = document.createElement("span"); totalEl.className = "posItem";
			if (stats.totalPnl > 0) totalEl.dataset.trend = "up"; else totalEl.dataset.trend = "down";
			totalEl.textContent = `总 ${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(0)}`;
			posChip.append(totalEl);
		}
		// 按可用宽度自适应：空间不足时从末尾收起持仓项，显示「等 N 只」
		let moreEl = null, hidden = 0, lastIdx = itemEls.length - 1;
		const ensureMore = () => {
			if (hidden <= 0) { if (moreEl) { moreEl.remove(); moreEl = null; } return; }
			if (!moreEl) {
				moreEl = document.createElement("span"); moreEl.className = "posItem"; moreEl.style.color = "var(--stk-dim)";
				if (totalEl) posChip.insertBefore(moreEl, totalEl); else posChip.append(moreEl);
			}
			moreEl.textContent = `等 ${hidden} 只`;
		};
		const fit = () => {
			let guard = 0;
			while (lastIdx >= 0 && posChip.scrollWidth > posChip.clientWidth + 1 && guard++ < 50) {
				itemEls[lastIdx].style.display = "none";
				lastIdx -= 1; hidden += 1;
				ensureMore();
			}
			guard = 0;
			while (totalEl && posChip.scrollWidth > posChip.clientWidth + 1 && guard++ < 10) {
				totalEl.style.display = "none";
			}
		};
		fit();
	}
		function renderChips() {
			chips.textContent = "";
			const shown = state.watchlist.length > 0 ? state.watchlist.slice(0, 3).map(quoteOf) : DEFAULT_WATCHLIST.slice(0, 3).map(placeholderQuote);
			for (const quote of shown) {
				const chip = document.createElement("span"); chip.className = "dsh-stk-chip";
				renderQuoteLine(chip, quote, "dsh-stk-chipName", "dsh-stk-chipVal", "dsh-stk-chipChg"); chips.append(chip);
			}
		}
		function renderIndexCells() {
			for (let i = 0; i < idxCells.length; i += 1) {
				const cell = idxCells[i]; const symbol = INDEX_SYMBOLS[i]; const quote = state.quotes.get(symbol);
				if (quote === void 0) { cell.textContent = "-- --"; delete cell.dataset.trend; continue; }
				cell.textContent = `${quote.name} ${priceText(quote.price)}`;
				const trend = trendOf(quote); const chg = document.createElement("span");
				chg.textContent = `${trend === "up" ? "▲" : trend === "down" ? "▼" : ""}${pctText(trend, quote.changePct)}`;
				cell.append(" ", chg); applyTrend(cell, trend);
			}
		}
		function portfolioStats() {
			let totalMv = 0, totalCost = 0;
			for (const pos of state.positions) {
				const price = state.quotes.get(pos.symbol)?.price;
				const qty = Number(pos.qty), cost = Number(pos.cost);
				if (!Number.isFinite(price) || !Number.isFinite(qty)) continue;
				totalMv += price * qty; if (Number.isFinite(cost)) totalCost += cost * qty;
			}
			const totalPnl = totalMv - totalCost, totalPnlPct = totalCost > 0 ? totalPnl / totalCost * 100 : NaN;
			return { totalMv, totalCost, totalPnl, totalPnlPct };
		}
		function renderPnlCell() {
			const stats = portfolioStats(); const trend = stats.totalPnl > 0 ? "up" : stats.totalPnl < 0 ? "down" : "flat";
			pnlCell.textContent = `总盈亏 ${signedMoneyText(stats.totalPnl)}`; applyTrend(pnlCell, trend);
		}
		function renderSessions(now) {
			const phases = marketSessions(now);
			for (const [key, cell] of sessionCells) { const phase = phases[key]; cell.textContent = `${sessionLabels.find(([k]) => k === key)?.[1] ?? key} ${phaseLabel(phase)}`; cell.dataset.phase = phase; }
		}
		function renderWatchlist() {
			wlList.textContent = "";
			if (state.watchlist.length === 0) {
				const empty = document.createElement("div"); empty.className = "dsh-stk-empty";
				empty.textContent = "暂无自选。在上方输入代码/名称/拼音搜索添加。"; wlList.append(empty); return;
			}
			state.watchlist.forEach((symbol, index) => {
				const quote = quoteOf(symbol); const row = document.createElement("div"); row.className = "dsh-stk-wlRow"; row.dataset.symbol = symbol;
				const name = document.createElement("span"); name.className = "dsh-stk-wlName"; name.textContent = quote.name;
				const sym = document.createElement("span"); sym.className = "dsh-stk-wlSym"; sym.textContent = symbol;
				const price = document.createElement("span"); price.className = "dsh-stk-wlPrice"; price.textContent = priceText(quote.price);
				const chg = document.createElement("span"); chg.className = "dsh-stk-wlChg"; const trend = trendOf(quote);
				chg.textContent = `${trend === "up" ? "▲" : trend === "down" ? "▼" : ""}${pctText(trend, quote.changePct)}`; applyTrend(chg, trend);
				const up = document.createElement("button"); up.type = "button"; up.className = "dsh-stk-rowbtn"; up.dataset.act = "up"; up.textContent = "↑"; up.title = "上移";
				const down = document.createElement("button"); down.type = "button"; down.className = "dsh-stk-rowbtn"; down.dataset.act = "down"; down.textContent = "↓"; down.title = "下移";
				const remove = document.createElement("button"); remove.type = "button"; remove.className = "dsh-stk-rowbtn danger"; remove.dataset.act = "remove"; remove.textContent = "×"; remove.title = "移除";
				row.append(name, sym, price, chg, up, down, remove); wlList.append(row);
			});
		}
		function renderPositions() {
			posTbody.textContent = "";
			if (state.positions.length === 0) {
				const tr = document.createElement("tr"); const td = document.createElement("td"); td.colSpan = 8; td.className = "dsh-stk-empty"; td.textContent = "暂无持仓。点击「添加持仓」记录。"; tr.append(td); posTbody.append(tr); posSummary.textContent = ""; return;
			}
			for (const pos of state.positions) {
				const quote = quoteOf(pos.symbol), qty = Number(pos.qty), cost = Number(pos.cost), price = quote.price;
				const mv = Number.isFinite(price) && Number.isFinite(qty) ? price * qty : NaN;
				const costValue = Number.isFinite(cost) && Number.isFinite(qty) ? cost * qty : NaN;
				const pnl = Number.isFinite(mv) && Number.isFinite(costValue) ? mv - costValue : NaN;
				const pnlPct = Number.isFinite(costValue) && costValue > 0 && Number.isFinite(pnl) ? pnl / costValue * 100 : NaN;
				const trend = pnl > 0 ? "up" : pnl < 0 ? "down" : "flat";
				const tr = document.createElement("tr");
				const tdName = document.createElement("td"); const nameSpan = document.createElement("span"); nameSpan.className = "dsh-stk-posName"; nameSpan.textContent = quote.name; const symSpan = document.createElement("span"); symSpan.className = "dsh-stk-posSym"; symSpan.textContent = ` ${pos.symbol}`; tdName.append(nameSpan, symSpan);
				const tdQty = document.createElement("td"); tdQty.textContent = Number.isFinite(qty) ? String(qty) : "--";
				const tdCost = document.createElement("td"); tdCost.textContent = Number.isFinite(cost) ? Number(cost).toFixed(3) : "--";
				const tdPrice = document.createElement("td"); tdPrice.textContent = priceText(price);
				const tdMv = document.createElement("td"); tdMv.textContent = moneyText(mv);
				const tdPnl = document.createElement("td"); tdPnl.className = "dsh-stk-trend"; tdPnl.textContent = signedMoneyText(pnl); applyTrend(tdPnl, trend);
				const tdPnlPct = document.createElement("td"); tdPnlPct.className = "dsh-stk-trend"; tdPnlPct.textContent = Number.isFinite(pnlPct) ? `${pnlPct > 0 ? "+" : ""}${pnlPct.toFixed(2)}%` : "--"; applyTrend(tdPnlPct, trend);
				const tdOps = document.createElement("td");
				const editBtn = document.createElement("button"); editBtn.type = "button"; editBtn.className = "dsh-stk-btnDanger"; editBtn.dataset.act = "edit"; editBtn.textContent = "改";
				const delBtn = document.createElement("button"); delBtn.type = "button"; delBtn.className = "dsh-stk-btnDanger"; delBtn.dataset.act = "del"; delBtn.textContent = "删";
				tdOps.append(editBtn, delBtn); tr.append(tdName, tdQty, tdCost, tdPrice, tdMv, tdPnl, tdPnlPct, tdOps); tr.dataset.symbol = pos.symbol; posTbody.append(tr);
			}
			const stats = portfolioStats(); posSummary.textContent = "";
			const mvSpan = document.createElement("span"); mvSpan.textContent = `总市值 ${moneyText(stats.totalMv)}`;
			const pnlSpan = document.createElement("span"); pnlSpan.className = "dsh-stk-trend"; pnlSpan.textContent = `总盈亏 ${signedMoneyText(stats.totalPnl)}（${Number.isFinite(stats.totalPnlPct) ? `${stats.totalPnlPct.toFixed(2)}%` : "--"}）`;
			applyTrend(pnlSpan, stats.totalPnl > 0 ? "up" : stats.totalPnl < 0 ? "down" : "flat");
			const detail = document.createElement("span"); detail.className = "dsh-stk-dim"; detail.textContent = `成本 ${moneyText(stats.totalCost)}`;
			posSummary.append(mvSpan, pnlSpan, detail);
		}
		function renderPanelTabs() {
			for (const tab of tabs.querySelectorAll(".dsh-stk-tab")) tab.setAttribute("aria-selected", String(tab.dataset.tab === state.settings.tab));
			for (const section of panelBody.querySelectorAll(".dsh-stk-section")) section.hidden = section.dataset.section !== state.settings.tab;
		}
		function renderAll() { renderTape(); renderChips(); renderPosChip(); renderIndexCells(); renderPnlCell(); renderWatchlist(); renderPositions(); renderPanelTabs(); }
		// ---- data refresh ----
		const connection = (() => { try { return ctx.get("connection"); } catch { return; } })();
	let quotesInFlight = false;
	let quotesFailureNotified = false;
	const refreshQuotes = async () => {
		if (disposed || quotesInFlight) return;
		quotesInFlight = true;
		try {
			const wanted = [...new Set([...state.watchlist, ...state.positions.map((p) => p.symbol), ...INDEX_SYMBOLS])];
			const quotes = await fetchQuotes(wanted);
			if (disposed) return; state.quotes = new Map(quotes.map((q) => [q.symbol, q]));
			if (quotes.length === 0 && wanted.length > 0) {
				// 全部数据源失败：只提示一次，避免轮询期间反复打扰；恢复后自动复位
				if (!quotesFailureNotified) { quotesFailureNotified = true; toast("行情数据源暂时不可用，稍后自动重试"); }
			} else quotesFailureNotified = false;
			renderTape(); renderChips(); renderPosChip(); renderIndexCells(); renderPnlCell(); renderWatchlist(); renderPositions();
		} catch {
		} finally {
			quotesInFlight = false;
		}
	};
		const refreshWorkspaces = async () => {
			if (connection === void 0 || disposed) return;
			try { const list = await connection.api.workspace.list({}); if (!list.result.ok) return; if (disposed) return; wsCell.textContent = `工作区 ${list.result.value.items.length}`; } catch { wsCell.textContent = "工作区 --"; }
		};
		// ---- autocomplete ----
		let acIndex = -1, acResults = [];
		function closeDropdown() { acDropdown.classList.remove("open"); acDropdown.textContent = ""; acIndex = -1; acResults = []; }
		function renderDropdown(results) {
			acDropdown.textContent = ""; acResults = results; acIndex = -1;
			if (results.length === 0) { acDropdown.classList.remove("open"); return; }
			acDropdown.classList.add("open");
			results.forEach((entry, i) => {
				const item = document.createElement("div"); item.className = "dsh-stk-acItem"; item.dataset.index = String(i);
				const code = document.createElement("span"); code.className = "acCode"; code.textContent = entry.sym;
				const name = document.createElement("span"); name.className = "acName"; name.textContent = entry.name;
				const mkt = document.createElement("span"); mkt.className = "acMarket"; mkt.textContent = entry.mkt;
				item.append(code, name, mkt);
				item.onclick = () => { selectSuggestion(entry); };
				acDropdown.append(item);
			});
		}
		function selectSuggestion(entry) { addSymbol(entry.sym); closeDropdown(); wlInput.value = ""; wlInput.focus(); }
	function addSymbol(symbol) {
		const sym = normalizeSymbol(String(symbol));
		if (!state.watchlist.includes(sym)) { state.watchlist.push(sym); persistWatchlist(); renderWatchlist(); renderTape(); renderChips(); toast(`已加入自选：${sym}`); } else { toast("已在自选中：" + sym); }
		refreshQuotes();
	}
	let suggestTimer = 0, suggestSeq = 0;
	wlInput.addEventListener("input", () => {
		const q = wlInput.value.trim();
		if (q.length < 1) { closeDropdown(); suggestSeq += 1; return; }
		// 词典搜索即时展示
		const dictResults = suggestSymbols(q);
		renderDropdown(dictResults);
		// 宿主导建议 API 搜索（300ms 防抖），补充词典未收录的品种
		// seq 计数器防止慢的旧请求返回后覆盖新输入的结果（乱序竞态）
		clearTimeout(suggestTimer);
		const seq = ++suggestSeq;
		suggestTimer = window.setTimeout(async () => {
			const apiResults = await fetchSuggestions(q);
			if (seq !== suggestSeq || document.activeElement !== wlInput || disposed) return;
			const merged = [...dictResults];
			const seen = new Set(dictResults.map((e) => e.sym));
			for (const r of apiResults) {
				if (!seen.has(r.sym)) { seen.add(r.sym); merged.push({ sym: r.sym, code: r.code, name: r.name, initials: "", mkt: r.mkt }); }
			}
			renderDropdown(merged);
		}, 300);
	});
		wlInput.addEventListener("keydown", (e) => {
			if (e.key === "ArrowDown") { e.preventDefault(); if (acResults.length === 0) return; acIndex = Math.min(acIndex + 1, acResults.length - 1); acDropdown.querySelectorAll(".dsh-stk-acItem").forEach((el, i) => el.setAttribute("aria-selected", String(i === acIndex))); }
			else if (e.key === "ArrowUp") { e.preventDefault(); if (acResults.length === 0) return; acIndex = Math.max(acIndex - 1, -1); acDropdown.querySelectorAll(".dsh-stk-acItem").forEach((el, i) => el.setAttribute("aria-selected", String(i === acIndex))); }
			else if (e.key === "Enter" && acIndex >= 0 && acIndex < acResults.length) { e.preventDefault(); selectSuggestion(acResults[acIndex]); }
			else if (e.key === "Escape") { closeDropdown(); }
		});
		wlInput.addEventListener("blur", () => setTimeout(closeDropdown, 200));
		wlForm.addEventListener("submit", (event) => {
			event.preventDefault();
			const raw = wlInput.value.trim();
			if (raw === "") return;
			const symbol = raw.toUpperCase().startsWith("SH") || raw.toUpperCase().startsWith("SZ") || raw.toUpperCase().startsWith("HK") || raw.toUpperCase().startsWith("US")
				? raw.replace(/^(sh|sz|hk|us)/i, (m) => m.toLowerCase()) : raw;
			addSymbol(symbol); wlInput.value = "";
		});
		wlList.addEventListener("click", (event) => {
			const btn = event.target.closest(".dsh-stk-rowbtn"); const row = event.target.closest(".dsh-stk-wlRow");
			if (!btn || !row) return; const symbol = row.dataset.symbol; const index = state.watchlist.indexOf(symbol);
			if (index < 0) return; const act = btn.dataset.act;
			if (act === "up" && index > 0) { const [it] = state.watchlist.splice(index, 1); state.watchlist.splice(index - 1, 0, it); persistWatchlist(); }
			else if (act === "down" && index < state.watchlist.length - 1) { const [it] = state.watchlist.splice(index, 1); state.watchlist.splice(index + 1, 0, it); persistWatchlist(); }
			else if (act === "remove") { state.watchlist.splice(index, 1); persistWatchlist(); toast(`已移除 ${symbol}`); }
			renderWatchlist(); renderTape(); renderChips();
		});
		const openPosForm = (symbol, qty, cost) => { closeDropdownPos(); iSym.value = symbol ?? ""; iQty.value = qty !== void 0 ? String(qty) : ""; iCost.value = cost !== void 0 ? String(cost) : ""; posForm.hidden = false; posForm.dataset.mode = symbol ? "edit" : "add"; iSym.focus(); };
		const closePosForm = () => { closeDropdownPos(); posForm.hidden = true; };
		// positions autocomplete
		let posAcIndex = -1, posAcResults = [];
		function closeDropdownPos() { acDropdownPos.classList.remove("open"); acDropdownPos.textContent = ""; posAcIndex = -1; posAcResults = []; }
		function renderDropdownPos(results) { acDropdownPos.textContent = ""; posAcResults = results; posAcIndex = -1; if (results.length === 0) { acDropdownPos.classList.remove("open"); return; } acDropdownPos.classList.add("open"); results.forEach((entry, i) => { const item = document.createElement("div"); item.className = "dsh-stk-acItem"; item.dataset.index = String(i); const code = document.createElement("span"); code.className = "acCode"; code.textContent = entry.sym; const name = document.createElement("span"); name.className = "acName"; name.textContent = entry.name; const mkt = document.createElement("span"); mkt.className = "acMarket"; mkt.textContent = entry.mkt; item.append(code, name, mkt); item.onclick = () => { iSym.value = entry.sym; closeDropdownPos(); iSym.focus(); }; acDropdownPos.append(item); }); }
		let posSuggestTimer = 0, posSuggestSeq = 0;
		iSym.addEventListener("input", () => {
			const q = iSym.value.trim();
			if (q.length < 1) { closeDropdownPos(); posSuggestSeq += 1; return; }
			const dictResults = suggestSymbols(q);
			renderDropdownPos(dictResults);
			clearTimeout(posSuggestTimer);
			const seq = ++posSuggestSeq;
			posSuggestTimer = window.setTimeout(async () => {
				const apiResults = await fetchSuggestions(q);
				if (seq !== posSuggestSeq || document.activeElement !== iSym || disposed) return;
				const merged = [...dictResults];
				const seen = new Set(dictResults.map((e) => e.sym));
				for (const r of apiResults) { if (!seen.has(r.sym)) { seen.add(r.sym); merged.push({ sym: r.sym, code: r.code, name: r.name, initials: "", mkt: r.mkt }); } }
				renderDropdownPos(merged);
			}, 300);
		});
		iSym.addEventListener("keydown", (e) => {
			if (e.key === "ArrowDown") { e.preventDefault(); if (posAcResults.length === 0) return; posAcIndex = Math.min(posAcIndex + 1, posAcResults.length - 1); acDropdownPos.querySelectorAll(".dsh-stk-acItem").forEach((el, i) => el.setAttribute("aria-selected", String(i === posAcIndex))); }
			else if (e.key === "ArrowUp") { e.preventDefault(); if (posAcResults.length === 0) return; posAcIndex = Math.max(posAcIndex - 1, -1); acDropdownPos.querySelectorAll(".dsh-stk-acItem").forEach((el, i) => el.setAttribute("aria-selected", String(i === posAcIndex))); }
			else if (e.key === "Enter" && posAcIndex >= 0 && posAcIndex < posAcResults.length) { e.preventDefault(); iSym.value = posAcResults[posAcIndex].sym; closeDropdownPos(); }
			else if (e.key === "Escape") { closeDropdownPos(); }
		});
		iSym.addEventListener("blur", () => setTimeout(closeDropdownPos, 200));
		const submitPosForm = () => {
		const symbol = normalizeSymbol(iSym.value.trim()); const qty = Number(iQty.value); const cost = Number(iCost.value);
			if (symbol === "" || classifyDirectSymbol(symbol) === null) { toast("请填写正确的代码（如 sh600519）"); return; }
			if (!Number.isFinite(qty) || qty <= 0) { toast("数量需为正数"); return; }
			if (!Number.isFinite(cost) || cost < 0) { toast("成本价需为非负数"); return; }
			const mode = posForm.dataset.mode;
			if (mode === "edit") { const existing = state.positions.find((p) => p.symbol === symbol); if (existing) { existing.qty = qty; existing.cost = cost; } else { state.positions.push({ symbol, qty, cost }); } }
			else { const existing = state.positions.find((p) => p.symbol === symbol); if (existing) { existing.qty = qty; existing.cost = cost; toast(`${symbol} 已存在，已更新`); } else { state.positions.push({ symbol, qty, cost }); } }
			persistPositions(); closePosForm(); renderPositions(); renderPnlCell(); refreshQuotes();
		};
		addPosBtn.addEventListener("click", () => openPosForm());
		savePosBtn.addEventListener("click", submitPosForm);
		cancelPosBtn.addEventListener("click", closePosForm);
		posForm.addEventListener("keydown", (event) => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) { event.preventDefault(); submitPosForm(); } });
		posTable.addEventListener("click", (event) => {
			const btn = event.target.closest(".dsh-stk-btnDanger"); const tr = event.target.closest("tr");
			if (!btn || !tr) return; const symbol = tr.dataset.symbol; const act = btn.dataset.act;
			if (act === "edit") { const pos = state.positions.find((p) => p.symbol === symbol); if (pos) openPosForm(pos.symbol, pos.qty, pos.cost); }
			else if (act === "del") { state.positions = state.positions.filter((p) => p.symbol !== symbol); persistPositions(); renderPositions(); renderPnlCell(); toast(`已删除持仓 ${symbol}`); }
		});
		refreshSelect.addEventListener("change", () => {
			state.settings.refreshMs = Number(refreshSelect.value); persistSettings();
			if (state.settingsCtrl) state.settingsCtrl.set("refreshMs", state.settings.refreshMs);
			startTimers(); toast(`刷新间隔 ${state.settings.refreshMs / 1000} 秒`);
		});
		tapeCheck.addEventListener("change", () => { state.settings.showTape = tapeCheck.checked; persistSettings(); if (state.settingsCtrl) state.settingsCtrl.set("showTape", state.settings.showTape); renderTape(); });
		clearWlBtn.addEventListener("click", () => { armButton(clearWlBtn, "清空自选", () => { state.watchlist = []; persistWatchlist(); renderWatchlist(); renderTape(); renderChips(); toast("已清空自选"); }); });
		clearPosBtn.addEventListener("click", () => { armButton(clearPosBtn, "清空持仓", () => { state.positions = []; persistPositions(); renderPositions(); renderPnlCell(); toast("已清空持仓"); }); });
		// panel interactions
		const showPanel = (show) => { state.settings.showPanel = show; panel.hidden = !show; persistSettings(); };
		toggleBtn.addEventListener("click", () => { state.settings.tab = "watchlist"; showPanel(panel.hidden); });
		setBtn.addEventListener("click", () => { state.settings.tab = "settings"; showPanel(true); });
		// 拖动伸缩条：鼠标拖动调整面板高度，结果持久化
		let dragActive = false;
		function startDrag(initialY) {
			dragActive = true;
			dragbar.dataset.dragging = "";
			const startH = panel.offsetHeight;
			const startY = initialY;
			function onMove(e) {
				if (!dragActive) return;
				const dy = startY - e.clientY;
				const nh = Math.min(Math.max(startH + dy, 260), window.innerHeight - 150);
				panel.style.height = nh + "px";
				panel.style.maxHeight = "none";
				panel.style.width = "";
				panel.style.resize = "";
			}
			function onUp() {
				dragActive = false;
				delete dragbar.dataset.dragging;
				document.removeEventListener("mousemove", onMove);
				document.removeEventListener("mouseup", onUp);
				try { localStorage.setItem(PANEL_HEIGHT_KEY, panel.style.height); } catch {}
			}
			document.addEventListener("mousemove", onMove);
			document.addEventListener("mouseup", onUp);
		}
		dragbar.addEventListener("mousedown", (e) => { if (e.button === 0) { e.preventDefault(); startDrag(e.clientY); } });
		// 恢复持久化的面板高度
		try { const saved = localStorage.getItem(PANEL_HEIGHT_KEY); if (saved) { panel.style.height = saved; panel.style.maxHeight = "none"; } } catch {}
		closeBtn.addEventListener("click", () => showPanel(false));
		tabs.addEventListener("click", (event) => { const tab = event.target.closest(".dsh-stk-tab"); if (!tab) return; state.settings.tab = tab.dataset.tab; persistSettings(); renderPanelTabs(); });
		// ---- stock popup（点击跑马灯查看个股 K 线） ----
	let popupEl = null, popupKeydown = null, popupResize = null, popupSeq = 0;
	function closeStockPopup() {
		popupSeq += 1;
		if (popupEl !== null) { popupEl.remove(); popupEl = null; }
		if (popupKeydown !== null) { document.removeEventListener("keydown", popupKeydown); popupKeydown = null; }
		if (popupResize !== null) { window.removeEventListener("resize", popupResize); popupResize = null; }
	}
	function openStockPopup(symbol) {
		if (disposed) return;
		const sym = normalizeSymbol(String(symbol));
		if (sym === "" || classifyDirectSymbol(sym) === null) { toast("无法识别的代码：" + sym); return; }
		closeStockPopup();
		// seq 守卫：快速切换/关闭后，迟到的旧请求不覆盖新弹窗
		const seq = ++popupSeq;
		const quote = quoteOf(sym);
		const backdrop = document.createElement("div"); backdrop.className = "dsh-stk-modal";
		const card = document.createElement("div"); card.className = "dsh-stk-modalCard";
		const head = document.createElement("div"); head.className = "dsh-stk-modalHead";
		const nameEl = document.createElement("span"); nameEl.className = "dsh-stk-modalName"; nameEl.textContent = quote.name !== "" && quote.name !== sym ? quote.name : sym;
		const symEl = document.createElement("span"); symEl.className = "dsh-stk-modalSym"; symEl.textContent = sym;
		const qline = document.createElement("span"); qline.className = "dsh-stk-modalQuote";
		const priceEl = document.createElement("span"); priceEl.textContent = priceText(quote.price);
		const chgEl = document.createElement("span"); const trend = trendOf(quote); chgEl.dataset.trend = trend;
		chgEl.textContent = `${trend === "up" ? "▲" : trend === "down" ? "▼" : ""}${pctText(trend, quote.changePct)}`;
		const closeBtn = document.createElement("button"); closeBtn.type = "button"; closeBtn.className = "dsh-stk-modalClose"; closeBtn.title = "关闭 (Esc)"; closeBtn.textContent = "✕";
		qline.append(priceEl, chgEl);
		const periodBtns = document.createElement("div"); periodBtns.className = "dsh-stk-modalPeriods";
		const PERIODS = [["day", "日K"], ["week", "周K"], ["month", "月K"]];
		let currentPeriod = "day";
		for (const [id, label] of PERIODS) {
			const btn = document.createElement("button"); btn.dataset.period = id; btn.textContent = label;
			if (id === currentPeriod) btn.dataset.active = "";
			btn.addEventListener("click", () => {
				if (id === currentPeriod) return;
				currentPeriod = id;
				periodBtns.querySelectorAll("button").forEach((b) => { if (b.dataset.period === id) b.dataset.active = ""; else delete b.dataset.active; });
				load();
			});
			periodBtns.append(btn);
		}
		head.append(nameEl, symEl, periodBtns, qline, closeBtn);
		const bodyBox = document.createElement("div"); bodyBox.className = "dsh-stk-modalBody";
		const canvas = document.createElement("canvas");
		const msg = document.createElement("div"); msg.className = "dsh-stk-modalMsg";
		const msgLine = document.createElement("div"); msgLine.textContent = "加载K线中…";
		msg.append(msgLine);
		bodyBox.append(canvas, msg);
		const foot = document.createElement("div"); foot.className = "dsh-stk-modalFoot";
		card.append(head, bodyBox, foot);
		backdrop.append(card);
		document.body.append(backdrop);
		popupEl = backdrop;
		let barsCache = null;
		popupKeydown = (event) => { if (event.key === "Escape") { event.stopPropagation(); closeStockPopup(); } };
		document.addEventListener("keydown", popupKeydown);
		popupResize = () => { if (popupEl === backdrop && barsCache !== null && canvas.clientWidth > 0) drawKlineChart(canvas, barsCache); };
		window.addEventListener("resize", popupResize);
		backdrop.addEventListener("click", (event) => { if (event.target === backdrop) closeStockPopup(); });
		closeBtn.addEventListener("click", closeStockPopup);
		const showMsg = (text, retry) => {
			msg.textContent = ""; msgLine.textContent = text; msg.append(msgLine);
			if (retry) { const btn = document.createElement("button"); btn.type = "button"; btn.className = "dsh-stk-btn"; btn.textContent = "重试"; btn.addEventListener("click", () => { load(); }); msg.append(btn); }
		};
		const load = async () => {
			if (disposed) return;
			msg.style.display = ""; showMsg("加载K线中…", false);
			try {
				const reqCount = currentPeriod === "day" ? 120 : 320;
		let bars = await fetchKline(sym, reqCount, currentPeriod);
		bars = aggregateToPeriod(bars, currentPeriod);
		if (bars.length === 0) throw new Error("kline-empty");
				if (disposed || seq !== popupSeq || popupEl !== backdrop) return;
				barsCache = bars;
				msg.style.display = "none";
				drawKlineChart(canvas, bars);
				// footer：根数 / 区间涨跌 / MA 图例
				const first = bars[0], last = bars[bars.length - 1];
				const rangePct = first.c > 0 ? (last.c / first.c - 1) * 100 : NaN;
				const mk = (text, color) => { const s = document.createElement("span"); if (color) s.style.color = color; s.textContent = text; return s; };
				foot.textContent = "";
				foot.append(
					mk(`日K ${bars.length} 根`),
					mk(Number.isFinite(rangePct) ? `区间 ${rangePct > 0 ? "+" : ""}${rangePct.toFixed(2)}%` : "区间 --"),
					mk("MA5", "#c08a35"),
					mk("MA10", "#4a7ede")
				);
			} catch (error) {
				if (disposed || seq !== popupSeq || popupEl !== backdrop) return;
				const reason = error instanceof Error ? error.message : "error";
				msg.style.display = "";
				showMsg(reason === "kline-unsupported-symbol" ? `${sym}：该品种（外汇）暂无K线数据源` : `${sym}：K线加载失败（${reason}）`, true);
			}
		};
		load();
	}
	tape.addEventListener("click", (event) => {
		const target = event.target instanceof Element ? event.target : null;
		const item = target !== null ? target.closest(".dsh-stk-tapeItem") : null;
		if (item === null) return;
		openStockPopup(String(item.dataset.symbol ?? ""));
	});
	// ---- boot ----
	// setTimeout 链式调度（而非 setInterval）：上一次请求完成后再排下一次，
	// 慢响应不会堆叠并发；改刷新间隔/设置卡变更时可安全重排。
	let quotesTimer = 0, sessionTimer = 0, workspacesTimer = 0;
	function startTimers() {
		if (disposed) return;
		clearTimeout(quotesTimer);
		quotesTimer = window.setTimeout(tickQuotes, state.settings.refreshMs);
	}
	async function tickQuotes() {
		if (disposed) return;
		if (!document.hidden) await refreshQuotes();
		startTimers();
	}
	const onVisibilityChange = () => { if (!document.hidden && !disposed) refreshQuotes(); };
	const onSettingsChanged = () => { startTimers(); renderTape(); };
	document.addEventListener("visibilitychange", onVisibilityChange);
	// 窗口宽度变化时重新自适应标题栏持仓显示
	let resizeRaf = 0;
	const onWindowResize = () => {
		if (disposed) return;
		cancelAnimationFrame(resizeRaf);
		resizeRaf = requestAnimationFrame(() => { if (!disposed) renderPosChip(); });
	};
	window.addEventListener("resize", onWindowResize);
	window.addEventListener("dsh-stock:settings", onSettingsChanged);
	sessionTimer = setInterval(() => renderSessions(new Date()), SESSION_REFRESH_MS);
	workspacesTimer = setInterval(() => { refreshWorkspaces(); }, WORKSPACES_REFRESH_MS);
	renderSessions(new Date());
	renderAll(); refreshQuotes(); startTimers(); refreshWorkspaces();
	ctx.effect(() => () => {
		disposed = true;
		closeStockPopup();
		clearTimeout(quotesTimer); clearInterval(sessionTimer); clearInterval(workspacesTimer);
		clearTimeout(state.toastTimer); clearTimeout(suggestTimer); clearTimeout(armTimer);
		document.removeEventListener("visibilitychange", onVisibilityChange);
		window.removeEventListener("dsh-stock:settings", onSettingsChanged);
		window.removeEventListener("resize", onWindowResize);
			delete body.dataset.dshStock; titlebar.remove(); tape.remove(); statusbar.remove(); panel.remove();
			const toastEl = document.querySelector(".dsh-stk-toast"); if (toastEl) toastEl.remove(); favicon.remove();
			if (document.title === SKIN_TITLE) document.title = originalTitle;
			document.querySelectorAll("style[data-plugin-css=" + JSON.stringify(tagId) + "]").forEach((tag) => tag.remove());
		}, "ui-skin-stock: stock terminal chrome");
	}
	//#endregion
	exports.apply = apply;
	exports.inject = ["slots", "settingsScope"];
	return module.exports;
	}
});

//# sourceMappingURL=client.js.map