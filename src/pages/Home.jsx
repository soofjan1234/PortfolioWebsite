import React, { useState } from 'react'

const Home = () => {
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [isHoveringContact, setIsHoveringContact] = useState(false)

    const handleContactMouseMove = (e) => {
        setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    return (
        <div className="relative bg-transparent overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen">
                {/* 背景超大文字 - 移至顶部 */}
                <div className="absolute inset-x-0 top-0 flex items-start justify-center select-none pointer-events-none z-0">
                    <h1 className="text-[20vw] md:text-[25vw] font-black text-white leading-none tracking-tighter opacity-80 uppercase italic"
                        style={{ WebkitTextStroke: '1px rgba(0,0,0,0.05)' }}>
                        Soofjan
                    </h1>
                </div>

                {/* 自我介绍内容 */}
                <div className="relative z-30 min-h-screen flex flex-col justify-end items-end p-8 md:p-24 pb-48">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-16 max-w-[95vw]">
                        {/* 文字内容容器 */}
                        <div className="text-right space-y-10 order-2 md:order-1">
                            <div className="space-y-4">
                                <h2 className="text-base font-semibold uppercase tracking-widest text-primary">About Me</h2>
                                <h1 className="text-6xl md:text-8xl font-black text-gray-900 leading-tight">
                                    Hou <span className="text-gray-400 text-4xl md:text-5xl font-normal ml-6">| 全栈工程师</span>
                                </h1>
                            </div>

                            <div className="ml-auto">
                                <p className="text-2xl md:text-4xl text-gray-600 font-medium whitespace-nowrap">
                                    深耕 <span className="text-primary font-bold">Go 后端开发</span> 与
                                    <span className="text-primary font-bold mx-2">私有云存储（NAS）</span> 领域，同时具备
                                    <span className="text-primary font-bold ml-2">全栈开发能力</span>。
                                </p>
                                <p className="text-xl md:text-2xl text-gray-400 mt-6 whitespace-nowrap">
                                    擅长通过技术手段解决业务痛点，如
                                    <span className="text-gray-900 font-semibold mx-2">NAT 穿透</span>、
                                    <span className="text-gray-800 font-semibold mx-2">文件索引同步</span> 等核心模块。
                                </p>
                            </div>

                            <div className="flex justify-end gap-4 pb-8">
                                <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-white shadow-sm border border-gray-100 text-base text-gray-600">
                                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                    深圳在职
                                </div>
                                <div className="px-8 py-4 rounded-full bg-white shadow-sm border border-gray-100 text-base text-gray-600">
                                    邮箱：Soofjan1489938120@gmail.com
                                </div>
                            </div>
                        </div>

                        {/* 头像容器 */}
                        <div className="order-1 md:order-2 group pb-8">
                            <div className="relative">
                                {/* 背景光晕 - 适配矩形 */}
                                <div className="absolute inset-0 bg-blue-500/10 rounded-3xl blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700" />

                                {/* 头像图片 - 3:4 比例 */}
                                <div className="relative p-2 bg-white rounded-3xl shadow-2xl border border-gray-100 transform group-hover:rotate-2 group-hover:scale-105 transition-all duration-700 ease-out">
                                    <img
                                        src="/avator.png"
                                        alt="Soofjan's Avatar"
                                        className="w-54 h-72 md:w-72 md:h-96 rounded-2xl object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 装饰细节 - 纹理 */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Cfilter id='noiseFilter'%3%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3%3C/filter%3%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3%3C/svg%3")` }}
                />
            </section>

            {/* Expertise Section - 渐变背景 */}
            <section className="relative min-h-screen bg-blue-600 text-white overflow-hidden">
                {/* 顶部渐变过渡 */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#f3f4f6] to-blue-600 z-10" />

                <div className="relative z-20 container mx-auto px-6 py-40 md:py-48">
                    {/* 背景标题 - 仿照 Hero 样式 */}
                    <div className="absolute top-30 inset-0 flex flex-col items-center justify-center select-none pointer-events-none opacity-10 leading-none z-0">
                        <h2 className="text-[16vw] font-black tracking-tighter uppercase italic"
                            style={{ WebkitTextStroke: '2px rgba(255,255,255,0.8)' }}>
                            COLLEGE &
                        </h2>
                        <h2 className="text-[16vw] font-black tracking-tighter uppercase italic -mt-4 md:-mt-12"
                            style={{ WebkitTextStroke: '2px rgba(255,255,255,0.8)' }}>
                            EXPERTISE
                        </h2>
                    </div>

                    {/* 内容容器 */}
                    <div className="relative z-10 max-w-7xl mx-auto space-y-12 md:space-y-16 mt-12 md:mt-24">

                        {/* 1. 教育背景 - 宽卡片布局 */}
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 md:p-16 rounded-[2.5rem] hover:bg-white/20 transition-all duration-500 shadow-2xl group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="bg-white text-blue-600 p-2 rounded-lg">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                            </svg>
                                        </div>
                                        <h3 className="text-4xl md:text-6xl font-black tracking-tight">广州大学</h3>
                                    </div>
                                    <p className="text-2xl text-white/90 font-medium ml-1">计算机科学与技术 <span className="text-white/60 text-lg ml-2">/ 学士</span></p>
                                </div>
                                <div className="text-left md:text-right">
                                    <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">2019.09 -- 2023.06</div>
                                    <div className="mt-3 flex flex-wrap gap-3 justify-start md:justify-end">
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium border border-white/10">CET-6 (602分)</span>
                                        <span className="px-3 py-1 bg-gradient-to-r from-yellow-400/20 to-orange-500/20 rounded-full text-sm font-medium border border-yellow-400/30 text-yellow-100">全国大学生算法设计与编程挑战赛（银奖）</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. 技能卡片 Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Academic */}
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 md:p-10 rounded-[2.5rem] hover:bg-white/10 transition-all duration-300 flex flex-col justify-center">
                                <h3 className="text-xl font-bold mb-6 text-white/60 tracking-widest uppercase">Academic Foundation</h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4 text-2xl font-bold">
                                        <span className="w-3 h-3 rounded-full bg-blue-300 shadow-[0_0_12px_rgba(147,197,253,0.5)]" />
                                        C++
                                    </li>
                                    <li className="flex items-center gap-4 text-2xl font-bold">
                                        <span className="w-3 h-3 rounded-full bg-blue-300 shadow-[0_0_12px_rgba(147,197,253,0.5)]" />
                                        JAVA
                                    </li>
                                </ul>
                            </div>

                            {/* Professional - Highlighted */}
                            <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-white to-blue-50 text-blue-900 p-10 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold mb-6 text-blue-600 tracking-widest uppercase flex items-center gap-2">
                                    <span className="w-8 h-1 bg-blue-600 rounded-full"></span>
                                    Professional Stack
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="font-black text-4xl">Go/Gin</div>
                                        <div className="text-base font-medium text-blue-600/70">Backend Core</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="font-black text-4xl">Vue.js</div>
                                        <div className="text-base font-medium text-blue-600/70">Frontend Modern</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="font-black text-4xl">MySQL</div>
                                        <div className="text-base font-medium text-blue-600/70">Relational DB</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="font-black text-4xl">SQLite</div>
                                        <div className="text-base font-medium text-blue-600/70">Embedded DB</div>
                                    </div>
                                </div>
                            </div>

                            {/* Self-Study & Freelance Combined */}
                            <div className="flex flex-col gap-6 md:gap-8">
                                <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[2.5rem] hover:bg-white/10 transition-all duration-300 flex flex-col justify-center">
                                    <h3 className="text-sm font-bold mb-4 text-white/50 tracking-widest uppercase">Freelance</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">Python</span>
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">Android</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[2.5rem] hover:bg-white/10 transition-all duration-300 flex flex-col justify-center">
                                    <h3 className="text-sm font-bold mb-3 text-white/50 tracking-widest uppercase">Self-Study</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">TypeScript</span>
                                        <span className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium">React</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section
                className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000 ${isHoveringContact ? 'cursor-none' : ''} bg-gradient-to-b from-blue-600 to-[#f3f4f6] active:scale-[0.99] transition-transform`}
                onMouseMove={handleContactMouseMove}
                onMouseEnter={() => setIsHoveringContact(true)}
                onMouseLeave={() => setIsHoveringContact(false)}
                onClick={() => window.dispatchEvent(new CustomEvent('open-contact-modal'))}
            >
                {/* 背景大字 */}
                <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden">
                    <h1 className="text-[16vw] font-black text-white/10 uppercase tracking-tighter whitespace-nowrap italic">
                        Contact Me
                    </h1>
                </div>

                {/* 内容 */}
                <div className="relative z-10 text-center px-4">
                    <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight">
                        Always open for new projects<br />and collaborations
                    </h2>
                </div>

                {/* 自定义跟随光标 - 仅在 hover 时显示 */}
                {isHoveringContact && (
                    <div
                        className="fixed z-50 pointer-events-none"
                        style={{
                            left: cursorPosition.x,
                            top: cursorPosition.y,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        <div className="w-32 h-32 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
                            <span className="text-white font-bold text-sm tracking-widest uppercase">Contact Me</span>
                        </div>
                    </div>
                )}
            </section>
        </div>
    )
}

export default Home
