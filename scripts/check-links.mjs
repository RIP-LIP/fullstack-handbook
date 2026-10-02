/**
 * 站内链接检查。
 *
 * VitePress 自带的死链检查**只管路径，不管锚点**。写 `[x](/a#不存在的节)`
 * 构建照样通过，链接点过去发现「找不到这一节」。这类问题不会自己暴露。
 *
 * 这个脚本读构建产物，校验三件事：
 *   1. 站内链接的目标页面存在
 *   2. 带 `#锚点` 的链接，目标页面上真的有那个 id
 *   3. 不存在「只有 /guide/ 这种不完整的路径」
 *
 * 用法：
 *   npm run build && npm run check:links
 *
 * 退出码：0 全部有效；1 有失效链接（并逐条打印）。
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const root = dirname(fileURLToPath(import.meta.url))
const dist = join(root, '..', 'docs', '.vitepress', 'dist')

if (!existsSync(dist)) {
  console.error('找不到构建产物。先跑 npm run build。')
  process.exit(1)
}

const base = '/fullstack-handbook'

/** '/guide/ch01.html#_9-常见误区' → 页面 '/guide/ch01.html' */
function splitTarget(href) {
  const [path, anchor] = href.split('#')
  return { path: path || href, anchor: anchor ?? null }
}

const HAS_EXT = /\.[a-z0-9]+$/i

/** 静态资源（css/js/字体/图片）不是页面，按原样解析 */
function isAsset(route) {
  return HAS_EXT.test(route) && !route.endsWith('.html')
}

/** '/guide/ch01.html' → 'guide/ch01.html'；'/' → 'index.html' */
function toFile(route) {
  let r = route.replace(/^\//, '')
  if (r.endsWith('.html')) r = r.slice(0, -'.html'.length)
  if (r === '') return 'index.html'
  return `${r}.html`
}

/** 页面路径归一，用于和当前页比较（同页锚点） */
function normalizeRoute(route) {
  let r = route.replace(/^\//, '').replace(/\.html$/, '')
  if (r === '' || r === 'index') return '/'
  return `/${r}`
}

const idCache = new Map()
function idsOf(route) {
  const key = normalizeRoute(route)
  if (idCache.has(key)) return idCache.get(key)

  const set = new Set()
  const file = join(dist, toFile(key))
  if (existsSync(file)) {
    const html = readFileSync(file, 'utf8')
    for (const m of html.matchAll(/\sid="([^"]+)"/g)) set.add(m[1])
    for (const m of html.matchAll(/<a[^>]*\sname="([^"]+)"/g)) set.add(m[1])
  }
  idCache.set(key, set)
  return set
}

function pageExists(route) {
  return existsSync(join(dist, toFile(route)))
}

const htmlFiles = []
;(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full)
    else if (name.endsWith('.html') && name !== '404.html') htmlFiles.push(full)
  }
})(dist)

// 0 个页面 = 构建没产出，不是「全部有效」。
// 报「全部有效」退出 0 是最坏的一种失败：看起来检查通过了，其实什么都没查。
if (htmlFiles.length === 0) {
  console.error(`构建产物里没有 HTML 页面，检查无从进行。\n  目录：${dist}\n  先跑 npm run build，确认它真的成功了。`)
  process.exit(1)
}

const problems = []
let checked = 0
let anchors = 0

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8')
  const here = normalizeRoute('/' + file.slice(dist.length + 1).replace(/\\/g, '/').replace(/\.html$/, ''))

  for (const m of html.matchAll(/href="([^"]+)"/g)) {
    const href = m[1]

    // 外链、纯锚点、data:/mailto: 等一律跳过
    if (!href.startsWith(base) || href.startsWith('http')) continue

    checked++
    const { path, anchor } = splitTarget(href.slice(base.length) || '/')

    // 静态资源：只确认文件在不在，不查锚点
    if (isAsset(path)) {
      if (!existsSync(join(dist, path.replace(/^\//, '')))) {
        problems.push({ from: here, to: href, why: '静态资源不存在' })
      }
      continue
    }

    // 同页锚点
    if (path === '/' || path === '' || normalizeRoute(path) === here) {
      if (anchor) {
        anchors++
        if (!idsOf(here).has(anchor)) {
          problems.push({ from: here, to: `#${anchor}`, why: '本页没有这个 id' })
        }
      }
      continue
    }

    if (!pageExists(path)) {
      problems.push({ from: here, to: href, why: '目标页面不存在' })
      continue
    }

    if (anchor) {
      anchors++
      if (!idsOf(path).has(anchor)) {
        problems.push({ from: here, to: href, why: '目标页面没有这个 id' })
      }
    }
  }
}

console.log(`检查 ${htmlFiles.length} 个页面，${checked} 条站内链接（其中 ${anchors} 条带锚点）`)

if (problems.length === 0) {
  console.log('全部有效。')
  process.exit(0)
}

console.error(`\n失效 ${problems.length} 条：\n`)
for (const p of problems) {
  console.error(`  ${p.from}  ->  ${p.to}`)
  console.error(`      ${p.why}\n`)
}
process.exit(1)
