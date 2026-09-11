# SLAM 模块（lsdc_slam）

| 项 | 值 |
|---|---|
| 模块名 | SLAM（LIO 前端 + Localization + RTK 链路） |
| 适用版本 | `Spikive-SLAM` 仓库 git `main` @ `c86c818`；ROS 包 `lsdc_slam`，`package.xml` 声明版本 `0.0.0` |
| 最后更新 | 2026-09-10 |

## 1. 模块定位

本模块为 ROS1（Noetic）catkin 包，包名 `lsdc_slam`，目录名 `Spikive-SLAM`。源码基于 FAST-LIO2（hku-mars）派生，仓库内 `docs/architecture.md` 将系统划分为五层：

| 层级 | 节点 |
|---|---|
| 传感器预处理 | `lsdc_ins_preprocess`、`rs_velodyne` |
| LIO 建图 | `lsdc_mapping` |
| RTK 初始化 | `lsdc_rtk2pose`、`lsdc_repub_gnss` |
| Motion Control 标定适配 | `lsdc_flight_controller` |
| Localization / world 收口 | `lsdc_global_match`、`lsdc_fusion_repub` |

## 2. 包信息

| 项 | 值 |
|---|---|
| 源码目录 | `Spikive-SLAM/` |
| ROS 包名 | `lsdc_slam` |
| 构建系统 | catkin，`CMakeLists.txt` 要求 CMake ≥ 2.8.3，C++14 |
| 构建产物 | 9 个可执行文件（见 `architecture.md`） |
| 独立 Docker 文件 | 无（编译在 PGO 模块镜像与 catkin 工作区内完成，见 `docker-build.md`） |
| 仓库内文档 | `docs/architecture.md`、`docs/data_flow.md`、`docs/coordinate_frames.md`、`docs/slam_system.drawio` |

## 3. 文件清单

| 文件 / 目录 | 职责 |
|---|---|
| `CMakeLists.txt` | 构建 9 个可执行文件，生成 2 个自定义消息 |
| `package.xml` | 包依赖声明 |
| `launch/` | 8 个 launch 文件（场景见 `commandline.md`） |
| `config/` | 9 个 yaml 参数文件（通用 + 各雷达型号） |
| `src/LIO/` | LIO 前端：`laserMapping.cpp`、`IMU_Processing.hpp`、`preprocess.h/.cpp`、`pcl_preprocess.hpp`、`save_result.cpp` |
| `src/localization/` | `flight_controller.cpp`、`fusion_repub.cpp`、`global_match.cpp` |
| `src/preprocess/` | `ins_preprocess.cpp`、`rs_to_velodyne.cpp`、`pcl_struct.hpp`（详见 preprocess 模块文档） |
| `src/RTK/` | `rtk2pose.cpp`、`repub_gnss.cpp` |
| `include/` | 公共头文件；第三方：`ikd-Tree/`（增量 KD 树）、`IKFoM_toolkit/`（流形卡尔曼滤波工具箱）、`Commons/`（地理工具头文件集）、`matplotlibcpp.h`（单头文件库） |
| `msg/` | `Pose6D.msg`、`bywire_chassis_state.msg` |
| `docs/` | 架构、数据流、坐标系说明（本仓库自带） |
| `Log/` | 调试日志目录；`plot.py`（matplotlib 绘图脚本）、`fast_lio_time_log_analysis.m`（MATLAB 耗时分析脚本）、`guide.md` |
| `Lsdc_Repub/` | RTK 位姿记录目录（`init_pose.txt` 为历史样本；运行期读写 `last_pose.txt`、`pose_init.txt`） |
| `rviz_cfg/` | `loam_livox.rviz`、`localization.rviz` |

## 4. 子文档

| 文件 | 内容 |
|---|---|
| `commandline.md` | launch 一览、命令与参数、输入输出话题、运行结果判读 |
| `docker-build.md` | 镜像与依赖、环境变量、构建命令、产物位置、常见报错 |
| `architecture.md` | 目录职责、核心类/函数/数据结构、调用链与数据流、模块间接口、关键配置项 |

## 5. 快速上手

```bash
# 容器内（镜像与工作区装配见 docker-build.md）
source /ws/devel/setup.bash
roslaunch lsdc_slam mapping_livox.launch
```

启动后按 `commandline.md` 第 6 节的检查步骤判读结果。

## 6. 与其他模块的接口

- 输入：`livox_ros_driver` 发布的雷达话题与 IMU 话题（见 driver-livox 模块文档）。
- 输出给 PGOBA：`/cloud_registered_body` 与 `/Odometry`（`Spikive-PGO/launch/slam_btc.launch` 将 `online.launch` 的输入配置为这两个话题）。
- 输出给飞控 / 地面站：`lsdc_fusion_repub` 发布的 `/drone_{id}_*` 稳定话题与 `/mavros/*` 话题。
- 全链路数据流见 `docs/zh/appendix/system-overview.md`。
