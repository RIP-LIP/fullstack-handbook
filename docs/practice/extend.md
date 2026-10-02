---
title: 改成你自己的应用
---

# 改成你自己的应用

> 这个项目叫「书签」，但里面没有一处是书签特有的。

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

---

**回到开头**：[完整项目](/practice/index)
