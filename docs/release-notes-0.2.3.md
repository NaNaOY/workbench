# WorkBench 0.2.3

发布日期为 2026-11-18。

## 本次更新

- 统一 Vite 与 esbuild 使用的实际项目路径，修复目录迁移或通过目录联接启动时出现的 `Cannot read properties of undefined (reading 'imports')` 错误，并修复同类路径问题导致的生产构建失败。
- Windows 启动脚本使用 CRLF 换行，修复命令截断和中文乱码。
- 同步应用版本、依赖锁文件与请求版本标识。

## 包含的 0.2.2 更新

- 期货面板使用东方财富官方日 K 图，修复纯碱、玻璃主连 K 线显示「暂无数据」的问题。
- 全局下拉菜单支持视口边缘翻转和高度自适应。
- 专注模式的待办场景背景使用图片元素渲染。

## 发布文件

- `WorkBench-Setup-0.2.3-x64.exe` 为 Windows x64 安装版。
- `WorkBench-Portable-0.2.3-x64.exe` 为 Windows x64 便携版。
- `SHA256SUMS-0.2.3.txt` 提供安装版与便携版的 SHA-256 校验值。

支持 Windows 10/11。安装包内置 Electron，无需额外安装 Node.js。

## 验证

- 类型检查与生产构建通过。
- Windows x64 NSIS 安装版与便携版均已生成。
- 包内版本、Electron 入口、预加载脚本和渲染资源完整性检查通过。
- 打包后的应用启动检查通过，页面完成加载并渲染应用内容。
- Git 中保存的 Windows 启动脚本使用 CRLF 换行。

## SHA-256 校验

| 文件 | SHA-256 |
| --- | --- |
| `WorkBench-Setup-0.2.3-x64.exe` | `3ec6e596b9d9a4733aae2509f8637f10897cca9f3aa5d0ab0cd5db0288465152` |
| `WorkBench-Portable-0.2.3-x64.exe` | `5be3936e4d6480627fcc45b46be62a98c97e80bc0b9d362f82e27699e9cb10f6` |
