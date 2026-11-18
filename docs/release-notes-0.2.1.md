# WorkBench 0.2.1

发布日期：2026-08-11

## 本次更新

- 专注模式使用当前选中今日待办的背景场景，待办切换后背景立即同步。
- 个人台账筛选菜单提升为独立浮层，避免被场景卡片遮挡。
- 个人台账卡片压缩为高密度场景行，保留分类、状态、关键数值和操作入口。
- 信息学题单填充可用工作区高度，减少全屏时的无意义留白。
- 期货面板的风险红线表格放大文字与行高，提升桌面端阅读体验。

## 验证

- npm run typecheck
- npm run build
- Electron 页面验收：专注背景切换、台账下拉层级、题单高度和期货表格字体。

## 发布物

- WorkBench-Setup-0.2.1-x64.exe：Windows 安装版。
- WorkBench-Portable-0.2.1-x64.exe：Windows 便携版。

安装包内置 Electron，不需要额外安装 Node.js。卸载安装版默认保留本地数据，便于后续升级恢复。

## SHA-256 校验

- WorkBench-Setup-0.2.1-x64.exe：52125D50868CFEBB868507C109EC2A49103BE96FA36824FE64DC6253B0979106
- WorkBench-Portable-0.2.1-x64.exe：A4A4446E1B15DBA5C53A84F6F859368B1BAB59E8DAD37AF60E0C2DBF62A9A468