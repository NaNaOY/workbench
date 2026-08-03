# WorkBench 个人工作台

WorkBench 是一个本地优先的中文个人工作台，把任务、笔记、专注计时、快捷入口、每日资讯、认知提升和 GitHub 干货榜放在一个安静、可扩展的桌面应用里。

> 目标：让信息服务于行动，而不是让更多通知占据注意力。

![WorkBench 每日认知预览](./docs/ui-preview-cognition.png)
![WorkBench 工作总览预览](./docs/ui-preview-dashboard.png)

## 功能概览

- **工作总览**：今日待办、完成进度、专注时间、最近笔记和节奏趋势。
- **任务管理**：三列看板、优先级、截止日期、项目标签和状态切换。
- **灵感笔记**：本地自动保存的笔记列表与编辑器。
- **专注模式**：25 分钟番茄钟，可关联当前任务；每日统计按本地日期自动归零。
- **快捷入口**：保存常用网站、文档库和工作工具。
- **每日认知**：分为“每日资讯”和“认知提升”，覆盖政治、思维、心理、法律、经济、商业、科技、健康和电力能源等分类。
- **GitHub 干货榜**：开源项目与 Agent Skills 的总榜、周榜，支持鼠标拖拽和左右按钮平滑浏览。
- **本地优先存储**：不需要账号和云端数据库；桌面版会额外备份本机工作数据。

## 公开仓库边界

本仓库只包含可复现应用所需的源码、公开素材、构建配置和文档。以下内容不会被提交：

- `node_modules/`、`dist/`、`dist-electron/`、`release/` 等依赖和构建产物；
- `.env`、本地配置、日志和临时预览文件；
- 任务、笔记、快捷入口、思考记录以及 Electron 用户数据目录中的 `workbench-storage.json`；
- 任何账号密码、访问令牌或个人电脑绝对路径。

应用不内置私有 API 密钥，也不上传个人工作内容。联网功能只请求公开的 RSS 和 GitHub REST API；外部文章链接会直接指向原站。

详细说明见 [隐私与数据边界](./docs/privacy.md)。

## 快速开始

### 开发环境运行

要求 Windows 10/11、Node.js 20 LTS 和 npm：

```powershell
# 克隆仓库后进入目录
npm ci

# 启动 Vite + Electron 开发模式
npm run dev
```

也可以双击根目录的 [start-workbench.cmd](./start-workbench.cmd)。首次启动会安装依赖，然后打开桌面应用。源码不能直接双击 `index.html`，因为桌面版需要 Electron 主进程。

### 构建与检查

```powershell
npm run typecheck
npm run build
npm start
```

### 生成免环境 Windows 安装包

安装包使用 Electron Builder，产物写入被忽略的 `release/` 目录：

```powershell
# 生成标准安装程序和便携版
npm run package:win

# 只生成便携版
npm run package:portable
```

生成结果：

- `release/WorkBench-Setup-0.1.0-x64.exe`：标准安装程序，可创建桌面和开始菜单快捷方式；
- `release/WorkBench-Portable-0.1.0-x64.exe`：无需安装的便携版，可复制到其他 Windows 电脑直接运行。

安装包不依赖 Node.js、npm 或项目源码。当前构建未配置代码签名，Windows SmartScreen 可能显示“未知发布者”；正式分发时请使用自己的代码签名证书。安装包建议上传到 GitHub Releases，而不是提交到源码仓库。更多细节见 [桌面打包说明](./docs/packaging.md)。

## GitHub Pages

仓库包含 `.github/workflows/deploy.yml`，推送到 `master` 后会自动构建静态页面。Pages 适合展示和浏览器体验，但与桌面版有边界：

- 浏览器版本没有 Electron 主进程，数据只保存在当前浏览器的 `localStorage`；
- 桌面文件备份、系统浏览器打开外链等能力只在桌面版可用；
- 每位访问者的数据彼此隔离，不会写入仓库，也不会同步给其他人。

默认地址通常是 `https://NaNaOY.github.io/workbench/`（请以仓库 Settings → Pages 显示的地址为准）。

## 项目结构

```text
personal-workbench/
├─ .github/workflows/deploy.yml    # GitHub Pages 自动部署
├─ docs/
│  ├─ packaging.md                 # Windows 免环境打包说明
│  ├─ privacy.md                   # 隐私、本地存储和网络边界
│  ├─ ui-preview-cognition.png     # 公开界面预览
│  └─ ui-preview-dashboard.png     # 公开界面预览
├─ electron/
│  ├─ main.ts                      # Electron 窗口和应用入口
│  ├─ preload.ts                   # 受限的 IPC / 本地数据桥接
│  ├─ storage.ts                   # 用户数据备份到 Electron userData
│  ├─ content.ts                   # 更新调度、GitHub 请求、外链打开
│  ├─ cognition.ts                 # 每日资讯查询和筛选
│  └─ learning.ts                  # 认知提升知识卡内容库
├─ public/assets/                  # 应用图标、Logo 和公开界面素材
├─ src/
│  ├─ App.tsx                      # 工作台主界面
│  ├─ DailyCognitionView.tsx       # 每日资讯 / 认知提升
│  ├─ KnowledgeViews.tsx           # GitHub 干货榜
│  ├─ data.ts                      # Web 本地存储读写
│  ├─ types.ts                     # 共享类型
│  └─ *.css                        # 页面和视觉主题
├─ electron-builder.portable.json # 便携版构建配置
├─ package.json                    # 脚本、依赖和 Electron Builder 配置
├─ start-workbench.cmd             # Windows 一键启动
└─ vite.config.ts                  # Vite 构建配置
```

## 数据、隐私和网络

- 任务、笔记、快捷入口、思考卡和认知缓存只在本机保存；
- 桌面版启动时会将浏览器存储镜像备份到 Electron 的用户数据目录，卸载时默认保留；
- 每日资讯通过公开 RSS 获取，GitHub 榜单通过公开 GitHub REST API 获取；
- 应用不包含遥测、不建立用户账号、不上传个人工作内容；
- 医疗、法律、投资等内容仅用于学习与信息整理，不构成诊断、法律意见或投资建议。

如需清理本机数据，请先导出或备份，再清除应用对应的浏览器存储和 `workbench-storage.json`。请勿把这些文件上传到 Issue、Pull Request 或公开仓库。

## 贡献

欢迎提交 Issue、改进界面、修复数据源或补充文档。提交前请运行：

```powershell
npm run typecheck
npm run build
```

请不要在 Issue 或 Pull Request 中粘贴任务内容、笔记内容、用户目录路径、访问令牌或其他个人数据。

## 许可证

本项目以 MIT License 开源，详见 [LICENSE](./LICENSE)。第三方网站、RSS 内容、项目图标和用户自有素材仍受其各自许可约束。

## 当前版本

`0.1.0`。项目已通过 TypeScript 类型检查和生产构建；Windows 安装包由发布者在 GitHub Releases 中单独提供。