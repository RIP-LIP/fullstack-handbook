# fullstack-handbook

全栈入门教程。用一个任务清单应用，从空目录走到前后端跑通。

**教程地址**：https://rip-lip.github.io/fullstack-handbook/

代码在 **[fullstack-todo-app](https://github.com/RIP-LIP/fullstack-todo-app)**，本仓库只有文档。

## 本地预览

```bash
npm install
npm run dev        # http://localhost:5173
```

构建：

```bash
npm run build      # 产物在 docs/.vitepress/dist
npm run preview
```

## 目录结构

```
docs/
  index.md            首页
  guide/              主线篇（线性）
    intro.md            写在开头
    ch01.md             第1章 跑起来，看懂一次请求
    ch02.md             第2章 数据要留下来
    ch03.md             第3章 界面和数据不能各说各话
  howto/              场景篇（按问题查）
    index.md
  reference/          速查
    cheatsheet.md
  .vitepress/
    config.mts        站点唯一配置源
    theme/
      custom.css      全部视觉改写只动这个文件
```

## 写作规范

站内**只有一个例外**：`config.mts` 里的 `ignoreDeadLinks` 暂时放行了 `/guide/ch02` 和 `/guide/ch03`——这两章已在前文和首页引用，但正文要等风格确认后才写。写完请删掉那两行。

其余硬性要求（改内容前先读）：

- 标题说人话，读者扫一眼能决定要不要点开
- 开头第一句给具体事实，禁「众所周知」「随着……的发展」
- 每个方案主动讲缺点
- 命令要说明它会改动什么
- 排障只给顺序，不给零散技巧
- 时效性数据标具体日期，能删就删
- **禁止自我标榜句**（「我们只讲 X 不讲 Y」这类）

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
