---
layout: home

hero:
  name: 全栈手记
  text: 从空目录到一个能跑的应用
  tagline: 用任务清单做主线，每章推进一个功能。
  actions:
    - theme: brand
      text: 从环境配置开始
      link: /guide/setup
    - theme: alt
      text: 跳过环境，直接看主线
      link: /guide/ch01

features:
  - title: 第0章 先把环境配好
    details: 装 Node、认识终端、跑通一次安装。环境没配好，后面每个报错都看不懂。
    link: /guide/setup
    linkText: 环境配置
  - title: 第0章续 动手前先知道这四件事
    details: 代码跑在哪台机器、端口是什么、状态码怎么读、JSON 写错长什么样。
    link: /guide/basics
    linkText: 先看这四件事
  - title: 第1章 跑起来，看懂一次请求
    details: 两个服务同时起，一次请求穿过代理。404 和 500 分别该看哪。
    link: /guide/ch01
    linkText: 看第 1 章
  - title: 第2章 数据要留下来
    details: 数据落进 SQLite，同一份校验规则前后端共用。
    link: /guide/ch02
    linkText: 看第 2 章
  - title: 第3章 界面和数据不能各说各话
    details: 加载中、出错、空数据都有界面；乐观更新失败怎么回滚。
    link: /guide/ch03
    linkText: 看第 3 章
  - title: 命令速查表
    details: 按「你要做什么」分组，每条标明会不会改动数据。
    link: /reference/cheatsheet
    linkText: 打开速查表
---

## 从哪开始

| 你的情况 | 从这里进 |
| --- | --- |
| 没配过 Node，没用过终端 | [第0章 先把环境配好](/guide/setup) |
| 环境好了，但没搞懂前后端为什么分开 | [第0章续 这四件事](/guide/basics) |
| 环境好了，直接想跑起来 | [第1章](/guide/ch01) |
| 写过前端，没碰过后端 | [第2章 数据要留下来](/guide/ch02) |

## 全部章节

| 章节 | 做完之后 | 状态 |
| --- | --- | :-: |
| [第0章 先把环境配好](/guide/setup) | Node 装好，依赖装完，一个后端服务跑起来 | ✅ |
| [第0章续 这四件事](/guide/basics) | 能解释端口、状态码、JSON，以及代码跑在哪 | ✅ |
| [第1章 跑起来，看懂一次请求](/guide/ch01) | 两个服务同时跑，一次请求穿过代理 | ✅ |
| [第2章 数据要留下来](/guide/ch02) | 数据落库，一份校验规则两端共用 | ✅ |
| [第3章 界面和数据不能各说各话](/guide/ch03) | 四种状态都有界面，乐观更新失败能回滚 | ✅ |
| [命令速查表](/reference/cheatsheet) | 常用的命令按用途分组 | ✅ |
| [场景索引](/howto/index) | 按你遇到的具体麻烦查 | 🚧 |

第 4 章之后的内容还没写，章节划分在 [场景索引](/howto/index) 里，标了「待补」的不要照着做。

## 代码

教程里所有代码在 **[fullstack-todo-app](https://github.com/RIP-LIP/fullstack-todo-app)**，每章一个 git tag，可以 checkout 到任意一章的起点。
