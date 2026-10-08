import { useLayoutEffect, useRef } from 'react'

/** 读取布局基准与画布覆盖尺寸；工具栏动画不参与手机布局计算。 */
function readViewport() {
    const width = Math.max(1, window.innerWidth)
    const height = Math.max(1, window.innerHeight)
    const mobile = width < 900 || window.matchMedia('(pointer: coarse)').matches
    // 屏幕尺寸只用于向下扩展画布，保持当前可见区域的构图与文字位置。
    const screenWidth = window.screen.width || width
    const screenHeight = window.screen.height || height
    const coverage = width > height
        ? Math.min(screenWidth, screenHeight)
        : Math.max(screenWidth, screenHeight)
    return {
        width, height, mobile,
        sceneHeight: mobile ? Math.max(height, coverage) : height,
        orientation: window.screen.orientation?.angle ?? window.orientation ?? null,
    }
}

/** 在绘制前统一 CSS 与镜头基准；手机仅在宽度、方向或设备能力变化时重建。 */
export function useHomeViewport(page) {
    const viewport = useRef(null)
    if (!viewport.current) viewport.current = readViewport()
    useLayoutEffect(() => {
        const pointer = window.matchMedia('(pointer: coarse)')
        /** 工具栏只改变可见区域，不能推动履历、叠层或镜头时间轴。 */
        function update() {
            const next = readViewport()
            const previous = viewport.current
            if (!next.mobile || next.width !== previous.width ||
                next.mobile !== previous.mobile || next.orientation !== previous.orientation) {
                viewport.current = next
            }
            const { height, sceneHeight } = viewport.current
            page.current.style.setProperty('--home-height', `${height}px`)
            page.current.style.setProperty('--home-vh', `${height / 100}px`)
            page.current.style.setProperty('--home-scene-height', `${sceneHeight}px`)
            page.current.dataset.compactHeight = String(height <= 500)
            page.current.dataset.mobileViewport = String(viewport.current.mobile)
        }
        update()
        window.addEventListener('resize', update, { passive: true })
        window.addEventListener('orientationchange', update)
        pointer.addEventListener?.('change', update)
        return () => {
            window.removeEventListener('resize', update)
            window.removeEventListener('orientationchange', update)
            pointer.removeEventListener?.('change', update)
        }
    }, [page])
    return viewport
}
