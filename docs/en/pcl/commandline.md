# PCL Module — Command-Line Usage

| Item | Value |
|---|---|
| Module | PCL |
| Applicable version | `Spikive-Pcl-Process` git `main` @ `249b488` (v1.0.0) |
| Last updated | 2026-09-10 |

## 1. Prerequisites

1. Image built (`spikive-pcl-process:1.0.0`, see `docker-build.md`).
2. `HBA_DIR` contains: `optimized_map_all_scans.pcd` (HBA-exported full-scan-order XYZI, not reordered/resampled by third-party software) and `optimized_pose.txt` (TUM format, `T_world_body`, already restored to world coordinates).
3. `BODY_BAG`: the original body bag used to produce those HBA results (topic `/cloud_registered_body`).
4. `NEW_OUTPUT_DIR` must not exist; its parent directory must exist.
5. `ORIGIN_X/Y/Z`: the LiDAR origin expressed in LIO body coordinates (scan-level fixed-extrinsic approximation), from a confirmed calibration source; the default config is `null` and the run fails without it.

## 2. Commands

```bash
# build and test (host side, see docker-build.md)
bash scripts/process.sh build
bash scripts/process.sh test

# run
bash scripts/process.sh run HBA_DIR BODY_BAG NEW_OUTPUT_DIR \
  --sensor-origin-body ORIGIN_X ORIGIN_Y ORIGIN_Z \
  --sensor-origin-note "calibration source; whether a scan-level fixed-extrinsic approximation is used"
```

`process.sh run` validations (`scripts/process.sh:21-25`): HBA directory must exist, body bag must exist, output directory must not exist, output parent must exist. The container runs with `--network none --memory=52g --memory-swap=52g`; the HBA directory, body bag and config are mounted read-only; only the output parent is writable.

## 3. Parameters

`process.py` CLI parameters (`scripts/process.py:118-128`):

| Parameter | Default | Meaning |
|---|---|---|
| `--hba-dir` | required | HBA result directory (`/input/hba` in the container) |
| `--body-bag` | required | original body bag (`/input/body.bag` in the container) |
| `--output` | required | new output directory (`/output/<name>` in the container) |
| `--config` | `config/indoor.yaml` | config file (read-only mount at `/config/indoor.yaml`) |
| `--sensor-origin-body X Y Z` | none | LiDAR origin in LIO body coordinates (3 elements) |
| `--sensor-origin-note` | empty | origin source note (must be non-empty) |
| `--world-frame` | `camera_init` | pose world frame |
| `--body-frame` | `body` | cloud frame |

Config file `config/indoor.yaml` (schema 1):

| Parameter | Value | Meaning |
|---|---|---|
| `threads` | 0 | 0 = auto `ceil(2/3 × logical CPUs)` |
| `clean.enabled` / `mean_k` / `stddev_mul` | false / 20 / 2.0 | optional full-map SOR switch and parameters |
| `mls.search_radius_m` / `polynomial_order` / `tile_edge_m` | 0.08 / 2 / 2.0 | MLS neighborhood radius, polynomial order, tile edge (with halo) |
| `fusion.method` / `voxel_size_m` / `truncation_distance_m` | tsdf / 0.02 / 0.06 | TSDF voxel and truncation band |
| `sensor_origin_body_m` / `sensor_origin_note` | null / "" | required at runtime |

The origin and note can also be written directly into `config/indoor.yaml`; the run script mounts the config read-only and snapshots the actual parameters into the result.

## 4. Inputs and outputs

Inputs:

| Item | Content |
|---|---|
| `optimized_map_all_scans.pcd` | HBA full-scan-order XYZI (FLOAT32) |
| `optimized_pose.txt` | TUM format `timestamp tx ty tz qx qy qz qw`, `T_world_body`, nanosecond timestamps |
| body bag | `/cloud_registered_body` (`sensor_msgs/PointCloud2`, frame `body`) |

Output directory layout (README original text):

```text
NEW_OUTPUT_DIR/
├── refined_map.pcd
├── REPORT.md
└── records/
    ├── config.yaml
    ├── input.json
    ├── frames.bin
    ├── frames.csv
    ├── native.json
    ├── summary.json
    ├── third_party.lock.json
    └── process.log
```

- the original HBA map, poses and bag are not copied into the new directory, and old results are never overwritten;
- on failure, `records/failure.json` and unfinished files are kept and `refined_map.pcd` is not published;
- reusing an existing output directory is rejected.

## 5. Typical run example

```bash
bash scripts/process.sh run \
  /absolute/ba_result \
  /absolute/original_body.bag \
  /absolute/new_refined_result \
  --sensor-origin-body 0.0 0.0 0.0 \
  --sensor-origin-note "LiDAR origin coincides with body origin per calibration record XXX; scan-level fixed-extrinsic approximation"
```

## 6. Result interpretation

1. The terminal prints three stages: `[1/3] Checking every HBA point, pose and original body scan`, `[2/3] Native PCL MLS -> chronological native Voxblox TSDF`, `[3/3] Verifying final surface and unchanged inputs` (`process.py:44-56`).
2. Completion prints `Complete: <output dir>/refined_map.pcd (<points> points)`.
3. On a failed mid-run check, it prints `FAILED: <reason>` and keeps `records/failure.json` without publishing the final cloud. Common failure reasons (the `require` calls in `process.py`):
   - `Explicit sensor origin required`: `--sensor-origin-body` missing;
   - `Output must be a NEW directory`: output directory already exists;
   - `Native input completeness mismatch` / `Observation accounting mismatch`: engine statistics inconsistent with the inputs;
   - `Input changed during refinement`: an input file changed during processing;
   - `Refined PCD count mismatch` / `Incomplete XYZI output`: output checks failed.
4. `REPORT.md` records frame/point counts, SOR removals, MLS no-output count, displacement RMS/max, per-stage timings, intensity range and association distances; displacement and point-count changes are not accuracy metrics (README).
5. In `records/native.json`: `solver` is `native Voxblox SimpleTsdfIntegrator + marching cubes`, `pose_optimization: false`, `zero_level_surface: true`.
