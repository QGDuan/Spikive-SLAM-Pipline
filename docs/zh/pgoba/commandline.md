# PGOBA 模块命令行使用

| 项 | 值 |
|---|---|
| 模块名 | PGOBA |
| 适用版本 | `Spikive-PGO` git `dev` @ `3560a85`；`Spikive-BA` git `main` @ `35324cb` |
| 最后更新 | 2026-09-10 |

本文件分两部分：第一部分为 PGO（`Spikive-PGO`），第二部分为 BA（`Spikive-BA`）。

# 第一部分：PGO

## 1. 运行前置

1. 镜像已构建（`spikive-slam:btc-noetic`，见 `docker-build.md`），源码已编译。
2. 输入数据：含 `/cloud_registered_body`（frame `body`）与 `/Odometry`（`T_camera_init_body`）的 bag，或正在运行的 FastLIO 前端。不把 `/cloud_registered`、`/Odometry_trans`、优化后 bag 作为标准输入（`docs/frame_contract.md`）。
3. 主机具备可用的 `DISPLAY` 与 `XAUTHORITY`（RViz 场景）。
4. 所有终端使用同一 `ROS_MASTER_URI`；每个实验使用独立端口。

## 2. 标准在线运行（三终端）

命令取自 `Spikive-PGO/README.md`（"输入、实时 RViz 与录制"节）：

```bash
# 终端 1：后端与 RViz（原始路径蓝线、优化路径绿线、回环边与修正线）
export ROS_MASTER_URI=http://127.0.0.1:11660
bash scripts/dev.sh exec roslaunch --port 11660 spikive_btc direct_btc.launch \
  world_frame:=camera_init \
  rviz_config:=/ws/src/Spikive-PGO/rviz/btc_pgo_verified.rviz

# 终端 2：录制全部 body 输入及输出
export ROS_MASTER_URI=http://127.0.0.1:11660
mkdir -p results/NEW_RUN
bash scripts/dev.sh exec python3 /ws/src/Spikive-PGO/scripts/record_btc_run.py \
  /results/NEW_RUN/btc_outputs.bag --node-name pgo_recorder --record-body-input

# 终端 3：播放 bag（只播原始输入，不播旧 BTC 输出）
export ROS_MASTER_URI=http://127.0.0.1:11660
SPIKIVE_DATA_DIR=/absolute/input-directory bash scripts/dev.sh exec \
  rosbag play --clock --rate 3 --delay 3 /data/saier2biao.bag \
  --topics /cloud_registered_body /Odometry /tf
```

EOF 之后（核对后端已处理到输入末帧后）：

```bash
bash scripts/dev.sh exec rosservice call /pgo_recorder/finish '{}'
```

## 3. launch 文件一览

| launch | 用途 | 关键参数（默认值） |
|---|---|---|
| `online.launch` | 后端节点单入口 | `node_name=btc`、`cloud_topic=/cloud_registered_body`、`odom_topic=/Odometry`、`world_frame=camera_init`、`cloud_frame=body`、`config=config/btc_pgo.yaml`、`robust_config=""`、`descriptor_config=third_party/btc_descriptor/config/config_indoor.yaml` |
| `direct_btc.launch` | 已录制 body+odom 的直接回放（online + visualization，`use_sim_time=true`） | `world_frame`（必填）、`rviz_config`（必填）、`backend_config` |
| `offline_rebuild.launch` | 独立离线重建：body bag + 外部 pose.txt | `body_bag`、`pose_file`、`output_dir`（必填）；`pose_format=tum`、`rate=3`、`rviz=true`、`keep_alive=true` |
| `slam_btc.launch` | 前端 + 后端组合（include `lsdc_slam` 的 `mapping_s10u.launch` + online + visualization） | `imu_topic=/lx_camera_node/LxCamera_Imu`、`drone_id=2`、`use_sim_time=false` |
| `saier8biao.launch` | 数据集编排用：启动 `lsdc_mapping`（args=mid360）+ online（body 输入）+ visualization，`use_sim_time=true` | 加载 `config/saier8biao_slam.yaml` |
| `saier2biao.launch` | 透传 include `saier8biao.launch` | 同 saier8biao |
| `guigang_recorded.launch` | 贵港数据集专用：`guigang_input_adapter.py` + direct_btc（`world_frame=world`） | `calibration_config=config/guigang_recorded.yaml` |
| `visualization.launch` | RViz（默认 `rviz/btc_pgo_verified.rviz`）与可选 foxglove_bridge | `rviz=true`、`foxglove=false`、`foxglove_port=8765` |

## 4. 独立离线重建（外部位姿）

命令取自 `Spikive-PGO/README.md`：

```bash
export SPIKIVE_RESULTS_DIR=/home/colman/Project/slam_output
export ROS_MASTER_URI=http://127.0.0.1:11664
bash scripts/dev.sh exec roslaunch --port 11664 spikive_btc offline_rebuild.launch \
  body_bag:=/results/YOUR_INPUT/body.bag \
  pose_file:=/results/PREVIOUS_RUN/optimized_pose.txt \
  output_dir:=/results/NEW_EXTERNAL_POSE_RUN \
  world_frame:=camera_init body_frame:=body rate:=3 rviz:=true
```

输入约束（README 原文规则）：

- `pose_format:=tum`（默认）：每行 `timestamp tx ty tz qx qy qz qw`，秒、米，位姿方向为 body 到指定 world，支持 `#` 注释；
- 每个 body 扫描恰好一条同纳秒时间戳的位姿，不插值、不最近邻匹配、不裁尾；
- `pose_format:=export-csv`：读取本系统 `optimized_map_all_scans.poses.csv` 的 `optimized_*` 列；
- 结果目录必须不存在；正常 EOF 后自动完成结束优化与导出，中断不标记完成。

## 5. 数据集回放编排脚本

| 脚本 | 子命令 | 数据集与端口 |
|---|---|---|
| `scripts/livox_experiment.sh` | `prepare [bag]`、`start [run_name] [rate]`、`export run_name`、`pause`、`resume`、`status`、`stop` | `SPIKIVE_DATASET`：saier8biao（端口 11361）、saier2biao（11362） |
| `scripts/saier8biao.sh` | 同上（固定 `SPIKIVE_DATASET=saier8biao`） | — |
| `scripts/saier2biao.sh` | 同上（固定 `SPIKIVE_DATASET=saier2biao`） | — |
| `scripts/direct_btc.sh` | `prepare`、`start [run_name] [rate]`、`status`、`stop` | saier8biao（11371，`/Odometry`）、guigang（11372，`/Odometry_trans`） |
| `scripts/replay_gicp_live.sh` | `start`、`status`、`pause`、`resume`、`stop` | saier2biao（11602）、saier8biao（11608） |

示例：

```bash
bash scripts/saier8biao.sh prepare /home/colman/Project/slam_input/saier8biao.bag
bash scripts/saier8biao.sh start new-pcm-run 1.0
```

`start` 会依次启动 5 个命名容器：`-slam`（后端+RViz）、`-observer`（输出观测）、`-recorder`（录制）、`-player`（播放）与可选 `-auditor`（`SPIKIVE_RT_AUDIT=1` 时）。`stop` 只停止本实验命名容器并导出日志。

## 6. 话题与服务

| 名称 | 类型 | 说明 |
|---|---|---|
| `/btc/place_recognition` | `spikive_btc/PlaceRecognition` | 识别结果（会话、匹配、分数、锚点姿态、相对变换） |
| `/btc/loop_constraint` | `spikive_btc/LoopConstraint` | 回环接受/拒绝与 1% 拒绝原因 |
| `/btc/pgo_status` | `spikive_btc/PgoStatus` | 关键帧、有效回环、PGO 尝试/成功/失败计数 |
| `/btc/robust_status` | `spikive_btc/RobustStatus` | PCM 选边、端点与权重、GNC/iSAM2 累计计数 |
| `/btc/refinement_diagnostics` | `spikive_btc/RefinementDiagnostics` | GICP 收敛、对应数、RMSE、Hessian 诊断 |
| `/btc/final_pgo_status` | `spikive_btc/FinalPgoStatus` | EOF 结束 PGO 报告与前后路径 |
| `/btc/raw_path`、`/btc/optimized_path` | 路径可视化 | 原始关键帧路径 / 优化路径（fixed frame `camera_init`） |
| `/btc/finalize_pgo` | `std_srvs/Trigger` | 显式 EOF 触发结束全局 PGO |
| `/btc/reset_database` | `std_srvs/Trigger` | 清空 BTC 数据库与图 |
| `/{dataset}_recorder/finish` | 服务 | 录制器完成入口（`play_btc_run.sh` 在播放结束后自动调用） |

## 7. 输出产物

运行结果写入 `results/`（或 `SPIKIVE_RESULTS_DIR`），README 规定的产物：

| 文件 | 内容 |
|---|---|
| `optimized_map_full.pcd` | 全部已保存 BTC 子地图点，保留降采样 |
| `optimized_map_all_scans.pcd` / `raw_map_all_scans.pcd` | 全部原始扫描点，分别用最终修正场 / 原始里程计输出 |
| `optimized_body_odometry.bag` | 原始 body 点 + 优化位姿 + `/Odometry_raw`（协方差与速度为零占位） |
| `btc_outputs.bag` | 录制输出包 |
| 位姿 CSV、manifest | 复核输入帧/点数、最终图快照、修正插值 |
| `final_global_pgo.json` | 结束 PGO 求解报告 |
| `final_global_before_poses.csv` / `final_global_after_poses.csv` | 结束求解前后位姿 |

## 8. 运行结果判读

1. `/btc/loop_constraint` 中 `reason` 字段记录 1% 等拒绝原因（1% 定义见 `architecture.md`）。
2. `/btc/robust_status` 记录 PCM 选边与权重；回环边数、去重关键帧数、PGO 次数、iSAM2 update 数分别报告，不能混算（README）。
3. 每次回环在线执行 1 次提交 + 5 次空 iSAM2 更新；EOF 结束 PGO 为 1 + 100 次（`config/btc_pgo.yaml` 注释与 README）。
4. 结束阶段先确认 `/btc/final_pgo_status` 与最终路径一致，再执行导出；播放器结束不等于计算完成。

# 第二部分：BA（HBA）

## 9. 运行前置

1. 输入目录含两个文件：`optimized_body_odometry.bag`（话题 `/cloud_registered_body`，frame `body`）与 `optimized_pose.txt`（TUM 格式 `timestamp tx ty tz qx qy qz qw`，表示 `T_world_body`，默认世界系 `camera_init`）。
2. 输出目录必须是不存在的新目录。
3. 使用独立 wall-time ROS master（默认端口 11877），不在 `/use_sim_time` master 上运行。

## 10. 命令

```bash
# 新机器先构建依赖环境镜像与主镜像（详见 docker-build.md）
bash scripts/hba.sh build-env
bash scripts/hba.sh build-image

# 运行（INPUT_DIR 内为 optimized_body_odometry.bag 与 optimized_pose.txt）
bash scripts/hba.sh run /absolute/INPUT_DIR /absolute/OUTPUT_DIR

# 带 RViz（求解时显示输入，完成后切换最终地图）
bash scripts/hba.sh run /absolute/INPUT_DIR /absolute/NEW_OUTPUT_DIR rviz:=true
```

`hba.sh run` 的校验（`scripts/hba.sh:24-26`）：输入两个文件必须存在，输出目录已存在则退出（exit 2）。

节点入口等价写法（镜像内）：

```bash
roslaunch spikive_ba global_ba.launch body_bag:=... pose_file:=... output_dir:=...
```

`global_ba.launch` 参数：

| 参数 | 默认值 | 含义 |
|---|---|---|
| `body_bag`、`pose_file`、`output_dir` | 必填 | 输入 bag、输入位姿、输出目录 |
| `world_frame` | `camera_init` | 位姿世界系 |
| `body_frame` | `body` | 点云 frame |
| `rviz` | `false` | 是否显示 RViz |
| `keep_alive` | `$(arg rviz)` | 结束后是否保持进程 |

环境变量（`scripts/hba.sh`）：`HBA_IMAGE`（默认 `spikive-ba:v1.0.0-w20-g10`）、`HBA_MEMORY`（默认 52g，同时用于 `--memory` 与 `--memory-swap`）、`HBA_STATE_DIR`（默认 `.dev/hba`）、`HBA_MASTER_PORT`（默认 11877）、`HBA_CONTAINER`、`HBA_DETACH`。

## 11. 输出产物

结果目录仅保留（README）：

| 文件 / 目录 | 内容 |
|---|---|
| `optimized_map_all_scans.pcd` | 全量未降采样点经 `p_world = T_world_body0 * T_body0_body_HBA * p_body` 变换后的地图 |
| `optimized_pose.txt` | 优化后位姿（TUM 格式） |
| `REPORT.md` | 运行报告 |
| `records/` | 记录（input.json、native_hba.log 等） |

中间逐帧 PCD 缓存于 `.dev/hba/work`，不进入 Git。

## 12. 运行结果判读

1. ROS 节点 `/global_ba_hba` 存在，状态话题 `/hba/status` 有输出。
2. 求解完成条件（`scripts/hba_run.py`）：`records/native_hba.log` 中出现 `pgo complete` 与 `iteration complete`。
3. 输出目录出现 `optimized_map_all_scans.pcd` 与 `optimized_pose.txt` 即完成。
