# Windows 桌面版打包

WorkBench 使用 Electron Builder 生成免环境 Windows 分发包。打包机需要 Node.js 20 LTS、npm 和可访问 npm/Electron 下载源的网络。

## 构建前检查

```powershell
npm ci
npm run typecheck
npm run build
```

## 生成产物

```powershell
# NSIS 安装程序 + 便携版
npm run package:win

# 只生成便携版
npm run package:portable
```

产物写入 `release/`，该目录已被 `.gitignore` 排除：

- `WorkBench-Setup-0.1.1-x64.exe`：标准安装程序；
- `WorkBench-Portable-0.1.1-x64.exe`：绿色便携版；
- `win-unpacked/`：本地调试目录，不用于分发。

## 发布建议

1. 在本机验证安装、启动、创建任务、保存笔记和跨天统计；
2. 不要把 `release/` 提交到源码仓库；
3. 将两个 EXE 上传到 GitHub Releases，并在发布说明中写明版本、系统要求和未签名提示；
4. 正式面向公众分发时，使用自己的 Windows 代码签名证书，降低 SmartScreen 的未知发布者提示。

安装包内置 Electron 和渲染层资源，用户运行 EXE 不需要安装 Node.js、npm 或源码仓库。个人数据仍保存在各自电脑的 Electron `userData` 目录中。