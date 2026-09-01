---
description: 以自主执行模式执行已生成的任务文件
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在编写 Agent 提示词、交接内容或生成的产物之前，执行 `llm-friendly-context` 技能（使用 Skill 工具）。

## 编排者定义

**核心身份**：“我不是执行者。我是编排者。”（参见 subagents-orchestration-guide 技能）

**执行协议**：
1. **通过 Agent 工具委派所有工作** — 调用子智能体、在它们之间传递数据并报告结果（允许使用的工具：参见 subagents-orchestration-guide 的“编排者可用工具”）
2. **严格遵循 4 步任务循环**：task-executor → 上报检查 → quality-fixer → 提交
3. 当用户在已有任务文件的情况下给出执行指令时，**进入自主模式** — 这本身就是批量批准
4. **范围**：按顺序完成本次处理任务集的执行、实现后评审、本次处理任务的清理和完成报告；或者当需要就已确认的价值边界作出选择、或需要授权不可逆操作时，在当前阶段停止自主执行。仅当满足当前阶段声明的转移条件时才推进。

**关键**：在每次提交前运行 quality-fixer。

工作计划：$ARGUMENTS

## 执行前的前置条件

### 工作计划解析

在进行任何任务处理之前，先定位工作计划。

**当提供了 `$ARGUMENTS` 时**，它就是用户提供的工作计划路径。直接使用它，不进行自动解析。从文件名中去掉 `.md` 扩展名（以及结尾存在的 `-plan` 后缀）来提取 `{plan-name}`。

**当 `$ARGUMENTS` 为空时**，从任务文件自动解析：
1. 列出 `docs/plans/tasks/` 中与本流程可处理模式匹配的任务文件（它们对应 subagents-orchestration-guide 的“分层感知智能体路由”中经由 `task-executor` 的路由）：
   - `{plan-name}-task-*.md`（单层；按路由表保留给后端）
   - `{plan-name}-backend-task-*.md`（多层计划中的后端部分）
   - `{plan-name}-frontend-task-*.md` **不由**本流程处理 — 它路由到 `task-executor-frontend`，归前端构建流程所有
2. 在匹配到的文件中，还需排除匹配以下任一模式的每个文件 — 它们来自其他工作流阶段，不是本次运行计划的实现任务：`integration-tests-*-task-*.md`（集成测试附加脚手架）
3. 对剩余的每个文件，通过去掉结尾的 `-task-{NN}.md` 或 `-backend-task-{NN}.md` 后缀来提取 `{plan-name}`
4. 当至少有一个任务文件匹配时，取任务文件 mtime 最新的那个前缀，工作计划即为 `docs/plans/{plan-name}.md`；并列时取字典序最后的 `{plan-name}`
5. **当可处理的匹配模式没有匹配项，但 `docs/plans/tasks/` 中存在 `*-frontend-task-*.md` 文件时**：停止并报告：“只找到了以 frontend 命名的任务文件。如果你本意是运行前端构建流程，请切换到该流程。如果该计划是后端计划，请将受影响的工作计划任务条目更正为 `Executor lane: backend` 并重新生成任务文件，或将工作计划路径作为 `$ARGUMENTS` 传入。” 文件名遵循计划声明的 lane，因此仅重新生成任务文件不会改变它们。
6. 当可处理的匹配模式和 `*-frontend-task-*.md` 都不匹配时，读取 `docs/plans/` 中 mtime 最新的非模板 `.md` 文件，并根据每个任务条目声明的 `Executor lane` 来判断：
   - 每个任务都是 `backend` → 该计划是后端计划；继续
   - 任何任务是 `frontend`，或任何任务省略了 lane → 停止并报告：“无法从 `[path]` 处最新工作计划的任务 `Executor lane` 值确认它是后端计划。请将目标后端计划路径作为 `$ARGUMENTS` 传入，或运行 task-decomposer 以便 `docs/plans/tasks/` 收到以 backend 命名的任务文件。”
7. 当 `docs/plans/` 中完全不存在计划时，停止并报告：“未找到工作计划。请将工作计划路径作为 `$ARGUMENTS` 传入，或先完成规划阶段。”

### 本次处理任务集

为本次运行计算**本次处理任务集** — 本流程拥有、执行并在之后删除的确切文件。使用与“工作计划解析”相同的可处理匹配模式：

1. 针对由“工作计划解析”解析出的 `{plan-name}`，列出 `docs/plans/tasks/` 中匹配 `{plan-name}-task-*.md` 或 `{plan-name}-backend-task-*.md` 的任务文件。`{plan-name}-frontend-task-*.md` 被排除 — 它归前端构建流程所有
2. 排除匹配以下模式的每个文件：`integration-tests-*-task-*.md`（这来自另一个工作流阶段）

本流程中后续对“任务文件”的每一次引用 — 任务生成决策流程、任务执行循环的迭代和最终清理 — 使用的都是这个集合，而不是不受限的 `docs/plans/tasks/*.md` 通配。

### 任务生成决策流程

分析本次处理任务集并确定所需的操作。到达本节意味着上面的“工作计划解析”已解析出一个工作计划（步骤 1-6 成功）；“无计划”状态已由“工作计划解析”步骤 7 终止，绝不会到达此表。

| 状态 | 判定标准 | 下一步操作 |
|-------|----------|-------------|
| 存在任务 | 本次处理任务集非空 | 用户的执行指令即为批量批准 → 立即进入自主执行 |
| 无任务 + 经由 `$ARGUMENTS` 提供了计划 | 提供了 `$ARGUMENTS` 且本次处理任务集为空 | 与用户确认 → 运行 task-decomposer |
| 无任务 + 计划为自动解析 | 本次处理任务集为空 且 计划来自自动解析 且 步骤 6 确认每个任务都声明了 `Executor lane: backend` | 与用户确认 → 运行 task-decomposer（步骤 6 已排除前端计划和未声明 lane 的计划，因此这是安全的） |

当尚不存在计划、需从设计文档启动时，先运行规划流程生成工作计划，然后重新调用本流程 — 上面的“工作计划解析”有意要求已解析的工作计划，而不是自动创建一个，以保持分层决策的显式性。

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
**强制执行循环**：`task-executor → 上报检查 → quality-fixer → 提交`

对本次处理任务集中的每一个任务，你必须：
1. **执行**：调用 task-executor 来实现该任务（跨层时：参见 subagents-orchestration-guide 中的“分层感知智能体路由”）
2. **根据执行者结果分支**：
   - `status: "escalation_needed"` 或 `"blocked"` → 应用 subagents-orchestration-guide 的“专家结果受理”
   - `requiresTestReview` 为 `true` → 执行 **integration-test-reviewer**，将实现步骤 `testsAdded` 中的每一个路径作为 `testFile` 传入，`taskFiles: [当前任务文件路径]`（以便评审者可以读取该任务的 Operation Verification Methods 和 Verification Focus），`diffBase: HEAD`（此时该任务的更改尚未提交，因此 HEAD 是其 diff 的基点）。然后根据其 `status` 分支
     - `needs_revision` → 应用“评审裁定”，并带着相同的 `task_file` 以及作为 `correction_findings` 逐字传入的完整 `apply` 质量问题对象返回步骤 1
     - `blocked` → 从当前差异中解析被移动或重命名的测试路径，并在解析后的输入改变了评审目标时重新运行。如果尽管 `requiresTestReview: true` 却不存在可读的已变更测试，则将该执行者输出缺陷作为 `correction_findings` 返回步骤 1；否则将该评审记录为未运行并附上其 `blockingReason`，然后进入步骤 3
     - `approved` → 进入步骤 3
   - `readyForQualityCheck: true` → 进入步骤 3
3. **质量修复**：针对完整的当前未提交工作树调用 quality-fixer，包括未跟踪、已删除和已重命名的路径（跨层时：参见“分层感知智能体路由”）。传入当前的 `task_file`、实现步骤的 `runnableCheck`，以及当 technical-spec 或仓库约定指定了某个命令时的 `qualityCommand`。然后根据其响应分支：
   - `stub_detected` → 返回步骤 1，并用相同的 `task_file` 和 `incompleteImplementations[]` 数组重新调用 task-executor
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

在确认批准后，启动自主执行模式。一旦检测到任何需求变更，立即停止。

## 实现后评审（所有任务完成之后）

在调用实现后评审者之前，应用 subagents-orchestration-guide“专家结果受理”中的证明局限重试。在解除或保留每项证明局限之后继续进行评审；完成报告中只包含重复出现的证明局限。

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

**职责边界**：
- 范围内：从任务文件生成到实现完成
- 范围外：设计阶段、规划阶段
