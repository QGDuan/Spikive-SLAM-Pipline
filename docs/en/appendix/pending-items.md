# Pending Items

| Item | Value |
|---|---|
| Module | Appendix (cross-module) |
| Applicable version | all 5 modules (versions in the index section 2) |
| Last updated | 2026-09-10 |

This list collects all `[待确认]` / `[TBC]` items marked in the documentation. Each item states: ID, module, location, issue, and the confirmation action needed. After confirmation, update the corresponding module pages and remove the entry.

## 1. SLAM module

| # | Location | Issue | Confirmation action needed |
|---|---|---|---|
| S-1 | `Spikive-SLAM/launch/mapping_velodyne.launch:23`, `launch/cxzn_arrange.launch:14` | the launch files reference executable `lsdc_init_pose` (node name `init_pose`), but `CMakeLists.txt` has no such build target and the repo has no matching source file | confirm the origin of this executable (legacy artifact, should be removed from the launch files, or provided by some package) |
| S-2 | `Spikive-SLAM/launch/mapping_velodyne.launch:33`, `launch/cxzn_arrange.launch:24` | reference node `lsdc_forward_node` of external package `lsdc_forward` (parameters `remote_zmq_port_loc=7657`, `ros_sub_topic=/global_pose`); the package is outside the delivery scope | confirm the delivery method and interface contract of `lsdc_forward` |
| S-3 | `Spikive-SLAM/launch/mapping_velodyne.launch:20` and `src/LIO/laserMapping.cpp:882` | that launch starts `lsdc_mapping` without `args`, while the code reads `argv[1]` directly with no default and no bounds check | confirm the actual runtime behavior of this combination (the LiDAR-type string parsed by `initPclPrepreocess` with an empty argument) |
| S-4 | `Spikive-SLAM/docs/data_flow.md` | the doc mentions `launch/uav.launch` and `config/config_a.yaml`, which do not exist in the current tree | confirm whether files are missing or the doc is outdated |
| S-5 | `Spikive-SLAM/src/LIO/save_result.cpp` | `legacyMain` (the ENU chain publishing `/Odometry_enu`, `/rtk_odom_enu`, `/pcl_map`) is kept commented out; `docs/coordinate_frames.md` states PGO reads `/Odometry_enu` and `/rtk_odom_enu` by default | confirm whether the current PGO chain depends on those ENU outputs and, if so, how to restore them |
| S-6 | the `Spikive-SLAM` repository overall | no standalone Dockerfile/build script; `Spikive-PGO/scripts/dev.sh` only mounts `Spikive-PGO`, not `Spikive-SLAM` or `livox_ros_driver` | confirm the official steps for assembling the SLAM and driver sources into `/ws/src` |
| S-7 | `Spikive-SLAM/CMakeLists.txt:102` | `rs_velodyne` links `${OpenCV_LIBRARIES}` but the file never runs `find_package(OpenCV)` | confirm the origin and value of that variable in the target build environment (currently treated as empty, which does not affect linking) |
| S-8 | docker-build pages of several modules | the command form `catkin_make --only-pkg-with-deps <package>` for building a single package | this is a standard catkin_make option but appears in no delivered script; fix it after on-site verification |

## 2. preprocess module

| # | Location | Issue | Confirmation action needed |
|---|---|---|---|
| P-1 | `Spikive-SLAM/config/velodyne.yaml:41-42` vs `src/preprocess/ins_preprocess.cpp:136-137` | the config uses `ins/ins_gps_topic` and `ins/ins_imu_topic`, while the node reads `ins/gps_topic` and `ins/imu_topic` | confirm which naming takes effect; fix the config or the code accordingly |
| P-2 | `Spikive-SLAM/src/preprocess/rs_to_velodyne.cpp:116-121` | the node reads `mapping/rs_to_avia_T/E/R`, but no delivered config file defines that group; the identity default currently applies | confirm whether the on-site Robosense-to-main-LiDAR calibration values need to be written into a config |

## 3. Bundled driver module

| # | Location | Issue | Confirmation action needed |
|---|---|---|---|
| D-1 | `livox_ros_driver/README.md` | upstream declares support for Ubuntu 14.04/16.04/18.04 and ROS indigo/kinetic/melodic; this project builds and runs in an Ubuntu 20.04 container with ROS Noetic | confirm whether the noetic acceptance result should be documented in writing (currently it is a measured environment, outside the upstream declaration) |

## 4. Cross-module

| # | Location | Issue | Confirmation action needed |
|---|---|---|---|
| C-1 | `sources.repos` | does not list the `Spikive-Pcl-Process` repository (the other 3 repositories and the livox driver are pinned) | confirm whether to add a PCL repository entry with a version pin |
| C-2 | `Spikive-SLAM/README.md` | it is the upstream FAST-LIO original README; package name and commands do not match this package (`lsdc_slam`) | confirm whether this documentation set serves as the reference or the file should be updated |
| C-3 | root `PGO_OPTIMIZATION_ROADMAP.md` | references `src/file_preprocess.hpp:27-72` (legacy release@85bc6d0), which does not exist under the current `Spikive-PGO/src/` | confirm whether the reference targets a historical version and whether the current baseline is applicable |
| C-4 | `Spikive-PGO/README.md` | states that `slam_btc.launch`, the Livox replay and the Guigang launch require an external workspace with a configured frontend/driver, and `dev.sh` does not mount frontend sources | confirm the standard workspace assembly for frontend-included scenarios (same as S-6) |
| C-5 | git state of the repositories | the delivered package keeps `.git` in all 5 repositories (PGO `dev@3560a85`, BA `main@35324cb`, SLAM `main@c86c818`, PCL `main@249b488`, livox `master@3d240d5`); the `Spikive-PGO` worktree commit `3560a85` and `sources.repos`' `version: dev` form a branch-level pin | confirm whether the delivery snapshot is accepted by commit or by branch |

## 5. Handling rules

1. In the main text, the locations above are marked `[待确认]` / `[TBC]`; no guessed content was written into the documentation.
2. After a confirmation result returns, update the corresponding section of the module page and delete the entry from this list.
3. New pending items follow the same format: ID (module prefix + sequence), location (file:line), issue, confirmation action needed.
