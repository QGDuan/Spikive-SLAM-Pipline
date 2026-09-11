# SLAM 模块 Docker 环境编译说明

| 项 | 值 |
|---|---|
| 模块名 | SLAM |
| 适用版本 | `Spikive-SLAM` git `main` @ `c86c818`（`lsdc_slam` 0.0.0） |
| 最后更新 | 2026-09-10 |

## 1. 基本事实

- `Spikive-SLAM` 仓库无独立 `Dockerfile`、无独立构建脚本、无 `docker/` 目录。
- 编译在 PGO 模块提供的镜像与 catkin 工作区内完成。镜像名 `spikive-slam:btc-noetic`，由 `Spikive-PGO/docker/Dockerfile` 构建（构建命令见 PGOBA 模块 `docker-build.md`）。
- 镜像构建参数（`Spikive-PGO/docker/Dockerfile`）：
  - 基础镜像：Ubuntu focal（华为云镜像地址，可用 `BASE_IMAGE` 覆盖）；
  - apt 安装：`build-essential`、`cmake`、`libeigen3-dev=3.3.7-2`、`libgeographic-dev`、`libtbb-dev`、`python3-dev`、`python3-numpy`、`python3-yaml`、`python3-catkin-tools`、`libapr1-dev`、`ros-noetic-ros-base`、`ros-noetic-pcl-ros`、`ros-noetic-pcl-conversions`、`ros-noetic-mavros`、`ros-noetic-mavros-msgs`、`ros-noetic-rosbag`、`ros-noetic-rviz`、`ros-noetic-rostest` 等；
  - 源码编译：Ceres 2.1.0（commit `783637a6ed285abc6c57b16ccd968c594a91b35f`）、GTSAM 4.2.0（commit `4f66a491ffc83cf092d0d818b11dc35135521612`）、Livox-SDK v2.3.0，均安装至 `/opt/spikive`；
  - 用户：`developer`（UID/GID 1000）；入口：`/spikive-entrypoint.sh`（source ROS 与 `/ws/devel/setup.bash` 后执行命令）。

## 2. 本包依赖清单

依据 `Spikive-SLAM/CMakeLists.txt` 与 `package.xml`：

| 依赖 | 来源行 / 项 | 说明 |
|---|---|---|
| catkin 组件 | `CMakeLists.txt:50-66` | `geometry_msgs`、`nav_msgs`、`sensor_msgs`、`roscpp`、`rospy`、`std_msgs`、`pcl_ros`、`tf`、`mavros`、`mavros_msgs`、`livox_ros_driver`、`message_generation`、`eigen_conversions`、`visualization_msgs`、`rosbag` |
| Eigen3 | `CMakeLists.txt:68` | `find_package(Eigen3 REQUIRED)` |
| Ceres | `CMakeLists.txt:69` | `find_package(Ceres REQUIRED)` |
| PCL | `CMakeLists.txt:70` | `find_package(PCL 1.8 REQUIRED)` |
| GeographicLib | `CMakeLists.txt:45` | `find_package(GeographicLib REQUIRED)`；finder 位于 `/usr/share/cmake/geographiclib` |
| PythonLibs | `CMakeLists.txt:47` | `find_package(PythonLibs REQUIRED)` |
| matplotlibcpp.h | `CMakeLists.txt:48` | `find_path(MATPLOTLIB_CPP_INCLUDE_DIRS "matplotlibcpp.h")`；头文件在包内 `include/matplotlibcpp.h` |

其中 `livox_ros_driver` 是 ROS 包依赖：catkin 工作区的 `/ws/src` 中必须存在 `livox_ros_driver` 源码包，否则本包无法配置。

## 3. 工作区装配

- `Spikive-PGO/scripts/dev.sh` 仅把 `Spikive-PGO` 仓库挂载到 `/ws/src/Spikive-PGO`，未挂载 `Spikive-SLAM` 与 `livox_ros_driver`。
- 交付包中未提供装配 SLAM 源码进 `/ws/src` 的脚本。在包含 SLAM 的场景（如 `Spikive-PGO/launch/slam_btc.launch`）中，工作区需同时包含 `livox_ros_driver` 与 `Spikive-SLAM` 源码；装配的具体操作步骤 [待确认]。

## 4. 环境变量

| 变量 | 值 | 来源 |
|---|---|---|
| `CMAKE_PREFIX_PATH` | `/opt/spikive:/opt/ros/noetic` | `docker/entrypoint.sh`、`scripts/dev.sh` |
| `Ceres_DIR` | `/opt/spikive/lib/cmake/Ceres` | `scripts/dev.sh` build 命令 |
| `GTSAM_DIR` | `/opt/spikive/lib/cmake/GTSAM` | `scripts/dev.sh` build 命令 |
| `LD_LIBRARY_PATH` | `/opt/spikive/lib` | `docker/Dockerfile:61` |
| `ROS_DISTRO` | `noetic` | `docker/Dockerfile:62` |

## 5. 构建命令

镜像内 catkin 构建命令（取自 `Spikive-PGO/scripts/dev.sh` 的 `build` 子命令）：

```bash
catkin_make -j4 -DCMAKE_BUILD_TYPE=Release -DCATKIN_WHITELIST_PACKAGES= \
  -DCMAKE_PREFIX_PATH=/opt/spikive\;/opt/ros/noetic \
  -DCeres_DIR=/opt/spikive/lib/cmake/Ceres \
  -DGTSAM_DIR=/opt/spikive/lib/cmake/GTSAM
```

`-j` 后的并行数可用 `BUILD_JOBS` 调整（`dev.sh` 默认 4）。若 `/ws/src` 同时包含 `Spikive-PGO`，该命令会一并构建 `spikive_btc`；仅构建本包时可用 `catkin_make --only-pkg-with-deps lsdc_slam`（catkin_make 标准选项，[待确认] 实际使用方式以现场验证为准）。

## 6. 编译产物位置

- 可执行文件：`devel/lib/lsdc_slam/`，共 9 个：

| 可执行文件 | 源文件（`CMakeLists.txt` 目标） |
|---|---|
| `lsdc_mapping` | `src/LIO/laserMapping.cpp`、`include/ikd-Tree/ikd_Tree.cpp`、`src/LIO/preprocess.cpp` |
| `lsdc_ins_preprocess` | `src/preprocess/ins_preprocess.cpp` |
| `rs_velodyne` | `src/preprocess/rs_to_velodyne.cpp` |
| `lsdc_flight_controller` | `src/localization/flight_controller.cpp` |
| `lsdc_fusion_repub` | `src/localization/fusion_repub.cpp` |
| `lsdc_global_match` | `src/localization/global_match.cpp` |
| `lsdc_rtk2pose` | `src/RTK/rtk2pose.cpp` |
| `lsdc_repub_gnss` | `src/RTK/repub_gnss.cpp` |
| `lsdc_save_result` | `src/LIO/save_result.cpp` |

- 消息头文件：`devel/include/lsdc_slam/Pose6D.h`、`devel/include/lsdc_slam/bywire_chassis_state.h`（由 `msg/` 生成）。

## 7. 常见报错及处理

| 现象（依据） | 处理方式 |
|---|---|
| `find_package(livox_ros_driver)` 失败（依赖来自 `CMakeLists.txt:61`） | 将 `livox_ros_driver` 源码放入 `/ws/src` 后重新配置构建；该包名与源码目录名一致，catkin 按目录发现 |
| `find_package(GeographicLib)` 失败（`CMakeLists.txt:45`） | 安装 `libgeographic-dev`；镜像已内置（`Spikive-PGO/docker/Dockerfile:22`）。自建镜像时执行 `apt-get install -y libgeographic-dev` |
| `find_package(PCL 1.8)` 失败（`CMakeLists.txt:70`） | 安装 `libpcl-dev`（镜像经 `ros-noetic-pcl-ros` 已带入 PCL 1.10） |
| 缺少 `matplotlibcpp.h`（`CMakeLists.txt:48`） | 该头文件位于包内 `include/matplotlibcpp.h`；删除或移出包会直接导致此错误 |
| 编译日志出现重复的 `-std=c++14` 选项 | 来自 `CMakeLists.txt:8-9` 的两行重复 `ADD_COMPILE_OPTIONS` 与第 18 行的 `CMAKE_CXX_FLAGS` 追加，不影响构建结果 |
| 构建日志打印 `core for MP: 3` 等 | `CMakeLists.txt:21-38` 按主机核数定义 `MP_EN` 与 `MP_PROC_NUM` 宏，属正常构建输出 |

## 8. 源码级注意项（非报错）

- `rs_velodyne` 目标链接 `${OpenCV_LIBRARIES}`（`CMakeLists.txt:102`），但本文件未执行 `find_package(OpenCV)`；在未预定义该变量的环境中，变量为空，不影响链接，但属源码事实 [待确认]。
- `laserMapping.cpp:882` 直接读取 `argv[1]`，无默认值与边界检查；launch 不传 `args` 时的行为见 `commandline.md` 第 3.4 节 [待确认]。

## 9. 待确认项（本文件范围）

1. SLAM 源码装配进 `/ws/src` 的官方操作步骤（交付包内无脚本支撑）。
2. 仅构建 `lsdc_slam` 时使用的 catkin_make 白名单命令形式。
3. `rs_velodyne` 链接 `${OpenCV_LIBRARIES}` 但未 `find_package(OpenCV)` 的意图。

以上均汇总至 `docs/zh/appendix/pending-items.md`。
