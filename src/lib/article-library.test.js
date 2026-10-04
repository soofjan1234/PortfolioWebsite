import { readFile } from 'node:fs/promises'
import { afterEach, expect, it, vi } from 'vitest'
import { techCategories } from '../data/home-content'
import { loadArticles } from './article-library'
import { getSceneState } from './home-scroll'

afterEach(() => vi.unstubAllGlobals())
it('现有八个来源归并为三个技术分类，63 篇链接全部保留', async () => {
    vi.stubGlobal('fetch', vi.fn(async path => ({ ok: true, text: () => readFile(`public${path}`, 'utf8') })))
    const lists = await Promise.all(techCategories.map(category => loadArticles(category)))
    expect(techCategories.map(category => category.id)).toEqual(['go', 'mysql', 'redis'])
    expect(lists.map(items => items.length)).toEqual([39, 15, 9])
    expect(new Set(lists.flat().map(item => item.href)).size).toBe(63)
})
it('重复链接只显示一次，任何来源失败都允许整组重试', async () => {
    const category = { paths: ['/a', '/b'] }
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => '标题 https://example.com/a' })))
    expect(await loadArticles(category)).toHaveLength(1)
    fetch.mockResolvedValueOnce({ ok: false })
    await expect(loadArticles(category)).rejects.toThrow('unavailable')
    expect(await loadArticles(category)).toHaveLength(1)
})
it('文章先于项目时，正反向滚动保留各自模型节点和焦点', () => {
    const anchors = [{id:'start',top:0,focus:'start'}, {id:'tech-hub',top:1000,frame:200,focus:'tech'}, {id:'works',top:2000,frame:150,focus:'works'}]
    const config = { framesPerEntry:50 }
    expect(getSceneState(700,1000,anchors,config)).toMatchObject({frame:200,stage:'tech-hub',focusFrom:'tech'})
    expect(getSceneState(1200,1000,anchors,config).frame).toBe(175)
    expect(getSceneState(1700,1000,anchors,config)).toMatchObject({frame:150,stage:'works',focusFrom:'works'})
    expect(getSceneState(700,1000,anchors,config).frame).toBe(200)
})
