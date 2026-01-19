import React, { useState } from 'react'

const Navigation = ({ activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'home', label: '首页' },
        { id: 'experience', label: '工作经历' },
        { id: 'projects', label: '项目经历' },
        { id: 'blog', label: '博客' },
    ]

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <>
            {/* 桌面端导航菜单 - 仅包含导航链接 */}
            <nav className="hidden md:flex items-center space-x-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`text-sm font-medium transition-all duration-200 hover:text-primary ${activeTab === tab.id
                                ? 'text-primary font-bold'
                                : 'text-text'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>

            {/* 移动端汉堡菜单按钮 */}
            <button 
                className="md:hidden text-text p-2" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {mobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* 移动端菜单 */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-sm border-b border-white/10 py-4 px-4 flex flex-col space-y-4">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id)
                                setMobileMenuOpen(false)
                            }}
                            className={`py-2 text-center text-sm font-medium transition-all duration-200 hover:text-primary ${activeTab === tab.id
                                    ? 'text-primary font-bold'
                                    : 'text-text'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <button className="px-6 py-2 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary/90 transition-colors mt-2">
                        联系我
                    </button>
                </div>
            )}
        </>
    )
}

export default Navigation
