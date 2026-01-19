import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Experience from './pages/Experience'
import Projects from './pages/Projects'
import Blog from './pages/Blog'

function App() {
    const [showContactModal, setShowContactModal] = useState(false)
    const location = useLocation()

    // 路由切换时滚动到顶部
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [location.pathname])

    // 监听全局弹窗事件
    useEffect(() => {
        const handleOpen = () => setShowContactModal(true)
        window.addEventListener('open-contact-modal', handleOpen)
        return () => window.removeEventListener('open-contact-modal', handleOpen)
    }, [])

    const navItems = [
        { label: 'ABOUT', path: '/' },
        { label: 'WORKS', path: '/experience' },
        { label: 'PROJECTS', path: '/projects' },
        { label: 'BLOG', path: '/blog' }
    ]

    return (
        <div className="min-h-screen bg-transparent text-text selection:bg-primary/30 selection:text-white">
            {/* 固定顶部导航栏 */}
            <header className="fixed top-0 left-0 right-0 z-50 py-6 px-4 md:px-12 bg-white/80 backdrop-blur-md md:bg-transparent md:backdrop-blur-none transition-all duration-300">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="text-2xl font-black text-gray-900 tracking-tighter uppercase z-50">
                        Soofjan
                    </Link>

                    {/* Centered Pill Nav */}
                    <nav className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-full px-2 py-1 shadow-sm">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.path}
                                className={`px-6 py-2 rounded-full text-xs font-bold tracking-widest transition-all ${(location.pathname === item.path) || (item.path !== '/' && location.pathname.startsWith(item.path))
                                    ? 'bg-gray-900 text-white shadow-lg'
                                    : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Right column */}
                    <div className="flex z-50">
                        <button
                            onClick={() => setShowContactModal(true)}
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-full text-xs font-bold tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                        >
                            Contact
                        </button>
                    </div>
                </div>
            </header>

            {/* 主内容区域 */}
            <main className="min-h-screen">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/projects" element={
                        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <Projects />
                        </div>
                    } />
                    <Route path="/blog" element={
                        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <Blog />
                        </div>
                    } />
                    <Route path="/experience" element={
                        <div className="pt-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <Experience />
                        </div>
                    } />
                </Routes>
            </main>

            {/* 页脚 */}
            <footer className="py-12 bg-[#f3f4f6] border-t border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-gray-500 text-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p>&copy; {new Date().getFullYear()} HouWenzheng. All rights reserved.</p>
                        <div className="flex space-x-6">
                            <a href="https://github.com/soofjan1234" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
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
                        className="bg-white rounded-[2.5rem] p-8 md:p-12 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative mb-8 group">
                            <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-2xl group-hover:bg-blue-500/20 transition-all duration-700" />
                            <img
                                src="/contact.jpg"
                                alt="WeChat QR Code"
                                className="relative w-full object-cover rounded-3xl shadow-lg border border-gray-100"
                            />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">WeChat Contact</h3>
                        <p className="text-gray-500 font-medium mb-8">
                            扫码添加微信<br />
                            <span className="text-blue-600 font-bold">请备注来意</span>
                        </p>
                        <button
                            onClick={() => setShowContactModal(false)}
                            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all active:scale-95"
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
