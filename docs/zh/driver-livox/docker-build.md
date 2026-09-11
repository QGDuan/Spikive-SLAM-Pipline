# 配套驱动模块 Docker 环境编译说明

| 项 | 值 |
|---|---|
| 模块名 | 配套驱动（livox_ros_driver） |
| 适用版本 | `livox_ros_driver` git `master` @ `3d240d5`（2.6.0） |
| 最后更新 | 2026-09-10 |

## 1. 基本事实

- 官方仓库无 Dockerfile、无独立构建脚本。
- 本项目在 PGO 模块的镜像 `spikive-slam:btc-noetic`（`Spikive-PGO/docker/Dockerfile`）内编译运行。该镜像已源码安装 Livox-SDK v2.3.0（`cmake --install` 默认前缀 `/usr/local`）。
- 本包是 catkin 包，与 `Spikive-SLAM`（依赖本包）、`Spikive-PGO` 在同一工作区构建。

## 2. 依赖清单

依据 `livox_ros_driver/livox_ros_driver/package.xml` 与 `CMakeLists.txt`：

| 依赖 | 说明 |
|---|---|
| Livox-SDK | 静态库 `liblivox_sdk_static.a`；`CMakeLists.txt:86` 在 `/usr/local/lib` 查找 |
| Boost ≥ 1.54 | `system`、`thread`、`chrono` |
| catkin 组件 | `roscpp`、`rospy`、`sensor_msgs`、`std_msgs`、`message_generation`、`rosbag`、`pcl_ros` |
| PCL | `find_package(PCL)` |
| apr-1 | pkg-config 查找 |

编译标准 C++11；未指定 `CMAKE_BUILD_TYPE` 时强制为 `Release`（`CMakeLists.txt:74-75`）。

## 3. SDK 自动获取行为

`CMakeLists.txt:86-114`：在 `/usr/local/lib` 找不到 `liblivox_sdk_static.a` 时，配置阶段自动执行：

```bash
git clone https://github.com/Livox-SDK/Livox-SDK.git <包源码目录>/Livox-SDK
cd <包源码目录>/Livox-SDK/build && cmake .. && make
```

然后链接 `Livox-SDK/build/sdk_core`。该行为需要构建机可访问 GitHub。本项目的 PGO 镜像已预装 SDK v2.3.0，不会触发此分支。

## 4. 构建命令

与 SLAM 模块共用工作区与命令（见 `../slam/docker-build.md`）：

```bash
catkin_make -j4 -DCMAKE_BUILD_TYPE=Release -DCATKIN_WHITELIST_PACKAGES= \
  -DCMAKE_PREFIX_PATH=/opt/spikive\;/opt/ros/noetic \
  -DCeres_DIR=/opt/spikive/lib/cmake/Ceres \
  -DGTSAM_DIR=/opt/spikive/lib/cmake/GTSAM
```

仅构建本包：

```bash
catkin_make --only-pkg-with-deps livox_ros_driver
```

（`--only-pkg-with-deps` 为 catkin_make 标准选项，实际使用方式以现场验证为准 [待确认]。）

## 5. 环境变量

| 变量 | 值 | 来源 |
|---|---|---|
| `CMAKE_PREFIX_PATH` | `/opt/spikive:/opt/ros/noetic` | 镜像 entrypoint / dev.sh |
| `LD_LIBRARY_PATH` | `/opt/spikive/lib` | 镜像 Dockerfile |
| `ROS_DISTRO` | `noetic` | 镜像 Dockerfile |

Livox-SDK 安装于 `/usr/local`（默认前缀），不依赖上述变量。

## 6. 编译产物位置

- 可执行：`devel/lib/livox_ros_driver/livox_ros_driver_node`
- 消息头：`devel/include/livox_ros_driver/CustomMsg.h`、`CustomPoint.h`
- 安装内容：`launch/`、`config/` 至 `share/livox_ros_driver/`

## 7. 常见报错及处理

| 现象（依据） | 处理方式 |
|---|---|
| 配置期打印 `Download Livox-SDK from github and build&install it please!`（`CMakeLists.txt:91-93`）并尝试自动 clone | 构建机无 `/usr/local/lib/liblivox_sdk_static.a` 且需网络；预装 SDK 或允许该自动步骤 |
| 运行时启动即退出，日志提示 SDK 主版本不足（`livox_ros_driver.cpp:40,62-66`） | 安装 Livox-SDK 2.x；本项目镜像为 v2.3.0 |
| `lsdc_slam` 配置失败：找不到 `livox_ros_driver` 包 | 工作区 `/ws/src` 缺少本包；放入源码后重新配置（依赖自 `Spikive-SLAM/CMakeLists.txt:61`） |
| 编译输出出现 `comon/rapdidxml` 路径拼写警告 | `CMakeLists.txt` 中 `target_include_directories` 的拼写与上游一致，不影响构建（common/rapidxml 头文件经其它路径可寻） |

## 8. 版本说明

- `README.md`/`README_CN.md` 声明支持 Ubuntu 14.04/16.04/18.04 与 ROS indigo/kinetic/melodic；
- 本项目实际构建与运行环境为 Ubuntu 20.04 容器 + ROS Noetic；
- 该组合不在官方 README 声明范围内，属本项目实测环境 [待确认 官方未声明 noetic 支持]。

## 9. 待确认项（本文件范围）

1. `catkin_make --only-pkg-with-deps` 命令形式。
2. ROS Noetic 组合不在官方支持声明内。

以上均汇总至 `docs/zh/appendix/pending-items.md`。
