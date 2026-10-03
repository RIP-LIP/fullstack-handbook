---
title: 跑起来并验证
---

# 跑起来并验证

> 目标：起服务，然后用「你应该看到什么」逐条确认，而不是看到「没报错」就放心。

先把 [八个文件](/practice/code) 建完。

## 验证

### 后端活着吗

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

---

**下一步**：[改成你自己的应用 →](/practice/extend)
