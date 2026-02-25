import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const postsDir = path.join(root, 'public', 'posts')

/**
 * Recursively collect all .md file paths under dir
 * @param {string} dir
 * @param {string[]} acc
 * @returns {string[]}
 */
function collectMdFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      collectMdFiles(full, acc)
    } else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
      acc.push(full)
    }
  }
  return acc
}

/**
 * Parse frontmatter from markdown head; returns { title?, category? }
 * @param {string} head
 * @returns {{ title?: string, category?: string }}
 */
function parseFrontmatter(head) {
  const out = {}
  const fmMatch = head.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/)
  if (!fmMatch) return out
  const block = fmMatch[1]
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim()
    const titleMatch = line.match(/^title\s*:\s*(.+)$/)
    if (titleMatch) {
      const t = titleMatch[1].trim().replace(/^["']|["']$/g, '')
      if (t) out.title = t
    }
    const categoryMatch = line.match(/^category\s*:\s*(.+)$/)
    if (categoryMatch) {
      const c = categoryMatch[1].trim().replace(/^["']|["']$/g, '')
      if (c) out.category = c
    }
  }
  return out
}

/**
 * Get title from frontmatter or first `# title` line in raw
 * @param {string} filePath
 * @param {{ title?: string }} frontmatter
 * @param {string} raw
 * @returns {string}
 */
function getTitle(filePath, frontmatter, raw) {
  if (frontmatter?.title) return frontmatter.title
  const head = raw.slice(0, 2048)
  const h1Match = head.match(/^#\s+(.+)$/m)
  if (h1Match) return h1Match[1].trim()
  return path.basename(filePath, '.md')
}

/**
 * Build web path: /posts/2024/xxx.md (always use /)
 */
function toWebPath(absolutePath) {
  const relative = path.relative(postsDir, absolutePath)
  return '/posts/' + relative.split(path.sep).join('/')
}

/**
 * Get category: 目录结构为 public/posts/<category>/xxx.md，取第一层目录名
 */
function getCategory(absolutePath) {
  const relative = path.relative(postsDir, absolutePath)
  const segments = relative.split(path.sep)
  return segments[0] || '其他'
}

/**
 * 从 public/posts 下读取一级文件夹（及递归子文件夹结构），得到类别列表；
 * 顺序为一级目录名按字母排序，未在此列表中的类别（如文件直接在 posts 下）排在最后。
 */
function getCategoryOrder() {
  if (!fs.existsSync(postsDir)) return []
  const entries = fs.readdirSync(postsDir, { withFileTypes: true })
  const dirs = entries.filter((e) => e.isDirectory()).map((e) => e.name)
  return dirs.sort((a, b) => a.localeCompare(b, 'zh'))
}

// Run
const mdFiles = collectMdFiles(postsDir)
const byCategory = new Map()

for (const filePath of mdFiles) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const head = raw.slice(0, 2048)
  const frontmatter = parseFrontmatter(head)
  const category = getCategory(filePath)
  const webPath = toWebPath(filePath)
  const title = getTitle(filePath, frontmatter, raw)
  if (!byCategory.has(category)) byCategory.set(category, [])
  byCategory.get(category).push({ title, path: webPath, category })
}

const categoryOrder = getCategoryOrder()
const orderedCategories = [...byCategory.keys()].sort((a, b) => {
  const i = categoryOrder.indexOf(a)
  const j = categoryOrder.indexOf(b)
  if (i === -1 && j === -1) return a.localeCompare(b, 'zh')
  if (i === -1) return 1
  if (j === -1) return -1
  return i - j
})
const manifest = orderedCategories.map((category) => ({
  category,
  posts: byCategory.get(category),
}))

const outPath = path.join(root, 'public', 'posts.json')
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf-8')
console.log('Generated', outPath, 'with', mdFiles.length, 'posts in', orderedCategories.length, 'categories.')
