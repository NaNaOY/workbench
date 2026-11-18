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

产物写入已被 `.gitignore` 排除的 `release/`：

- `WorkBench-Setup-<version>-x64.exe`：标准安装程序；
- `WorkBench-Portable-<version>-x64.exe`：绿色便携版；
- `win-unpacked/`：本地调试目录，不用于发布。

具体版本号以 `package.json` 的 `version` 字段为准。

安装包内置 Electron 和渲染层资源，使用者不需要安装 Node.js、npm 或源码仓库。

## 升级与卸载

- **安装版升级**：直接运行新版 `WorkBench-Setup-*.exe`。稳定的 `appId` 和安装目录会让安装器替换旧程序文件，并保留任务、笔记和其他本地数据；
- **避免重复安装**：不要把便携版和安装版放进同一个程序目录；
- **卸载安装版**：通过 Windows「设置 → 应用 → 已安装的应用」卸载，默认保留用户数据；
- **便携版**：关闭应用后删除对应 EXE 即可。需要保留数据时，请先备份 Electron 用户数据目录。

## 发布建议

1. 在干净环境执行 `npm ci`、类型检查和生产构建；
2. 验证安装、覆盖升级、启动、任务、富文本笔记、图片粘贴、专注统计和每日认知；
3. 不要将 `release/`、`dist/` 或安装包提交到源码分支；
4. 将 EXE 上传到 GitHub Releases，并附版本变化、系统要求与校验值；
5. 正式公开分发时使用 Windows 代码签名证书，减少 SmartScreen 未知发布者提示。

源码仓库与二进制发布分离：Git 只保存可复现源码，安装包只进入 GitHub Releases。
