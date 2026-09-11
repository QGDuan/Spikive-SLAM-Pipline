# PCL 模块（Spikive-Pcl-Process）

| 项 | 值 |
|---|---|
| 模块名 | PCL（HBA 全量地图的点云离线精修） |
| 适用版本 | `Spikive-Pcl-Process` git `main` @ `249b488`，固定版本 `1.0.0`（`VERSION` 文件） |
| 最后更新 | 2026-09-10 |

## 1. 模块定位

独立离线程序 `pcl_process`（CMake 工程 `spikive_pcl_process`）。处理链（`README.md` 原文）：

```text
HBA 全量地图 → 可选 PCL SOR → PCL MLS → 按原始扫描顺序的 Voxblox TSDF → 并行顶点导出 / 强度属性转移 → refined_map.pcd（XYZI）
```

事实边界：

- 不启动 ROS、RViz、ICP、PGO 或 BA；ROS1 bag 用 Python `rosbags` 库做文件级解码；
- C++ 核心不依赖 ROS / GTSAM；
- 不修改 HBA 位姿与已有结果，不应用历史飞控 RT，不把完整地图重复作为每一帧融合；
- `CATKIN_IGNORE` 防止 catkin 递归编译 `third_party` 内的 ROS 包；使用本仓库独立构建入口。

## 2. 包信息

| 项 | 值 |
|---|---|
| 源码目录 | `Spikive-Pcl-Process/` |
| 工程名 | `spikive_pcl_process`（版本取自 `VERSION` = 1.0.0） |
| 构建系统 | CMake ≥ 3.16，C++17（独立工程，非 catkin 包） |
| 可执行 | `pcl_process`（用法见 `commandline.md`） |
| 运行镜像 | `spikive-pcl-process:1.0.0` |
| 上游 | PCL MLS（系统库）、Voxblox（commit `c8066b0`）、minkindr（commit `564f126`），vendor 于 `third_party/`，`third_party.lock.json` 校验 |

## 3. 文件清单

| 文件 / 目录 | 职责 |
|---|---|
| `CMakeLists.txt` | 依赖 EXACT 锁定；配置期运行 `scripts/verify_vendor.py`；构建 `voxblox_core`、`process_core`、`pcl_process` 与 3 个测试；注册 6 组 CTest |
| `VERSION` | 版本号 `1.0.0` |
| `CATKIN_IGNORE` | 内容："Standalone offline CMake project. Do not discover third_party ROS packages." |
| `include/process/pipeline.hpp` | 数据结构与函数声明：`Config`、`Frame`、`Smoothed`、`FusionStats`、`IntensityStats`；`readConfig`、`readFrames`、`smooth`、`fuse`、`attachIntensity` |
| `include/process/surface_export.hpp` | `exportSurfacePoints`（网格顶点并行导出）、`availableCpuCount`、`resolveThreads` |
| `src/main.cpp` | `pcl_process` 入口：加载地图 → 读帧索引 → `smooth` → `fuse` → `attachIntensity` → 写 `refined_map.pcd.partial` → PCL 回读校验 → 写 `native.json` |
| `src/pipeline.cpp` | `readConfig`、`readFrames`、`smooth`（可选 SOR + 分块 MLS）、`fuse`（TSDF 积分 + marching cubes + 并行导出） |
| `src/surface_export.cpp` | 顶点导出与去重（与原生 `getConnectedMesh()` 逐位一致） |
| `src/intensity.cpp` | `attachIntensity`：K=1 精确最近邻强度属性转移 |
| `config/indoor.yaml` | 唯一配置文件（schema 1） |
| `scripts/process.sh` | 主机入口：`version` / `build` / `test` / `run` |
| `scripts/process.py` | 镜像 ENTRYPOINT：三段流程编排与校验、`REPORT.md` 与 `records/` 生成 |
| `scripts/hba_io.py` | 只读 HBA 适配：TUM 位姿解析、严格二进制 PCD 合同、`frames.bin` 生成 |
| `scripts/verify_vendor.py` | 按 `third_party.lock.json` 逐文件 SHA256 校验 |
| `docker/` | `Dockerfile`（主镜像）、`Dockerfile.environment`（纯点云依赖镜像）、`requirements.txt`、`runtime.lock.json` |
| `tests/` | `test_pipeline.cpp`、`test_export.cpp`、`test_intensity.cpp`、`test_io.py`、`test_integration.py` |
| `third_party/` | `voxblox/`、`minkindr/`（40 个跟踪文件，SHA256 锁） |
| `VALIDATION.md` | 基线验收记录（saier2biao XYZI run03 等） |

## 4. 子文档

| 文件 | 内容 |
|---|---|
| `commandline.md` | 命令行使用：参数、输入输出、判读 |
| `docker-build.md` | 镜像与依赖、构建命令、产物位置、常见报错 |
| `architecture.md` | 源码架构：处理流水线、核心函数、数据合同、关键配置项 |

## 5. 快速上手

```bash
bash scripts/process.sh build
bash scripts/process.sh test

bash scripts/process.sh run HBA_DIR BODY_BAG NEW_OUTPUT_DIR \
  --sensor-origin-body ORIGIN_X ORIGIN_Y ORIGIN_Z \
  --sensor-origin-note "标定来源与近似方式说明"
```

前置与约束见 `commandline.md`。

## 6. 与其他模块的接口

- 输入：PGOBA 模块（`Spikive-BA`）输出的 `optimized_map_all_scans.pcd`（HBA 全扫描顺序拼接 XYZI）与 `optimized_pose.txt`（TUM，`T_world_body`），以及生成这些结果时使用的原始 body bag。
- 输出：`refined_map.pcd`（FLOAT32 XYZI）+ `REPORT.md` + `records/`。
- 全链路见 `docs/zh/appendix/system-overview.md`。
