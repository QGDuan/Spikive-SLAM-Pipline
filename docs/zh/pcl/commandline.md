# PCL 模块命令行使用

| 项 | 值 |
|---|---|
| 模块名 | PCL |
| 适用版本 | `Spikive-Pcl-Process` git `main` @ `249b488`（v1.0.0） |
| 最后更新 | 2026-09-10 |

## 1. 运行前置

1. 镜像已构建（`spikive-pcl-process:1.0.0`，见 `docker-build.md`）。
2. `HBA_DIR` 内存在：`optimized_map_all_scans.pcd`（HBA 导出的全扫描顺序拼接 XYZI，未经 CloudCompare 重排/采样）与 `optimized_pose.txt`（TUM 格式，`T_world_body`，已恢复世界坐标）。
3. `BODY_BAG`：生成上述 HBA 结果时使用的原始 body bag（话题 `/cloud_registered_body`）。
4. `NEW_OUTPUT_DIR` 必须不存在，其父目录必须存在。
5. `ORIGIN_X/Y/Z`：LIO body 坐标下的激光原点（扫描级固定外参近似），必须来自已确认的标定来源；默认配置为 `null`，不填写则报错。

## 2. 命令

```bash
# 构建与测试（主机侧，见 docker-build.md）
bash scripts/process.sh build
bash scripts/process.sh test

# 运行
bash scripts/process.sh run HBA_DIR BODY_BAG NEW_OUTPUT_DIR \
  --sensor-origin-body ORIGIN_X ORIGIN_Y ORIGIN_Z \
  --sensor-origin-note "填写标定来源，以及是否采用扫描级固定外参近似"
```

`process.sh run` 的校验（`scripts/process.sh:21-25`）：HBA 目录必须存在、body bag 必须存在、输出目录必须不存在、输出父目录必须存在。容器以 `--network none --memory=52g --memory-swap=52g` 运行，HBA 目录、body bag、config 只读挂载，仅输出父目录可写。

## 3. 参数

`process.py` CLI 参数（`scripts/process.py:118-128`）：

| 参数 | 默认值 | 含义 |
|---|---|---|
| `--hba-dir` | 必填 | HBA 结果目录（容器内 `/input/hba`） |
| `--body-bag` | 必填 | 原始 body bag（容器内 `/input/body.bag`） |
| `--output` | 必填 | 新输出目录（容器内 `/output/<目录名>`） |
| `--config` | `config/indoor.yaml` | 配置文件（只读挂载 `/config/indoor.yaml`） |
| `--sensor-origin-body X Y Z` | 无 | LIO body 坐标下的激光原点（三元素） |
| `--sensor-origin-note` | 空 | 原点来源说明（必填非空） |
| `--world-frame` | `camera_init` | 位姿世界系 |
| `--body-frame` | `body` | 点云 frame |

配置文件 `config/indoor.yaml`（schema 1）：

| 参数 | 值 | 含义 |
|---|---|---|
| `threads` | 0 | 0 = 自动取 `ceil(2/3 × 逻辑核数)` |
| `clean.enabled` / `mean_k` / `stddev_mul` | false / 20 / 2.0 | 可选全图 SOR 开关与参数 |
| `mls.search_radius_m` / `polynomial_order` / `tile_edge_m` | 0.08 / 2 / 2.0 | MLS 邻域半径、多项式阶、分块边长（含 halo） |
| `fusion.method` / `voxel_size_m` / `truncation_distance_m` | tsdf / 0.02 / 0.06 | TSDF 体素与截断带 |
| `sensor_origin_body_m` / `sensor_origin_note` | null / "" | 运行时必填 |

也可直接编辑 `config/indoor.yaml` 填写原点与说明；运行脚本以只读方式挂载该配置，实际参数快照保存在结果中。

## 4. 输入输出

输入：

| 项 | 内容 |
|---|---|
| `optimized_map_all_scans.pcd` | HBA 全扫描顺序拼接 XYZI（FLOAT32） |
| `optimized_pose.txt` | TUM 格式 `timestamp tx ty tz qx qy qz qw`，`T_world_body`，纳秒时间戳 |
| body bag | `/cloud_registered_body`（`sensor_msgs/PointCloud2`，frame `body`） |

输出目录结构（`README.md` 原文）：

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

- 原始 HBA 地图、pose、bag 不复制到新目录，不覆盖旧结果；
- 失败时保留 `records/failure.json` 与未完成文件，不发布 `refined_map.pcd`；
- 重复运行同一输出目录被拒绝。

## 5. 典型运行示例

```bash
bash scripts/process.sh run \
  /absolute/ba_result \
  /absolute/original_body.bag \
  /absolute/new_refined_result \
  --sensor-origin-body 0.0 0.0 0.0 \
  --sensor-origin-note "激光原点与 body 原点重合，见标定记录 XXX；扫描级固定外参近似"
```

## 6. 运行结果判读

1. 终端输出三段进度：`[1/3] Checking every HBA point, pose and original body scan`、`[2/3] Native PCL MLS -> chronological native Voxblox TSDF`、`[3/3] Verifying final surface and unchanged inputs`（`process.py:44-56`）。
2. 结束输出 `Complete: <输出目录>/refined_map.pcd (<点数> points)`。
3. 中途校验失败会打印 `FAILED: <原因>` 并保留 `records/failure.json`，不发布最终点云。常见失败原因（`process.py` 中的 `require`）：
   - `Explicit sensor origin required`：未提供 `--sensor-origin-body`；
   - `Output must be a NEW directory`：输出目录已存在；
   - `Native input completeness mismatch` / `Observation accounting mismatch`：引擎统计与输入不符；
   - `Input changed during refinement`：输入文件在处理期间被修改；
   - `Refined PCD count mismatch` / `Incomplete XYZI output`：输出校验不符。
4. `REPORT.md` 记录帧数、点数、SOR 删除数、MLS 未输出数、位移 RMS/最大、各阶段耗时、强度范围与关联距离；位移与点数变化不是精度指标（README）。
5. `records/native.json` 中 `solver` 为 `native Voxblox SimpleTsdfIntegrator + marching cubes`，`pose_optimization: false`，`zero_level_surface: true`。
