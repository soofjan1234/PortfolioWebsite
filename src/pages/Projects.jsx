import { useState, useEffect } from 'react'
import MarkdownRenderer from '../components/MarkdownRenderer'

const Projects = () => {
    const [projects, setProjects] = useState([])
    const [selectedProject, setSelectedProject] = useState(null)
    const [projectDetail, setProjectDetail] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showVideoModal, setShowVideoModal] = useState(false)

    // Load projects data
    useEffect(() => {
        const loadProjects = async () => {
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
        }

        loadProjects()
    }, [])

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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-h-screen">
            {/* Header */}
            <div className="text-center mb-16 pt-12">
                <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-blue-600 mb-4">Personal Works</h2>
                <h1 className="text-4xl md:text-6xl font-black text-gray-900">Projects</h1>
                <p className="mt-6 text-gray-500 max-w-2xl mx-auto">
                    A collection of my work exploring automation, web scraping, and content creation tools.
                </p>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 container mx-auto px-4 md:px-0 mb-24">
                {projects.map((project) => (
                    <div
                        key={project.id}
                        onClick={() => handleProjectClick(project)}
                        className="group cursor-pointer"
                    >
                        {/* Card */}
                        <div className="bg-white/50 backdrop-blur-md border border-white/50 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
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
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    {project.name}
                                </h3>
                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                                    {project.intro}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-blue-600 font-semibold uppercase tracking-wider">
                                        Click to view
                                    </span>
                                    <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Project Detail Modal */}
            {selectedProject && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start md:items-center justify-center pt-20 md:pt-0 p-4 md:p-8 animate-in fade-in duration-300 overflow-y-auto"
                    onClick={() => {
                        setSelectedProject(null)
                        setShowVideoModal(false)
                    }}
                >
                    <div
                        className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[80vh] md:max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-300 my-4"
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
                                            className="inline-flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-blue-600 text-white rounded-xl text-sm md:text-base font-semibold hover:bg-blue-700 transition-colors"
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

                            {/* Details */}
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                </div>
                            ) : projectDetail ? (
                                <div className="prose prose-lg max-w-none">
                                    <MarkdownRenderer content={projectDetail} />
                                </div>
                            ) : null}
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
