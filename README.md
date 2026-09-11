# Spikive SLAM Pipeline 文档站点

本目录是基于 [VitePress](https://vitepress.dev/) 的文档站点源码，也是 GitHub 仓库根目录。Markdown 文件是唯一内容来源（底层文件），网站由 GitHub Actions 构建并以 GitHub Pages 地址发布。

| 项 | 值 |
|---|---|
| 框架 | VitePress 1.x（Vue 3 官方文档框架，静态站点生成） |
| 内容源 | `docs/zh/`（中文，canonical）与 `docs/en/`（英文，镜像翻译） |
| 图表 | mermaid（`vitepress-plugin-mermaid`，客户端渲染） |
| 搜索 | VitePress 内置本地搜索 |
| 构建 | `npm run docs:build` → `docs/.vitepress/dist/` |
| 部署 | GitHub Actions（`.github/workflows/deploy-docs.yml`）→ GitHub Pages |

## 1. 目录结构

```text
.
├── README.md                    # 本文件（维护说明）
├── package.json                 # 依赖与脚本
├── .github/workflows/deploy-docs.yml   # GitHub Actions 构建部署
├── docs/
│   ├── index.md                 # 语言选择落地页（/ → 中文 / 英文入口）
│   ├── .vitepress/
│   │   ├── config.mts           # 站点配置：locale、导航、侧边栏、搜索、base
│   │   └── theme/
│   │       ├── index.ts         # 主题入口（默认主题 + 少量样式）
│   │       └── custom.css       # 极简样式调整
│   ├── zh/                      # 中文内容（底层文件，长期维护）
│   │   ├── index.md             # 总索引（首页）
│   │   ├── slam/                # SLAM 模块（index + commandline + docker-build + architecture）
│   │   ├── preprocess/          # preprocess 模块
│   │   ├── pgoba/               # PGOBA 模块
│   │   ├── pcl/                 # PCL 模块
│   │   ├── driver-livox/        # 配套驱动模块
│   │   └── appendix/            # system-overview / pending-items / prompt-version
│   └── en/                      # 英文内容（与 zh/ 镜像结构）
```

## 2. 本地预览

```bash
npm install            # 安装依赖（首次）
npm run docs:dev       # 本地开发服务器（http://localhost:5173）
npm run docs:build     # 构建静态站点（docs/.vitepress/dist/）
npm run docs:preview   # 本地预览构建产物
```

要求：Node.js 18 及以上（GitHub Actions 使用 Node 20）。

## 3. 发布到 GitHub

1. 把本目录初始化为 Git 仓库并推送到 GitHub：

```bash
git init
git add .
git commit -m "docs: Spikive SLAM Pipeline 文档站点"
git branch -M main
git remote add origin git@github.com:<组织或用户名>/<仓库名>.git
git push -u origin main
```

2. 在仓库设置中启用 Pages：Settings → Pages → Source 选择 **GitHub Actions**（工作流 `deploy-docs.yml` 使用 `actions/deploy-pages`，无需选择分支）。
3. 推送后 Actions 自动构建并部署，地址为：

```text
https://<组织或用户名>.github.io/<仓库名>/
```

4. 站点 `base` 自动取仓库名（工作流注入 `VITE_BASE=/${{ github.event.repository.name }}/`）。使用自定义域名时，在仓库设置配置域名，并把工作流中 `VITE_BASE` 改为 `/`。
5. 首次构建失败时，检查仓库 Settings → Actions → General → Workflow permissions（工作流自身已声明所需权限），以及 Pages 是否已设为 GitHub Actions 来源。

## 4. 内容维护约定

1. **中文为底层文件**：内容修改先改 `docs/zh/`，再把相同改动镜像到 `docs/en/`。两者必须保持文件一一对应。
2. **每个模块固定四个文件**：`index.md`（模块索引，采用 VitePress 目录索引约定，对应此前的模块 README）、`commandline.md`（命令行使用）、`docker-build.md`（Docker 编译）、`architecture.md`（源码架构）。
3. **新增模块**：
   - 在 `docs/zh/` 与 `docs/en/` 下各建一个模块目录，放入四个文件；
   - 在 `docs/.vitepress/config.mts` 的 `themeConfig.locales.<lang>.nav` 与 `sidebar` 中各加一条记录；
   - 在 `docs/zh/index.md` 与 `docs/en/index.md` 的模块导航表各加一行。
4. **文件头格式**：每个内容文件头部保留"模块名 / 适用版本 / 最后更新"表格。
5. **路径引用**：正文中的路径使用仓库内相对路径（如 `docs/zh/appendix/pending-items.md`）；跨语言版本内使用各自语言的路径。
6. **待确认事项**：统一写入 `docs/zh/appendix/pending-items.md` 与 `docs/en/appendix/pending-items.md`，正文标注 `[待确认]`。
7. **依赖升级**：`package.json` 中 `vitepress` 与 `vitepress-plugin-mermaid` 版本锁定后，先本地 `npm run docs:build` 验证再推送。

## 5. SKU 清单（入库管理）

交付物已按 SKU 编码体系登记，用于后续入库/盘点管理：

- 编码规则：`SPK-{域}-{模块}-{页型}-{语言}-{序号}`；
- 权威源：`sku/manifest.json`（57 条目，机器可读）；
- 导入件：`sku/manifest.csv`（UTF-8 BOM，Excel/系统导入）；
- 人读版：`sku/manifest.md`（编码规则、全量清单、入库/变更/盘点流程）。

新增或变更任何文件时，按 `sku/manifest.md` 第 3 节流程同步更新三份清单。

## 6. 技术选型记录

| 项 | 选择 | 依据 |
|---|---|---|
| 静态站点框架 | VitePress 1.x | Vue 3 官方文档框架；Markdown 直接作为内容源；内置 i18n 与本地搜索；构建产物为纯静态文件 |
| 图表 | mermaid + vitepress-plugin-mermaid | 沿用 Markdown 中的 mermaid 代码块，客户端渲染 |
| 部署 | GitHub Actions + `actions/deploy-pages` | 官方组合，构建与发布均在 GitHub 服务器完成 |
| 样式 | 默认主题 + `custom.css` 微调 | 保持极简；不引入 UI 组件库 |

底层内容为 Markdown，与框架解耦；迁移到其它静态站点框架（Docusaurus、MkDocs、Hugo 等）时，`docs/zh/` 与 `docs/en/` 的内容文件可直接复用。
