---
title: 完整项目
---

# 完整项目：一个书签应用

> 目标：从空目录做出一个能跑的全栈应用。零依赖，一个进程，复制粘贴即可。约 40 分钟。

主线的代码在 [fullstack-todo-app](https://github.com/RIP-LIP/fullstack-todo-app)，需要 `git checkout` 和 `npm install`。这一节的东西**全在下面，复制粘贴就行**。

## 四页怎么走

| 页面 | 内容 |
| --- | --- |
| [建文件](/practice/code) | 八个文件的完整内容，逐个复制 |
| [跑起来并验证](/practice/verify) | 起服务、四种状态怎么确认、失败会不会弹回 |
| [改成你自己的应用](/practice/extend) | 换成别的领域要改什么、常见误区、隐性规则 |

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

## 跑完之后

你现在手上有两个能跑的全栈应用：一个带构建工具和框架（主线），一个什么都不带（这一节）。

差别不在「哪个更好」，在于你能说出**每一层下面是什么**。

接下来可以看看做这类项目时怎么定设计方向、怎么让改动不互相打架、什么时候值得上多 Agent 编排：

[工具怎么选 →](/toolkit/index)

**下一步**：把八个文件建出来 → [建文件](/practice/code)
