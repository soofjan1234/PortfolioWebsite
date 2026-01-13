import { useState } from 'react'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Blog from './pages/Blog'
import Tools from './pages/Tools'

function App() {
    const [activeTab, setActiveTab] = useState('home')

    const renderContent = () => {
        switch (activeTab) {
            case 'home':
                return <Home />
            case 'projects':
                return <Projects />
            case 'blog':
                return <Blog />
            case 'tools':
                return <Tools />
            default:
                return <Home />
        }
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-primary/30 selection:text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
                <div className="flex flex-col md:flex-row gap-12">
                    {/* Sidebar Navigation */}
                    <aside className="md:w-64 flex-shrink-0">
                        <div className="sticky top-8 space-y-8">
                            <div className="flex items-center space-x-3 px-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
                                    H
                                </div>
                                <span className="text-xl font-bold tracking-tight text-white">Portfolio</span>
                            </div>

                            <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />


                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <main className="flex-1 min-w-0">
                        <div className="max-w-4xl">
                            {renderContent()}
                        </div>

                        <footer className="mt-20 pt-8 border-t border-white/10 text-slate-500 text-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p>&copy; {new Date().getFullYear()} 侯汶政. All rights reserved.</p>
                            <div className="flex space-x-6">
                                <a href="https://github.com/soofjan1234" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GitHub</a>
                            </div>
                        </footer>
                    </main>
                </div>
            </div>
        </div>
    )
}

export default App
