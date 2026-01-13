import React from 'react'

const Home = () => {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] p-8 border border-white/10">
                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
                    <div className="flex-1">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">About Me</h2>
                        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            侯汶政 <span className="text-slate-500 text-2xl font-normal">| Go后端工程师</span>
                        </h1>
                        <p className="text-lg text-slate-300 leading-relaxed mb-8">
                            深耕 Go 后端开发与私有云存储（NAS）领域。拥有高并发系统设计架构经验，
                            擅长通过技术手段解决业务痛点，如 NAT 穿透、文件索引同步等核心模块。
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-green-500" /> 深圳在职
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-slate-400">
                                邮箱：Soofjan1489938120@gmail.com
                            </div>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-purple-500/50 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <img
                            src="/avator.jpg"
                            alt="Avatar"
                            className="relative w-[100px] h-[100px] rounded-full object-cover border-4 border-white/10 shadow-2xl"
                        />
                    </div>
                </div>
                {/* Decorative background element */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <span className="mr-2">🎓</span> 教育背景
                    </h3>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white">广州大学</h4>
                            <span className="text-xs text-slate-500">2019 - 2023</span>
                        </div>
                        <p className="text-sm text-slate-400 mb-2">学士 · 计算机科学与技术</p>
                        <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
                            <li>CET-6 英语六级 (602分)</li>
                            <li>全国大学生算法设计与编程挑战赛（银奖）</li>
                        </ul>
                    </div>
                </section>

                <section className="space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <span className="mr-2">🛠️</span> 技术栈
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {['Go', 'Gin', 'GORM', 'Redis', 'MySQL', 'NSQ', 'Vue', 'Android'].map(skill => (
                            <span key={skill} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold">
                                {skill}
                            </span>
                        ))}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed italic">
                        "熟练使用 Git、Linux、Shell，高效利用 Cursor/Antigravity 等 AI 工具进行开发。"
                    </p>
                </section>
            </div>
        </div>
    )
}

export default Home
