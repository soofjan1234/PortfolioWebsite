# 博客 Markdown 渲染演进史

记录我的个人博客在 Markdown 内容展示方面的技术选型与实践。

## 第一阶段：使用 marked 库

### 技术方案

最初的实现使用 `marked` 库进行 Markdown 解析：

```javascript
import { marked } from 'marked'

// 配置 marked 选项
marked.use({
    breaks: true, // 将换行符渲染为 <br>
    gfm: true,    // 启用 GitHub 风格 Markdown
});

// 在组件中
const [content, setContent] = useState('')
fetch(article.path)
    .then(res => res.text())
    .then(text => {
        setContent(marked(text))  // 直接转换为 HTML
    })
```

在 JSX 中使用 `dangerouslySetInnerHTML` 渲染：

```jsx
<article className="prose prose-lg max-w-none prose-slate ...">
    dangerouslySetInnerHTML={{ __html: content }}
</article>
```

### 遇到的问题

#### 1. 元素间距问题

当 Markdown 文件中不同块级元素之间没有空行时，渲染出来的 HTML 元素会紧贴在一起：

```markdown
1. 第一项
2. 第二项
# WebDav
普通文字
```

渲染结果：
```html
<ol><li>第一项</li><li>第二项</li></ol><h1>WebDav</h1><p>普通文字</p>
```

`</ol>` 和 `<h1>` 之间、`</h1>` 和 `<p>` 之间没有任何间距，视觉效果不佳。

#### 2. 代码高亮缺失

`marked` 渲染的代码块只是简单的 `<code>` 标签，没有任何语法高亮，用户体验较差。

#### 3. 样式定制困难

需要通过 Tailwind 的 `prose` 类来控制样式，但对于代码块、表格等复杂元素，定制起来比较繁琐。

#### 4. XSS 安全风险

使用 `dangerouslySetInnerHTML` 直接渲染 HTML 存在潜在的安全风险。

#### 5. 缺少高级功能

- 没有代码复制按钮
- 没有代码行号
- 不支持数学公式
- 表格样式不够美观

## 第二阶段：使用 react-markdown（2026）

### 技术方案

基于掘金文章 [《React + react-markdown 实现Markdown预览功能》](https://juejin.cn/post/7414047932465610786) 的启发，我决定升级到 `react-markdown`。

#### 安装依赖

```bash
npm install react-markdown remark-gfm rehype-raw react-syntax-highlighter
```

#### 核心实现

创建专门的 `MarkdownRenderer.jsx` 组件：

```javascript
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const MarkdownRenderer = ({ content }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}      // GitHub 风格支持
            rehypePlugins={[rehypeRaw]}      // HTML 标签解析
            components={{                    // 自定义组件
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : ''

                    return !inline && language ? (
                        <div className="relative group">
                            {/* 代码块头部：语言标签 + 复制按钮 */}
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-xs text-gray-400 rounded-t-lg">
                                <span className="font-mono">{language}</span>
                                <button onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}>
                                    复制
                                </button>
                            </div>
                            {/* 语法高亮 */}
                            <SyntaxHighlighter style={vscDarkPlus} language={language}>
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md">
                            {children}
                        </code>
                    )
                },
                h1({ children }) {
                    return <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>
                },
                // ... 其他组件
            }}
        >
            {content}
        </ReactMarkdown>
    )
}
```

#### Blog 页面使用

```javascript
import MarkdownRenderer from '../components/MarkdownRenderer'

const Blog = () => {
    const [content, setContent] = useState('')

    const loadArticle = (article) => {
        fetch(article.path)
            .then(res => res.text())
            .then(text => setContent(text))  // 直接保存 Markdown 文本
    }

    return (
        <article>
            <MarkdownRenderer content={content} />
        </article>
    )
}
```

### 解决方案

#### 1. 元素间距问题 ✅

通过在 `components` 中自定义每个元素的 className，直接控制间距：

```javascript
h1({ children }) {
    return <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>
},
p({ children }) {
    return <p className="text-gray-600 leading-relaxed my-3">{children}</p>
},
ul({ children }) {
    return <ul className="list-disc list-inside my-4 space-y-2 text-gray-600">{children}</ul>
},
```

每个元素都有明确的 `mt`（上边距）和 `mb`（下边距），无论 Markdown 源文件中是否有空行，渲染结果都会保持一致的间距。

#### 2. 代码高亮 ✅

使用 `react-syntax-highlighter` 的 Prism 主题实现语法高亮：

- 显示语言标签（如 `javascript`、`python`）
- VS Code Dark Plus 主题
- 行号可选
- 一键复制按钮

#### 3. 样式定制灵活 ✅

所有样式都在组件层面控制，修改样式非常直观：

```javascript
a({ children, href }) {
    return (
        <a href={href} target="_blank" rel="noopener noreferrer"
           className="text-blue-600 hover:underline">
            {children}
        </a>
    )
},
blockquote({ children }) {
    return (
        <blockquote className="border-l-4 border-blue-500 bg-blue-50/50 py-2 px-4 rounded-r-lg my-4">
            {children}
        </blockquote>
    )
},
```

#### 4. 更安全的渲染 ✅

`react-markdown` 内置了 XSS 过滤，不需要使用 `dangerouslySetInnerHTML`，直接传递 Markdown 文本即可。

#### 5. 高级功能支持 ✅

| 功能 | 实现方式 |
|------|---------|
| 复制代码 | 代码块头部添加复制按钮 |
| 语言标识 | 自动识别并在顶部显示语言名称 |
| 表格样式 | 使用 `remark-gfm` + 自定义 table 组件 |
| 图片样式 | 圆角、阴影、响应式 |
| 链接 | 自动添加 `target="_blank"` |
| 引用块 | 左侧边框 + 背景色 + 圆角 |

## 总结

| 对比项 | marked | react-markdown |
|--------|--------|----------------|
| 渲染方式 | HTML 字符串 + dangerouslySetInnerHTML | 组件化渲染 |
| 代码高亮 | 需要额外集成 | 内置 Prism 支持 |
| 样式控制 | CSS 类名，不够灵活 | 直接在组件中定义 |
| 安全性 | 有 XSS 风险 | 内置安全过滤 |
| 扩展性 | 较差 | 插件系统强大 |
| 学习成本 | 低 | 中等 |

从实践来看，`react-markdown` 虽然初始配置稍复杂，但长期维护成本更低，功能更强大，用户体验也更好。对于需要展示技术博客的网站来说，是一个更优的选择。

## 参考资源

- [react-markdown 官方文档](https://github.com/remarkjs/react-markdown)
- [react-syntax-highlighter 文档](https://github.com/react-syntax-highlighter/react-syntax-highlighter)
- [掘金文章：React + react-markdown 实现Markdown预览功能](https://juejin.cn/post/7414047932465610786)
