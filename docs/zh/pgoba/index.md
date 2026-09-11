# PGOBA 模块

| 项 | 值 |
|---|---|
| 模块名 | PGOBA（回环检测 + 位姿图优化 + 全局 BA） |
| 适用版本 | `Spikive-PGO` git `dev` @ `3560a85`（ROS 包 `spikive_btc` 0.1.0）；`Spikive-BA` git `main` @ `35324cb`（ROS 包 `spikive_ba` 1.0.0） |
| 最后更新 | 2026-09-10 |

## 1. 模块定位

本模块由两个独立仓库组成，串接为"回环与位姿图优化（PGO）→ 全局 BA（BA）"两级后端：

| 仓库 | 职责 |
|---|---|
| `Spikive-PGO`（ROS 包 `spikive_btc`） | 官方 BTC 检索 → GICP 精配准 → 1% 漂移比例检查 → PCM → 可选 GNC-TLS → iSAM2。输入为 FastLIO 原始 body 点云与里程计，不包含 SLAM 前端源码（仓库 README 自述） |
| `Spikive-BA`（ROS 包 `spikive_ba`） | 原始 body 点云 bag + 外部 pose.txt → HBA 分层几何 BA → 顶层边 Cauchy-PGO → 全量地图与新位姿。固定 20/10、3 层版本，不运行 BTC，不依赖 Spikive-PGO 源码（仓库 README 自述） |

两仓库的 GTSAM 版本相互隔离：PGO 使用 4.2.0（`/opt/spikive`），BA 使用 4.1.1（`/opt/hba-gtsam411`），分属不同镜像与构建前缀。

## 2. 包信息

| 项 | PGO | BA |
|---|---|---|
| 源码目录 | `Spikive-PGO/` | `Spikive-BA/` |
| ROS 包名 | `spikive_btc` | `spikive_ba` |
| 版本 | `0.1.0` | `1.0.0` |
| 构建系统 | catkin，CMake ≥ 3.16，C++17 | catkin，CMake ≥ 3.16，C++17 |
| 版本锁文件 | `docker/versions.lock.yaml` | `docker/hba.lock.yaml`、`docker/image.lock.json` |
| 第三方 | `third_party/btc_descriptor`（官方 BTC，commit `742af157`）、`third_party/Kimera-RPGO`（PCM）、`third_party/small_gicp`（GICP） | `third_party/HBA`（官方 HBA，commit `a0cdd47`，23 文件 + SHA256 清单） |

## 3. 文件清单

### 3.1 `Spikive-PGO/`

| 文件 / 目录 | 职责 |
|---|---|
| `src/btc_online_node.cpp` | 在线节点 `btc_online`：输入同步、子地图、BTC、GICP、PGO、发布与导出 |
| `src/pgo_backend.{cpp,hpp}` | `PoseGraph`：GTSAM 位姿图后端（追加、回环考虑、EOF 结束 PGO） |
| `src/robust_optimizer.{cpp,hpp}` | `optimizeRobust`：PCM 过滤 + 可选 GNC + iSAM2 求解 |
| `src/gnc_isam2.hpp` | `GncIsam2Optimizer`：GNC 加权子问题的 ISAM2 适配器 |
| `src/gicp_refine.{cpp,hpp}` | `refineGicp`：small_gicp GICP 精配准 |
| `src/submap_window.hpp` | `SubmapWindow`：滑动子地图窗口 |
| `src/replay_pgo.cpp`、`src/replay_gicp_refinement.cpp` | 冻结图重放与候选精配准重放工具 |
| `config/` | `btc_pgo.yaml`（生产后端）、`online.yaml`（旧节点）、`guigang_recorded.yaml`、`saier8biao_btc.yaml`、`saier8biao_slam.yaml`、`robust_profiles/`（pcm.yaml、pcm_gnc.yaml） |
| `launch/` | 8 个 launch（见 `commandline.md`） |
| `msg/` | `PlaceRecognition`、`LoopConstraint`、`PgoStatus`、`RobustStatus`、`RefinementDiagnostics`、`FinalPgoStatus` |
| `scripts/` | `dev.sh`（容器编排入口）与 6 个 .sh、30 个 .py（准备、运行、导出、审计） |
| `docker/` | `Dockerfile`、`entrypoint.sh`、`versions.lock.yaml`、`verify/`（依赖校验） |
| `docs/` | 10 个说明文档（`frame_contract.md`、`btc-pgo.md`、`pcm-gnc-pgo.md` 等） |
| `rviz/` | 6 个 RViz 配置 |
| `results/` | 运行输出目录（Git 忽略，当前为空） |

### 3.2 `Spikive-BA/`

| 文件 / 目录 | 职责 |
|---|---|
| `integration/hba/CMakeLists.txt` | 校验 HBA vendor 树 SHA256，复制构建副本并打 2 个补丁，编译 `hba`、`visualize_map` 与 2 个测试 |
| `integration/hba/cauchy.patch` | 顶层 BA 边噪声改为 Cauchy(1) 鲁棒核 |
| `integration/hba/indoor_parameters.patch` | BA 参数调整（max_iter 30、voxel 0.5 m、downsample 0.05 m、WIN_SIZE 20、GAP 10 等） |
| `integration/hba/top_edge_noise.hpp` | `spikive_hba::topEdgeNoise`：Cauchy(1) 噪声模型工厂 |
| `integration/hba/test_cauchy.cpp`、`test_window.cpp` | CTest：Cauchy 数学验证、20/10 分层窗口验证 |
| `launch/global_ba.launch` | 唯一入口：启动 `hba_run.py` 编排节点 |
| `scripts/hba.sh` | 镜像构建与运行编排 |
| `scripts/hba_run.py`、`hba_inputs.py`、`pose_io.py` | 流程编排、输入适配、位姿/点云 I/O |
| `docker/` | `Dockerfile`（构建镜像）、`Dockerfile.environment`（依赖镜像）、`hba-entrypoint.sh`、锁文件 |
| `provenance/migration.json` | 源码迁移来源与函数 SHA256 记录 |
| `test/` | 4 个 Python 测试/审计脚本 |
| `third_party/HBA/` | 官方 HBA 完整源码（`include/{hba,ba,mypcl,tools}.hpp`、`source/{hba,visualize,calculate_MME}.cpp`、launch、rviz_cfg） |

## 4. 子文档

| 文件 | 内容 |
|---|---|
| `commandline.md` | PGO 三终端在线运行、离线重建、数据集编排脚本、BA 的 hba.sh 入口、输出产物与判读 |
| `docker-build.md` | 两个仓库的镜像、依赖、环境变量、构建命令、产物位置、常见报错 |
| `architecture.md` | BTC/PCM/GNC/iSAM2 与 HBA 的源码架构、调用链、输入契约、关键配置项 |

## 5. 快速上手

```bash
# PGO：构建（Spikive-PGO 仓库根）
python3 scripts/check_upstream_btc.py
bash scripts/dev.sh build-image
BUILD_JOBS=6 bash scripts/dev.sh build
bash scripts/dev.sh check

# BA：构建与运行（Spikive-BA 仓库根）
bash scripts/hba.sh build-env
bash scripts/hba.sh build-image
bash scripts/hba.sh run /absolute/INPUT_DIR /absolute/OUTPUT_DIR
```

完整运行命令见 `commandline.md`。

## 6. 与其他模块的接口

- PGO 输入：SLAM 模块的 `/cloud_registered_body`（frame `body`）与 `/Odometry`（`T_camera_init_body`），契约见 `Spikive-PGO/docs/frame_contract.md`。
- PGO 输出：`optimized_body_odometry.bag`、`optimized_pose.txt`（供 BA 输入）。
- BA 输出：`optimized_map_all_scans.pcd`、`optimized_pose.txt`（供 PCL 模块输入）。
- 全链路见 `docs/zh/appendix/system-overview.md`。
