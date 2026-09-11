# SKU 清单（入库管理）

| 项 | 值 |
|---|---|
| 清单名 | Spikive SLAM Pipeline 交付物 SKU 清单 |
| 清单版本 | 1.0.0 |
| 生成日期 | 2026-09-11 |
| 权威源 | `sku/manifest.json`（机器可读） |
| 衍生件 | `sku/manifest.csv`（Excel/系统导入）、`sku/manifest.md`（本文件，人读版） |
| 条目数 | 57 |

## 1. 编码规则

```text
SPK-{域}-{模块}-{页型}-{语言}-{序号}
```

| 段 | 取值 | 含义 |
|---|---|---|
| 域 | `ROOT` / `CFG` / `DOC` | 仓库根文件 / 站点配置 / 文档页 |
| 模块 | 见下表 | 所属模块或资产类别 |
| 页型 | 见下表 | 页面/资产类型 |
| 语言 | `ZH` / `EN` / `NA` | 中文 / 英文 / 不适用 |
| 序号 | 3 位流水号 | 同类型内递增（001 起） |

模块段取值：

| 代码 | 含义 |
|---|---|
| `RDM` | 仓库说明 |
| `PKG` | 包配置 |
| `GIT` | 忽略规则 |
| `CI` | 工作流 |
| `LAN` | 语言落地页 |
| `CFG` | 站点配置 |
| `THE` | 主题 |
| `IDX` | 总索引 |
| `OVR` | 系统总览 |
| `SLM` | SLAM |
| `PGO` | PGOBA |
| `PCL` | PCL |
| `PRE` | preprocess |
| `DRV` | 配套驱动 |
| `APP` | 附录 |

页型段取值：

| 代码 | 含义 |
|---|---|
| `IDX` | 模块索引 |
| `CLI` | 命令行使用 |
| `DKR` | Docker 编译 |
| `ARC` | 源码架构 |
| `OVR` | 系统总览 |
| `PEN` | 待确认事项清单 |
| `PRM` | 提示词版本 |
| `LAN` | 语言落地页 |
| `CFG` | 配置 |
| `THE` | 主题 |
| `WF` | 工作流 |
| `PKG` | 包配置 |
| `GIT` | 忽略规则 |
| `RDM` | 说明 |

## 2. 清单

| SKU | 名称 | 语言 | 仓库路径 | 版本 | 状态 |
|---|---|---|---|---|---|
| SPK-ROOT-RDM-NA-001 | 仓库维护说明 | NA | `README.md` | 1.0.0 | 在库 |
| SPK-ROOT-PKG-NA-001 | 包配置 | NA | `package.json` | 1.0.0 | 在库 |
| SPK-ROOT-PKG-NA-002 | 依赖锁文件 | NA | `package-lock.json` | 1.0.0 | 在库 |
| SPK-ROOT-GIT-NA-001 | 忽略规则 | NA | `.gitignore` | 1.0.0 | 在库 |
| SPK-ROOT-CI-WF-NA-001 | 构建部署工作流 | NA | `.github/workflows/deploy-docs.yml` | 1.0.0 | 在库 |
| SPK-ROOT-LAN-LAN-NA-001 | 语言选择落地页 | NA | `docs/index.md` | 1.0.0 | 在库 |
| SPK-CFG-CFG-CFG-NA-001 | 站点配置 | NA | `docs/.vitepress/config.mts` | 1.0.0 | 在库 |
| SPK-CFG-THE-THE-NA-001 | 主题入口 | NA | `docs/.vitepress/theme/index.ts` | 1.0.0 | 在库 |
| SPK-CFG-THE-THE-NA-002 | 主题样式 | NA | `docs/.vitepress/theme/custom.css` | 1.0.0 | 在库 |
| SPK-DOC-IDX-IDX-ZH-001 | 总索引（首页） | ZH | `docs/zh/index.md` | 1.0.0 | 在库 |
| SPK-DOC-IDX-IDX-EN-001 | 总索引（首页） | EN | `docs/en/index.md` | 1.0.0 | 在库 |
| SPK-DOC-OVR-OVR-ZH-001 | 系统总览 | ZH | `docs/zh/appendix/system-overview.md` | 1.0.0 | 在库 |
| SPK-DOC-OVR-OVR-EN-001 | 系统总览 | EN | `docs/en/appendix/system-overview.md` | 1.0.0 | 在库 |
| SPK-DOC-SLM-IDX-ZH-001 | SLAM 模块索引 | ZH | `docs/zh/slam/index.md` | 1.0.0 | 在库 |
| SPK-DOC-SLM-CLI-ZH-001 | SLAM 命令行使用 | ZH | `docs/zh/slam/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-SLM-DKR-ZH-001 | SLAM Docker 编译 | ZH | `docs/zh/slam/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-SLM-ARC-ZH-001 | SLAM 源码架构 | ZH | `docs/zh/slam/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-SLM-IDX-EN-001 | SLAM 模块索引 | EN | `docs/en/slam/index.md` | 1.0.0 | 在库 |
| SPK-DOC-SLM-CLI-EN-001 | SLAM 命令行使用 | EN | `docs/en/slam/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-SLM-DKR-EN-001 | SLAM Docker 编译 | EN | `docs/en/slam/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-SLM-ARC-EN-001 | SLAM 源码架构 | EN | `docs/en/slam/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-PGO-IDX-ZH-001 | PGOBA 模块索引 | ZH | `docs/zh/pgoba/index.md` | 1.0.0 | 在库 |
| SPK-DOC-PGO-CLI-ZH-001 | PGOBA 命令行使用 | ZH | `docs/zh/pgoba/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-PGO-DKR-ZH-001 | PGOBA Docker 编译 | ZH | `docs/zh/pgoba/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-PGO-ARC-ZH-001 | PGOBA 源码架构 | ZH | `docs/zh/pgoba/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-PGO-IDX-EN-001 | PGOBA 模块索引 | EN | `docs/en/pgoba/index.md` | 1.0.0 | 在库 |
| SPK-DOC-PGO-CLI-EN-001 | PGOBA 命令行使用 | EN | `docs/en/pgoba/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-PGO-DKR-EN-001 | PGOBA Docker 编译 | EN | `docs/en/pgoba/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-PGO-ARC-EN-001 | PGOBA 源码架构 | EN | `docs/en/pgoba/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-PCL-IDX-ZH-001 | PCL 模块索引 | ZH | `docs/zh/pcl/index.md` | 1.0.0 | 在库 |
| SPK-DOC-PCL-CLI-ZH-001 | PCL 命令行使用 | ZH | `docs/zh/pcl/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-PCL-DKR-ZH-001 | PCL Docker 编译 | ZH | `docs/zh/pcl/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-PCL-ARC-ZH-001 | PCL 源码架构 | ZH | `docs/zh/pcl/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-PCL-IDX-EN-001 | PCL 模块索引 | EN | `docs/en/pcl/index.md` | 1.0.0 | 在库 |
| SPK-DOC-PCL-CLI-EN-001 | PCL 命令行使用 | EN | `docs/en/pcl/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-PCL-DKR-EN-001 | PCL Docker 编译 | EN | `docs/en/pcl/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-PCL-ARC-EN-001 | PCL 源码架构 | EN | `docs/en/pcl/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-PRE-IDX-ZH-001 | preprocess 模块索引 | ZH | `docs/zh/preprocess/index.md` | 1.0.0 | 在库 |
| SPK-DOC-PRE-CLI-ZH-001 | preprocess 命令行使用 | ZH | `docs/zh/preprocess/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-PRE-DKR-ZH-001 | preprocess Docker 编译 | ZH | `docs/zh/preprocess/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-PRE-ARC-ZH-001 | preprocess 源码架构 | ZH | `docs/zh/preprocess/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-PRE-IDX-EN-001 | preprocess 模块索引 | EN | `docs/en/preprocess/index.md` | 1.0.0 | 在库 |
| SPK-DOC-PRE-CLI-EN-001 | preprocess 命令行使用 | EN | `docs/en/preprocess/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-PRE-DKR-EN-001 | preprocess Docker 编译 | EN | `docs/en/preprocess/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-PRE-ARC-EN-001 | preprocess 源码架构 | EN | `docs/en/preprocess/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-DRV-IDX-ZH-001 | 配套驱动模块索引 | ZH | `docs/zh/driver-livox/index.md` | 1.0.0 | 在库 |
| SPK-DOC-DRV-CLI-ZH-001 | 配套驱动命令行使用 | ZH | `docs/zh/driver-livox/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-DRV-DKR-ZH-001 | 配套驱动 Docker 编译 | ZH | `docs/zh/driver-livox/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-DRV-ARC-ZH-001 | 配套驱动源码架构 | ZH | `docs/zh/driver-livox/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-DRV-IDX-EN-001 | 配套驱动模块索引 | EN | `docs/en/driver-livox/index.md` | 1.0.0 | 在库 |
| SPK-DOC-DRV-CLI-EN-001 | 配套驱动命令行使用 | EN | `docs/en/driver-livox/commandline.md` | 1.0.0 | 在库 |
| SPK-DOC-DRV-DKR-EN-001 | 配套驱动 Docker 编译 | EN | `docs/en/driver-livox/docker-build.md` | 1.0.0 | 在库 |
| SPK-DOC-DRV-ARC-EN-001 | 配套驱动源码架构 | EN | `docs/en/driver-livox/architecture.md` | 1.0.0 | 在库 |
| SPK-DOC-APP-PEN-ZH-001 | 待确认事项清单 | ZH | `docs/zh/appendix/pending-items.md` | 1.0.0 | 在库 |
| SPK-DOC-APP-PRM-ZH-001 | 提示词版本 | ZH | `docs/zh/appendix/prompt-version.md` | 1.0.0 | 在库 |
| SPK-DOC-APP-PEN-EN-001 | 待确认事项清单 | EN | `docs/en/appendix/pending-items.md` | 1.0.0 | 在库 |
| SPK-DOC-APP-PRM-EN-001 | 提示词版本 | EN | `docs/en/appendix/prompt-version.md` | 1.0.0 | 在库 |

## 3. 入库 / 变更流程

1. **新增资产**（新页面、新配置、新文件）：
   - 按第 1 节规则分配 SKU（同"域-模块-页型-语言"内序号递增）；
   - 在 `sku/manifest.json` 的 `items` 数组追加条目（权威源）；
   - 重新生成 `sku/manifest.csv`：`node -e "…"` 或手工同步（保持与 JSON 一致）；
   - 在 `sku/manifest.md` 第 2 节表格追加一行；
   - 提交仓库（GitHub Actions 自动发布站点）。
2. **变更既有资产**：
   - 更新 `manifest.json` 中该条目的 `updated` 字段；涉及版本升级时更新 `version` 与清单头部的 `version`；
   - 同步 `manifest.csv` 与 `manifest.md` 对应行；
   - 提交仓库。
3. **盘点**：
   - 以 `sku/manifest.json` 为基准，核对 `path` 指向的文件是否存在（可脚本化比对）；
   - 状态字段取值：`在库` / `已归档` / `已删除`（删除时保留条目并改状态，SKU 不复用）。
4. **外部系统导入**：使用 `sku/manifest.csv`（UTF-8 BOM，Excel 可直接打开）。

## 4. 汇总

| 域 | 数量 |
|---|---|
| ROOT（仓库根文件） | 6 |
| CFG（站点配置） | 3 |
| DOC（文档页） | 48 |
| 合计 | 57 |
