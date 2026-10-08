import { useEffect, useRef } from 'react'
import { createResumeStickers } from './resume-stickers'
import { getMobileResumeFraming } from '../../lib/home-scroll'
import sceneConfig from '../../data/character-scene.json'
import { getCharacterLook } from './character-look'

// 首次下载和纹理初始化最多等待 18 秒；超时后阅读保持可用。
const MODEL_TIMEOUT = 18000

// glTF 米制坐标：两段履历对称取脸颊近景，朝下取景将黑发移出阅读区域。
const MOBILE_RESUME_SHOT = { position: [0.30, 0.32, 0.95], target: [0.04, -0.06, 0.18] }

/** 初始化独立三维场景；生命周期内拥有并清理全部 GPU 资源和事件。 */
export default function CharacterScene({ stateRef, policy, onStatus, viewportRef }) {
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
        const look = getCharacterLook(window.location.search)
        const lighting = look.lighting
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
                renderer.toneMappingExposure = lighting.exposure
                renderer.shadowMap.enabled = policy.dof
                renderer.shadowMap.type = THREE.VSMShadowMap
                scene = new THREE.Scene()
                scene.environmentIntensity = lighting.environment
                canvas = renderer.domElement
                canvas.setAttribute('aria-hidden', 'true')
                canvas.dataset.quality = look.natural ? 'natural' : 'current'
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
                scene.add(new THREE.HemisphereLight('#eef2dd', '#586979', lighting.hemisphere))
                const key = new THREE.DirectionalLight(lighting.keyColor, lighting.keyIntensity)
                key.position.set(...lighting.keyPosition)
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
                const softbox = new THREE.RectAreaLight(lighting.softColor, lighting.softIntensity, lighting.softWidth, lighting.softHeight)
                softbox.position.set(...lighting.softPosition)
                softbox.lookAt(0, 0.2, 0)
                scene.add(softbox)
                const fill = new THREE.DirectionalLight(lighting.fillColor, lighting.fillIntensity)
                fill.position.set(...lighting.fillPosition)
                scene.add(fill)
                const rim = new THREE.DirectionalLight(lighting.rimColor, lighting.rimIntensity)
                rim.position.set(...lighting.rimPosition)
                scene.add(rim)

                // 3. 仅加载白名单中的正式或候选资源；契约缺项也走失败恢复。
                const gltf = await new GLTFLoader().loadAsync(look.modelPath)
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
                    direction = new THREE.Vector3(),
                    resumePosition = new THREE.Vector3(),
                    resumeTarget = new THREE.Vector3(),
                    resumeRotation = new THREE.Quaternion(),
                    resumeMatrix = new THREE.Matrix4()
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

                // 阻尼按真实帧间隔计算；首次调整尚未绘制，后续调整必须立即恢复画面。
                let lastRender = performance.now(), hasRendered = false
                let size = { width: 0, height: 0, logicalHeight: 0 }

                /** 保持逻辑视口的构图，并向下扩展画布覆盖工具栏收起后的区域。 */
                const resize = () => {
                    const width = Math.max(1, element.clientWidth),
                        height = Math.max(1, element.clientHeight)
                    const logicalHeight = viewportRef?.current.height || height
                    if (size.width === width && size.height === height && size.logicalHeight === logicalHeight) return
                    // 1. 相同尺寸不清空缓冲；真实变化才重新分配画布和后期资源。
                    size = { width, height, logicalHeight }
                    renderer.setSize(width, height)
                    composer?.setSize(width, height)
                    // 2. 扩展视口只露出更多下方内容，不缩放原有可见区域的人物。
                    view.setViewOffset(width, logicalHeight, 0, 0, width, height)
                    view.updateProjectionMatrix()
                    // 3. ResizeObserver 晚于动画回调执行，不能等下一帧才填充清空的画布。
                    if (hasRendered && !document.hidden) {
                        if (bokeh) bokeh.uniforms.aspect.value = view.aspect
                        if (composer) composer.render()
                        else renderer.render(scene, view)
                    }
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
                    // 手机首屏沿用拉远补偿，履历段再平滑切入更低的脸颊近景。
                    if (!policy.gaze) {
                        cameraTarget.addScaledVector(
                            camera.getWorldDirection(direction),
                            -0.5,
                        )
                        const { mix, side } = getMobileResumeFraming(state.frame, sceneConfig.framesPerEntry)
                        resumePosition.fromArray(MOBILE_RESUME_SHOT.position)
                        resumeTarget.fromArray(MOBILE_RESUME_SHOT.target)
                        resumePosition.x *= side
                        resumeTarget.x *= side
                        cameraTarget.lerp(resumePosition, mix)
                        // 朝向与位置共用进度，反向滚动不会留下近景倾角。
                        resumeMatrix.lookAt(resumePosition, resumeTarget, view.up)
                        resumeRotation.setFromRotationMatrix(resumeMatrix)
                        gaze.slerp(resumeRotation, mix)
                    } else {
                        cameraTarget.x += pointer.x * 0.035
                        cameraTarget.y -= pointer.y * 0.02
                    }
                    view.quaternion.slerp(gaze, damping)
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
    }, [policy.scene, policy.gaze, policy.dof, policy.dpr, stateRef, onStatus, viewportRef])
    return <div ref={host} className="character-canvas" />
}
