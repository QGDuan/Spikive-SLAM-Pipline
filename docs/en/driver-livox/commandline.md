# Bundled Driver Module — Command-Line Usage

| Item | Value |
|---|---|
| Module | Bundled driver (livox_ros_driver) |
| Applicable version | `livox_ros_driver` git `master` @ `3d240d5` (2.6.0) |
| Last updated | 2026-09-10 |

## 1. Prerequisites

1. ROS environment sourced (Noetic container in this project).
2. Livox SDK installed: the driver checks `GetLivoxSdkVersion()` at startup and exits when the SDK major version is < 2 (`livox_ros_driver.cpp:40,60-66`).
3. Direct mode: the LiDAR and the host are network-reachable, and the broadcast code is known (or empty for automatic scanning).
4. lvx replay mode: the lvx file path is known.

## 2. Launch file overview

| Launch file | `data_src` | `xfer_format` default | rviz default | rosbag default | Config loaded |
|---|---|---|---|---|---|
| `livox_lidar.launch` | 0 (direct) | 0 (PointCloud2/PointXYZRTL) | false | false | `config/livox_lidar_config.json` |
| `livox_lidar_msg.launch` | 0 | 1 (CustomMsg) | false | false | same |
| `livox_lidar_rviz.launch` | 0 | 0 | true | false | same |
| `livox_hub.launch` | 1 (Hub) | 0 | false | false | `config/livox_hub_config.json` |
| `livox_hub_msg.launch` | 1 | 1 | false | false | same |
| `livox_hub_rviz.launch` | 1 | 0 | true | false | same |
| `livox_template.launch` | 0 | 0 | false | false | identical content to `livox_lidar.launch` (template) |
| `lvx_to_rosbag.launch` | 2 (lvx file) | 0 | false | false | `config/livox_hub_config.json` (`imu_bag` default false) |
| `lvx_to_rosbag_rviz.launch` | 2 | 0 | true | true | same |

All launch files start node `livox_lidar_publisher` (pkg=`livox_ros_driver`, type=`livox_ros_driver_node`, `required="true"`, `output="screen"`, args=`$(arg bd_list)`).

## 3. Commands and parameters

### 3.1 Direct LiDAR

```bash
roslaunch livox_ros_driver livox_lidar_rviz.launch bd_list:="0TFDG3B006H2Z11&1HDDG8M00100191"
```

Multiple broadcast codes are joined with `&` (README example); without an explicit list the default `100000000000000` applies, and with `enable_connect=false` in the config the driver auto-connects to all scanned devices.

### 3.2 CustomMsg output (the format the SLAM module consumes by default)

```bash
roslaunch livox_ros_driver livox_lidar_msg.launch
```

### 3.3 Hub

```bash
roslaunch livox_ros_driver livox_hub_rviz.launch
```

### 3.4 lvx file to rosbag

```bash
roslaunch livox_ros_driver lvx_to_rosbag.launch lvx_file_path:="/home/livox/test.lvx"
```

### 3.5 Launch parameters

| Parameter | Default | Meaning |
|---|---|---|
| `bd_list` | `100000000000000` | broadcast-code list, `&`-separated |
| `xfer_format` | 0 or 1 (see table) | cloud output format: 0=PointCloud2 (custom PointXYZRTL layout), 1=`CustomMsg`, 2=PointCloud2 of pcl `PointXYZI` |
| `multi_topic` | 0 | 0=merged topics `livox/lidar`, `livox/imu`; 1=per-code topics `livox/lidar_<bc>`, `livox/imu_<bc>` |
| `data_src` | 0 | data source: 0=direct LiDAR, 1=Hub, 2=lvx file |
| `publish_freq` | 10.0 | publish frequency |
| `output_type` | 0 | output data type (lvx scenario defaults to 1) |
| `rviz_enable` | false | start RViz |
| `rosbag_enable` | false | start `rosbag record -a` |
| `lvx_file_path` | `livox_test.lvx` | lvx file path |
| `msg_frame_id` | `livox_frame` | cloud frame_id |
| `lidar_bag` / `imu_bag` | true / true | whether to record lidar/imu topics in the lvx-to-rosbag scenario |

## 4. Config files

### 4.1 `config/livox_lidar_config.json` (direct)

| Field | Content |
|---|---|
| `lidar_config` | array: `broadcast_code` (current values `1PQDH5B00100041`, `0TFDG3U99101431`), `enable_connect` (both false), `return_mode`, `coordinate`, `imu_rate`, `extrinsic_parameter_source`, `enable_high_sensitivity` |
| `timesync_config` | `enable_timesync`, `device_name` (`/dev/ttyUSB0`), `comm_device_type`, `baudrate_index`, `parity_index` |

With all `enable_connect` false, the driver auto-connects to all scanned devices.

### 4.2 `config/livox_hub_config.json` (Hub)

| Field | Content |
|---|---|
| `hub_config` | `broadcast_code` (`13UUG1R00400170`), `enable_connect` (false), `coordinate` |
| `lidar_config` | 4 LiDAR entries (`0TFDG3B006H2Z11`, `0TFDG3U99101291`, `1HDDG8M00100191`, `1PQDG8E00100321`), with `return_mode`, `imu_rate` |

## 5. Output topics

Source: `GetCurrentPublisher` / `GetCurrentImuPublisher` in `lddc.cpp`.

| Condition | Topic | Type |
|---|---|---|
| `multi_topic=0` | `livox/lidar` | per `xfer_format`: 0/2 → `sensor_msgs/PointCloud2`, 1 → `livox_ros_driver/CustomMsg` |
| `multi_topic=0` | `livox/imu` | `sensor_msgs/Imu` |
| `multi_topic=1` | `livox/lidar_<bc>`, `livox/imu_<bc>` | same as above |

- cloud frame_id defaults to `livox_frame` (launch parameter `msg_frame_id`); the IMU message frame_id is hardcoded to `livox_frame` (`lddc.cpp:487`).
- `CustomMsg` fields: `header`, `timebase`(uint64), `point_num`, `lidar_id`, `rsvd`, `points[]`; `CustomPoint` fields: `offset_time`(uint32), `x/y/z`, `reflectivity`, `tag`, `line`.

## 6. Typical run example

```bash
# inside the container
source /ws/devel/setup.bash
roslaunch livox_ros_driver livox_lidar_msg.launch bd_list:="0TFDG3B006H2Z11"
```

```bash
# interpretation
rosnode list | grep livox_lidar_publisher
rostopic hz /livox/lidar
rostopic hz /livox/imu
rostopic echo -n1 /livox/lidar | head -n 20
```

## 7. Result interpretation

1. The startup log prints `Livox Ros Driver Version: 2.6.0` (`livox_ros_driver.cpp:57`) → the driver process has started.
2. When the SDK major version is insufficient the process exits (`livox_ros_driver.cpp:62-66`) with a log message about the SDK version requirement.
3. `/livox/lidar` and `/livox/imu` carry data → the device data path is working.
4. Direct-mode connection failure: check the broadcast code, network, `enable_connect` and `timesync_config/device_name`.
5. When `laserMapping` on the SLAM side has no cloud input, check the driver topics and `xfer_format` per this page first (the `lid_topic` in the SLAM `config_*.yaml` must match the driver's output topic).
