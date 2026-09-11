# Spikive SLAM Pipeline 文档

本指南面向客户方工程师，覆盖 SLAM Pipeline 的 5 个模块：SLAM、PGOBA、PCL、preprocess、配套驱动。内容包含三个层次：命令行使用步骤、Docker 环境编译说明、源码级架构说明。全部命令与参数可在交付源码包中溯源。

:::tip
本指南的适用版本为源码包 `src.zip` 交付快照（2026-09-06 克隆、2026-09-10 交付），各模块版本与 git 提交锁定见[项目组成与版本](#项目组成与版本)。
:::

:::warning
源码包内 `Spikive-SLAM/README.md` 为上游 FAST-LIO 原版 README，包名与命令与本项目不符。运行命令以本指南为准。
:::

## 如何开始？

根据您的目标，从以下入口开始：

### 我想按顺序跑通全链路

从[系统总览](/zh/appendix/system-overview)开始：它给出端到端数据流、模块间话题与文件接口、三个镜像的环境总表，以及 6 步运行顺序（驱动 → SLAM → PGO → BA → PCL）。

### 我想启动雷达驱动

见[配套驱动：命令行使用](/zh/driver-livox/commandline)：直连 / Hub / lvx 回放三种数据源的 launch 命令、广播码与 `xfer_format` 参数、输出话题判读。

### 我想运行 LIO 前端建图

见[SLAM：命令行使用](/zh/slam/commandline)：按雷达型号选择 launch（MID360/AVIA/MID70、S10U、VLP-16），参数表、输入输出话题、结果判读。

### 我想做回环检测与位姿图优化（PGO）

见[PGOBA：命令行使用（第一部分）](/zh/pgoba/commandline)：三终端在线运行、数据集回放编排脚本（`saier8biao.sh` 等）、独立离线重建入口。

### 我想做全局 BA

见[PGOBA：命令行使用（第二部分）](/zh/pgoba/commandline)：`hba.sh` 的构建与运行命令、输入文件契约、输出产物与判读。

### 我想做点云表面精修

见[PCL：命令行使用](/zh/pcl/commandline)：`process.sh run` 的输入契约（HBA 地图 + pose + body bag）、传感器原点参数、输出结构与失败判读。

### 我想搭建编译环境

见[PGOBA：Docker 编译](/zh/pgoba/docker-build)：三个镜像（`spikive-slam:btc-noetic`、`spikive-ba:v1.0.0-w20-g10`、`spikive-pcl-process:1.0.0`）的构建命令、依赖版本锁、常见报错。SLAM/preprocess/配套驱动在第一个镜像内编译。

### 我想理解源码架构并自行维护

从各模块的"源码架构"页开始：目录职责、核心类/函数、调用链与数据流、关键配置项。存在疑问的命令与路径见[待确认事项清单](/zh/appendix/pending-items)。

## 模块文档目录

| 模块 | 模块索引 | 命令行使用 | Docker 编译 | 源码架构 |
|---|---|---|---|---|
| SLAM | [slam](/zh/slam/) | [slam/commandline](/zh/slam/commandline) | [slam/docker-build](/zh/slam/docker-build) | [slam/architecture](/zh/slam/architecture) |
| PGOBA | [pgoba](/zh/pgoba/) | [pgoba/commandline](/zh/pgoba/commandline) | [pgoba/docker-build](/zh/pgoba/docker-build) | [pgoba/architecture](/zh/pgoba/architecture) |
| PCL | [pcl](/zh/pcl/) | [pcl/commandline](/zh/pcl/commandline) | [pcl/docker-build](/zh/pcl/docker-build) | [pcl/architecture](/zh/pcl/architecture) |
| preprocess | [preprocess](/zh/preprocess/) | [preprocess/commandline](/zh/preprocess/commandline) | [preprocess/docker-build](/zh/preprocess/docker-build) | [preprocess/architecture](/zh/preprocess/architecture) |
| 配套驱动 | [driver-livox](/zh/driver-livox/) | [driver-livox/commandline](/zh/driver-livox/commandline) | [driver-livox/docker-build](/zh/driver-livox/docker-build) | [driver-livox/architecture](/zh/driver-livox/architecture) |

## 项目组成与版本

| 模块 | 源码目录 | 包 / 工程名 | 版本 | 版本锁定 |
|---|---|---|---|---|
| SLAM | `Spikive-SLAM/` | ROS 包 `lsdc_slam` | `package.xml` 声明 `0.0.0` | git `main` @ `c86c818` |
| PGOBA（PGO） | `Spikive-PGO/` | ROS 包 `spikive_btc` | `0.1.0` | git `dev` @ `3560a85` |
| PGOBA（BA） | `Spikive-BA/` | ROS 包 `spikive_ba` | `1.0.0` | git `main` @ `35324cb`（`sources.repos` 标注 v1.0.0） |
| PCL | `Spikive-Pcl-Process/` | CMake 工程 `spikive_pcl_process` | `1.0.0` | git `main` @ `249b488` |
| preprocess | `Spikive-SLAM/src/preprocess/`、`Spikive-SLAM/src/LIO/preprocess.*` | `lsdc_slam` 内子系统 | 随 SLAM 仓库 | 随 SLAM 仓库 |
| 配套驱动 | `livox_ros_driver/` | ROS 包 `livox_ros_driver` | `2.6.0` | git `master` @ `3d240d5`（官方未修改克隆） |

## 获取帮助

- 发现文档与源码不一致：见[待确认事项清单](/zh/appendix/pending-items)（S-/P-/D-/C- 编号），确认后更新对应页面并删除条目。
- 发现问题或提交修改：[GitHub 仓库](https://github.com/QGDuan/Spikive-SLAM-Pipline)（Issues / Pull Requests）。

## 维护约定

- 中文内容（`docs/zh/`）为底层文件，英文（`docs/en/`）为镜像翻译，逐文件对应。
- 每个模块固定四个文件：`index.md`（模块索引）、`commandline.md`、`docker-build.md`、`architecture.md`。
- 新增模块时同步更新本站配置的侧边栏与本页目录表。
- 文档生成的提示词版本与执行记录见[提示词版本](/zh/appendix/prompt-version)。
