# 文章列表的替代方案（非硬编码）

## 当前方式：在组件内硬编码 `articles` 数组

- 优点：简单、无额外请求、类型/结构清晰  
- 缺点：每新增/修改一篇文章都要改代码并重新部署  

---

## 方案对比

| 方案 | 新增文章时 | 标题来源 | 适用场景 |
|------|------------|----------|----------|
| 1. 外部 JSON 清单 | 只改 JSON 文件 | JSON 里写 title | 静态站、不想动构建 |
| 2. 构建时扫描生成清单 | 只需加 md 文件，跑一次 build | 从 frontmatter 或首行 # 解析 | 推荐，完全自动化 |
| 3. 独立 data 模块 | 改一个 js 文件 | 手写 | 只是把硬编码挪出去，减少组件体积 |
| 4. 服务端/Serverless API | 部署后自动 | 读目录 + 解析 md | 有后端或 Vercel/Netlify Functions 时 |
| 5. Vite import.meta.glob | 只加 md（需在 src 内） | 可 frontmatter | md 在 src 且接受打进 bundle 时 |

---

## 方案 1：外部 JSON 清单（改配置不改代码）

- 在 `public/` 下维护一份 `posts.json`（或 `posts-manifest.json`），结构和你现在的 `articles` 一致。
- 页面加载时 `fetch('/posts.json')` 得到列表，再按现有方式 `fetch(article.path)` 拉正文。
- 新增文章：只改 JSON，不改 React 代码。

---

## 方案 2：构建时扫描 `public/posts` 生成清单（已实现）

- 已实现：脚本 [`scripts/generate-posts-manifest.js`](../scripts/generate-posts-manifest.js) 在 `npm run build` 前运行，扫描 `public/posts/**/*.md`：
  - 按目录结构得到年份、路径；
  - 标题从 **frontmatter 的 `title`** 或 **第一个 `# 标题` 行** 解析（无 frontmatter 时用首行一级标题）。
- 输出到 `public/posts.json`，页面通过 `fetch('/posts.json')` 拉取列表。
- 新增文章：只加 md 文件，执行一次 `node scripts/generate-posts-manifest.js` 或 `npm run build` 即可。若希望侧栏显示自定义标题，在 md 顶部加 `title: 你的标题` 的 frontmatter。

---

## 方案 3：独立 data 模块

- 把当前 `articles` 抽到 `src/data/articles.js` 并 export，`Blog.jsx` 里 `import { articles } from '../data/articles'`。
- 仍是手写列表，但组件更干净，以后要换成方案 1/2 只需改这一处引用。

---

## 方案 4：服务端 / Serverless 目录接口

- 若部署带 Node 或 Serverless（如 Vercel/Netlify Functions），可写一个接口：读 `public/posts`（或打包后的静态路径）目录，返回树形结构；再从 md 中解析 title（frontmatter 或首行 #）。
- 纯静态托管（仅 HTML/JS/CSS + 静态文件）没有「列目录」能力，此方案不适用。

---

## 方案 5：Vite `import.meta.glob`（md 在 src 内）

- 若把文章放在 `src/posts/**/*.md`，可用 `import.meta.glob('@/posts/**/*.md')` 拿到路径；配合 `eager: true` 或动态 import 可拿到内容，标题用 frontmatter 或首行 #。
- 注意：当前你的 md 在 `public/`，Vite 的 glob 不会扫描 `public`，所以要么迁到 `src`，要么用方案 2 扫描 `public`。

---

## 建议

- **想最少改动、立刻生效**：用 **方案 1（JSON 清单）**，把现有数组挪到 `public/posts.json`，组件里 fetch 它。
- **想一劳永逸、加文章不改代码**：用 **方案 2（构建时扫描生成清单）**，并约定每篇 md 要么有 frontmatter `title`，要么用「第一个 # 作为标题」的规则。
