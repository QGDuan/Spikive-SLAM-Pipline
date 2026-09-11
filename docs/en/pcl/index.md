# PCL Module (Spikive-Pcl-Process)

| Item | Value |
|---|---|
| Module | PCL (offline refinement of the HBA full map) |
| Applicable version | `Spikive-Pcl-Process` git `main` @ `249b488`, fixed version `1.0.0` (`VERSION` file) |
| Last updated | 2026-09-10 |

## 1. Module position

Standalone offline program `pcl_process` (CMake project `spikive_pcl_process`). Processing chain (README original text):

```text
HBA full map → optional PCL SOR → PCL MLS → Voxblox TSDF in original scan order → parallel vertex export / intensity transfer → refined_map.pcd (XYZI)
```

Factual boundaries:

- starts no ROS, RViz, ICP, PGO or BA; ROS1 bags are decoded at file level by the Python `rosbags` library;
- the C++ core depends on neither ROS nor GTSAM;
- does not modify HBA poses or existing results, does not apply historical flight-controller RT, does not fuse the complete map repeatedly as every frame;
- `CATKIN_IGNORE` prevents catkin from recursively building the ROS packages under `third_party`; this repository uses its own standalone build entry.

## 2. Package information

| Item | Value |
|---|---|
| Source directory | `Spikive-Pcl-Process/` |
| Project | `spikive_pcl_process` (version from `VERSION` = 1.0.0) |
| Build system | CMake ≥ 3.16, C++17 (standalone project, not a catkin package) |
| Executable | `pcl_process` (usage in `commandline.md`) |
| Runtime image | `spikive-pcl-process:1.0.0` |
| Upstream | PCL MLS (system library), Voxblox (commit `c8066b0`), minkindr (commit `564f126`), vendored under `third_party/`, verified by `third_party.lock.json` |

## 3. File list

| File / directory | Responsibility |
|---|---|
| `CMakeLists.txt` | EXACT dependency pins; runs `scripts/verify_vendor.py` at configure time; builds `voxblox_core`, `process_core`, `pcl_process` and 3 tests; registers 6 CTest groups |
| `VERSION` | version `1.0.0` |
| `CATKIN_IGNORE` | content: "Standalone offline CMake project. Do not discover third_party ROS packages." |
| `include/process/pipeline.hpp` | structs and declarations: `Config`, `Frame`, `Smoothed`, `FusionStats`, `IntensityStats`; `readConfig`, `readFrames`, `smooth`, `fuse`, `attachIntensity` |
| `include/process/surface_export.hpp` | `exportSurfacePoints` (parallel mesh-vertex export), `availableCpuCount`, `resolveThreads` |
| `src/main.cpp` | `pcl_process` entry: load map → read frame index → `smooth` → `fuse` → `attachIntensity` → write `refined_map.pcd.partial` → PCL read-back check → write `native.json` |
| `src/pipeline.cpp` | `readConfig`, `readFrames`, `smooth` (optional SOR + tiled MLS), `fuse` (TSDF integration + marching cubes + parallel export) |
| `src/surface_export.cpp` | vertex export and dedup (bit-identical to native `getConnectedMesh()`) |
| `src/intensity.cpp` | `attachIntensity`: K=1 exact nearest-neighbor intensity transfer |
| `config/indoor.yaml` | the only config file (schema 1) |
| `scripts/process.sh` | host entry: `version` / `build` / `test` / `run` |
| `scripts/process.py` | image ENTRYPOINT: three-stage orchestration with validation, generates `REPORT.md` and `records/` |
| `scripts/hba_io.py` | read-only HBA adapter: TUM pose parsing, strict binary PCD contract, `frames.bin` generation |
| `scripts/verify_vendor.py` | per-file SHA256 verification against `third_party.lock.json` |
| `docker/` | `Dockerfile` (main image), `Dockerfile.environment` (point-cloud-only dependency image), `requirements.txt`, `runtime.lock.json` |
| `tests/` | `test_pipeline.cpp`, `test_export.cpp`, `test_intensity.cpp`, `test_io.py`, `test_integration.py` |
| `third_party/` | `voxblox/`, `minkindr/` (40 tracked files, SHA256-locked) |
| `VALIDATION.md` | baseline acceptance records (saier2biao XYZI run03, etc.) |

## 4. Sub-documents

| File | Content |
|---|---|
| `commandline.md` | command-line usage: parameters, inputs/outputs, interpretation |
| `docker-build.md` | images and dependencies, build commands, artifacts, common errors |
| `architecture.md` | source architecture: pipeline, core functions, data contract, key configuration |

## 5. Quick start

```bash
bash scripts/process.sh build
bash scripts/process.sh test

bash scripts/process.sh run HBA_DIR BODY_BAG NEW_OUTPUT_DIR \
  --sensor-origin-body ORIGIN_X ORIGIN_Y ORIGIN_Z \
  --sensor-origin-note "calibration source and approximation note"
```

Prerequisites and constraints are in `commandline.md`.

## 6. Interfaces with other modules

- Input: `optimized_map_all_scans.pcd` (HBA full-scan-order XYZI) and `optimized_pose.txt` (TUM, `T_world_body`) produced by the PGOBA module (`Spikive-BA`), plus the original body bag used to produce those results.
- Output: `refined_map.pcd` (FLOAT32 XYZI) + `REPORT.md` + `records/`.
- Full pipeline: `docs/en/appendix/system-overview.md`.
