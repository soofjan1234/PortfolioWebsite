import React, { useState, useEffect } from 'react'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { TextAnimate } from "@/registry/magicui/text-animate"

const SIDEBAR_W = '12rem'       // w-48 desktop
const SIDEBAR_W_MOBILE = '18rem'
const HAMBURGER_STRIP_W = '3.5rem' // 收起时仅占汉堡图标宽度

const Blog = () => {
    const [articles, setArticles] = useState([])
    const [articlesLoading, setArticlesLoading] = useState(true)
    const [articlesError, setArticlesError] = useState(null)
    const [selectedArticle, setSelectedArticle] = useState(null)
    const [content, setContent] = useState('')
    const [loading, setLoading] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [isDesktop, setIsDesktop] = useState(false)
    const [expandedCategories, setExpandedCategories] = useState(new Set())

    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)')
        const update = () => {
            const desktop = mq.matches
            setIsDesktop(desktop)
            if (desktop) setSidebarOpen(true)
            else setSidebarOpen(false)
        }
        update()
        mq.addEventListener('change', update)
        return () => mq.removeEventListener('change', update)
    }, [])

    useEffect(() => {
        setArticlesLoading(true)
        setArticlesError(null)
        fetch('/posts.json')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load posts list')
                return res.json()
            })
            .then((data) => {
                setArticles(Array.isArray(data) ? data : [])
                setArticlesLoading(false)
            })
            .catch((err) => {
                setArticlesError(err.message)
                setArticlesLoading(false)
            })
    }, [])

    // Helper function to convert relative image paths to absolute paths
    const processImagePaths = (markdownContent, articlePath) => {
        // Get the directory path of the article (remove the filename)
        const articleDir = articlePath.substring(0, articlePath.lastIndexOf('/'))

        // Replace relative image paths (both .\ and ./ formats)
        // Match patterns like ![](.\image.png) or ![](./image.png)
        return markdownContent.replace(
            /!\[([^\]]*)\]\(([.\/\\]+)([^)]+)\)/g,
            (match, alt, prefix, imageName) => {
                // Remove any leading dots, slashes, or backslashes
                const cleanImageName = imageName.replace(/^[.\/\\]+/, '')
                // Construct absolute path
                const absolutePath = `${articleDir}/${cleanImageName}`
                return `![${alt}](${absolutePath})`
            }
        )
    }

    // Load selected article
    const loadArticle = (article) => {
        setLoading(true)
        setSelectedArticle(article)
        fetch(article.path)
            .then(res => {
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                return res.text();
            })
            .then(text => {
                // Process image paths to convert relative paths to absolute paths
                const processedContent = processImagePaths(text, article.path)
                setContent(processedContent)
                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to load article:', err)
                setContent('Failed to load content. Please make sure the markdown file exists.')
                setLoading(false)
            })
    }

    const toggleCategory = (category) => {
        setExpandedCategories((prev) => {
            const next = new Set(prev)
            if (next.has(category)) next.delete(category)
            else next.add(category)
            return next
        })
    }

    // const contentPl = sidebarOpen ? (isDesktop ? SIDEBAR_W : '0') : HAMBURGER_STRIP_W
    const contentPl = '3rem'

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen flex flex-col lg:flex-row">

            {/* 目录：aside 全高 + justify-center，内层卡片定高 50vh 居中 */}
            <aside
                className="fixed z-20 flex flex-col justify-center overflow-hidden transition-[width] duration-250 ease-out bg-transparent"
                style={{
                    left: 0,
                    top: '6rem',
                    height: 'calc(100vh - 6rem)',
                    width: sidebarOpen ? (isDesktop ? '12rem' : '18rem') : HAMBURGER_STRIP_W,
                }}
            >
                <div className="h-[50vh] w-full min-w-0 flex flex-col rounded-r-2xl border border-l-0 border-gray-200 bg-white shadow-xl overflow-hidden shrink-0">
                    <div className="p-2 border-b border-gray-100 shrink-0 flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen((v) => !v)}
                            className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
                            aria-label={sidebarOpen ? '收起目录' : '打开目录'}
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        {sidebarOpen && (
                            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center">
                                Posts
                            </h3>
                        )}
                    </div>
                    {sidebarOpen && (
                        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
                            {articlesLoading && (
                                <div className="flex justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                                </div>
                            )}
                            {articlesError && (
                                <p className="text-sm text-red-500 py-4">{articlesError}</p>
                            )}
                            {!articlesLoading && !articlesError && articles.map((categoryGroup) => {
                                const expanded = expandedCategories.has(categoryGroup.category)
                                return (
                                    <div key={categoryGroup.category} className="rounded-lg overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => toggleCategory(categoryGroup.category)}
                                            className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold text-gray-500 uppercase tracking-wider hover:bg-gray-100 transition-colors"
                                        >
                                            <span>{categoryGroup.category}</span>
                                            <svg
                                                className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                        {expanded && (
                                            <ul className="space-y-0.5 pl-1 mt-0.5 pb-2">
                                                {categoryGroup.posts.map((post) => (
                                                    <li key={post.path}>
                                                        <button
                                                            onClick={() => {
                                                                loadArticle(post)
                                                                if (!isDesktop) setSidebarOpen(false)
                                                            }}
                                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center justify-between ${selectedArticle?.path === post.path
                                                                ? 'bg-gray-200 text-gray-900 font-medium'
                                                                : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-900'
                                                                }`}
                                                        >
                                                            <span className="truncate">{post.title}</span>
                                                            {selectedArticle?.path === post.path && (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-600 ml-2 shrink-0"></span>
                                                            )}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </aside>

            {/* 移动端展开时的遮罩 */}
            {sidebarOpen && !isDesktop && (
                <button
                    type="button"
                    className="fixed inset-0 z-10 bg-black/30"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="关闭目录"
                />
            )}

            {/* 右侧内容区：根据目录展开状态留出左边距 */}
            <div
                className="flex-1 min-w-0 w-full order-1 flex flex-col transition-[padding-left] duration-250 ease-out"
                style={{ paddingLeft: contentPl }}
            >
                <header className="text-center mb-12 pt-12 px-4">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500 mb-4"><TextAnimate animation="blurInUp" by="character" once>Writing & Thoughts</TextAnimate></h2>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900"><TextAnimate animation="blurInUp" by="character" once delay={0.2}>Technical Blog</TextAnimate></h1>
                    <p className="mt-6 text-gray-500 max-w-2xl mx-auto">
                        Exploring code, architecture, and the journey of building software.
                    </p>
                </header>

                <main className="flex-1 w-full flex flex-col items-center px-4 md:px-6 lg:px-10 pb-24">
                    <div className="w-full max-w-4xl">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-gray-100">
                                <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mb-4"></div>
                                <p className="text-gray-400 text-sm font-medium">Loading content...</p>
                            </div>
                        ) : selectedArticle ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 md:p-12 min-h-[60vh] transition-all duration-500">
                                <div className="mb-10 pb-8 border-b border-gray-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                            Note
                                        </span>
                                        <span className="text-gray-400 text-xs font-medium">
                                            / posts / {selectedArticle.category ?? selectedArticle.path.split('/')[3]}
                                        </span>
                                    </div>
                                    <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">
                                        {selectedArticle.title}
                                    </h1>
                                </div>

                                <article>
                                    <MarkdownRenderer content={content} />
                                </article>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[50vh] bg-white border border-gray-100 rounded-2xl p-12 text-center border-dashed hover:border-gray-200 transition-colors group cursor-default">
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2"><TextAnimate animation="blurInUp" by="character" once>Select an Article</TextAnimate></h3>
                                <p className="text-gray-500 max-w-sm">
                                    Choose a topic from the sidebar to start reading.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Blog
