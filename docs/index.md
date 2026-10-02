---
layout: home

hero:
  name: 全栈手记
  text: 从空目录到一个能跑的应用
  tagline: 用任务清单做主线，每章推进一个功能，每个示例都实跑核对过。
  actions:
    - theme: brand
      text: 从环境配置开始
      link: /guide/setup
    - theme: alt
      text: 直接看一个完整项目
      link: /practice/index

features:
  - title: 环境配置
    details: 装 Node、认识终端、跑通一次安装。环境没配好，后面每个报错都看不懂。
    link: /guide/setup
    linkText: 环境配置
  - title: 基础概念
    details: 代码跑在哪台机器、端口是什么、状态码怎么读、JSON 写错长什么样。
    link: /guide/basics
    linkText: 先看这四件事
  - title: 项目启动
    details: 两个服务同时起，一次请求穿过代理。404 和 500 分别该看哪。
    link: /guide/ch01
    linkText: 看这一篇
  - title: 数据存储
    details: 数据落进 SQLite，同一份校验规则前后端共用。
    link: /guide/ch02
    linkText: 看这一篇
  - title: 前端交互
    details: 加载中、出错、空数据都有界面；乐观更新失败怎么回滚。
    link: /guide/ch03
    linkText: 看这一篇
  - title: 工具怎么选
    details: 十几个 skill 分五类。什么时候该叫哪个，为什么按这个顺序读。
    link: /toolkit/index
    linkText: 打开
---

## 从哪开始

| 你的情况 | 从这里进 |
| --- | --- |
| 没配过 Node，没用过终端 | [环境配置](/guide/setup) |
| 环境好了，但没搞懂前后端为什么分开 | [基础概念](/guide/basics) |
| 环境好了，直接想跑起来 | [项目启动](/guide/ch01) |
| 写过前端，没碰过后端 | [数据存储](/guide/ch02) |
| 主线走完了，想换个项目练手 | [完整项目](/practice/index) |
| 想让 AI 帮自己写代码，先知道该叫哪个 | [工具怎么选](/toolkit/index) |

## 主线

| 章节 | 做完之后 |
| --- | --- |
| [环境配置](/guide/setup) | Node 装好，依赖装完，一个后端服务跑起来 |
| [基础概念](/guide/basics) | 能解释端口、状态码、JSON，以及代码跑在哪 |
| [项目启动](/guide/ch01) | 两个服务同时跑，一次请求穿过代理 |
| [数据存储](/guide/ch02) | 数据落库，一份校验规则两端共用 |
| [前端交互](/guide/ch03) | 四种状态都有界面，乐观更新失败能回滚 |

**任务清单不是重点。** 每章最后都有一节「哪些是通用的」，明确切分哪些代码要重写、哪些可以直接搬走；另有一节「做到这一步实际用的是什么」，把它和真实的工程 skill 对上。

## 主线之外

| 内容 | 是什么 |
| --- | --- |
| [完整项目](/practice/index) | 零依赖的单进程书签应用，8 个文件，复制粘贴就能跑。用来验证你真的懂了 |
| [工具怎么选](/toolkit/index) | 十几个 skill 分五类：界面设计、实现功能、质量、并行。什么时候叫哪个 |
| [界面设计](/toolkit/design) | 三个 skill 的分工：定方向、出稿、落代码 |
| [实现功能](/toolkit/build) | 通才型 skill 和主流程型 skill 该怎么选，七步流程在做什么 |
| [保证它是对的](/toolkit/quality) | TDD、排障四阶段、验证门禁、两条轴审查 |
| [命令速查表](/reference/cheatsheet) | 按「你要做什么」分组，每条标明会不会改动数据 |
| [场景索引](/howto/index) | 按你遇到的具体麻烦查 |
## 代码

主线代码在 **[fullstack-todo-app](https://github.com/RIP-LIP/fullstack-todo-app)**，每章一个 git tag，可以 checkout 到任意一章的起点。

[完整项目](/practice/index)那 8 个文件在页面里整段给出，不用 clone。
