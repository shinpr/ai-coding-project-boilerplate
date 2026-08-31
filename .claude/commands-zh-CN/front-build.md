---
description: 以自主执行模式执行已生成的前端任务文件
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在编写 Agent 提示词、交接内容或生成的产物之前，执行 `llm-friendly-context` 技能（使用 Skill 工具）。

## 编排者定义

**核心身份**：“我是编排者。”（参见 subagents-orchestration-guide 技能）

**执行协议**：
1. **通过 Agent 工具委派全部工作** —— 调用子智能体、在它们之间传递交付物路径、并报告结果（允许使用的工具：参见 subagents-orchestration-guide 的“编排者可用工具”）
2. **严格遵循 4 步任务循环**：task-executor-frontend → 上报检查 → quality-fixer-frontend → 提交
3. 当用户在已有任务文件的情况下给出执行指令时，**进入自主模式** — 这本身就是批量批准
4. **范围**：按顺序完成本次处理任务集的执行、实现后评审、本次处理任务的清理和完成报告；或者当需要就已确认的价值边界作出选择、或需要授权不可逆操作时，在当前阶段停止自主执行。仅当满足当前阶段声明的转移条件时才推进。

**关键**：在每次提交前运行 quality-fixer-frontend。

工作计划：$ARGUMENTS

## 执行前的前置条件

### 工作计划解析

在进行任何任务处理之前，先定位工作计划。

**当提供了 `$ARGUMENTS` 时**，它就是用户提供的工作计划路径。直接使用它，不进行自动解析。从文件名中去掉 `.md` 扩展名（以及结尾存在的 `-plan` 后缀）来提取 `{plan-name}`。

**当 `$ARGUMENTS` 为空时**，从任务文件自动解析：
1. 列出 `docs/plans/tasks/` 中与本流程唯一可处理模式匹配的任务文件（依据 subagents-orchestration-guide 的“分层感知智能体路由”，`task-executor-frontend` 拥有该文件名后缀，且不拥有其他后缀）：
   - `{plan-name}-frontend-task-*.md`
   - 裸的 `{plan-name}-task-*.md` **不属于本流程的处理范围** —— 该文件名由路由表保留给后端，并由后端构建流程拥有。`{plan-name}-backend-task-*.md` 出于相同原因也不属于本流程的处理范围。
2. 在匹配到的文件中，还需排除匹配以下任一模式的每个文件 — 它们来自其他工作流阶段，不是本次运行计划的实现任务：`integration-tests-*-task-*.md`（集成测试附加脚手架）
3. 对每个剩余文件，通过去掉结尾的 `-frontend-task-{NN}.md` 后缀提取 `{plan-name}`
4. 当至少有一个任务文件匹配时，取任务文件 mtime 最新的那个前缀，工作计划即为 `docs/plans/{plan-name}.md`；并列时取字典序最后的 `{plan-name}`
5. 当未找到任何 `*-frontend-task-*.md` 且 `docs/plans/` 中存在非模板的工作计划时，将前端任务视为需要显式名称 —— 最新的计划不能替代它。停止并报告：“在 `docs/plans/tasks/` 中未找到 `*-frontend-task-*.md`。如果你打算对前端计划运行本流程，请将工作计划中相关的任务条目更正为 `Executor lane: frontend` 并重新生成任务文件，或者通过 `$ARGUMENTS` 传入工作计划路径。如果该计划属于后端，请改用后端构建流程。” 文件名遵循计划中声明的通道（lane），因此仅重新生成任务文件不会改变它们。

### 本次处理任务集

为本次运行计算**本次处理任务集** —— 本流程拥有、执行并在之后删除的确切文件。依据路由表，唯一可处理的匹配模式是：

1. 列出 `docs/plans/tasks/` 中匹配 `{plan-name}-frontend-task-*.md` 的任务文件，其中 `{plan-name}` 由“工作计划解析”解析得出。`{plan-name}-task-*.md` 和 `{plan-name}-backend-task-*.md` 被排除 —— 它们路由到 `task-executor`，并由后端构建流程拥有
2. 排除匹配以下模式的每个文件：`integration-tests-*-task-*.md`（这来自另一个工作流阶段）

本流程中后续对“任务文件”的每一次引用 — 任务生成决策流程、任务执行循环的迭代和最终清理 — 使用的都是这个集合，而不是不受限的 `docs/plans/tasks/*.md` 通配。

### 任务生成决策流程

分析本次处理任务集并确定所需的行动。注意：当 `$ARGUMENTS` 为空且不存在任何 `*-frontend-task-*.md` 时，上面的“工作计划解析”已经停止执行 —— 因此下表中涉及“无任务”的行仅在用户显式提供了 `$ARGUMENTS` 时才会触发。

| 状态 | 判定标准 | 下一步操作 |
|-------|----------|-------------|
| 存在任务 | 本次处理任务集非空 | 用户的执行指令即为批量批准 → 立即进入自主执行 |
| 无任务 + 通过 `$ARGUMENTS` 提供了计划 | 提供了 `$ARGUMENTS` 且本次处理任务集为空 | 与用户确认 → 运行 task-decomposer（它会为每个声明了 `Executor lane: frontend` 的任务条目输出 `*-frontend-task-*.md`） |
| 两者都不存在 + 存在设计文档 + 提供了 `$ARGUMENTS` | 提供了 `$ARGUMENTS`，无计划，无本次处理任务集，但存在 docs/design/*.md | 调用 work-planner 从设计文档创建工作计划，然后在生成任务文件之前运行**工作计划评审**（见下文） |
| 两者都不存在 | 无 `$ARGUMENTS`，无计划，无本次处理任务集，无设计文档 | 向用户报告缺失的前提条件并停止 |

## 工作计划评审（当本流程创建了该计划时）

当上面的决策流程从设计文档创建了工作计划时，在生成任务文件之前对其进行评审：

1. 使用 Agent 工具调用 document-reviewer：
   - `subagent_type`: "document-reviewer"
   - `description`: "工作计划评审"
   - `prompt`: "doc_type: WorkPlan target: docs/plans/[plan-name].md。评审工作计划自身的实现范围、任务、完成标准、依赖关系、执行顺序、来源锚点是否确切存在，以及验证是否可执行。从目标文档的‘约束文档’一节确定本次评审应采用哪些约束来源。"
2. 依据评审者的 `verdict.decision` 分支：
   - `needs_revision` → 运行评审裁定，走完其修正复评、上报和收敛的各项转换，对重新路由的修正使用更新模式的 work-planner；仅在其收敛条件达成时才继续
   - `rejected` → 在生成任务文件之前停止并上报给用户
3. 在生成任务文件之前，将评审后的计划提交批量批准。

## 任务文件生成阶段（条件性）

当本次处理任务集为空时：

### 1. 用户确认
```
本次处理任务集中没有任务文件。
工作计划：docs/plans/[plan-name].md

从工作计划生成任务？ (y/n)：
```

### 2. 生成任务文件（若获批准）
使用 Agent 工具调用 task-decomposer：
- `subagent_type`："task-decomposer"
- `description`："生成工作计划任务文件"
- `prompt`："读取 docs/plans/[plan-name].md 处的工作计划，并在 docs/plans/tasks/ 中为每个工作计划实现条目输出一个单次提交粒度的任务文件，各文件名从该条目的 Executor lane 中选择。"

### 3. 验证生成结果
使用上面“本次处理任务集”一节中相同的受限模式重新计算本次处理任务集。确认它现在非空。如果仍为空，上报给用户 — task-decomposer 要么静默失败，要么产出了不匹配预期模式的文件。

**流程**：任务生成 → 本次处理任务集重新计算 → 自主执行（按此顺序）

## 执行前检查清单

- [ ] 已确认本次处理任务集非空（在上面“本次处理任务集”一节中计算）
- [ ] 已确定本次处理任务集内的任务执行顺序（依赖关系）
- [ ] **环境检查**：我能否执行逐任务的提交循环？
  - 如果提交能力不可用 → 在进入自主模式前应用“专家结果受理”
  - 测试和质量工具的限制 → 子智能体运行不受影响的检查，并准确记录哪些无法运行

## 任务执行循环（4 步循环）
**强制执行循环**：`task-executor-frontend → 上报检查 → quality-fixer-frontend → 提交`

对本次处理任务集中的每一个任务，你必须：
1. **执行**：调用 **Agent 工具**（subagent_type: "task-executor-frontend"）→ 在提示词中传入任务文件路径，接收结构化响应
2. **根据执行者结果分支**：
   - `status: "escalation_needed"` 或 `"blocked"` → 应用 subagents-orchestration-guide 的“专家结果受理”
   - `requiresTestReview` 为 `true` → 执行 **integration-test-reviewer**，将实现步骤 `testsAdded` 中的每一个路径作为 `testFile` 传入，`taskFiles: [当前任务文件路径]`（以便评审者可以读取该任务的 Operation Verification Methods 和 Verification Focus），`diffBase: HEAD`（此时该任务的更改尚未提交，因此 HEAD 是其 diff 的基点）。然后根据其 `status` 分支
     - `needs_revision` → 应用“评审裁定”，并带着相同的 `task_file` 以及作为 `correction_findings` 逐字传入的完整 `apply` 质量问题对象返回步骤 1
     - `blocked` → 从当前差异中解析被移动或重命名的测试路径，并在解析后的输入改变了评审目标时重新运行。如果尽管 `requiresTestReview: true` 却不存在可读的已变更测试，则将该执行者输出缺陷作为 `correction_findings` 返回步骤 1；否则将该评审记录为未运行并附上其 `blockingReason`，然后进入步骤 3
     - `approved` → 进入步骤 3
   - `readyForQualityCheck: true` → 进入步骤 3
3. **质量修复**：针对当前完整的未提交工作树调用 quality-fixer-frontend，包括未跟踪、已删除和已重命名的路径。传入当前的 `task_file`、实现步骤的 `runnableCheck`，以及当 frontend-technical-spec 或仓库约定指明了某个命令时的 `qualityCommand`。然后依据其响应分支：
   - `stub_detected` → 返回步骤 1，用相同的 `task_file` 和 `incompleteImplementations[]` 数组重新调用 task-executor-frontend
   - `blocked` → 应用“专家结果受理”
   - `verification_incomplete` → 保留完整结果以供最终重试，并进入步骤 4
   - `approved` → 进入步骤 4
4. **提交**：在 `approved` 或 `verification_incomplete` 之后提交已完成任务的变更集

**关键**：解析每个子智能体响应的路由含义。在步骤 4 之后进入下一个任务，保留任何 `verification_incomplete` 结果以供最终重试。

## 子智能体的范围边界

将以下区块追加到本流程调用的每一个子智能体提示词中：

```
子智能体的范围边界：
在承担该成果的仓库职责范围内，一致地交付任务成果。
将被引用的路径视为调查起点，并在同一成果需要时纳入支撑文件。
除被指派的进度字段外，约束性产物保持只读。
当已确认的成果、目标状态需求与非目标无法同时成立时，返回需求变更检测；当需要不可逆的外部操作时，请求授权。
```

在继续之前，先验证批准状态。一旦确认，即启动自主执行模式。一旦检测到任何需求变更，立即停止。

## 实现后评审（所有任务完成之后）

在调用实现后评审者之前，用 quality-fixer-frontend 应用 subagents-orchestration-guide“专家结果受理”中的证明局限重试。在解除或保留每项证明局限后继续进行评审者调用；完成报告中只包含重复出现的证明局限。

解析工作计划中可读的设计文档；缺少输入将阻塞评审。

在一条助手消息中发出以下 Agent 调用，然后等待两者：
- code-reviewer（subagent_type: "code-reviewer"）→ 使用解析出的带类型 `governingDocuments`、已完成任务实际变更的文件作为 `implementationFiles`、以及工作计划路径，评审已完成的实现
- security-reviewer（subagent_type: "security-reviewer"）→ 依据相同的带类型 `governingDocuments` 评审已完成的实现

应用 subagents-orchestration-guide 的实现后评审状态路由与修复/重跑规则。呈现统一报告；在完整评审集达到评审裁定的收敛条件之后，进入最终清理。

## 最终清理

在完成报告之前，删除本流程处理的实现任务文件。它们的工作已提交；`docs/plans/` 是临时工作状态，不在流程各次运行之间保留：

- 删除本次处理任务集中的每一个文件
- 保留工作计划本身（`docs/plans/{plan-name}.md`）—— 由用户决定是否在最终评审后删除它

如果文件系统错误导致任务文件残留，记录该清理失败并继续完成报告。

## 完成报告契约

最终报告必须包含：
- 任务文件生成状态
- 已实现的任务数
- 质量检查结果，包括未运行的检查或存在的无关基线失败
- 最终重试后仍然存在的验证局限
- 提交数
- 清理结果
- 上报或阻塞摘要（如有）
