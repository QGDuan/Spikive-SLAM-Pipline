# Spikive SLAM Pipeline Documentation

This guide targets the customer's engineers and covers the 5 modules of the SLAM pipeline: SLAM, PGOBA, PCL, preprocess, and the bundled driver. Each module is documented at three levels: command-line usage, Docker build instructions, and source-level architecture. All commands and parameters are traceable in the delivered source package.

:::tip
This guide applies to the `src.zip` delivery snapshot (cloned 2026-09-06, delivered 2026-09-10). Module versions and git pins are listed under [Project composition and versions](#project-composition-and-versions).
:::

:::warning
The `Spikive-SLAM/README.md` inside the source package is the upstream FAST-LIO original README; its package name and commands do not match this project. Use this guide for run commands.
:::

## How to get started?

Start from the entry that matches your goal:

### I want to run the full pipeline in order

Start with the [System overview](/en/appendix/system-overview): it gives the end-to-end data flow, the topic- and file-level interfaces between modules, the environment table of the three images, and the 6-step run order (driver → SLAM → PGO → BA → PCL).

### I want to start the LiDAR driver

See [Bundled driver: command line](/en/driver-livox/commandline): launch commands for the three data sources (direct / Hub / lvx replay), broadcast codes and the `xfer_format` parameter, and output-topic interpretation.

### I want to run the LIO frontend for mapping

See [SLAM: command line](/en/slam/commandline): pick the launch file by LiDAR model (MID360/AVIA/MID70, S10U, VLP-16), parameter tables, topics, and result interpretation.

### I want loop detection and pose-graph optimization (PGO)

See [PGOBA: command line (Part 1)](/en/pgoba/commandline): the three-terminal online run, the dataset replay orchestration scripts (`saier8biao.sh` etc.), and the standalone offline-rebuild entry.

### I want global BA

See [PGOBA: command line (Part 2)](/en/pgoba/commandline): `hba.sh` build and run commands, the input file contract, outputs and interpretation.

### I want point-cloud surface refinement

See [PCL: command line](/en/pcl/commandline): the `process.sh run` input contract (HBA map + poses + body bag), the sensor-origin parameters, output layout and failure interpretation.

### I want to set up the build environment

See [PGOBA: Docker build](/en/pgoba/docker-build): build commands for the three images (`spikive-slam:btc-noetic`, `spikive-ba:v1.0.0-w20-g10`, `spikive-pcl-process:1.0.0`), pinned dependencies and common errors. SLAM/preprocess/the bundled driver build inside the first image.

### I want to understand the source architecture and maintain it

Start from the "Architecture" page of each module: directory responsibilities, core classes/functions, call chains and data flow, key configuration. Commands or paths that cannot be traced in the source are listed in [Pending items](/en/appendix/pending-items).

## Module documentation index

| Module | Module index | Command line | Docker build | Architecture |
|---|---|---|---|---|
| SLAM | [slam](/en/slam/) | [slam/commandline](/en/slam/commandline) | [slam/docker-build](/en/slam/docker-build) | [slam/architecture](/en/slam/architecture) |
| PGOBA | [pgoba](/en/pgoba/) | [pgoba/commandline](/en/pgoba/commandline) | [pgoba/docker-build](/en/pgoba/docker-build) | [pgoba/architecture](/en/pgoba/architecture) |
| PCL | [pcl](/en/pcl/) | [pcl/commandline](/en/pcl/commandline) | [pcl/docker-build](/en/pcl/docker-build) | [pcl/architecture](/en/pcl/architecture) |
| preprocess | [preprocess](/en/preprocess/) | [preprocess/commandline](/en/preprocess/commandline) | [preprocess/docker-build](/en/preprocess/docker-build) | [preprocess/architecture](/en/preprocess/architecture) |
| Bundled driver | [driver-livox](/en/driver-livox/) | [driver-livox/commandline](/en/driver-livox/commandline) | [driver-livox/docker-build](/en/driver-livox/docker-build) | [driver-livox/architecture](/en/driver-livox/architecture) |

## Project composition and versions

| Module | Source directory | Package / project | Version | Version pin |
|---|---|---|---|---|
| SLAM | `Spikive-SLAM/` | ROS package `lsdc_slam` | `package.xml` declares `0.0.0` | git `main` @ `c86c818` |
| PGOBA (PGO) | `Spikive-PGO/` | ROS package `spikive_btc` | `0.1.0` | git `dev` @ `3560a85` |
| PGOBA (BA) | `Spikive-BA/` | ROS package `spikive_ba` | `1.0.0` | git `main` @ `35324cb` (tagged v1.0.0 in `sources.repos`) |
| PCL | `Spikive-Pcl-Process/` | CMake project `spikive_pcl_process` | `1.0.0` | git `main` @ `249b488` |
| preprocess | `Spikive-SLAM/src/preprocess/`, `Spikive-SLAM/src/LIO/preprocess.*` | subsystem inside `lsdc_slam` | follows the SLAM repo | follows the SLAM repo |
| Bundled driver | `livox_ros_driver/` | ROS package `livox_ros_driver` | `2.6.0` | git `master` @ `3d240d5` (unmodified upstream clone) |

## Getting help

- Documentation/source mismatches: see [Pending items](/en/appendix/pending-items) (IDs prefixed S-/P-/D-/C-); after confirmation, update the corresponding page and remove the entry.
- Report issues or submit changes: [GitHub repository](https://github.com/QGDuan/Spikive-SLAM-Pipline) (Issues / Pull Requests).

## Maintenance conventions

- Chinese content (`docs/zh/`) is the base layer; English (`docs/en/`) mirrors it file-for-file.
- Each module has four fixed files: `index.md` (module index), `commandline.md`, `docker-build.md`, `architecture.md`.
- When adding a module, update the site sidebar configuration and the index table on this page in both languages.
- The prompt version and execution record of the documentation generation are in [Prompt version](/en/appendix/prompt-version).
