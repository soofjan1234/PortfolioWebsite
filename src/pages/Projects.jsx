import React from 'react'

const Projects = () => {
    const experiences = [
        {
            company: "慧为智能科技有限公司",
            role: "软件工程师",
            period: "2023.05 - 至今",
            description: "担任 NAS 项目技术核心，主导设计多项关键系统架构。",
            highlights: [
                "主导 NAT 穿透交互架构，规范跨端通信流程",
                "引入 NSQ 消息队列，稳定支持 3万+ QPS 高并发写入",
                "自研 DFS+Queue 文件索引同步架构，响应能力提升 80%",
                "集成人脸识别与检测聚类（DBSCAN），识别准确率 97.3%"
            ]
        }
    ]

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Portfolio</h2>
                <h1 className="text-4xl font-bold text-white">工作与项目经历</h1>
            </header>

            <div className="space-y-10">
                {experiences.map((exp, idx) => (
                    <div key={idx} className="relative pl-8 border-l border-white/10 space-y-6">
                        <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />

                        <div className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-2">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{exp.company}</h3>
                                <p className="text-primary font-medium">{exp.role}</p>
                            </div>
                            <span className="text-sm text-slate-500 font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                {exp.period}
                            </span>
                        </div>

                        <p className="text-slate-300 leading-relaxed text-lg italic">"{exp.description}"</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {exp.highlights.map((item, hIdx) => (
                                <div key={hIdx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-primary/20 transition-all flex items-start">
                                    <span className="text-primary mr-3 text-lg">✦</span>
                                    <span className="text-sm text-slate-400">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Projects
