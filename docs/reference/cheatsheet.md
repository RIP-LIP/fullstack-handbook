---
title: 命令速查表
---

# 命令速查表

按「你要做什么」分组。「是否改动数据」这一列是判断能不能直接复制执行的唯一依据。

## 日常

| 命令 | 作用 | 是否改动数据 |
| --- | --- | :-: |
| `npm install` | 装依赖 | 只改 `node_modules` |
| `npm run dev:api` | 起后端（3001），改代码自动重启 | 否 |
| `npm run dev:web` | 起前端（5173） | 否 |
| `npm run db:reset` | **删掉数据库文件**，下次启动 api 重建 | ⚠️ 删数据 |

```bash
# 全部在项目根目录执行
npm run dev:api     # 终端 1
npm run dev:web     # 终端 2
```

## 看接口

| 命令 | 作用 | 是否改动数据 |
| --- | --- | :-: |
| `curl -i <地址>` | 打印状态行、响应头和响应体 | 否 |
| `curl -X POST ... -d '<json>'` | 发一个 POST | ⚠️ 会新增数据 |
| `curl -X PATCH ... -d '<json>'` | 改一条 | ⚠️ 会改数据 |
| `curl -X DELETE <地址>` | 删一条 | ⚠️ **不可恢复** |

::: warning PowerShell 里写 JSON body
`curl.exe -d '{"title":"买牛奶"}'` 在 PowerShell 里会被吃掉引号，body 变成 `{title: 买牛奶}`，服务端会报「不是合法 JSON」。两个绕法：

```powershell
# 办法一：写进文件再发（推荐，教程里都用这个）
Set-Content -Path t.json -Value '{"title":"买牛奶"}' -Encoding UTF8 -NoNewline
curl.exe -X POST http://localhost:3001/api/tasks --data-binary "@t.json" -H "Content-Type: application/json"

# 办法二：用单引号裹住整个 -d 参数并转义内部引号
curl.exe -X POST http://localhost:3001/api/tasks -d '{\"title\":\"买牛奶\"}' -H "Content-Type: application/json"
```

Git Bash、WSL、macOS、Linux 的 curl 没有这个问题。
:::

## 排查端口

| 命令 | 作用 | 是否改动数据 |
| --- | --- | :-: |
| `netstat -ano \| findstr :5173` | Windows：看谁占了 5173 | 否 |
| `lsof -i :5173` | macOS / Linux 同上 | 否 |
| `curl -i http://localhost:3001/api/health` | 直连后端 | 否 |
| `curl -i http://localhost:5173/api/health` | 走代理 | 否 |

**这两条 curl 的结果对照着看**，能一次定位是后端、代理还是路由的问题。对照表见 [第1章 常见误区](/guide/ch01#_9-常见误区)。

## Git

| 命令 | 作用 | 是否改动数据 |
| --- | --- | :-: |
| `git status` | 看改了哪些文件 | 否 |
| `git diff` | 看具体改了什么 | 否 |
| `git checkout v0.1` | 回到第 1 章的代码状态 | 丢弃未提交改动 ⚠️ |
| `git switch -c <名字>` | 开新分支 | 否 |
| `git log --oneline` | 看提交历史 | 否 |

```bash
# 回到任意一章的起点
git checkout v0.1
npm install      # 依赖可能变过，装一次
```

## 错误码对照

| 状态码 | 含义 | 常见原因 |
| --- | --- | --- |
| `200` | 成功 | — |
| `201` | 创建成功 | POST 正常返回 |
| `204` | 成功，无响应体 | DELETE 正常返回 |
| `400` | 请求有问题 | 校验不过，或 JSON 格式错 |
| `404` | 找不到 | 路径写错、代理没配、id 不存在 |
| `500` | 服务端自己出错 | 看后端终端的输出 |

**`fetch` 抛异常**（不是状态码）：请求根本没发出去。后端没起、代理没配、地址打错。和 500 是两件事。

## 这份速查表没写的

- 数据库文件在哪：`apps/api/data/app.db`
- 想清空重来：`npm run db:reset`，然后重启后端

去 [主线第2章](/guide/ch02) 看数据到底存进哪了。
