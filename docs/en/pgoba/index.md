# PGOBA Module

| Item | Value |
|---|---|
| Module | PGOBA (loop detection + pose-graph optimization + global BA) |
| Applicable version | `Spikive-PGO` git `dev` @ `3560a85` (ROS package `spikive_btc` 0.1.0); `Spikive-BA` git `main` @ `35324cb` (ROS package `spikive_ba` 1.0.0) |
| Last updated | 2026-09-10 |

## 1. Module position

This module consists of two independent repositories forming a two-stage backend: "loop closure and pose-graph optimization (PGO) → global BA (BA)":

| Repository | Responsibility |
|---|---|
| `Spikive-PGO` (ROS package `spikive_btc`) | upstream BTC retrieval → GICP refinement → 1% drift-ratio check → PCM → optional GNC-TLS → iSAM2. Input is raw FastLIO body clouds and odometry; no SLAM frontend source is included (repository README) |
| `Spikive-BA` (ROS package `spikive_ba`) | raw body cloud bag + external pose.txt → HBA hierarchical geometric BA → top-edge Cauchy-PGO → full map and new poses. Fixed 20/10, 3-layer version; runs no BTC and does not depend on Spikive-PGO sources (repository README) |

The two repositories use isolated GTSAM versions: PGO uses 4.2.0 (`/opt/spikive`), BA uses 4.1.1 (`/opt/hba-gtsam411`), in separate images and build prefixes.

## 2. Package information

| Item | PGO | BA |
|---|---|---|
| Source directory | `Spikive-PGO/` | `Spikive-BA/` |
| ROS package | `spikive_btc` | `spikive_ba` |
| Version | `0.1.0` | `1.0.0` |
| Build system | catkin, CMake ≥ 3.16, C++17 | catkin, CMake ≥ 3.16, C++17 |
| Version-lock files | `docker/versions.lock.yaml` | `docker/hba.lock.yaml`, `docker/image.lock.json` |
| Third party | `third_party/btc_descriptor` (upstream BTC, commit `742af157`), `third_party/Kimera-RPGO` (PCM), `third_party/small_gicp` (GICP) | `third_party/HBA` (upstream HBA, commit `a0cdd47`, 23 files + SHA256 manifest) |

## 3. File list

### 3.1 `Spikive-PGO/`

| File / directory | Responsibility |
|---|---|
| `src/btc_online_node.cpp` | online node `btc_online`: input sync, submaps, BTC, GICP, PGO, publishing and export |
| `src/pgo_backend.{cpp,hpp}` | `PoseGraph`: GTSAM pose-graph backend (append, loop consideration, EOF final PGO) |
| `src/robust_optimizer.{cpp,hpp}` | `optimizeRobust`: PCM filtering + optional GNC + iSAM2 solve |
| `src/gnc_isam2.hpp` | `GncIsam2Optimizer`: ISAM2 adapter for GNC weighted subproblems |
| `src/gicp_refine.{cpp,hpp}` | `refineGicp`: small_gicp GICP refinement |
| `src/submap_window.hpp` | `SubmapWindow`: sliding submap window |
| `src/replay_pgo.cpp`, `src/replay_gicp_refinement.cpp` | frozen-graph replay and candidate-refinement replay tools |
| `config/` | `btc_pgo.yaml` (production backend), `online.yaml` (legacy node), `guigang_recorded.yaml`, `saier8biao_btc.yaml`, `saier8biao_slam.yaml`, `robust_profiles/` (pcm.yaml, pcm_gnc.yaml) |
| `launch/` | 8 launch files (see `commandline.md`) |
| `msg/` | `PlaceRecognition`, `LoopConstraint`, `PgoStatus`, `RobustStatus`, `RefinementDiagnostics`, `FinalPgoStatus` |
| `scripts/` | `dev.sh` (container orchestration entry) plus 6 .sh and 30 .py scripts (preparation, execution, export, audit) |
| `docker/` | `Dockerfile`, `entrypoint.sh`, `versions.lock.yaml`, `verify/` (dependency check) |
| `docs/` | 10 notes (`frame_contract.md`, `btc-pgo.md`, `pcm-gnc-pgo.md`, etc.) |
| `rviz/` | 6 RViz configs |
| `results/` | runtime output directory (git-ignored, currently empty) |

### 3.2 `Spikive-BA/`

| File / directory | Responsibility |
|---|---|
| `integration/hba/CMakeLists.txt` | verifies the HBA vendor tree SHA256, copies a build-local tree, applies 2 patches, builds `hba`, `visualize_map` and 2 tests |
| `integration/hba/cauchy.patch` | changes top-layer BA edge noise to the Cauchy(1) robust kernel |
| `integration/hba/indoor_parameters.patch` | BA parameter adjustments (max_iter 30, voxel 0.5 m, downsample 0.05 m, WIN_SIZE 20, GAP 10, etc.) |
| `integration/hba/top_edge_noise.hpp` | `spikive_hba::topEdgeNoise`: Cauchy(1) noise-model factory |
| `integration/hba/test_cauchy.cpp`, `test_window.cpp` | CTests: Cauchy math verification; 20/10 hierarchical window verification |
| `launch/global_ba.launch` | the only entry: starts the `hba_run.py` orchestration node |
| `scripts/hba.sh` | image build and run orchestration |
| `scripts/hba_run.py`, `hba_inputs.py`, `pose_io.py` | flow orchestration, input adaptation, pose/cloud I/O |
| `docker/` | `Dockerfile` (build image), `Dockerfile.environment` (dependency image), `hba-entrypoint.sh`, lock files |
| `provenance/migration.json` | migration source and per-function SHA256 records |
| `test/` | 4 Python test/audit scripts |
| `third_party/HBA/` | complete upstream HBA sources (`include/{hba,ba,mypcl,tools}.hpp`, `source/{hba,visualize,calculate_MME}.cpp`, launch, rviz_cfg) |

## 4. Sub-documents

| File | Content |
|---|---|
| `commandline.md` | PGO three-terminal online run, offline rebuild, dataset orchestration scripts, BA hba.sh entry, outputs and interpretation |
| `docker-build.md` | images, dependencies, environment variables, build commands, artifacts, common errors for both repositories |
| `architecture.md` | source architecture of BTC/PCM/GNC/iSAM2 and HBA, call chains, input contract, key configuration |

## 5. Quick start

```bash
# PGO: build (Spikive-PGO repository root)
python3 scripts/check_upstream_btc.py
bash scripts/dev.sh build-image
BUILD_JOBS=6 bash scripts/dev.sh build
bash scripts/dev.sh check

# BA: build and run (Spikive-BA repository root)
bash scripts/hba.sh build-env
bash scripts/hba.sh build-image
bash scripts/hba.sh run /absolute/INPUT_DIR /absolute/OUTPUT_DIR
```

Full run commands are in `commandline.md`.

## 6. Interfaces with other modules

- PGO input: `/cloud_registered_body` (frame `body`) and `/Odometry` (`T_camera_init_body`) from the SLAM module; contract in `Spikive-PGO/docs/frame_contract.md`.
- PGO output: `optimized_body_odometry.bag`, `optimized_pose.txt` (BA input).
- BA output: `optimized_map_all_scans.pcd`, `optimized_pose.txt` (PCL module input).
- Full pipeline: `docs/en/appendix/system-overview.md`.
