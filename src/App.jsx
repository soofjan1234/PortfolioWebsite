import { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Experience from './pages/Experience'
import { TextHoverEffect } from '@/components/ui/text-hover-effect'

// 文章页及其 Markdown 渲染器按路由加载，手机首屏不下载整套文章渲染依赖。
const Projects = lazy(() => import('./pages/Projects'))

// 离开首屏顶部 120px 后提供回顶入口；显示后保持到真正到顶，避免回程中闪烁。
const BACK_TO_TOP_THRESHOLD = 120

/** 保留独立路由，主页导航使用页内锚点；联系窗口统一管理焦点和背景滚动。 */
function App() {
    const [showContactModal, setShowContactModal] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showBackToTop, setShowBackToTop] = useState(false)
    const location = useLocation()
    const contactDialog = useRef(null)
    const menuButton = useRef(null)
    const isHome = location.pathname === '/'
    const NavElement = isHome ? 'a' : Link

    // 路由切换时滚动到顶部并关闭移动菜单
    useEffect(() => {
        window.scrollTo(0, 0)
        setMobileMenuOpen(false)
    }, [location.pathname])

    // 首页独立订阅滚动；切换路由时清理，回顶入口不进入其他页面。
    useEffect(() => {
        if (!isHome) {
            setShowBackToTop(false)
            return
        }
        /** 超过阈值显示，回程保留按钮直到顶部。 */
        const updateBackToTop = () => {
            const top = window.scrollY
            setShowBackToTop((visible) => top > BACK_TO_TOP_THRESHOLD || (visible && top > 0))
        }
        updateBackToTop()
        window.addEventListener('scroll', updateBackToTop, { passive: true })
        return () => window.removeEventListener('scroll', updateBackToTop)
    }, [isHome])

    /** 回顶前关闭菜单并交还焦点，按钮到顶卸载后键盘仍有稳定入口。 */
    function returnToTop() {
        setMobileMenuOpen(false)
        menuButton.current?.focus({ preventScroll: true })
        window.scrollTo({
            top: 0,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        })
    }

    // 监听全局弹窗事件
    useEffect(() => {
        const handleOpen = () => setShowContactModal(true)
        window.addEventListener('open-contact-modal', handleOpen)
        return () =>
            window.removeEventListener('open-contact-modal', handleOpen)
    }, [])

    // 联系窗口关闭后恢复入口焦点与原来的滚动状态。
    useEffect(() => {
        if (!showContactModal) return
        const previousFocus = document.activeElement
        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        contactDialog.current.querySelector('button').focus()
        const handleKey = (event) => {
            if (event.key === 'Escape') setShowContactModal(false)
            if (event.key === 'Tab') {
                event.preventDefault()
                contactDialog.current.querySelector('button').focus()
            }
        }
        document.addEventListener('keydown', handleKey)
        return () => {
            document.body.style.overflow = previousOverflow
            document.removeEventListener('keydown', handleKey)
            previousFocus?.focus({ preventScroll: true })
        }
    }, [showContactModal])

    const navItems = isHome
        ? [
              { label: 'ABOUT', path: '#about' },
              { label: 'TECH HUB', path: '#tech-hub' },
              { label: 'WORKS', path: '#works' },
          ]
        : [
              { label: 'ABOUT', path: '/' },
              { label: 'TECH HUB', path: '/projects' },
          ]

    return (
        <div className="min-h-screen bg-black text-white selection:bg-primary/40 selection:text-white">
            {/* 固定顶部导航栏 - 深色主题 */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-white focus:text-black focus:p-3"
            >
                跳到主要内容
            </a>
            <header
                className={`fixed top-0 left-0 right-0 z-50 py-4 px-4 md:px-12 bg-black/80 backdrop-blur-md border-b border-white/10 transition-all duration-300 ${isHome ? 'home-navigation' : ''}`}
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link
                        to="/"
                        aria-label="Soofjan 首页"
                        className={`group text-3xl md:text-4xl font-black tracking-tighter uppercase z-50 leading-none ${isHome ? 'home-logo' : 'text-white'}`}
                    >
                        {isHome ? (
                            'soofjan.'
                        ) : (
                            <TextHoverEffect text="Soofjan" />
                        )}
                    </Link>

                    {/* Centered Pill Nav */}
                    <nav
                        aria-label="主要导航"
                        className={`absolute left-1/2 -translate-x-1/2 hidden md:flex items-center bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-2 py-1 shadow-sm ${isHome ? 'home-nav-links' : ''}`}
                    >
                        {navItems.map((item) => (
                            <NavElement
                                key={item.label}
                                to={isHome ? undefined : item.path}
                                href={isHome ? item.path : undefined}
                                className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${
                                    isHome
                                        ? `home-nav-link ${item.path === '#about' ? 'is-active' : ''}`
                                        : location.pathname === item.path ||
                                            (item.path !== '/' &&
                                                location.pathname.startsWith(
                                                    item.path,
                                                ))
                                          ? 'bg-white text-black shadow-lg'
                                          : 'text-gray-300 hover:text-white'
                                }`}
                            >
                                {item.label}
                            </NavElement>
                        ))}
                    </nav>

                    {/* Right column */}
                    <div className="home-controls flex items-center gap-4 z-50">
                        {isHome && showBackToTop && (
                            <button
                                type="button"
                                className="home-round-button home-back-to-top"
                                aria-label="回到顶部"
                                title="回到顶部"
                                onClick={returnToTop}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                    <path d="M12 19V5m-6 6 6-6 6 6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        )}
                        {/* Mobile hamburger button */}
                        <button
                            ref={menuButton}
                            aria-label={
                                mobileMenuOpen ? '关闭导航菜单' : '打开导航菜单'
                            }
                            aria-expanded={mobileMenuOpen}
                            aria-controls="mobile-navigation"
                            className={`md:hidden text-white p-2 ${isHome ? 'home-round-button home-menu-button' : ''}`}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {mobileMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                        </button>

                        <button
                            onClick={() => setShowContactModal(true)}
                            className={`px-6 py-2.5 bg-white text-black rounded-full text-xs font-bold tracking-widest hover:bg-gray-200 transition-all shadow-lg active:scale-95 ${isHome ? 'home-contact-button' : ''}`}
                        >
                            Contact
                        </button>
                    </div>
                </div>

                {/* Mobile menu - 深色 */}
                {mobileMenuOpen && (
                    <div
                        id="mobile-navigation"
                        className={`md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur-md border-b border-white/10 py-4 px-4 shadow-lg ${isHome ? 'home-mobile-menu' : ''}`}
                    >
                        <div className="flex flex-col space-y-2">
                            {navItems.map((item) => (
                                <NavElement
                                    key={item.label}
                                    to={isHome ? undefined : item.path}
                                    href={isHome ? item.path : undefined}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`py-3 px-4 rounded-xl text-sm font-bold tracking-wide transition-all ${
                                        isHome
                                            ? 'home-nav-link'
                                            : location.pathname === item.path ||
                                                (item.path !== '/' &&
                                                    location.pathname.startsWith(
                                                        item.path,
                                                    ))
                                              ? 'bg-white text-black'
                                              : 'text-gray-300 hover:bg-white/10'
                                    }`}
                                >
                                    {item.label}
                                </NavElement>
                            ))}
                        </div>
                    </div>
                )}
            </header>

            {/* 主内容区域 */}
            <main id="main-content" className="min-h-screen">
                <Suspense
                    fallback={
                        <p
                            role="status"
                            className="pt-32 text-center text-gray-400"
                        >
                            正在加载页面…
                        </p>
                    }
                >
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/projects"
                            element={
                                <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                    <Projects />
                                </div>
                            }
                        />
                        {/*博客页面暂时隐藏*/}
                        {/*<Route path="/blog" element={
                        <div className="min-h-screen w-full">
                            <Blog />
                        </div>
                    } />*/}
                        <Route
                            path="/experience"
                            element={
                                <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                    <Experience />
                                </div>
                            }
                        />
                    </Routes>
                </Suspense>
            </main>

            {/* 页脚 - 深色 */}
            <footer
                className={`py-12 border-t ${isHome ? 'relative bg-[#f6f0e6] border-black/10 text-stone-600' : 'bg-black border-white/10'}`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-gray-400 text-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p>
                            &copy; {new Date().getFullYear()} HouWenzheng. All
                            rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a
                                href="https://github.com/soofjan1234"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-white transition-colors"
                            >
                                GitHub
                            </a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Contact Modal */}
            {showContactModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setShowContactModal(false)}
                >
                    <div
                        ref={contactDialog}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="contact-modal-title"
                        className="contact-dialog bg-white rounded-[2.5rem] p-6 sm:p-8 max-w-sm w-full max-h-[calc(100svh-2rem)] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 二维码和说明独立滚动，关闭按钮始终留在视口内。 */}
                        <div className="contact-dialog-content min-h-0 overflow-y-auto overscroll-contain">
                            <div className="relative mb-6 group">
                                <div className="absolute inset-0 bg-gray-200/50 rounded-3xl blur-2xl group-hover:bg-gray-300/50 transition-all duration-700" />
                                <img
                                    src="/contact.jpg"
                                    alt="WeChat QR Code"
                                    className="relative w-auto max-h-[45svh] mx-auto object-contain rounded-3xl shadow-lg border border-gray-100"
                                />
                            </div>
                            <div>
                                <h3
                                    id="contact-modal-title"
                                    className="text-2xl font-black text-gray-900 mb-2"
                                >
                                    WeChat Contact
                                </h3>
                                <p className="text-gray-500 font-medium mb-4">
                                    扫码添加微信
                                    <br />
                                    <span className="text-gray-900 font-bold">
                                        请备注来意
                                    </span>
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="w-full shrink-0 mt-4 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
