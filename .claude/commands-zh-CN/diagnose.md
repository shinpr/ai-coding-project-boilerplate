---
description: 调查问题、验证发现并推导解决方案
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在编写 Agent 提示词、交接内容或生成的产物之前，执行 `llm-friendly-context` 技能（使用 Skill 工具）。

**命令上下文**：用于识别故障点并给出解决方案的诊断流程

目标问题：$ARGUMENTS

**角色**：编排者

**执行方式**：
- 调查 → 委派给 investigator
- 验证 → 委派给 verifier
- 解决方案推导 → 委派给 solver

编排者调用子智能体，并在它们之间传递结构化 JSON。

**执行条件**：下面的每个步骤都建立下一个决策所需的依据。按顺序完成步骤 0-6，包括每一次必需的调查与验证重试。仅在满足当前步骤所述的质量条件或覆盖度条件时才继续推进；只有在覆盖度闭合之后才调用 solver。

## 步骤 0：问题结构化（调用 investigator 之前）

### 0.1 问题类型判定

| 类型 | 判定标准 |
|------|----------|
| 变更导致的失败 | 表明在问题出现之前发生过某些变更 |
| 新发现 | 未表明与变更存在关联 |

如果不确定，向用户询问在问题出现前是否进行过任何变更。

### 0.2 变更导致的失败所需的信息补充

如果以下内容不明确，在继续之前**使用 AskUserQuestion 询问**：
- 变更了什么（原因变更）
- 什么出现了故障（受影响范围）
- 两者之间的关系（共享组件等）

### 0.3 理解问题本质

使用 Agent 工具调用 rule-advisor：
- `subagent_type`: "rule-advisor"
- `description`: "识别问题本质"
- `prompt`: "请识别以下问题的本质以及所需的技能：[用户报告的问题]"

从 rule-advisor 的输出中确认：
- `taskAnalysis.mainFocus`：问题的主要焦点
- `mandatoryChecks.taskEssence`：表面症状之外的根本问题
- `selectedSkills`：适用的技能章节
- `warningPatterns`：需要避免的模式

### 0.4 反映到 investigator 提示词中

**在 investigator 提示词中包含以下内容**：
1. 问题本质（taskEssence）
2. 适用技能的要点摘要（来自 selectedSkills）
3. 调查焦点（investigationFocus）：将 warningPatterns 转换为“本次调查中容易混淆或遗漏的点”
4. **对于变更导致的失败，额外包含**：
   - 变更内容的详细分析
   - 原因变更与受影响范围之间的共性
   - 判定该变更是“正确的修复”还是“新的缺陷”，并据此选择比较基准

## 诊断流程概览

```
问题 → investigator → verifier → solver ─┐
                 ↑                        │
                 └── 覆盖度不足 ──────────┘
                      (最多 2 次)

覆盖度充分 → 报告
```

**上下文隔离**：只向每个步骤传递结构化 JSON 输出。每个步骤仅以该 JSON 数据从零开始。

## 执行步骤

### 步骤 1：调查（investigator）

使用 Agent 工具调用 investigator：
- `subagent_type`: "investigator"
- `description`: "收集问题信息"
- `prompt`: |
    请全面收集与以下现象相关的信息。

    现象：[用户报告的问题]

    问题本质：[步骤 0.3 中的 taskEssence]
    调查焦点：[步骤 0.4 中的 investigationFocus]

    [对于变更导致的失败，额外包含：]
    变更内容：[变更了什么]
    受影响范围：[什么出现了故障]
    共享组件：[原因与受影响范围之间的共性]

**预期输出**：pathMap（每个症状的执行路径）、failurePoints（在各节点发现的故障点）、每个故障点的 impactAnalysis、未探索的区域、调查的局限性

### 步骤 2：调查质量判定

确认调查输出：

**质量检查**（验证 JSON 输出包含以下内容）：
- [ ] 存在 `pathMap`，且至少包含一个症状，每个症状至少有一条列出了节点的路径
- [ ] 每个故障点都包含：`location`、`upstreamDependency`、`symptomExplained`、`causalChain`（达到某个停止条件）、`checkStatus`、带有引用具体文件或位置的 `source` 的 `evidence`
- [ ] 每个故障点都有 `comparisonAnalysis`（找到 normalImplementation，或明确为 null）
- [ ] 每个故障点的 `causeCategory` 为以下之一：typo / logic_error / missing_constraint / design_gap / external_factor
- [ ] `investigationSources` 至少覆盖 3 种不同的来源类型（code、history、dependency、config、document、external）
- [ ] 调查覆盖了 `investigationFocus` 中的各项（当步骤 0.4 提供时）
- [ ] 已映射路径上的所有节点都已被检查（没有在发现第一个故障后就放弃某条路径）

**如果质量不足**：明确指出缺失项并重新运行 investigator：
- `prompt`: |
    请针对以下缺口重新调查：
    - 缺失：[列出质量检查中具体缺失的项]

    先前的调查结果（作为上下文，无需重新调查已覆盖的区域）：
    [先前的调查 JSON]

质量满足后进入 verifier。

### 步骤 3：验证（verifier）

使用 Agent 工具调用 verifier：
- `subagent_type`: "verifier"
- `description`: "验证调查结果"
- `prompt`: "请验证以下调查结果。调查结果：[调查的 JSON 输出]"

**预期输出**：覆盖度检查（缺失的路径、未检查的节点）、每个故障点的 Devil's Advocate 评估、带 finalStatus 的故障点评估、覆盖度评估

**覆盖度标准**：
- **sufficient**：主要路径已追踪，所有关键节点已检查，每个故障点均已单独评估
- **partial**：主要路径已追踪，但部分节点未检查，或部分故障点处于 blocked/not_reached
- **insufficient**：重要路径未追踪，或关键节点未被调查

### 步骤 4：覆盖度检查

检查 verifier 的 `coverageAssessment`：

- **sufficient** → 进入步骤 5（solver）
- **partial 或 insufficient** → 返回步骤 1，以 verifier 指出的未检查区域作为调查目标
  - 最多 2 次额外的调查迭代
  - 经过 2 次迭代仍未达到 sufficient 后，向用户提供选项：
    - 继续追加调查
    - 以当前覆盖度进入 solver（用户接受诊断不完整的风险）

### 步骤 5：解决方案推导（solver）

**前提条件**：coverageAssessment=sufficient（或用户明确批准在 partial/insufficient 状态下继续）

当归属范围、契约与技术设计的修正能够保持已确认的成果、目标状态需求和非目标时，它们属于普通的解决方案候选项；仅仅发现设计缺口并不构成需要用户决策的事项。如果依据表明这些价值边界无法全部同时成立，或某个提议的补救措施需要对不可逆的外部操作进行授权，则连同解决方案的依据一并具体报告该边界，而不是臆造一个选择。

使用 Agent 工具调用 solver：
- `subagent_type`: "solver"
- `description`: "推导解决方案"
- `prompt`: |
    请基于以下已验证的故障点推导解决方案。

    已确认的故障点：[verifier 的 conclusion.confirmedFailurePoints]
    已被驳斥的故障点：[verifier 的 conclusion.refutedFailurePoints]
    故障点之间的关系：[verifier 的 conclusion.failurePointRelationships]
    影响分析：[investigator 的 impactAnalysis]
    覆盖度评估：[sufficient/partial/insufficient]

**预期输出**：从已验证的原因集合推导出的实质上不同的可行解决方案、权衡分析、推荐方案与实现步骤、残留风险

### 步骤 6：编写最终报告

**前提条件**：solver 已完成（步骤 5）

诊断完成后，按以下格式向用户报告：

```
## 诊断结果摘要

### 已识别的故障点
[验证结果中已确认的故障点]
- 每个故障点：位置、所解释的症状、finalStatus

### 验证过程
- 路径覆盖度：[已追踪的路径与已检查的节点]
- 追加调查次数：[0/1/2]
- 覆盖度评估：[sufficient/partial/insufficient]

### 推荐的解决方案
[解决方案推导的推荐方案]

理由：[选定理由]

### 实现步骤
1. [步骤 1]
2. [步骤 2]
...

### 备选方案
[备选方案说明]

### 残留风险
[solver 的 residualRisks]

### 解决后的确认事项
- [确认事项 1]
- [确认事项 2]
```

## 完成标准

- [ ] 执行了 investigator，并获得 pathMap、failurePoints 和 impactAnalysis
- [ ] 执行了调查质量检查，并在不足时重新运行
- [ ] 执行了 verifier，并获得覆盖度评估
- [ ] 执行了 solver
- [ ] 达到 coverageAssessment=sufficient（或在 2 次追加调查后获得用户批准）
- [ ] 向用户提交了最终报告
