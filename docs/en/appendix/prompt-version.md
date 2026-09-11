# Prompt Version

| Item | Value |
|---|---|
| Module | Appendix (cross-module) |
| Applicable version | this documentation-generation task |
| Last updated | 2026-09-10 |

This page records the prompt version used to generate this documentation (deliverable item 5), for review and correction by the responsible person, and for iteration into a standardized operating procedure.

## 1. Current prompt version: v1.0

The prompt used for this task follows verbatim. It was written in Chinese and is quoted without modification:

```text
# 任务：SLAM Pipeline 源码级交付文档生成

## 角色
你是资深技术文档工程师，为 SLAM 项目组制作源码级交付文档（用户手册类）。
最终读者是客户方工程师，验收标准：客户能看懂、能照着命令行跑通、能基于文档理解源码架构并自行维护。

## 输入
我会提供源码包。你必须先完成源码清点，再开始写文档。

## 覆盖范围（硬性要求，无遗漏项）
必须覆盖 5 个模块：SLAM、PGOBA、PCL、preprocess、配套驱动。
每个模块均须输出以下三类内容，缺一不可：
1. 命令行使用步骤——可复制执行的完整命令、参数含义、输入输出路径、典型示例、运行结果判读。
2. Docker 环境编译说明——基础镜像与依赖、环境变量、构建命令、编译产物位置、常见报错及处理方式。
3. 源码级架构说明——目录与文件职责、核心类/函数/数据结构、调用链与数据流、模块间接口与依赖关系、关键配置项。

## 语言风格（强制）
- 无形容词：不出现"强大、高效、优秀、灵活、完善、先进"等修饰性词汇。
- 专业、冷酷、客观、严谨；使用陈述句与命令式说明，不使用感叹、比喻、营销话术。
- 不写主观评价。
- 细节程度适度：不细碎到逐行解释代码，也不粗疏到只有目录；以"读者能据此编译、运行、定位代码"为准。

## 工作流程（强制分阶段，禁止跳步）
第 0 步｜源码清点：列出源码包目录树，输出"模块 → 文件/目录"映射表，标注未识别或缺失部分，确认无遗漏后进入下一步。
第 1 步｜结构选型（先不要写正文）：生成 3 版不同风格的文档结构方案（如按模块组织、按交付内容类型组织、按使用路径组织）。每版给出完整目录树 + 每章要点 + 优劣。输出后停止，等待负责人选定最优版本；未获选定不得生成正文。
第 2 步｜分段生成内容：按选定结构逐部分生成正文，每完成一部分即停止，提交负责人审核确认；确认通过后再进行下一部分。禁止一次性输出全文。
第 3 步｜定稿：全部内容审核通过后整理为正式版本，输出完整文件清单。

## 禁止事项
- 禁止臆造源码中不存在的接口、参数、类名、命令、文件路径。
- 所有命令、路径、参数必须可在源码中溯源；无法确认的内容标注 [待确认]，并在文末汇总为待确认清单，不得猜测填充。
- 不加入形容词与主观评价。
- 不保留中间过程稿，最终只保留正式版本。

## 输出格式
- Markdown，适配 GitHub 仓库 specify slam pipeline 展示与托管。
- README.md 作为总索引 + 各模块独立文件/目录，模块内按"命令行使用 / Docker 编译 / 源码架构"分节。
- 文件头统一包含：模块名、适用版本、最后更新日期。
- 代码块标注语言，命令与源码路径使用行内代码格式。

## 产出清单
1. 源码清点与模块映射表
2. 3 版文档结构方案（供选型）
3. 选定结构下的完整文档正文
4. 待确认事项清单
5. 本次使用的提示词版本（供负责人审核纠正，迭代为标准化操作逻辑）

## 自检清单（提交审核前逐条确认）
- [ ] SLAM、PGOBA、PCL、preprocess、配套驱动 5 个模块全部覆盖
- [ ] 每模块均含命令行使用步骤 / Docker 编译说明 / 源码级架构说明
- [ ] 全文无形容词、无主观评价
- [ ] 所有命令与路径可在源码中溯源，疑点已标注 [待确认]
- [ ] 细节颗粒度适中
- [ ] Markdown 格式适配 GitHub 渲染
```

## 2. Execution record of this run (deviations from the prompt and decisions)

The following records the decisions made by the responsible person during this run and factual changes that occurred, for reference when revising the next prompt version:

| # | Item | Record |
|---|---|---|
| E-1 | structure selection | option A selected (module-organized); PGOBA as one document (PGO and BA parts); preprocess as an independent module document (source paths point into the `Spikive-SLAM` repository) |
| E-2 | output location | the responsible person required: write into the designated folder `11` (`D:\SLAM交接文档\11`), never modify anything under `src/` |
| E-3 | language | the responsible person required: all content in Chinese (identifiers such as commands, package names, file names, topic names and parameter names keep their source form) |
| E-4 | review process | the per-part review of step 2 was cancelled by the responsible person ("不用审核直接生成"); all parts were generated consecutively |
| E-5 | source tree change | the `.dev/` directory observed during inventory (build snapshots and experiment data, ~9.9 GB) was removed from the package while the documentation was being generated; the index wording was corrected to match the delivered package |
| E-6 | document layout | each module uses four files — `README.md` (module index) + `commandline.md` + `docker-build.md` + `architecture.md` — instead of three files named after the three content types (consistent with the index section 4 tree) |
| E-7 | pending-item list | items are numbered by module prefix (S-/P-/D-/C-); the main text marks `[待确认]` and points to `appendix/pending-items.md` |
| E-8 | website stage | a VitePress documentation site was added on top of the Markdown base files: `docs/zh/` (canonical) and `docs/en/` (mirror translation), with GitHub Actions deployment to GitHub Pages |

## 3. Suggested iteration points for the next version

Items that surfaced during this run and can be fixed into prompt v1.1 (at the responsible person's discretion):

1. Output location and working-directory convention: pre-write a clause "write the documentation into the designated handover directory; do not modify the source package" into the prompt (this was specified mid-run).
2. Language clause: add "prose is written in the designated language; identifiers keep their source form" explicitly to the style section (this was specified mid-run).
3. Review granularity: define an explicit switch between "per-part review" and "consecutive generation" modes to avoid changing the flow mid-run.
4. Source-package drift: add a clause "when the inventory result and the package diverge during generation, follow the current package and record the difference".
5. Pending-item numbering: put the "module prefix + sequence" format into the prompt so the list stays traceable.
6. Module-boundary ambiguity handling: the prompt should pre-wire the confirmation questions for "preprocess has no standalone repository" and "PGOBA spans two repositories" (resolved by ad-hoc questions in this run).
7. Website stage: if the website requirement becomes part of the standard flow, add it as a separate phase after finalization (framework, i18n structure, deployment workflow).
