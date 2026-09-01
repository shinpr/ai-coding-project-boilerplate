---
description: 评审已完成的实现，检查其与约束来源的一致性、变更范围的必要性、仓库质量和安全性，然后应用用户批准的修正。
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在编写 Agent 提示词、交接内容或生成的产物之前，执行 `llm-friendly-context` 技能（使用 Skill 工具）。
在做出工作流决策、调用智能体或处置发现项之前，执行 `subagents-orchestration-guide` 技能。

**命令上下文**：实现完成后的质量保证命令

## 执行方式

- 实现评审 → 由 code-reviewer 执行
- 安全验证 → 由 security-reviewer 执行
- **代码侧修复路径**：修复实现 → task-executor；修正复评 → code-reviewer / security-reviewer；最终质量检查 → quality-fixer
- **设计侧更新路径**：DD 修订 → technical-designer（update 模式）；DD 评审 → document-reviewer；跨 DD 一致性 → design-sync（当存在多个 DD 时）；重新验证 → code-reviewer

编排者调用子智能体，并在它们之间传递结构化 JSON。当差异反映的是代码本身正确、而设计文档已过时（而非代码违反了设计文档）时，适用设计侧路径。

设计文档（省略时使用最新的一份）：$ARGUMENTS

理解一致性验证的本质，并执行以下步骤：

## 执行流程

### 1. 前置条件检查
首先从 `$ARGUMENTS` 解析设计文档。若未指定，则从仓库元数据、引用和内容中找出约束已变更职责的文档。从其上游分支和仓库默认分支解析分支比较基线，然后列出从该合并基线到 `HEAD` 的实现文件。

### 2. 执行 code-reviewer
使用 Agent 工具调用 code-reviewer：
- `subagent_type`: "code-reviewer"
- `description`: "已完成实现的评审"
- `prompt`: "评审已完成的实现。governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]。implementationFiles: [git diff file list]。返回初次评审的 JSON。"

**将输出保存为**：`$STEP_2_OUTPUT`

### 3. 执行 security-reviewer
使用 Agent 工具调用 security-reviewer：
- `subagent_type`: "security-reviewer"
- `description`: "安全评审"
- `prompt`: "governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]. implementationFiles: [git diff file list]. 评审安全合规性。"

**将输出保存为**：`$STEP_3_OUTPUT`

### 4. 结论与响应

当任一评审方返回 blocked 或其他不可用的结果时，针对其语义成因应用 subagents-orchestration-guide 的“专家结果受理”。仅将仍然存在的验证局限带入报告。

对两份输出应用“评审裁定”。其 `apply` 与 `decline` 处置决定路由。对每一项 `apply` 发现项：当实现已经满足已接受状态、但某项技术产物不再符合现状时，交由负责该文档的作者处理；当必须变更实现才能达到已接受状态时，交由执行者处理。

呈现处置后的结果：

```
实现评审：[code-reviewer 的 verdict]
  验收标准：
  - [fulfilled] [项目]：[依据]
  - [unfulfilled] [项目] -> [对应的 finding ID]
  必需修正：
  - [id] [类别] [位置]：[说明] — [依据及影响] [推荐：代码侧修正 | 设计侧更新]
  局限：
  - [无法验证的判断及其影响]

安全评审：[security-reviewer 的 status]
  按类别列出的发现项：
  - [confirmed_risk] [位置]：[说明] — [理由]
  - [defense_gap] [位置]：[说明] — [理由]

已拒绝：[ID] — [约束来源上的理由]
```

向用户请求应用所提议 `apply` 路由的授权。批量选项为“批准所有提议的 `apply` 路由”，且仅包含这些路由。当获批的变更集为空时，直接进入步骤 11。

**带入修复路径的边界**：将获批的发现项、其可观测的修正条件，以及用户声明的任何规模预算，贯穿代码侧修正路径及其最终质量检查。应用 coding-standards 的“变更边界与参考代表性”来推导完整的修正；发现项中的路径是调查的起点。当完整修正超出用户声明的规模预算时，该预算仍是用户设定的边界。

### 5. 设计侧更新

仅当获批路由保留已接受的实现并修正过时的设计文档时，才执行本步骤。

1. 使用 Agent 工具以 update 模式调用 technical-designer：
   - `subagent_type`: "technical-designer"
   - `description`: "从评审发现项更新设计文档"
   - `prompt`: "以 update 模式更新 [path] 的设计文档，依据这些已批准的设计侧发现项：[附带其 apply 处置的完整发现项对象]。保持已确认的成果、目标状态需求与非目标。"

2. 调用 document-reviewer 验证更新后的设计文档：
   - `subagent_type`: "document-reviewer"
   - `description`: "更新后设计文档的评审"
   - `prompt`: "doc_type: DesignDoc。review_context: update。评审 [path] 的更新后设计文档的一致性与完整性。"
   - 走完“评审裁定”的修正复评与收敛转移，对重新路由的修正使用 technical-designer。仅在其收敛条件达成时才继续

3. 当另一份设计文档约束了被评审变更所触及的职责或契约时，调用 design-sync：
   - `subagent_type`: "design-sync"
   - `description`: "跨 DD 一致性检查"
   - `prompt`: "source_design: [更新后 DD 的路径]。检测更新后所有设计文档之间的冲突。"
   - 当 `sync_status: CONFLICTS_FOUND` 时：将 design-sync 作为独立重跑验证者应用“评审裁定”，通过归属的 technical-designer 修正 `apply` 冲突，重新运行 design-sync，并将有依据的 decline 保留为已完成

4. 对照更新后的设计文档重新评估获批的 `apply` 发现项，并去掉本次修订已满足的项。当没有剩余项时，跳过代码侧修复路径，直接进入最终报告。

### 6. 执行修复

使用 Agent 工具调用 task-executor：
- `subagent_type`: "task-executor"
- `description`: "执行评审修复"
- `direct_scope`: 在确定的评审范围与已声明的总规模预算内，应用已批准的代码侧修正
- `governing_sources`: 被评审的设计文档，以及已接受的需求或 ADR 路径
- `target_paths`: 为已批准的代码侧路由所确认的实现与测试路径
- `observable_verification`: 发现项与约束来源所指明的、聚焦的测试或可观测契约检查通过
- `correction_findings`: 评审方发现项对象的完整逐字副本，仅添加其编排者处置

### 7. 质量检查

使用 Agent 工具调用 quality-fixer：
- `subagent_type`: "quality-fixer"
- `description`: "质量检查"
- `prompt`: "direct_scope: { outcome: [传递给步骤 6 的已批准代码侧发现项], affectedPaths: [这些发现项及其所需一致性变更所覆盖的路径], verificationCondition: 适用的项目质量检查通过 }。确认当前完整未提交工作树通过质量检查。"

依据其响应分支：
- `approved` → 进入步骤 8
- `stub_detected` → 保持 `incompleteImplementations` 不变返回步骤 6，然后重复步骤 7
- `verification_incomplete` → 保留完整结果并进入步骤 8
- `blocked` → 应用“专家结果受理”

### 8. 重新验证 code-reviewer

在本次调用之前，立即使用步骤 1 的纳入规则重新推导 `implementationFiles`，使其包含由获批修正和质量修复新增或变更的实现产物。

使用 Agent 工具调用 code-reviewer：
- `subagent_type`: "code-reviewer"
- `description`: "实现评审的重新验证"
- `prompt`: "在已批准的修正之后，重新评审已完成的实现。governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]。implementationFiles: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。核对收到的每一项。"

### 9. 重新验证 security-reviewer

在本次调用之前，立即使用步骤 1 的纳入规则重新推导 `implementationFiles`，使其包含由获批修正和质量修复新增或变更的实现产物。

当 subagents-orchestration-guide 的实现后“重新运行规则”要求一份最新的安全结果时，调用 security-reviewer：
- `subagent_type`: "security-reviewer"
- `description`: "安全性的重新验证"
- `prompt`: "修正后重新验证安全性。governingDocuments: [{\"type\":\"design-doc\",\"path\":\"[path]\"}]。implementationFiles: [file list]。prior_feedback: [{id, disposition, reason?, evidence}]。在评审方的修正复评范围内，核对先前的每一项。"

### 10. 处置修正结果

对步骤 8 和步骤 9 的每一份结果应用“评审裁定”。被维持的 `apply` 发现项返回步骤 6，然后重复适用的质量检查与修正复评。当“评审裁定”达到其收敛条件时继续。

在步骤 11 之前，使用与步骤 7 相同的输入和受影响的检查，对每一项保留的 quality-fixer 局限重试一次。`approved` 结果即解除该局限，将新发现的不完整实现经由步骤 6-10 路由，并报告再次出现的 `verification_incomplete` 结果。当重试改变了仓库时，在报告前对变更后的代码重复步骤 8-10。

### 11. 最终报告

然后呈现最终报告：

```
实现评审：
  初次：[code-reviewer 的 verdict]
  修正复评：[复评范围的 verdict]（若已执行修复）
  核对：[按发现项 ID 的 resolved / withdrawn / maintained]

安全评审：
  初次：[status]
  修正复评：[复评范围的 status]（若已执行修复）
  核对：[按发现项 ID 的 resolved / withdrawn / maintained]

质量检查：
  最终结果：[approved / verification_incomplete / 未执行 — 无代码变更]

仍然存在的证明局限：
- [理由 — 受影响的检查与依据]（仅在重试后仍然存在时）

已拒绝的发现项：
- [ID] — [约束来源上的理由与依据]

残留问题：
- [需要人工处理的项]
```

**范围**：已完成实现的评审、安全评审，以及用户批准的修正路由。

## 子智能体的范围边界

将以下区块追加到本流程调用的每一个子智能体提示词中：

```
子智能体的范围边界：
在所影响的仓库职责范围内，一致地完成已批准的修正。
将被引用的路径视为调查的起点。
除被指派的更新外，约束性产物保持只读。
当已确认的成果、目标状态需求与非目标无法同时成立时，返回需求变更检测；当需要不可逆的外部操作时，请求授权。
```
