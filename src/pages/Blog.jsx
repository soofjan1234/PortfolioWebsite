import React, { useState } from 'react'
import MarkdownRenderer from '../components/MarkdownRenderer'

const Blog = () => {
    // Hardcoded article list by year
    const articles = [
        {
            year: '2026',
            posts: [
                { title: '告别vercel.app域名', path: '/posts/2026/1/告别vercel.app域名.md' }
            ]
        },
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

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen">

            {/* Header */}
            <div className="text-center mb-16 pt-12">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">Writing & Thoughts</h2>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900">Technical Blog</h1>
                <p className="mt-6 text-gray-500 max-w-2xl mx-auto">
                    Exploring code, architecture, and the journey of building software.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 container mx-auto px-4 md:px-0">
                {/* Article List (Left Sidebar) */}
                <div className="lg:col-span-3">
                    <div className="bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl p-6 sticky top-24 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full mr-3"></span>
                            Latest Posts
                        </h3>

                        <div className="space-y-8">
                            {articles.map((yearGroup) => (
                                <div key={yearGroup.year}>
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2">
                                        {yearGroup.year}
                                    </div>
                                    <ul className="space-y-1">
                                        {yearGroup.posts.map((post) => (
                                            <li key={post.path}>
                                                <button
                                                    onClick={() => loadArticle(post)}
                                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group flex items-center justify-between ${selectedArticle?.path === post.path
                                                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                                                        : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm'
                                                        }`}
                                                >
                                                    <span className="truncate">{post.title}</span>
                                                    {selectedArticle?.path === post.path && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ml-2 animate-pulse"></span>
                                                    )}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Article Content (Right/Main Area) */}
                <div className="lg:col-span-9">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-96 bg-white/50 backdrop-blur-md rounded-3xl border border-white/50">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-400 text-sm font-medium">Loading content...</p>
                        </div>
                    ) : selectedArticle ? (
                        <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] shadow-xl p-8 md:p-12 min-h-[80vh] transition-all duration-500 mb-24">
                            <div className="mb-10 pb-8 border-b border-gray-100">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider">
                                        Note
                                    </span>
                                    <span className="text-gray-400 text-xs font-medium">
                                        / posts / {selectedArticle.path.split('/')[3]}
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
                        <div className="flex flex-col items-center justify-center h-[60vh] bg-white/50 backdrop-blur-md border border-white/50 rounded-[2.5rem] p-12 text-center border-dashed border-2 border-gray-200 hover:border-blue-200 transition-colors group cursor-default">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Select an Article</h3>
                            <p className="text-gray-500 max-w-sm">
                                Choose a topic from the sidebar to start reading.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Blog
