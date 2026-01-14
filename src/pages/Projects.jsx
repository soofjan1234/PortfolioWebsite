import React from 'react'

const Projects = () => {
    const projectModules = [
        {
            title: "云端架构与 NAT 穿透",
            details: [
                "主导设计 NAT 穿透交互架构，规范客户端、服务端及云端通信流程，实现复杂网络下的稳定访问。",
                "引入 NSQ 消息队列实现事件异步解耦，系统稳定支持 3万+ QPS 高并发写入。",
                "采用 AES+RSA 混合加密方案保障数据传输安全，实现端到端加密通信。"
            ]
        },
        {
            title: "AI 相册系统",
            details: [
                "基于 JNI 调用实现图片分类推理流程，模型分类准确率达 89.2%。",
                "利用 DBSCAN 聚类算法支持万人级人脸库的快速管理与比对，识别准确率达 97.3%。",
                "运用策略与工厂模式实现独立模式与依赖网盘模式两种检索策略，适配不同部署场景。"
            ]
        },
        {
            title: "智能文档中心",
            details: [
                "在内存受限环境下完成从 Elasticsearch 到 Bleve 的引擎迁移，结合 GPT 语义扩展实现高效检索。",
                "构建支持 PDF、Office、Markdown 等多格式的统一解析引擎，利用 chardet 实现全量 UTF-8 归一化。",
                "设计基于块的索引策略与聚合算法，为超长文档提供高上下文关联的“搜索高亮快照”。"
            ]
        },
        {
            title: "文件索引同步系统",
            details: [
                "自研 DFS+Queue 架构替换 fsnotify 监听模型，在海量文件场景下内存开销降低 90% 以上。",
                "实现基于 SQLite 状态机的增量同步引擎，通过指纹比对与优先级调度实现高效断点续传。",
                "基于 Functional Options 模式解耦同步逻辑与底层存储/IO，支持跨项目高内聚集成。"
            ]
        },
        {
            title: "系统优化与生态支持",
            details: [
                "开发并维护 Docker、Webdav、ChatGPT 等工具，完善 NAS 基础生态支持。",
                "通过 Ristretto 缓存、rate 限流及并发控制有效缓解流量冲击，核心接口缓存命中率达 85%。",
                "优化核心接口响应时间，平均缩短 120ms，保障系统在高负载下的平滑运行。"
            ]
        }
    ]

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="space-y-8">
                <div>
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Portfolio</h2>
                    <h1 className="text-4xl font-bold text-white">项目经历与技术深度</h1>
                </div>

                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-start gap-6">
                        <div className="space-y-4">
                            <div>
                                <p className="text-primary font-semibold text-lg">软件工程师</p>
                            </div>
                            <p className="text-slate-300 leading-relaxed italic text-lg opacity-80">
                                "担任 NAS 项目技术核心，主导设计多项关键系统架构，负责服务端与云端核心模块实现。"
                            </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-mono text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            2023.05 - 至今
                        </div>
                    </div>
                    {/* Decorative background flare */}
                    <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 blur-3xl rounded-full group-hover:bg-primary/10 transition-colors" />
                </div>
            </header>

            <div className="relative space-y-12 before:absolute before:inset-0 before:ml-1 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:via-white/10 before:to-transparent">
                {projectModules.map((module, idx) => (
                    <div key={idx} className="relative pl-8 group">
                        {/* Timeline Dot */}
                        <div className="absolute left-0 top-2 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-primary/20 group-hover:scale-125 transition-transform" />

                        <div className="space-y-4">
                            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">
                                {module.title}
                            </h3>

                            <ul className="space-y-3">
                                {module.details.map((detail, dIdx) => (
                                    <li key={dIdx} className="flex items-start text-slate-400 text-sm leading-relaxed">
                                        <span className="text-primary/60 mr-2 mt-1.5">•</span>
                                        <span>{detail}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Projects
