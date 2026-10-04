// 使用既有项目与内容路径；只维护首页展示信息，不复制文章正文。
export const works = [
    {
        id: 'agent-playbook', title: 'Agent Playbook', subtitle: 'Agent Playbook',
        category: 'AI · 开发工作流',
        description: '用 AGENTS.md 与阶段型 Skills，组织从需求澄清、设计到实现、审查和验证的 Codex 开发流程。',
        stack: ['Codex', 'Skills', 'Markdown'],
        href: 'https://github.com/soofjan1234/agent-playbook', color: 'peach',
    },
    {
        id: 'mini-k8s', title: 'mini-k8s', subtitle: 'mini-k8s',
        category: 'Go · 容器编排',
        description: '用 Go 探索 Kubernetes 控制面的核心机制，围绕 Pod 调度、Docker 容器运行与副本调谐构建教学项目。',
        stack: ['Go', 'Docker', 'Kubernetes'],
        href: 'https://github.com/soofjan1234/mini-k8s', color: 'cyan',
    },
    {
        id: 'Feed', title: 'Feed', subtitle: 'GCFeed',
        category: 'Go · 短视频信息流',
        description: '连接内容发布、信息流分发与互动消费，结合缓存、异步消息和监控，构建短视频 Feed 系统。',
        stack: ['Go', 'React', 'MySQL', 'Redis', 'RabbitMQ'],
        href: 'https://github.com/soofjan1234/Feed', color: 'sage',
    },
    {
        id: 'ins-robot',
        title: '社交发布机器人',
        subtitle: 'Instagram Robot',
        category: '自动化 · 社交媒体',
        description: '从文件管理到定时发布，让重复的社交媒体操作自动完成。',
        stack: ['Python', '定时任务', 'Instagram'],
        href: 'https://github.com/soofjan1234/ins-robot',
        image: '/projects/ins-robot/image.png',
        color: 'lilac',
    },
    {
        id: 'hotspotCrawler',
        title: '热点内容采集',
        subtitle: 'Hotspot Crawler',
        category: '数据采集 · AI',
        description: '采集网络热点，管理文章与图片，再用 AI 辅助内容创作。',
        stack: ['爬虫', 'Web', 'AI'],
        href: 'https://github.com/soofjan1234/HotspotCrawler',
        image: '/projects/hotspotCrawler/image.png',
        color: 'sage',
    },
    {
        id: 'articlesCrawler',
        title: '文章采集与解析',
        subtitle: 'Articles Crawler',
        category: '异步采集 · 工程化',
        description:
            '把商业智库文章整理成 Markdown，支持去重、增量更新与失败补爬。',
        stack: ['asyncio', 'httpx', 'Markdown'],
        href: 'https://github.com/soofjan1234/ArticlesCrawler',
        image: '/projects/articlesCrawler/image.png',
        color: 'yellow',
    },
]

// 按技术主题归类；Go 基础及源码共享入口，不展示空分类。
export const techCategories = [
    { id: 'go', title: 'Go 语言基础与进阶', mark: 'Go', category: 'LANGUAGE', description: '语言基础、Map、内存与 GC、并发调度、锁及关键字源码。', paths: ['/knowledge/go.md', '/sourceCode/map.md', '/sourceCode/内存.md', '/sourceCode/并发.md', '/sourceCode/锁.md', '/sourceCode/其他.md'], color: 'cyan', icon: '🐹' },
    { id: 'mysql', title: 'MySQL 入门与进阶', mark: 'SQL', category: 'DATABASE', description: '索引、事务与存储，从原理走到实际应用。', paths: ['/knowledge/mysql.md'], color: 'peach', icon: '🐬' },
    { id: 'redis', title: 'Redis 高性能应用', mark: 'Redis', category: 'DATABASE', description: '数据结构、持久化与缓存应用。', paths: ['/knowledge/redis.md'], color: 'lilac', icon: '🔴' },
]
