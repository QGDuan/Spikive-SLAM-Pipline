# SLAM 模块命令行使用

| 项 | 值 |
|---|---|
| 模块名 | SLAM |
| 适用版本 | `Spikive-SLAM` git `main` @ `c86c818`（`lsdc_slam` 0.0.0） |
| 最后更新 | 2026-09-10 |

## 1. 运行前置

1. ROS Noetic 环境已 source（容器内由 `entrypoint.sh` 自动完成）。
2. `lsdc_slam` 已编译，`devel/lib/lsdc_slam/` 下存在 9 个可执行文件（编译见 `docker-build.md`）。
3. 雷达驱动已运行（`livox_ros_driver`，见 driver-livox 模块文档）；velodyne 场景需要 Robosense 驱动发布 `/rslidar_points`。
4. 按雷达型号选择 launch 文件：MID360/AVIA/MID70 用 `mapping_livox.launch`；S10U 用 `mapping_s10u.launch` 或 `mapping_s10u_mavros.launch`；VLP-16 用 `mapping_velodyne.launch`。

## 2. launch 文件一览

| launch 文件 | 用途 | 启动的节点 | 加载的配置 |
|---|---|---|---|
| `mapping_livox.launch` | 无人机在线建图主入口（Livox 系列） | `lsdc_mapping`（args=`mid360`）、`lsdc_flight_controller`、`lsdc_fusion_repub` | `config.yaml`、`config_avia.yaml`、`config_mid360.yaml`、`config_mid70.yaml` |
| `mapping_s10u.launch` | S10U 相机点云，内置 IMU | 同上三个节点，`lsdc_mapping` args=`s10u` | `config.yaml`、`config_s10u.yaml` |
| `mapping_s10u_mavros.launch` | S10U 相机点云，MAVROS IMU | 同上三个节点，`lsdc_mapping` args=`s10u` | `config.yaml`、`config_s10u_mavros.yaml` |
| `mapping_velodyne.launch` | VLP-16 建图 + 定位 + RTK | `rs_velodyne`、`lsdc_mapping`（无 args）、`lsdc_init_pose` [待确认]、`lsdc_global_match`、`lsdc_fusion_repub`、`lsdc_ins_preprocess`、`lsdc_repub_gnss`、`lsdc_forward_node`（外部包）[待确认] | `velodyne.yaml` |
| `localization.launch` | 单独启动定位匹配节点 | `lsdc_global_match` | `config.yaml`、`config_avia.yaml`、`config_mid360.yaml` |
| `save_result.launch` | 结果录制（bag） | `lsdc_save_result` | 无 yaml，参数经 launch 传入 |
| `cxzn_arrange.launch` | 车规部署编排（MID360） | `lsdc_mapping`（args=`mid360`）、`lsdc_init_pose` [待确认]、`lsdc_global_match`、`lsdc_fusion_repub`、`lsdc_ins_preprocess`、`lsdc_repub_gnss`、`lsdc_forward_node`（外部包）[待确认] | `config.yaml`、`config_avia.yaml`、`config_mid360.yaml` |
| `cxzn_arrange_velodyne.launch` | 车规部署编排（velodyne 点云） | `rs_velodyne`、`lsdc_mapping`（args=`mid360`）、`lsdc_global_match`、`lsdc_fusion_repub`、`lsdc_ins_preprocess`、`lsdc_rtk2pose`、`lsdc_repub_gnss` | `config_velodyne.yaml`、`velodyne.yaml` |

标注说明：

- `lsdc_init_pose`：`mapping_velodyne.launch` 第 23 行与 `cxzn_arrange.launch` 第 14 行引用该可执行，但 `CMakeLists.txt` 无此构建目标 [待确认]。
- `lsdc_forward_node`：包 `lsdc_forward` 不在交付范围内，`lsdc_slam` 不构建该包；launch 启动它时会因可执行不存在而报错 [待确认]。

## 3. 命令与参数

### 3.1 无人机在线建图主入口（Livox）

```bash
roslaunch lsdc_slam mapping_livox.launch rviz:=false drone_id:=2 odometry_topic:=visual_slam/odom
```

launch 参数（`mapping_livox.launch` 第 4-6 行）：

| 参数 | 默认值 | 含义 |
|---|---|---|
| `rviz` | `true` | 是否启动 RViz；文件中 RViz 节点整体处于注释状态（第 39-42 行），该参数当前不生效 |
| `drone_id` | `2` | 用于生成 `/drone_{id}_*` 话题名 |
| `odometry_topic` | `visual_slam/odom` | 稳定 odom 话题后缀 |

节点私有参数：

- `slam_to_uav_transform`（`lsdc_flight_controller`）：`init_x`、`init_y`、`init_z`、`init_qx`、`init_qy`、`init_qz`（默认 0.0），`init_qw`（默认 1.0）。
- `fusion_repub`（`lsdc_fusion_repub`）：`drone_id`、`stable_cloud_topic=/drone_{id}_cloud_registered`、`stable_odom_topic=/drone_{id}_{odometry_topic}`、`diff_odom_topic=/drone_{id}_diff_odom`、`init_match_success_topic=/drone_{id}_init_match_success`。

文件中处于注释状态的节点（第 14-21 行）：`lsdc_ins_preprocess`、`rs_velodyne`、`lsdc_rtk2pose`、`lsdc_save_result`。

### 3.2 S10U（内置 IMU）

```bash
roslaunch lsdc_slam mapping_s10u.launch drone_id:=2 imu_topic:=/lx_camera_node/LxCamera_Imu
```

| 参数 | 默认值 | 含义 |
|---|---|---|
| `drone_id` | `2` | 话题命名 |
| `odometry_topic` | `visual_slam/odom` | 稳定 odom 话题后缀 |
| `imu_topic` | `/lx_camera_node/LxCamera_Imu` | 写入全局参数 `common/imu_topic`，覆盖 `config.yaml` 中的值 |

### 3.3 S10U（MAVROS IMU）

```bash
roslaunch lsdc_slam mapping_s10u_mavros.launch imu_topic:=/mavros/imu/data
```

| 参数 | 默认值 | 含义 |
|---|---|---|
| `imu_topic` | `/mavros/imu/data` | 飞控 IMU 话题，覆盖 `common/imu_topic` |

使用 `config_s10u_mavros.yaml`：`common/time_sync_en=true`，`s10u_common/lid_topic=/LxCamera_LidarCloud`，`mapping/extrinsic_T=[0.065, 0, 0.085]`，`mapping/extrinsic_R` 为 LiDAR 相机坐标到 `base_link` 的旋转矩阵。

### 3.4 Velodyne（VLP-16）

```bash
roslaunch lsdc_slam mapping_velodyne.launch rviz:=false
```

| 参数 | 默认值 | 含义 |
|---|---|---|
| `rviz` | `true` | 是否启动 RViz（加载 `rviz_cfg/localization.rviz`） |

顶层参数（launch 第 10-16 行）：`feature_extract_enable=0`、`point_filter_num=3`、`max_iteration=5`、`filter_size_surf=0.2`、`filter_size_map=0.2`、`cube_side_length=1000`、`runtime_pos_log_enable=0`。另含 `remote_zmq_port_loc=7657`、`ros_sub_topic=/global_pose`（供 `lsdc_forward_node` 使用）。

注意：该 launch 中 `lsdc_mapping` 未传 `args`（第 20 行），而 `laserMapping.cpp:882` 直接读取 `argv[1]` 且无默认值，该组合下雷达类型参数的取值行为 [待确认]。同时启动 `lsdc_init_pose` 与 `lsdc_forward_node`，二者不在本包构建范围内（见第 2 节标注）。

### 3.5 定位匹配（单独启动）

```bash
roslaunch lsdc_slam localization.launch drone_id:=2
```

前置：`mapping_livox.launch` 主链路已运行；WayPoint 后端发布 `/drone_{id}_localization_pcl`（地图点云）；前端发布 `/drone_{id}_initialpose`（初始位姿猜测）。

节点 `global_match` 私有参数（launch 第 10-17 行）：

| 参数 | 默认值 | 含义 |
|---|---|---|
| `drone_id` | `2` | 话题命名 |
| `initial_pose_topic` | `/drone_{id}_initialpose` | 初始位姿输入 |
| `map_topic` | `/drone_{id}_localization_pcl` | 定位地图点云输入 |
| `scan_topic` | `/cloud_registered_trans` | 标定后当前帧点云 |
| `odom_topic` | `/Odometry_trans` | 标定后里程计 |
| `diff_odom_topic` | `/drone_{id}_diff_odom` | 定位校正输出 |
| `init_match_success_topic` | `/drone_{id}_init_match_success` | 匹配成功标志（latched） |
| `match_status_topic` | `/drone_{id}_localization_match_status` | 匹配状态（latched JSON） |

### 3.6 结果录制

```bash
roslaunch lsdc_slam save_result.launch drone_id:=2 save_dir:=/home/developer/Spikive_save
```

| 参数 | 默认值 | 含义 |
|---|---|---|
| `drone_id` | `2` | 话题命名 |
| `imu_topic` | `/livox/imu/` | 写入全局参数 `common/imu_topic` |
| `visual_odom_topic` | `/drone_{id}_visual_slam/odom` | 待录制的视觉里程计话题 |
| `save_dir` | `$(env HOME)/Spikive_save` | bag 保存目录（节点内支持 `~/` 展开） |

`lsdc_save_result` 当前 main 为 bag 录制器：订阅 `/drone_{id}_bag_record_start`、`/drone_{id}_bag_record_stop`（`std_msgs/String`，JSON 请求），录制 `/cloud_registered_body`、`/Odometry_trans`、视觉里程计、IMU，先写 `.active.bag` 再改名为 `.bag`，并发布 `/drone_{id}_bag_record_status`。

### 3.7 车规部署编排

```bash
roslaunch lsdc_slam cxzn_arrange.launch rviz:=false
roslaunch lsdc_slam cxzn_arrange_velodyne.launch rviz:=false
```

节点组合见第 2 节表格。`cxzn_arrange_velodyne.launch` 的 `lsdc_mapping` 传 `args="mid360"`（launch 第 21 行）。`config_velodyne.yaml` 含 `rtk` 组（`T_rtk_wrt_body`、`E_rtk_wrt_body`、`T_car_wrt_rtk`、`E_car_wrt_rtk`、`use_map_origin`、`frame_id`）与 `localization` 组（`map_address`、`origin_L`、`origin_Q` 等）。

## 4. 输入输出话题

来源：本仓库 `docs/data_flow.md` 的 Node Topic 表。`{id}` 表示 `drone_id`。

| 节点 | 订阅 | 发布 |
|---|---|---|
| `lsdc_mapping` | `common/imu_topic`（默认 `/livox/imu/`，`sensor_msgs/Imu`）；`{前缀}common/lid_topic`（Livox `CustomMsg`） | `/Odometry`（`camera_init`→`body`）、`/cloud_registered`（frame `camera_init`）、`/cloud_registered_body`（frame `body`）、`/path` |
| `lsdc_flight_controller` | `/Odometry`、`/cloud_registered` | `/Odometry_trans`、`/cloud_registered_trans` |
| `lsdc_fusion_repub` | `/Odometry_trans`、`/cloud_registered_trans`、`/drone_{id}_diff_odom`、`/drone_{id}_init_match_success` | `/drone_{id}_visual_slam/odom`、`/drone_{id}_cloud_registered`、`/localization_odom`、`/localization_cloud_registered`、`/mavros/vision_pose/pose`、`/mavros/companion_process/status` |
| `lsdc_global_match` | `/drone_{id}_initialpose`、`/drone_{id}_localization_pcl`、`/cloud_registered_trans`、`/Odometry_trans` | `/drone_{id}_diff_odom`、`/drone_{id}_init_match_success`、`/drone_{id}_localization_match_status`、`/map`、`/submap`、`/fov_sphere_marker` |
| `lsdc_ins_preprocess` | `ins/gps_topic`（默认 `/rtk_gps`）、`ins/imu_topic`（默认 `/rtk_imu`） | `/lsdc_rtk` |
| `lsdc_rtk2pose` | `/lsdc_rtk` | `/initial_pose`、`/rtk_odom`、`/rtk_path` |
| `lsdc_repub_gnss` | `/localization_odom`、`/Odometry`、`/ins_lla`、`/bywire_chassis`、`/init_match_success` | `/global_pose`、`/gnss` |
| `rs_velodyne` | `common/rs_topic`（默认 `/rslidar_points`） | `/velodyne_points` |
| `lsdc_save_result` | `/drone_{id}_bag_record_start`、`/drone_{id}_bag_record_stop`；录制源话题见 3.6 | `/drone_{id}_bag_record_status` |

## 5. 典型运行示例

以下命令与检查步骤取自本仓库 `docs/data_flow.md` 第 168-176 行：

```bash
roslaunch lsdc_slam mapping_livox.launch
```

```bash
# 检查节点存在
rosnode list | grep -E "laserMapping|slam_to_uav_transform"
# 检查 LIO 输出有数据
rostopic hz /Odometry
rostopic hz /cloud_registered
# 检查 MAVROS 视觉位姿
rostopic echo -n1 /mavros/vision_pose/pose
```

## 6. 运行结果判读

1. `/laserMapping` 与 `/slam_to_uav_transform` 节点存在 → 主链路已启动。
2. `/Odometry` 与 `/cloud_registered` 有数据 → LIO 前端正常；无数据时先检查驱动话题（`/livox/lidar`、`common/imu_topic`）。
3. `/mavros/vision_pose/pose` 有数据、`header.frame_id` 为 `world`、发布者为 `fusion_repub` → 收口链路正常。
4. `/drone_{id}_visual_slam/odom` 与 `/drone_{id}_cloud_registered` 存在 → 地面站稳定话题正常。
5. 定位状态（`localization.launch` 场景）：

```bash
rostopic echo -n1 /drone_2_localization_match_status
```

| 状态 | 含义 |
|---|---|
| `idle` | 未加载有效地图或收到空地图 |
| `map_loaded` / `waiting_initialpose` | 地图已加载，等待前端 initialpose |
| `matching` | 正在 ICP；状态话题按周期发布 attempt/elapsed/fitness |
| `localized` | 匹配成功，稳定话题对齐 WayPoint 地图 world |
| `failed` | 本次 initialpose 超时或失败，等待重新发布 initialpose |

6. `world` 坐标语义随定位状态变化：`localized` 前为本次启动的 fallback world，`localized` 后为 WayPoint 地图 world（详见 `docs/coordinate_frames.md` 与本模块 `architecture.md` 第 7 节）。

## 7. 待确认项（本文件范围）

1. `lsdc_init_pose` 被 2 个 launch 引用但无构建目标。
2. `lsdc_forward_node`（外部包 `lsdc_forward`）被 3 个 launch 引用。
3. `mapping_velodyne.launch` 中 `lsdc_mapping` 无 `args`，与 `laserMapping.cpp:882` 直接读取 `argv[1]` 的组合行为。

以上均汇总至 `docs/zh/appendix/pending-items.md`。
