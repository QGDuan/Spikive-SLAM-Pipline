# PGOBA 模块 Docker 环境编译说明

| 项 | 值 |
|---|---|
| 模块名 | PGOBA |
| 适用版本 | `Spikive-PGO` git `dev` @ `3560a85`；`Spikive-BA` git `main` @ `35324cb` |
| 最后更新 | 2026-09-10 |

本文件分两部分：第一部分为 PGO 镜像与构建，第二部分为 BA 镜像与构建。

# 第一部分：PGO（`Spikive-PGO`）

## 1. 镜像构成

`docker/Dockerfile` 构建镜像 `spikive-slam:btc-noetic`：

| 项 | 值 |
|---|---|
| 基础镜像 | Ubuntu focal（`BASE_IMAGE` 可覆盖，默认华为云镜像地址） |
| apt 包 | `build-essential`、`cmake`、`libeigen3-dev=3.3.7-2`、`libgoogle-glog-dev`、`libgflags-dev`、`libsuitesparse-dev`、`libboost-all-dev`、`libtbb-dev`、`libgeographic-dev`、`libapr1-dev`、`python3-dev`、`python3-numpy`、`python3-yaml`、`python3-catkin-tools`、`ros-noetic-ros-base`、`ros-noetic-pcl-ros`、`ros-noetic-pcl-conversions`、`ros-noetic-cv-bridge`、`ros-noetic-tf-conversions`、`ros-noetic-eigen-conversions`、`ros-noetic-mavros`、`ros-noetic-mavros-msgs`、`ros-noetic-rosbag`、`ros-noetic-rviz`、`ros-noetic-foxglove-bridge`、`ros-noetic-rostest`、`xauth`、`xvfb`、`mesa-utils`、`libgl1-mesa-dri` |
| 源码编译 | Ceres 2.1.0（`CERES_COMMIT=783637a6...`）、GTSAM 4.2.0（`GTSAM_COMMIT=4f66a491...`）、Livox-SDK v2.3.0，均安装至 `/opt/spikive` |
| 用户 | `developer`（UID/GID 1000） |
| 入口 | `/spikive-entrypoint.sh`（source ROS 与 `/ws/devel/setup.bash` 后执行命令） |

`docker/versions.lock.yaml` 记录版本锁；`docker/verify/` 内 `check_dependencies` 对 Eigen 3.3.7 / Ceres 2.1.0 / GTSAM 4.2.0 做 EXACT 校验。

## 2. 环境变量（`scripts/dev.sh`）

| 变量 | 默认值 | 含义 |
|---|---|---|
| `SPIKIVE_IMAGE` | `spikive-slam:btc-noetic` | 镜像名 |
| `SPIKIVE_STATE_DIR` | `$src_dir/.dev/standalone` | 状态目录（build/devel/workspace/home/ros） |
| `SPIKIVE_RESULTS_DIR` | `$src_dir/results` | 结果目录（挂载为容器内 `/results`） |
| `SPIKIVE_DATA_DIR` | 空 | 只读挂载到 `/data` |
| `SPIKIVE_SHM_SIZE` | `8g` | 共享内存 |
| `SPIKIVE_CONTAINER`、`SPIKIVE_DETACH` | 空 / `0` | 容器命名 / 后台运行 |
| `ROS_MASTER_URI`、`ROS_IP` | `http://127.0.0.1:11311` / `127.0.0.1` | ROS 网络 |
| `OMP_NUM_THREADS`、`LIBGL_ALWAYS_SOFTWARE` | 核数 / `1` | 计算与渲染 |
| `BUILD_JOBS` | `4` | 构建并行度 |

## 3. 构建命令

```bash
cd Spikive-PGO
python3 scripts/check_upstream_btc.py   # 校验 vendored BTC 文件（逐字节 SHA256）
bash scripts/dev.sh build-image         # 构建镜像；已有镜像可跳过
BUILD_JOBS=6 bash scripts/dev.sh build  # 容器内 catkin 构建
bash scripts/dev.sh check               # 构建并运行 check_dependencies
```

`dev.sh build` 在容器内执行的命令（`scripts/dev.sh:53-57`）：

```bash
catkin_make -j4 -DCMAKE_BUILD_TYPE=Release -DCATKIN_WHITELIST_PACKAGES= \
  -DCMAKE_PREFIX_PATH=/opt/spikive\;/opt/ros/noetic \
  -DCeres_DIR=/opt/spikive/lib/cmake/Ceres \
  -DGTSAM_DIR=/opt/spikive/lib/cmake/GTSAM
```

`dev.sh` 子命令：`build-image`、`build`、`check`、`shell`、`launch`（`roslaunch spikive_btc online.launch`）、`rviz`、`foxglove`、`test`（`rostest spikive_btc online.test`）、`exec`（任意命令）。

## 4. 编译产物位置

- 库：`devel/lib/libspikive_pgo.so`、`libspikive_gicp.so`、`libspikive_btc_upstream.a`、`libspikive_pcm_native.a`
- 可执行：`devel/lib/spikive_btc/btc_online_node`、`replay_pgo`、`replay_gicp_refinement`、`check_native_clique`、`check_exported_pcd`
- 测试：`devel/lib/spikive_btc/test_submap_window`、`test_pgo`
- 消息头：`devel/include/spikive_btc/`（6 个 msg 对应头文件）

## 5. 测试命令

取自 `Spikive-PGO/README.md`：

```bash
bash scripts/dev.sh build tests
bash scripts/dev.sh exec /ws/devel/lib/spikive_btc/test_submap_window
bash scripts/dev.sh exec /ws/devel/lib/spikive_btc/test_pgo
bash scripts/dev.sh exec bash -c 'cd /ws/build; ctest --output-on-failure -R "^(native_pcm_clique|full_map_export|all_scans_export)$"'
bash scripts/dev.sh exec rostest spikive_btc pgo_online.test
bash scripts/dev.sh exec rostest spikive_btc pgo_online.test gnc:=true
bash scripts/dev.sh exec rostest spikive_btc finish_export.test
bash scripts/dev.sh test  # 保留的已知失败：官方 BTC 倾斜重访
```

## 6. 常见报错及处理

| 现象（依据） | 处理方式 |
|---|---|
| `check_upstream_btc.py` 报文件校验失败 | `third_party/btc_descriptor` 与官方提交 `742af157` 不一致；恢复原文件或用 `--upstream-git /path/to/btc_descriptor` 独立核验 |
| CMake 报 Eigen/Ceres/GTSAM 版本不匹配（`CMakeLists.txt` 使用 `Eigen3 3.3.7 EXACT`、`Ceres 2.1.0 EXACT`、`GTSAM 4.2.0 EXACT`） | 确认 `CMAKE_PREFIX_PATH=/opt/spikive;/opt/ros/noetic` 与 `Ceres_DIR`、`GTSAM_DIR` 指向 `/opt/spikive` |
| `check` 失败 | 运行 `docker/verify/check_dependencies` 的输出，比对三库版本 |
| 容器内 `roslaunch spikive_btc online.launch` 找不到 `btc_online_node` | 先执行 `dev.sh build`；确认 `/ws/devel/setup.bash` 被 entrypoint 加载 |

# 第二部分：BA（`Spikive-BA`）

## 7. 镜像构成（两级）

`scripts/hba.sh build-env` 构建依赖镜像 `spikive-ba-env:gtsam411`（`docker/Dockerfile.environment`）：

| 项 | 值 |
|---|---|
| 基础镜像 | Ubuntu focal（同 PGO 默认地址） |
| apt 包 | 同 PGO 镜像的核心工具链，另含 `libpcl-dev=1.10.0+dfsg-5ubuntu1`；不含 mavros/foxglove |
| 源码编译 | Ceres 2.1.0（commit `783637a6...` → `/opt/spikive`）、GTSAM 4.1.1（commit `69a3a75...` → `/opt/hba-gtsam411`，`-DGTSAM_WITH_TBB=ON`、`-DGTSAM_BUILD_CONVENIENCE_LIBRARIES=OFF`） |
| 环境 | `CMAKE_PREFIX_PATH=/opt/hba-gtsam411:/opt/spikive:/opt/ros/noetic` |

`scripts/hba.sh build-image` 构建主镜像 `spikive-ba:v1.0.0-w20-g10`（`docker/Dockerfile`）：

1. 把仓库复制到 `/opt/spikive-ba-source`；
2. cmake 配置（`-DCMAKE_INSTALL_PREFIX=/opt/spikive-ba`、`-DGTSAM_DIR=/opt/hba-gtsam411/lib/cmake/GTSAM`、`-DCeres_DIR=/opt/spikive/lib/cmake/Ceres`）；
3. 构建并安装到 `/opt/spikive-ba`；
4. 在构建目录运行 `ctest`（4 组测试）。

构建集成（`integration/hba/CMakeLists.txt`）：

1. 逐文件校验 `third_party/HBA.sha256`（23 个官方文件），不一致即 `FATAL_ERROR`；
2. 把 vendor 树复制到构建目录 `hba-cauchy-source`；
3. 依次应用 `cauchy.patch`、`indoor_parameters.patch`（`patch --batch --fuzz=0 -p1`），应用失败即 `FATAL_ERROR`；
4. 编译 `hba`（打补丁副本 `source/hba.cpp`）与 `visualize_map`（vendor 原树 `source/visualize.cpp`）；
5. 安装：可执行到 `lib/spikive_ba/`，补丁后源码树到 `share/spikive_ba/native/HBA`，`hba-implementation.json` 到 `share/spikive_ba/native/`。

## 8. 环境变量（`scripts/hba.sh`）

| 变量 | 默认值 | 含义 |
|---|---|---|
| `HBA_IMAGE` | `spikive-ba:v1.0.0-w20-g10` | 主镜像名 |
| `HBA_BASE_IMAGE` | `spikive-ba-env:gtsam411` | 依赖镜像名 |
| `HBA_MEMORY` | `52g` | 容器内存与 swap 上限 |
| `HBA_STATE_DIR` | `$repo_dir/.dev/hba` | work/ros/home 状态目录 |
| `HBA_MASTER_PORT` | `11877` | ROS master 端口 |
| `BUILD_JOBS` | `6`（build-env）/ `4`（Dockerfile.environment） | 构建并行度 |

运行容器挂载：输入目录只读挂载 `/hba-input`，输出父目录可写挂载，状态目录挂载 `/hba-work`、`/hba-ros`、`/home/developer`；镜像内使用安装的固定代码，不挂载可变源码树。

## 9. 编译产物位置

- 镜像内安装：`/opt/spikive-ba/lib/spikive_ba/hba`、`/opt/spikive-ba/lib/spikive_ba/visualize_map`
- Python 脚本：`/opt/spikive-ba/lib/spikive_ba/`（`hba_run.py` 等，经 `catkin_install_python` 安装）
- launch：`/opt/spikive-ba/share/spikive_ba/`
- 原生源码副本与实现声明：`/opt/spikive-ba/share/spikive_ba/native/`

## 10. 常见报错及处理

| 现象（依据） | 处理方式 |
|---|---|
| 构建报 `Official HBA source changed: <文件>`（`integration/hba/CMakeLists.txt:12-20`） | vendor 树被改动；恢复 `third_party/HBA` 官方 23 个文件（commit `a0cdd47`） |
| 构建报 `Declared HBA Cauchy patch did not apply cleanly`（CMakeLists.txt:32-34） | 检查 vendor 树 `include/hba.hpp` 是否与官方一致；补丁按 `--fuzz=0` 严格应用 |
| 构建报 `Declared HBA indoor parameter patch did not apply cleanly`（CMakeLists.txt:35-39） | 同上，涉及 `include/hba.hpp` 与 `include/ba.hpp` |
| CMake 报 GTSAM/PCL/Eigen 版本不匹配（`GTSAM 4.1.1 EXACT`、`PCL 1.10.0 EXACT`、`Eigen3 3.3.7 EXACT`） | 确认 `CMAKE_PREFIX_PATH` 首项为 `/opt/hba-gtsam411`，且 `GTSAM_DIR` 指向该前缀 |
| `hba.sh run` 报 `Output already exists`（`hba.sh:26`） | 换一个不存在的输出目录；脚本不允许覆盖 |
| 容器内 `hba` 二进制找不到 `libgtsam.so.4` | 确认 `LD_LIBRARY_PATH` 含 `/opt/hba-gtsam411/lib`（entrypoint 设置）；`hba_run.py` 的 `verify_native` 用 `ldd` 校验链接 |

## 11. 两个 GTSAM 版本的隔离说明

- PGO 镜像：GTSAM 4.2.0 安装于 `/opt/spikive`；
- BA 镜像：GTSAM 4.1.1 安装于 `/opt/hba-gtsam411`。

两仓库使用各自镜像与构建前缀，不存在同一工作区共享 GTSAM 缓存的构建方式（`Spikive-BA/README.md` 原文）。
