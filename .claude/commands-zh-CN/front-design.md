---
description: 从仓库依据出发，经由适用的 UI 规范和可选的 ADR 决策，直至完成前端设计文档的批准
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在文档路由或创建之前，执行 `documentation-criteria` 技能。
在编写智能体提示词、交接内容或生成产物之前，执行 `llm-friendly-context` 技能。
在调用智能体或处置发现项之前，执行 `subagents-orchestration-guide` 技能。

## 成果与职责归属

将中型/大型前端设计从依据一路统筹至适用的 UI 规范和已批准的设计文档。编排者拥有需求收敛、结构规模（Structural Scale）、文档路由、ADR 资格判定、依据选择和评审裁定（Review Resolution）。指定的专家智能体拥有语义调查与产物。

前端设计文档始终承载完整的实现设计。ADR 批次收窄符合条件的技术选择；适用的 UI 规范拥有尚待设计的 UI 结构与行为。

需求：$ARGUMENTS

## 流程

```text
需求来源 -> codebase-analyzer -> 范围/文档路由的确认 [停止]
                                        |
                      条件性的 UI 分析 -> UI 规范评审 [停止]
                                        |
                             可选的 ADR 批次/评审 [停止]
                                        |
        设计文档 -> code-verifier/评审裁定 -> document-reviewer
                                        |
                          design-sync -> 批准 [停止]
```

对每一条可处理的发现项使用评审裁定。在每个 `[停止]` 处等待用户的明确确认。

在下面每一次智能体调用时，按机械式提取构建提示词：将指名来源的值复制到指定字段，只应用已声明的序列化方式，然后立即调用。

## 步骤 1：选择约束性需求来源

当存在已批准的 PRD 时，使用该 PRD 路径。否则逐字使用已确认的需求。

将 `confirmed_requirement_context` 精确设置为已批准的 PRD 路径。仅当不存在已批准的 PRD 时，原样使用编排者已确认的收敛记录。

## 步骤 2：收集仓库侧的决策材料

针对完整的已确认范围调用一次 `codebase-analyzer`，输入恰为 `prd_path: [已批准的 PRD 路径]`；当不存在已批准的 PRD 时，则为 `requirements: [已确认需求的原文]`。

要求返回一份有效的 JSON 结果，并让分析器自行发现受影响的路径、职责边界和跨层契约。将 `focusAreas` 视为对既有行为的防护，而非需求。

## 步骤 3：判断是否需要 UI 规范并解决 UI 依据

应用 documentation-criteria 的 UI 规范创建条件。当其不适用时，跳过 UI 分析和步骤 5。

当 UI 规范适用时，仅在某项 project-context 外部资源能够改变当前的 UI 方向、组件契约或验证边界时才选取它。否则使用 `external_resource_refs: []`。

仅当原型代码能提供尚未解决的已批准 UI 决策，或无法从需求、仓库 UI 和已记录资源确定目标时，才索取原型代码。缺少可选的原型不构成停止条件。

调用 `ui-analyzer` 时只给出一个约束来源：`prd_path: [已批准的 PRD 路径]`；不存在已批准的 PRD 时，则为 `requirements: [已确认需求的原文]`。仅追加已存在的 `ui_spec_path`、与决策相关的 `prototype_path`，以及选取的 `external_resource_refs` 或 `[]`。

## 步骤 4：确认范围与 ADR 决策

执行 `requirement-convergence`。从约束性需求来源、仓库分析和适用的 UI 分析构建并判定收敛记录。

判定全部四个收敛字段。依据第 2 步的结构性依据赋予 `cost`，并记录其未知项；仅对未达到 `ready` 的字段进行访谈。

从成果和职责边界确定结构规模；文件数量仅作为辅助依据。对照约束来源、`reuse` 和 `invalidations` 解决候选决策点；适用的 UI 事实可支持或否定其余选项。仅在此收敛之后才应用 documentation-criteria 的选择必要性（Choice）与长期影响（Durability）筛选，并将通过的决策点记录为 `adrDecisionPoints`；空列表也是有效的。

呈现需要用户决定的内容：要达成的成果与要构建的需求、排除项，以及本次变更所针对的职责。仅当用户必须解决某个未知项才能确认该范围时，才加入该未知项。结构规模、UI 规范适用性、ADR 资格判定和成本依据保留在编排者记录中——UI 规范、ADR 批次和设计文档各有其自己的批准停止点。提供两个选项：就此继续推进，或修正后重新运行。仅当每个收敛字段均为 `ready` 或 `weak-but-explicit` 时才继续。`[停止：范围确认]`。

## 步骤 5：创建并批准 UI 规范

仅当步骤 3 判定 UI 规范适用时才执行本步骤。

调用 `ui-spec-designer`，传入 `confirmed_requirement_context`、原样未改动的完整 `ui_analysis` 和 `codebase_analysis`、存在时与决策相关的 `prototype_path` 及其 `prototype_reference_strength`，以及选取的 `external_resource_refs` 或 `[]`。

调用 `document-reviewer`，传入 `doc_type: UISpec`，`target` 为返回的 UI 规范路径。`approved` 则呈现该 UI 规范；`needs_revision` 则应用评审裁定并在修正后重新评审；`rejected` 则先解决约束来源冲突再进行下一次评审。`[停止：UI 规范批准]`。

## 步骤 6：在需要时创建并批准 ADR 批次

当 `adrDecisionPoints` 非空时：

1. 先将共享/后端归属的决策点路由给 technical-designer，再将前端归属的决策点路由给 technical-designer-frontend。调用每个归属方时传入 `document_to_create: ADRBatch`、`confirmed_requirement_context`、其有序的 `decision_points`、对应的原样未改动的 `decision_materials`，以及仅当已批准的 UI 规范约束该决策时才传入的 `ui_spec_path`。
2. 收集所有返回的路径，并以 `doc_type: ADRBatch`、`targets: [所有路径]` 和 `confirmed_requirement_context` 调用一次 `document-reviewer`。
3. 先按评审结论路由：`approved` 则继续；`needs_revision` 则应用评审裁定，按路径逐个串行更新每份 ADR，并重新评审完整批次；`rejected` 则先解决约束来源冲突，再进行下一次评审。
4. 仅在评审为 approved 之后，才呈现一次批次决策。`[停止：ADR 批次批准]`。
5. 用户批准后，将每个 ADR 的状态设为 `Accepted` 并验证这些更改。

## 步骤 7：创建前端设计文档

调用 `technical-designer-frontend`，传入：

- `document_to_create: DesignDoc`；
- `confirmed_requirement_context`；
- `structural_scale`；
- 适用的已批准 `ui_spec_path` 和选取的外部资源记录；
- `adr_paths: [已接受的路径，或 []]`；
- 步骤 2 的完整 `codebase_analysis`，原样未改动；
- 存在时，步骤 3 的完整 `ui_analysis`，原样未改动

设计文档拥有从组件到服务的完整实现，并保留所有适用的下游防护。

## 步骤 8：验证、评审与批准

调用 `code-verifier`，传入 `doc_type: design-doc` 和返回的设计文档路径，不传 `code_paths`。在文档评审前应用评审裁定；将处置为 `apply` 的发现项发送给一次全新的 technical-designer-frontend 调用，传入 `Operation Mode: update`、`Existing Document: [设计文档路径]` 和 `correction_findings: [除处置方针外未作改动的完整发现项]`。该设计者会对未经验证且会改变决策的前提，应用“评审触发的有界自我验证”；这个全新的设计者是唯一的修正专家，并由其选择获取依据的路径。在应用修正后重新运行验证。将最新的验证器结果连同已记录的处置方针一并作为 `verification_evidence` 传递。当每一条剩余的不一致都带有已解决的处置方针时，继续。

调用 `document-reviewer`，传入 `doc_type: DesignDoc`、返回的设计文档路径、`review_context: creation`、原始用户需求、`confirmed_requirement_context`、提供给设计者的原样未改动的分析输入，以及 `verification_evidence`。

- `approved`：继续
- `needs_revision`：应用评审裁定，通过一次全新的 technical-designer-frontend 调用（使用现有路径和完整的、处置为 `apply` 的发现项）进行更新，并对受影响的边界重新运行验证和评审
- `rejected`：技术性的约束来源冲突通过评审裁定解决；仅当已确认的成果、目标状态需求和非目标无法同时全部成立、且必须由用户选择改变其中哪一项时，才询问用户

以返回的设计文档为来源调用 `design-sync`，对可处理的冲突应用评审裁定，并在仅存在一份设计文档时明确报告 `SKIPPED`。

呈现适用的 UI 规范、设计文档、已接受的 ADR 路径、已记录的拒绝项和同步结果。`[停止：设计批准]`。

## 完成标准

- 仅当外部依据和原型依据决定着某个当前决策时，才索取了它们
- 已从成果和职责边界确认范围与结构规模
- 仅对同时通过两项筛选的决策点存在 ADR，且该批次经过了一次评审和批准
- 无论是否需要 ADR，适用的 UI 规范和完整的前端设计文档都存在
- 适用的既有 UI 行为、契约、假设、状态、等价性和验证防护都进入了设计文档
- 评审裁定仅将 `needs_revision` 的问题转入修正工作
- 所有停止点都得到了用户的明确确认
