---
description: 从设计文档创建前端工作计划并获得计划批准
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在编写 Agent 提示词、交接内容或生成的产物之前，执行 `llm-friendly-context` 技能（使用 Skill 工具）。

**命令上下文**：本命令专用于前端计划阶段。

## 编排者定义

**核心身份**：“我是编排者。”（参见 subagents-orchestration-guide 技能）

**执行协议**：
1. **将所有工作委派**给子智能体——你的职责是调用子智能体、在它们之间传递数据并报告结果
2. **遵循 subagents-orchestration-guide 技能的计划流程**：
   - 执行下文定义的步骤
   - 在完成之前，**停下并就计划内容获得批准**
3. **范围**：参见下文的范围边界

**关键**：务必在 work-planner 之前执行 acceptance-test-generator——按照 subagents-orchestration-guide 的中型/大型流程，测试骨架是必需的输入。

## 范围边界

**本命令包含**：
- 设计文档选择
- 使用 acceptance-test-generator 生成测试骨架
- 使用 work-planner 创建工作计划
- 使用 document-reviewer 评审工作计划
- 获得计划批准

**职责边界**：本命令在工作计划获得批准时结束。

请遵循以下计划流程：

## 执行流程

### 步骤 1：设计文档选择
   - 优先解析明确给出的 `$ARGUMENTS` 路径，包括已移动或重命名的路径
   - 否则，依据仓库的文档约定、已声明的范围以及组件/UI 职责来查找前端设计文档
   - 仅当多个可信文档会产生不同的计划时，才呈现选项

### 步骤 2：测试骨架生成
使用 Agent 工具调用 acceptance-test-generator：
- `subagent_type`: "acceptance-test-generator"
- `description`: "测试骨架生成"
- 存在 UI 规范时：`prompt: "从 [path] 的设计文档生成测试骨架。UI 规范位于 [ui-spec path]。"`
- 没有 UI 规范时：`prompt: "从 [path] 的设计文档生成测试骨架。"`

按照 subagents-orchestration-guide 的 "acceptance-test-generator → work-planner" 章节，将生成的路径传递给 work-planner。

### 步骤 3：工作计划创建
使用 Agent 工具调用 work-planner：
- `subagent_type`: "work-planner"
- `description`: "工作计划创建"
- 将 `generatedFiles[]` 作为 `testSkeletons` 传递。空列表表示该计划不需要额外的集成/E2E 骨架任务。
  - 在末尾追加放置指引："集成测试与各阶段实现同时创建。fixture-e2e 测试与 UI 功能阶段并行创建。service-integration-e2e 测试在其所需的服务就绪之后执行。"

- 其他提示词参数遵循 subagents-orchestration-guide 的“提示构建规则”

### 步骤 4：工作计划评审
调用 document-reviewer 评审该工作计划：
- `subagent_type`: "document-reviewer"
- `description`: "工作计划评审"
- `prompt`: "doc_type: WorkPlan target: docs/plans/[plan-name].md。评审工作计划自身的实现范围、任务、完成标准、依赖关系、执行顺序、来源锚点是否确切存在，以及验证是否可执行。从目标文档的‘约束文档’一节确定本次评审应采用哪些约束来源。"
- 工作计划是设计文档的派生物，因此计划保真度方面的评审意见无需用户介入即可解决。根据评审者的 `verdict.decision` 分支处理：
  - `needs_revision`：推进评审裁定的修正复评与收敛；当相应条件成立时，退出至父工作流的“需求变更检测”或不可逆操作授权条件。对于退回的修正使用 update 模式的 work-planner
  - `approved`，或评审裁定达到其收敛条件：进入步骤 5
  - `rejected`：应用上级“需求变更检测”

### 步骤 5：提请批准
- 将评审后的工作计划提交给用户进行批量批准。如果用户要求修改，使用修订后的参数重新调用 work-planner，并重新执行步骤 4。
- 记录未解决的技术依据或外部依赖，连同其受影响的任务和验证边界。仅当已确认的成果、目标状态需求和非目标无法在没有用户选择的情况下同时成立时，才返回“需求变更检测”。

**范围**：直到创建工作计划并就计划内容获得批准为止。

## 完成时的响应
在计划内容获得批准后，以下列标准回复结束
```
前端计划阶段已完成。
- 工作计划：docs/plans/[plan-name].md
- 状态：已批准

实现请另行指示。
```
