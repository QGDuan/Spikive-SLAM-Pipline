# 配套驱动模块命令行使用

| 项 | 值 |
|---|---|
| 模块名 | 配套驱动（livox_ros_driver） |
| 适用版本 | `livox_ros_driver` git `master` @ `3d240d5`（2.6.0） |
| 最后更新 | 2026-09-10 |

## 1. 运行前置

1. ROS 环境已 source（本项目为 Noetic 容器）。
2. Livox SDK 已安装：驱动运行时检查 `GetLivoxSdkVersion()`，SDK 主版本 < 2 直接退出（`livox_ros_driver.cpp:40,60-66`）。
3. 直连模式：雷达与主机网络互通，广播码已知（或留空自动扫描）。
4. lvx 回放模式：lvx 文件路径已知。

## 2. launch 文件一览

| launch 文件 | `data_src` | `xfer_format` 默认 | rviz 默认 | rosbag 默认 | 加载配置 |
|---|---|---|---|---|---|
| `livox_lidar.launch` | 0（直连） | 0（PointCloud2/PointXYZRTL） | false | false | `config/livox_lidar_config.json` |
| `livox_lidar_msg.launch` | 0 | 1（CustomMsg） | false | false | 同上 |
| `livox_lidar_rviz.launch` | 0 | 0 | true | false | 同上 |
| `livox_hub.launch` | 1（Hub） | 0 | false | false | `config/livox_hub_config.json` |
| `livox_hub_msg.launch` | 1 | 1 | false | false | 同上 |
| `livox_hub_rviz.launch` | 1 | 0 | true | false | 同上 |
| `livox_template.launch` | 0 | 0 | false | false | 与 `livox_lidar.launch` 内容相同（模板） |
| `lvx_to_rosbag.launch` | 2（lvx 文件） | 0 | false | false | `config/livox_hub_config.json`（`imu_bag` 默认 false） |
| `lvx_to_rosbag_rviz.launch` | 2 | 0 | true | true | 同上 |

所有 launch 均启动节点 `livox_lidar_publisher`（pkg=`livox_ros_driver`，type=`livox_ros_driver_node`，`required="true"`，`output="screen"`，args=`$(arg bd_list)`）。

## 3. 命令与参数

### 3.1 直连雷达

```bash
roslaunch livox_ros_driver livox_lidar_rviz.launch bd_list:="0TFDG3B006H2Z11&1HDDG8M00100191"
```

指定广播码用 `&` 连接多个（README 示例）；不指定时使用默认 `100000000000000`，配合配置文件 `enable_connect=false` 自动连接扫描到的全部设备。

### 3.2 CustomMsg 输出（SLAM 默认消费格式）

```bash
roslaunch livox_ros_driver livox_lidar_msg.launch
```

### 3.3 Hub

```bash
roslaunch livox_ros_driver livox_hub_rviz.launch
```

### 3.4 lvx 文件转 rosbag

```bash
roslaunch livox_ros_driver lvx_to_rosbag.launch lvx_file_path:="/home/livox/test.lvx"
```

### 3.5 launch 参数

| 参数 | 默认值 | 含义 |
|---|---|---|
| `bd_list` | `100000000000000` | 广播码列表，`&` 分隔 |
| `xfer_format` | 0 或 1（见上表） | 点云输出格式：0=PointCloud2（自定义 PointXYZRTL 布局），1=`CustomMsg`，2=pcl `PointXYZI` 的 PointCloud2 |
| `multi_topic` | 0 | 0=合并话题 `livox/lidar`、`livox/imu`；1=按广播码分话题 `livox/lidar_<bc>`、`livox/imu_<bc>` |
| `data_src` | 0 | 数据源：0=直连 LiDAR，1=Hub，2=lvx 文件 |
| `publish_freq` | 10.0 | 发布频率 |
| `output_type` | 0 | 输出数据类型（lvx 场景默认 1） |
| `rviz_enable` | false | 启动 RViz |
| `rosbag_enable` | false | 启动 `rosbag record -a` |
| `lvx_file_path` | `livox_test.lvx` | lvx 文件路径 |
| `msg_frame_id` | `livox_frame` | 点云 frame_id |
| `lidar_bag` / `imu_bag` | true / true | lvx 转 rosbag 时是否录 lidar/imu 话题 |

## 4. 配置文件

### 4.1 `config/livox_lidar_config.json`（直连）

| 字段 | 内容 |
|---|---|
| `lidar_config` | 数组：`broadcast_code`（当前值 `1PQDH5B00100041`、`0TFDG3U99101431`）、`enable_connect`（均 false）、`return_mode`、`coordinate`、`imu_rate`、`extrinsic_parameter_source`、`enable_high_sensitivity` |
| `timesync_config` | `enable_timesync`、`device_name`（`/dev/ttyUSB0`）、`comm_device_type`、`baudrate_index`、`parity_index` |

`enable_connect` 全部为 false 时，驱动自动连接扫描到的所有设备。

### 4.2 `config/livox_hub_config.json`（Hub）

| 字段 | 内容 |
|---|---|
| `hub_config` | `broadcast_code`（`13UUG1R00400170`）、`enable_connect`（false）、`coordinate` |
| `lidar_config` | 4 个雷达条目（`0TFDG3B006H2Z11`、`0TFDG3U99101291`、`1HDDG8M00100191`、`1PQDG8E00100321`），含 `return_mode`、`imu_rate` |

## 5. 输出话题

来源：`lddc.cpp` 的 `GetCurrentPublisher` / `GetCurrentImuPublisher`。

| 条件 | 话题 | 类型 |
|---|---|---|
| `multi_topic=0` | `livox/lidar` | 按 `xfer_format`：0/2 为 `sensor_msgs/PointCloud2`，1 为 `livox_ros_driver/CustomMsg` |
| `multi_topic=0` | `livox/imu` | `sensor_msgs/Imu` |
| `multi_topic=1` | `livox/lidar_<广播码>`、`livox/imu_<广播码>` | 同上 |

- 点云 frame_id 默认 `livox_frame`（launch 参数 `msg_frame_id`）；IMU 消息 frame_id 固定为 `livox_frame`（`lddc.cpp:487` 硬编码）。
- `CustomMsg` 字段：`header`、`timebase`(uint64)、`point_num`、`lidar_id`、`rsvd`、`points[]`；`CustomPoint` 字段：`offset_time`(uint32)、`x/y/z`、`reflectivity`、`tag`、`line`。

## 6. 典型运行示例

```bash
# 容器内
source /ws/devel/setup.bash
roslaunch livox_ros_driver livox_lidar_msg.launch bd_list:="0TFDG3B006H2Z11"
```

```bash
# 判读
rosnode list | grep livox_lidar_publisher
rostopic hz /livox/lidar
rostopic hz /livox/imu
rostopic echo -n1 /livox/lidar | head -n 20
```

## 7. 运行结果判读

1. 启动日志打印 `Livox Ros Driver Version: 2.6.0`（`livox_ros_driver.cpp:57`）→ 驱动进程已启动。
2. SDK 主版本不足时进程退出（`livox_ros_driver.cpp:62-66`），日志提示 SDK 版本要求。
3. `/livox/lidar` 与 `/livox/imu` 有数据 → 设备数据通路正常。
4. 直连模式连接失败：检查广播码、网络、`enable_connect` 与 `timesync_config/device_name`。
5. SLAM 侧 `laserMapping` 无点云输入时，先按本文件检查驱动话题与 `xfer_format`（SLAM 的 `config_*.yaml` 中 `lid_topic` 必须与驱动输出话题一致）。
