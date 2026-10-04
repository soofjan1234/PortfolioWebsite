// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

vi.mock('./pages/Home', () => ({ default: () => <p>主页内容</p> }))
vi.mock('./pages/Projects', () => ({ default: () => <p>原 Tech Hub</p> }))
vi.mock('./pages/Experience', () => ({ default: () => <p>原履历页</p> }))
vi.mock('./pages/Blog', () => ({ default: () => null }))
beforeEach(() => {
    window.scrollTo = vi.fn()
    vi.stubGlobal('scrollY', 0)
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })))
})
afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

it('主页导航进入作品与 Tech Hub 锚点，手机菜单点击后关闭', () => {
    render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
    )
    expect(
        screen.getByRole('link', { name: 'WORKS' }).getAttribute('href'),
    ).toBe('#works')
    expect(
        screen.getByRole('link', { name: 'TECH HUB' }).getAttribute('href'),
    ).toBe('#tech-hub')
    fireEvent.click(screen.getByRole('button', { name: '打开导航菜单' }))
    fireEvent.click(screen.getAllByRole('link', { name: 'WORKS' })[1])
    expect(
        screen
            .getByRole('button', { name: '打开导航菜单' })
            .getAttribute('aria-expanded'),
    ).toBe('false')
})

it('原页面保留 Tech Hub 路由和主页返回入口', async () => {
    render(
        <MemoryRouter initialEntries={['/projects']}>
            <App />
        </MemoryRouter>,
    )
    expect(await screen.findByText('原 Tech Hub')).toBeTruthy()
    expect(
        screen.getByRole('link', { name: 'TECH HUB' }).getAttribute('href'),
    ).toBe('/projects')
    expect(
        screen.getByRole('link', { name: 'Soofjan 首页' }).getAttribute('href'),
    ).toBe('/')
})

it('联系窗口锁定背景，Escape 关闭后恢复入口焦点与滚动', () => {
    render(
        <MemoryRouter>
            <App />
        </MemoryRouter>,
    )
    const trigger = screen.getByRole('button', { name: 'Contact' })
    trigger.focus()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'WeChat Contact' })).toBeTruthy()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(trigger)
})

/** 发送真实滚动事件，验证导航对页面位置的公开响应。 */
function scrollToPosition(top) {
    vi.stubGlobal('scrollY', top)
    fireEvent.scroll(window)
}

it('超过 120px 显示回顶按钮，回到顶部后隐藏', () => {
    render(<MemoryRouter><App /></MemoryRouter>)
    expect(screen.queryByRole('button', { name: '回到顶部' })).toBeNull()
    scrollToPosition(120)
    expect(screen.queryByRole('button', { name: '回到顶部' })).toBeNull()
    scrollToPosition(121)
    expect(screen.getByRole('button', { name: '回到顶部' })).toBeTruthy()
    scrollToPosition(20)
    expect(screen.getByRole('button', { name: '回到顶部' })).toBeTruthy()
    scrollToPosition(0)
    expect(screen.queryByRole('button', { name: '回到顶部' })).toBeNull()
})

it.each([
    { reduced: false, behavior: 'smooth' },
    { reduced: true, behavior: 'instant' },
])('回顶遵循减少动态效果偏好：$reduced，并关闭菜单、保留键盘焦点', ({ reduced, behavior }) => {
    window.matchMedia.mockReturnValue({ matches: reduced })
    render(<MemoryRouter><App /></MemoryRouter>)
    scrollToPosition(600)
    fireEvent.click(screen.getByRole('button', { name: '打开导航菜单' }))
    const back = screen.getByRole('button', { name: '回到顶部' })
    back.focus()
    fireEvent.click(back)
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior })
    const menu = screen.getByRole('button', { name: '打开导航菜单' })
    expect(menu.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(menu)
})

it('回顶按钮只出现在首页，不改变独立文章页导航', async () => {
    render(<MemoryRouter initialEntries={['/projects']}><App /></MemoryRouter>)
    await screen.findByText('原 Tech Hub')
    scrollToPosition(600)
    expect(screen.queryByRole('button', { name: '回到顶部' })).toBeNull()
})
