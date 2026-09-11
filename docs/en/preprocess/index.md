# preprocess Module

| Item | Value |
|---|---|
| Module | preprocess (sensor preprocessing: INS sync, Robosense conversion, scan preprocessing) |
| Applicable version | Follows `Spikive-SLAM` git `main` @ `c86c818` (no standalone repository) |
| Last updated | 2026-09-10 |

## 1. Module position

This module is a subsystem inside the `lsdc_slam` package; it has no standalone repository and no standalone build target file. By code location it splits into three blocks:

| Block | Source location | Build |
|---|---|---|
| INS GPS/IMU preprocessing | `Spikive-SLAM/src/preprocess/ins_preprocess.cpp` | standalone executable `lsdc_ins_preprocess` |
| Robosense→Velodyne conversion | `Spikive-SLAM/src/preprocess/rs_to_velodyne.cpp` | standalone executable `rs_velodyne` |
| Scan preprocessing and multi-LiDAR fusion | `Spikive-SLAM/src/LIO/preprocess.h`, `preprocess.cpp`, `pcl_preprocess.hpp` | compiled into `lsdc_mapping` (see the SLAM module's `architecture.md`) |

The first two blocks correspond to the "sensor preprocessing" layer in the repository's `docs/architecture.md`; the third block is an internal stage of the LIO frontend.

## 2. File list

| File | Responsibility |
|---|---|
| `src/preprocess/ins_preprocess.cpp` | node `ins_preprocess`: GPS/IMU time synchronization; publishes `/lsdc_rtk` |
| `src/preprocess/rs_to_velodyne.cpp` | node `rs_converter`: Robosense extrinsic transform, ring and time remapping; publishes `/velodyne_points` |
| `src/preprocess/pcl_struct.hpp` | Point structures: `RsPointXYZIRT`, `VelodynePointXYZIRT`, `VelodynePointXYZIR` and their PCL registrations |
| `src/LIO/preprocess.h` | `Preprocess` class declaration; `PointType`, `LID_TYPE`, `TIME_UNIT`, `Feature` enums; `velodyne_ros::Point`, `ouster_ros::Point`, `lx_ros::Point` point structures |
| `src/LIO/preprocess.cpp` | `Preprocess` implementation: Avia/Ouster/Velodyne/S10U handlers, feature extraction |
| `src/LIO/pcl_preprocess.hpp` | namespace `pcl_pre`: class `PclPreprocess`, `fusePclMsg`, `initPclPrepreocess` (multi-LiDAR fusion) |

## 3. Sub-documents

| File | Content |
|---|---|
| `commandline.md` | Startup commands for the two standalone nodes, parameters, topics, result interpretation |
| `docker-build.md` | Build method (same package as SLAM), dependencies, artifacts, common errors |
| `architecture.md` | Core classes/functions/structures of the three blocks, call chains, key configuration |

## 4. Quick start

```bash
# Inside the container (build: see docker-build.md)
source /ws/devel/setup.bash
# INS preprocessing (subscribes to /rtk_gps and /rtk_imu)
rosrun lsdc_slam lsdc_ins_preprocess
# Robosense conversion (subscribes to /rslidar_points)
rosrun lsdc_slam rs_velodyne
```

Scan preprocessing runs inside `lsdc_mapping`, started with `roslaunch lsdc_slam mapping_livox.launch` (or another mapping launch file); it has no standalone entry point.

## 5. Interfaces with other modules

- `lsdc_ins_preprocess` publishes `/lsdc_rtk`, consumed by `lsdc_rtk2pose` of the SLAM module.
- `rs_velodyne` publishes `/velodyne_points`, consumed by `lsdc_mapping` in the velodyne configuration.
- `Preprocess`/`PclPreprocess` runs inside the `lsdc_mapping` process; input is `livox_ros_driver` `CustomMsg` or standard `PointCloud2`.
