import React from 'react'

const Tools = () => {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Resources</h2>
                <h1 className="text-4xl font-bold text-white">书单与工具箱</h1>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center text-center py-16">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-xl font-bold text-white mb-2">书单收藏</h3>
                    <p className="text-slate-400 text-sm">正在整理中，敬请期待...</p>
                </div>
                <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 flex flex-col items-center justify-center text-center py-16">
                    <div className="text-4xl mb-4">🔧</div>
                    <h3 className="text-xl font-bold text-white mb-2">常用工具</h3>
                    <p className="text-slate-400 text-sm">正在整理中，敬请期待...</p>
                </div>
            </div>
        </div>
    )
}

export default Tools
