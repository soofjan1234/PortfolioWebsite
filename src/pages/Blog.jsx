import React, { useState, useEffect } from 'react'
import { marked } from 'marked'

const Blog = () => {
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/posts/hello.md')
            .then(res => res.text())
            .then(text => {
                setContent(marked(text))
                setLoading(false)
            })
            .catch(err => {
                console.error('加载失败:', err)
                setLoading(false)
            })
    }, [])

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="mb-12">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Writing</h2>
                <h1 className="text-4xl font-bold text-white mb-4">技术专栏</h1>
                <p className="text-slate-400">记录技术思考、源码分析与开发经验。</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
                </div>
            ) : (
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10">
                    <article
                        className="prose prose-invert max-w-none 
              prose-headings:text-white prose-headings:font-bold 
              prose-h1:text-3xl prose-h2:text-2xl 
              prose-p:text-slate-300 prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl"
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            )}
        </div>
    )
}

export default Blog
