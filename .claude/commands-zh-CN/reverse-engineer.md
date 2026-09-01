---
description: 通过探索、生成、验证与评审工作流，从现有代码库生成 PRD 和设计文档
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在编写 Agent 提示词、交接内容或生成的产物之前，执行 `llm-friendly-context` 技能（使用 Skill 工具）。

**命令上下文**：从现有代码创建文档的逆向工程工作流

目标：$ARGUMENTS

## 编排者定义

**核心身份**：“我不是执行者。我是编排者。”（参见 subagents-orchestration-guide 技能）

**执行协议**：
1. **通过 Agent 工具委派全部工作** —— 调用子智能体、在它们之间传递交付物路径、并报告结果（允许使用的工具：参见 subagents-orchestration-guide 的“编排者可用工具”）
2. **一次处理一个步骤**：在每个单元内按顺序执行步骤（2 → 3 → 4 → 5）。每个步骤的输出是下一步骤的必需输入。在开始下一个单元之前，完成一个单元的所有步骤
3. **将 `$STEP_N_OUTPUT` 原样传递**给子智能体 —— 编排者只做数据的桥接，不做处理或过滤

**执行条件**：先完成阶段 1，再进入阶段 2。在每个阶段内，先让一个单元的生成、验证、评审和必要的修订收敛完成，再开始下一个单元。仅当当前步骤所声明的输出和质量条件均满足时才推进。在每个循环边界，按当前阶段声明的顺序选取第一个尚未满足单元完成条件、且未被记录为生成失败的单元。文档路径只能证明已生成。

## 步骤 0：初始配置

### 0.1 范围确认

使用 AskUserQuestion 确认：
1. **目标路径**：要为哪个目录/模块编写文档
2. **深度**：仅 PRD，或 PRD + 设计文档
3. **参考架构**：layered / mvc / clean / hexagonal / none
4. **人工评审**：是（推荐）/ 否（完全自主）
5. **全栈设计**：是 / 否
   - 是：启用按单元生成后端 + 前端设计文档

### 0.2 输出配置

- PRD 输出：`docs/prd/` 或已有的 PRD 目录
- 设计文档输出：`docs/design/` 或已有的 design 目录
- 确认目录存在，必要时创建

## 工作流概览

```
阶段 1：PRD 生成
  步骤 1：范围探索（统一、单趟执行 → 分组为 PRD 单元 → 人工评审）
  步骤 2-5：按单元循环（生成 → 验证 → 评审 → 修订）

阶段 2：设计文档生成（若已请求）
  步骤 6：设计文档范围映射（复用步骤 1 的结果，不重新探索）
  步骤 7-10：按单元循环（生成 → 验证 → 评审 → 修订）
  ※ fullstack=Yes：单元可根据范围产出后端 + 前端设计文档
```

## 阶段 1：PRD 生成

### 步骤 1：PRD 范围探索

**Task 调用**：
```
subagent_type: scope-discoverer
prompt: |
  在代码库中探索功能范围目标。

  target_path: $USER_TARGET_PATH
  reference_architecture: $USER_RA_CHOICE
  focus_area: $USER_FOCUS_AREA（如已指定）
```

**将输出保存为**：`$STEP_1_OUTPUT`

**质量条件**：
- 至少发现一个单元 → 继续
- 未发现任何单元 → 向用户询问提示信息
- `$STEP_1_OUTPUT.prdUnits` 存在
- `prdUnits` 中所有 `sourceUnits`（展平并去重后）与 `discoveredUnits` 的 ID 集合一致 —— 没有遗漏的单元，也没有重复的单元
- 每个已发现单元的 `unitInventory` 至少有一个非空类别（routes、testFiles 或 publicExports）。三者全为空的单元表明探索不完整 —— 以该单元的 relatedFiles 为重点重新运行 scope-discoverer

**人工评审点**（若启用）：展示 `$STEP_1_OUTPUT.prdUnits` 及其来源单元映射。用户确认、调整分组，或将某些单元排除出范围。这是最重要的评审点 —— 错误的分组会级联影响所有下游文档。

### 步骤 2-5：按单元处理

**FOR** `$STEP_1_OUTPUT.prdUnits` 中的每个单元 **（顺序执行，一次一个单元）：**

#### 步骤 2：PRD 生成

**Task 调用**：
```
subagent_type: prd-creator
prompt: |
  为以下功能创建逆向工程 PRD。

  Operation Mode: reverse-engineer
  External Scope Provided: true

  Feature: $PRD_UNIT_NAME（来自 $STEP_1_OUTPUT）
  Description: $PRD_UNIT_DESCRIPTION
  Related Files: $PRD_UNIT_COMBINED_RELATED_FILES
  Entry Points: $PRD_UNIT_COMBINED_ENTRY_POINTS

  将提供的范围作为调查起点。
  如果沿入口点追溯发现该范围之外的文件，也将其纳入。
  基于充分的代码调查创建最终版 PRD。
```

**将输出保存为**：`$STEP_2_OUTPUT`（PRD 路径）

#### 步骤 3：代码验证

**前提条件**：$STEP_2_OUTPUT（步骤 2 产出的 PRD 路径）

**Task 调用**：
```
subagent_type: code-verifier
prompt: |
  验证 PRD 与代码实现之间的一致性。

  doc_type: prd
  document_path: $STEP_2_OUTPUT
```

注意：有意不提供 `code_paths`。验证者从文档独立探索代码范围，从而确保验证独立进行、不受 scope-discoverer 输出的限制。

继续之前先读取 `summary.status`：当其为 `blocked` 时，说明输入条件未满足且未进行任何验证 —— 停止并向用户报告 `blockingReason`，而不要把结果继续传递下去，因为其空的 `discrepancies` 会在下游被读成验证通过。

**将输出保存为**：`$STEP_3_OUTPUT`

将完整的验证者结果传递给文档评审。其 discrepancies 是需要解决的依据；不使用数值评分和主张配额。

#### 步骤 4：评审

**必需输入**：$STEP_3_OUTPUT（步骤 3 产出的验证 JSON）

**Task 调用**：
```
subagent_type: document-reviewer
prompt: |
  结合代码验证结果评审以下 PRD。

  doc_type: PRD
  target: $STEP_2_OUTPUT
  review_context: reverse-engineer
  verification_evidence: $STEP_3_OUTPUT
```

**将输出保存为**：`$STEP_4_OUTPUT`

#### 步骤 5：修订（条件性）

依据 `verdict.decision` 分支。`approved` 表示该单元完成。对于 `needs_revision`，应用评审裁定，将完整的 `apply` 问题对象原样传给处于 update 模式的 `prd-creator`，然后带 `prior_feedback` 重跑步骤 3-4。仅包含 decline 的结果即表示评审完成。对于 `rejected`，应用上级“需求变更检测”。

#### 单元完成

- [ ] 评审结论为 `approved`
- [ ] 人工评审通过（若在步骤 0 中启用）

**下一步**：处理下一个单元。所有单元完成后 → 阶段 2。

## 阶段 2：设计文档生成

*仅当在步骤 0 中请求了设计文档时执行*

### 步骤 6：设计文档范围映射

**无需额外探索。** 使用 `$STEP_1_OUTPUT.discoveredUnits`（实现粒度的单元）获取技术画像。使用 `$STEP_1_OUTPUT.prdUnits[].sourceUnits` 追溯哪些已发现单元属于各个 PRD 单元。

当 fullstack=Yes 时，根据单元的 `relatedFiles` 和 `technicalProfile.primaryModules` 中的路径模式，按单元判定需要后端 / 前端 / 两者的设计文档（参考 technical-spec 技能中定义的项目结构）。

将 `$STEP_1_OUTPUT` 的单元映射到设计文档生成目标，并向前传递：
- `technicalProfile.primaryModules` → 主要文件
- `technicalProfile.publicInterfaces` → 公开接口
- `dependencies` → 依赖关系
- `relatedFiles` → 范围边界
- `unitInventory` → 单元清单（路由、测试文件、公开导出）

**将输出保存为**：`$STEP_6_OUTPUT`

### 步骤 7-10：按单元处理

**FOR** `$STEP_6_OUTPUT.designDocTargets` 中的每个单元 **（顺序执行，一次一个单元）：**

#### 步骤 7：设计文档生成

依据 `$STEP_6_OUTPUT` 的映射，按单元生成设计文档。

当 fullstack=Yes 时，依次调用 7a 再调用 7b（7b 依赖 7a 的输出）。

**7a.** 后端设计文档（technical-designer）：

当 fullstack=Yes 时：在提示中追加“重点关注：API 契约、数据层、业务逻辑、服务架构。”。

**Task 调用**：
```
subagent_type: technical-designer
prompt: |
  基于现有代码为以下功能创建设计文档。

  Operation Mode: reverse-engineer

  Feature: $UNIT_NAME（来自 $STEP_6_OUTPUT）
  Description: $UNIT_DESCRIPTION
  Primary Files: $UNIT_PRIMARY_MODULES
  Public Interfaces: $UNIT_PUBLIC_INTERFACES
  Dependencies: $UNIT_DEPENDENCIES
  Unit Inventory: $UNIT_INVENTORY（来自范围探索的路由、测试文件、公开导出）

  Parent PRD: $APPROVED_PRD_PATH

  按现状记录当前架构。将单元清单作为完整性基线 —— 所有路由和导出都应在设计文档中有所交代。
```

**将输出保存为**：`$STEP_7_OUTPUT`

**7b.** 前端设计文档（全栈，具有前端范围的单元）：

```
subagent_type: technical-designer-frontend
prompt: |
  基于现有代码为以下功能创建前端设计文档。

  Operation Mode: reverse-engineer

  Feature: $UNIT_NAME（来自 $STEP_6_OUTPUT）
  Description: $UNIT_DESCRIPTION
  Primary Files: $UNIT_PRIMARY_MODULES
  Public Interfaces: $UNIT_PUBLIC_INTERFACES
  Dependencies: $UNIT_DEPENDENCIES
  Unit Inventory: $UNIT_INVENTORY

  Parent PRD: $APPROVED_PRD_PATH
  Backend Design Doc: $STEP_7_OUTPUT

  参考后端设计文档的 API 契约。
  重点关注：组件层级、状态管理、UI 交互、数据获取。
  按现状记录当前架构。将单元清单作为完整性基线。
```

**将输出保存为**：`$STEP_7_FRONTEND_OUTPUT`

#### 步骤 8：代码验证

分别验证每一份生成的设计文档。

**Task 调用（每份设计文档）**：
```
subagent_type: code-verifier
prompt: |
  验证设计文档与代码实现之间的一致性。

  doc_type: design-doc
  document_path: $STEP_7_OUTPUT 或 $STEP_7_FRONTEND_OUTPUT
```

注意：有意不提供 `code_paths`。验证者从文档独立探索代码范围。

继续之前先读取 `summary.status`：当其为 `blocked` 时，停止并报告该设计文档的 `blockingReason`，而不要把结果传给 document-reviewer。

**将输出保存为**：`$STEP_8_OUTPUT`

#### 步骤 9：评审

**必需输入**：$STEP_8_OUTPUT（步骤 8 产出的验证 JSON）

**Task 调用（每份设计文档）**：
```
subagent_type: document-reviewer
prompt: |
  结合代码验证结果评审以下设计文档。

  doc_type: DesignDoc
  review_context: reverse-engineer
  target: $STEP_7_OUTPUT 或 $STEP_7_FRONTEND_OUTPUT
  verification_evidence: $STEP_8_OUTPUT

  ## 上级 PRD
  $APPROVED_PRD_PATH

  ## 额外评审重点
  - 所记录接口的技术准确性
  - 与上级 PRD 范围的一致性
  - 单元边界定义的完整性
```

**将输出保存为**：`$STEP_9_OUTPUT`

#### 步骤 10：修订（条件性）

依据 `verdict.decision` 分支。`approved` 表示该单元完成。对于 `needs_revision`，应用评审裁定，将完整的 `apply` 问题对象原样传给处于 update 模式的 `technical-designer` 或 `technical-designer-frontend`，然后带 `prior_feedback` 重跑步骤 8-9。仅包含 decline 的结果即表示评审完成。对于 `rejected`，应用上级“需求变更检测”。

#### 单元完成

- [ ] 评审结论为 `approved`
- [ ] 人工评审通过（若在步骤 0 中启用）

**下一步**：处理下一个单元。所有单元完成后 → 最终报告。

## 最终报告

输出摘要，包含：
- 生成文档表格（类型、名称、验证状态、评审结论）
- 已解决、已拒绝和未解决的发现项
- 后续步骤清单

## 错误处理

| 错误 | 处理 |
|-------|--------|
| 探索未发现任何内容 | 向用户询问项目结构提示信息 |
| 生成失败 | 记录失败，继续处理其他单元，在摘要中报告 |
| 验证者返回 `blocked` | 停止并报告 `blockingReason` |
| 评审者返回 `rejected` | 应用上级“需求变更检测” |
