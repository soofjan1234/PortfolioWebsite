import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const MarkdownRenderer = ({ content }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
                code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const language = match ? match[1] : ''

                    return !inline && language ? (
                        <div className="relative group">
                            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-xs text-gray-400 rounded-t-lg">
                                <span className="font-mono">{language}</span>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(String(children).replace(/\n$/, ''))
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 hover:text-white"
                                >
                                    复制
                                </button>
                            </div>
                            <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={language}
                                PreTag="div"
                                className="!mt-0 !rounded-t-none rounded-b-lg"
                                {...props}
                            >
                                {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                        </div>
                    ) : (
                        <code className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded-md text-sm font-medium" {...props}>
                            {children}
                        </code>
                    )
                },
                h1({ children }) {
                    return <h1 className="text-3xl font-bold text-white mt-8 mb-4">{children}</h1>
                },
                h2({ children }) {
                    return <h2 className="text-2xl font-bold text-white mt-6 mb-3">{children}</h2>
                },
                h3({ children }) {
                    return <h3 className="text-xl font-bold text-white mt-4 mb-2">{children}</h3>
                },
                p({ children }) {
                    return <p className="text-gray-200 leading-relaxed my-3">{children}</p>
                },
                ul({ children }) {
                    return <ul className="list-disc list-inside my-4 space-y-2 text-gray-200 [&_ul]:ml-[2ch] [&_ol]:ml-[2ch]">{children}</ul>
                },
                ol({ children }) {
                    return <ol className="list-decimal list-inside my-4 space-y-2 text-gray-200 [&_ul]:ml-[2ch] [&_ol]:ml-[2ch]">{children}</ol>
                },
                li({ children }) {
                    return <li className="my-1">{children}</li>
                },
                a({ children, href }) {
                    return (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-300 hover:underline"
                        >
                            {children}
                        </a>
                    )
                },
                blockquote({ children }) {
                    return (
                        <blockquote className="border-l-4 border-purple-500/70 bg-white/5 py-2 px-4 rounded-r-lg my-4 text-gray-100">
                            {children}
                        </blockquote>
                    )
                },
                img({ src, alt }) {
                    return (
                        <div className="my-6">
                            <img
                                src={src}
                                alt={alt || 'Image'}
                                className="rounded-2xl shadow-lg w-full h-auto max-w-full"
                                onError={(e) => {
                                    console.error('Failed to load image:', src)
                                    e.target.style.display = 'none'
                                }}
                            />
                        </div>
                    )
                },
                table({ children }) {
                    return (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-white/20 rounded-lg overflow-hidden">
                                {children}
                            </table>
                        </div>
                    )
                },
                thead({ children }) {
                    return <thead className="bg-white/10">{children}</thead>
                },
                th({ children }) {
                    return (
                        <th className="px-4 py-2 text-left text-sm font-bold text-white border-b border-white/20">
                            {children}
                        </th>
                    )
                },
                td({ children }) {
                    return (
                        <td className="px-4 py-2 text-sm text-gray-200 border-b border-white/20">
                            {children}
                        </td>
                    )
                },
            }}
        >
            {content}
        </ReactMarkdown>
    )
}

export default MarkdownRenderer
