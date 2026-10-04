import { parseArticleLinks } from './home-scroll'

/** 同一分类全部来源成功后才展示，按链接去重并保留原始顺序。 */
export async function loadArticles(category, signal) {
    const lists = await Promise.all(category.paths.map(async (path) => {
        const response = await fetch(path, { signal })
        if (!response.ok) throw new Error('Article list unavailable')
        const items = parseArticleLinks(await response.text())
        if (!items.length) throw new Error('Empty article list')
        return items
    }))
    const seen = new Set()
    return lists.flat().filter(({ href }) => {
        if (seen.has(href)) return false
        seen.add(href)
        return true
    })
}
