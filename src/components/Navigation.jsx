import React from 'react'

const Navigation = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'home', label: '首页', icon: '🏠' },
        { id: 'projects', label: '项目', icon: '🚀' },
        { id: 'blog', label: '博客', icon: '✍️' },
        { id: 'tools', label: '工具', icon: '🛠️' },
    ]

    return (
        <nav className="flex flex-col space-y-2">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                >
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-200">
                        {tab.icon}
                    </span>
                    {tab.label}
                    {activeTab === tab.id && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                </button>
            ))}
        </nav>
    )
}

export default Navigation
