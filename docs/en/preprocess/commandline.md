# preprocess Module — Command-Line Usage

| Item | Value |
|---|---|
| Module | preprocess |
| Applicable version | Follows `Spikive-SLAM` git `main` @ `c86c818` |
| Last updated | 2026-09-10 |

## 1. Prerequisites

1. `lsdc_slam` built (both executables of this module are under `devel/lib/lsdc_slam/`).
2. `lsdc_ins_preprocess` needs upstream publishers of `ins/gps_topic` (default `/rtk_gps`, `sensor_msgs/NavSatFix`) and `ins/imu_topic` (default `/rtk_imu`, `sensor_msgs/Imu`).
3. `rs_velodyne` needs an upstream publisher of `common/rs_topic` (default `/rslidar_points`, `sensor_msgs/PointCloud2`).
4. Scan preprocessing has no standalone entry; it starts with `lsdc_mapping`.

## 2. Startup

### 2.1 Via launch files

| Launch file | preprocess nodes included |
|---|---|
| `mapping_velodyne.launch` | `lsdc_ins_preprocess` (line 28), `rs_velodyne` (line 19) |
| `cxzn_arrange.launch` | `lsdc_ins_preprocess` (line 19) |
| `cxzn_arrange_velodyne.launch` | `lsdc_ins_preprocess` (line 28), `rs_velodyne` (line 20) |
| `mapping_livox.launch` | both are commented out (lines 15-16); not part of the main chain |

### 2.2 Standalone

```bash
source /ws/devel/setup.bash
rosrun lsdc_slam lsdc_ins_preprocess
```

```bash
rosrun lsdc_slam rs_velodyne
```

## 3. Parameters

### 3.1 `lsdc_ins_preprocess` (`ins_preprocess.cpp:136-137`)

| Parameter | Default | Meaning |
|---|---|---|
| `ins/gps_topic` | `/rtk_gps` | GPS input topic (`sensor_msgs/NavSatFix`) |
| `ins/imu_topic` | `/rtk_imu` | IMU input topic (`sensor_msgs/Imu`) |

The defaults are defined in the `ins` group of `config/config.yaml`; `config/velodyne.yaml` uses `ins/ins_gps_topic` and `ins/ins_imu_topic` (different names, not read directly by this node [TBC]).

### 3.2 `rs_velodyne` (`rs_to_velodyne.cpp:113-121`)

| Parameter | Default | Meaning |
|---|---|---|
| `common/rs_topic` | `/rslidar_points` | Robosense point-cloud input topic |
| `mapping/rs_to_avia_T` | `[0, 0, 0]` | Translation of Robosense relative to Avia/main LiDAR |
| `mapping/rs_to_avia_E` | `[0, 0, 0]` | Euler angles (degrees, Z-Y-X order); when non-zero it overrides `rs_to_avia_R` |
| `mapping/rs_to_avia_R` | identity | Rotation of Robosense relative to the main LiDAR |

The delivered config files (`config/*.yaml`) do not define the `mapping/rs_to_avia_*` group, so the code defaults (identity extrinsic) currently apply [TBC].

### 3.3 Scan preprocessing parameters (`pcl_preprocess.hpp:234-251`)

The parameter prefix is the LiDAR type string plus underscore (e.g. `mid360_`), determined by `argv[1]` of `lsdc_mapping`:

| Parameter (`{prefix}preprocess/…`) | Default | Meaning |
|---|---|---|
| `blind` | 2 | Blind-zone radius (m); closer points are filtered |
| `lidar_type` | 1 (AVIA) | LiDAR type: 1=Livox, 2=Velodyne, 3=Ouster, 4=S10U |
| `scan_line` | 6 | Line count |
| `timestamp_unit` | 2 (US) | Time-field unit: 0=second, 1=millisecond, 2=microsecond, 3=nanosecond |
| `scan_rate` | 10 | Frame rate (Hz, used by velodyne) |
| `point_filter_num` | 2 | Point thinning interval |
| `feature_extract_enable` | false | Feature extraction switch |
| `fov_crop_enable` | false | S10U FOV crop switch |
| `vertical_fov_degree` | 80.0 | S10U vertical FOV (degrees) |
| `horizontal_fov_degree` | 120.0 | S10U horizontal FOV (degrees) |
| `{prefix}common/lid_topic` | `/livox/lidar_360` | Topic of this LiDAR |
| `{prefix}mapping/extrinsic_T` | `[0,0,0]` | Translation of this LiDAR relative to the main LiDAR |
| `{prefix}mapping/extrinsic_R` | identity | Rotation of this LiDAR relative to the main LiDAR |

Actual per-model values are in `config/config_avia.yaml`, `config_mid360.yaml`, `config_mid70.yaml`, `config_s10u.yaml`, `config_s10u_mavros.yaml`.

## 4. Input/output topics

| Node | Subscribes | Publishes |
|---|---|---|
| `ins_preprocess` | `ins/gps_topic`, `ins/imu_topic` | `/lsdc_rtk` (`nav_msgs/Odometry`; position holds LLA, orientation holds INS attitude, `child_frame_id` is `OK`/`-`) |
| `rs_converter` | `common/rs_topic` | `/velodyne_points` (`sensor_msgs/PointCloud2`, frame `velodyne`, fields include ring and relative time) |
| `laserMapping` (with scan preprocessing) | `{prefix}common/lid_topic` | preprocessing results enter the LIO main loop (`/cloud_registered` etc., see the SLAM module) |

## 5. Typical run examples

```bash
# Example 1: velodyne full chain (the launch includes rs_velodyne and lsdc_ins_preprocess)
roslaunch lsdc_slam mapping_velodyne.launch rviz:=false

# Example 2: check INS sync output alone
rosrun lsdc_slam lsdc_ins_preprocess
rostopic echo -n1 /lsdc_rtk

# Example 3: check Robosense conversion output alone
rosrun lsdc_slam rs_velodyne
rostopic hz /velodyne_points
```

## 6. Result interpretation

1. `/lsdc_rtk` carries data: `child_frame_id == "OK"` means GPS `status.status` is 48/49/50 (`ins_preprocess.cpp:58-61`) and RTK is usable; `"-"` means not usable.
2. `/velodyne_points` carries data with `header.frame_id == "velodyne"`: conversion node running (`rs_to_velodyne.cpp:57`).
3. On timestamp regression the preprocess callback prints `lidar loop back, clear buffer` and clears the frame queue (`pcl_preprocess.hpp:154`, `189-192`) — a protective action; check the replay source or the clock.
4. S10U input without valid positive point timestamps has the whole frame dropped with `Drop S10U cloud without valid positive point timestamps after preprocessing.` (`pcl_preprocess.hpp:202-207`).
5. The mapping console prints lines such as `pcl preprocess: [mid360]`, indicating the per-LiDAR preprocess instances have been created (`pcl_preprocess.hpp:229`).

## 7. Pending items (scope of this page)

1. `config/velodyne.yaml` uses `ins/ins_gps_topic` / `ins/ins_imu_topic` while this node reads `ins/gps_topic` / `ins/imu_topic`; which naming takes effect must be confirmed at runtime.
2. `mapping/rs_to_avia_*` is not defined in the delivered configs; whether the default identity extrinsic matches the on-site calibration must be confirmed.

All are collected in `docs/en/appendix/pending-items.md`.
