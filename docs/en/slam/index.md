# SLAM Module (lsdc_slam)

| Item | Value |
|---|---|
| Module | SLAM (LIO frontend + Localization + RTK chain) |
| Applicable version | `Spikive-SLAM` repo git `main` @ `c86c818`; ROS package `lsdc_slam`, `package.xml` declares version `0.0.0` |
| Last updated | 2026-09-10 |

## 1. Module position

This module is a ROS1 (Noetic) catkin package named `lsdc_slam`, directory `Spikive-SLAM`. The source derives from FAST-LIO2 (hku-mars). The repository's own `docs/architecture.md` divides the system into five layers:

| Layer | Nodes |
|---|---|
| Sensor preprocessing | `lsdc_ins_preprocess`, `rs_velodyne` |
| LIO mapping | `lsdc_mapping` |
| RTK initialization | `lsdc_rtk2pose`, `lsdc_repub_gnss` |
| Motion Control calibration adapter | `lsdc_flight_controller` |
| Localization / world output | `lsdc_global_match`, `lsdc_fusion_repub` |

## 2. Package information

| Item | Value |
|---|---|
| Source directory | `Spikive-SLAM/` |
| ROS package | `lsdc_slam` |
| Build system | catkin, `CMakeLists.txt` requires CMake ≥ 2.8.3, C++14 |
| Build products | 9 executables (see `architecture.md`) |
| Standalone Docker files | None (compilation runs inside the PGO module image and catkin workspace; see `docker-build.md`) |
| In-repo docs | `docs/architecture.md`, `docs/data_flow.md`, `docs/coordinate_frames.md`, `docs/slam_system.drawio` |

## 3. File list

| File / directory | Responsibility |
|---|---|
| `CMakeLists.txt` | Builds 9 executables and generates 2 custom messages |
| `package.xml` | Package dependency declarations |
| `launch/` | 8 launch files (scenarios in `commandline.md`) |
| `config/` | 9 yaml parameter files (common + per-LiDAR models) |
| `src/LIO/` | LIO frontend: `laserMapping.cpp`, `IMU_Processing.hpp`, `preprocess.h/.cpp`, `pcl_preprocess.hpp`, `save_result.cpp` |
| `src/localization/` | `flight_controller.cpp`, `fusion_repub.cpp`, `global_match.cpp` |
| `src/preprocess/` | `ins_preprocess.cpp`, `rs_to_velodyne.cpp`, `pcl_struct.hpp` (see the preprocess module docs) |
| `src/RTK/` | `rtk2pose.cpp`, `repub_gnss.cpp` |
| `include/` | Common headers; third party: `ikd-Tree/` (incremental KD-tree), `IKFoM_toolkit/` (manifold Kalman filter toolkit), `Commons/` (geographic header set), `matplotlibcpp.h` (single-header library) |
| `msg/` | `Pose6D.msg`, `bywire_chassis_state.msg` |
| `docs/` | Architecture, data flow, coordinate-frame notes (shipped with the repo) |
| `Log/` | Debug log directory; `plot.py` (matplotlib plot script), `fast_lio_time_log_analysis.m` (MATLAB timing script), `guide.md` |
| `Lsdc_Repub/` | RTK pose record directory (`init_pose.txt` is a historical sample; runtime reads/writes `last_pose.txt`, `pose_init.txt`) |
| `rviz_cfg/` | `loam_livox.rviz`, `localization.rviz` |

## 4. Sub-documents

| File | Content |
|---|---|
| `commandline.md` | Launch overview, commands and parameters, topics, result interpretation |
| `docker-build.md` | Image and dependencies, environment variables, build commands, artifacts, common errors |
| `architecture.md` | Directory responsibilities, core classes/functions/structures, call chains, interfaces, key configuration |

## 5. Quick start

```bash
# Inside the container (image and workspace setup: see docker-build.md)
source /ws/devel/setup.bash
roslaunch lsdc_slam mapping_livox.launch
```

After startup, interpret the results per `commandline.md` section 6.

## 6. Interfaces with other modules

- Input: LiDAR and IMU topics published by `livox_ros_driver` (see the driver module docs).
- Output to PGOBA: `/cloud_registered_body` and `/Odometry` (`Spikive-PGO/launch/slam_btc.launch` configures `online.launch` inputs to these two topics).
- Output to flight controller / ground station: `/drone_{id}_*` stable topics and `/mavros/*` topics published by `lsdc_fusion_repub`.
- Full-pipeline data flow: `docs/en/appendix/system-overview.md`.
