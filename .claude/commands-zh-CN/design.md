---
description: 执行从以仓库为范围的分析，经由必要时的 ADR 决策，直至设计文档批准
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在文档路由或创建之前，执行 `documentation-criteria` 技能。
在编写智能体提示词、交接内容或生成产物之前，执行 `llm-friendly-context` 技能。
在调用智能体或处置发现项之前，执行 `subagents-orchestration-guide` 技能。

## 成果与职责归属

统管从仓库依据到已批准设计文档的设计阶段。需求收敛、结构规模、ADR 资格判定、依据选择和评审裁定由编排者负责。语义调查和产物撰写由指名的各专职智能体负责。

对于中型/大型工作，设计文档始终是完整的实现设计。符合条件的 ADR 批次在设计文档之前收窄技术选择，而完整流程和实现边界由设计文档保留。

需求：$ARGUMENTS

## 流程

```text
需求来源 -> codebase-analyzer -> 范围/决策确认 [停止]
                                     |
                    可选的 ADR 批次 -> 批次评审 [停止]
                                     |
          设计文档 -> code-verifier -> 评审裁定
                                     |
        document-reviewer -> design-sync -> 批准 [停止]
```

每个有依赖的步骤，都在其前置依据齐备之后再执行。对 verifier、reviewer 或 design-sync 的每一条可处理的发现项，都应用评审裁定。在每个 `[停止]` 处等待用户的明确确认。

在下面每一次智能体调用时，按机械式提取构建提示词：将指名来源的值复制到指定字段，只应用已声明的序列化方式，然后立即调用。

## 步骤 1：选择约束性需求来源

当存在已批准的 PRD 时，使用该 PRD 路径。否则逐字使用已确认的需求。

将 `confirmed_requirement_context` 精确设置为已批准的 PRD 路径。仅当不存在已批准的 PRD 时，原样使用编排者已确认的收敛记录。

## 步骤 2：收集决策材料

针对完整的已确认范围调用一次 `codebase-analyzer`，输入恰为 `prd_path: [已批准的 PRD 路径]`；当不存在已批准的 PRD 时，则为 `requirements: [已确认需求的原文]`。

要求返回一份有效的 JSON 结果，并让分析器去发现受影响的路径、职责边界和跨层契约。将其关注领域视为对既有行为的防护措施，而非新需求。

## 步骤 3：确认范围与 ADR 决策

执行 `requirement-convergence`。由编排者依据用户请求和第 2 步的依据构建并判定收敛记录。

判定全部四个收敛字段。依据第 2 步的结构性依据赋予 `cost`，并记录其未知项；仅对未达到 `ready` 的字段进行访谈。

结构规模由成果和职责边界判定。文件数量仅作为辅助依据。

对照约束来源、`reuse` 和 `invalidations` 处理 `decisionMaterials.candidateDecisionPoints`。当这些依据已经收敛到唯一充分的方案时，移除该决策点。对每一个剩余项，按顺序应用 documentation-criteria 的筛选条件：

1. 该选择需要在已确认范围内，于至少两个可信且实质不同的选项之间作出判断。
2. 该选择会对后续工作产生长期且实质性的影响。

将每一个通过筛选的项记录为 `adrDecisionPoints`；空列表则直接路由到设计文档。

只呈现需要用户判断的内容：成果与要构建的需求、排除项，以及本次变更所针对的职责。仅当用户必须解决某个未知项才能确认该范围时，才加入该未知项。结构规模、ADR 资格判定和成本依据保留在编排者的记录中——ADR 批次和设计文档各有自己的批准停止点。提供两个选项：继续推进，或修正范围后重新运行分析。仅当每个收敛字段为 `ready` 或 `weak-but-explicit` 时才继续。`[停止：范围确认]`。

## 步骤 4：必要时创建并批准 ADR 批次

当 `adrDecisionPoints` 非空时：

1. 调用一次 `technical-designer`，传入 `document_to_create: ADRBatch`、`confirmed_requirement_context`、有序的 `decision_points`，以及从第 2 步原样复制的对应 `decision_materials`。
2. 调用一次 `document-reviewer`，传入 `doc_type: ADRBatch`、`targets: [返回的全部路径]` 和 `confirmed_requirement_context`。
3. 先按评审结论路由：`approved` 则继续；`needs_revision` 则应用评审裁定，按路径逐个串行更新每份 ADR，并重新评审完整批次；`rejected` 则先解决约束来源冲突，再进行下一次评审。
4. 仅在评审为 approved 之后，才呈现一次批次决策。`[停止：ADR 批次批准]`。
5. 用户批准后，将每份 ADR 的状态更新为 `Accepted` 并验证该变更。

## 步骤 5：创建设计文档

调用 `technical-designer`，输入恰为：

- `document_to_create: DesignDoc`；
- `confirmed_requirement_context`；
- `structural_scale`；
- `adr_paths: [已接受的路径，或 []]`；
- `codebase_analysis: [第 2 步的完整 JSON，原样不变]`

设计文档拥有完整的实现设计，并保留 documentation-criteria 模板中所有适用的下游防护措施。

## 步骤 6：验证并裁定仓库层面的主张

调用 `code-verifier`，传入 `doc_type: design-doc` 和设计文档路径。不提供 `code_paths`，以便将未来行为保持为意图，而对当前的前提与可行性进行验证。

在文档评审之前，对每一处不一致应用评审裁定。仅将 `apply` 类发现项发送给一次全新的 technical-designer 调用，传入 `Operation Mode: update`、`Existing Document: [设计文档路径]` 和 `correction_findings: [除处置方针外未作改动的完整发现项]`。当某条发现项指出一个未经验证且会改变决策的前提时，该设计者应用“评审触发的有界自我验证”；这个全新的设计者是唯一负责修正的专职智能体，并自行选择获取依据的路线。修正之后重新运行 code-verifier。将最新的 verifier 结果连同已记录的处置方针一起作为 `verification_evidence` 传递。仅当其中不含未解决的 `apply` 项时才继续。

## 步骤 7：评审与批准

调用 `document-reviewer`，传入 `doc_type: DesignDoc`、`target`、`review_context: creation`、作为 `requirements_verbatim` 的原始用户需求、`confirmed_requirement_context`、`codebase_analysis`，以及来自第 6 步的 `verification_evidence`。

- `approved`：继续
- `needs_revision`：应用评审裁定，通过一次全新的 technical-designer 调用、传入现有路径和完整的、处置为 `apply` 的发现项进行更新，然后针对受影响的边界重新运行第 6-7 步
- `rejected`：技术性的约束来源冲突通过评审裁定解决；仅当已确认的成果、目标状态需求和非目标无法同时全部成立、且必须由用户选择改变其中哪一项时，才询问用户

调用 `design-sync` 以检查与其他设计文档的一致性，并对可处理的冲突应用评审裁定。当只存在一份设计文档时，明确地报告 `SKIPPED`。

呈现设计文档、已接受的 ADR 路径、已记录的拒绝项，以及 design-sync 结果。`[停止：设计批准]`。

## 完成标准

- 已从成果和职责边界确认范围与结构规模
- ADR 仅对同时通过两项筛选条件的决策点存在，且完整批次经过了一次评审和批准
- 无论是否需要 ADR，都存在一份设计文档
- 适用的既有行为、契约、前提、等价性和验证防护措施都进入了设计文档
- 评审裁定仅将 `needs_revision` 的问题转入修正工作
- 所有停止点都得到了用户的明确确认
