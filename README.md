# WorkBench 个人工作台

WorkBench 是一个本地优先的中文桌面工作台。它把任务、笔记、专注计时、快捷入口、每日认知和 GitHub 干货榜放在同一个 Electron 应用中；个人工作数据保存在本机浏览器存储，不需要账号或云端数据库。

## 当前功能

| 模块 | 说明 |
| --- | --- |
| 工作总览 | 查看今日任务、完成节奏、快捷收集和本地工作状态。 |
| 任务管理 | 三列看板、优先级、截止日期、项目标签与状态切换。 |
| 灵感笔记 | 本地自动保存的笔记列表与编辑器。 |
| 专注模式 | 25 分钟番茄钟，可关联当前要推进的任务。 |
| 快捷入口 | 保存常用网站、文档库或工具链接。 |
| 每日认知 | 分为“每日时政”和“认知提升”两个内容模块。 |
| GitHub 干货榜 | 开源项目 / Agent Skills 的总榜和周榜。 |

## 每日认知

### 两个内容模块

- **每日时政**：关注政策、治理、国际格局、经济变化、科技动态及能源趋势，优先采用权威机构与可信来源。
- **认知提升**：关注原理、研究、方法、行业知识与专业实务，适度扩大到高校、科研机构、专业媒体与行业机构。

两个模块都提供以下分类：综合总览、政治与格局、思维与经典、心理与人际、法律与民法、经济与财富、科技与 AI、中医药与针灸、电力与能源。

内容筛选会排除情绪文案、毒鸡汤、短视频话术、招生简章、活动报道、招标公告、破产公告等低信息密度内容。医疗、法律和投资相关内容仅用于学习与认知，不构成医疗诊断、法律意见或投资建议。

### 更新机制

- 应用运行期间，每日 08:00 自动更新两个模块的总览内容。
- 应用在 08:00 后首次启动时，会补拉当日内容。
- 点击“更新本板块”会**强制重新联网抓取**，不会复用主进程缓存。
- 页面内容会按“模块 + 分类”写入本地缓存；思考卡内容也会自动保存。

## GitHub 干货榜

- 使用 GitHub Search API 获取仓库数据。
- “总榜”按 Star 排序；“周榜”限定近 7 天创建的仓库。
- 支持“开源项目”和“Agent Skills”两类。
- 点击刷新会发起禁用缓存的新请求；短时间内榜单顺序相同属于正常情况，更新时间会变化。

## 快速启动

### 一键启动

双击项目根目录的 [start-workbench.cmd](./start-workbench.cmd)。首次运行会自动安装依赖，然后以开发模式启动 Electron。

桌面快捷方式指向此启动脚本。修改 Electron 主进程代码后，请完全退出 WorkBench 再重新打开；仅刷新页面不会重启主进程。

### 命令行启动

```powershell
# 安装依赖（首次运行）
npm install

# 开发模式：启动 Vite 与 Electron
npm run dev

# 生产构建：生成 dist/ 和 dist-electron/
npm run build

# 从生产构建启动
npm start
```

## 开发与验证

```powershell
# TypeScript 类型检查
npm run typecheck

# 渲染层构建
npm run build:renderer

# Electron 主进程构建
npm run build:electron

# 完整生产构建
npm run build
```

生产构建配置了相对资源路径，因此 `npm start` 可通过 Electron 本地文件入口正常加载页面。

## 项目结构

```text
personal-workbench/
├─ src/
│  ├─ App.tsx                 # 工作台主界面、任务、笔记、专注与入口
│  ├─ DailyCognitionView.tsx  # 每日时政 / 认知提升界面
│  ├─ KnowledgeViews.tsx      # GitHub 榜单界面
│  ├─ data.ts                 # 本地工作数据读写
│  ├─ styles.css              # 通用界面与自定义选择菜单样式
│  └─ cognition.css           # 每日认知阅读样式
├─ electron/
│  ├─ main.ts                 # Electron 窗口与应用入口
│  ├─ preload.ts              # 受限的渲染层 IPC 接口
│  ├─ content.ts              # 更新调度、GitHub 请求、外链打开
│  └─ cognition.ts            # 内容源查询、过滤与分类
├─ public/assets/             # 图标、Logo 与界面素材
├─ start-workbench.cmd        # Windows 一键启动脚本
├─ vite.config.ts             # Vite 构建配置
└─ package.json               # 依赖与脚本
```

## 本地数据与隐私

- 工作台任务、笔记、快捷入口、专注数据：浏览器 `localStorage`。
- 每日认知、GitHub 榜单与思考卡：浏览器 `localStorage` 缓存。
- 不上传任务、笔记或思考内容。
- 只有手动刷新或定时更新时，应用会请求公开 RSS、公开网站与 GitHub API。
- 外部链接只允许以 `http` 或 `https` 协议在系统浏览器中打开。

## 内容与刷新排错

| 现象 | 处理方式 |
| --- | --- |
| 点击刷新后内容看似相同 | 内容源在短时间内可能没有新增文章；检查“本板块更新于”或 GitHub 的更新时间是否变化。 |
| 仍显示旧的刷新逻辑 | 完全退出 WorkBench，再从桌面快捷方式重新启动。 |
| 无法更新 | 检查网络、系统代理和 GitHub / 内容源的可访问性；界面会保留上一次成功数据。 |
| 首次启动空白 | 先执行 `npm install`，再使用 `start-workbench.cmd` 或 `npm run dev`。 |
| 本地数据需要重置 | 在应用开发者工具或浏览器存储中清除对应 `localStorage`；此操作会删除本机保存的数据。 |

## 技术栈

- Electron 31
- React 18
- TypeScript 5
- Vite 5
- 本地存储：Web `localStorage`
- 网络内容：Google News RSS 聚合、公开 RSS、GitHub REST Search API

## 版本状态

当前版本为 `0.1.0`。已完成 TypeScript 类型检查与生产构建验证。
