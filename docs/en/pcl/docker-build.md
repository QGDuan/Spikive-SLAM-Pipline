# PCL Module — Docker Build Instructions

| Item | Value |
|---|---|
| Module | PCL |
| Applicable version | `Spikive-Pcl-Process` git `main` @ `249b488` (v1.0.0) |
| Last updated | 2026-09-10 |

## 1. Image composition (two stages)

### 1.1 Dependency image (optional path)

`docker/Dockerfile.environment` (`FROM ubuntu:20.04`) installs:

- `build-essential`, `cmake`, `python3`, `ca-certificates`;
- `libpcl-dev=1.10.0+dfsg-5ubuntu1`, `libeigen3-dev=3.3.7-2`, `libgoogle-glog-dev=0.4.0-1build1`, `libyaml-cpp-dev=0.6.2-4ubuntu1`.

The comments (`Dockerfile.environment:8-9`) state: the main Dockerfile additionally installs pinned protobuf and isolated Python packages; the processing core needs no ROS node, GTSAM, HBA or PGO sources.

Default path: the main Dockerfile uses `spikive-ba-env:gtsam411` (the BA dependency image of the PGOBA module) as its base, reusing its installed PCL/Eigen; that image is not modified.

### 1.2 Main image

`docker/Dockerfile` (`ARG BASE_IMAGE=spikive-ba-env:gtsam411`):

1. installs `libprotobuf-dev=3.6.1.3-2ubuntu5.2`, `protobuf-compiler=3.6.1.3-2ubuntu5.2`, `python3-pip=20.0.2-5ubuntu1.11`;
2. `pip install --no-deps --target /opt/process-python -r docker/requirements.txt` (8 pinned packages: numpy 1.24.4, rosbags 0.9.23, lz4, zstandard, ruamel.yaml 0.18.6, PyYAML 6.0.2, etc.), `ENV PYTHONPATH=/opt/process-python`;
3. copies the sources to `/opt/Spikive-Pcl-Process`;
4. `cmake -S /opt/Spikive-Pcl-Process -B /opt/process-build -DCMAKE_BUILD_TYPE=Release` → `cmake --build --parallel 4` → `ctest --output-on-failure`;
5. `ENV PROCESS_ENGINE=/opt/process-build/pcl_process`;
6. `ENTRYPOINT ["python3", "/opt/Spikive-Pcl-Process/scripts/process.py"]`.

Image name: `spikive-pcl-process:1.0.0` (formed by `process.sh` from `VERSION`). `docker/runtime.lock.json` records the actual image ID, exact apt versions, engine SHA256 and acceptance records.

## 2. Dependency list (`CMakeLists.txt`)

| Dependency | Version requirement |
|---|---|
| PCL | `1.10.0 EXACT`, components `common io filters search surface` |
| Eigen3 | `3.3.7 EXACT` (`NO_MODULE`) |
| Protobuf | `3.6.1 EXACT` |
| glog | `libglog=0.4.0` (pkg-config) |
| yaml-cpp | unpinned |
| OpenMP, Threads, Python3 | unpinned |

At configure time `scripts/verify_vendor.py` runs (SHA256 over all 40 files of `third_party.lock.json`); failure → `FATAL_ERROR: Upstream source verification failed`.

## 3. Build commands

```bash
# standard path (reuses spikive-ba-env:gtsam411)
bash scripts/process.sh build

# point-cloud-only dependency path when no local HBA dependency image exists (README original text)
docker build -f docker/Dockerfile.environment -t spikive-pcl-env:pcl110 .
docker build -f docker/Dockerfile --build-arg BASE_IMAGE=spikive-pcl-env:pcl110 \
  -t spikive-pcl-process:1.0.0 .

# tests
bash scripts/process.sh test
```

`process.sh build` runs `verify_vendor.py` before `docker build` and tags the image with `org.opencontainers.image.version`. `process.sh test` runs all 6 CTest groups inside the image via `ctest --output-on-failure` (`--network none`).

## 4. Build artifact locations

- engine: `/opt/process-build/pcl_process` in the image (the `PROCESS_ENGINE` env var points to it);
- static libraries: `/opt/process-build/libvoxblox_core.a`, `libprocess_core.a`;
- tests: `test_pipeline`, `test_export`, `test_intensity` (under `/opt/process-build/`);
- Python orchestration: `/opt/Spikive-Pcl-Process/scripts/process.py` in the image (ENTRYPOINT).

## 5. Environment variables

| Variable | Value | Source |
|---|---|---|
| `PROCESS_ENGINE` | `/opt/process-build/pcl_process` | `Dockerfile:17`; read by `process.py:34` (falls back to `build/pcl_process` when unset) |
| `PYTHONPATH` | `/opt/process-python` | `Dockerfile:12` |

## 6. Common errors and handling

| Symptom (basis) | Handling |
|---|---|
| configure reports `Upstream source verification failed` (`CMakeLists.txt:7-11`) | voxblox/minkindr files under `third_party/` mismatch `third_party.lock.json`; restore the vendor tree or re-run `git submodule update` |
| CMake reports PCL/Eigen/Protobuf version mismatch (EXACT pins) | use the dependency image (`spikive-ba-env:gtsam411` or `spikive-pcl-env:pcl110`), or install the pinned versions in a self-built environment |
| `pkg_check_modules(GLOG)` fails | install `libgoogle-glog-dev=0.4.0-1build1` |
| runtime `Build the processing engine first` (`process.py:35`) | the file `PROCESS_ENGINE` points to does not exist; confirm the image was built |
| runtime `Unsupported configuration` / `Explicit sensor origin required` | `config` schema must be 1; `sensor_origin_body_m` must be a finite 3-element list and `sensor_origin_note` must be non-empty |
| pip package conflicts | dependencies are installed isolated with `--no-deps --target /opt/process-python` (`Dockerfile:11`), not into the system site-packages |
