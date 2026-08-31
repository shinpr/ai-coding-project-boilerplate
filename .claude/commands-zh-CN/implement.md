---
description: 编排从需求到部署的完整实现生命周期
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在编写 Agent 提示词、交接内容或生成的产物之前，执行 `llm-friendly-context` 技能（使用 Skill 工具）。

**命令上下文**：全周期实现管理（需求分析 → 设计 → 计划 → 实现 → 质量保证）

严格遵循 subagents-orchestration-guide 技能，并作为编排者运作 —— 通过 Agent 工具委派所有工作，在子智能体之间传递数据，并报告结果（允许使用的工具：参见 subagents-orchestration-guide 技能“编排者可用工具”）。

## 执行决策流程

### 1. 当前状况判定
指令内容：$ARGUMENTS

**Think deeply** 判定当前状况：

| 状况模式 | 判断标准 | 下一步行动 |
|------------------|------------------|-------------|
| 新需求 | 无既有工作，新功能/修复请求 | 从 requirement-analyzer 开始 |
| 流程延续 | 存在既有文档/任务，有延续指示 | 在 subagents-orchestration-guide 技能的流程中确定下一步 |
| 质量错误 | 检测到错误、测试失败、构建错误 | 执行 quality-fixer |
| 不明确 | 意图含混，存在多种解读可能 | 与用户确认 |

### 2. 延续时的进度确认
延续既有流程时，确认以下内容：
- 最新产物（PRD/ADR/设计文档/工作计划/任务）
- 当前所处阶段（需求/设计/计划/实现/质量保证）
- 在 subagents-orchestration-guide 技能的对应流程中确定下一步

### 3. 设计阶段

当编排者从 `scopeEvidence.affectedLayers` 判断工作跨越后端与前端时，遵循 subagents-orchestration-guide 技能中的跨层编排章节。

### 4. requirement-analyzer 之后 [停止]

使用 `requestSignals`、`scopeEvidence`、`costEvidence` 和 `questions` 执行 requirement-convergence 访谈。收敛记录与结构规模（Structural Scale）由编排者判断。

当用户回答问题时：
- 将答案记入收敛记录，并重新判断受影响的字段与结构规模
- 仅当答案改变了分析对象或所需的范围依据时，才重新执行 requirement-analyzer
- 当所有适用的收敛字段均为 `ready` 或 `weak-but-explicit` 时继续推进

按照 subagents-orchestration-guide 技能中收敛记录的交接方式，将最终的 `convergence` 记录带入每一个文档创建步骤。

### 5. 确定适用的流程

在判定结构规模之后，仅遵循该规模适用的路径。将每一个适用的设计、评审、批准、计划、实现、验证、清理和报告阶段视为一个检查点。仅当当前阶段所述的依据或批准存在时才推进；仅跳过所述条件为假的分支。

### 6. 执行下一步行动

执行所需依据尚不存在的、最早的适用阶段。

## 遵循 subagents-orchestration-guide 技能的执行

**执行前检查清单（必需）**：
- [ ] 已确认相关的 subagents-orchestration-guide 技能流程
- [ ] 已识别当前进度所处位置
- [ ] 已明确下一步
- [ ] 已认识到停止点 → **在所有停止点使用 AskUserQuestion 进行确认**
- [ ] 每次创建设计文档前均包含 codebase-analyzer
- [ ] 每份设计文档在 document-reviewer 之前均包含 code-verifier
- [ ] 已理解任务执行后的 4 步循环（task-executor → 用户边界判断/后续处理 → quality-fixer → 提交边界检查）

**流程严守**：遵循 subagents-orchestration-guide 中适用的结构规模流程以及 4 步任务执行循环。仅当当前阶段或循环步骤满足其所述的转移条件时才推进。

## 子智能体的范围边界

将以下区块追加到本流程调用的每一个子智能体提示词中：

```
子智能体的范围边界：
在承担该成果的仓库职责范围内，一致地交付任务成果。
将被引用的路径视为调查起点，并在同一成果需要时纳入支撑文件。
除被指派的进度字段外，约束性产物保持只读。
当已确认的成果、目标状态需求与非目标无法同时成立时，返回需求变更检测；当需要不可逆的外部操作时，请求授权。
```

此外，由于从子智能体调用 rule-advisor 会导致系统崩溃，须在每一个子智能体提示词的末尾包含以下约束：
```
[约束] rule-advisor 仅可由主 AI 使用
```

## 编排者的强制职责

### 任务执行质量循环
执行以下按依赖顺序排列的步骤，仅当当前步骤所述的响应条件被满足时才推进：
1. **调用 task-executor**：执行实现（跨层时参见“分层感知智能体路由”）。Medium/Large 传递任务文件。Small 直接传递已批准的成果、约束来源、受影响路径和验证条件；不创建任务文件。
2. **检查 task-executor 的响应**：
   - `status: "escalation_needed"` 或 `"blocked"` → 应用 subagents-orchestration-guide 的“专家结果受理”
   - `requiresTestReview` 为 `true` → 执行 **integration-test-reviewer**，传递已变更的集成/E2E 测试路径和 `diffBase: HEAD`。对于 Medium/Large 还需传递 `taskFiles: [当前任务文件路径]`；对于 Small 则改为传递直接范围的验证主张。然后依据其 `status` 分支
     - `needs_revision` → 应用评审裁定，并带着原有的执行范围以及作为 `correction_findings` 逐字传递的完整 `apply` 质量问题对象返回步骤 1
     - `blocked` → 从当前差异中解析被移动或重命名的测试路径，并在解析后的输入改变了评审目标时重新运行。如果尽管 `requiresTestReview: true` 却不存在可读的已变更测试，则将该执行者输出缺陷作为 `correction_findings` 返回步骤 1；否则将该评审记录为未运行并附上其 `blockingReason`，然后进入步骤 3
     - `approved` → 推进到步骤 3
   - 其他情况 → 推进到步骤 3
3. **调用 quality-fixer**：针对当前完整的未提交工作树执行所有质量检查与修复，包括未跟踪、已删除和已重命名的路径（跨层时参见“分层感知智能体路由”）。Medium/Large 还需传递当前的 `task_file`；Small 传递直接的执行范围。当约束来源或仓库惯例指明时，传递实现步骤的 `runnableCheck` 和 `qualityCommand`。
   - `stub_detected` → 返回步骤 1，并以原有的执行范围和 `incompleteImplementations[]` 重新调用 task-executor
   - `blocked` → 应用“专家结果受理”
   - `verification_incomplete` → 保留完整结果以供最终重试，并进入步骤 4
   - `approved` → 推进到步骤 4
4. **提交**：在 `approved` 或 `verification_incomplete` 之后提交已完成任务的变更集

### 实现后评审（Medium/Large，所有任务完成后）

在调用依赖文档的评审者之前，应用 subagents-orchestration-guide 的“专家结果受理”中的证明局限重试。在解除或保留每个结果后继续，并仅报告重复出现的证明局限。

解析工作计划中可读的设计文档；缺少输入将阻塞评审。

在一条助手消息中发出以下 Agent 调用，然后等待两者：
- code-reviewer（subagent_type: "code-reviewer"）→ 使用解析出的带类型 `governingDocuments`、已完成任务实际变更的文件作为 `implementationFiles`、以及工作计划路径，评审已完成的实现
- security-reviewer（subagent_type: "security-reviewer"）→ 依据相同的带类型 `governingDocuments` 评审已完成的实现

应用 subagents-orchestration-guide 的实现后评审状态路由与修复/重跑规则。呈现统一报告；在完整评审集达到评审裁定的收敛条件之后，进入最终清理。

对于 Small，跳过此依赖文档的评审。在任务提交后，对保留的证明局限重试一次；以观测到的 `observable_verification` 依据完成，并报告任何仍然无法取得的证据。

### 最终清理

仅对 Medium/Large，在完成报告之前，删除本流程所消耗的实现任务文件。Small 不创建任务文件。所消耗的任务文件是临时的工作状态，不在流程的多次运行之间保留。

本流程与规模无关，可能执行单层或多层计划，因此清理必须覆盖从计划的执行者通道生成任务文件时可能产生的每一种任务命名模式：

- 针对从本次运行所使用的工作计划路径派生出的 `{plan-name}`，删除匹配以下任意模式的每一个文件：
  - `docs/plans/tasks/{plan-name}-task-*.md`（单层任务）
  - `docs/plans/tasks/{plan-name}-backend-task-*.md`（多层计划的后端部分）
  - `docs/plans/tasks/{plan-name}-frontend-task-*.md`（多层计划的前端部分）
- 从这些匹配项中排除 `integration-tests-*-task-*.md`（这来自另一个工作流阶段）
- 保留工作计划本身（`docs/plans/{plan-name}.md`）—— 由用户决定是否在最终评审后删除它

若任务文件无法删除（文件系统错误），报告该失败，但不要阻断完成报告。

## 执行方式

所有工作均通过子智能体执行。
子智能体的选择遵循 subagents-orchestration-guide 技能。
