// @vitest-environment jsdom
import { useRef } from 'react'
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useHomeViewport } from './useHomeViewport'

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

/** 模拟同一手机收放工具栏，保留真实 hook 的事件订阅和 CSS 输出。 */
function mountViewport(width = 390, height = 650, coarse = false) {
    vi.stubGlobal('innerWidth', width)
    vi.stubGlobal('innerHeight', height)
    vi.stubGlobal('screen', { width: 390, height: 844 })
    vi.stubGlobal('matchMedia', () => ({ matches: coarse }))
    const root = document.createElement('div')
    return { root, ...renderHook(() => useHomeViewport(useRef(root))) }
}

it('手机工具栏收放不移动布局基准，并预留整个屏幕的画布覆盖区', () => {
    const { root, result } = mountViewport()
    const baseline = result.current.current
    for (const height of [750, 700, 480, 650]) {
        act(() => { window.innerHeight = height; window.dispatchEvent(new Event('resize')) })
        expect(result.current.current).toEqual(baseline)
        expect(root.style.getPropertyValue('--home-height')).toBe('650px')
        expect(root.style.getPropertyValue('--home-scene-height')).toBe('844px')
        expect(root.dataset.compactHeight).toBe('false')
    }
})

it('横竖屏切换重建布局与画布基准', () => {
    const { root, result } = mountViewport()
    act(() => { window.innerWidth = 844; window.innerHeight = 300; window.dispatchEvent(new Event('resize')) })
    expect(result.current.current.height).toBe(300)
    expect(root.style.getPropertyValue('--home-height')).toBe('300px')
    expect(root.style.getPropertyValue('--home-scene-height')).toBe('390px')
})

it('宽屏触屏设备同样忽略工具栏引起的高度变化', () => {
    const { result } = mountViewport(1024, 650, true)
    act(() => { window.innerHeight = 750; window.dispatchEvent(new Event('resize')) })
    expect(result.current.current.height).toBe(650)
})

it('桌面窗口高度变化继续正常适配', () => {
    const { root, result } = mountViewport(1280, 720)
    act(() => { window.innerHeight = 900; window.dispatchEvent(new Event('resize')) })
    expect(result.current.current.height).toBe(900)
    expect(root.style.getPropertyValue('--home-height')).toBe('900px')
})
