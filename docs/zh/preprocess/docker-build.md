# preprocess 模块 Docker 环境编译说明

| 项 | 值 |
|---|---|
| 模块名 | preprocess |
| 适用版本 | 随 `Spikive-SLAM` git `main` @ `c86c818` |
| 最后更新 | 2026-09-10 |

## 1. 基本事实

本模块无独立 Dockerfile、无独立构建脚本。三个块的构建方式：

| 块 | 构建方式 | 产物 |
|---|---|---|
| `ins_preprocess.cpp` | `Spikive-SLAM/CMakeLists.txt:109-111` 的 `lsdc_ins_preprocess` 目标 | `devel/lib/lsdc_slam/lsdc_ins_preprocess` |
| `rs_to_velodyne.cpp` | `Spikive-SLAM/CMakeLists.txt:100-102` 的 `rs_velodyne` 目标 | `devel/lib/lsdc_slam/rs_velodyne` |
| `preprocess.cpp` / `pcl_preprocess.hpp` | 编入 `lsdc_mapping` 目标（`CMakeLists.txt:104`，源文件列表含 `src/LIO/preprocess.cpp`） | 无独立产物 |

镜像、环境变量、catkin 工作区装配与 SLAM 模块相同，见 `../slam/docker-build.md`。本文件只列与本模块直接相关的差异。

## 2. 本模块依赖

| 依赖 | 来源 |
|---|---|
| GeographicLib | `lsdc_ins_preprocess` 链接 `GeographicLib_LIBRARIES`（`CMakeLists.txt:111`） |
| PCL | `rs_velodyne` 链接 `${PCL_LIBRARIES}`（`CMakeLists.txt:102`） |
| OpenCV | `rs_velodyne` 链接 `${OpenCV_LIBRARIES}`（`CMakeLists.txt:102`；文件未 `find_package(OpenCV)`，变量在默认环境为空 [待确认]） |
| `livox_ros_driver` 消息头 | `ins_preprocess.cpp:6` include `<livox_ros_driver/CustomMsg.h>`；`preprocess.h:3` 同。工作区必须包含 `livox_ros_driver` 包 |

## 3. 构建命令

与 SLAM 模块共用同一 catkin 构建命令（取自 `Spikive-PGO/scripts/dev.sh`）：

```bash
catkin_make -j4 -DCMAKE_BUILD_TYPE=Release -DCATKIN_WHITELIST_PACKAGES= \
  -DCMAKE_PREFIX_PATH=/opt/spikive\;/opt/ros/noetic \
  -DCeres_DIR=/opt/spikive/lib/cmake/Ceres \
  -DGTSAM_DIR=/opt/spikive/lib/cmake/GTSAM
```

仅构建本模块相关目标时可用：

```bash
catkin_make --only-pkg-with-deps lsdc_slam
```

（`--only-pkg-with-deps` 为 catkin_make 标准选项，实际使用方式以现场验证为准 [待确认]。）

## 4. 编译产物位置

- `devel/lib/lsdc_slam/lsdc_ins_preprocess`
- `devel/lib/lsdc_slam/rs_velodyne`
- 雷达帧预处理无独立文件，随 `devel/lib/lsdc_slam/lsdc_mapping` 交付

## 5. 常见报错及处理

| 现象（依据） | 处理方式 |
|---|---|
| `ins_preprocess.cpp` 编译失败：找不到 `<livox_ros_driver/CustomMsg.h>`（`ins_preprocess.cpp:6`） | 将 `livox_ros_driver` 源码放入 `/ws/src` 后重新构建；消息头由其 `generate_messages` 生成 |
| `lsdc_ins_preprocess` 链接失败：找不到 GeographicLib | 安装 `libgeographic-dev`（镜像已内置） |
| S10U 点云编译相关报错 | S10U 点结构 `lx_ros::Point` 定义于 `preprocess.h:83-102`，与驱动消息字段需一致；字段不匹配时按该结构修改 |

## 6. 待确认项（本文件范围）

1. `rs_velodyne` 链接 `${OpenCV_LIBRARIES}` 但未 `find_package(OpenCV)`（同 SLAM 模块待确认项）。
2. 单独构建 `lsdc_slam` 的命令形式。

以上均汇总至 `docs/zh/appendix/pending-items.md`。
