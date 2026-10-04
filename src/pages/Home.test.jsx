// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'

vi.mock('../components/home/CharacterScene', () => ({
    default: ({ onStatus }) => {
        React.useEffect(() => {
            onStatus('error')
        }, [onStatus])
        return null
    },
}))

beforeEach(() => {
    window.matchMedia = vi.fn((query) => ({
        matches: query.includes('reduced') && false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    }))
    global.ResizeObserver = class {
        observe() {}
        disconnect() {}
    }
    window.scrollTo = vi.fn()
    global.fetch = vi.fn(async () => ({
        ok: true,
        text: async () => '切片扩容 https://example.com/slice\n',
    }))
})
afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
})
const mount = () =>
    render(
        <MemoryRouter>
            <Home />
        </MemoryRouter>,
    )

describe('主页阅读与降级', () => {
    it('完整文章库在新标签打开个人掘金文章页', () => {
        mount()
        const link = screen.getByRole('link', { name: '完整文章库 ↗' })
        expect(link.getAttribute('href')).toBe('https://juejin.cn/user/4074147977125020/posts')
        expect(link.getAttribute('target')).toBe('_blank')
        expect(link.getAttribute('rel')).toContain('noopener')
    })
    it('项目清单移除内容创作助手并加入三个指定仓库', () => {
        mount()
        expect(screen.queryByRole('link', { name: '查看项目：内容创作助手' })).toBeNull()
        for (const [title, repo] of [['Agent Playbook', 'agent-playbook'], ['mini-k8s', 'mini-k8s'], ['Feed', 'Feed']]) {
            expect(screen.getByRole('link', { name: '查看项目：' + title }).getAttribute('href')).toBe('https://github.com/soofjan1234/' + repo)
        }
        expect(document.querySelector('.work-topline').textContent).toContain('01 / 06')
    })
    it('Redis 卡片显示完整名称', () => {
        mount()
        expect(document.querySelector('.tech-card:last-child .tech-mark').textContent).toBe('Redis')
    })
    it('文章在项目之前，分类按技术归并', () => {
        mount()
        expect([...document.querySelectorAll('[data-rail]')].map(el => el.dataset.rail)).toEqual(['tech-hub', 'works'])
        expect(screen.getAllByRole('button', { name: /^阅读 / })).toHaveLength(3)
    })
    it('模型失败仍可读履历、所有作品、Tech Hub 和联系入口', async () => {
        mount()
        await screen.findByText('3D 暂时无法加载，已切换静态展示')
        expect(screen.getByRole('heading', { name: '广州大学' })).toBeTruthy()
        expect(
            screen.getByRole('heading', { name: 'Go 后端工程师' }),
        ).toBeTruthy()
        expect(screen.getAllByRole('link', { name: /查看项目/ })).toHaveLength(
            6,
        )
        expect(screen.getByRole('heading', { name: 'Tech Hub' })).toBeTruthy()
        expect(
            screen.getByRole('link', { name: /发送邮件/ }).getAttribute('href'),
        ).toMatch(/^mailto:/)
    })
    it('减少动态效果保留人物静态展示及阅读，禁用滚动横移', () => {
        window.matchMedia = vi.fn((query) => ({
            matches: query.includes('prefers-reduced-motion'),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }))
        mount()
        expect(screen.getByText('静态展示 · 减少动态效果')).toBeTruthy()
        expect(document.querySelector('.static-character').getAttribute('src')).toBe('/images/character-static-compact.png')
        expect(
            document.querySelector('[data-rail="tech-hub"]').dataset.mode,
        ).toBe('native')
    })
    it('窄屏占位图使用同设备构图，模型失败后仍保留该版本', async () => {
        vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390)
        mount()
        await screen.findByText('3D 暂时无法加载，已切换静态展示')
        expect(document.querySelector('.static-character').getAttribute('src')).toBe('/images/character-static-compact.png')
    })
    it('分类文章直接复用现有 Markdown 链接', async () => {
        mount()
        fireEvent.click(
            screen.getByRole('button', { name: '阅读 Go 语言基础与进阶' }),
        )
        const link = await screen.findByRole('link', { name: /切片扩容/ })
        expect(link.getAttribute('href')).toBe('https://example.com/slice')
        expect(fetch).toHaveBeenCalledWith(
            '/knowledge/go.md',
            expect.objectContaining({ signal: expect.any(AbortSignal) }),
        )
        fireEvent.click(screen.getByRole('button', { name: '关闭文章列表' }))
        expect(screen.queryByRole('dialog')).toBeNull()
    })
    it('文章请求失败提供重试并保留 Tech Hub 路由', async () => {
        global.fetch = vi
            .fn()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValue({
                ok: true,
                text: async () => '重试成功 https://example.com/retry',
            })
        mount()
        fireEvent.click(
            screen.getByRole('button', { name: '阅读 Go 语言基础与进阶' }),
        )
        await screen.findByText('文章列表暂时无法加载')
        expect(
            screen
                .getByRole('link', { name: '前往完整 Tech Hub' })
                .getAttribute('href'),
        ).toBe('/projects')
        fireEvent.click(screen.getByRole('button', { name: '重新加载' }))
        await screen.findByRole('link', { name: /重试成功/ })
    })
    it('Escape 关闭文章列表并恢复分类按钮焦点', async () => {
        mount()
        const trigger = screen.getByRole('button', {
            name: '阅读 Go 语言基础与进阶',
        })
        trigger.focus()
        fireEvent.click(trigger)
        await screen.findByRole('dialog')
        fireEvent.keyDown(document, { key: 'Escape' })
        await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
        expect(document.activeElement).toBe(trigger)
    })
})
