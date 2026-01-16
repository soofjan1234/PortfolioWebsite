import React, { useState, useEffect } from 'react'
import { marked } from 'marked'

marked.use({
  breaks: true, // 关键：允许回车换行（将 \n 解析为 <br>）
  gfm: true,    // 启用 GitHub 风格 Markdown
});

const Blog = () => {
    // 硬编码文章列表，按年份分类
    const articles = [
        {
            year: '2025',
            posts: [
                { title: '爬虫', path: '/posts/2025/爬虫.md' },
                { title: '如何做一个好的个人网站', path: '/posts/2025/如何做一个好的个人网站.md' },
                { title: 'CC使用方法', path: '/posts/2025/CC使用方法.md' }
            ]
        },
        {
            year: '2024',
            posts: [
                { title: '存储知识', path: '/posts/2024/存储知识.md' },
                { title: '摄像头协议', path: '/posts/2024/摄像头协议.md' }
            ]
        }
    ]

    const [selectedArticle, setSelectedArticle] = useState(null)
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)

    // 加载选中的文章
    const loadArticle = (article) => {
        setLoading(true)
        setSelectedArticle(article)
        fetch(article.path)
            .then(res => res.text())
            .then(text => {
                setContent(marked(text))
                setLoading(false)
            })
            .catch(err => {
                console.error('加载失败:', err)
                setLoading(false)
            })
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Writing</h2>
                <h1 className="text-4xl font-bold text-white mb-4">技术专栏</h1>
                <p className="text-slate-400">记录技术思考、源码分析与开发经验。</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* 文章列表（左侧） */}
                <div className="lg:col-span-1">
                    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/10 sticky top-8">
                        <h3 className="text-xl font-bold text-white mb-4">文章列表</h3>
                        {articles.map((yearGroup) => (
                            <div key={yearGroup.year} className="mb-6">
                                <h4 className="text-lg font-semibold text-primary mb-3">{yearGroup.year}</h4>
                                <ul className="space-y-2">
                                    {yearGroup.posts.map((post) => (
                                        <li key={post.path}>
                                            <button
                                                onClick={() => loadArticle(post)}
                                                className={`text-left w-full px-3 py-2 rounded-lg transition-all duration-200 hover:bg-primary/10 ${
                                                    selectedArticle?.path === post.path
                                                        ? 'text-primary bg-primary/10'
                                                        : 'text-slate-300'
                                                }`}
                                            >
                                                {post.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 文章内容（右侧） */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
                        </div>
                    ) : selectedArticle ? (
                        <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                            <h2 className="text-2xl font-bold text-white mb-6">{selectedArticle.title}</h2>
                            <article
                                className="prose prose-invert max-w-none 
              prose-headings:text-white prose-headings:font-bold 
              prose-h1:text-3xl prose-h2:text-2xl 
              prose-p:text-slate-300 prose-p:leading-relaxed
              prose-p:my-8
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl"
                                dangerouslySetInnerHTML={{ __html: content }}
                            />
                        </div>
                    ) : (
                        <div className="flex justify-center items-center h-64 p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                            <p className="text-slate-400 text-lg">请从左侧选择一篇文章阅读</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Blog
