import { useEffect, useRef, useState } from 'react'
import { getHorizontalState } from '../../lib/home-scroll'

/** 桌面纵滚推进横轨；手机和静态模式保留原生横滑及键盘入口。 */
export default function HorizontalSection({
    id,
    title,
    eyebrow,
    description,
    mode,
    children,
    extra,
}) {
    const section = useRef(null)
    const viewport = useRef(null)
    const track = useRef(null)
    const [overflow, setOverflow] = useState(0)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        let animation = 0
        // 1. 图片和字体加载后重新测量，栏目高度始终匹配真实横向距离。
        const measure = () =>
            setOverflow(
                Math.max(
                    0,
                    track.current.scrollWidth - viewport.current.clientWidth,
                ),
            )
        const update = () => {
            animation = 0
            if (mode === 'scroll') {
                const state = getHorizontalState({
                    top: section.current.getBoundingClientRect().top,
                    height: section.current.offsetHeight,
                    viewportHeight: window.innerHeight,
                    trackWidth: track.current.scrollWidth,
                    viewportWidth: viewport.current.clientWidth,
                })
                viewport.current.scrollLeft = state.offset
                setProgress(state.progress)
            } else {
                const range =
                    track.current.scrollWidth - viewport.current.clientWidth
                setProgress(range > 0 ? viewport.current.scrollLeft / range : 0)
            }
        }
        const schedule = () => {
            if (!animation) animation = requestAnimationFrame(update)
        }
        const resize = new ResizeObserver(() => {
            measure()
            schedule()
        })
        resize.observe(track.current)
        resize.observe(viewport.current)
        measure()
        schedule()
        window.addEventListener('scroll', schedule, { passive: true })
        window.addEventListener('resize', schedule, { passive: true })
        const element = viewport.current
        element.addEventListener('scroll', schedule, { passive: true })
        return () => {
            resize.disconnect()
            cancelAnimationFrame(animation)
            window.removeEventListener('scroll', schedule)
            window.removeEventListener('resize', schedule)
            element.removeEventListener('scroll', schedule)
        }
    }, [mode, overflow])

    /** 导航按钮和焦点使用同一滚动位置，避免隐藏的卡片无法操作。 */
    function move(direction) {
        const offset = Math.max(
            0,
            Math.min(
                overflow,
                viewport.current.scrollLeft +
                    direction * viewport.current.clientWidth * 0.8,
            ),
        )
        if (mode === 'scroll') {
            window.scrollTo({
                top:
                    window.scrollY +
                    section.current.getBoundingClientRect().top +
                    offset,
                behavior: 'smooth',
            })
        } else
            viewport.current.scrollTo({
                left: offset,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                    .matches
                    ? 'instant'
                    : 'smooth',
            })
    }

    /** 原生 Tab 聚焦后同步桌面纵向位置，下一帧不会把焦点滚回屏外。 */
    function followFocus(event) {
        if (mode !== 'scroll') return
        // 鼠标按下会先聚焦；此时移动卡片会使随后的抬起失去点击目标。
        // 仅键盘焦点需要自动推进纵向位置，指针点击保持原位。
        if (!event.target.matches(':focus-visible')) return
        const card = event.target.closest('[data-rail-card]')
        if (!card) return
        const offset = Math.min(
            overflow,
            Math.max(0, card.offsetLeft - track.current.offsetLeft),
        )
        window.scrollTo({
            top:
                window.scrollY +
                section.current.getBoundingClientRect().top +
                offset,
            behavior: 'instant',
        })
    }

    return (
        <section
            id={id}
            ref={section}
            className={`horizontal-section ${id}`}
            data-rail={id}
            data-mode={mode}
            style={
                mode === 'scroll'
                    ? { height: `calc(100svh + ${overflow}px)` }
                    : undefined
            }
        >
            <div className="horizontal-sticky">
                <div className="rail-heading" data-scene-anchor={id}>
                    <div>
                        <p className="eyebrow">{eyebrow}</p>
                        <h2>{title}</h2>
                        <p className="rail-description">{description}</p>
                    </div>
                    <div className="rail-actions">
                        {extra}
                        <div className="rail-buttons">
                            <button
                                type="button"
                                aria-label={`上一组${title}`}
                                onClick={() => move(-1)}
                                disabled={progress <= 0.001}
                            >
                                ←
                            </button>
                            <button
                                type="button"
                                aria-label={`下一组${title}`}
                                onClick={() => move(1)}
                                disabled={progress >= 0.999}
                            >
                                →
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    ref={viewport}
                    className="rail-viewport"
                    onFocusCapture={followFocus}
                >
                    <div ref={track} className="rail-track">
                        {children}
                    </div>
                </div>
                <div className="rail-footer">
                    <span>
                        {mode === 'scroll'
                            ? '向下滚动，继续探索'
                            : '左右滑动，继续探索'}
                    </span>
                    <div className="rail-progress" aria-hidden="true">
                        <span
                            style={{ width: `${Math.max(6, progress * 100)}%` }}
                        />
                    </div>
                    <span>
                        {String(Math.round(progress * 100)).padStart(2, '0')} /
                        100
                    </span>
                </div>
            </div>
        </section>
    )
}
