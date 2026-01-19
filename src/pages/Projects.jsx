import React from 'react'

const Projects = () => {
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/5 to-white/[0.02] p-8 border border-white/10">
                <div className="relative z-10 text-center py-20">
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">Projects</h2>
                    <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                        项目经历
                    </h1>
                    <p className="text-slate-400 text-lg">
                        敬请期待，项目经历即将上线...
                    </p>
                </div>
                {/* Decorative background element */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
            </section>
        </div>
    )
}

export default Projects
