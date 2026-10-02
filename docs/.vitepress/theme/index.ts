/**
 * 主题扩展层。
 *
 * 视觉定制全部走 CSS 变量，页面内容零改动。
 *
 * 这里额外做了一件事：把顶栏左侧那个图标从「站点 logo（点了回首页）」
 * 换成一个真正的「折叠 / 展开侧边栏」按钮。
 *
 * 为什么要换：默认的 logo 图标长得像三横线的菜单按钮，但点了却回首页，
 * 每次都要重新点两次才敢用。这里让图标和行为一致。
 */
import { h } from 'vue'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

/**
 * 顶栏左侧：侧边栏折叠按钮 + 站点名。
 *
 * 用 CSS 的 :target 或简单状态切换实现折叠。这里用一个极简方案：
 * 按钮切换 body 上的 class，由 custom.css 负责真正改变布局。
 */
const SidebarToggle = {
  name: 'SidebarToggle',
  setup() {
    function toggle() {
      // 必须挂在 .VPLayout 上，不是 body ——
      // --vp-sidebar-width 定义在 .VPLayout，body 上的同名变量会被它盖掉。
      const layout = document.querySelector('.VPLayout')
      if (layout) layout.classList.toggle('hp-sidebar-collapsed')
    }
    return () =>
      h('button', {
        class: 'hp-sidebar-toggle',
        title: '折叠 / 展开侧边栏',
        'aria-label': '折叠或展开侧边栏',
        onClick: toggle,
      }, [
        // 「侧栏面板」图标：方框 + 左侧竖线，和折叠动作对得上
        h('svg', {
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          'stroke-width': '1.8',
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'aria-hidden': 'true',
        }, [
          h('rect', { x: '3', y: '4', width: '18', height: '16', rx: '2' }),
          h('line', { x1: '9.5', y1: '4', x2: '9.5', y2: '20' }),
        ]),
      ])
  },
}

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('SidebarToggle', SidebarToggle)
  },
  Layout: () => h(DefaultTheme.Layout, null, {
    /*
     * 用 nav-bar-content-before，不是 nav-bar-title-before。
     *
     * 区别很关键：title-before 落在站点名那个 <a> 链接内部，
     * 按钮会被包在链接里，点了直接回首页 —— 正是要修的那个毛病。
     * content-before 在链接外面，才是独立的按钮。
     */
    'nav-bar-content-before': () => h(SidebarToggle),
  }),
} satisfies Theme
