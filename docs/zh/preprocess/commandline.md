# preprocess 模块命令行使用

| 项 | 值 |
|---|---|
| 模块名 | preprocess |
| 适用版本 | 随 `Spikive-SLAM` git `main` @ `c86c818` |
| 最后更新 | 2026-09-10 |

## 1. 运行前置

1. `lsdc_slam` 已编译（本模块两个可执行文件位于 `devel/lib/lsdc_slam/`）。
2. `lsdc_ins_preprocess` 需要上游发布 `ins/gps_topic`（默认 `/rtk_gps`，`sensor_msgs/NavSatFix`）与 `ins/imu_topic`（默认 `/rtk_imu`，`sensor_msgs/Imu`）。
3. `rs_velodyne` 需要上游发布 `common/rs_topic`（默认 `/rslidar_points`，`sensor_msgs/PointCloud2`）。
4. 雷达帧预处理无独立入口，随 `lsdc_mapping` 启动。

## 2. 启动方式

### 2.1 经 launch 启动

| launch 文件 | 包含的本模块节点 |
|---|---|
| `mapping_velodyne.launch` | `lsdc_ins_preprocess`（第 28 行）、`rs_velodyne`（第 19 行） |
| `cxzn_arrange.launch` | `lsdc_ins_preprocess`（第 19 行） |
| `cxzn_arrange_velodyne.launch` | `lsdc_ins_preprocess`（第 28 行）、`rs_velodyne`（第 20 行） |
| `mapping_livox.launch` | 二者处于注释状态（第 15-16 行），不随主链路启动 |

### 2.2 单独启动

```bash
source /ws/devel/setup.bash
rosrun lsdc_slam lsdc_ins_preprocess
```

```bash
rosrun lsdc_slam rs_velodyne
```

## 3. 参数

### 3.1 `lsdc_ins_preprocess`（`ins_preprocess.cpp:136-137`）

| 参数 | 默认值 | 含义 |
|---|---|---|
| `ins/gps_topic` | `/rtk_gps` | GPS 输入话题（`sensor_msgs/NavSatFix`） |
| `ins/imu_topic` | `/rtk_imu` | IMU 输入话题（`sensor_msgs/Imu`） |

参数默认值定义于 `config/config.yaml` 的 `ins` 组；`config/velodyne.yaml` 中为 `ins/ins_gps_topic`、`ins/ins_imu_topic`（命名不同，未直接作用于本节点，[待确认]）。

### 3.2 `rs_velodyne`（`rs_to_velodyne.cpp:113-121`）

| 参数 | 默认值 | 含义 |
|---|---|---|
| `common/rs_topic` | `/rslidar_points` | Robosense 点云输入话题 |
| `mapping/rs_to_avia_T` | `[0, 0, 0]` | Robosense 相对 Avia/主雷达的平移 |
| `mapping/rs_to_avia_E` | `[0, 0, 0]` | 欧拉角（度，Z-Y-X 顺序）；非零时覆盖 `rs_to_avia_R` |
| `mapping/rs_to_avia_R` | 恒等矩阵 | Robosense 相对主雷达的旋转 |

交付包内的配置文件（`config/*.yaml`）未定义 `mapping/rs_to_avia_*` 参数组，因此当前使用代码默认值（恒等外参）[待确认]。

### 3.3 雷达帧预处理参数（`pcl_preprocess.hpp:234-251`）

参数前缀为雷达类型串 + 下划线（如 `mid360_`），由 `lsdc_mapping` 的 `argv[1]` 决定：

| 参数（`{前缀}preprocess/…`） | 默认值 | 含义 |
|---|---|---|
| `blind` | 2 | 盲区半径（米），小于该距离的点被过滤 |
| `lidar_type` | 1（AVIA） | 雷达类型：1=Livox，2=Velodyne，3=Ouster，4=S10U |
| `scan_line` | 6 | 线数 |
| `timestamp_unit` | 2（US） | 点云时间字段单位：0=秒，1=毫秒，2=微秒，3=纳秒 |
| `scan_rate` | 10 | 帧率（Hz，velodyne 使用） |
| `point_filter_num` | 2 | 点抽稀间隔 |
| `feature_extract_enable` | false | 是否提取特征点 |
| `fov_crop_enable` | false | S10U FOV 裁剪开关 |
| `vertical_fov_degree` | 80.0 | S10U 垂直 FOV（度） |
| `horizontal_fov_degree` | 120.0 | S10U 水平 FOV（度） |
| `{前缀}common/lid_topic` | `/livox/lidar_360` | 该雷达话题 |
| `{前缀}mapping/extrinsic_T` | `[0,0,0]` | 该雷达相对主雷达的平移 |
| `{前缀}mapping/extrinsic_R` | 恒等 | 该雷达相对主雷达的旋转 |

各型号配置的实际取值见 `config/config_avia.yaml`、`config_mid360.yaml`、`config_mid70.yaml`、`config_s10u.yaml`、`config_s10u_mavros.yaml`。

## 4. 输入输出话题

| 节点 | 订阅 | 发布 |
|---|---|---|
| `ins_preprocess` | `ins/gps_topic`、`ins/imu_topic` | `/lsdc_rtk`（`nav_msgs/Odometry`，position 存 LLA，orientation 存 INS 姿态，`child_frame_id` 为 `OK`/`-`） |
| `rs_converter` | `common/rs_topic` | `/velodyne_points`（`sensor_msgs/PointCloud2`，frame `velodyne`，字段含 ring 与相对时间） |
| `laserMapping`（含雷达帧预处理） | `{前缀}common/lid_topic` | 预处理结果进入 LIO 主循环（`/cloud_registered` 等，见 SLAM 模块） |

## 5. 典型运行示例

```bash
# 示例 1：velodyne 场景全链路（launch 内含 rs_velodyne 与 lsdc_ins_preprocess）
roslaunch lsdc_slam mapping_velodyne.launch rviz:=false

# 示例 2：单独检查 INS 同步输出
rosrun lsdc_slam lsdc_ins_preprocess
rostopic echo -n1 /lsdc_rtk

# 示例 3：单独检查 Robosense 转换输出
rosrun lsdc_slam rs_velodyne
rostopic hz /velodyne_points
```

## 6. 运行结果判读

1. `/lsdc_rtk` 有数据：`child_frame_id == "OK"` 表示 GPS `status.status` 为 48/49/50（`ins_preprocess.cpp:58-61`），RTK 可用；`"-"` 表示不可用。
2. `/velodyne_points` 有数据且 `header.frame_id == "velodyne"`：转换节点正常（`rs_to_velodyne.cpp:57`）。
3. 点云时间倒退时，预处理回调打印 `lidar loop back, clear buffer` 并清空帧队列（`pcl_preprocess.hpp:154`、`189-192`），属保护性处理，需检查回放或时钟源。
4. S10U 输入若点时间戳无有效正值，整帧被丢弃并打印 `Drop S10U cloud without valid positive point timestamps after preprocessing.`（`pcl_preprocess.hpp:202-207`）。
5. 建图终端输出 `pcl preprocess: [mid360]` 等行，表示各雷达预处理实例已创建（`pcl_preprocess.hpp:229`）。

## 7. 待确认项（本文件范围）

1. `config/velodyne.yaml` 中 `ins/ins_gps_topic`、`ins/ins_imu_topic` 与本节点读取的 `ins/gps_topic`、`ins/imu_topic` 命名不一致，哪个命名实际生效需运行确认。
2. `mapping/rs_to_avia_*` 参数组在交付配置文件中未定义，默认恒等外参是否与现场标定一致。

以上均汇总至 `docs/zh/appendix/pending-items.md`。
