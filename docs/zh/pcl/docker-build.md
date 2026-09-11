# PCL 模块 Docker 环境编译说明

| 项 | 值 |
|---|---|
| 模块名 | PCL |
| 适用版本 | `Spikive-Pcl-Process` git `main` @ `249b488`（v1.0.0） |
| 最后更新 | 2026-09-10 |

## 1. 镜像构成（两级）

### 1.1 依赖镜像（可选路径）

`docker/Dockerfile.environment`（`FROM ubuntu:20.04`）安装：

- `build-essential`、`cmake`、`python3`、`ca-certificates`；
- `libpcl-dev=1.10.0+dfsg-5ubuntu1`、`libeigen3-dev=3.3.7-2`、`libgoogle-glog-dev=0.4.0-1build1`、`libyaml-cpp-dev=0.6.2-4ubuntu1`。

注释说明（`Dockerfile.environment:8-9`）：主 Dockerfile 另行安装固定版 protobuf 与隔离 Python 包；处理核心不需要 ROS 节点、GTSAM、HBA 或 PGO 源码。

默认路径：主 Dockerfile 以 `spikive-ba-env:gtsam411`（PGOBA 模块 BA 的依赖镜像）为基础镜像，复用其中已安装的 PCL/Eigen；不改动该镜像。

### 1.2 主镜像

`docker/Dockerfile`（`ARG BASE_IMAGE=spikive-ba-env:gtsam411`）：

1. 安装 `libprotobuf-dev=3.6.1.3-2ubuntu5.2`、`protobuf-compiler=3.6.1.3-2ubuntu5.2`、`python3-pip=20.0.2-5ubuntu1.11`；
2. `pip install --no-deps --target /opt/process-python -r docker/requirements.txt`（8 个固定版本包：numpy 1.24.4、rosbags 0.9.23、lz4、zstandard、ruamel.yaml 0.18.6、PyYAML 6.0.2 等），`ENV PYTHONPATH=/opt/process-python`；
3. 复制源码到 `/opt/Spikive-Pcl-Process`；
4. `cmake -S /opt/Spikive-Pcl-Process -B /opt/process-build -DCMAKE_BUILD_TYPE=Release` → `cmake --build --parallel 4` → `ctest --output-on-failure`；
5. `ENV PROCESS_ENGINE=/opt/process-build/pcl_process`；
6. `ENTRYPOINT ["python3", "/opt/Spikive-Pcl-Process/scripts/process.py"]`。

镜像名：`spikive-pcl-process:1.0.0`（`process.sh` 按 `VERSION` 拼接）。`docker/runtime.lock.json` 记录实际镜像 ID、apt 精确版本、引擎 SHA256 与验收记录。

## 2. 依赖清单（`CMakeLists.txt`）

| 依赖 | 版本要求 |
|---|---|
| PCL | `1.10.0 EXACT`，组件 `common io filters search surface` |
| Eigen3 | `3.3.7 EXACT`（`NO_MODULE`） |
| Protobuf | `3.6.1 EXACT` |
| glog | `libglog=0.4.0`（pkg-config） |
| yaml-cpp | 无版本要求 |
| OpenMP、Threads、Python3 | 无版本要求 |

配置阶段强制运行 `scripts/verify_vendor.py`（对 `third_party.lock.json` 全部 40 个文件做 SHA256 校验），失败即 `FATAL_ERROR: Upstream source verification failed`。

## 3. 构建命令

```bash
# 标准路径（复用 spikive-ba-env:gtsam411）
bash scripts/process.sh build

# 无本机 HBA 依赖镜像时的纯点云依赖路径（README 原文）
docker build -f docker/Dockerfile.environment -t spikive-pcl-env:pcl110 .
docker build -f docker/Dockerfile --build-arg BASE_IMAGE=spikive-pcl-env:pcl110 \
  -t spikive-pcl-process:1.0.0 .

# 测试
bash scripts/process.sh test
```

`process.sh build` 先运行 `verify_vendor.py` 再 `docker build`，并打上 `org.opencontainers.image.version` 标签。`process.sh test` 以 `ctest --output-on-failure` 在镜像内运行全部 6 组测试（`--network none`）。

## 4. 编译产物位置

- 引擎：镜像内 `/opt/process-build/pcl_process`（`PROCESS_ENGINE` 环境变量指向该路径）；
- 静态库：`/opt/process-build/libvoxblox_core.a`、`libprocess_core.a`；
- 测试：`test_pipeline`、`test_export`、`test_intensity`（`/opt/process-build/`）；
- Python 编排：镜像内 `/opt/Spikive-Pcl-Process/scripts/process.py`（ENTRYPOINT）。

## 5. 环境变量

| 变量 | 值 | 来源 |
|---|---|---|
| `PROCESS_ENGINE` | `/opt/process-build/pcl_process` | `Dockerfile:17`；`process.py:34` 读取（未设置时回退 `build/pcl_process`） |
| `PYTHONPATH` | `/opt/process-python` | `Dockerfile:12` |

## 6. 常见报错及处理

| 现象（依据） | 处理方式 |
|---|---|
| 配置期 `Upstream source verification failed`（`CMakeLists.txt:7-11`） | `third_party/` 内 voxblox/minkindr 文件与 `third_party.lock.json` 不符；恢复 vendor 树或重新 `git submodule update` |
| CMake 报 PCL/Eigen/Protobuf 版本不匹配（EXACT 锁定） | 确认使用依赖镜像（`spikive-ba-env:gtsam411` 或 `spikive-pcl-env:pcl110`），或在自建环境安装锁定版本 |
| `pkg_check_modules(GLOG)` 失败 | 安装 `libgoogle-glog-dev=0.4.0-1build1` |
| 运行时 `Build the processing engine first`（`process.py:35`） | `PROCESS_ENGINE` 指向的文件不存在；确认镜像构建完成 |
| 运行时 `Unsupported configuration` / `Explicit sensor origin required` | `config` schema 必须为 1；`sensor_origin_body_m` 必须是三元素有限值序列且 `sensor_origin_note` 非空 |
| `pip` 包冲突 | 依赖使用 `--no-deps --target /opt/process-python` 隔离安装（`Dockerfile:11`），不进入系统 site-packages |
