// @vitest-environment jsdom
import React from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import * as THREE from 'three'
import CharacterScene from './CharacterScene'

// 保留真实相机和动画插值，仅替换需要 GPU、网络的边界。
const probe = vi.hoisted(() => ({ frames: [], nextFrame: null }))
vi.mock('three', async (original) => ({
    ...(await original()),
    WebGLRenderer: class {
        domElement = document.createElement('canvas')
        shadowMap = {}
        setPixelRatio() {}
        setSize() {}
        dispose() {}
        render(_scene, camera) {
            probe.frames.push(camera.position.toArray())
        }
    },
    PMREMGenerator: class {
        fromScene() { return { texture: null, dispose() {} } }
        dispose() {}
    },
}))
vi.mock('three/addons/loaders/GLTFLoader.js', () => ({
    GLTFLoader: class { loadAsync() { return Promise.resolve(createModel()) } },
}))
vi.mock('./resume-stickers', () => ({ createResumeStickers: () => [] }))

/** 最小场景保留首页实际使用的相机轨道、双眼和焦点节点契约。 */
function createModel() {
    const scene = new THREE.Group()
    const camera = new THREE.PerspectiveCamera(38)
    camera.name = 'ResumeCamera'
    camera.position.set(0, 0.17, 3.3)
    scene.add(camera)
    for (const name of ['eye-left', 'eye-right', 'focus-start', 'focus-1']) {
        const node = new THREE.Object3D()
        node.name = name
        scene.add(node)
    }
    const clip = new THREE.AnimationClip('CameraAction', 5, [
        new THREE.VectorKeyframeTrack('ResumeCamera.position', [0, 5], [0, 0.17, 3.3, 1, 0.4, 2]),
    ])
    return { scene, cameras: [camera], animations: [clip] }
}

beforeEach(() => {
    probe.frames = []
    probe.nextFrame = null
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback) => {
        probe.nextFrame = callback
        return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
})

/** 以页面当前滚动状态挂载，ready 事件记录当时已绘制的帧数。 */
async function mountScene(overrides = {}, gaze = true) {
    const stateRef = { current: { frame: 0, fps: 24, stage: 'start', focusFrom: 'focus-start', focusTo: 'focus-1', focusMix: 0, ...overrides } }
    const readyFrames = []
    const onStatus = vi.fn((status) => {
        if (status === 'ready') readyFrames.push(probe.frames.length)
    })
    render(<CharacterScene stateRef={stateRef} policy={{ scene: true, gaze, dof: false, dpr: 1 }} onStatus={onStatus} />)
    await waitFor(() => expect(onStatus).toHaveBeenCalledWith('ready'))
    return { stateRef, readyFrames }
}

it('首个可见画面直接到达首页落点，不从导出相机逐帧靠近', async () => {
    await mountScene()
    expect(probe.frames[0][1]).toBeCloseTo(0.25, 6)
    expect(probe.frames[0][2]).toBeCloseTo(3.3, 6)
})

it('窄屏首次绘制直接包含拉远补偿', async () => {
    await mountScene({}, false)
    expect(probe.frames[0][2]).toBeCloseTo(3.8, 6)
    expect(probe.frames[0][1]).toBeCloseTo(0.37, 6)
})

it('首帧绘制成功后才通知页面隐藏占位图', async () => {
    const { readyFrames } = await mountScene()
    expect(readyFrames).toEqual([1])
})

it('从页面中段初始化时直接使用当前帧，后续滚动仍平滑推进', async () => {
    const { stateRef } = await mountScene({ frame: 120 })
    expect(probe.frames[0]).toEqual([1, expect.closeTo(0.4, 6), 2])
    stateRef.current.frame = 0
    probe.nextFrame()
    expect(probe.frames.at(-1)[0]).toBeGreaterThan(0)
    expect(probe.frames.at(-1)[0]).toBeLessThan(1)
})
