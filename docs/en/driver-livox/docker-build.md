# Bundled Driver Module — Docker Build Instructions

| Item | Value |
|---|---|
| Module | Bundled driver (livox_ros_driver) |
| Applicable version | `livox_ros_driver` git `master` @ `3d240d5` (2.6.0) |
| Last updated | 2026-09-10 |

## 1. Basic facts

- The upstream repository has no Dockerfile and no standalone build script.
- In this project it is built and run inside the PGO module image `spikive-slam:btc-noetic` (`Spikive-PGO/docker/Dockerfile`). That image builds Livox-SDK v2.3.0 from source (`cmake --install` default prefix `/usr/local`).
- This package is a catkin package built in the same workspace as `Spikive-SLAM` (which depends on it) and `Spikive-PGO`.

## 2. Dependency list

Per `livox_ros_driver/livox_ros_driver/package.xml` and `CMakeLists.txt`:

| Dependency | Notes |
|---|---|
| Livox-SDK | static library `liblivox_sdk_static.a`; `CMakeLists.txt:86` searches `/usr/local/lib` |
| Boost ≥ 1.54 | `system`, `thread`, `chrono` |
| catkin components | `roscpp`, `rospy`, `sensor_msgs`, `std_msgs`, `message_generation`, `rosbag`, `pcl_ros` |
| PCL | `find_package(PCL)` |
| apr-1 | pkg-config lookup |

C++11; `CMAKE_BUILD_TYPE` is forced to `Release` when unset (`CMakeLists.txt:74-75`).

## 3. Automatic SDK acquisition behavior

`CMakeLists.txt:86-114`: when `liblivox_sdk_static.a` is not found in `/usr/local/lib`, the configure stage automatically runs:

```bash
git clone https://github.com/Livox-SDK/Livox-SDK.git <package source dir>/Livox-SDK
cd <package source dir>/Livox-SDK/build && cmake .. && make
```

then links `Livox-SDK/build/sdk_core`. This branch requires GitHub access from the build machine. This project's PGO image has SDK v2.3.0 preinstalled, so the branch is not triggered.

## 4. Build command

Shares the workspace and command of the SLAM module (see `../slam/docker-build.md`):

```bash
catkin_make -j4 -DCMAKE_BUILD_TYPE=Release -DCATKIN_WHITELIST_PACKAGES= \
  -DCMAKE_PREFIX_PATH=/opt/spikive\;/opt/ros/noetic \
  -DCeres_DIR=/opt/spikive/lib/cmake/Ceres \
  -DGTSAM_DIR=/opt/spikive/lib/cmake/GTSAM
```

To build only this package:

```bash
catkin_make --only-pkg-with-deps livox_ros_driver
```

(`--only-pkg-with-deps` is a standard catkin_make option; verify the exact usage on site [TBC].)

## 5. Environment variables

| Variable | Value | Source |
|---|---|---|
| `CMAKE_PREFIX_PATH` | `/opt/spikive:/opt/ros/noetic` | image entrypoint / dev.sh |
| `LD_LIBRARY_PATH` | `/opt/spikive/lib` | image Dockerfile |
| `ROS_DISTRO` | `noetic` | image Dockerfile |

Livox-SDK installs to `/usr/local` (default prefix) and does not depend on these variables.

## 6. Build artifact locations

- executable: `devel/lib/livox_ros_driver/livox_ros_driver_node`
- message headers: `devel/include/livox_ros_driver/CustomMsg.h`, `CustomPoint.h`
- installed content: `launch/`, `config/` to `share/livox_ros_driver/`

## 7. Common errors and handling

| Symptom (basis) | Handling |
|---|---|
| configure prints `Download Livox-SDK from github and build&install it please!` (`CMakeLists.txt:91-93`) and attempts an automatic clone | the build machine lacks `/usr/local/lib/liblivox_sdk_static.a` and needs network; preinstall the SDK or allow the automatic step |
| process exits at startup with a log about insufficient SDK major version (`livox_ros_driver.cpp:40,62-66`) | install Livox-SDK 2.x; this project's image uses v2.3.0 |
| `lsdc_slam` configure fails: package `livox_ros_driver` not found | the workspace `/ws/src` lacks this package; add the sources and reconfigure (dependency from `Spikive-SLAM/CMakeLists.txt:61`) |
| build output shows the `comon/rapdidxml` path spelling warning | the spelling in `target_include_directories` matches upstream and does not affect the build (the common/rapidxml headers are found via other paths) |

## 8. Version note

- `README.md`/`README_CN.md` declare support for Ubuntu 14.04/16.04/18.04 and ROS indigo/kinetic/melodic;
- this project actually builds and runs in an Ubuntu 20.04 container with ROS Noetic;
- that combination is outside the upstream README's declared support and is this project's measured environment [TBC: noetic support is not declared upstream].

## 9. Pending items (scope of this page)

1. The `catkin_make --only-pkg-with-deps` command form.
2. The ROS Noetic combination is outside the upstream support declaration.

All are collected in `docs/en/appendix/pending-items.md`.
