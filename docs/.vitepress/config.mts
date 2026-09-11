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
            { text: 'SLAM', link: '/zh/slam/' },
            { text: 'PGOBA', link: '/zh/pgoba/' },
            { text: 'PCL', link: '/zh/pcl/' },
            { text: 'preprocess', link: '/zh/preprocess/' },
            { text: '配套驱动', link: '/zh/driver-livox/' },
            { text: '附录', link: '/zh/appendix/system-overview' }
          ],
          sidebar: {
            '/zh/slam/': [
              {
                text: 'SLAM',
                items: [
                  { text: '模块索引', link: '/zh/slam/' },
                  { text: '命令行使用', link: '/zh/slam/commandline' },
                  { text: 'Docker 编译', link: '/zh/slam/docker-build' },
                  { text: '源码架构', link: '/zh/slam/architecture' }
                ]
              }
            ],
            '/zh/preprocess/': [
              {
                text: 'preprocess',
                items: [
                  { text: '模块索引', link: '/zh/preprocess/' },
                  { text: '命令行使用', link: '/zh/preprocess/commandline' },
                  { text: 'Docker 编译', link: '/zh/preprocess/docker-build' },
                  { text: '源码架构', link: '/zh/preprocess/architecture' }
                ]
              }
            ],
            '/zh/pgoba/': [
              {
                text: 'PGOBA',
                items: [
                  { text: '模块索引', link: '/zh/pgoba/' },
                  { text: '命令行使用', link: '/zh/pgoba/commandline' },
                  { text: 'Docker 编译', link: '/zh/pgoba/docker-build' },
                  { text: '源码架构', link: '/zh/pgoba/architecture' }
                ]
              }
            ],
            '/zh/pcl/': [
              {
                text: 'PCL',
                items: [
                  { text: '模块索引', link: '/zh/pcl/' },
                  { text: '命令行使用', link: '/zh/pcl/commandline' },
                  { text: 'Docker 编译', link: '/zh/pcl/docker-build' },
                  { text: '源码架构', link: '/zh/pcl/architecture' }
                ]
              }
            ],
            '/zh/driver-livox/': [
              {
                text: '配套驱动',
                items: [
                  { text: '模块索引', link: '/zh/driver-livox/' },
                  { text: '命令行使用', link: '/zh/driver-livox/commandline' },
                  { text: 'Docker 编译', link: '/zh/driver-livox/docker-build' },
                  { text: '源码架构', link: '/zh/driver-livox/architecture' }
                ]
              }
            ],
            '/zh/appendix/': [
              {
                text: '附录',
                items: [
                  { text: '系统总览', link: '/zh/appendix/system-overview' },
                  { text: '待确认事项清单', link: '/zh/appendix/pending-items' },
                  { text: '提示词版本', link: '/zh/appendix/prompt-version' }
                ]
              }
            ]
          }
        },
        en: {
          label: 'English',
          selectText: 'Languages',
          nav: [
            { text: 'Home', link: '/en/' },
            { text: 'SLAM', link: '/en/slam/' },
            { text: 'PGOBA', link: '/en/pgoba/' },
            { text: 'PCL', link: '/en/pcl/' },
            { text: 'preprocess', link: '/en/preprocess/' },
            { text: 'Driver', link: '/en/driver-livox/' },
            { text: 'Appendix', link: '/en/appendix/system-overview' }
          ],
          sidebar: {
            '/en/slam/': [
              {
                text: 'SLAM',
                items: [
                  { text: 'Module index', link: '/en/slam/' },
                  { text: 'Command line', link: '/en/slam/commandline' },
                  { text: 'Docker build', link: '/en/slam/docker-build' },
                  { text: 'Architecture', link: '/en/slam/architecture' }
                ]
              }
            ],
            '/en/preprocess/': [
              {
                text: 'preprocess',
                items: [
                  { text: 'Module index', link: '/en/preprocess/' },
                  { text: 'Command line', link: '/en/preprocess/commandline' },
                  { text: 'Docker build', link: '/en/preprocess/docker-build' },
                  { text: 'Architecture', link: '/en/preprocess/architecture' }
                ]
              }
            ],
            '/en/pgoba/': [
              {
                text: 'PGOBA',
                items: [
                  { text: 'Module index', link: '/en/pgoba/' },
                  { text: 'Command line', link: '/en/pgoba/commandline' },
                  { text: 'Docker build', link: '/en/pgoba/docker-build' },
                  { text: 'Architecture', link: '/en/pgoba/architecture' }
                ]
              }
            ],
            '/en/pcl/': [
              {
                text: 'PCL',
                items: [
                  { text: 'Module index', link: '/en/pcl/' },
                  { text: 'Command line', link: '/en/pcl/commandline' },
                  { text: 'Docker build', link: '/en/pcl/docker-build' },
                  { text: 'Architecture', link: '/en/pcl/architecture' }
                ]
              }
            ],
            '/en/driver-livox/': [
              {
                text: 'Driver',
                items: [
                  { text: 'Module index', link: '/en/driver-livox/' },
                  { text: 'Command line', link: '/en/driver-livox/commandline' },
                  { text: 'Docker build', link: '/en/driver-livox/docker-build' },
                  { text: 'Architecture', link: '/en/driver-livox/architecture' }
                ]
              }
            ],
            '/en/appendix/': [
              {
                text: 'Appendix',
                items: [
                  { text: 'System overview', link: '/en/appendix/system-overview' },
                  { text: 'Pending items', link: '/en/appendix/pending-items' },
                  { text: 'Prompt version', link: '/en/appendix/prompt-version' }
                ]
              }
            ]
          }
        }
      }
    }
  }),
  { theme: { light: 'default', dark: 'default' } }
)
