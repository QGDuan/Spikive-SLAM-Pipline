# Bundled Driver Module (livox_ros_driver)

| Item | Value |
|---|---|
| Module | Bundled driver (Livox LiDAR ROS driver) |
| Applicable version | `livox_ros_driver` git `master` @ `3d240d5` (unmodified upstream clone, driver version 2.6.0) |
| Last updated | 2026-09-10 |

## 1. Module position

This module is an unmodified clone of the Livox-SDK official `livox_ros_driver` repository, version 2.6.0 (`livox_ros_driver/livox_ros_driver/include/livox_ros_driver.h:28-30`). It receives data from Livox LiDARs (direct connection, Hub, or lvx file) and publishes point-cloud and IMU topics consumed by the SLAM module.

Evidence of being unmodified:

- local git HEAD and the official master are both `3d240d5666129e1a3052e78ee8487a04b08fdda3`; `sources.repos` pins the same commit;
- the local file list matches the git tree of that commit (no added or removed files);
- spot-checks of `config/livox_lidar_config.json` and `config/livox_hub_config.json` are character-identical to upstream at the same commit.

## 2. Package information

| Item | Value |
|---|---|
| Source directory | `livox_ros_driver/` |
| ROS package | `livox_ros_driver` (directory `livox_ros_driver/livox_ros_driver/`) |
| Version | 2.6.0 (header macro); `package.xml` declares 2.0.0 |
| Node name | `livox_lidar_publisher` (`livox_ros_driver.cpp:54`) |
| Executable | `livox_ros_driver_node` |
| License | MIT |
| Runtime requirement | Livox SDK major version ≥ 2 (`livox_ros_driver.cpp:40,62`) |

## 3. File list

| File / directory | Responsibility |
|---|---|
| `livox_ros_driver/CMakeLists.txt` | builds `livox_ros_driver_node`; generates `CustomMsg`, `CustomPoint`; finds or clones Livox-SDK automatically |
| `livox_ros_driver/package.xml` | package dependencies (roscpp, rospy, sensor_msgs, std_msgs, message_generation, rosbag, pcl_ros, apr) |
| `livox_ros_driver/livox_ros_driver/` | sources: `livox_ros_driver.cpp` (main), `lds.{cpp,h}` (device base), `lds_lidar.{cpp,h}` (direct source), `lds_hub.{cpp,h}` (Hub source), `lds_lvx.{cpp,h}` (lvx source), `lddc.{cpp,h}` (cloud dispatch), `ldq.{cpp,h}` (cloud queue), `lvx_file.{cpp,h}` (lvx parsing) |
| `livox_ros_driver/common/comm/` | `comm_protocol`, `sdk_protocol`, `gps_protocol`, `comm_device.h` (SDK communication protocols) |
| `livox_ros_driver/common/FastCRC/`, `rapidjson/`, `rapidxml/` | third-party CRC/JSON/XML libraries |
| `livox_ros_driver/timesync/` | `timesync.{cpp,h}`, `user_uart/` (GPS timestamp sync) |
| `livox_ros_driver/launch/` | 9 launch files (see `commandline.md`) |
| `livox_ros_driver/config/` | `livox_lidar_config.json` (direct), `livox_hub_config.json` (Hub), 2 rviz configs |
| `livox_ros_driver/msg/` | `CustomMsg.msg`, `CustomPoint.msg` |
| `README.md`, `README_CN.md` | official notes (Chinese version `README_CN.md`) |

## 4. Sub-documents

| File | Content |
|---|---|
| `commandline.md` | launch overview, commands and parameters, config JSON, topics, interpretation |
| `docker-build.md` | build environment, SDK dependency, build commands, artifacts, common errors |
| `architecture.md` | source structure, core classes, data flow, message formats, module interfaces |

## 5. Quick start

```bash
# inside the container (workspace contains the livox_ros_driver sources; build: see docker-build.md)
source /ws/devel/setup.bash
# direct LiDAR, PointCloud2 output + RViz
roslaunch livox_ros_driver livox_lidar_rviz.launch
# or with explicit broadcast codes
roslaunch livox_ros_driver livox_lidar_rviz.launch bd_list:="0TFDG3B006H2Z11&1HDDG8M00100191"
```

## 6. Interfaces with other modules

- Output: `livox/lidar` (`multi_topic=0`) or `livox/lidar_<broadcast_code>` (`multi_topic=1`); IMU topic `livox/imu`.
- Consumer: `lsdc_mapping` of the SLAM module subscribes to the cloud via `{prefix}common/lid_topic` (`CustomMsg` or `PointCloud2`) and to the IMU via `common/imu_topic`.
- Build dependency: `lsdc_slam`'s `CMakeLists.txt` depends on this package (`find_package(catkin COMPONENTS ... livox_ros_driver ...)`) and its message header `<livox_ros_driver/CustomMsg.h>`, so both packages must be in the same catkin workspace.
