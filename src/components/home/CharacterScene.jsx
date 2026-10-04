import { useEffect, useRef } from 'react'
import { createResumeStickers } from './resume-stickers'

// 首次下载和纹理初始化最多等待 18 秒；超时后阅读保持可用。
const MODEL_TIMEOUT = 18000

/** 初始化独立三维场景；生命周期内拥有并清理全部 GPU 资源和事件。 */
export default function CharacterScene({ stateRef, policy, onStatus }) {
    const host = useRef(null)
    useEffect(() => {
        let disposed = false,
            failed = false,
            renderer,
            composer,
            scene,
            environment,
            mixer,
            frame = 0
        let resizeObserver, canvas, onLost, onPointer, onVisibility
        const cleanupTasks = []
        const element = host.current
        const timer = setTimeout(fail, MODEL_TIMEOUT)
        onStatus('loading')

        /** 所有初始化、解析及上下文错误共享可读降级状态。 */
        function fail() {
            if (disposed || failed) return
            failed = true
            clearTimeout(timer)
            cancelAnimationFrame(frame)
            onStatus('error')
        }

        /** 释放迟到的下载或已卸载的模型，防止路由来回切换泄漏。 */
        function disposeModel(model) {
            const textures = new Set(),
                materials = new Set(),
                geometries = new Set()
            model.traverse((object) => {
                if (!object.isMesh) return
                geometries.add(object.geometry)
                for (const material of [].concat(object.material)) {
                    materials.add(material)
                    for (const value of Object.values(material))
                        if (value?.isTexture) textures.add(value)
                }
            })
            textures.forEach((texture) => texture.dispose())
            materials.forEach((material) => material.dispose())
            geometries.forEach((geometry) => geometry.dispose())
        }

        /** 按需加载 Three 和后期代码，HTML 内容不等待三维模块。 */
        async function initialize() {
            try {
                // 1. 并行加载本地模块；减少动态效果分支不会调用本组件。
                const [
                    THREE,
                    { GLTFLoader },
                    { RoomEnvironment },
                    { RectAreaLightUniformsLib },
                    { DecalGeometry },
                ] = await Promise.all([
                    import('three'),
                    import('three/addons/loaders/GLTFLoader.js'),
                    import('three/addons/environments/RoomEnvironment.js'),
                    import('three/addons/lights/RectAreaLightUniformsLib.js'),
                    import('three/addons/geometries/DecalGeometry.js'),
                ])
                if (disposed || failed) return
                renderer = new THREE.WebGLRenderer({
                    alpha: true,
                    antialias: true,
                    powerPreference: policy.dof
                        ? 'high-performance'
                        : 'low-power',
                })
                renderer.setPixelRatio(
                    Math.min(window.devicePixelRatio || 1, policy.dpr),
                )
                renderer.toneMapping = THREE.ACESFilmicToneMapping
                renderer.toneMappingExposure = 0.86
                renderer.shadowMap.enabled = policy.dof
                renderer.shadowMap.type = THREE.VSMShadowMap
                scene = new THREE.Scene()
                scene.environmentIntensity = 0.32
                canvas = renderer.domElement
                canvas.setAttribute('aria-hidden', 'true')
                element.append(canvas)
                onLost = (event) => {
                    event.preventDefault()
                    fail()
                }
                canvas.addEventListener('webglcontextlost', onLost)

                // 2. 沿用已验收模型的柔光，环境贴图在本地生成。
                const room = new RoomEnvironment(),
                    pmrem = new THREE.PMREMGenerator(renderer)
                environment = pmrem.fromScene(room, 0.04)
                scene.environment = environment.texture
                room.dispose()
                pmrem.dispose()
                scene.add(new THREE.HemisphereLight('#eef2dd', '#586979', 0.42))
                const key = new THREE.DirectionalLight('#ffe2cb', 0.65)
                key.position.set(3, 3.5, 4)
                key.castShadow = policy.dof
                key.shadow.mapSize.set(1024, 1024)
                Object.assign(key.shadow.camera, {
                    left: -1.3,
                    right: 1.3,
                    top: 1.5,
                    bottom: -1.3,
                    near: 0.1,
                    far: 12,
                })
                key.shadow.bias = -0.0001
                key.shadow.normalBias = 0.006
                key.shadow.radius = 14
                key.shadow.blurSamples = 8
                scene.add(key)
                RectAreaLightUniformsLib.init()
                const softbox = new THREE.RectAreaLight('#ffe8d8', 4.5, 4, 4)
                softbox.position.set(2.5, 2.5, 3.5)
                softbox.lookAt(0, 0.2, 0)
                scene.add(softbox)
                const fill = new THREE.DirectionalLight('#b3d5ec', 0.6)
                fill.position.set(-3, 1, 2)
                scene.add(fill)
                const rim = new THREE.DirectionalLight('#a8d4ed', 2.2)
                rim.position.set(-2, 3, -2)
                scene.add(rim)

                // 3. 下载只使用正式资源；契约缺项也走失败恢复。
                const gltf = await new GLTFLoader().loadAsync('/models/me.glb')
                if (disposed || failed) {
                    disposeModel(gltf.scene)
                    return
                }
                const model = gltf.scene,
                    camera = gltf.cameras[0]
                cleanupTasks.push(() => disposeModel(model))
                const clip = gltf.animations.find(
                    (item) => item.name === 'CameraAction',
                )
                const eyes = ['eye-left', 'eye-right'].map((name) =>
                    model.getObjectByName(name),
                )
                if (!camera || !clip || eyes.some((eye) => !eye))
                    throw new Error('Character contract unavailable')
                scene.add(model)
                canvas.dataset.stickers = String(createResumeStickers(THREE, DecalGeometry, model).length)
                model.traverse((object) => {
                    if (object.isMesh) {
                        object.castShadow = policy.dof
                        object.receiveShadow = policy.dof
                    }
                })
                const rests = eyes.map((eye) => eye.quaternion.clone())
                mixer = new THREE.AnimationMixer(model)
                const action = mixer.clipAction(clip)
                action.setLoop(THREE.LoopOnce, 1)
                action.clampWhenFinished = true
                action.play()
                const pointer = new THREE.Vector2(),
                    gaze = new THREE.Quaternion(),
                    euler = new THREE.Euler()
                const focus = new THREE.Vector3(),
                    focusA = new THREE.Vector3(),
                    focusB = new THREE.Vector3(),
                    cameraTarget = new THREE.Vector3(),
                    direction = new THREE.Vector3()
                const view = new THREE.PerspectiveCamera()
                view.copy(camera)
                // 初始构图沿用已验收相机；近景与主体大小由正式 GLB 提供。
                let bokeh, renderPass
                if (policy.dof) {
                    const [
                        { EffectComposer },
                        { RenderPass },
                        { BokehPass },
                        { OutputPass },
                    ] = await Promise.all([
                        import('three/addons/postprocessing/EffectComposer.js'),
                        import('three/addons/postprocessing/RenderPass.js'),
                        import('three/addons/postprocessing/BokehPass.js'),
                        import('three/addons/postprocessing/OutputPass.js'),
                    ])
                    if (disposed || failed) return
                    composer = new EffectComposer(renderer)
                    renderPass = new RenderPass(scene, view)
                    bokeh = new BokehPass(scene, view, {
                        focus: 3.2,
                        aperture: 0.0015,
                        maxblur: 0.003,
                    })
                    // Three 的景深默认写入不透明黑底；保留原颜色层 alpha，让 HTML 底色连续。
                    bokeh.materialBokeh.fragmentShader =
                        bokeh.materialBokeh.fragmentShader.replace(
                            'gl_FragColor.a = 1.0;',
                            'gl_FragColor.a = texture2D( tColor, vUv ).a;',
                        )
                    composer.addPass(renderPass)
                    composer.addPass(bokeh)
                    composer.addPass(new OutputPass())
                    cleanupTasks.push(() =>
                        composer.passes.forEach((pass) => pass.dispose?.()),
                    )
                }

                /** 画布按容器尺寸适配手机，横竖屏转换不沿用旧宽高比。 */
                const resize = () => {
                    const width = Math.max(1, element.clientWidth),
                        height = Math.max(1, element.clientHeight)
                    renderer.setSize(width, height)
                    composer?.setSize(width, height)
                    view.aspect = width / height
                    view.updateProjectionMatrix()
                }
                resizeObserver = new ResizeObserver(resize)
                resizeObserver.observe(element)
                resize()
                onPointer = (event) => {
                    if (!policy.gaze) return
                    pointer.set(
                        THREE.MathUtils.clamp(
                            (event.clientX / innerWidth) * 2 - 1,
                            -1,
                            1,
                        ),
                        THREE.MathUtils.clamp(
                            (event.clientY / innerHeight) * 2 - 1,
                            -1,
                            1,
                        ),
                    )
                }
                window.addEventListener('pointermove', onPointer, {
                    passive: true,
                })

                // 阻尼按真实帧间隔计算，避免高刷新率机器和手机出现不同运镜速度。
                let lastRender = performance.now(), hasRendered = false

                /** 相机和自动对焦读取同一帧，眼球保持独立球心旋转。 */
                function render() {
                    if (disposed || failed || document.hidden) return
                    const state = stateRef.current
                    canvas.dataset.frame = state.frame.toFixed(2)
                    canvas.dataset.stage = state.stage
                    canvas.dataset.gaze = String(policy.gaze)
                    canvas.dataset.dof = String(policy.dof)
                    // 下方栏目完全覆盖场景时不提交 GPU 绘制，滚回履历可立即恢复。
                    if (state.visible === false && hasRendered) {
                        frame = requestAnimationFrame(render)
                        return
                    }
                    action.time = Math.min(
                        state.frame / state.fps,
                        clip.duration,
                    )
                    mixer.update(0)
                    scene.updateMatrixWorld(true)
                    const now = performance.now()
                    // 首帧直接落到当前滚动目标；阻尼只作用于用户后续的滚动与指针输入。
                    const damping = hasRendered
                        ? 1 - Math.exp(-12 * Math.min(0.05, (now - lastRender) / 1000))
                        : 1
                    lastRender = now
                    camera.getWorldPosition(cameraTarget)
                    camera.getWorldQuaternion(gaze)
                    // 首屏略收窄视角并抬高相机，使半身模型延伸出底边，消除悬浮的裁切线。
                    const heroFraming = 1 - THREE.MathUtils.clamp(state.frame / 50, 0, 1)
                    // 窄屏拉远后补偿纵向落点，避免半身模型的底部裁切线重新露出。
                    cameraTarget.y += heroFraming * (policy.gaze ? 0.08 : 0.2)
                    view.fov = camera.fov * (1 - heroFraming * 0.1)
                    view.updateProjectionMatrix()
                    view.quaternion.slerp(gaze, damping)
                    // 窄屏拉远少量，避免人物两侧在横竖屏切换时被裁掉。
                    if (!policy.gaze)
                        cameraTarget.addScaledVector(
                            camera.getWorldDirection(direction),
                            -0.5,
                        )
                    else {
                        cameraTarget.x += pointer.x * 0.035
                        cameraTarget.y -= pointer.y * 0.02
                    }
                    view.position.lerp(cameraTarget, damping)
                    eyes.forEach((eye, index) => {
                        euler.set(
                            policy.gaze ? pointer.y * 0.22 : 0,
                            policy.gaze ? pointer.x * 0.38 : 0,
                            0,
                        )
                        gaze.setFromEuler(euler)
                        eye.quaternion.copy(rests[index]).multiply(gaze)
                    })
                    if (bokeh) {
                        const from = model.getObjectByName(state.focusFrom),
                            to = model.getObjectByName(state.focusTo)
                        if (!from || !to) {
                            fail()
                            return
                        }
                        from.getWorldPosition(focusA)
                        to.getWorldPosition(focusB)
                        focus.lerpVectors(focusA, focusB, state.focusMix)
                        direction.copy(focus).sub(view.position)
                        bokeh.uniforms.focus.value = Math.max(
                            0.1,
                            direction.dot(view.getWorldDirection(focusA)),
                        )
                        // 近景加深景深，远景轻量虚化；与同一时间轴同步恢复。
                        const closeUp = Math.sin(Math.min(1, state.frame / 150) * Math.PI)
                        bokeh.uniforms.aperture.value = 0.0015 + closeUp * 0.003
                        bokeh.uniforms.maxblur.value = 0.003 + closeUp * 0.006
                        bokeh.uniforms.aspect.value = view.aspect
                        bokeh.uniforms.nearClip.value = view.near
                        bokeh.uniforms.farClip.value = view.far
                        composer.render()
                    } else renderer.render(scene, view)
                    canvas.dataset.eyeRotation = eyes[0].quaternion
                        .toArray()
                        .map((value) => value.toFixed(4))
                        .join(',')
                    canvas.dataset.cameraPosition = view.position
                        .toArray()
                        .map((value) => value.toFixed(4))
                        .join(',')
                    // 先提交完整画面，再撤下占位图；失败时始终保留可读降级。
                    if (!hasRendered) {
                        hasRendered = true
                        clearTimeout(timer)
                        onStatus('ready')
                    }
                    frame = requestAnimationFrame(render)
                }
                onVisibility = () => {
                    cancelAnimationFrame(frame)
                    if (!document.hidden) render()
                }
                document.addEventListener('visibilitychange', onVisibility)
                render()
            } catch {
                fail()
            }
        }
        initialize()
        return () => {
            disposed = true
            clearTimeout(timer)
            cancelAnimationFrame(frame)
            resizeObserver?.disconnect()
            if (onPointer) window.removeEventListener('pointermove', onPointer)
            if (onVisibility)
                document.removeEventListener('visibilitychange', onVisibility)
            if (onLost) canvas.removeEventListener('webglcontextlost', onLost)
            mixer?.stopAllAction()
            cleanupTasks.forEach((cleanup) => cleanup())
            scene?.traverse((object) => {
                if (object.isLight) object.dispose?.()
            })
            environment?.dispose()
            composer?.dispose()
            renderer?.dispose()
            canvas?.remove()
        }
    }, [policy.scene, policy.gaze, policy.dof, policy.dpr, stateRef, onStatus])
    return <div ref={host} className="character-canvas" />
}
