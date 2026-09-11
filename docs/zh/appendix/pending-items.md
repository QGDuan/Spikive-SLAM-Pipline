# 待确认事项清单

| 项 | 值 |
|---|---|
| 模块名 | 附录（跨模块） |
| 适用版本 | 全部 5 模块（版本见总索引第 2 节） |
| 最后更新 | 2026-09-10 |

本清单汇总全文标注的 `[待确认]` 项。每项给出：编号、模块、位置、问题、需要的确认动作。确认后请更新对应模块文档并删除本条目。

## 1. SLAM 模块

| # | 位置 | 问题 | 需要的确认动作 |
|---|---|---|---|
| S-1 | `Spikive-SLAM/launch/mapping_velodyne.launch:23`、`launch/cxzn_arrange.launch:14` | launch 引用可执行 `lsdc_init_pose`（节点名 `init_pose`），但 `CMakeLists.txt` 无该构建目标，仓库内无对应源文件 | 确认该可执行来源（是否历史遗留、是否应从 launch 移除，或由哪个包提供） |
| S-2 | `Spikive-SLAM/launch/mapping_velodyne.launch:33`、`launch/cxzn_arrange.launch:24` | 引用外部包 `lsdc_forward` 的节点 `lsdc_forward_node`（参数 `remote_zmq_port_loc=7657`、`ros_sub_topic=/global_pose`），该包不在交付范围 | 确认 `lsdc_forward` 包的交付方式与接口约定 |
| S-3 | `Spikive-SLAM/launch/mapping_velodyne.launch:20` 与 `src/LIO/laserMapping.cpp:882` | 该 launch 的 `lsdc_mapping` 未传 `args`，而代码直接读取 `argv[1]` 且无默认值与边界检查 | 确认该组合的实际运行行为（空参数下 `initPclPrepreocess` 的雷达类型解析结果） |
| S-4 | `Spikive-SLAM/docs/data_flow.md` | 文档提及 `launch/uav.launch`、`config/config_a.yaml`，当前目录不存在这两个文件 | 确认是否缺失文件或文档过时 |
| S-5 | `Spikive-SLAM/src/LIO/save_result.cpp` | `legacyMain`（发布 `/Odometry_enu`、`/rtk_odom_enu`、`/pcl_map` 的 ENU 化链路）整体注释保留；`docs/coordinate_frames.md` 说明 PGO 默认读取 `/Odometry_enu`、`/rtk_odom_enu` | 确认当前 PGO 链路是否依赖该 ENU 输出；若依赖，确认恢复方式 |
| S-6 | `Spikive-SLAM` 仓库整体 | 无独立 Dockerfile/构建脚本；`Spikive-PGO/scripts/dev.sh` 只挂载 `Spikive-PGO`，不含 `Spikive-SLAM` 与 `livox_ros_driver` 的挂载 | 确认把 SLAM 与驱动源码装配进 `/ws/src` 的官方操作步骤 |
| S-7 | `Spikive-SLAM/CMakeLists.txt:102` | `rs_velodyne` 链接 `${OpenCV_LIBRARIES}`，但文件未执行 `find_package(OpenCV)` | 确认该变量在目标构建环境中的来源与取值（当前按空变量处理不影响链接） |
| S-8 | 各模块 docker-build 文档 | 仅构建单包时使用 `catkin_make --only-pkg-with-deps <包名>` 的命令形式 | 该选项为 catkin_make 标准用法，但未在交付包脚本中出现；现场验证后固化 |

## 2. preprocess 模块

| # | 位置 | 问题 | 需要的确认动作 |
|---|---|---|---|
| P-1 | `Spikive-SLAM/config/velodyne.yaml:41-42` 与 `src/preprocess/ins_preprocess.cpp:136-137` | 配置中为 `ins/ins_gps_topic`、`ins/ins_imu_topic`，节点读取 `ins/gps_topic`、`ins/imu_topic` | 确认哪个命名实际生效；不一致则修正配置或代码 |
| P-2 | `Spikive-SLAM/src/preprocess/rs_to_velodyne.cpp:116-121` | 节点读取 `mapping/rs_to_avia_T/E/R`，但交付包全部配置文件中未定义该组参数，当前使用默认恒等外参 | 确认现场 Robosense 相对主雷达的实际标定值是否需要写入配置 |

## 3. 配套驱动模块

| # | 位置 | 问题 | 需要的确认动作 |
|---|---|---|---|
| D-1 | `livox_ros_driver/README.md` | 官方声明支持 Ubuntu 14.04/16.04/18.04 与 ROS indigo/kinetic/melodic；本项目在 Ubuntu 20.04 容器 + ROS Noetic 中构建运行 | 确认 noetic 组合的验收结论是否需书面化（当前为实测环境，非官方声明范围） |

## 4. 跨模块

| # | 位置 | 问题 | 需要的确认动作 |
|---|---|---|---|
| C-1 | `sources.repos` | 未列出 `Spikive-Pcl-Process` 仓库（其余 3 个仓库 + livox 驱动均已锁定） | 确认是否补充 PCL 仓库条目与版本锁定 |
| C-2 | `Spikive-SLAM/README.md` | 为上游 FAST-LIO 原版 README，包名与命令与本包不符（本包 `lsdc_slam`） | 确认是否以本文档集为准，或需更新该文件 |
| C-3 | 根 `PGO_OPTIMIZATION_ROADMAP.md` | 引用 `src/file_preprocess.hpp:27-72`（旧版 release@85bc6d0），当前 `Spikive-PGO/src/` 无此文件 | 确认该引用是否指向历史版本，当前基线是否适用 |
| C-4 | `Spikive-PGO/README.md` | 提到"slam_btc.launch、Livox 回放和专用贵港 launch 需在已配置前端/驱动的外部工作区使用"，且 `dev.sh` 不挂载前端源码 | 确认带前端场景的工作区装配标准做法（同 S-6） |
| C-5 | 各仓库 `git` 状态 | 交付包内 5 个仓库均带 `.git` 目录（PGO `dev@3560a85`、BA `main@35324cb`、SLAM `main@c86c818`、PCL `main@249b488`、livox `master@3d240d5`）；`Spikive-PGO` 工作树提交 `3560a85` 与 `sources.repos` 的 `version: dev` 为分支级锁定 | 确认交付快照按提交还是按分支验收 |

## 5. 处理说明

1. 以上条目在正文中的对应位置均以 `[待确认]` 标注，正文未做任何猜测性填充。
2. 确认结果返回后，更新对应模块文档的相应小节，并从本清单删除该条目。
3. 新增的待确认项按同样格式追加：编号（模块前缀 + 序号）、位置（文件:行）、问题、需要的确认动作。
