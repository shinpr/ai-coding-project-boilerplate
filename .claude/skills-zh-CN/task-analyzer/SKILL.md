---
name: task-analyzer
description: 对任务意图、变更风险和执行规模进行分类，并从项目技能索引中选择技能。用于开始工作、任务路由、范围估算或技能选择时。
---

# 任务分析器（Task Analyzer）

提供元认知层面的任务分析和技能选择指导。

## 技能索引

可用技能的元数据参见 **[skills-index.yaml](references/skills-index.yaml)**。

## 任务分析流程

### 1. 理解任务本质

识别超越表面工作的根本目的：

| 表面工作 | 根本目的 |
|--------------|---------------------|
| “修复这个 bug” | 问题解决、根因分析 |
| “实现这个功能” | 功能新增、价值交付 |
| “重构这段代码” | 质量改进、可维护性 |
| “更新这个文件” | 变更管理、一致性 |

**关键问题：**
- 我们真正要解决的问题是什么？
- 预期结果是什么？
- 如果只做表面处理，可能出什么问题？

### 2. 估算结构规模

根据预期结果和职责边界对决策负担进行分类。文件数量仅作为辅助依据。

| 规模 | 决策负担 |
|-------|-----------------|
| Small（小型） | 单一连贯成果，在单一职责边界内有明显的、有仓库依据支持的实现方式，且不存在会对后续工作产生长期影响的未决选择 |
| Medium（中型） | 单一连贯成果，涉及跨边界协调或包含可能对后续工作产生长期影响的选择 |
| Large（大型） | 多个各自独立产生价值的成果，需要各自独立的设计决策 |

跨层实现如果服务于单一连贯的结果，仍可归类为 Medium（中型）。若某个决策点同时通过 documentation-criteria 技能中的两项 ADR 过滤条件，则规模至少提升为 Medium（中型）。将确定结果和边界分类所依据的证据记录在 `scaleRationale` 中。

**规模影响技能优先级：**
- 规模越大 → 流程/文档类技能越重要
- 规模越小 → 实现类技能越聚焦

### 3. 识别任务类型

| 类型 | 特征 | 关键技能 |
|------|-----------------|------------|
| implementation（实现） | 新代码或用户可见的行为 | coding-standards, typescript-testing |
| fix（修复） | 缺陷或回归问题的解决 | coding-standards, typescript-testing |
| refactoring（重构） | 保持行为不变的结构改进 | coding-standards, implementation-approach |
| design（设计） | 架构或契约层面的决策 | documentation-criteria, implementation-approach |
| quality（质量） | 测试、评审、验证 | typescript-testing, integration-e2e-testing |
| documentation（文档） | PRD、ADR、设计文档、UI 规范、计划或指令类内容 | documentation-criteria |
| investigation（调查） | 不涉及实现的证据收集 | project-context 加上从索引中选出的领域技能 |
| migration（迁移） | 数据、schema、API、依赖项或运行时的转换 | implementation-approach, documentation-criteria |
| operations（运维） | 环境、部署或运行时操作 | technical-spec 加上从索引中选出的领域技能 |
| security（安全） | 安全设计或评审 | coding-standards 加上实现领域技能 |
| skill（技能） | 技能创建、提示词质量评审或技能元数据变更 | skill-optimization, llm-friendly-context |

当适用多种类型时，返回拥有所请求结果的主要类型，并将其余值列在 `secondaryTypes` 中。

### 4. 基于标签的技能匹配

从任务描述中提取相关标签，并与 skills-index.yaml 进行匹配：

```yaml
任务: "实现用户身份验证及其测试"
提取的标签: [implementation, testing, security]
匹配的技能:
  - coding-standards (implementation, security)
  - typescript-testing (testing)
  - typescript-rules (implementation)
```

### 5. 隐含关系

考虑隐藏的依赖关系：

| 任务涉及 | 也应包含 |
|---------------|--------------|
| 错误处理 | debugging, testing |
| 新功能 | design, implementation, documentation |
| 性能 | profiling, optimization, testing |
| 前端 | typescript-rules, typescript-testing |
| API/集成 | integration-e2e-testing |

## 输出格式

返回带有 skills-index.yaml 技能元数据的结构化分析：

```yaml
taskAnalysis:
  essence: <string>  # 识别出的根本目的
  type: <implementation|fix|refactoring|design|quality|documentation|investigation|migration|operations|security|skill>
  secondaryTypes: [<task-type>, ...]
  scale: <small|medium|large>
  estimatedFiles: <number or unknown>  # 仅作辅助依据
  scaleRationale:
    decidingAxis: <outcomes|responsibility-boundaries|durable-choice>
    evidence: <string>
  tags: [<string>, ...]  # 从任务描述中提取

selectedSkills:
  - skill: <skill-name>  # 来自 skills-index.yaml
    priority: <high|medium|low>
    reason: <string>  # 选择该技能的原因
    # 透传来自 skills-index.yaml 的元数据
    tags: [...]
    typical-use: <string>
    size: <small|medium|large>
    sections: [...]  # yaml 中的所有章节，不做过滤
```

**说明**：章节选择（挑选哪些章节相关）在实际读取 SKILL.md 文件之后单独进行。

## 流程检查点

1. **意图检查点**：当 `essence`、主要 `type` 及所有 `secondaryTypes` 均已记录时，进入规模估算。若所请求的结果存在歧义，记录所需的确切结果决策。
2. **规模检查点**：当结果和职责边界方面的证据足以支撑结构规模判断，且 `scaleRationale` 已指明决定性维度时，进入技能匹配。
3. **选择检查点**：当每个被选中的技能都存在于 `skills-index.yaml` 中、都有与任务相关联的理由、且其元数据是原样复制而非臆造时，完成最终确定。

当某个未知因素可能改变成果边界、ADR 判定或所需工作流时，请求所需的确切仓库证据或用户决策。仅文件数量未知本身不阻塞结构规模判断。

## 技能选择优先级

1. **必需（Essential）** - 与任务类型直接相关
2. **质量（Quality）** - 测试与质量保证
3. **流程（Process）** - 工作流与文档
4. **补充（Supplementary）** - 与任务直接相关的其他约束或依据

## 元认知问题设计

只生成那些答案会改变意图分类、规模、所选技能、硬性约束或验证方式的问题。若仓库证据已经解决了这些决策，则不返回任何问题。每个问题都要记录其所控制的决策。

| 任务类型 | 问题焦点 |
|-----------|-----------------|
| Implementation | 设计有效性、边界情况、性能 |
| Fix | 根因（5 Whys）、影响范围、回归测试 |
| Refactoring | 当前问题、目标状态、分阶段计划 |
| Design | 需求明确性、权衡取舍 |
| Documentation | 受众、权威依据、审批/使用方契约 |
| Investigation | 待解决的论断、证据边界、停止条件 |
| Migration | 兼容窗口期、数据/契约转换、回滚 |
| Operations | 目标环境、授权边界、恢复证据 |
| Security | 信任边界、受保护资产、威胁来源、风险接受决策方 |
| Skill | 触发意图、独立使用场景、输出使用方 |

## 警示模式

检测并标记以下模式：

| 模式 | 警示 | 缓解措施 |
|---------|---------|------------|
| 一个步骤包含多个可独立验证的结果 | 转换与回滚风险 | 在可观测的验证边界处拆分 |
| 行为变更没有测试或指定的可运行验证方式 | 缺少回归依据 | 添加能观测到变更契约的最低成本检查 |
| 提议的修复与故障之间没有已观测到的因果关联 | 根因仍停留在推测层面 | 在选择修复方案前记录复现证据和第一个因果边界 |
| Medium/Large 实现缺少其规模所要求的规划产物 | 缺少范围与依赖契约 | 在实现路由之前先创建所需的产物 |
