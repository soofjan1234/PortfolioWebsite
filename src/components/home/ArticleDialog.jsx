import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadArticles } from '../../lib/article-library'

// 列表请求超过 12 秒即提供重试，避免访问者停留在无限加载状态。
const ARTICLE_TIMEOUT = 12000

/** 按需读取原 Markdown 文章库，集中处理取消、失败和无障碍焦点。 */
export default function ArticleDialog({ category, onClose }) {
    const dialog = useRef(null)
    const close = useRef(null)
    const [attempt, setAttempt] = useState(0)
    const [state, setState] = useState({ status: 'loading', items: [] })

    useEffect(() => {
        // 1. 打开时保留入口焦点、锁定背景，关闭后恢复原有阅读位置。
        const previousFocus = document.activeElement
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        close.current.focus()
        const keydown = (event) => {
            if (event.key === 'Escape') onClose()
            if (event.key !== 'Tab') return
            const elements = [
                ...dialog.current.querySelectorAll('button, a[href]'),
            ]
            const first = elements[0],
                last = elements.at(-1)
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            }
            if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }
        document.addEventListener('keydown', keydown)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', keydown)
            previousFocus?.focus({ preventScroll: true })
        }
    }, [onClose])

    useEffect(() => {
        // 2. 分类请求和重试共享同一取消边界，关闭窗口后不写回状态。
        const controller = new AbortController()
        let active = true
        const timeout = setTimeout(() => controller.abort(), ARTICLE_TIMEOUT)
        setState({ status: 'loading', items: [] })
        loadArticles(category, controller.signal)
            .then((items) => {
                if (active) setState({ status: 'ready', items })
            })
            .catch(() => {
                if (active) setState({ status: 'error', items: [] })
            })
            .finally(() => clearTimeout(timeout))
        return () => {
            active = false
            clearTimeout(timeout)
            controller.abort()
        }
    }, [category, attempt])

    return (
        <div
            className="article-backdrop"
            onClick={(event) => {
                if (event.target === event.currentTarget) onClose()
            }}
        >
            <section
                className="article-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="article-title"
                ref={dialog}
            >
                <div className="article-dialog-heading">
                    <div>
                        <p className="eyebrow">
                            TECH HUB / {category.category}
                        </p>
                        <h2 id="article-title">{category.title}</h2>
                    </div>
                    <button
                        ref={close}
                        type="button"
                        onClick={onClose}
                        aria-label="关闭文章列表"
                    >
                        ×
                    </button>
                </div>
                <p className="article-intro">{category.description}</p>
                <div className="article-list" aria-live="polite">
                    {state.status === 'loading' && (
                        <p role="status">正在加载文章列表…</p>
                    )}
                    {state.status === 'error' && (
                        <div className="article-error">
                            <p>文章列表暂时无法加载</p>
                            <button
                                type="button"
                                onClick={() => setAttempt((value) => value + 1)}
                            >
                                重新加载
                            </button>
                            <Link to="/projects" onClick={onClose}>
                                前往完整 Tech Hub
                            </Link>
                        </div>
                    )}
                    {state.status === 'ready' &&
                        state.items.map((item, index) => (
                            <a
                                key={`${item.href}-${index}`}
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <span className="article-number">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <span>{item.title}</span>
                                <span aria-hidden="true">↗</span>
                            </a>
                        ))}
                </div>
                <p className="article-dialog-note">
                    文章在新窗口打开 · {state.items.length || '—'} 篇
                </p>
            </section>
        </div>
    )
}
