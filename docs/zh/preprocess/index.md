# preprocess 模块

| 项 | 值 |
|---|---|
| 模块名 | preprocess（传感器预处理：INS 同步、Robosense 转换、雷达帧预处理） |
| 适用版本 | 随 `Spikive-SLAM` 仓库 git `main` @ `c86c818`（无独立仓库） |
| 最后更新 | 2026-09-10 |

## 1. 模块定位

本模块是 `lsdc_slam` 包内的子系统，无独立仓库、无独立构建目标文件。按代码位置分为三块：

| 块 | 源码位置 | 构建方式 |
|---|---|---|
| INS GPS/IMU 预处理 | `Spikive-SLAM/src/preprocess/ins_preprocess.cpp` | 独立可执行 `lsdc_ins_preprocess` |
| Robosense→Velodyne 转换 | `Spikive-SLAM/src/preprocess/rs_to_velodyne.cpp` | 独立可执行 `rs_velodyne` |
| 雷达帧预处理与多雷达融合 | `Spikive-SLAM/src/LIO/preprocess.h`、`preprocess.cpp`、`pcl_preprocess.hpp` | 编入 `lsdc_mapping`（见 SLAM 模块 `architecture.md`） |

其中前两块对应仓库 `docs/architecture.md` 的"传感器预处理"层；第三块属于 LIO 前端内部环节。

## 2. 文件清单

| 文件 | 职责 |
|---|---|
| `src/preprocess/ins_preprocess.cpp` | 节点 `ins_preprocess`：GPS 与 IMU 时间同步，发布 `/lsdc_rtk` |
| `src/preprocess/rs_to_velodyne.cpp` | 节点 `rs_converter`：Robosense 点云外参变换、ring 与时间重映射，发布 `/velodyne_points` |
| `src/preprocess/pcl_struct.hpp` | 点云结构定义：`RsPointXYZIRT`、`VelodynePointXYZIRT`、`VelodynePointXYZIR` 及 PCL 点结构注册 |
| `src/LIO/preprocess.h` | `Preprocess` 类声明；`PointType`、`LID_TYPE`、`TIME_UNIT`、`Feature` 等枚举；`velodyne_ros::Point`、`ouster_ros::Point`、`lx_ros::Point` 点结构 |
| `src/LIO/preprocess.cpp` | `Preprocess` 实现：Avia/Ouster/Velodyne/S10U 四个 handler、特征提取 |
| `src/LIO/pcl_preprocess.hpp` | `pcl_pre` 命名空间：`PclPreprocess` 类与 `fusePclMsg`、`initPclPrepreocess`（多雷达融合） |

## 3. 子文档

| 文件 | 内容 |
|---|---|
| `commandline.md` | 两个独立节点的启动命令、参数、输入输出话题、结果判读 |
| `docker-build.md` | 编译方式（与 SLAM 同包）、依赖、产物位置、常见报错 |
| `architecture.md` | 三个块的核心类/函数/数据结构、调用链与数据流、关键配置项 |

## 4. 快速上手

```bash
# 容器内（编译见 docker-build.md）
source /ws/devel/setup.bash
# INS 预处理（订阅 /rtk_gps 与 /rtk_imu）
rosrun lsdc_slam lsdc_ins_preprocess
# Robosense 转换（订阅 /rslidar_points）
rosrun lsdc_slam rs_velodyne
```

雷达帧预处理随 `roslaunch lsdc_slam mapping_livox.launch`（或其它建图 launch）启动的 `lsdc_mapping` 一起运行，无独立入口。

## 5. 与其他模块的接口

- `lsdc_ins_preprocess` 输出 `/lsdc_rtk`，供 SLAM 模块的 `lsdc_rtk2pose` 消费。
- `rs_velodyne` 输出 `/velodyne_points`，供 velodyne 配置的 `lsdc_mapping` 消费。
- `Preprocess`/`PclPreprocess` 在 `lsdc_mapping` 进程内运行，输入为 `livox_ros_driver` 的 `CustomMsg` 或标准 `PointCloud2`。
