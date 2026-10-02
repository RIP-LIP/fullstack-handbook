import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'

/**
 * 站点唯一配置源。页面 .md 里不写任何布局信息。
 */
export default defineConfig({
  title: '全栈手记',
  description: '从空目录到一个能跑的应用。每章都能跑，每步都能验证，每个示例都实跑核对过。',

  // GitHub Pages 项目页：仓库名就是 base
  base: '/fullstack-handbook/',

  // 保留 .html 后缀，GitHub Pages 上最省事
  cleanUrls: false,

  lastUpdated: true,
  appearance: true,

  head: [['link', { rel: 'icon', href: '/logo.svg' }]],

  markdown: {
    config(md) {
      // 「请求面板」：左右两栏对照，左边是读者要敲的命令，右边是真实跑出来的响应。
      //
      // 写法：::: request 里放两个代码块，第一个是命令，第二个是响应。
      // 容器只负责铺两栏网格，栏标题和竖线颜色交给 CSS ——
      // 竖线的颜色就是这份响应的真实语义色。
      md.use(container, 'request', {
        render(tokens, idx) {
          const token = tokens[idx]
          return token.nesting === 1
            ? '<div class="request-panel">\n'
            : '</div>\n'
        },
      })
    },
  },

  themeConfig: {
    // 顶栏左侧不放 logo：那里是侧边栏折叠按钮（见 theme/index.ts）。
    // 站点名由首页 Hero 承担。
    siteTitle: false,
    logo: undefined,

    // 顶栏项数有上限：.VPNavBarMenu 是 flex 且不换行，768px 以下才折叠成汉堡。
    // 算下来 7 项在最窄的桌面宽度会溢出，所以「速查」只放侧边栏和页脚。
    nav: [
      { text: '准备', link: '/guide/setup', activeMatch: '^/guide/(setup|basics|intro)' },
      { text: '主线', link: '/guide/ch01', activeMatch: '^/guide/(ch|deep)' },
      { text: '动手做', link: '/practice/index' },
      { text: '工具', link: '/toolkit/index', activeMatch: '^/toolkit/' },
      { text: '遇到问题', link: '/howto/index', activeMatch: '^/howto/' },
      { text: 'GitHub', link: 'https://github.com/RIP-LIP/fullstack-handbook' },
    ],

    outline: { level: [2, 3], label: '本页目录' },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
          modal: {
            displayDetails: '显示详细列表',
            resetButtonTitle: '清除查询条件',
            backButtonTitle: '关闭搜索',
            noResultsText: '没有找到相关内容',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },

    sidebar: {
      '/guide/': [
        {
          text: '全栈手记',
          items: [
            { text: '写在开头', link: '/guide/intro' },
            { text: '环境配置', link: '/guide/setup' },
            { text: '基础概念', link: '/guide/basics' },
            { text: '项目启动', link: '/guide/ch01' },
            { text: '数据存储', link: '/guide/ch02' },
            { text: '前端交互', link: '/guide/ch03' },
          ],
        },
        {
          // 另一条轴：用订单/库存讲表之间的约束、迁移和并发。
          // 独立分组是为了不和主线混在一起——两者的前置条件不一样。
          text: '后端往下走',
          items: [
            { text: '这一组讲什么', link: '/guide/deep/index' },
            { text: '数据模型', link: '/guide/deep/ch04' },
            { text: '迁移', link: '/guide/deep/ch05' },
            { text: '零停机变更', link: '/guide/deep/ch06' },
            { text: '事务', link: '/guide/deep/ch07' },
            { text: '换 PostgreSQL', link: '/guide/deep/ch08' },
            { text: '幂等', link: '/guide/deep/ch09' },
          ],
        },
      ],
      '/practice/': [
        {
          text: '动手做',
          items: [
            { text: '完整项目', link: '/practice/index' },
            { text: '建文件', link: '/practice/code' },
            { text: '跑起来并验证', link: '/practice/verify' },
            { text: '改成你自己的应用', link: '/practice/extend' },
          ],
        },
      ],
      '/toolkit/': [
        {
          text: '工具怎么选',
          items: [
            { text: '总览', link: '/toolkit/index' },
            { text: '界面设计', link: '/toolkit/design' },
            { text: '实现功能', link: '/toolkit/build' },
            { text: '保证它是对的', link: '/toolkit/quality' },
            { text: '拆开并行', link: '/toolkit/parallel' },
          ],
        },
      ],
      '/howto/': [
        {
          text: '遇到问题',
          items: [{ text: '场景索引', link: '/howto/index' }],
        },
      ],
      '/reference/': [
        {
          text: '速查',
          items: [{ text: '命令速查表', link: '/reference/cheatsheet' }],
        },
      ],
    },

    socialLinks: [{ icon: 'github', link: 'https://github.com/RIP-LIP/fullstack-handbook' }],

    editLink: {
      pattern: 'https://github.com/RIP-LIP/fullstack-handbook/edit/main/docs/:path',
      text: '在 GitHub 上修改此页',
    },

    docFooter: { prev: '上一页', next: '下一页' },
    lastUpdatedText: '最后更新',

    footer: {
      message: '代码在 github.com/RIP-LIP/fullstack-todo-app（主线）与 fullstack-backend（后端往下走）',
      copyright: 'MIT',
    },
  },
})
