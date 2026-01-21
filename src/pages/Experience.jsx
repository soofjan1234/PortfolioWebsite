import React from 'react'

const Experience = () => {
    const projectModules = [
        {
            title: "云端架构与 NAT 穿透", details: [
                "主导设计 NAT 穿透交互架构，规范客户端、服务端、云端及穿透端的通信流程，实现复杂网络下稳定高效访问。",
                "引入 NSQ 消息队列，实现事件异步解耦，系统可稳定支持 QPS 3 万+ 的高并发写入，有效应对高并发场景下的系统压力。",
                "采用 AES+RSA 混合加密方案保障数据传输安全，实现端到端加密通信。"
            ]
        },
        {
            title: "智能文档中心", details: [
                "针对内存受限环境，完成了从 Elasticsearch 到 Bleve 的搜索引擎迁移，结合 GPT 语义扩展与高性能缓存，实现快速的全文与多维度检索。",
                "构建了支持 PDF、Office、ePub、Mobi、Markdown 的统一解析引擎，利用 chardet 实现跨编码自动纠正与全量 UTF-8 归一化。",
                "设计基于块的索引策略与聚合算法，为超长文档提供高上下文关联的“搜索高亮快照”。"
            ]
        },
        {
            title: "文件索引同步系统", details: [
                "从 fsnotify 事件监听模型切换至自研 DFS+Queue 架构，避免 OOM 风险，在海量文件场景下内存开销降低 90% 以上。",
                "实现基于 SQLite 状态机的增量同步引擎，通过文件指纹比对与任务优先级调度实现断点续传及冗余过滤，显著提升同步可靠性与响应效率。",
                "基于接口抽象与 Functional Options 模式，实现同步逻辑与底层存储、IO 的深度解耦，支持跨项目的高内聚集成。"
            ]
        },
        {
            title: "AI 相册系统", details: [
                "图片分类与人脸识别：通过 DBSCAN 聚类方法，支持 1 万人级人脸库的快速管理与比对，识别准确率达 97.3%。",
                "在检索模块中，运用策略、工厂模式，实现独立模式与依赖网盘模式两种检索策略，满足不同部署场景需求。"
            ]
        },
        {
            title: "系统优化与生态支持", details: [
                "开发并维护 Docker、虚拟机、Webdav、ChatGPT 等前后端项目，提供 NAS 生态支持。",
                "通过 rate 限流、Ristretto 缓存库、sync.Map+sync.Mutex 的方式有效缓解并发流量冲击；核心接口缓存命中率达 85%，响应时间缩短 120ms。"
            ]
        }
    ]

    return (
        <div className="relative bg-transparent min-h-screen">


            {/* 内容区域 */}
            <div className="relative z-10 container mx-auto px-4 md:px-6">

                {/* 1. 工作经历 Section */}
                <div className="py-24 md:py-32 max-w-4xl mx-auto">
                    <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">Professional Path</h2>
                    <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-16">Work Experience</h1>

                    <div className="relative border-l-2 border-gray-200 ml-3 md:ml-6 space-y-12 pl-8 md:pl-12 py-2">
                        {/* 经历条目 */}
                        <div className="relative group">
                            <span className="absolute -left-[41px] md:-left-[57px] top-0 w-5 h-5 rounded-full bg-blue-600 ring-4 ring-white group-hover:scale-125 transition-transform duration-300" />
                            <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/50 shadow-sm hover:shadow-xl transition-all duration-300">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900">Go 后端工程师</h3>
                                        <p className="text-gray-500 font-medium mt-1">某科技有限公司 · 深圳</p>
                                    </div>
                                    <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-bold whitespace-nowrap">
                                        2023.07 - 至今
                                    </span>
                                </div>
                                <ul className="space-y-3">
                                    {[
                                        "参与高并发系统设计与开发，负责核心业务模块",
                                        "开发私有云存储系统，实现 NAT 穿透、文件索引同步等功能",
                                        "优化系统性能，提高系统稳定性和响应速度",
                                        "使用 Go、Gin、GORM 等技术栈进行开发"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start text-gray-600">
                                            <span className="mr-3 text-blue-500 mt-[6px]">•</span>
                                            <span className="leading-relaxed">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. 项目经历 Stacking Cards */}
                <div className="pb-24">
                    <div className="text-center mb-16 md:mb-24">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">Selected Projects</h2>
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900">Project Gallery</h1>
                    </div>

                    <div className="space-y-8 md:space-y-0">
                        {projectModules.map((module, index) => (
                            <div
                                key={index}
                                className="md:sticky md:top-0 md:min-h-screen flex items-center justify-center py-4 md:py-0"
                            >
                                <div
                                    className="w-full max-w-5xl min-h-[auto] md:h-[70vh] flex flex-col justify-center bg-white/80 backdrop-blur-xl rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-16 border border-white shadow-2xl overflow-hidden relative group transition-all duration-500"
                                    style={{
                                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                                        transform: `rotate(${index % 2 === 0 ? '1deg' : '-1deg'})`
                                    }}
                                >
                                    {/* 背景装饰 Card Background Decoration */}
                                    <div className={`absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-br from-${['blue', 'purple', 'indigo', 'cyan', 'teal'][index % 5]}-500/10 to-transparent rounded-full blur-3xl opacity-50`} />

                                    <div className="relative z-10">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-12 gap-4">
                                            <div className="space-y-2">
                                                <span className="text-4xl md:text-7xl font-black text-gray-200 absolute -top-6 md:-top-10 -left-4 md:-left-10 select-none -z-10">
                                                    0{index + 1}
                                                </span>
                                                <h3 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight">
                                                    {module.title}
                                                </h3>
                                            </div>
                                            <span className="hidden md:block w-24 h-1 bg-gray-200 rounded-full" />
                                        </div>

                                        <div className="grid md:grid-cols-12 gap-6 md:gap-12">
                                            <div className="md:col-span-12">
                                                <ul className="space-y-3 md:space-y-6">
                                                    {module.details.map((detail, dIdx) => (
                                                        <li key={dIdx} className="flex items-start text-sm md:text-xl text-gray-600 font-medium leading-relaxed group-hover:text-gray-800 transition-colors">
                                                            <span className="w-1.5 h-1.5 md:w-2 md:h-2 mt-2 md:mt-2.5 mr-3 md:mr-4 bg-blue-500 rounded-full flex-shrink-0" />
                                                            {detail}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card Footer Decoration */}
                                    <div className="absolute bottom-6 right-8 text-xs font-bold text-gray-300 uppercase tracking-widest">
                                        Project Detail
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Experience