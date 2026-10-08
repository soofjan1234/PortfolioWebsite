import {
    Component,
    lazy,
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react'
import sceneConfig from '../data/character-scene.json'
import { works, techCategories } from '../data/home-content'
import { getSceneState, getHomePresentation } from '../lib/home-scroll'
import { useHomeMotion } from '../components/home/useHomeMotion'
import { useHomeViewport } from '../components/home/useHomeViewport'
import HorizontalSection from '../components/home/HorizontalSection'
import ArticleDialog from '../components/home/ArticleDialog'
import './Home.css'

// 三维独立拆包，文字和链接无需等待模型或着色器下载。
const CharacterScene = lazy(() => import('../components/home/CharacterScene'))
const sceneAnchors = [
    { id: 'start', focus: sceneConfig.startFocus },
    ...sceneConfig.resume.map(({ id, focus }) => ({ id, focus })),
    // 保留模型原始相机节点，阅读顺序独立于动画帧序。
    { id: 'tech-hub', focus: sceneConfig.techHubFocus, frame: 200 },
    { id: 'works', focus: sceneConfig.worksFocus, frame: 150 },
]

/** 三维分包下载异常也只影响人物区域，避免中断 HTML 阅读。 */
class SceneBoundary extends Component {
    state = { failed: false }
    /** 在渲染失败后停止三维子树，避免错误重复触发。 */
    static getDerivedStateFromError() {
        return { failed: true }
    }
    /** 将分包或渲染错误交给主页统一展示静态降级状态。 */
    componentDidCatch() {
        this.props.onError('error')
    }
    /** 正常渲染三维内容，失败时由外层静态人物接替。 */
    render() {
        return this.state.failed ? null : this.props.children
    }
}

/** 装配人物、统一履历、作品和文章入口，HTML 阅读独立于场景状态。 */
export default function Home() {
    const page = useRef(null)
    const viewport = useHomeViewport(page)
    const policy = useHomeMotion()
    const [sceneStatus, setSceneStatus] = useState('loading')
    const [selectedCategory, setSelectedCategory] = useState(null)
    const closeArticles = useCallback(() => setSelectedCategory(null), [])
    // DOM 尚未测量时停在首屏；不能把全部零坐标误判成时间轴末尾。
    const sceneState = useRef({
        frame: 0,
        focusFrom: sceneConfig.startFocus,
        focusTo: sceneConfig.resume[0].focus,
        focusMix: 0,
        stage: 'start',
        fps: sceneConfig.fps,
    })
    const [stage, setStage] = useState('start')
    const updateStatus = useCallback((status) => setSceneStatus(status), [])

    useEffect(() => {
        let animation = 0
        /** 文字锚点使用真实文档坐标，横向栏目固定后仍保留稳定起点。 */
        const update = () => {
            animation = 0
            const anchors = sceneAnchors.map((anchor) => {
                const element = page.current.querySelector(
                    `[data-scene-anchor="${anchor.id}"]`,
                )
                const root = element.closest('[data-rail]') || element
                return {
                    ...anchor,
                    top: root.getBoundingClientRect().top + window.scrollY,
                }
            })
            const state = getSceneState(
                window.scrollY,
                viewport.current.height,
                anchors,
                sceneConfig,
            )
            sceneState.current = {
                ...state,
                fps: sceneConfig.fps,
                // 作品从右侧滑入时仍能看到背景人物，只有联系区完全覆盖后暂停绘制。
                visible: page.current.querySelector('#contact').getBoundingClientRect().top > 0,
            }
            const presentation = getHomePresentation(window.scrollY, viewport.current.height, anchors.find((anchor) => anchor.id === 'tech-hub').top)
            Object.entries(presentation).forEach(([name, value]) => page.current.style.setProperty(`--${name}`, value))
            setStage(state.stage)
        }
        const schedule = () => {
            if (!animation) animation = requestAnimationFrame(update)
        }
        window.addEventListener('scroll', schedule, { passive: true })
        window.addEventListener('resize', schedule, { passive: true })
        const observer = new ResizeObserver(schedule)
        observer.observe(page.current)
        update()
        return () => {
            cancelAnimationFrame(animation)
            observer.disconnect()
            window.removeEventListener('scroll', schedule)
            window.removeEventListener('resize', schedule)
        }
    }, [viewport])

    const statusText = !policy.scene
        ? '静态展示 · 减少动态效果'
        : sceneStatus === 'error'
          ? '3D 暂时无法加载，已切换静态展示'
          : sceneStatus === 'ready'
            ? '人物已就位'
            : '人物加载中，内容可先浏览'
    const modelVisible = policy.scene && sceneStatus === 'ready'

    return (
        <div
            className="home-page"
            ref={page}
            data-scene-status={!policy.scene ? 'static' : sceneStatus}
            data-stage={stage}
        >
            <div
                className={`home-scene ${modelVisible ? 'is-ready' : ''}`}
                aria-hidden="true"
            >
                <img
                    className="static-character"
                    src={policy.gaze ? '/images/character-static.png' : '/images/character-static-compact.png'}
                    alt=""
                    onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = '/avator.png'
                    }}
                />
                {policy.scene && sceneStatus !== 'error' && (
                    <SceneBoundary onError={updateStatus}>
                        <Suspense fallback={null}>
                            <CharacterScene
                                policy={policy}
                                stateRef={sceneState}
                                viewportRef={viewport}
                                onStatus={updateStatus}
                            />
                        </Suspense>
                    </SceneBoundary>
                )}
            </div>
            <div className="home-scrim" aria-hidden="true" />
            <div className="home-glass" aria-hidden="true" />
            <div className="home-fog" aria-hidden="true" />
            <div className="home-noise" aria-hidden="true" />
            <div className="hero-chrome" aria-hidden="true">
                <div className="hero-frame" />
                {['tl', 'tr', 'bl', 'br'].map(corner => <span className={`hero-mark ${corner}`} key={corner}>+</span>)}
                <div className="hero-meta meta-tl"><strong>Hou Wenzheng</strong>BACKEND ENGINEER</div>
                <div className="hero-meta meta-tr">PERSONAL PORTFOLIO<br />2026</div>
                <div className="hero-meta meta-bl">CODE · BUILD · EXPLORE</div>
                <div className="hero-meta meta-right">BASED IN SHENZHEN</div>
            </div>
            <section className="home-hero" id="about" data-scene-anchor="start">
                <div className="hero-copy">
                    <h1>About Hou</h1>
                    <p className="hero-intro">
                        一名在深圳工作的 Go 后端工程师。专注私有云存储、检索与自动化，
                        也喜欢把有趣的想法做成能用的工具。这里记录我的经历、作品，以及一路积累的技术笔记。
                    </p>
                    <a className="hero-scroll" href="#education"><span>SCROLL TO EXPLORE</span><i aria-hidden="true" /></a>
                </div>
                <p className={`scene-status ${modelVisible ? 'sr-only' : ''}`} role="status">
                    {statusText}
                </p>
            </section>
            <div className="resume-story">
                <p className="resume-heading">Experience</p>
                {sceneConfig.resume.map((entry) => (
                    <section
                        id={entry.id}
                        className={`resume-section resume-${entry.id}`}
                        key={entry.id}
                    >
                        <div
                            className="resume-copy"
                            data-scene-anchor={entry.id}
                        >
                            <p className="eyebrow">{entry.label}</p>
                            <p className="resume-date">{entry.date}</p>
                            <h2>{entry.title}</h2>
                            <p className="resume-subtitle">{entry.subtitle}</p>
                            <p className="resume-description">
                                {entry.description}
                            </p>
                            <ul className="resume-highlights">
                                {entry.highlights.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                            <div className="skill-tags">
                                {entry.tags.map((tag) => (
                                    <span key={tag}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </section>
                ))}
            </div>
            <HorizontalSection
                id="tech-hub"
                title="Tech Hub"
                eyebrow="03 / NOTES & SOURCE CODE"
                description="边做边学，把探索过的原理、源码和实践留在这里。"
                mode={policy.horizontal}
                extra={
                    <a className="text-link" href="https://juejin.cn/user/4074147977125020/posts" target="_blank" rel="noopener noreferrer">
                        完整文章库 ↗
                    </a>
                }
            >
                {techCategories.map((category, index) => (
                    <article
                        className="tech-card"
                        key={category.id}
                        data-rail-card
                    >
                        <div className="tech-topline">
                            <span>{category.category}</span>
                            <span>{String(index + 1).padStart(2, '0')}</span>
                        </div>
                        <div className="tech-mark" aria-hidden="true">
                            {category.mark}
                        </div>
                        <h3>{category.title}</h3>
                        <p>{category.description}</p>
                        <button
                            type="button"
                            onClick={() => setSelectedCategory(category)}
                            aria-label={`阅读 ${category.title}`}
                        >
                            阅读文章 <span>↗</span>
                        </button>
                    </article>
                ))}
            </HorizontalSection>
            <HorizontalSection
                id="works"
                title="Selected Works"
                eyebrow="04 / THINGS I'VE BUILT"
                description="一些解决实际问题的工具，也是把想法付诸实践的记录。"
                mode={policy.horizontal}
            >
                {works.map((work, index) => (
                    <article
                        className="work-card"
                        key={work.id}
                        data-rail-card
                    >
                        <div className="work-topline">
                            <span>
                                {String(index + 1).padStart(2, '0')} / {String(works.length).padStart(2, '0')}
                            </span>
                            <span>{work.category}</span>
                        </div>
                        <header className="work-head"><h3>{work.title}</h3><p>{work.category}</p></header>
                        <div className={`work-image${work.image ? '' : ' work-image-typography'}`}>
                            {work.image && <img
                                src={work.image}
                                alt={`${work.title}界面`}
                                loading="lazy"
                                onError={(event) => {
                                    event.currentTarget.style.display = 'none'
                                }}
                            />}
                            <span
                                className="work-image-label"
                                aria-hidden="true"
                            >
                                {work.subtitle}
                            </span>
                        </div>
                        <div className="work-content">
                            <p className="work-subtitle">{work.subtitle}</p>
                            <p className="work-description">
                                {work.description}
                            </p>
                            <div className="skill-tags">
                                {work.stack.map((tag) => (
                                    <span key={tag}>{tag}</span>
                                ))}
                            </div>
                            <a
                                href={work.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="work-link"
                                aria-label={`查看项目：${work.title}`}
                            >
                                查看项目 <span>↗</span>
                            </a>
                        </div>
                    </article>
                ))}
            </HorizontalSection>
            <section className="home-contact" id="contact">
                <p className="eyebrow">HAVE SOMETHING IN MIND?</p>
                <h2>
                    聊聊你的<span>想法。</span>
                    <span className="contact-spark" aria-hidden="true">
                        ✳
                    </span>
                </h2>
                <div className="contact-links">
                    <a
                        className="home-button"
                        href="mailto:Soofjan1489938120@gmail.com"
                    >
                        发送邮件 <span>↗</span>
                    </a>
                    <button
                        className="text-link"
                        type="button"
                        onClick={() =>
                            window.dispatchEvent(
                                new CustomEvent('open-contact-modal'),
                            )
                        }
                    >
                        微信联系 ↗
                    </button>
                    <a
                        className="text-link"
                        href="https://github.com/soofjan1234"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GitHub ↗
                    </a>
                </div>
                <p className="contact-email">Soofjan1489938120@gmail.com</p>
                <p className="scene-credit">
                    3D base model generated with{' '}
                    <a
                        href="https://www.meshy.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Meshy
                    </a>{' '}
                    (
                    <a
                        href="https://creativecommons.org/licenses/by/4.0/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        CC BY 4.0
                    </a>
                    ), customized for Hou · 场景交互参考{' '}
                    <a
                        href="https://github.com/dayinji/sen-3d-resume"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Sen
                    </a>{' '}
                    (
                    <a
                        href="/scene-source-license.txt"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        MIT
                    </a>
                    )
                </p>
            </section>
            {selectedCategory && (
                <ArticleDialog
                    category={selectedCategory}
                    onClose={closeArticles}
                />
            )}
        </div>
    )
}
