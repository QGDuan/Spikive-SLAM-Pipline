# SLAM Module — Command-Line Usage

| Item | Value |
|---|---|
| Module | SLAM |
| Applicable version | `Spikive-SLAM` git `main` @ `c86c818` (`lsdc_slam` 0.0.0) |
| Last updated | 2026-09-10 |

## 1. Prerequisites

1. ROS Noetic sourced (done automatically by `entrypoint.sh` in the container).
2. `lsdc_slam` built; the 9 executables exist under `devel/lib/lsdc_slam/` (see `docker-build.md`).
3. LiDAR driver running (`livox_ros_driver`, see the driver module docs); the velodyne scenario needs a Robosense driver publishing `/rslidar_points`.
4. Pick the launch file by LiDAR model: MID360/AVIA/MID70 use `mapping_livox.launch`; S10U uses `mapping_s10u.launch` or `mapping_s10u_mavros.launch`; VLP-16 uses `mapping_velodyne.launch`.

## 2. Launch file overview

| Launch file | Purpose | Nodes started | Config loaded |
|---|---|---|---|
| `mapping_livox.launch` | Main online mapping entry (Livox series) | `lsdc_mapping` (args=`mid360`), `lsdc_flight_controller`, `lsdc_fusion_repub` | `config.yaml`, `config_avia.yaml`, `config_mid360.yaml`, `config_mid70.yaml` |
| `mapping_s10u.launch` | S10U camera point cloud, internal IMU | same three nodes, `lsdc_mapping` args=`s10u` | `config.yaml`, `config_s10u.yaml` |
| `mapping_s10u_mavros.launch` | S10U camera point cloud, MAVROS IMU | same three nodes, `lsdc_mapping` args=`s10u` | `config.yaml`, `config_s10u_mavros.yaml` |
| `mapping_velodyne.launch` | VLP-16 mapping + localization + RTK | `rs_velodyne`, `lsdc_mapping` (no args), `lsdc_init_pose` [TBC], `lsdc_global_match`, `lsdc_fusion_repub`, `lsdc_ins_preprocess`, `lsdc_repub_gnss`, `lsdc_forward_node` (external package) [TBC] | `velodyne.yaml` |
| `localization.launch` | Standalone localization matching node | `lsdc_global_match` | `config.yaml`, `config_avia.yaml`, `config_mid360.yaml` |
| `save_result.launch` | Result recording (bag) | `lsdc_save_result` | no yaml; parameters passed via launch |
| `cxzn_arrange.launch` | Vehicle deployment orchestration (MID360) | `lsdc_mapping` (args=`mid360`), `lsdc_init_pose` [TBC], `lsdc_global_match`, `lsdc_fusion_repub`, `lsdc_ins_preprocess`, `lsdc_repub_gnss`, `lsdc_forward_node` (external package) [TBC] | `config.yaml`, `config_avia.yaml`, `config_mid360.yaml` |
| `cxzn_arrange_velodyne.launch` | Vehicle deployment orchestration (velodyne cloud) | `rs_velodyne`, `lsdc_mapping` (args=`mid360`), `lsdc_global_match`, `lsdc_fusion_repub`, `lsdc_ins_preprocess`, `lsdc_rtk2pose`, `lsdc_repub_gnss` | `config_velodyne.yaml`, `velodyne.yaml` |

Marked items:

- `lsdc_init_pose`: referenced at `mapping_velodyne.launch:23` and `cxzn_arrange.launch:14`, but `CMakeLists.txt` has no such build target [TBC].
- `lsdc_forward_node`: package `lsdc_forward` is outside the delivery scope; `lsdc_slam` does not build it. Launching it will fail because the executable is missing [TBC].

## 3. Commands and parameters

### 3.1 Main online mapping entry (Livox)

```bash
roslaunch lsdc_slam mapping_livox.launch rviz:=false drone_id:=2 odometry_topic:=visual_slam/odom
```

Launch arguments (`mapping_livox.launch:4-6`):

| Argument | Default | Meaning |
|---|---|---|
| `rviz` | `true` | Whether to start RViz; the RViz node is commented out in the file (lines 39-42), so this argument currently has no effect |
| `drone_id` | `2` | Used to form `/drone_{id}_*` topic names |
| `odometry_topic` | `visual_slam/odom` | Suffix of the stable odometry topic |

Node private parameters:

- `slam_to_uav_transform` (`lsdc_flight_controller`): `init_x`, `init_y`, `init_z`, `init_qx`, `init_qy`, `init_qz` (default 0.0), `init_qw` (default 1.0).
- `fusion_repub` (`lsdc_fusion_repub`): `drone_id`, `stable_cloud_topic=/drone_{id}_cloud_registered`, `stable_odom_topic=/drone_{id}_{odometry_topic}`, `diff_odom_topic=/drone_{id}_diff_odom`, `init_match_success_topic=/drone_{id}_init_match_success`.

Nodes commented out in the file (lines 14-21): `lsdc_ins_preprocess`, `rs_velodyne`, `lsdc_rtk2pose`, `lsdc_save_result`.

### 3.2 S10U (internal IMU)

```bash
roslaunch lsdc_slam mapping_s10u.launch drone_id:=2 imu_topic:=/lx_camera_node/LxCamera_Imu
```

| Argument | Default | Meaning |
|---|---|---|
| `drone_id` | `2` | Topic naming |
| `odometry_topic` | `visual_slam/odom` | Stable odometry topic suffix |
| `imu_topic` | `/lx_camera_node/LxCamera_Imu` | Written to global parameter `common/imu_topic`, overriding `config.yaml` |

### 3.3 S10U (MAVROS IMU)

```bash
roslaunch lsdc_slam mapping_s10u_mavros.launch imu_topic:=/mavros/imu/data
```

| Argument | Default | Meaning |
|---|---|---|
| `imu_topic` | `/mavros/imu/data` | Flight-controller IMU topic, overrides `common/imu_topic` |

Uses `config_s10u_mavros.yaml`: `common/time_sync_en=true`, `s10u_common/lid_topic=/LxCamera_LidarCloud`, `mapping/extrinsic_T=[0.065, 0, 0.085]`, and `mapping/extrinsic_R` is the rotation from LiDAR camera coordinates to `base_link`.

### 3.4 Velodyne (VLP-16)

```bash
roslaunch lsdc_slam mapping_velodyne.launch rviz:=false
```

| Argument | Default | Meaning |
|---|---|---|
| `rviz` | `true` | Whether to start RViz (loads `rviz_cfg/localization.rviz`) |

Top-level parameters (launch lines 10-16): `feature_extract_enable=0`, `point_filter_num=3`, `max_iteration=5`, `filter_size_surf=0.2`, `filter_size_map=0.2`, `cube_side_length=1000`, `runtime_pos_log_enable=0`. Also `remote_zmq_port_loc=7657` and `ros_sub_topic=/global_pose` (for `lsdc_forward_node`).

Note: in this launch file `lsdc_mapping` is started without `args` (line 20), while `laserMapping.cpp:882` reads `argv[1]` directly with no default; the resulting LiDAR-type value under this combination is [TBC]. The launch also starts `lsdc_init_pose` and `lsdc_forward_node`, which are not built by this package (see section 2).

### 3.5 Localization matching (standalone)

```bash
roslaunch lsdc_slam localization.launch drone_id:=2
```

Prerequisites: the `mapping_livox.launch` main chain is running; the WayPoint backend publishes `/drone_{id}_localization_pcl` (map cloud); the frontend publishes `/drone_{id}_initialpose` (initial pose guess).

Node `global_match` private parameters (launch lines 10-17):

| Parameter | Default | Meaning |
|---|---|---|
| `drone_id` | `2` | Topic naming |
| `initial_pose_topic` | `/drone_{id}_initialpose` | Initial pose input |
| `map_topic` | `/drone_{id}_localization_pcl` | Localization map cloud input |
| `scan_topic` | `/cloud_registered_trans` | Calibrated current scan |
| `odom_topic` | `/Odometry_trans` | Calibrated odometry |
| `diff_odom_topic` | `/drone_{id}_diff_odom` | Localization correction output |
| `init_match_success_topic` | `/drone_{id}_init_match_success` | Match success flag (latched) |
| `match_status_topic` | `/drone_{id}_localization_match_status` | Match status (latched JSON) |

### 3.6 Result recording

```bash
roslaunch lsdc_slam save_result.launch drone_id:=2 save_dir:=/home/developer/Spikive_save
```

| Argument | Default | Meaning |
|---|---|---|
| `drone_id` | `2` | Topic naming |
| `imu_topic` | `/livox/imu/` | Written to global parameter `common/imu_topic` |
| `visual_odom_topic` | `/drone_{id}_visual_slam/odom` | Visual odometry topic to record |
| `save_dir` | `$(env HOME)/Spikive_save` | Bag save directory (the node expands `~/`) |

The current `lsdc_save_result` main is a bag recorder: it subscribes to `/drone_{id}_bag_record_start` and `_stop` (`std_msgs/String`, JSON requests), records `/cloud_registered_body`, `/Odometry_trans`, visual odometry and IMU, writes `.active.bag` then renames to `.bag`, and publishes `/drone_{id}_bag_record_status`.

### 3.7 Vehicle deployment orchestration

```bash
roslaunch lsdc_slam cxzn_arrange.launch rviz:=false
roslaunch lsdc_slam cxzn_arrange_velodyne.launch rviz:=false
```

Node combinations are in the section 2 table. `cxzn_arrange_velodyne.launch` starts `lsdc_mapping` with `args="mid360"` (launch line 21). `config_velodyne.yaml` contains an `rtk` group (`T_rtk_wrt_body`, `E_rtk_wrt_body`, `T_car_wrt_rtk`, `E_car_wrt_rtk`, `use_map_origin`, `frame_id`) and a `localization` group (`map_address`, `origin_L`, `origin_Q`, etc.).

## 4. Input/output topics

Source: this repository's `docs/data_flow.md` node-topic table. `{id}` denotes `drone_id`.

| Node | Subscribes | Publishes |
|---|---|---|
| `lsdc_mapping` | `common/imu_topic` (default `/livox/imu/`, `sensor_msgs/Imu`); `{prefix}common/lid_topic` (Livox `CustomMsg`) | `/Odometry` (`camera_init`→`body`), `/cloud_registered` (frame `camera_init`), `/cloud_registered_body` (frame `body`), `/path` |
| `lsdc_flight_controller` | `/Odometry`, `/cloud_registered` | `/Odometry_trans`, `/cloud_registered_trans` |
| `lsdc_fusion_repub` | `/Odometry_trans`, `/cloud_registered_trans`, `/drone_{id}_diff_odom`, `/drone_{id}_init_match_success` | `/drone_{id}_visual_slam/odom`, `/drone_{id}_cloud_registered`, `/localization_odom`, `/localization_cloud_registered`, `/mavros/vision_pose/pose`, `/mavros/companion_process/status` |
| `lsdc_global_match` | `/drone_{id}_initialpose`, `/drone_{id}_localization_pcl`, `/cloud_registered_trans`, `/Odometry_trans` | `/drone_{id}_diff_odom`, `/drone_{id}_init_match_success`, `/drone_{id}_localization_match_status`, `/map`, `/submap`, `/fov_sphere_marker` |
| `lsdc_ins_preprocess` | `ins/gps_topic` (default `/rtk_gps`), `ins/imu_topic` (default `/rtk_imu`) | `/lsdc_rtk` |
| `lsdc_rtk2pose` | `/lsdc_rtk` | `/initial_pose`, `/rtk_odom`, `/rtk_path` |
| `lsdc_repub_gnss` | `/localization_odom`, `/Odometry`, `/ins_lla`, `/bywire_chassis`, `/init_match_success` | `/global_pose`, `/gnss` |
| `rs_velodyne` | `common/rs_topic` (default `/rslidar_points`) | `/velodyne_points` |
| `lsdc_save_result` | `/drone_{id}_bag_record_start`, `/drone_{id}_bag_record_stop`; recording sources per 3.6 | `/drone_{id}_bag_record_status` |

## 5. Typical run example

The commands and check steps below come from this repository's `docs/data_flow.md` lines 168-176:

```bash
roslaunch lsdc_slam mapping_livox.launch
```

```bash
# check the nodes exist
rosnode list | grep -E "laserMapping|slam_to_uav_transform"
# check LIO output has data
rostopic hz /Odometry
rostopic hz /cloud_registered
# check MAVROS vision pose
rostopic echo -n1 /mavros/vision_pose/pose
```

## 6. Result interpretation

1. Nodes `/laserMapping` and `/slam_to_uav_transform` exist → main chain started.
2. `/Odometry` and `/cloud_registered` carry data → LIO frontend running; if not, check the driver topics first (`/livox/lidar`, `common/imu_topic`).
3. `/mavros/vision_pose/pose` carries data with `header.frame_id` `world` and publisher `fusion_repub` → output chain running.
4. `/drone_{id}_visual_slam/odom` and `/drone_{id}_cloud_registered` exist → ground-station stable topics running.
5. Localization status (`localization.launch` scenario):

```bash
rostopic echo -n1 /drone_2_localization_match_status
```

| State | Meaning |
|---|---|
| `idle` | No valid map loaded, or an empty map received |
| `map_loaded` / `waiting_initialpose` | Map loaded, waiting for the frontend initialpose |
| `matching` | ICP in progress; the status topic publishes attempt/elapsed/fitness periodically |
| `localized` | Match succeeded; stable topics aligned to the WayPoint map world |
| `failed` | This initialpose timed out or failed; ICP stopped, waiting for a new initialpose |

6. The meaning of the `world` coordinates depends on the localization state: before `localized` it is the fallback startup world; after `localized` it is the WayPoint map world (see `docs/coordinate_frames.md` and this module's `architecture.md` section 7).

## 7. Pending items (scope of this page)

1. `lsdc_init_pose` referenced by 2 launch files but has no build target.
2. `lsdc_forward_node` (external package `lsdc_forward`) referenced by 3 launch files.
3. `mapping_velodyne.launch` starts `lsdc_mapping` without `args` combined with `laserMapping.cpp:882` reading `argv[1]` directly.

All are collected in `docs/en/appendix/pending-items.md`.
