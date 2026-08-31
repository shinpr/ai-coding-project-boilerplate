---
description: 带评审地更新既有设计文档（Design Doc / PRD / ADR）
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

在编写 Agent 提示词、交接内容或生成的产物之前，执行 `llm-friendly-context` 技能（使用 Skill 工具）。

**命令上下文**：本命令专用于更新既有设计文档。

## 编排者定义

**核心身份**：“我不是执行者。我是编排者。”（参见 subagents-orchestration-guide 技能）

**执行条件**：按顺序完成第 1-6 步，只沿着由文档类型与评审结果激活的分支推进。仅在满足各步骤所声明的证据、评审收敛或批准条件时才前进。在满足最终批准条件、且每一条适用的完成标准都被满足后完成。

**执行协议**：
1. **通过 Agent 工具委派所有工作** — 调用子智能体、在它们之间传递数据并报告结果（允许使用的工具：参见 subagents-orchestration-guide 的“编排者可用工具”）
2. **执行更新流程**：
   - 确定目标 → 消解会改变成果的歧义 → 更新文档 → 评审 → 一致性检查 → 最终批准
3. **范围**：当更新后的文档获得批准时完成

**重要**：必须完成 document-reviewer 评审和最终批准步骤。

## 工作流概览

```
目标文档 → 必要时解析所需输入
                        ↓
              technical-designer / technical-designer-frontend / prd-creator（update 模式）
                        ↓（仅限 Design Doc）
              code-verifier → document-reviewer
                        ↓（仅限 Design Doc）
              design-sync → [停止：最终批准]
```

## 范围边界

**本命令包含**：
- 识别并选择既有文档
- 与用户澄清变更内容
- 使用相应智能体更新文档（update 模式）
- 使用 document-reviewer 评审文档
- 使用 design-sync 进行一致性验证（仅限 Design Doc）

**不包含**：
- 新需求分析
- 工作计划或实现

**职责边界**：本命令在更新后的文档获得批准时完成。

目标文档：$ARGUMENTS

## 执行流程

### 第 1 步：目标文档识别

优先解析明确给出的路径。否则，调查仓库的文档存放位置与约定，然后选出内容和元数据与 Design Doc、PRD 或 ADR 职责相符的文件。将惯用目录视为探索线索，并在报告文档不存在之前，先解析已移动或已改名的文档。

**决策流程**：

| 情况 | 行动 |
|-----------|--------|
| $ARGUMENTS 指定了路径 | 使用指定的文档 |
| $ARGUMENTS 描述了一个主题 | 搜索与该主题匹配的文档 |
| 找到多个候选项 | 用 AskUserQuestion 提供选项 |
| 未找到任何文档 | 报告并结束（新建文档不在本命令范围内） |

### 第 2 步：文档类型与层次判定

先从文档路径判定类型，然后判定层次，以选择正确的更新智能体：

| 路径模式 | 类型 | 更新智能体 | 备注 |
|-------------|------|--------------|-------|
| `docs/design/*.md` | Design Doc | technical-designer 或 technical-designer-frontend | 参见下方层次判定 |
| `docs/prd/*.md` | PRD | prd-creator | - |
| `docs/adr/*.md` | ADR | technical-designer 或 technical-designer-frontend | 参见下方层次判定 |

**层次判定**（适用于 Design Doc 与 ADR）：
阅读文档，并根据内容信号判定其层次：
- **前端**（→ technical-designer-frontend）：文档标题或范围提到 React、组件、UI、前端；或文件中包含组件层级、状态管理、UI 交互
- **后端**（→ technical-designer）：其他所有情况（API、数据层、业务逻辑、基础设施）

**ADR 更新指引**：
- **小幅变更**（澄清、错别字修正、小范围调整）：更新既有 ADR 文件
- **重大变更**（决策变更、范围显著变化）：创建一个取代原 ADR 的新 ADR

### 第 3 步：变更内容确定

从 `$ARGUMENTS` 和当前文档中提取所请求的成果、变更原因以及受影响的文档职责。当这些输入已能确定更新内容时，直接继续。仅当缺少某个决定、且其不同选择会实质改变文档含义或范围时，才使用 AskUserQuestion。

将确定后的变更记录为更新契约。

**带入更新的范围**：将已确认的章节、变更原因，以及用户声明的任何篇幅预算传递给更新智能体。在文档评审之前，将每一处被改动的章节映射到某个已确认的变更，或映射到该变更所要求的一致性更新。移除无法映射的意外改动；当某个必要变更会改变所请求的文档成果或明确的篇幅约束时，返回请求澄清步骤。

### 第 4 步：文档更新

调用第 2 步确定的更新智能体：
```
subagent_type: [第 2 步的更新智能体]
description: "更新[第 2 步的类型]"
prompt: |
  Operation Mode: update
  Existing Document: [第 1 步得到的路径]

  ## 需要的变更
  [第 3 步澄清的变更]

  更新该文档以反映指定的变更。
  添加变更历史条目。
```

### 第 5 步：文档评审

**仅限 Design Doc 更新**：在 document-reviewer 之前，调用 code-verifier：
```
subagent_type: code-verifier
description: "验证更新后的 Design Doc"
prompt: |
  doc_type: design-doc
  document_path: [第 1 步得到的路径]
  对照当前代码库验证更新后的 Design Doc。

  验证重点：特别关注更新章节中字面标识符的引用
  完整性（路径、端点、类型名、配置键）。
```

在继续之前先读取 `summary.status`：当其为 `blocked` 时，说明输入条件未满足且未验证任何内容——停止并向用户报告 `blockingReason`，不要把结果传给 document-reviewer，因为其空的 `discrepancies` 会被读成验证通过。

**将输出保存为**：`$CODE_VERIFICATION_OUTPUT`

调用 document-reviewer：
```
subagent_type: document-reviewer
description: "评审更新后的文档"
prompt: |
  评审以下更新后的文档。

  doc_type: [DesignDoc / PRD / ADRBatch]
  review_context: update
  target: [第 1 步得到的路径]（DesignDoc 或 PRD）
  targets: [[第 1 步得到的路径]]（仅限 ADRBatch）
  requirements_verbatim: [第 3 步所请求的变更，逐字照录]（仅限 Design Doc）
  confirmed_requirement_context: [第 3 步对变更的已确认理解]（仅限 Design Doc）
  verification_evidence: $CODE_VERIFICATION_OUTPUT（仅限 Design Doc，PRD/ADRBatch 时省略）

  重点关注：
  - 更新章节与文档其余部分的一致性
  - 变更未引入矛盾
  - 变更历史的完整性
```

**将输出保存为**：`$STEP_5_OUTPUT`

**依据评审结果**：
- `approved` → 进入第 6 步。
- `needs_revision` → 应用评审裁定，将完整的 `apply` issue 对象逐字传给第 2 步的更新智能体，随后在适用时重新运行验证，并带上 `prior_feedback` 重新评审。
- `rejected` → 当已确认的成果、目标状态需求与非目标无法全部同时成立时，应用上级“需求变更检测”；否则通过评审裁定解决技术冲突。

遵循评审裁定的收敛与上报条件。

### 第 6 步：一致性验证与最终批准 [停止]

对于 PRD 或 ADR，从已批准的文档评审直接进入下方的最终批准。

对于 Design Doc，调用 design-sync：
```
subagent_type: design-sync
description: "验证一致性"
prompt: |
  验证更新后的 Design Doc 与其他设计文档的一致性。

  更新后的文档：[第 1 步得到的路径]
```

**依据一致性结果**：
- 无冲突 → 将该结果纳入最终批准摘要
- 检测到冲突 → 以 design-sync 作为独立重跑验证者，应用评审裁定。将 `apply` 冲突返回第 4 步交由所属文档处理，修正后重新运行 design-sync，并将有依据的拒绝保留为已完成。

将评审后的更新内容，以及（对 Design Doc 而言）其一致性结果，提交给用户进行一次最终批准。这是本命令唯一的批准步骤。

## 错误处理

| 错误 | 行动 |
|-------|--------|
| 未找到目标文档 | 报告并结束（新建文档不在本命令范围内） |
| 子智能体更新失败 | 修复可发现的输入或路由错误，并在调用内容发生实质变化时重试；否则报告失败的证据 |
| 评审者返回 `rejected` | 当已确认的成果、目标状态需求与非目标无法全部同时成立时，应用上级“需求变更检测”；否则通过评审裁定解决技术冲突 |
| design-sync 检测到冲突 | 应用评审裁定，并将已采纳的冲突返回其所属的更新路径 |

## 完成标准

- [ ] 已识别目标文档
- [ ] 已从请求、文档或必要的用户回答中确定变更内容
- [ ] 已用相应智能体更新文档（update 模式）
- [ ] 已在 document-reviewer 之前执行 code-verifier（仅限 Design Doc）
- [ ] 已执行 document-reviewer 并处理其反馈
- [ ] 已执行 design-sync 进行一致性验证（仅限 Design Doc）
- [ ] 已就评审后的更新获得一次最终用户批准

## 输出示例
文档更新完成。
- 更新后的文档：docs/design/[document-name].md
- 批准状态：用户已批准

**职责边界**：本命令在文档获得批准时结束。工作计划及其之后的工作不在范围内。
