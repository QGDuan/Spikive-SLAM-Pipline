# PGOBA Module — Command-Line Usage

| Item | Value |
|---|---|
| Module | PGOBA |
| Applicable version | `Spikive-PGO` git `dev` @ `3560a85`; `Spikive-BA` git `main` @ `35324cb` |
| Last updated | 2026-09-10 |

This page has two parts: Part 1 covers PGO (`Spikive-PGO`), Part 2 covers BA (`Spikive-BA`).

# Part 1: PGO

## 1. Prerequisites

1. Image built (`spikive-slam:btc-noetic`, see `docker-build.md`) and sources compiled.
2. Input data: a bag containing `/cloud_registered_body` (frame `body`) and `/Odometry` (`T_camera_init_body`), or a running FastLIO frontend. Do not use `/cloud_registered`, `/Odometry_trans`, or an optimized bag as standard input (`docs/frame_contract.md`).
3. Host has a usable `DISPLAY` and `XAUTHORITY` (RViz scenarios).
4. All terminals share one `ROS_MASTER_URI`; each experiment uses its own port.

## 2. Standard online run (three terminals)

Commands from `Spikive-PGO/README.md` (the "Input, live RViz and recording" section):

```bash
# Terminal 1: backend and verified RViz (raw path blue, optimized path green, loop edges and corrections)
export ROS_MASTER_URI=http://127.0.0.1:11660
bash scripts/dev.sh exec roslaunch --port 11660 spikive_btc direct_btc.launch \
  world_frame:=camera_init \
  rviz_config:=/ws/src/Spikive-PGO/rviz/btc_pgo_verified.rviz

# Terminal 2: record all body inputs and outputs first
export ROS_MASTER_URI=http://127.0.0.1:11660
mkdir -p results/NEW_RUN
bash scripts/dev.sh exec python3 /ws/src/Spikive-PGO/scripts/record_btc_run.py \
  /results/NEW_RUN/btc_outputs.bag --node-name pgo_recorder --record-body-input

# Terminal 3: play the bag (only raw inputs, never old BTC outputs)
export ROS_MASTER_URI=http://127.0.0.1:11660
SPIKIVE_DATA_DIR=/absolute/input-directory bash scripts/dev.sh exec \
  rosbag play --clock --rate 3 --delay 3 /data/saier2biao.bag \
  --topics /cloud_registered_body /Odometry /tf
```

After EOF (after verifying the backend processed up to the last input frame):

```bash
bash scripts/dev.sh exec rosservice call /pgo_recorder/finish '{}'
```

## 3. Launch file overview

| Launch | Purpose | Key parameters (defaults) |
|---|---|---|
| `online.launch` | single backend node entry | `node_name=btc`, `cloud_topic=/cloud_registered_body`, `odom_topic=/Odometry`, `world_frame=camera_init`, `cloud_frame=body`, `config=config/btc_pgo.yaml`, `robust_config=""`, `descriptor_config=third_party/btc_descriptor/config/config_indoor.yaml` |
| `direct_btc.launch` | direct replay of recorded body+odom (online + visualization, `use_sim_time=true`) | `world_frame` (required), `rviz_config` (required), `backend_config` |
| `offline_rebuild.launch` | standalone offline rebuild: body bag + external pose.txt | `body_bag`, `pose_file`, `output_dir` (required); `pose_format=tum`, `rate=3`, `rviz=true`, `keep_alive=true` |
| `slam_btc.launch` | frontend + backend combination (includes `lsdc_slam`'s `mapping_s10u.launch` + online + visualization) | `imu_topic=/lx_camera_node/LxCamera_Imu`, `drone_id=2`, `use_sim_time=false` |
| `saier8biao.launch` | dataset orchestration: starts `lsdc_mapping` (args=mid360) + online (body input) + visualization, `use_sim_time=true` | loads `config/saier8biao_slam.yaml` |
| `saier2biao.launch` | passthrough include of `saier8biao.launch` | same as saier8biao |
| `guigang_recorded.launch` | Guigang-dataset-specific: `guigang_input_adapter.py` + direct_btc (`world_frame=world`) | `calibration_config=config/guigang_recorded.yaml` |
| `visualization.launch` | RViz (default `rviz/btc_pgo_verified.rviz`) and optional foxglove_bridge | `rviz=true`, `foxglove=false`, `foxglove_port=8765` |

## 4. Standalone offline rebuild (external poses)

Command from `Spikive-PGO/README.md`:

```bash
export SPIKIVE_RESULTS_DIR=/home/colman/Project/slam_output
export ROS_MASTER_URI=http://127.0.0.1:11664
bash scripts/dev.sh exec roslaunch --port 11664 spikive_btc offline_rebuild.launch \
  body_bag:=/results/YOUR_INPUT/body.bag \
  pose_file:=/results/PREVIOUS_RUN/optimized_pose.txt \
  output_dir:=/results/NEW_EXTERNAL_POSE_RUN \
  world_frame:=camera_init body_frame:=body rate:=3 rviz:=true
```

Input constraints (README rules):

- `pose_format:=tum` (default): each line `timestamp tx ty tz qx qy qz qw`, seconds and meters, pose direction body→specified world; `#` comments supported;
- each body scan has exactly one pose with the same nanosecond timestamp; no interpolation, no nearest-neighbor matching, no tail trimming;
- `pose_format:=export-csv`: reads the `optimized_*` full-scan pose columns of this system's `optimized_map_all_scans.poses.csv`;
- the result directory must not exist; after a normal EOF the final optimization and export run automatically; interruption does not mark completion.

## 5. Dataset replay orchestration scripts

| Script | Subcommands | Datasets and ports |
|---|---|---|
| `scripts/livox_experiment.sh` | `prepare [bag]`, `start [run_name] [rate]`, `export run_name`, `pause`, `resume`, `status`, `stop` | `SPIKIVE_DATASET`: saier8biao (port 11361), saier2biao (11362) |
| `scripts/saier8biao.sh` | same (fixes `SPIKIVE_DATASET=saier8biao`) | — |
| `scripts/saier2biao.sh` | same (fixes `SPIKIVE_DATASET=saier2biao`) | — |
| `scripts/direct_btc.sh` | `prepare`, `start [run_name] [rate]`, `status`, `stop` | saier8biao (11371, `/Odometry`), guigang (11372, `/Odometry_trans`) |
| `scripts/replay_gicp_live.sh` | `start`, `status`, `pause`, `resume`, `stop` | saier2biao (11602), saier8biao (11608) |

Example:

```bash
bash scripts/saier8biao.sh prepare /home/colman/Project/slam_input/saier8biao.bag
bash scripts/saier8biao.sh start new-pcm-run 1.0
```

`start` launches 5 named containers in order: `-slam` (backend+RViz), `-observer` (output observer), `-recorder` (recording), `-player` (playback) and optionally `-auditor` (when `SPIKIVE_RT_AUDIT=1`). `stop` only stops the containers of this experiment and exports their logs.

## 6. Topics and services

| Name | Type | Notes |
|---|---|---|
| `/btc/place_recognition` | `spikive_btc/PlaceRecognition` | recognition result (session, match, score, anchor pose, relative transform) |
| `/btc/loop_constraint` | `spikive_btc/LoopConstraint` | loop accept/reject and the 1% rejection reason |
| `/btc/pgo_status` | `spikive_btc/PgoStatus` | keyframe, valid-loop, PGO attempt/success/failure counters |
| `/btc/robust_status` | `spikive_btc/RobustStatus` | PCM edge selection and weights, GNC/iSAM2 cumulative counters |
| `/btc/refinement_diagnostics` | `spikive_btc/RefinementDiagnostics` | GICP convergence, correspondences, RMSE, Hessian diagnostics |
| `/btc/final_pgo_status` | `spikive_btc/FinalPgoStatus` | EOF final PGO report with before/after paths |
| `/btc/raw_path`, `/btc/optimized_path` | path visualization | raw keyframe path / optimized path (fixed frame `camera_init`) |
| `/btc/finalize_pgo` | `std_srvs/Trigger` | explicit EOF trigger of the final global PGO |
| `/btc/reset_database` | `std_srvs/Trigger` | clears the BTC database and graph |
| `/{dataset}_recorder/finish` | service | recorder completion entry (called automatically by `play_btc_run.sh` after playback) |

## 7. Output artifacts

Run results are written to `results/` (or `SPIKIVE_RESULTS_DIR`). Artifacts per the README:

| File | Content |
|---|---|
| `optimized_map_full.pcd` | all saved BTC submap points, retaining downsampling |
| `optimized_map_all_scans.pcd` / `raw_map_all_scans.pcd` | all raw scan points, output with the final correction field / raw odometry respectively |
| `optimized_body_odometry.bag` | raw body points + optimized poses + `/Odometry_raw` (covariances and velocities are zero placeholders) |
| `btc_outputs.bag` | recorded output bag |
| pose CSVs, manifests | input frame/point checks, final graph snapshot, correction interpolation |
| `final_global_pgo.json` | final PGO solve report |
| `final_global_before_poses.csv` / `final_global_after_poses.csv` | poses before/after the final solve |

## 8. Result interpretation

1. The `reason` field in `/btc/loop_constraint` records the 1% and other rejection reasons (definition of the 1% check in `architecture.md`).
2. `/btc/robust_status` records PCM edge selection and weights; loop-edge count, deduplicated keyframe count, PGO count and iSAM2 update count are reported separately and must not be conflated (README).
3. Each loop performs 1 commit + 5 empty iSAM2 updates online; the EOF final PGO performs 1 + 100 (comments in `config/btc_pgo.yaml` and the README).
4. At the final stage, first confirm `/btc/final_pgo_status` is consistent with the final path, then export; player termination does not imply computation completion.

# Part 2: BA (HBA)

## 9. Prerequisites

1. The input directory contains two files: `optimized_body_odometry.bag` (topic `/cloud_registered_body`, frame `body`) and `optimized_pose.txt` (TUM format `timestamp tx ty tz qx qy qz qw`, meaning `T_world_body`, default world frame `camera_init`).
2. The output directory must be a new directory that does not exist.
3. Use an isolated wall-time ROS master (default port 11877); do not run on a `/use_sim_time` master that is playing a bag.

## 10. Commands

```bash
# New machine: build the dependency-environment image and the main image first (see docker-build.md)
bash scripts/hba.sh build-env
bash scripts/hba.sh build-image

# Run (INPUT_DIR contains optimized_body_odometry.bag and optimized_pose.txt)
bash scripts/hba.sh run /absolute/INPUT_DIR /absolute/OUTPUT_DIR

# With RViz (shows the input while solving, switches to the final map on completion)
bash scripts/hba.sh run /absolute/INPUT_DIR /absolute/NEW_OUTPUT_DIR rviz:=true
```

`hba.sh run` validations (`scripts/hba.sh:24-26`): both input files must exist; an existing output directory exits (exit 2).

Equivalent node entry (inside the image):

```bash
roslaunch spikive_ba global_ba.launch body_bag:=... pose_file:=... output_dir:=...
```

`global_ba.launch` parameters:

| Parameter | Default | Meaning |
|---|---|---|
| `body_bag`, `pose_file`, `output_dir` | required | input bag, input poses, output directory |
| `world_frame` | `camera_init` | pose world frame |
| `body_frame` | `body` | cloud frame |
| `rviz` | `false` | show RViz |
| `keep_alive` | `$(arg rviz)` | keep the process alive after completion |

Environment variables (`scripts/hba.sh`): `HBA_IMAGE` (default `spikive-ba:v1.0.0-w20-g10`), `HBA_MEMORY` (default 52g, used for both `--memory` and `--memory-swap`), `HBA_STATE_DIR` (default `.dev/hba`), `HBA_MASTER_PORT` (default 11877), `HBA_CONTAINER`, `HBA_DETACH`.

## 11. Output artifacts

The result directory keeps only (README):

| File / directory | Content |
|---|---|
| `optimized_map_all_scans.pcd` | full undownsampled points transformed by `p_world = T_world_body0 * T_body0_body_HBA * p_body` |
| `optimized_pose.txt` | optimized poses (TUM format) |
| `REPORT.md` | run report |
| `records/` | records (`input.json`, `native_hba.log`, etc.) |

Intermediate per-frame PCDs are cached under `.dev/hba/work` and never enter Git.

## 12. Result interpretation

1. ROS node `/global_ba_hba` exists; status topic `/hba/status` produces output.
2. Solve completion condition (`scripts/hba_run.py`): `records/native_hba.log` contains `pgo complete` and `iteration complete`.
3. `optimized_map_all_scans.pcd` and `optimized_pose.txt` appear in the output directory → completed.
