# SLAM Module — Docker Build Instructions

| Item | Value |
|---|---|
| Module | SLAM |
| Applicable version | `Spikive-SLAM` git `main` @ `c86c818` (`lsdc_slam` 0.0.0) |
| Last updated | 2026-09-10 |

## 1. Basic facts

- The `Spikive-SLAM` repository has no standalone `Dockerfile`, no build script, and no `docker/` directory.
- Compilation happens inside the image and catkin workspace provided by the PGO module. The image is `spikive-slam:btc-noetic`, built by `Spikive-PGO/docker/Dockerfile` (build command in the PGOBA module's `docker-build.md`).
- Image build parameters (`Spikive-PGO/docker/Dockerfile`):
  - Base image: Ubuntu focal (Huawei Cloud mirror address, overridable via `BASE_IMAGE`);
  - apt packages: `build-essential`, `cmake`, `libeigen3-dev=3.3.7-2`, `libgeographic-dev`, `libtbb-dev`, `python3-dev`, `python3-numpy`, `python3-yaml`, `python3-catkin-tools`, `libapr1-dev`, `ros-noetic-ros-base`, `ros-noetic-pcl-ros`, `ros-noetic-pcl-conversions`, `ros-noetic-mavros`, `ros-noetic-mavros-msgs`, `ros-noetic-rosbag`, `ros-noetic-rviz`, `ros-noetic-rostest`, and others;
  - Built from source: Ceres 2.1.0 (commit `783637a6ed285abc6c57b16ccd968c594a91b35f`), GTSAM 4.2.0 (commit `4f66a491ffc83cf092d0d818b11dc35135521612`), Livox-SDK v2.3.0, all installed to `/opt/spikive`;
  - User: `developer` (UID/GID 1000); entrypoint `/spikive-entrypoint.sh` (sources ROS and `/ws/devel/setup.bash`, then runs the command).

## 2. Dependencies of this package

Per `Spikive-SLAM/CMakeLists.txt` and `package.xml`:

| Dependency | Source | Notes |
|---|---|---|
| catkin components | `CMakeLists.txt:50-66` | `geometry_msgs`, `nav_msgs`, `sensor_msgs`, `roscpp`, `rospy`, `std_msgs`, `pcl_ros`, `tf`, `mavros`, `mavros_msgs`, `livox_ros_driver`, `message_generation`, `eigen_conversions`, `visualization_msgs`, `rosbag` |
| Eigen3 | `CMakeLists.txt:68` | `find_package(Eigen3 REQUIRED)` |
| Ceres | `CMakeLists.txt:69` | `find_package(Ceres REQUIRED)` |
| PCL | `CMakeLists.txt:70` | `find_package(PCL 1.8 REQUIRED)` |
| GeographicLib | `CMakeLists.txt:45` | `find_package(GeographicLib REQUIRED)`; finder at `/usr/share/cmake/geographiclib` |
| PythonLibs | `CMakeLists.txt:47` | `find_package(PythonLibs REQUIRED)` |
| matplotlibcpp.h | `CMakeLists.txt:48` | `find_path(MATPLOTLIB_CPP_INCLUDE_DIRS "matplotlibcpp.h")`; header shipped in-package at `include/matplotlibcpp.h` |

`livox_ros_driver` is a ROS package dependency: the catkin workspace's `/ws/src` must contain the `livox_ros_driver` source package, otherwise this package cannot be configured.

## 3. Workspace assembly

- `Spikive-PGO/scripts/dev.sh` only mounts the `Spikive-PGO` repository to `/ws/src/Spikive-PGO`; it does not mount `Spikive-SLAM` or `livox_ros_driver`.
- The delivery package provides no script that assembles SLAM sources into `/ws/src`. In scenarios that include SLAM (such as `Spikive-PGO/launch/slam_btc.launch`), the workspace must contain both `livox_ros_driver` and `Spikive-SLAM` sources; the exact assembly steps are [TBC].

## 4. Environment variables

| Variable | Value | Source |
|---|---|---|
| `CMAKE_PREFIX_PATH` | `/opt/spikive:/opt/ros/noetic` | `docker/entrypoint.sh`, `scripts/dev.sh` |
| `Ceres_DIR` | `/opt/spikive/lib/cmake/Ceres` | `scripts/dev.sh` build command |
| `GTSAM_DIR` | `/opt/spikive/lib/cmake/GTSAM` | `scripts/dev.sh` build command |
| `LD_LIBRARY_PATH` | `/opt/spikive/lib` | `docker/Dockerfile:61` |
| `ROS_DISTRO` | `noetic` | `docker/Dockerfile:62` |

## 5. Build command

In-image catkin build command (taken from the `build` subcommand of `Spikive-PGO/scripts/dev.sh`):

```bash
catkin_make -j4 -DCMAKE_BUILD_TYPE=Release -DCATKIN_WHITELIST_PACKAGES= \
  -DCMAKE_PREFIX_PATH=/opt/spikive\;/opt/ros/noetic \
  -DCeres_DIR=/opt/spikive/lib/cmake/Ceres \
  -DGTSAM_DIR=/opt/spikive/lib/cmake/GTSAM
```

The parallelism after `-j` can be adjusted with `BUILD_JOBS` (`dev.sh` default 4). If `/ws/src` also contains `Spikive-PGO`, this command builds `spikive_btc` as well; to build only this package, use `catkin_make --only-pkg-with-deps lsdc_slam` (a standard catkin_make option; verify the exact usage on site [TBC]).

## 6. Build artifact locations

- Executables under `devel/lib/lsdc_slam/`, 9 in total:

| Executable | Sources (`CMakeLists.txt` targets) |
|---|---|
| `lsdc_mapping` | `src/LIO/laserMapping.cpp`, `include/ikd-Tree/ikd_Tree.cpp`, `src/LIO/preprocess.cpp` |
| `lsdc_ins_preprocess` | `src/preprocess/ins_preprocess.cpp` |
| `rs_velodyne` | `src/preprocess/rs_to_velodyne.cpp` |
| `lsdc_flight_controller` | `src/localization/flight_controller.cpp` |
| `lsdc_fusion_repub` | `src/localization/fusion_repub.cpp` |
| `lsdc_global_match` | `src/localization/global_match.cpp` |
| `lsdc_rtk2pose` | `src/RTK/rtk2pose.cpp` |
| `lsdc_repub_gnss` | `src/RTK/repub_gnss.cpp` |
| `lsdc_save_result` | `src/LIO/save_result.cpp` |

- Message headers: `devel/include/lsdc_slam/Pose6D.h`, `devel/include/lsdc_slam/bywire_chassis_state.h` (generated from `msg/`).

## 7. Common errors and handling

| Symptom (basis) | Handling |
|---|---|
| `find_package(livox_ros_driver)` fails (dependency from `CMakeLists.txt:61`) | Put the `livox_ros_driver` sources into `/ws/src` and reconfigure; the package name matches the source directory name, discovered by catkin |
| `find_package(GeographicLib)` fails (`CMakeLists.txt:45`) | Install `libgeographic-dev`; already present in the image (`Spikive-PGO/docker/Dockerfile:22`). On a self-built image run `apt-get install -y libgeographic-dev` |
| `find_package(PCL 1.8)` fails (`CMakeLists.txt:70`) | Install `libpcl-dev` (the image brings PCL 1.10 via `ros-noetic-pcl-ros`) |
| Missing `matplotlibcpp.h` (`CMakeLists.txt:48`) | The header is shipped at `include/matplotlibcpp.h`; deleting or moving it out of the package causes this error |
| Build log shows repeated `-std=c++14` options | From the duplicated `ADD_COMPILE_OPTIONS` at `CMakeLists.txt:8-9` and the `CMAKE_CXX_FLAGS` append at line 18; does not affect the result |
| Build log prints `core for MP: 3` etc. | `CMakeLists.txt:21-38` defines `MP_EN` and `MP_PROC_NUM` macros from the host core count; normal build output |

## 8. Source-level notes (not errors)

- The `rs_velodyne` target links `${OpenCV_LIBRARIES}` (`CMakeLists.txt:102`) but the file never runs `find_package(OpenCV)`; in an environment where the variable is undefined it is empty and linking is unaffected — a source fact [TBC].
- `laserMapping.cpp:882` reads `argv[1]` directly with no default and no bounds check; behavior when a launch file passes no `args` is described in `commandline.md` 3.4 [TBC].

## 9. Pending items (scope of this page)

1. The official steps for assembling SLAM sources into `/ws/src` (no script in the delivery package).
2. The exact catkin_make whitelist command for building only `lsdc_slam`.
3. The intent behind `rs_velodyne` linking `${OpenCV_LIBRARIES}` without `find_package(OpenCV)`.

All are collected in `docs/en/appendix/pending-items.md`.
