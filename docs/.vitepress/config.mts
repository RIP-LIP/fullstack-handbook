import { defineConfig } from 'vitepress'
import container from 'markdown-it-container'

/**
 * 站点唯一配置源。页面 .md 里不写任何布局信息。
 */
export default defineConfig({
  title: '全栈手记',
  description: '用一个任务清单应用，从空目录走到前后端跑通。每章都能跑，每步都能验证。',

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

    nav: [
      { text: '准备', link: '/guide/setup', activeMatch: '^/guide/(setup|basics|intro)' },
      { text: '主线', link: '/guide/ch01', activeMatch: '^/guide/ch' },
      { text: '遇到问题', link: '/howto/index', activeMatch: '^/howto/' },
      { text: '命令速查', link: '/reference/cheatsheet', activeMatch: '^/reference/' },
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
            {
              text: '🧰 准备',
              collapsed: false,
              items: [
                { text: '第0章 先把环境配好', link: '/guide/setup' },
                { text: '第0章续 动手前先知道这四件事', link: '/guide/basics' },
              ],
            },
            {
              text: '🟦 主线',
              collapsed: false,
              items: [
                { text: '第1章 跑起来，看懂一次请求', link: '/guide/ch01' },
                { text: '第2章 数据要留下来', link: '/guide/ch02' },
                { text: '第3章 界面和数据不能各说各话', link: '/guide/ch03' },
              ],
            },
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
      message: '代码在 github.com/RIP-LIP/fullstack-todo-app',
      copyright: 'MIT',
    },
  },
})
