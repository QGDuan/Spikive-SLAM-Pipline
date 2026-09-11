# 配套驱动模块（livox_ros_driver）

| 项 | 值 |
|---|---|
| 模块名 | 配套驱动（Livox 雷达 ROS 驱动） |
| 适用版本 | `livox_ros_driver` git `master` @ `3d240d5`（官方仓库未修改克隆，驱动版本 2.6.0） |
| 最后更新 | 2026-09-10 |

## 1. 模块定位

本模块是 Livox-SDK 官方 `livox_ros_driver` 仓库的未修改克隆，版本 2.6.0（`livox_ros_driver/livox_ros_driver/include/livox_ros_driver.h:28-30`）。职责：接收 Livox 雷达（直连、Hub 或 lvx 文件）数据，发布点云与 IMU 话题，供 SLAM 模块消费。

未修改依据：

- git HEAD 与官方仓库 master 均为 `3d240d5666129e1a3052e78ee8487a04b08fdda3`，`sources.repos` 锁定同提交；
- 本地文件清单与该提交的 git tree 一致（无增删文件）；
- 抽查 `config/livox_lidar_config.json`、`config/livox_hub_config.json` 与官方同提交内容逐字一致。

## 2. 包信息

| 项 | 值 |
|---|---|
| 源码目录 | `livox_ros_driver/` |
| ROS 包名 | `livox_ros_driver`（目录 `livox_ros_driver/livox_ros_driver/`） |
| 版本 | 2.6.0（头文件宏）；`package.xml` 声明 2.0.0 |
| 节点名 | `livox_lidar_publisher`（`livox_ros_driver.cpp:54`） |
| 可执行 | `livox_ros_driver_node` |
| 许可证 | MIT |
| 运行时要求 | Livox SDK 主版本 ≥ 2（`livox_ros_driver.cpp:40,62`） |

## 3. 文件清单

| 文件 / 目录 | 职责 |
|---|---|
| `livox_ros_driver/CMakeLists.txt` | 构建 `livox_ros_driver_node`；生成 `CustomMsg`、`CustomPoint`；自动查找/克隆 Livox-SDK |
| `livox_ros_driver/package.xml` | 包依赖（roscpp、rospy、sensor_msgs、std_msgs、message_generation、rosbag、pcl_ros、apr） |
| `livox_ros_driver/livox_ros_driver/` | 源码：`livox_ros_driver.cpp`（main）、`lds.{cpp,h}`（设备基类）、`lds_lidar.{cpp,h}`（直连数据源）、`lds_hub.{cpp,h}`（Hub 数据源）、`lds_lvx.{cpp,h}`（lvx 数据源）、`lddc.{cpp,h}`（点云分发）、`ldq.{cpp,h}`（点云队列）、`lvx_file.{cpp,h}`（lvx 解析） |
| `livox_ros_driver/common/comm/` | `comm_protocol`、`sdk_protocol`、`gps_protocol`、`comm_device.h`（与 SDK 通信协议） |
| `livox_ros_driver/common/FastCRC/`、`rapidjson/`、`rapidxml/` | 第三方 CRC/JSON/XML 库 |
| `livox_ros_driver/timesync/` | `timesync.{cpp,h}`、`user_uart/`（GPS 时间戳同步） |
| `livox_ros_driver/launch/` | 9 个 launch（见 `commandline.md`） |
| `livox_ros_driver/config/` | `livox_lidar_config.json`（直连）、`livox_hub_config.json`（Hub）、2 个 rviz 配置 |
| `livox_ros_driver/msg/` | `CustomMsg.msg`、`CustomPoint.msg` |
| `README.md`、`README_CN.md` | 官方说明（中文版为 `README_CN.md`） |

## 4. 子文档

| 文件 | 内容 |
|---|---|
| `commandline.md` | launch 一览、命令与参数、配置 JSON、话题、判读 |
| `docker-build.md` | 编译环境、SDK 依赖、构建命令、产物、常见报错 |
| `architecture.md` | 源码结构、核心类、数据流、消息格式、模块间接口 |

## 5. 快速上手

```bash
# 容器内（工作区包含 livox_ros_driver 源码，编译见 docker-build.md）
source /ws/devel/setup.bash
# 直连雷达，PointCloud2 输出 + RViz
roslaunch livox_ros_driver livox_lidar_rviz.launch
# 或指定广播码
roslaunch livox_ros_driver livox_lidar_rviz.launch bd_list:="0TFDG3B006H2Z11&1HDDG8M00100191"
```

## 6. 与其他模块的接口

- 输出：`livox/lidar`（`multi_topic=0`）或 `livox/lidar_<广播码>`（`multi_topic=1`）；IMU 话题 `livox/imu`。
- 消费者：SLAM 模块的 `lsdc_mapping` 经 `{前缀}common/lid_topic` 订阅点云（`CustomMsg` 或 `PointCloud2`），`common/imu_topic` 订阅 IMU。
- 编译依赖：`lsdc_slam` 的 `CMakeLists.txt` 依赖本包（`find_package(catkin COMPONENTS ... livox_ros_driver ...)`）及其消息头 `<livox_ros_driver/CustomMsg.h>`，因此两包需在同一 catkin 工作区。
