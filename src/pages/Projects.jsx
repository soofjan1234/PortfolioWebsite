import { useState, useEffect } from 'react'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { TextAnimate } from "@/components/magicui/text-animate"
import { cn } from "@/lib/utils"
import { Marquee } from "@/components/magicui/marquee"
import { TextHoverEffect } from "@/components/ui/text-hover-effect"

const MarqueeCard = ({ item, onClick }) => {
    const linkTitle = (() => {
        if (item?.kind !== 'link' || !item?.href) return null
        try {
            const u = new URL(item.href)
            return `/${u.hostname}`
        } catch {
            return item.href
        }
    })()

    return (
        <div className={cn("group relative w-fit")}>
            {linkTitle && (
                <div
                    className={cn(
                        "pointer-events-none absolute left-1/2 -top-10 -translate-x-1/2",
                        "opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    )}
                    style={{
                        transform:
                            "translateX(-50%) rotateZ(-10deg) rotateY(20deg) rotateX(-10deg)",
                        transformOrigin: "center",
                    }}
                >
                    <div className="mx-auto w-fit rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[15px] font-semibold tracking-wide text-white/90 backdrop-blur max-w-[18rem] truncate">
                        {item.href}
                    </div>
                    <div className="mx-auto mt-2 h-10 w-px bg-gradient-to-b from-cyan-400/80 to-transparent" />
                </div>
            )}

            <figure
                onClick={onClick}
                className={cn(
                    "relative h-full w-fit cursor-pointer overflow-hidden rounded-xl border p-5 sm:w-64",
                    "border-gray-950/[.1] bg-gray-950/[.01] hover:bg-gray-950/[.05]",
                    "dark:border-gray-50/[.1] dark:bg-gray-50/[.10] dark:hover:bg-gray-50/[.15]"
                )}
            >
                <div className="flex flex-row items-center gap-3.5 mb-3">
                    {item.icon && (
                        <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-2xl">
                            <span>{item.icon}</span>
                        </div>
                    )}
                    <div className="flex flex-col min-w-0">
                        <figcaption className="text-[15px] font-semibold text-white truncate">
                            <TextHoverEffect text={item.title} />
                        </figcaption>
                        {item.meta && (
                            <p className="text-xs font-medium text-white/50 uppercase tracking-wide truncate">
                                {item.meta}
                            </p>
                        )}
                    </div>
                </div>
                {item.description && (
                    <blockquote className="mt-1 text-sm text-gray-200 line-clamp-3 max-w-[260px]">
                        {item.description}
                    </blockquote>
                )}
            </figure>
        </div>
    )
}

const Projects = () => {
    const [projects, setProjects] = useState([])
    const [knowledges, setKnowledges] = useState([])
    const [sourceCodes, setSourceCodes] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [projectDetail, setProjectDetail] = useState(null)
    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)
    const [showVideoModal, setShowVideoModal] = useState(false)
    const [viewMode, setViewMode] = useState('highlight')
    // Highlight mode columns: desktop 4, small-screen client 3.
    const [highlightColumns, setHighlightColumns] = useState(4)
    const [featuredRows, setFeaturedRows] = useState([[], [], [], []])

    // Load projects data
    useEffect(() => {
        const loadProjects = async () => {
            setInitialLoading(true)
            const projectDirs = ['ins-robot', 'ContentCreatorHelper', 'hotspotCrawler', 'articlesCrawler']
            const loadedProjects = []

            for (const dir of projectDirs) {
                try {
                    // Try to load markdown file
                    const response = await fetch(`/projects/${dir}/1.md`)
                    if (response.ok) {
                        const content = await response.text()
                        const lines = content.split('\n')

                        let github = ''
                        let intro = ''
                        let details = []

                        // Parse markdown content
                        lines.forEach(line => {
                            if (line.startsWith('github')) {
                                github = line.replace('github：', '').trim()
                            } else if (line.startsWith('简介')) {
                                intro = line.replace('简介：', '').trim()
                            } else if (line.trim()) {
                                details.push(line.trim())
                            }
                        })

                        loadedProjects.push({
                            id: dir,
                            name: formatProjectName(dir),
                            github,
                            intro,
                            details: details.join('\n'),
                            image: `/projects/${dir}/image.png`,
                            hasVideo: ['ins-robot', 'ContentCreatorHelper'].includes(dir)
                        })
                    }
                } catch (err) {
                    console.error(`Failed to load project ${dir}:`, err)
                }
            }

            setProjects(loadedProjects)

            // Fetch Knowledge Data
            try {
                const res = await fetch('/knowledge/go/1.md')
                if (res.ok) {
                    const content = await res.text()
                    const lines = content.split('\n').filter(Boolean)
                    const items = lines.map(line => {
                        const parts = line.split('http')
                        return { title: parts[0].trim(), link: parts.length > 1 ? 'http' + parts[1].trim() : '' }
                    }).filter(item => item.link)
                    setKnowledges([{
                        id: 'go',
                        name: 'Go 语言基础与进阶',
                        icon: '🐹',
                        intro: '深入探索Go语言的底层架构实现。',
                        image: '/knowledge/go/IMG_4730.JPG',
                        items
                    }])
                }
            } catch (err) { console.error('Load knowledge err:', err) }

            // Fetch Source Code Data
            try {
                const res = await fetch('/sourceCode/map.md')
                if (res.ok) {
                    const content = await res.text()
                    const lines = content.split('\n').filter(Boolean)
                    let name = 'Source Code'
                    if (lines.length > 0 && !lines[0].includes('http')) {
                        name = lines[0].trim()
                        lines.shift()
                    }
                    const items = lines.map(line => {
                        const parts = line.split('http')
                        return { title: parts[0].trim(), link: parts.length > 1 ? 'http' + parts[1].trim() : '' }
                    }).filter(item => item.link)

                    setSourceCodes([{
                        id: 'map',
                        name,
                        icon: '🔍',
                        intro: '原理解析与源码级剖析记录，探讨探针调度、哈希策略及扩容机制。',
                        image: '/sourceCode/IMG_4734.JPG',
                        items
                    }])
                }
            } catch (err) { console.error('Load source code err:', err) }

            setInitialLoading(false)
        }

        loadProjects()
    }, [])

    useEffect(() => {
        const updateColumns = () => {
            // Tailwind md breakpoint is 768px
            const cols = window.innerWidth < 768 ? 2 : 4
            setHighlightColumns(cols)
        }

        updateColumns()
        window.addEventListener('resize', updateColumns)
        return () => window.removeEventListener('resize', updateColumns)
    }, [])

    useEffect(() => {
        if (initialLoading) return

        const allItems = [
            ...projects.map(p => ({
                id: `project-${p.id}`,
                title: p.name,
                description: p.intro,
                meta: 'Project',
                icon: '🚀',
                kind: 'project',
                projectId: p.id,
            })),
            ...knowledges.map(k => ({
                id: `knowledge-${k.id}`,
                title: k.name,
                description: k.intro,
                meta: 'Knowledge',
                icon: '🧠',
                kind: 'knowledge',
                categoryId: k.id,
            })),
            ...knowledges.flatMap(k =>
                (k.items ?? []).map((it, idx) => ({
                    id: `knowledge-${k.id}-item-${idx}`,
                    title: it.title,
                    description: k.name,
                    meta: 'Knowledge',
                    icon: '🧠',
                    kind: 'link',
                    href: it.link,
                }))
            ),
            ...sourceCodes.map(s => ({
                id: `source-${s.id}`,
                title: s.name,
                description: s.intro,
                meta: 'Source',
                icon: '💻',
                kind: 'source',
                categoryId: s.id,
            })),
            ...sourceCodes.flatMap(s =>
                (s.items ?? []).map((it, idx) => ({
                    id: `source-${s.id}-item-${idx}`,
                    title: it.title,
                    description: s.name,
                    meta: 'Source',
                    icon: '💻',
                    kind: 'link',
                    href: it.link,
                }))
            ),
        ]

        if (!allItems.length) {
            setFeaturedRows(Array.from({ length: highlightColumns }, () => []))
            return
        }

        const shuffled = [...allItems].sort(() => Math.random() - 0.5)
        // Double the highlight wall length (more cards).
        const maxItems = Math.min(shuffled.length, 60)
        const selected = shuffled.slice(0, maxItems)

        const rows = Array.from({ length: highlightColumns }, () => [])
        selected.forEach((item, index) => {
            rows[index % rows.length].push(item)
        })

        setFeaturedRows(rows)
    }, [initialLoading, projects, knowledges, sourceCodes, highlightColumns])

    const handleFeaturedClick = (item) => {
        if (!item) return
        if (item.kind === 'link' && item.href) {
            window.open(item.href, '_blank', 'noopener,noreferrer')
            return
        }
        if (item.kind === 'project' && item.projectId) {
            const p = projects.find(x => x.id === item.projectId)
            if (p) handleProjectClick(p)
            return
        }
        if (item.kind === 'knowledge' && item.categoryId) {
            const k = knowledges.find(x => x.id === item.categoryId)
            if (k) handleProjectClick({ ...k, type: 'knowledge' })
            return
        }
        if (item.kind === 'source' && item.categoryId) {
            const s = sourceCodes.find(x => x.id === item.categoryId)
            if (s) handleProjectClick({ ...s, type: 'source' })
        }
    }

    const formatProjectName = (dir) => {
        const names = {
            'ins-robot': 'Instagram Robot',
            'ContentCreatorHelper': 'Content Creator Helper',
            'hotspotCrawler': 'Hotspot Crawler',
            'articlesCrawler': 'Articles Crawler'
        }
        return names[dir] || dir
    }

    const handleProjectClick = async (project) => {
        setSelectedProject(project)
        setLoading(true)
        setProjectDetail(project.details)
        setLoading(false)
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen bg-black text-white">
            {/* Header */}
            <div className="text-center mb-10 pt-12">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
                    <TextAnimate animation="blurInUp" by="character" once>Code & Knowledge</TextAnimate>
                </h2>
                <div className="flex items-center justify-center gap-4 mb-4">
                    <h1 className="text-4xl md:text-6xl font-black text-white">
                        <TextAnimate animation="blurInUp" by="character" once delay={0.2}>Tech Hub</TextAnimate>
                    </h1>
                    <div className="inline-flex items-center rounded-full bg-white/5 border border-white/10 p-1 text-xs font-semibold backdrop-blur">
                        <button
                            type="button"
                            onClick={() => setViewMode('highlight')}
                            className={cn(
                                "px-3 py-1.5 rounded-full transition-all",
                                viewMode === 'highlight'
                                    ? "bg-white text-black shadow-sm"
                                    : "text-gray-300 hover:text-white"
                            )}
                        >
                            Highlight
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('classic')}
                            className={cn(
                                "px-3 py-1.5 rounded-full transition-all",
                                viewMode === 'classic'
                                    ? "bg-white text-black shadow-sm"
                                    : "text-gray-300 hover:text-white"
                            )}
                        >
                            Classic
                        </button>
                    </div>
                </div>
                <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
                    A collection of my exploring automation, web scraping, tech blog posts, and codebase.
                </p>
            </div>

            {/* Loading State */}
            {initialLoading ? (
                <div className="flex flex-col items-center justify-center py-24">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-gray-100 border-b-gray-400 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
                        </div>
                    </div>
                    <p className="mt-6 text-gray-500 text-sm font-medium animate-pulse">Loading contents...</p>
                </div>
            ) : (
                /* Content Layout */
                <div className="container mx-auto px-4 md:px-0 mb-24 space-y-24">

                    {/* Highlight Mode - Tech Hub Marquee */}
                    {viewMode === 'highlight' && featuredRows.some(row => row.length > 0) && (
                        <section className="relative px-0 py-8 md:py-12 overflow-hidden">
                            <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-8">
                                <div className="text-left">
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-2">
                                        Highlight Mode
                                    </p>
                                    <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
                                        Recent explorations & picks
                                    </h2>
                                    <p className="text-sm md:text-base text-gray-300 max-w-md">
                                        A rotating wall of selected projects, knowledge notes, and source dives. Switch to Classic to browse everything.
                                    </p>
                                </div>
                            </div>
                            <div className="relative flex h-[42rem] md:h-[56rem] w-full flex-row items-center justify-center gap-4 overflow-hidden [perspective:420px]">
                                <div
                                    className="flex flex-row items-center gap-4"
                                    style={{
                                        transform:
                                            "translateX(-80px) translateY(0px) translateZ(-80px) rotateX(18deg) rotateY(-10deg) rotateZ(16deg)",
                                    }}
                                >
                                    {featuredRows.map((row, rowIndex) => (
                                        <Marquee
                                            key={rowIndex}
                                            pauseOnHover
                                            vertical
                                            reverse={rowIndex % 2 === 1}
                                            className="[--duration:44s]"
                                        >
                                            {row.map(item => (
                                                <MarqueeCard
                                                    key={item.id}
                                                    item={item}
                                                    onClick={() => handleFeaturedClick(item)}
                                                />
                                            ))}
                                        </Marquee>
                                    ))}
                                </div>

                                <div className="from-black to-transparent pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b" />
                                <div className="from-black to-transparent pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t" />
                                <div className="from-black to-transparent pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r" />
                                <div className="from-black to-transparent pointer-events-none absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l" />
                            </div>
                        </section>
                    )}

                    {/* Classic Mode Sections */}
                    {viewMode === 'classic' && (
                        <>
                            {/* 1. Knowledge Section */}
                            <section>
                                <div className="mb-8 md:mb-10 text-left">
                                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                                        <span className="bg-white/10 p-2 rounded-xl text-2xl">🧠</span>
                                        <TextAnimate animation="blurInUp" by="character" once delay={0.1}>Knowledge</TextAnimate>
                                    </h2>
                                    <p className="text-gray-500 font-medium ml-14">Tech blogs, architecture designs, and engineering notes</p>
                                </div>
                                {knowledges.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {knowledges.map(cat => (
                                            <div key={cat.id}
                                                onClick={() => handleProjectClick({ ...cat, type: 'knowledge' })}
                                                className="group cursor-pointer">
                                        <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                                    <div className="aspect-video relative overflow-hidden bg-gray-100 flex items-center justify-center">
                                                        {cat.image ? (
                                                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => e.target.style.display = 'none'} />
                                                        ) : null}
                                                        <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-gray-900/0 transition-colors duration-300" />
                                                        <span className="absolute text-5xl drop-shadow-lg scale-90 group-hover:scale-110 transition-transform duration-500">{!cat.image && cat.icon}</span>
                                                    </div>
                                                    <div className="p-6">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-900 transition-colors">
                                                            {cat.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                            {cat.intro}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-900 font-semibold uppercase tracking-wider">
                                                                Browse Collection
                                                            </span>
                                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-3xl hover:border-gray-300 transition-colors">
                                        <p className="text-gray-400 font-medium">Documentation and notes coming soon...</p>
                                    </div>
                                )}
                            </section>

                            {/* 2. Source Code Section */}
                            <section>
                                <div className="mb-8 md:mb-10 text-left">
                                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                                        <span className="bg-gray-100 p-2 rounded-xl text-2xl">💻</span>
                                        <TextAnimate animation="blurInUp" by="character" once delay={0.2}>Source Code</TextAnimate>
                                    </h2>
                                    <p className="text-gray-500 font-medium ml-14">Open source scripts, components, and code snippets</p>
                                </div>
                                {sourceCodes.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {sourceCodes.map(cat => (
                                            <div key={cat.id}
                                                onClick={() => handleProjectClick({ ...cat, type: 'source' })}
                                                className="group cursor-pointer">
                                        <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                                    <div className="aspect-video relative overflow-hidden bg-gray-100 flex items-center justify-center">
                                                        {cat.image ? (
                                                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" onError={(e) => e.target.style.display = 'none'} />
                                                        ) : null}
                                                        <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-gray-900/0 transition-colors duration-300" />
                                                        <span className="absolute text-5xl drop-shadow-lg scale-90 group-hover:scale-110 transition-transform duration-500">{!cat.image && cat.icon}</span>
                                                    </div>
                                                    <div className="p-6">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-900 transition-colors">
                                                            {cat.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                            {cat.intro}
                                                        </p>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-900 font-semibold uppercase tracking-wider">
                                                                Browse Snippets
                                                            </span>
                                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-16 bg-white/50 backdrop-blur-sm border-2 border-dashed border-gray-200 rounded-3xl hover:border-gray-300 transition-colors">
                                        <p className="text-gray-400 font-medium">Repositories and snippets coming soon...</p>
                                    </div>
                                )}
                            </section>

                            {/* 3. Projects Section */}
                            <section>
                                <div className="mb-8 md:mb-10 text-left">
                                    <h2 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center gap-3">
                                        <span className="bg-gray-100 p-2 rounded-xl text-2xl">🚀</span>
                                        <TextAnimate animation="blurInUp" by="character" once delay={0.3}>Projects</TextAnimate>
                                    </h2>
                                    <p className="text-gray-500 font-medium ml-14">Complete applications, tools, and side projects.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {projects.map((project) => (
                                        <div
                                            key={project.id}
                                            onClick={() => handleProjectClick(project)}
                                            className="group cursor-pointer"
                                        >
                                            {/* Card */}
                                    <div className="bg-white/85 backdrop-blur-md border border-white/70 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                                                {/* Image Preview - All projects show image */}
                                                <div className="aspect-video relative overflow-hidden">
                                                    <img
                                                        src={project.image}
                                                        alt={project.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                    {/* Video Indicator for projects with video */}
                                                    {project.hasVideo && (
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                                                            <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-50 group-hover:scale-100">
                                                                <svg className="w-5 h-5 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M8 5v14l11-7z" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-6">
                                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-gray-900 transition-colors">
                                                        {project.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                                        {project.intro}
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-900 font-semibold uppercase tracking-wider">
                                                            Click to view
                                                        </span>
                                                        <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}
                </div>
            )}

            {/* Project Detail Modal */}
            {selectedProject && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start justify-center pt-24 md:pt-24 p-4 md:p-8 animate-in fade-in duration-300 overflow-y-auto"
                    onClick={() => {
                        setSelectedProject(null)
                        setShowVideoModal(false)
                    }}
                >
                    <div
                        className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[calc(100vh-8rem)] md:max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide animate-in zoom-in-95 duration-300 my-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="relative bg-gray-100">
                            <img
                                src={selectedProject.image}
                                alt={selectedProject.name}
                                className="w-full aspect-video object-cover rounded-t-[1.5rem] md:rounded-t-[2rem]"
                            />
                            <button
                                onClick={() => {
                                    setSelectedProject(null)
                                    setShowVideoModal(false)
                                }}
                                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                            >
                                <svg className="w-5 h-5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-12">
                            <div className="mb-6 md:mb-8">
                                <h2 className="text-2xl md:text-4xl font-black text-gray-900 mb-3 md:mb-4">
                                    {selectedProject.name}
                                </h2>
                                <p className="text-base md:text-xl text-gray-600 mb-4 md:mb-6">
                                    {selectedProject.intro}
                                </p>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                                    {/* Play Video Button for projects with video */}
                                    {selectedProject.hasVideo && (
                                        <button
                                            onClick={() => setShowVideoModal(true)}
                                            className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-xl text-sm md:text-base font-semibold hover:bg-gray-800 transition-colors"
                                        >
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            Watch Demo
                                        </button>
                                    )}

                                    {/* GitHub Link */}
                                    {selectedProject.github && (
                                        <a
                                            href={selectedProject.github}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-xl text-sm md:text-base font-semibold hover:bg-gray-800 transition-colors"
                                        >
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                                            </svg>
                                            GitHub
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Details for Project Type */}
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                                </div>
                            ) : (!selectedProject.type && projectDetail) ? (
                                <div className="prose prose-lg max-w-none">
                                    <MarkdownRenderer content={projectDetail} />
                                </div>
                            ) : null}

                            {/* Details for Knowledge/Source Code Type (Links Modal) */}
                            {selectedProject.type && selectedProject.items && (
                                <div className="mt-8 space-y-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                        <span className="bg-gray-100 p-2 rounded-lg text-lg">📑</span>
                                        Collection Index
                                    </h3>
                                    <div className="grid gap-3">
                                        {selectedProject.items.map((item, idx) => (
                                            <a
                                                key={idx}
                                                href={item.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:border-gray-900 hover:shadow-lg transition-all duration-300"
                                            >
                                                <div className="flex items-start gap-4 mb-3 sm:mb-0">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center text-sm font-bold text-gray-500 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="font-semibold text-gray-800 group-hover:text-gray-900 text-lg leading-snug pt-0.5">{item.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-12 sm:pl-0">
                                                    <span className="text-sm font-bold text-gray-400 group-hover:text-gray-900 transition-colors uppercase tracking-wider">Read Full</span>
                                                    <svg className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transform -rotate-45 transition-all group-hover:translate-x-1 group-hover:-translate-y-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Video Fullscreen Modal */}
            {showVideoModal && selectedProject && (
                <div
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
                    onClick={() => setShowVideoModal(false)}
                >
                    <div
                        className="w-full max-w-6xl aspect-video relative animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <video
                            src={`/projects/${selectedProject.id}/video.mp4`}
                            controls
                            autoPlay
                            className="w-full h-full object-contain rounded-2xl shadow-2xl"
                        >
                            您的浏览器不支持视频播放。
                        </video>
                        <button
                            onClick={() => setShowVideoModal(false)}
                            className="absolute -top-4 -right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-xl"
                        >
                            <svg className="w-6 h-6 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Projects
