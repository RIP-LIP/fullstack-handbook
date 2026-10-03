# fullstack-handbook

全栈教程。两条轴：主线用任务清单从空目录走到前后端跑通，「后端往下走」用订单/库存讲外键、迁移、事务、并发、幂等。

**教程地址**：https://rip-lip.github.io/fullstack-handbook/

本仓库只有文档，代码在两个仓：

| 仓 | 对应 |
| --- | --- |
| **[fullstack-todo-app](https://github.com/RIP-LIP/fullstack-todo-app)** | 主线三章，端口 3001 |
| **[fullstack-backend](https://github.com/RIP-LIP/fullstack-backend)** | 后端往下走 ch04–ch09，端口 3002，PostgreSQL |

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
    deep/               后端往下走（第二条轴，配 fullstack-backend）
      index.md            这一组讲什么
      ch04.md             数据模型
      ch05.md             迁移
      ch06.md             零停机变更
      ch07.md             事务
      ch08.md             换 PostgreSQL
      ch09.md             幂等
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

## 许可

MIT
