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
                        <code className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-sm font-medium" {...props}>
                            {children}
                        </code>
                    )
                },
                h1({ children }) {
                    return <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4">{children}</h1>
                },
                h2({ children }) {
                    return <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3">{children}</h2>
                },
                h3({ children }) {
                    return <h3 className="text-xl font-bold text-gray-900 mt-4 mb-2">{children}</h3>
                },
                p({ children }) {
                    return <p className="text-gray-600 leading-relaxed my-3">{children}</p>
                },
                ul({ children }) {
                    return <ul className="list-disc list-inside my-4 space-y-2 text-gray-600">{children}</ul>
                },
                ol({ children }) {
                    return <ol className="list-decimal list-inside my-4 space-y-2 text-gray-600">{children}</ol>
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
                            className="text-blue-600 hover:underline"
                        >
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
                img({ src, alt }) {
                    return (
                        <img
                            src={src}
                            alt={alt}
                            className="rounded-2xl shadow-lg my-4"
                        />
                    )
                },
                table({ children }) {
                    return (
                        <div className="overflow-x-auto my-4">
                            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                                {children}
                            </table>
                        </div>
                    )
                },
                thead({ children }) {
                    return <thead className="bg-gray-50">{children}</thead>
                },
                th({ children }) {
                    return (
                        <th className="px-4 py-2 text-left text-sm font-bold text-gray-900 border-b border-gray-200">
                            {children}
                        </th>
                    )
                },
                td({ children }) {
                    return (
                        <td className="px-4 py-2 text-sm text-gray-600 border-b border-gray-200">
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
