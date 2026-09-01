---
description: 以优化模式评估来实现用户的技能变更请求
---

**明确的用户指示**：用户明确指示并授权本流程中列出的每一次子智能体调用。当调用的前置条件满足时，执行每一次适用的调用。

**命令上下文**：用于理解技能文件变更请求，并通过 skill-creator（modification 模式）以质量保障的优化方式实现的工作流。

变更请求：$ARGUMENTS

## 执行流程

按顺序完成步骤 1-6。仅当当前步骤所述的输出、评审结果或批准条件被满足时才推进。在每一条适用的完成标准均被满足后完成。

### 步骤 1：理解请求

若未指定，使用 AskUserQuestion 澄清：
- 要修改哪个技能（例如 typescript-rules / coding-standards）
- 变更类型：新增标准 / 修改现有标准 / 删除标准
- 具体变更内容

目标文件识别：
- 已提供技能名称 → Read：`.claude/skills/{skill-name}/SKILL.md`（同时检查 `~/.claude/skills/`）
- 仅知道部分名称 → Glob：`.claude/skills/*{keyword}*/SKILL.md`、`~/.claude/skills/*{keyword}*/SKILL.md`
- 未知 → Glob：`.claude/skills/*/SKILL.md`、`~/.claude/skills/*/SKILL.md` 进行全量扫描 → 与用户确认选择

### 步骤 2：收集用户表述（可选）

收集团队在请求此类工作时实际使用的表述：
- 若变更影响 description 或范围，则为必需
- 对于细微的标准修改可以跳过

### 步骤 3：创建设计方案

呈现当前状态与拟议变更的前后对比：

```
【当前】
“错误要妥善处理”（含糊：未定义“妥善”的标准）

【方案】
“错误处理实现标准：
1. 以下情况必须使用 try-catch：外部 API 调用、文件 I/O、JSON.parse 等
2. 必需的错误日志项：error.name、error.stack、时间戳”

是否采用此设计？ (y/n)
```

**设计检查清单**：依据 skill-optimization 技能中定义的 10 条编辑原则评估方案。重点关注项：
- 上下文效率：每一句新增内容都必须对 LLM 的决策有贡献
- 可度量性：所有标准均使用 if-then 格式或具体阈值
- 去重：确认与其他技能文件没有重叠
- 范围边界：确认变更保持在该技能的职责范围内
- 工作量相称性：每个新增的产物、检查点或决策都要改变成果、必需的边界、真实的使用方，或必要的证据

### 步骤 4：通过 skill-creator 执行变更

以 modification 模式，通过 Agent 工具调用 skill-creator 智能体：

```
subagent_type: skill-creator
prompt: |
  Mode: modification
  Skill name: {目标技能名称}
  Existing content: {当前 SKILL.md 全文}
  Existing references: {当前引用文件的文件名和内容，若不存在则为 "None"}
  Modification request: {步骤 3 中已批准的变更内容}
  Current review: None
```

确认 skill-creator 返回的 changesSummary，核验变更与意图一致。

### 步骤 5：质量评审

通过 Agent 工具调用 skill-reviewer 智能体：
- 传入由 skill-creator 输出组装而成的、修改后的 SKILL.md 内容
- 传入所有修改过和保留的引用文件，包含文件名、行数和内容
- 评审模式：`modification`
- 重新评审时，在每一项 `user_decision` 都已解决之后，传入上一次评审结果以及 skill-creator 的 `reviewResolutions`

**评审结果处理：**
- 等级 A 或 B：推进到步骤 6
- 等级 C：重新调用 skill-creator，以前一次 creator 输出（含引用文件）作为修复基线，并将紧邻的上一次评审作为 `Current review`
- 将每一条发现项裁定为 `apply`、`decline` 或 `user_decision`；修订判为 apply 的事项，并对有依据支撑的 decline 重新评审
- 对于 `user_decision`，向用户确认，将答复作为决定成果或范围的依据回传给 skill-creator，并要求该事项在重新评审前确定为 `apply` 或有依据支撑的 `decline`
- 评审方只有在具备新的正确性或可验证性证据时，才可维持一项被 decline 的发现项；重复表达偏好不构成阻塞
- 在 2 轮修复/重新评审迭代后停止自动修复
- 评审方识别出变更范围之外的问题：作为独立的改进机会向用户报告

### 步骤 6：批准与实现

1. 向用户呈现前后对比并获得批准
2. 呈现 skill-reviewer 的等级和任何遗留的发现项
3. 呈现 skill-creator 的 changesSummary
4. 确认与用户意图一致：“这些变更是否达成了你最初的请求？”
5. 使用适当的工具应用变更
6. 用 git diff 验证
7. 若评审方标记了变更范围之外的问题，将其列为可选的后续事项
8. 建议执行 `/sync-skills`

## 完成标准

- [ ] 已识别目标技能并掌握当前状态
- [ ] 已依据 skill-optimization 编辑原则评审设计方案
- [ ] 已通过 skill-creator（modification 模式）执行变更
- [ ] skill-reviewer 返回等级 A 或 B
- [ ] 已获得用户批准
- [ ] 已应用变更并用 git diff 确认
- [ ] 已建议执行 /sync-skills

## 错误处理

| 错误 | 处理 |
|-------|--------|
| 未找到技能 | 显示可用技能列表 |
| 检测到大规模变更（占文件 50% 以上） | 建议分阶段实现 |
| 与其他技能存在职责重叠 | 确认职责边界并交由用户判断 |
| 2 轮修复/重新评审迭代后仍为等级 C | 呈现变更内容及遗留发现项，由用户判断 |
| 评审方识别出回归 | 撤销导致回归的具体变更，重新调用 skill-creator |

**范围**：理解用户的变更请求，并以质量评估配套的优化方式实现。变更执行委派给 skill-creator（modification 模式）。质量评估委派给 skill-reviewer 智能体。元数据同步通过 /sync-skills 联动。
