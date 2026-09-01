---
description: 使用设计文档为现有代码库添加集成/E2E 测试
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在编写 Agent 提示词、交接内容或生成的产物之前，执行 `llm-friendly-context` 技能（使用 Skill 工具）。
在做出工作流决策、调用智能体或处置发现项之前，执行 `subagents-orchestration-guide` 技能。

**命令用途**：为现有实现（后端、前端或全栈）添加测试的工作流

## 编排者定义

**核心身份**：“我是编排者。”

**执行条件**：对每个生成了测试的层，按顺序完成第 1-7 步。仅在满足当前步骤所声明的输出或响应条件后才向前推进。在每一层都完成评审、质量保证、提交以及保留的证明局限重试之后，报告完成。

**执行方式**：
- 骨架生成 → 委派给 acceptance-test-generator
- 测试实现 → 委派给 task-executor
- 测试评审 → 委派给 integration-test-reviewer
- 质量检查 → 委派给 quality-fixer

文档路径：$ARGUMENTS

## 前提条件

- 至少存在一份设计文档（手工创建或通过 reverse-engineer 生成）
- 存在可供测试的现有实现

## 执行流程

### 第 1 步：发现并校验文档

解析 `$ARGUMENTS` 中的每一条显式路径，包括已移动或重命名的路径。然后检查仓库的文档存放位置与元数据，查找相关的设计文档和 UI 规范。约定的 `docs/design/` 和 `docs/ui-spec/` 位置只是发现线索，而非必需的目录结构。

依据所发现文档声明的范围和内容对其分类：
- 后端契约、持久化或服务职责 → **设计文档（后端）**
- 组件、UI 状态、浏览器行为或前端职责 → **设计文档（前端）**
- 承担界面/状态/交互规格职责 → **UI 规范**（可选）
- 职责单一但所属层次不明确 → **单层设计文档**（依据其引用的代码和仓库上的职责归属确定执行者归属）

继续处理用户明确指名的文档，以及这些文档所引用的、语义上相关的产物。仅当存在多个可信的文档集合或执行者归属、且不同选择会实质性改变所生成的测试时，才请求确认。

在第 1 步解析出可读的设计文档并识别出其已接受行为之后，骨架生成方可开始。

### 第 2 步：骨架生成

对每份设计文档调用一次 acceptance-test-generator：
- `subagent_type`: "acceptance-test-generator"
- `description`: "为[层/名称]生成测试骨架"
- `prompt`: "从位于 [path] 的设计文档生成测试骨架。" + 当存在 UI 规范时："位于 [ui-spec path] 的 UI 规范可作为补充上下文使用。"

**每次调用的期望输出**：`generatedFiles[]`，包含已产出的骨架路径。空列表意味着该设计文档不需要额外的集成/E2E 证明。

当所有结果均为空时，报告不需要额外的集成/E2E 证明产物并结束。

### 第 3 步：测试实现

对每个已生成骨架的层，将当前 `HEAD` 记录为 `diffBase`，然后调用其执行者：
- 后端或单层后端 → `subagent_type`: "task-executor"
- 前端 → `subagent_type`: "task-executor-frontend"
- `description`: "实现集成测试"
- `direct_scope`: 实现该层所生成骨架定义的每一个测试
- `governing_sources`: 该层对应的设计文档、适用的 UI 规范以及生成的骨架路径
- `target_paths`: 生成的测试路径，以及从仓库中识别出的现有 setup 或 fixture 路径
- `observable_verification`: 执行已实现的测试，并在其声明的边界上验证每一条骨架主张

在开始下一层之前，先对一个层完整走完第 3→4→5→6→7 步。

**期望输出**：`status`、`testsAdded`、`runnableCheck`

在每次执行者调用之后应用“专家结果受理”。当响应与仓库状态确认至少有一个集成/E2E 测试文件发生变更时，进入第 4 步；只要仍存在可推进的行动，就继续实现。

### 第 4 步：测试评审

调用 integration-test-reviewer：
- `subagent_type`: "integration-test-reviewer"
- `description`: "评审测试质量"
- `testFile`: 已确认变更的集成/E2E 测试路径
- `diffBase`: 第 3 步之前记录的版本
- `designDocPath`: 该层对应的设计文档
- 当已变更的测试文件中没有骨架的注释标注时，在提示词中指明所生成的骨架路径，作为被评审的主张

**期望输出**：`status`（`approved`、`needs_revision` 或 `blocked`）、`qualityIssues[]`，以及在适用时用于修正后复评的 `prior_feedback_reconciliation`

### 第 5 步：应用评审修复

检查第 4 步的结果：
- `approved` → 进入第 6 步
- `blocked` → 应用“专家结果受理”
- `needs_revision` → 应用“评审裁定”，以第 3 步的原始范围加上完整的 `apply` 质量问题对象作为 `correction_findings`，重新调用同一层的执行者，然后带着 `prior_feedback` 回到第 4 步

### 第 6 步：质量检查

调用当前层对应的 quality-fixer：
- 后端或单层后端 → `subagent_type`: "quality-fixer"
- 前端 → `subagent_type`: "quality-fixer-frontend"
- `description`: "最终质量保证"
- `direct_scope`: 复用第 3 步的直接范围和受影响路径
- `runnableCheck`: 最近一次执行者结果中的 `runnableCheck`
- `prompt`: "运行仓库中已配置的、适用于本工作流所添加测试的每一项质量检查，并验证其预期的可观测行为。"

**期望输出**：`status`（`approved`、`stub_detected`、`verification_incomplete` 或 `blocked`）

检查结果：
- `stub_detected` → 保持 `incompleteImplementations` 不变回到第 3 步，然后重新执行第 3→4→5→6 步
- `blocked` → 应用“专家结果受理”
- `verification_incomplete` → 完整保留该结果，直到“专家结果受理”中的重试环节，并进入第 7 步
- `approved` → 进入第 7 步

### 第 7 步：提交与保留的证明局限重试

当结果为 `approved` 或 `verification_incomplete` 时，按照仓库常规的提交边界和提交信息约定，提交已完成的测试变更。

在每一层都达到干净的提交边界之后，使用相同的该层 quality-fixer 输入，应用“专家结果受理”中的证明局限重试。结果为 `approved` 时解除该证明局限；`stub_detected` 则回到第 3→6 步处理；再次返回 `verification_incomplete` 时，将该结果保留至完成报告，同时继续推进工作流。

在完成报告中，列出每一项重复出现的验证局限，以及处置为 `decline` 的每一项可处理的发现项，并在存在时附上其 ID、约束来源上的理由和依据。

## 子智能体的范围边界

将以下区块追加到本流程调用的每一个子智能体提示词中：

```
子智能体的范围边界：
在承担该测试证明的仓库职责范围内，一致地交付已确认的测试证明。
将被引用的路径视为调查起点，并在同一证明需要时纳入配套的测试脚手架文件。
除被指派的进度字段外，约束性产物保持只读。
当已确认的成果、目标状态需求与非目标无法同时成立时，返回需求变更检测；当需要不可逆的外部操作时，请求授权。
```
