# ImageTools

基于 **Google Gemini API** 的 AI 抠图工具，支持批量上传、自动抠图、序列帧预览与打包下载。

## 功能

- 拖拽/点击上传图片，支持多选
- 可配置抠图提示词与 Gemini 模型
- 批量处理（可调并发数）、进度与暂停/取消
- 原图与结果对比预览、单张下载、透明度检查
- 序列帧播放（适合精灵动画）
- 全部结果打包为 ZIP 下载

## 技术栈

| 类别     | 技术 |
|----------|------|
| 构建     | Vite 6 |
| 框架     | React 18 |
| 语言     | TypeScript（.ts / .tsx） |
| 状态     | React Context + useReducer |
| 样式     | CSS 变量 + 全局样式 |
| 打包下载 | JSZip |

## 环境要求

- Node.js 18+
- npm / pnpm / yarn

## 快速开始

### 1. 安装依赖

在项目目录下执行：

```bash
npm install
```

若终端提示 **「npm 无法识别」**，请先运行一次（任选其一）：

- **双击** 项目里的 **`fix-npm-path.cmd`**
- 或在终端执行：`.\fix-npm-path.cmd`

脚本会把 Node 永久加入当前用户的 PATH。**完成后关掉当前终端，重新打开一个**，再执行 `npm install`、`npm run dev` 即可正常使用 `npm`。

### 2. 配置 API Key

在项目根目录创建 `.env` 文件（若尚未存在）：

```env
VITE_GEMINI_API_KEY=你的_Gemini_API_Key
```

> `.env` 已加入 `.gitignore`，不会提交到仓库。应用会优先使用此处配置的 Key，若未配置则依赖页面中填写并保存的 Key。

### 3. 启动开发服务器

在项目目录下执行：

```bash
npm run dev
```

若终端提示找不到 `npm` 或「禁止运行脚本」：

- **推荐**：在 PowerShell 或 CMD 中执行 **`.\run-dev.cmd`**（.cmd 不受执行策略限制，并会自动查找 Node）
- 或直接**双击**项目根目录的 `run-dev.cmd`

浏览器访问 **http://localhost:5173**。

### 4. 构建与预览

```bash
npm run build    # 产出到 dist/
npm run preview  # 本地预览构建结果
```

## 项目结构

```
ImageTools/
├── .env                 # 环境变量（含 VITE_GEMINI_API_KEY，勿提交）
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md
└── src/
    ├── main.tsx              # 入口
    ├── App.tsx               # 根组件
    ├── App.css               # 全局样式
    ├── index.css             # 基础样式与 CSS 变量
    ├── types.ts              # 全局类型定义
    ├── constants.ts          # 默认提示词、模型列表等常量
    ├── vite-env.d.ts         # Vite 环境变量类型
    ├── context/
    │   └── AppContext.tsx    # 全局状态与业务逻辑
    ├── utils/
    │   ├── image.ts          # 图片读写、尺寸、透明度检查
    │   ├── gemini.ts         # Gemini API 调用
    │   └── storage.ts        # localStorage 与 .env 默认 Key
    └── components/
        ├── Sidebar.tsx
        ├── sidebar/          # API / 提示词 / 批量 / 输出 / 控制 / 下载
        │   ├── ApiPanel.tsx
        │   ├── PromptPanel.tsx
        │   ├── BatchPanel.tsx
        │   ├── OutputPanel.tsx
        │   ├── ControlsPanel.tsx
        │   └── DownloadPanel.tsx
        ├── UploadZone.tsx
        ├── ProgressSection.tsx
        ├── Tabs.tsx
        ├── SourceGrid.tsx
        ├── ResultGrid.tsx
        ├── ImageCard.tsx
        ├── SequencePlayer.tsx
        ├── PreviewModal.tsx
        └── ToastContainer.tsx
```

## 脚本说明

| 命令           | 说明           |
|----------------|----------------|
| `npm run dev`  | 启动开发服务器 |
| `npm run build`| 生产构建       |
| `npm run preview` | 预览构建产物 |

## 许可证

私有项目，未指定开源协议。
