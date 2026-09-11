import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'

// 项目页站点：base 由 GitHub Actions 注入仓库名；自定义域名或本地预览时默认为 '/'
const base = process.env.VITE_BASE ?? '/'

export default withMermaid(
  defineConfig({
    base,
    title: 'Spikive SLAM Pipeline',
    description: 'Spikive SLAM Pipeline 源码级交付文档',
    cleanUrls: true,
    lastUpdated: false,

    locales: {
      zh: { label: '中文', lang: 'zh-CN', link: '/zh/' },
      en: { label: 'English', lang: 'en-US', link: '/en/' }
    },

    themeConfig: {
      search: {
        provider: 'local'
      },
      locales: {
        zh: {
          label: '中文',
          selectText: '语言',
          nav: [
            { text: '首页', link: '/zh/' },
            { text: '系统总览', link: '/zh/appendix/system-overview' },
            { text: 'GitHub', link: 'https://github.com/QGDuan/Spikive-SLAM-Pipline' }
          ],
          sidebar: [
            {
              text: '开始使用',
              collapsed: false,
              items: [
                { text: '首页', link: '/zh/' },
                { text: '系统总览', link: '/zh/appendix/system-overview' }
              ]
            },
            {
              text: '模块文档',
              collapsed: false,
              items: [
                {
                  text: 'SLAM',
                  link: '/zh/slam/',
                  collapsed: true,
                  items: [
                    { text: '命令行使用', link: '/zh/slam/commandline' },
                    { text: 'Docker 编译', link: '/zh/slam/docker-build' },
                    { text: '源码架构', link: '/zh/slam/architecture' }
                  ]
                },
                {
                  text: 'PGOBA',
                  link: '/zh/pgoba/',
                  collapsed: true,
                  items: [
                    { text: '命令行使用', link: '/zh/pgoba/commandline' },
                    { text: 'Docker 编译', link: '/zh/pgoba/docker-build' },
                    { text: '源码架构', link: '/zh/pgoba/architecture' }
                  ]
                },
                {
                  text: 'PCL',
                  link: '/zh/pcl/',
                  collapsed: true,
                  items: [
                    { text: '命令行使用', link: '/zh/pcl/commandline' },
                    { text: 'Docker 编译', link: '/zh/pcl/docker-build' },
                    { text: '源码架构', link: '/zh/pcl/architecture' }
                  ]
                },
                {
                  text: 'preprocess',
                  link: '/zh/preprocess/',
                  collapsed: true,
                  items: [
                    { text: '命令行使用', link: '/zh/preprocess/commandline' },
                    { text: 'Docker 编译', link: '/zh/preprocess/docker-build' },
                    { text: '源码架构', link: '/zh/preprocess/architecture' }
                  ]
                },
                {
                  text: '配套驱动',
                  link: '/zh/driver-livox/',
                  collapsed: true,
                  items: [
                    { text: '命令行使用', link: '/zh/driver-livox/commandline' },
                    { text: 'Docker 编译', link: '/zh/driver-livox/docker-build' },
                    { text: '源码架构', link: '/zh/driver-livox/architecture' }
                  ]
                }
              ]
            },
            {
              text: '附录',
              collapsed: false,
              items: [
                { text: '待确认事项清单', link: '/zh/appendix/pending-items' },
                { text: '提示词版本', link: '/zh/appendix/prompt-version' }
              ]
            }
          ]
        },
        en: {
          label: 'English',
          selectText: 'Languages',
          nav: [
            { text: 'Home', link: '/en/' },
            { text: 'System overview', link: '/en/appendix/system-overview' },
            { text: 'GitHub', link: 'https://github.com/QGDuan/Spikive-SLAM-Pipline' }
          ],
          sidebar: [
            {
              text: 'Getting started',
              collapsed: false,
              items: [
                { text: 'Home', link: '/en/' },
                { text: 'System overview', link: '/en/appendix/system-overview' }
              ]
            },
            {
              text: 'Modules',
              collapsed: false,
              items: [
                {
                  text: 'SLAM',
                  link: '/en/slam/',
                  collapsed: true,
                  items: [
                    { text: 'Command line', link: '/en/slam/commandline' },
                    { text: 'Docker build', link: '/en/slam/docker-build' },
                    { text: 'Architecture', link: '/en/slam/architecture' }
                  ]
                },
                {
                  text: 'PGOBA',
                  link: '/en/pgoba/',
                  collapsed: true,
                  items: [
                    { text: 'Command line', link: '/en/pgoba/commandline' },
                    { text: 'Docker build', link: '/en/pgoba/docker-build' },
                    { text: 'Architecture', link: '/en/pgoba/architecture' }
                  ]
                },
                {
                  text: 'PCL',
                  link: '/en/pcl/',
                  collapsed: true,
                  items: [
                    { text: 'Command line', link: '/en/pcl/commandline' },
                    { text: 'Docker build', link: '/en/pcl/docker-build' },
                    { text: 'Architecture', link: '/en/pcl/architecture' }
                  ]
                },
                {
                  text: 'preprocess',
                  link: '/en/preprocess/',
                  collapsed: true,
                  items: [
                    { text: 'Command line', link: '/en/preprocess/commandline' },
                    { text: 'Docker build', link: '/en/preprocess/docker-build' },
                    { text: 'Architecture', link: '/en/preprocess/architecture' }
                  ]
                },
                {
                  text: 'Bundled driver',
                  link: '/en/driver-livox/',
                  collapsed: true,
                  items: [
                    { text: 'Command line', link: '/en/driver-livox/commandline' },
                    { text: 'Docker build', link: '/en/driver-livox/docker-build' },
                    { text: 'Architecture', link: '/en/driver-livox/architecture' }
                  ]
                }
              ]
            },
            {
              text: 'Appendix',
              collapsed: false,
              items: [
                { text: 'Pending items', link: '/en/appendix/pending-items' },
                { text: 'Prompt version', link: '/en/appendix/prompt-version' }
              ]
            }
          ]
        }
      }
    }
  }),
  { theme: { light: 'default', dark: 'default' } }
)
