# fullstack-handbook

全栈入门教程。用一个任务清单应用，从空目录走到前后端跑通。

**教程地址**：https://rip-lip.github.io/fullstack-handbook/

代码在 **[fullstack-todo-app](https://github.com/RIP-LIP/fullstack-todo-app)**，本仓库只有文档。

## 本地预览

```bash
npm install
npm run dev        # http://localhost:5173
```

构建和检查：

```bash
npm run build         # 产物在 docs/.vitepress/dist
npm run preview
npm run verify        # = build + check:links
```

### 链接检查

VitePress 自带的死链检查**只管路径，不管锚点**。写 `[x](/a#不存在的节)` 构建照样通过，点过去才发现跳错。

`npm run check:links` 补这一块，读构建产物校验三件事：站内目标页面存在、`#锚点` 在目标页面上真有那个 id、静态资源文件存在。失效则退出码 1 并逐条打印。

**Pages 部署流水线已经接上这一步**，坏链接不会上线。改完内容本地跑一次：

```bash
npm run verify
```

## 目录结构

```
docs/
  index.md            首页
  guide/              主线篇（线性）
    intro.md            写在开头
    setup.md            环境配置
    basics.md           基础概念
    ch01.md             项目启动
    ch02.md             数据存储
    ch03.md             前端交互
  practice/           实践篇
    index.md            完整项目：一个书签应用（零依赖，8 个文件）
  toolkit/            工具篇
    index.md            总览：按处境查
    design.md           界面设计
    build.md            实现功能
    quality.md          保证它是对的
    parallel.md         拆开并行
  howto/              场景索引（按问题查）
    index.md
  reference/          速查
    cheatsheet.md
  .vitepress/
    config.mts        站点唯一配置源
    theme/
      custom.css      全部视觉改写只动这个文件
scripts/
  check-links.mjs     站内锚点 / 静态资源检查
```

## 写作规范

改内容前先读这几条：

- 标题说人话，读者扫一眼能决定要不要点开
- 开头第一句给具体事实，禁「众所周知」「随着……的发展」
- 每个方案主动讲缺点
- 命令要说明它会改动什么
- 排障只给顺序，不给零散技巧
- 时效性数据标具体日期，能删就删
- **禁止自我标榜句**（「我们只讲 X 不讲 Y」「这份教程解决什么」这类）
- **禁止把计划写进产物**——没有「待写」「待补」「接下来会写」这类字样。读者看到的是做好的东西，不是施工图。范围没覆盖到的地方就不提，别在页面上挂个占位
- **命令和响应必须是实跑的**。凭印象编的示例比没有更糟

`config.mts` 没有 `ignoreDeadLinks`，死链检查是严格模式。**新增页面后要同步改三处导航**（侧边栏、首页目录、顶栏），漏一处构建就会失败。

## 加一章

1. 建 `docs/guide/chNN.md`
2. 在 `config.mts` 的 `sidebar['/guide/']` 加一条
3. 在 `docs/index.md` 的主线表格加一行
4. 如果代码有变化，在 `fullstack-todo-app` 打对应 tag
5. 写完跑 `npm run build`，构建会检查死链

**三处导航必须同步**（侧边栏、首页目录、顶栏）。最常见的事故是侧边栏加了新页、首页忘了更新。

## 请求面板

章节里左右对照的「命令 / 响应」用法：

````markdown
::: request
```bash
curl -i http://localhost:3001/api/health
```

```http
HTTP/1.1 200 OK
Content-Type: application/json

{"ok":true,"service":"api"}
```
:::
````

第一个代码块渲染成左栏，第二个渲染成右栏。**右栏的内容必须是真跑出来的**，不要凭印象编。

## 许可

MIT
