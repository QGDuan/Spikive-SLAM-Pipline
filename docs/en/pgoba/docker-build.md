# PGOBA Module — Docker Build Instructions

| Item | Value |
|---|---|
| Module | PGOBA |
| Applicable version | `Spikive-PGO` git `dev` @ `3560a85`; `Spikive-BA` git `main` @ `35324cb` |
| Last updated | 2026-09-10 |

This page has two parts: Part 1 covers the PGO image and build, Part 2 covers the BA image and build.

# Part 1: PGO (`Spikive-PGO`)

## 1. Image composition

`docker/Dockerfile` builds the image `spikive-slam:btc-noetic`:

| Item | Value |
|---|---|
| Base image | Ubuntu focal (`BASE_IMAGE` overridable; default Huawei Cloud mirror address) |
| apt packages | `build-essential`, `cmake`, `libeigen3-dev=3.3.7-2`, `libgoogle-glog-dev`, `libgflags-dev`, `libsuitesparse-dev`, `libboost-all-dev`, `libtbb-dev`, `libgeographic-dev`, `libapr1-dev`, `python3-dev`, `python3-numpy`, `python3-yaml`, `python3-catkin-tools`, `ros-noetic-ros-base`, `ros-noetic-pcl-ros`, `ros-noetic-pcl-conversions`, `ros-noetic-cv-bridge`, `ros-noetic-tf-conversions`, `ros-noetic-eigen-conversions`, `ros-noetic-mavros`, `ros-noetic-mavros-msgs`, `ros-noetic-rosbag`, `ros-noetic-rviz`, `ros-noetic-foxglove-bridge`, `ros-noetic-rostest`, `xauth`, `xvfb`, `mesa-utils`, `libgl1-mesa-dri` |
| Built from source | Ceres 2.1.0 (`CERES_COMMIT=783637a6...`), GTSAM 4.2.0 (`GTSAM_COMMIT=4f66a491...`), Livox-SDK v2.3.0, all installed to `/opt/spikive` |
| User | `developer` (UID/GID 1000) |
| Entrypoint | `/spikive-entrypoint.sh` (sources ROS and `/ws/devel/setup.bash`, then runs the command) |

`docker/versions.lock.yaml` records the version pins; `docker/verify/check_dependencies` EXACT-checks Eigen 3.3.7 / Ceres 2.1.0 / GTSAM 4.2.0.

## 2. Environment variables (`scripts/dev.sh`)

| Variable | Default | Meaning |
|---|---|---|
| `SPIKIVE_IMAGE` | `spikive-slam:btc-noetic` | image name |
| `SPIKIVE_STATE_DIR` | `$src_dir/.dev/standalone` | state dir (build/devel/workspace/home/ros) |
| `SPIKIVE_RESULTS_DIR` | `$src_dir/results` | results dir (mounted as `/results` in the container) |
| `SPIKIVE_DATA_DIR` | empty | read-only mount to `/data` |
| `SPIKIVE_SHM_SIZE` | `8g` | shared memory |
| `SPIKIVE_CONTAINER`, `SPIKIVE_DETACH` | empty / `0` | container name / detached mode |
| `ROS_MASTER_URI`, `ROS_IP` | `http://127.0.0.1:11311` / `127.0.0.1` | ROS networking |
| `OMP_NUM_THREADS`, `LIBGL_ALWAYS_SOFTWARE` | core count / `1` | compute and rendering |
| `BUILD_JOBS` | `4` | build parallelism |

## 3. Build commands

```bash
cd Spikive-PGO
python3 scripts/check_upstream_btc.py   # byte-level SHA256 verification of vendored BTC files
bash scripts/dev.sh build-image         # build the image; skip if already present
BUILD_JOBS=6 bash scripts/dev.sh build  # in-container catkin build
bash scripts/dev.sh check               # build and run check_dependencies
```

The command `dev.sh build` runs inside the container (`scripts/dev.sh:53-57`):

```bash
catkin_make -j4 -DCMAKE_BUILD_TYPE=Release -DCATKIN_WHITELIST_PACKAGES= \
  -DCMAKE_PREFIX_PATH=/opt/spikive\;/opt/ros/noetic \
  -DCeres_DIR=/opt/spikive/lib/cmake/Ceres \
  -DGTSAM_DIR=/opt/spikive/lib/cmake/GTSAM
```

`dev.sh` subcommands: `build-image`, `build`, `check`, `shell`, `launch` (`roslaunch spikive_btc online.launch`), `rviz`, `foxglove`, `test` (`rostest spikive_btc online.test`), `exec` (any command).

## 4. Build artifact locations

- Libraries: `devel/lib/libspikive_pgo.so`, `libspikive_gicp.so`, `libspikive_btc_upstream.a`, `libspikive_pcm_native.a`
- Executables: `devel/lib/spikive_btc/btc_online_node`, `replay_pgo`, `replay_gicp_refinement`, `check_native_clique`, `check_exported_pcd`
- Tests: `devel/lib/spikive_btc/test_submap_window`, `test_pgo`
- Message headers: `devel/include/spikive_btc/` (headers for the 6 msgs)

## 5. Test commands

From `Spikive-PGO/README.md`:

```bash
bash scripts/dev.sh build tests
bash scripts/dev.sh exec /ws/devel/lib/spikive_btc/test_submap_window
bash scripts/dev.sh exec /ws/devel/lib/spikive_btc/test_pgo
bash scripts/dev.sh exec bash -c 'cd /ws/build; ctest --output-on-failure -R "^(native_pcm_clique|full_map_export|all_scans_export)$"'
bash scripts/dev.sh exec rostest spikive_btc pgo_online.test
bash scripts/dev.sh exec rostest spikive_btc pgo_online.test gnc:=true
bash scripts/dev.sh exec rostest spikive_btc finish_export.test
bash scripts/dev.sh test  # known failure retained: upstream BTC tilted-revisit
```

## 6. Common errors and handling

| Symptom (basis) | Handling |
|---|---|
| `check_upstream_btc.py` reports file verification failures | `third_party/btc_descriptor` differs from upstream commit `742af157`; restore the files, or verify independently with `--upstream-git /path/to/btc_descriptor` |
| CMake reports Eigen/Ceres/GTSAM version mismatch (`CMakeLists.txt` uses `Eigen3 3.3.7 EXACT`, `Ceres 2.1.0 EXACT`, `GTSAM 4.2.0 EXACT`) | confirm `CMAKE_PREFIX_PATH=/opt/spikive;/opt/ros/noetic` and that `Ceres_DIR`/`GTSAM_DIR` point to `/opt/spikive` |
| `check` fails | inspect the output of `docker/verify/check_dependencies` and compare the three library versions |
| `roslaunch spikive_btc online.launch` cannot find `btc_online_node` | run `dev.sh build` first; confirm `/ws/devel/setup.bash` is sourced by the entrypoint |

# Part 2: BA (`Spikive-BA`)

## 7. Image composition (two stages)

`scripts/hba.sh build-env` builds the dependency image `spikive-ba-env:gtsam411` (`docker/Dockerfile.environment`):

| Item | Value |
|---|---|
| Base image | Ubuntu focal (same default address as PGO) |
| apt packages | same core toolchain as the PGO image, plus `libpcl-dev=1.10.0+dfsg-5ubuntu1`; no mavros/foxglove |
| Built from source | Ceres 2.1.0 (commit `783637a6...` → `/opt/spikive`), GTSAM 4.1.1 (commit `69a3a75...` → `/opt/hba-gtsam411`, `-DGTSAM_WITH_TBB=ON`, `-DGTSAM_BUILD_CONVENIENCE_LIBRARIES=OFF`) |
| Environment | `CMAKE_PREFIX_PATH=/opt/hba-gtsam411:/opt/spikive:/opt/ros/noetic` |

`scripts/hba.sh build-image` builds the main image `spikive-ba:v1.0.0-w20-g10` (`docker/Dockerfile`):

1. copies the repository to `/opt/spikive-ba-source`;
2. cmake configure (`-DCMAKE_INSTALL_PREFIX=/opt/spikive-ba`, `-DGTSAM_DIR=/opt/hba-gtsam411/lib/cmake/GTSAM`, `-DCeres_DIR=/opt/spikive/lib/cmake/Ceres`);
3. builds and installs to `/opt/spikive-ba`;
4. runs `ctest` in the build directory (4 test groups).

Build integration (`integration/hba/CMakeLists.txt`):

1. per-file verification of `third_party/HBA.sha256` (23 upstream files); mismatch → `FATAL_ERROR`;
2. copies the vendor tree to the build directory `hba-cauchy-source`;
3. applies `cauchy.patch` then `indoor_parameters.patch` (`patch --batch --fuzz=0 -p1`); failure → `FATAL_ERROR`;
4. builds `hba` (patched copy `source/hba.cpp`) and `visualize_map` (vendor tree `source/visualize.cpp`);
5. installs: executables to `lib/spikive_ba/`, patched source tree to `share/spikive_ba/native/HBA`, `hba-implementation.json` to `share/spikive_ba/native/`.

## 8. Environment variables (`scripts/hba.sh`)

| Variable | Default | Meaning |
|---|---|---|
| `HBA_IMAGE` | `spikive-ba:v1.0.0-w20-g10` | main image name |
| `HBA_BASE_IMAGE` | `spikive-ba-env:gtsam411` | dependency image name |
| `HBA_MEMORY` | `52g` | container memory and swap cap |
| `HBA_STATE_DIR` | `$repo_dir/.dev/hba` | work/ros/home state directory |
| `HBA_MASTER_PORT` | `11877` | ROS master port |
| `BUILD_JOBS` | `6` (build-env) / `4` (Dockerfile.environment) | build parallelism |

Runtime container mounts: input directory read-only at `/hba-input`, output parent writable, state dirs at `/hba-work`, `/hba-ros`, `/home/developer`; the image runs its installed fixed code and does not bind-mount a mutable source tree.

## 9. Build artifact locations

- Installed in the image: `/opt/spikive-ba/lib/spikive_ba/hba`, `/opt/spikive-ba/lib/spikive_ba/visualize_map`
- Python scripts: `/opt/spikive-ba/lib/spikive_ba/` (`hba_run.py` etc., installed via `catkin_install_python`)
- launch: `/opt/spikive-ba/share/spikive_ba/`
- native source copy and implementation declaration: `/opt/spikive-ba/share/spikive_ba/native/`

## 10. Common errors and handling

| Symptom (basis) | Handling |
|---|---|
| build reports `Official HBA source changed: <file>` (`integration/hba/CMakeLists.txt:12-20`) | the vendor tree was modified; restore the 23 upstream `third_party/HBA` files (commit `a0cdd47`) |
| build reports `Declared HBA Cauchy patch did not apply cleanly` (CMakeLists.txt:32-34) | check `include/hba.hpp` against upstream; the patch applies strictly with `--fuzz=0` |
| build reports `Declared HBA indoor parameter patch did not apply cleanly` (CMakeLists.txt:35-39) | same, involving `include/hba.hpp` and `include/ba.hpp` |
| CMake reports GTSAM/PCL/Eigen version mismatch (`GTSAM 4.1.1 EXACT`, `PCL 1.10.0 EXACT`, `Eigen3 3.3.7 EXACT`) | confirm `CMAKE_PREFIX_PATH` starts with `/opt/hba-gtsam411` and `GTSAM_DIR` points there |
| `hba.sh run` reports `Output already exists` (`hba.sh:26`) | use a new output directory; overwrite is not allowed |
| the `hba` binary cannot find `libgtsam.so.4` | confirm `LD_LIBRARY_PATH` contains `/opt/hba-gtsam411/lib` (set by the entrypoint); `hba_run.py`'s `verify_native` checks linkage with `ldd` |

## 11. Isolation of the two GTSAM versions

- PGO image: GTSAM 4.2.0 installed under `/opt/spikive`;
- BA image: GTSAM 4.1.1 installed under `/opt/hba-gtsam411`.

Each repository uses its own image and build prefix; there is no build that shares one GTSAM cache across a whole workspace (original text of `Spikive-BA/README.md`).
