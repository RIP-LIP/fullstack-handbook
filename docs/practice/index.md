---
title: 完整项目
---

# 完整项目：一个书签应用

主线三章的代码在 [fullstack-todo-app](https://github.com/RIP-LIP/fullstack-todo-app)，需要 `git checkout` 和 `npm install`。这一节的东西**全在下面，复制粘贴就行**。

## 适合谁

- 跟着主线走完了，想确认自己真的懂了
- 想看一个**没有构建工具**的全栈应用长什么样
- 想换个项目练手，但不知道从哪开始

如果这三个都不是，去看 [工具怎么选](/toolkit/index)。

## 需要准备什么

只有一个：Node 22.5 或更高。

```bash
node -v
```

**不用装任何依赖。** 后端用 Node 自带的 `node:http` 和 `node:sqlite`，前端是原生 ES module，没有 Vite、没有 React、没有 npm install。这个项目一共 6 个文件，`node_modules` 是空的。

::: warning Node 版本
`node:sqlite` 是 Node 22.5 才有的。如果你 `node -v` 出来低于 22.5，去 [环境配置](/guide/setup) 装 LTS。
:::

## 建目录

```bash
mkdir practice-app
cd practice-app
```

接下来建 8 个文件。下面每一节是一个文件的**完整内容**，整个复制进去就行，不需要改任何地方。

```
practice-app/
  package.json
  server.mjs
  store.mjs
  validate.mjs
  public/
    index.html
    app.js
    api.js
    style.css
```

## 1. package.json

```json
{
  "name": "practice-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "书签收藏。零依赖，一个进程，一个端口。",
  "scripts": {
    "dev": "node server.mjs",
    "db:reset": "node -e \"import('node:fs').then(fs => fs.rmSync('data', { recursive: true, force: true }))\""
  },
  "engines": {
    "node": ">=22.5.0"
  }
}
```

`"type": "module"` 这一行是必须的。没有它，`.mjs` 后缀虽然也能用 ES module，但 `package.json` 里就少了一个能学到东西的字段。

`db:reset` 是后面「常见误区」那节要用的。**它会删掉整个数据库目录，不可恢复。**

## 2. store.mjs — 数据层

```js
/**
 * 数据层：建表 + 增删改查。
 *
 * 全部同步。node:sqlite 提供的是 DatabaseSync，接口是同步的，
 * 所以这里不用 await —— 这是它和 PostgreSQL 客户端最大的区别。
 */
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
mkdirSync(join(root, 'data'), { recursive: true })

export const db = new DatabaseSync(join(root, 'data', 'app.db'))

// WAL 模式：读写不互相阻塞。代价是同目录会多出 -wal / -shm 两个文件，是正常的。
db.exec('PRAGMA journal_mode = WAL')

// 建表放在这里，所以起服务就够了，不需要手动执行任何 SQL。
// IF NOT EXISTS 让这行每次启动都能安全重跑。
db.exec(`
  CREATE TABLE IF NOT EXISTS bookmarks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    url        TEXT    NOT NULL,
    note       TEXT    NOT NULL DEFAULT '',
    created_at TEXT    NOT NULL
  )
`)

// SQLite 没有 boolean / timestamp 类型，统一在数据库里存文本或整数，
// 读出来的时候再转成前端习惯的类型（下面这个函数就是干这个的）。
function toBookmark(row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    note: row.note,
    createdAt: row.created_at,
  }
}

export function listBookmarks() {
  return db.prepare('SELECT * FROM bookmarks ORDER BY id DESC').all().map(toBookmark)
}

export function getBookmark(id) {
  return toBookmark(db.prepare('SELECT * FROM bookmarks WHERE id = ?').get(id))
}

export function createBookmark({ title, url, note }) {
  const info = db
    .prepare('INSERT INTO bookmarks (title, url, note, created_at) VALUES (?, ?, ?, ?)')
    .run(title, url, note, new Date().toISOString())
  return getBookmark(Number(info.lastInsertRowid))
}

// PATCH 只更新传了的字段。
// 字段名不能直接拼进 SQL —— 白名单里没有的一律忽略，
// 否则调用方传一个 title=1; DROP TABLE bookmarks 就能改到别的东西。
const PATCHABLE = { title: 'title', url: 'url', note: 'note' }

export function updateBookmark(id, patch) {
  const entries = Object.entries(patch)
    .filter(([key]) => key in PATCHABLE)
    .map(([key]) => [PATCHABLE[key], key])

  if (entries.length === 0) return getBookmark(id)

  const sql = `UPDATE bookmarks SET ${entries.map(([col]) => `${col} = ?`).join(', ')} WHERE id = ?`
  const info = db.prepare(sql).run(...entries.map(([, key]) => patch[key]), id)

  if (Number(info.changes) === 0) return null
  return getBookmark(id)
}

export function deleteBookmark(id) {
  const info = db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id)
  return Number(info.changes) > 0
}
```

**这个文件和主线「数据存储」那篇的 `db.ts` 是同一个东西**，只是短一些。三个值得注意的地方：

| 写法 | 为什么 |
| --- | --- |
| `prepare().all() / .get() / .run()` | 参数和 SQL 分开传的（`?` 占位符），不拼字符串 |
| `Number(info.lastInsertRowid)` | 插入后数据库才会发号，号在这里拿 |
| `Number(info.changes) === 0` | 「影响了几行」是 0 就说明没这行，404 就是这么判的 |

## 3. validate.mjs — 校验

```js
/**
 * 校验：手写的，不依赖任何库。
 *
 * 主线项目用 Zod，这里手写，是为了让你看清一件事：
 * 校验的逻辑就这几行，任何库都只是把它包起来。
 * 区别只在于「规则从哪来」—— 手写版规则写死在代码里，
 * 库版（Zod）可以导出成变量被前后端共用。
 */

/**
 * 合法地址：必须以 http:// 或 https:// 开头，后面不能是空白或空的主机名。
 * 不要求有点号 —— 本机的 http://localhost:4000 也是能存的地址。
 */
const URL_RE = /^https?:\/\/[^\s/$.?#][^\s]*$/i

function pickString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

/** 返回 { data, fields }。fields 非空就是没过校验。 */
export function validateBookmark(body, { partial = false } = {}) {
  const fields = {}

  if (!partial || 'title' in (body ?? {})) {
    const title = pickString(body?.title)
    if (!title) fields.title = '标题不能为空'
    else if (title.length > 200) fields.title = '标题最多 200 个字符'
  }

  if (!partial || 'url' in (body ?? {})) {
    const url = pickString(body?.url)
    if (!url) fields.url = '地址不能为空'
    else if (!URL_RE.test(url)) fields.url = '地址要写成 http:// 或 https:// 开头'
  }

  if (!partial || 'note' in (body ?? {})) {
    const note = pickString(body?.note)
    if (note.length > 500) fields.note = '备注最多 500 个字符'
  }

  // 只挑出本次请求里真正要校验的字段
  const data = {}
  for (const key of ['title', 'url', 'note']) {
    if (partial && !(key in (body ?? {}))) continue
    if (key in fields) continue
    data[key] = pickString(body?.[key])
  }

  return { data, fields, ok: Object.keys(fields).length === 0 }
}
```

`partial` 是给 `PATCH` 用的：`POST` 要三个字段全查，`PATCH` 只查这次传了的。少了它，`PATCH {"note":"x"}` 会被判成「标题不能为空」。

`fields` 这个名字一路传到前端的表单里 —— [前端交互](/guide/ch03)那篇讲的字段级错误提示，源头就是这里的 `fields`。

## 4. server.mjs — HTTP

这是最长的一个文件，也是唯一有真实难度的地方。

```js
/**
 * 一个进程同时干两件事：提供 API、提供网页。
 *
 * 这就是这一节和主线最大的不同：主线开了两个服务（5173 前端 + 3001 后端），
 * 还得配代理。这里同一个端口同时管数据和页面，浏览器看来全是同源请求，
 * 代理、CORS、跨端口这三件事一个都不会遇到。
 *
 * 代价是：这份 server.mjs 只适用于「前端就是几个静态文件」的项目。
 * 真到了用 React / Vue 的规模，还是得开两个服务 + 代理。
 */
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { listBookmarks, createBookmark, updateBookmark, deleteBookmark, getBookmark } from './store.mjs'
import { validateBookmark } from './validate.mjs'

const root = dirname(fileURLToPath(import.meta.url))
const publicDir = join(root, 'public')
const PORT = process.env.PORT ?? 4000

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
}

/**
 * 统一错误形状。
 *
 * 全项目只有这一种失败响应，前端只要写一个解析函数。
 * code 给程序看，message 给人看，fields 用来定位到具体表单项。
 */
function sendError(res, status, code, message, fields) {
  const body = { error: { code, message } }
  if (fields) body.error.fields = fields
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

/**
 * 204 要单独发。
 *
 * 如果图省事写成 sendJson(res, 204, null)，Node 会在协议层把 body 悄悄丢掉，
 * 本地测怎么测都正常 —— 响应里确实一个字都没有。
 *
 * 但那 4 个字符的 null 是「被 Node 替你丢了」，不是「本来就没发」。
 * 中间隔一层反向代理、CDN 或 WAF 时，它们未必都这么宽容，
 * 有的会照着 Content-Type 去解析 body 然后报「响应格式非法」。
 *
 * 正确做法是根本不要产生它。
 */
function sendNoContent(res) {
  res.writeHead(204)
  res.end()
}

/**
 * 读请求体。分两步失败：
 * 1. 读失败 / 不是 JSON  → INVALID_JSON（这是客户端的问题，400）
 * 2. 读成功但 JSON 语法错 → 同样 400，不是 500
 *
 * 这个区分很要紧。Express 会把 body parser 的失败报成 500，
 * 害得你以为是服务端代码挂了。
 */
async function readJsonBody(req) {
  const chunks = []
  let size = 0

  for await (const chunk of req) {
    size += chunk.length
    // 顺手挡一下超大 body。教程项目也要有这个意识。
    if (size > 1_000_000) throw Object.assign(new Error('请求体过大'), { status: 413, code: 'PAYLOAD_TOO_LARGE' })
    chunks.push(chunk)
  }

  // 注意这一步的 BOM：Windows 上很多工具写文件会带一个 BOM（PowerShell 5.1 的
  // `Set-Content -Encoding UTF8`、旧版记事本、部分邮件客户端），开头多出
  // 一个 U+FEFF。JSON.parse 见到它会直接抛错，于是合法的请求被判成「非法 JSON」。
  // 去掉它，别把这个坑留给调用方。
  const raw = Buffer.concat(chunks).toString('utf8').replace(/^\uFEFF/, '')
  if (raw.trim() === '') return {}

  try {
    return JSON.parse(raw)
  } catch {
    throw Object.assign(new Error('请求体不是合法的 JSON'), { status: 400, code: 'INVALID_JSON' })
  }
}

/**
 * 静态文件。
 *
 * 挡路径穿越的是 normalize 这一行：它把 `../` 折叠掉，`/../server.mjs`
 * 变成 `server.mjs`，再拼上 publicDir 就落在 public 里那个不存在的文件上 → 404。
 * 下面那个 startsWith 是第二道，normalize 的行为哪天变了它还能兜住。
 */
async function serveStatic(res, pathname) {
  const rel = normalize(pathname === '/' ? '/index.html' : pathname).replace(/^([/\\])+/, '')
  const file = join(publicDir, rel)

  if (!file.startsWith(publicDir)) {
    return sendError(res, 403, 'FORBIDDEN', '路径不合法')
  }

  try {
    const content = await readFile(file)
    res.writeHead(200, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    })
    res.end(content)
  } catch {
    // 路径不存在就当没这个接口。静态资源 404 返回 JSON，调试时一眼能看出是路由问题
    sendError(res, 404, 'NOT_FOUND', `没有这个路径：${pathname}`)
  }
}

async function handleApi(req, res, url) {
  const { pathname } = url
  const method = req.method

  if (pathname === '/api/health') {
    return sendJson(res, 200, { ok: true, service: 'practice-app' })
  }

  if (pathname === '/api/bookmarks') {
    if (method === 'GET') return sendJson(res, 200, listBookmarks())
    if (method === 'POST') {
      const body = await readJsonBody(req)
      const { data, fields, ok } = validateBookmark(body)
      if (!ok) return sendError(res, 400, 'VALIDATION_FAILED', '输入不符合要求', fields)
      return sendJson(res, 201, createBookmark(data))
    }
  }

  const match = pathname.match(/^\/api\/bookmarks\/(\d+)$/)
  if (match) {
    const id = Number(match[1])

    if (method === 'GET') {
      const item = getBookmark(id)
      return item ? sendJson(res, 200, item) : sendError(res, 404, 'NOT_FOUND', `书签 ${id} 不存在`)
    }

    if (method === 'PATCH') {
      const body = await readJsonBody(req)
      const { data, fields, ok } = validateBookmark(body, { partial: true })
      if (!ok) return sendError(res, 400, 'VALIDATION_FAILED', '输入不符合要求', fields)
      const updated = updateBookmark(id, data)
      return updated ? sendJson(res, 200, updated) : sendError(res, 404, 'NOT_FOUND', `书签 ${id} 不存在`)
    }

    if (method === 'DELETE') {
      return deleteBookmark(id)
        ? sendNoContent(res)
        : sendError(res, 404, 'NOT_FOUND', `书签 ${id} 不存在`)
    }
  }

  return sendError(res, 404, 'NOT_FOUND', `没有这个接口：${method} ${pathname}`)
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)

  try {
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url)
    } else if (req.method === 'GET') {
      await serveStatic(res, url.pathname)
    } else {
      sendError(res, 405, 'METHOD_NOT_ALLOWED', `${req.method} 不支持`)
    }
  } catch (err) {
    // 走到这里说明是「我们自己出的问题」，所以是 500。
    // 客户端发来的坏数据在 readJsonBody 里就被 400 拦下了，不会掉到这里。
    console.error('[error]', err)
    sendError(res, err.status ?? 500, err.code ?? 'INTERNAL_ERROR', err.message ?? '服务端出错')
  }
})

server.listen(PORT, () => {
  console.log(`[practice-app] 已启动 → http://localhost:${PORT}`)
  console.log(`[practice-app] 先试一下：curl -i http://localhost:${PORT}/api/health`)
})
```

三个地方值得停下来看：

**`for await (const chunk of req)`** —— Node 的请求对象本身是可读流，异步遍历它就能一片一片拿到 body。拼成 Buffer 再 `JSON.parse`，顺序不能反。

**`catch` 里的 `err.status ?? 500`** —— 这是全文件的关键。`readJsonBody` 抛出的错带着 `status: 400`，所以到这里是 400；其他没带 status 的错才是 500。**客户端发来的坏数据永远不该变成 500**，因为那样你查问题时会先怀疑自己的代码，而问题在调用方。

**`url.pathname.startsWith('/api/')`** —— 开头就把两类请求分开。这是「单进程」能成立的原因：接口路径和文件路径有明确的前缀边界，不会撞车。

## 5. public/index.html

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>书签</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    <main class="wrap">
      <header class="head">
        <h1>书签</h1>
        <p class="sub">一个进程，一个端口，零依赖。</p>
        <button class="btn ghost" data-role="reload" type="button">重新加载</button>
      </header>

      <form id="form" class="form" novalidate>
        <div class="row">
          <label class="field">
            <span class="label">标题</span>
            <input id="title" name="title" type="text" placeholder="Node 手册" autocomplete="off" />
            <span class="err" data-err="title"></span>
          </label>
          <label class="field">
            <span class="label">地址</span>
            <input id="url" name="url" type="text" placeholder="https://nodejs.org" autocomplete="off" />
            <span class="err" data-err="url"></span>
          </label>
        </div>
        <div class="row">
          <label class="field grow">
            <span class="label">备注（可选）</span>
            <input id="note" name="note" type="text" placeholder="装完顺手看一眼" autocomplete="off" />
            <span class="err" data-err="note"></span>
          </label>
          <button type="submit" class="btn" data-role="submit">添加</button>
        </div>
      </form>

      <!-- 四种状态都有对应的地方。少一个，页面就有一片说不清的空白。 -->
      <section class="list" data-role="list" aria-live="polite"></section>
    </main>

    <script type="module" src="/app.js"></script>
  </body>
</html>
```

`novalidate` 是故意的：不用浏览器自带的必填提示，我们自己的提示更准。`aria-live="polite"` 让屏幕阅读器在列表更新时播报。

## 6. public/api.js — 唯一的请求出口

```js
/**
 * 全项目唯一发请求的地方。组件（app.js）只调这里，不碰 fetch。
 *
 * 理由和主线一样：URL 只写一次、错误只处理一次、状态码只判断一次。
 * 新增接口时只改这个文件。
 */

export class RequestError extends Error {
  constructor(status, code, message, fields) {
    super(message)
    this.name = 'RequestError'
    this.status = status // 0 表示请求没发出去
    this.code = code
    this.fields = fields
  }
}

async function request(path, init) {
  let res

  try {
    res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    })
  } catch {
    // fetch 抛异常只有一个原因：请求没发出去。
    // 跟「服务端返回 500」是两回事，在 Network 面板里长得完全不一样。
    throw new RequestError(0, 'NETWORK_ERROR', '连不上后端。先确认 node server.mjs 还在跑。')
  }

  if (res.status === 204) return null

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new RequestError(
      res.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.message ?? `请求失败（HTTP ${res.status}）`,
      body?.error?.fields,
    )
  }

  return body
}

export const api = {
  list: (signal) => request('/api/bookmarks', { signal }),
  create: (input) => request('/api/bookmarks', { method: 'POST', body: JSON.stringify(input) }),
  remove: (id) => request(`/api/bookmarks/${id}`, { method: 'DELETE' }),
}
```

「全项目唯一发请求的地方」这条规矩，理由在 [前端交互 › 为什么所有请求集中在 api.ts](/guide/ch03#_4-为什么所有请求集中在-api-ts) 讲过。

## 7. public/app.js

```js
/**
 * 界面逻辑。没有框架，靠一个 state 变量和 render() 驱动。
 *
 * 结构照抄主线那篇的四条：
 * 1. 四种状态，缺一个就是 bug
 * 2. 网络错误和 HTTP 错误分开处理
 * 3. 删除走乐观更新，失败回滚
 * 4. 重复加载时取消上一次请求
 */
import { api, RequestError } from '/api.js'

const form = document.querySelector('#form')
const listEl = document.querySelector('[data-role="list"]')
const submitBtn = document.querySelector('[data-role="submit"]')

let state = { status: 'loading' }
let inflight = null
let toastTimer = null

/** 所有插进 innerHTML 的动态文本都要过这里，否则标题里打个 <img onerror> 就执行了。 */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c])
}

function toast(message) {
  clearTimeout(toastTimer)
  const el = document.createElement('div')
  el.className = 'toast'
  el.textContent = message
  document.body.append(el)
  toastTimer = setTimeout(() => el.remove(), 2600)
}

function describe(err) {
  if (err instanceof RequestError) {
    // 字段级错误优先显示，因为用户要知道改哪个框
    if (err.fields) return Object.values(err.fields)[0]
    return err.message
  }
  return '出了点问题，再试一次'
}

function render() {
  if (state.status === 'loading') {
    listEl.innerHTML = '<div class="state">加载中…</div>'
    return
  }

  if (state.status === 'error') {
    listEl.innerHTML = `
      <div class="state error" role="alert">
        <p>${esc(state.message)}</p>
        <button class="btn" data-role="retry">重试</button>
      </div>`
    return
  }

  if (state.items.length === 0) {
    listEl.innerHTML = '<div class="state">还没有书签。上面加一条试试。</div>'
    return
  }

  listEl.innerHTML = state.items
    .map(
      (b) => `
      <div class="item">
        <div class="item-body">
          <div class="item-title">${esc(b.title)}</div>
          <a class="item-url link" href="${esc(b.url)}" target="_blank" rel="noreferrer noopener">${esc(b.url)}</a>
          ${b.note ? `<p class="item-note">${esc(b.note)}</p>` : ''}
        </div>
        <button class="del" data-del="${b.id}" aria-label="删除 ${esc(b.title)}">删除</button>
      </div>`,
    )
    .join('')
}

function setFieldErrors(fields) {
  form.querySelectorAll('[data-err]').forEach((el) => {
    const key = el.dataset.err
    el.textContent = fields?.[key] ?? ''
    const input = form.querySelector(`[name="${key}"]`)
    if (input) input.setAttribute('aria-invalid', fields?.[key] ? 'true' : 'false')
  })
}

async function load() {
  // 取消上一次还没回来的请求。它回来时数据可能已经旧了。
  inflight?.abort()
  const ctrl = new AbortController()
  inflight = ctrl

  try {
    const items = await api.list(ctrl.signal)
    state = { status: 'ready', items }
  } catch (err) {
    if (err.name === 'AbortError') return // 是我们自己取消的，不算错误
    state = { status: 'error', message: describe(err) }
  } finally {
    if (inflight === ctrl) inflight = null
  }

  render()
}

form.addEventListener('submit', async (event) => {
  event.preventDefault()
  setFieldErrors(null)

  const input = {
    title: form.title.value,
    url: form.url.value,
    note: form.note.value,
  }

  submitBtn.disabled = true
  try {
    const created = await api.create(input)
    // 请求成功之前不清空输入框 —— 万一失败，用户白打的字就没了
    form.reset()
    if (state.status === 'ready') state = { ...state, items: [created, ...state.items] }
    render()
  } catch (err) {
    setFieldErrors(err instanceof RequestError ? err.fields : null)
    if (!(err instanceof RequestError && err.fields)) toast(describe(err))
  } finally {
    submitBtn.disabled = false
  }
})

listEl.addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-del]')
  if (btn) return remove(Number(btn.dataset.del))
  if (event.target.closest('[data-role="retry"]')) reload()
})

/**
 * 这个按钮存在的理由值得说清楚。
 *
 * 页面的 HTML 是后端提供的，所以后端一挂，按 F5 刷新只会得到「无法访问此网站」——
 * 你连页面都看不到，更别说看到页面里的 error 态。
 * 平时又没有别的操作能触发 load()，error 态就成了一个走不到的状态。
 *
 * 加一个常驻的「重新加载」才有办法验证它。真实项目里这个位置通常是
 * 下拉刷新、轮询，或者一个能重新拉数据的入口。
 */
document.querySelector('[data-role="reload"]').addEventListener('click', reload)

function reload() {
  state = { status: 'loading' }
  render()
  load()
}

async function remove(id) {
  if (state.status !== 'ready') return

  const backup = state.items                              // ① 备份
  state = { status: 'ready', items: backup.filter((b) => b.id !== id) }  // ② 先消失
  render()

  try {
    await api.remove(id)                                 // ③ 后台真删
  } catch (err) {
    state = { status: 'ready', items: backup }           // ④ 失败，弹回来
    render()
    toast(`没能删除：${describe(err)}`)
  }
}

render()
load()
```

**「重新加载」这个按钮是补上去的，不是设计时就有的。** 第一次写完这个项目，它跑不起来 error 态：后端一停，F5 直接给你「无法访问此网站」（因为连 HTML 都是后端给的），而页面上又没有别的地方能触发 `load()`。**一个走不到的状态等于没有。**

这个 bug 只有真去点一遍才会发现——这就是 [写在开头](/guide/intro) 里说「每步都要验证」的意思。

## 8. public/style.css

```css
:root {
  --paper: #fafaf8;
  --ink: #14161a;
  --muted: #6b7280;
  --line: #e3e3df;
  --wire: #2b5fd9;
  --fail: #b42318;
  color-scheme: light dark;
}

@media (prefers-color-scheme: dark) {
  :root {
    --paper: #14161a;
    --ink: #e8e8e4;
    --muted: #9aa0a6;
    --line: #2a2d33;
    --wire: #7ea2f5;
    --fail: #f08a80;
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font: 16px/1.6 system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
}

.wrap {
  max-width: 46rem;
  margin: 0 auto;
  padding: 3rem 1.25rem 5rem;
}

.head h1 {
  margin: 0;
  font-size: 1.9rem;
  letter-spacing: -0.02em;
}

.sub {
  margin: 0.25rem 0 2rem;
  color: var(--muted);
  font-size: 0.9rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.row {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1 1 12rem;
  min-width: 0;
}

.field.grow {
  flex: 1 1 100%;
}

.label {
  font-size: 0.8rem;
  color: var(--muted);
}

input {
  padding: 0.5rem 0.65rem;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
}

input:focus-visible {
  outline: 2px solid var(--wire);
  outline-offset: 1px;
}

input[aria-invalid="true"] {
  border-color: var(--fail);
}

.err {
  min-height: 1em;
  font-size: 0.78rem;
  color: var(--fail);
}

.btn {
  padding: 0.5rem 1.1rem;
  border: 1px solid transparent;
  border-radius: 6px;
  background: var(--wire);
  color: #fff;
  font: inherit;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: progress;
}

.btn.ghost {
  background: transparent;
  color: var(--ink);
  border-color: var(--line);
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
}

.list {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.state {
  padding: 2.5rem 1rem;
  text-align: center;
  color: var(--muted);
  border: 1px dashed var(--line);
  border-radius: 10px;
}

.state.error {
  color: var(--fail);
  border-color: var(--fail);
  border-style: solid;
}

.item {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--line);
  border-radius: 8px;
}

.item-body {
  min-width: 0;
  flex: 1;
}

.item-title {
  font-weight: 600;
}

.item-url {
  display: block;
  font-size: 0.78rem;
  color: var(--wire);
  overflow-wrap: anywhere;
}

.item-note {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.link {
  color: var(--wire);
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.del {
  border: 0;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font: inherit;
  padding: 0.2rem 0.35rem;
  border-radius: 4px;
}

.del:hover {
  color: var(--fail);
}

.del:focus-visible {
  outline: 2px solid var(--wire);
  outline-offset: 1px;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 2rem;
  transform: translateX(-50%);
  padding: 0.6rem 1.1rem;
  border-radius: 8px;
  background: var(--ink);
  color: var(--paper);
  font-size: 0.9rem;
}
```

颜色不是随手挑的。`--wire` 蓝代表「发出去的东西」（链接、主按钮），`--fail` 红只用在出错的地方。两个颜色，够用了。加第三个的时候先问自己：它编码的是哪条真实含义。

## 跑起来

```bash
npm run dev
```

你应该看到：

```text
[practice-app] 已启动 → http://localhost:4000
[practice-app] 先试一下：curl -i http://localhost:4000/api/health
```

浏览器打开 `http://localhost:4000`，看到一个标题、三个输入框和一个「添加」按钮。

**这一个终端就够了。** 主线要开三个。

## 验证

### 后端活着吗

```bash
curl -i http://localhost:4000/api/health
```

::: request
```bash
curl -i http://localhost:4000/api/health
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{"ok":true,"service":"practice-app"}
```
:::

### 加一条

::: request
```bash
curl -X POST http://localhost:4000/api/bookmarks \
  -H "Content-Type: application/json" \
  -d '{"title":"Node 手册","url":"https://nodejs.org","note":"装完顺手看一眼"}'
```

```http
HTTP/1.1 201 Created

{"id":1,"title":"Node 手册","url":"https://nodejs.org","note":"装完顺手看一眼","createdAt":"2026-10-02T08:35:41.861Z"}
```
:::

刷新浏览器，这条出现在列表最上面。

### 校验拦得住吗

::: request
```bash
curl -X POST http://localhost:4000/api/bookmarks \
  -H "Content-Type: application/json" \
  -d '{"title":"   ","url":"不是网址"}'
```

```http
HTTP/1.1 400 Bad Request

{"error":{"code":"VALIDATION_FAILED","message":"输入不符合要求","fields":{"title":"标题不能为空","url":"地址要写成 http:// 或 https:// 开头"}}}
```
:::

`fields` 里的 key 和 `index.html` 里 `data-err` 的值一一对应，所以前端能直接把它贴到对应的输入框下面。

::: danger Windows 上用 `-d` 很容易失败
PowerShell 会把 `-d '{"title":"x"}'` 里的双引号吃掉，发过去的是 `{title:x}`，服务端看到的是坏 JSON。

**这正好验证了上面那个 `INVALID_JSON` 分支。** 想发合法 JSON，用文件：

```powershell
# 写成文件再发
curl -X POST http://localhost:4000/api/bookmarks -H "Content-Type: application/json" --data-binary "@body.json"
```

更省事的办法是直接在浏览器页面上填表单，它走的是浏览器的 fetch，不经过这个坑。
:::

### 四个状态都在

| 怎么看 | 怎么做 | 期望 |
| --- | --- | --- |
| 有数据 | 浏览器 + curl 加几条 | 列表出现 |
| 空 | 全部删掉 | 「还没有书签。上面加一条试试。」 |
| 出错 | 后端终端 `Ctrl+C`，然后点「重新加载」 | 「连不上后端…」+ 重试按钮 |
| 加载中 | 刷新页面那一瞬间 | 「加载中…」（很快，通常来不及看） |

::: tip 「加载中」抓不住是正常的
本地请求 1ms 就回来了。要看清它可以把后端响应调慢，或者在 `render()` 里临时加一行 `await new Promise(r => setTimeout(r, 2000))`。
:::

### 失败会弹回来

后端停掉，页面上点「删除」——条目会先消失，然后弹回来，同时底部弹一条红色提示。

**这一条是本项目最值得看的。** 界面「假装成功了」，发现不对再纠正回去。用户全程看到的是连贯的状态，而不是一个卡住的假象。

## 和主线项目差在哪

|  | 主线 | 这一节 |
| --- | --- | --- |
| 服务数量 | 2 个（5173 + 3001） | 1 个（4000） |
| 跨域 | 靠 Vite 代理绕开 | 根本不存在 |
| 依赖 | 一百多个 | 0 个 |
| 构建 | Vite 打包 | 无，原生 ES module |
| 框架 | React | 无 |
| 校验 | Zod，前后端共用 | 手写 |

**单进程和零依赖是有代价的**，说清楚比说好更重要：

- 前端一复杂（用到 JSX、npm 包），就必须开第二个服务 + 代理
- `server.mjs` 里静态文件托管和 API 路由混在一个文件，规模一大就难维护
- 手写校验没法自动在前后端共享，规则改起来要改两处 —— 这正是主线用 Zod 解决的问题

所以真实项目一般是主线的形态。**这一节的价值不在于推荐这种架构，而在于让你看清一层一层被框架藏起来的东西。**

## 改成你自己的应用

这个项目叫「书签」，但里面没有一处是书签特有的。换一个领域，改的是这几处：

| 换什么 | 改哪里 | 大概工作量 |
| --- | --- | --- |
| 数据字段 | `store.mjs` 的建表 SQL + `toBookmark` | 5 分钟 |
| 校验规则 | `validate.mjs` | 10 分钟 |
| 接口路径 | `server.mjs` 的 `/api/bookmarks` | 5 分钟 |
| 表单和列表 | `public/index.html` + `public/app.js` 的 `render()` | 20 分钟 |

**其余的代码一行都不用动** —— HTTP 处理、错误形状、乐观更新、AbortController、静态托管，这些跟「书签」还是「读书笔记」还是「记账」完全无关。

这就是「学会一个东西」和「学会一个例子」的区别。换一个领域试试，能动的只有上面这张表。

## 常见误区

::: details 「为什么这里不用装 Express」
不是不能用，是这一节想让你看清 Express 替你做了什么。`createServer` + `req.url` 判断 + `res.writeHead` 就是 Express 的内核，Express 在外面加的是路由匹配、参数解析、错误中间件。

先手写一遍再用框架，你才知道框架的哪个特性能省事、哪个是可选的。主线项目反过来用 Express，是为了让你专注在链路和状态上，而不是每次都在拼 HTTP 样板。
:::

::: details 「为什么删掉的条目会自己回来」
乐观更新。`remove()` 里第 ① 步存了 `backup`，失败时第 ④ 步把它恢复。

**没有 backup 就没有回滚。** 只要改了界面就得留备份，这是 [前端交互 › 乐观更新](/guide/ch03#_5-乐观更新-先改界面-失败再退回去) 那节的规矩。
:::

::: details 「数据存在哪，能删吗」
`data/app.db`。这是 SQLite 的数据库文件，同目录还有 `-wal` 和 `-shm` 两个文件，是 WAL 模式的正常工作文件，不是垃圾。

想彻底清空：

```bash
npm run db:reset
```

**这会删掉整个数据库**，不可恢复。删完再起一次后端，表会自动重建。
:::

::: details 「esc 那几个字符是不是多余的」
不是。删掉它，然后新建一条标题叫 `<img src=x onerror=alert(1)>` 的书签，你就知道为什么了。

用 `innerHTML` 拼字符串就必须转义。React 默认帮你做了这件事，所以用 React 时你不会注意到 —— 但它不是 React 特有的问题。
:::

## 隐性规则

- **`createServer` 的回调可以是 `async`**，但它返回的 Promise 没人接。里面 throw 的话错误会变成未处理的 rejection。所以这个文件里所有 `try/catch` 都是手写的，一个都不能省。
- **`res.writeHead` 之后不能再 `writeHead` 第二次。** 重复调用会抛 `ERR_HTTP_HEADERS_SENT`。这也是为什么错误处理要包住整个处理逻辑。
- **`204` 上不要挂 `Content-Type`。** 这个坑很隐蔽：写 `sendJson(res, 204, null)` 时 Node 会在协议层把 body 悄悄丢掉，本地测多少次都是「正常」的——响应里一个字都没有。但那 4 个字符的 `null` 是**被 Node 替你丢了**，不是本来就没发。中间隔一层反向代理或 WAF 就未必这么宽容。正确做法是 `sendNoContent()`：`writeHead(204)` 之后直接 `end()`，不传参数。
- **`for await` 遍历流只能遍历一次。** 读完 body 之后 `req` 就用完了，再读会拿到空。
- **`AbortError` 不是错误。** `load()` 里 `if (err.name === 'AbortError') return` 这行必须在前，否则主动取消会被当成「加载失败」，用户莫名其妙看到报错。
- **Node 的 `node:sqlite` 还在演进。** 22.5 引入，接口有过调整。别把这个 API 当稳定依赖用，上生产前查一下当前 Node 版本的文档。

## 跑完之后

你现在手上有两个能跑的全栈应用：一个带构建工具和框架（主线），一个什么都不带（这一节）。

差别不在「哪个更好」，在于你能说出**每一层下面是什么**。

接下来可以看看做这类项目时怎么定设计方向、怎么让改动不互相打架、什么时候值得上多 Agent 编排：

[工具怎么选 →](/toolkit/index)
