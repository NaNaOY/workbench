# WorkBench 0.2.2

发布日期：2026-08-11

## 本次更新

- 期货面板改用东方财富官方日 K 图，修复郑商所品种（纯碱、玻璃主连）K 线显示「暂无数据」的问题：东财 K 线图服务对品种代码大小写敏感，郑商所要求大写、上期所/广期所要求小写，现已按交易所自动归一化。
- 全局下拉菜单（AppSelect）支持视口边缘智能翻转与高度自适应，菜单不再被卡片遮挡或超出屏幕。
- 专注模式的待办场景背景改用图片元素渲染，层叠与加载更稳定。
- 内容调度与期货行情请求的 User-Agent 版本号统一更新。

## 验证

- npm run typecheck
- npm run build
- electron-builder --win（NSIS 安装版）
- 东方财富 K 线图接口实测：`115.SAM` / `115.FGM` 返回真实 K 线图。

## 发布物

- WorkBench-Setup-0.2.2-x64.exe：Windows 安装版。
- WorkBench-Portable-0.2.2-x64.exe：Windows 便携版（随 0.2.2 补充发布）。

安装包内置 Electron，不需要额外安装 Node.js。卸载安装版默认保留本地数据，便于后续升级恢复。

## SHA-256 校验

- WorkBench-Setup-0.2.2-x64.exe：3B2E142CE58FDDB57A26D13139BBF1187123C7CA97B6A1AE7B3ED05390C0B199
- WorkBench-Portable-0.2.2-x64.exe：（生成后补充）
