<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react'
=======
import React, { useState } from 'react'
import { TextAnimate } from "@/registry/magicui/text-animate"
>>>>>>> 89592ce89d7f40948199909abee2b62743ce81f4

const Home = () => {
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const [isHoveringContact, setIsHoveringContact] = useState(false)
    const [heroTransform, setHeroTransform] = useState({ rotateX: 0, rotateY: 0, scale: 1 })
    const heroRef = useRef(null)

    useEffect(() => {
        const handleMove = (e) => {
            if (!heroRef.current) return
            const rect = heroRef.current.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            const dx = (e.clientX - centerX) / rect.width  // -0.5 ~ 0.5
            const dy = (e.clientY - centerY) / rect.height // -0.5 ~ 0.5

            const maxRotate = 10
            const rotateY = -dx * maxRotate
            const rotateX = dy * maxRotate
            const scale = 1 + Math.max(Math.min((Math.abs(dx) + Math.abs(dy)) * 0.1, 0.15), 0)

            setHeroTransform({ rotateX, rotateY, scale })
        }

        window.addEventListener('mousemove', handleMove, { passive: true })
        return () => window.removeEventListener('mousemove', handleMove)
    }, [])

    const handleContactMouseMove = (e) => {
        setCursorPosition({ x: e.clientX, y: e.clientY })
    }

    return (
        <div className="relative bg-transparent overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen">
                {/* 背景超大文字 - Text Pressure 风格 */}
                <div className="absolute inset-x-0 top-1/2 right-20 md:top-20 flex items-center md:items-start justify-center select-none pointer-events-none z-0 transform -translate-y-1/2 md:translate-y-0">
                    <h1
                        ref={heroRef}
                        className="text-[18vw] md:text-[25vw] font-black text-white leading-none tracking-tighter opacity-80 uppercase italic transition-transform duration-150 ease-out will-change-transform"
                        style={{
                            WebkitTextStroke: '1px rgba(0,0,0,0.05)',
                            transform: `perspective(1200px) rotateX(${heroTransform.rotateX}deg) rotateY(${heroTransform.rotateY}deg) scale(${heroTransform.scale})`
                        }}
                    >
                        Soofjan
                    </h1>
                </div>

                {/* 自我介绍内容 */}
                <div className="relative z-30 min-h-screen flex flex-col justify-end items-end p-8 md:p-24 pb-48">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-16 w-full max-w-full md:max-w-[95vw]">
                        {/* 文字内容容器 */}
                        <div className="text-center md:text-right space-y-6 md:space-y-10 order-2 md:order-1 w-full md:w-auto">
                            <div className="space-y-4 flex flex-col items-center md:items-end">
                                <h2 className="text-base font-semibold uppercase tracking-widest text-primary">
                                    <TextAnimate animation="blurInUp" by="character" once>About Me</TextAnimate>
                                </h2>
                                <h1 className="text-4xl md:text-8xl font-black text-gray-900 leading-tight">
                                    Hou <span className="text-gray-400 text-2xl md:text-5xl font-normal md:ml-6">| 全栈工程师</span>
                                </h1>
                            </div>

                            <div className="md:ml-auto max-w-full space-y-4 md:space-y-6">
                                <div className="text-lg md:text-4xl text-gray-600 font-medium leading-relaxed flex flex-wrap justify-center md:justify-end items-center">
                                    <TextAnimate animation="blurInUp" by="character" once delay={0.3}>深耕</TextAnimate>
                                    <TextAnimate className="text-primary font-bold mx-1 md:mx-2" animation="blurInUp" by="character" once delay={0.5}>Go 后端开发</TextAnimate>
                                    <TextAnimate animation="blurInUp" by="character" once delay={0.8}>与</TextAnimate>
                                    <TextAnimate className="text-primary font-bold mx-1 md:mx-2" animation="blurInUp" by="character" once delay={1.0}>私有云存储（NAS）</TextAnimate>
                                    <TextAnimate animation="blurInUp" by="character" once delay={1.5}>领域，同时具备</TextAnimate>
                                    <TextAnimate className="text-primary font-bold ml-1 md:ml-2" animation="blurInUp" by="character" once delay={2.0}>全栈开发能力。</TextAnimate>
                                </div>
                                <div className="text-base md:text-2xl text-gray-400 mt-4 md:mt-6 leading-relaxed flex flex-wrap justify-center md:justify-end items-center">
                                    <TextAnimate animation="blurInUp" by="character" once delay={2.3}>擅长通过技术手段解决业务痛点，如</TextAnimate>
                                    <TextAnimate className="text-gray-900 font-semibold mx-1 md:mx-2" animation="blurInUp" by="character" once delay={3.0}>NAT 穿透</TextAnimate>
                                    <TextAnimate animation="blurInUp" by="character" once delay={3.4}>、</TextAnimate>
                                    <TextAnimate className="text-gray-800 font-semibold mx-1 md:mx-2" animation="blurInUp" by="character" once delay={3.5}>文件索引同步</TextAnimate>
                                    <TextAnimate animation="blurInUp" by="character" once delay={4.0}>等核心模块。</TextAnimate>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-center md:justify-end gap-3 md:gap-4 pb-8 w-full md:w-auto">
                                <div className="flex items-center justify-center gap-3 px-6 md:px-8 py-3 md:py-4 rounded-full bg-white shadow-sm border border-gray-100 text-sm md:text-base text-gray-600">
                                    <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                                    深圳在职
                                </div>
                                <div className="px-6 md:px-8 py-3 md:py-4 rounded-full bg-white shadow-sm border border-gray-100 text-sm md:text-base text-gray-600 text-center md:text-left">
                                    邮箱：Soofjan1489938120@gmail.com
                                </div>
                            </div>
                        </div>

                        {/* 头像容器 */}
                        <div className="order-1 md:order-2 group pt-24 md:pt-24 pb-8">
                            <div className="relative">
                                {/* 背景光晕 - 适配矩形 */}
                                <div className="absolute inset-0 bg-gray-200/50 rounded-3xl blur-3xl group-hover:bg-gray-300/50 transition-colors duration-700" />

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

            {/* Expertise Section */}
            <section className="relative min-h-screen bg-transparent text-gray-900 overflow-hidden">

                <div className="relative z-20 container mx-auto px-6 py-40 md:py-48">
                    {/* 背景标题 - 仿照 Hero 样式 */}
                    <div className="absolute top-30 inset-0 flex flex-col items-center justify-center select-none pointer-events-none opacity-10 leading-none z-0">
                        <h2 className="text-[16vw] font-black tracking-tighter uppercase italic"
                            style={{ WebkitTextStroke: '1px rgba(0,0,0,0.05)' }}>
                            <TextAnimate animation="blurInUp" by="character" once>COLLEGE &</TextAnimate>
                        </h2>
                        <h2 className="text-[16vw] font-black tracking-tighter uppercase italic -mt-4 md:-mt-12"
                            style={{ WebkitTextStroke: '1px rgba(0,0,0,0.05)' }}>
                            <TextAnimate animation="blurInUp" by="character" once delay={0.3}>EXPERTISE</TextAnimate>
                        </h2>
                    </div>

                    {/* 内容容器 */}
                    <div className="relative z-10 max-w-7xl mx-auto space-y-12 md:space-y-16 mt-12 md:mt-24">

                        {/* 1. 教育背景 - 宽卡片布局 */}
                        <div className="bg-white border border-gray-100 p-10 md:p-16 rounded-[2.5rem] hover:bg-gray-50 transition-all duration-500 shadow-sm group">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="bg-gray-100 text-gray-900 p-2 rounded-lg">
                                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M12 14l9-5-9-5-9 5 9 5z" />
                                                <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                                            </svg>
                                        </div>
                                        <h3 className="text-4xl md:text-6xl font-black tracking-tight text-gray-900"><TextAnimate animation="blurInUp" by="character" once>广州大学</TextAnimate></h3>
                                    </div>
                                    <p className="text-2xl text-gray-600 font-medium ml-1">计算机科学与技术 <span className="text-gray-400 text-lg ml-2">/ 学士</span></p>
                                </div>
                                <div className="text-left md:text-right">
                                    <div className="text-3xl font-bold text-gray-900">2019.09 -- 2023.06</div>
                                    <div className="mt-3 flex flex-wrap gap-3 justify-start md:justify-end">
                                        <span className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium border border-gray-200 text-gray-700">CET-6 (602分)</span>
                                        <span className="px-3 py-1 bg-yellow-50 rounded-full text-sm font-medium border border-yellow-200 text-yellow-700">全国大学生算法设计与编程挑战赛（银奖）</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. 技能卡片 Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {/* Academic */}
                            <div className="bg-white border border-gray-100 p-8 md:p-10 rounded-[2.5rem] hover:bg-gray-50 transition-all duration-300 flex flex-col justify-center">
                                <h3 className="text-xl font-bold mb-2 text-gray-600 tracking-widest uppercase"><TextAnimate animation="blurInUp" by="character" once delay={0.1}>Academic Foundation</TextAnimate></h3>
                                <p className="text-sm text-gray-400 mb-6 italic">Almost forgot</p>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-4 text-2xl font-bold text-gray-900">
                                        <span className="w-3 h-3 rounded-full bg-gray-400" />
                                        C++
                                    </li>
                                    <li className="flex items-center gap-4 text-2xl font-bold text-gray-900">
                                        <span className="w-3 h-3 rounded-full bg-gray-400" />
                                        JAVA
                                    </li>
                                </ul>
                            </div>

                            {/* Professional - Highlighted */}
                            <div className="col-span-1 md:col-span-2 bg-gray-900 text-white p-10 md:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold mb-1 text-gray-300 tracking-widest uppercase flex items-center gap-2">
                                    <span className="w-8 h-1 bg-gray-400 rounded-full"></span>
                                    <TextAnimate animation="blurInUp" by="character" once delay={0.2}>Professional Stack</TextAnimate>
                                </h3>
                                <p className="text-sm text-gray-400 mb-6 italic ml-10">Most frequently used</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="font-black text-4xl">Go/Gin</div>
                                        <div className="text-base font-medium text-gray-400">Backend Core</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="font-black text-4xl">Vue.js</div>
                                        <div className="text-base font-medium text-gray-400">Frontend Modern</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="font-black text-4xl">MySQL</div>
                                        <div className="text-base font-medium text-gray-400">Relational DB</div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="font-black text-4xl">SQLite</div>
                                        <div className="text-base font-medium text-gray-400">Embedded DB</div>
                                    </div>
                                </div>
                            </div>

                            {/* Self-Study & Freelance Combined */}
                            <div className="bg-white border border-gray-100 p-8 md:p-10 rounded-[2.5rem] hover:bg-gray-50 transition-all duration-300 flex flex-col justify-center">
                                <h3 className="text-xl font-bold mb-2 text-gray-600 tracking-widest uppercase"><TextAnimate animation="blurInUp" by="character" once delay={0.3}>Self-Study & Freelance</TextAnimate></h3>
                                <p className="text-sm text-gray-400 mb-6 italic">Multi-platform adaptability</p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-full text-sm font-medium">Python</span>
                                    <span className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-full text-sm font-medium">Android</span>
                                    <span className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-full text-sm font-medium">TypeScript</span>
                                    <span className="px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-700 rounded-full text-sm font-medium">React</span>
                                </div>
                            </div>
                        </div>

                        {/* 工作经历 (Moved from Experience.jsx) */}
                        <div className="py-12 md:py-16 w-full mt-12 md:mt-16">
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-500 mb-4"><TextAnimate animation="blurInUp" by="character" once>Professional Path</TextAnimate></h2>
                            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-16"><TextAnimate animation="blurInUp" by="character" once delay={0.2}>Work Experience</TextAnimate></h1>

                            <div className="relative border-l-2 border-gray-200 ml-3 md:ml-6 space-y-12 pl-8 md:pl-12 py-2">
                                {/* 经历条目 */}
                                <div className="relative group/exp">
                                    <span className="absolute -left-[41px] md:-left-[57px] top-0 w-5 h-5 rounded-full bg-gray-900 ring-4 ring-white group-hover/exp:scale-125 transition-transform duration-300" />
                                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900"><TextAnimate animation="blurInUp" by="word" once>Go 后端工程师</TextAnimate></h3>
                                                <p className="text-gray-500 font-medium mt-1">某科技有限公司 · 深圳</p>
                                            </div>
                                            <span className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-bold whitespace-nowrap border border-gray-200">
                                                2023.07 - 至今
                                            </span>
                                        </div>
                                        <ul className="space-y-3">
                                            {[
                                                "私有云存储系统（NAS）开发，涵盖云端、智能文档中心、文件索引同步、AI相册及生态支持等模块",
                                                "主导 NAT 穿透架构与高并发云端设计，支持 QPS 3 万+ 写入",
                                                "智能文档中心：Bleve 检索迁移、多格式解析与搜索高亮快照",
                                                "文件索引同步：BFS+Queue 架构、SQLite 状态机增量同步"
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start text-gray-600">
                                                    <span className="mr-3 text-gray-400 mt-[6px]">•</span>
                                                    <span className="leading-relaxed">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>


                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section
                className={`relative min-h-screen flex flex-col items-center justify-center overflow-hidden transition-colors duration-1000 
                    ${isHoveringContact ? 'cursor-none' : ''} bg-transparent active:scale-[0.99] transition-transform`}
                onMouseMove={handleContactMouseMove}
                onMouseEnter={() => setIsHoveringContact(true)}
                onMouseLeave={() => setIsHoveringContact(false)}
                onClick={() => window.dispatchEvent(new CustomEvent('open-contact-modal'))}
            >
                {/* 背景大字 */}
                <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden z-0">
                    <h1 className="text-[16vw] font-black text-black/5 uppercase tracking-tighter whitespace-nowrap italic">
                        <TextAnimate animation="blurInUp" by="character" once>Contact Me</TextAnimate>
                    </h1>
                </div>

                {/* 内容 */}
                <div className="relative z-10 text-center px-4">
                    <h2 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tight flex flex-col items-center">
                        <TextAnimate animation="blurInUp" by="word" once delay={0.1}>Always open for new projects</TextAnimate>
                        <TextAnimate animation="blurInUp" by="word" once delay={0.4}>and collaborations</TextAnimate>
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
