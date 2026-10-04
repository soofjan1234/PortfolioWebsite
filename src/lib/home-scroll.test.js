import { describe, expect, it } from 'vitest'
import { getSceneState, getHorizontalState, getMotionPolicy, parseArticleLinks, getHomePresentation } from './home-scroll'

const config = { fps: 24, framesPerEntry: 50 }
const anchors = [
    { id: 'start', focus: 'focus-start', top: 0 },
    { id: 'education', focus: 'focus-1', top: 1000 },
    { id: 'work', focus: 'focus-2', top: 2000 },
    { id: 'works', focus: 'focus-works', top: 3000 },
    { id: 'tech-hub', focus: 'focus-tech-hub', top: 5000 },
]

describe('主页滚动契约', () => {
    it('履历前后各留出 35% 阅读停顿，镜头在中段推进', () => {
        expect(getSceneState(1000, 1000, anchors, config).frame).toBe(50)
        expect(getSceneState(1400, 1000, anchors, config).frame).toBe(100)
    })
    it('首屏文字淡出、右侧磨砂与作品压暗可反向恢复', () => {
        const start = getHomePresentation(0, 1000, 3000)
        expect(start).toMatchObject({ heroOpacity: 1, heroBlur: 0, railOpacity: 0, fogOpacity: 0 })
        expect(getHomePresentation(1100, 1000, 3000)).toMatchObject({ heroOpacity: 0, railOpacity: 1, fogOpacity: 0 })
        expect(getHomePresentation(3000, 1000, 3000).fogOpacity).toBeCloseTo(0.41)
        expect(getHomePresentation(0, 1000, 3000)).toEqual(start)
    })
    it('首屏和每个履历共享模型的 50 帧节点', () => {
        expect(getSceneState(0, 1000, anchors, config).frame).toBe(0)
        expect(getSceneState(700, 1000, anchors, config)).toMatchObject({ frame: 50, stage: 'education' })
        expect(getSceneState(1700, 1000, anchors, config).frame).toBe(100)
        expect(getSceneState(2700, 1000, anchors, config).frame).toBe(150)
        expect(getSceneState(4700, 1000, anchors, config).frame).toBe(200)
    })
    it('焦点和镜头同步插值，反向滚动不依赖历史状态', () => {
        const forward = getSceneState(1200, 1000, anchors, config)
        getSceneState(4700, 1000, anchors, config)
        expect(getSceneState(1200, 1000, anchors, config)).toEqual(forward)
        expect(forward).toMatchObject({ frame: 75, focusFrom: 'focus-1', focusTo: 'focus-2' })
        expect(forward.focusMix).toBeCloseTo(0.5)
    })
    it('越界钳位，节点增删不硬编码总数', () => {
        expect(getSceneState(-40, 1000, anchors, config).frame).toBe(0)
        expect(getSceneState(99999, 1000, anchors.slice(0, 3), config).frame).toBe(100)
    })
    it('桌面横移 1:1，栏目末尾与反向退出可恢复', () => {
        const layout = { height: 1800, viewportHeight: 800, trackWidth: 2200, viewportWidth: 1200 }
        expect(getHorizontalState({ ...layout, top: 300 })).toEqual({ progress: 0, offset: 0 })
        expect(getHorizontalState({ ...layout, top: -500 })).toEqual({ progress: 0.5, offset: 500 })
        expect(getHorizontalState({ ...layout, top: -1300 })).toEqual({ progress: 1, offset: 1000 })
        expect(getHorizontalState({ ...layout, top: 30 }).offset).toBe(0)
    })
    it('无溢出轨道没有额外滚动距离', () => {
        expect(getHorizontalState({ top: -30, height: 800, viewportHeight: 800, trackWidth: 400, viewportWidth: 1200 })).toEqual({ progress: 0, offset: 0 })
    })
    it.each([{ coarse: true }, { width: 390 }, { reduced: true }])('触屏/手机/减少动态效果使用直接横滑：%o', (overrides) => {
        const policy = getMotionPolicy({ width: 1440, coarse: false, reduced: false, ...overrides })
        expect(policy.horizontal).toBe('native')
        expect(policy.gaze).toBe(false)
        expect(policy.dof).toBe(false)
    })
    it('桌面开启互动；减少动态效果停止 3D', () => {
        expect(getMotionPolicy({ width: 1440, coarse: false, reduced: false })).toMatchObject({ scene: true, gaze: true, dof: true, dpr: 1.75, horizontal: 'scroll' })
        expect(getMotionPolicy({ width: 1440, coarse: false, reduced: true }).scene).toBe(false)
    })
    it('保留 Markdown 中的文章标题和 HTTP 链接，排除无链接及不安全协议', () => {
        expect(parseArticleLinks('分类\n切片扩容 https://example.com/a\n[源码](https://example.com/b)\n无链接\n坏链接 javascript:alert(1)')).toEqual([
            { title: '切片扩容', href: 'https://example.com/a' }, { title: '源码', href: 'https://example.com/b' },
        ])
    })
})
