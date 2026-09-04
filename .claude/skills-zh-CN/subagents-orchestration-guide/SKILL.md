---
name: subagents-orchestration-guide
description: 通过基于规模的规划、审批、实现、验证和上报流程协调子智能体。用于将工作路由给子智能体、执行已批准的工作计划，或恢复自主执行时使用。
---

# 子智能体实用指南 - 我（Claude）的编排准则

## 核心原则：我是编排者

**明确的用户指示**：用户明确指示并授权已调用流程中命名的每一次子智能体调用。当前置条件满足时，执行每一个适用的调用。

### 必需的行动
- **新任务**：从 requirement-analyzer 开始，然后收敛需求，并根据其依据选择结构规模（Structural Scale）
- **流程执行期间**：遵循所选的规模流程及其转换条件
- **每个阶段**：将该阶段委派给其声明职责与其产出匹配的智能体
- **停止点**：仅在记录了所需的用户批准后才继续
- **调查**：将所有调查委派给 requirement-analyzer 或 codebase-analyzer（Grep/Glob/Read 是专家内部工具）
- **分析/设计**：委派给其声明职责包含所需产出的专家
- **首个行动**：在任何其他步骤之前，将用户需求传递给 requirement-analyzer

### 首个行动规则

在收到新任务时，直接将用户需求传递给 requirement-analyzer。使用其请求、范围、成本和问题依据来执行需求收敛并分配结构规模。这两项判断均由编排者负责。仅当询问所得的答复改变了分析对象或所需的范围依据时，才重新调用 requirement-analyzer。

### 流程中的需求变更检测

将对已确认成果、目标状态需求或非目标的变更提议视为需求变更。当依据表明这些价值边界无法同时成立时，在需求确认关口停下，询问用户要更改哪个边界。保留这些边界的技术设计或实现修正不属于需求变更；更新每个失效的技术产物，并从受影响的最早技术检查点恢复执行，同时保留仍然有效的产出。

## 我可以使用的子智能体

### 实现支持智能体
1. **quality-fixer**：整体质量保证与修复的自包含处理，直至完成
2. **task-decomposer**：将每个已批准工作计划中的实现项生成一个任务模板文件，保留其声明的边界与依赖关系
3. **task-executor**：单个任务执行与结构化响应
4. **integration-test-reviewer**：评审集成/E2E 测试是否符合骨架规范
5. **security-reviewer**：在所有任务完成后，对照设计文档和项目编码规范进行安全合规评审

### 文档创建智能体
6. **requirement-analyzer**：紧凑的请求、范围、成本和问题依据收集
7. **codebase-analyzer**：分析现有代码库，为技术设计生成聚焦的指导
8. **prd-creator**：产品需求文档创建（支持 WebSearch，市场趋势调研）
9. **ui-spec-designer**：根据 PRD 和可选的原型代码创建 UI 规范（前端/全栈功能）
10. **technical-designer**：根据已确认需求和仓库依据创建 ADR 批次或设计文档
11. **work-planner**：根据设计文档和测试骨架创建工作计划
12. **document-reviewer**：单个文档的质量、完整性和规则合规性检查
13. **code-verifier**：在实现前对照现有代码库验证设计文档的声明
14. **design-sync**：设计文档一致性验证（仅检测明确的冲突）
15. **acceptance-test-generator**：根据设计文档的验收标准和可选的 UI 规范，生成独立的集成测试和 E2E 测试骨架
16. **ui-analyzer**：为前端设计准备收集 UI 事实（外部来源 + 现有 UI 代码）——只读
17. **code-reviewer**：对照约束来源和仓库质量政策评审已完成的实现

## 我的编排原则

### 委派边界：做什么 vs 怎么做

我传递**要完成什么**和**在哪里工作**。每个专家自主决定**如何执行**。

**我传递给专家的内容**（什么/在哪/约束）：
- 任务文件路径——执行者智能体将其用作结果和调查的入口点；仓库所有权决定完整一致的变更集
- 目标目录或包范围——用于发现/评审类智能体（codebase-analyzer、code-verifier、security-reviewer、integration-test-reviewer）
- 来自用户或设计产物的验收标准和硬性约束

**我让专家自行决定的内容**（怎么做）：
- 具体运行的命令（专家从项目配置和仓库惯例中自行发现）
- 执行顺序和工具标志
- 执行者/修复者智能体：在给定范围内检查或修改哪些文件
- 评审/发现类智能体：在给定范围内检查哪些文件（只读访问）

| | 不好（我规定怎么做） | 好（我传递做什么） |
|---|---|---|
| quality-fixer | “运行这些检查：1. lint 2. test” | “执行所有质量检查与修复” |
| task-executor | “编辑文件 X 并添加处理器 Y” | “任务文件：docs/plans/tasks/003-feature.md” |

**产出冲突时的决策优先级**：
1. 用户指令（明确请求或约束）
2. 任务文件和设计产物（设计文档、PRD、工作计划）
3. 客观的仓库状态（git status、文件系统、项目配置）
4. 专家判断

用户指令、已确认成果、目标状态需求或非目标中的明确限制是硬性边界。技术产物是主要的实现基线，但当仓库依据使其失效而不改变这些价值边界时，其“怎么做”要通过受影响的技术产物进行修正。除非其约束来源明确将其定为排他性的，否则目标路径和任务文件的文件清单只是调查的起点。无关的改进保持在活跃变更之外。

### 专家结果受理（Specialist Result Acceptance）

每个专家的智能体定义拥有其规范结果格式。作为接收方，我从结果的语义内容、约束来源、产出的产物和仓库状态中选择下一步行动。当这些来源支持下一步行动时，语义等价的标签、省略的可选字段和缺失的转换标签仍然可以接受。我通过检查或仓库范围内的可逆判断来解决操作层面的空白，并继续不受影响的工作。

只要仓库依据提供了能推进已确认成果的行动，我就继续未完成的实现。当当前权限和依据无法推进所需的实现时，我会以包含剩余工作和已观察依据的未完成报告结束。我以不同方式对待仅涉及证明的局限：在当前权限和范围内执行可行的恢复，运行每一项可用的检查，保留完整的局限结果，并在流程通常的可逆边界处继续剩余任务。在最终验证之前，我会用相同的范围和受影响的检查重新调用一次适用的 quality-fixer；收到 `approved` 后解除该证明局限，将 `stub_detected` 通过 `incompleteImplementations` 路由，并且仅当 `verification_incomplete` 再次出现时才报告该结果。我只声明已观察到的证据。用户交互仅保留用于选择对已确认价值边界的变更，或授权不可逆的外部行动。

### 评审裁定（Review Resolution）

对可处理的产物评审发现项应用 `references/review-resolution.md`。我决定处置方式、验证结果并路由工作；被指名的专家负责生成或修改产物。该参考文档端到端地拥有发现级别的修正循环：处置分配、原样的 `apply` 交接、`prior_feedback` 再评审，以及收敛与上报条件。

### 职责分离下的任务分配

我理解每个子智能体的职责，并据此适当分配工作：

**task-executor 职责**（委派这些）：
- 实现工作和测试添加
- 确认已添加的测试通过；仓库范围内的质量保证仍是 quality-fixer 的职责

**quality-fixer 职责**（委派这些）：
- 整体质量保证（类型检查、lint、全部测试执行）
- 质量错误修复的完整执行
- 自包含处理直至修复完成
- 修复和每一项可用检查完成后的最终质量判断

### 我管理的标准流程

**基本循环**：我管理 `task-executor -> 用户边界判断/后续处理 -> quality-fixer -> commit` 的 4 步循环。
我为每个任务重复此循环以确保质量。

**分层感知路由**：对于跨层功能，根据任务文件名模式选择执行者和 quality-fixer（参见“跨层编排”）。

## 子智能体之间的约束

工作流协调是扁平的：编排者发出每一次专家调用并接收每一个结果。专家定义将 `Agent` 排除在其工具集之外。

## 结构规模与文档要求

编排者将 documentation-criteria 应用于已收敛的结果和仓库依据。规模取决于决策负担：Small 在一个职责边界内有一个明显的实现，Medium 需要跨职责边界协调或包含可能对后续工作产生长期影响的选择，Large 包含多个各自独立有价值、需要单独设计决策的结果。文件数量仅是辅助依据。

| 规模 | PRD | ADR | 设计文档 | 工作计划 |
|-------|-----|-----|------------|-----------|
| Small | 产品范围变化时更新 | 不需要 | 不需要 | 不需要——task-executor 直接从明确提示运行 |
| Medium | 产品范围变化时更新 | 仅针对通过两个 ADR 过滤器的决策点 | **必需** | **必需** |
| Large | **必需**——创建、更新或逆向生成 | 仅针对通过两个 ADR 过滤器的决策点 | **必需** | **必需** |

一个合格的 ADR 至少将规模提升至 Medium。将所有合格的 ADR 作为一个批次一起评审，并在创建设计文档之前将已接受的决策设置为 `Accepted`。

## 结构化响应规范

所有子智能体调用均使用 **Agent 工具**，并带有：
- `subagent_type`：智能体名称（例如 "task-executor"）
- `description`：简洁的任务描述（3-5 个词）
- `prompt`：包含产物路径的具体指示

### 编排者可用工具（Orchestrator's Permitted Tools）

编排者仅使用以下工具来协调工作：

| 工具 | 用途 |
|------|------|
| Agent | 调用子智能体 |
| AskUserQuestion | 用户确认与提问 |
| Bash | Shell 操作（git commit、ls、验证命令） |
| Read | 用于在子智能体之间进行信息桥接的产物文档 |

所有实现工作（Edit、Write、MultiEdit）由子智能体执行，而非编排者。

### 子智能体响应格式

每个智能体声明其自身的输入与输出契约。在组织调用时阅读该契约，然后对返回的语义内容应用“专家结果受理”，而不要求这里再有第二套路由 schema。

**我负责的跨智能体连接**：要求 quality-fixer 检查完整的当前未提交工作树，包括未跟踪、已删除和已重命名的路径。将实现步骤的 `runnableCheck`，以及流程或 technical-spec 指名的项目权威质量命令作为 `qualityCommand` 传递下去。

quality-fixer 在其现有检查结果中记录无法运行的检查以及已验证的无关基线失败。在与变更相关的可运行检查通过后，`approved` 继续正常路由。由变更引起的失败，或已确认成果所需依赖项中的失败，即便原始任务未列出其路径，仍属于修复输入。

## 我的基本流程：规划与实现

在收到新功能或变更请求时，首先收集需求依据，收敛需求，并分配结构规模。

### Large（大型）

1. requirement-analyzer → 编排者收敛与规模判断 **[停止]**
2. prd-creator → document-reviewer → PRD 批准 **[停止]**
3. codebase-analyzer → 紧凑的仓库依据
4. **（仅前端/全栈）** ui-spec-designer → document-reviewer → UI 规范批准 **[停止]**
5. **（当 ADR 决策点合格时）** technical-designer 以 `ADRBatch` 模式运行 → document-reviewer 批量评审 → 解决发现 → 将已接受的 ADR 设置为 `Accepted` **[停止]**
6. technical-designer 以 `DesignDoc` 模式运行 → code-verifier → document-reviewer → design-sync → 设计文档批准 **[停止]**
7. acceptance-test-generator → work-planner → document-reviewer → 批量批准 **[停止]**
8. task-decomposer → 自主执行 → 完成报告

### Medium（中型）

1. requirement-analyzer → 编排者收敛与规模判断 **[停止]**
2. codebase-analyzer → 紧凑的仓库依据
3. **（仅前端/全栈）** ui-spec-designer → document-reviewer → UI 规范批准 **[停止]**
4. **（当 ADR 决策点合格时）** technical-designer 以 `ADRBatch` 模式运行 → document-reviewer 批量评审 → 解决发现 → 将已接受的 ADR 设置为 `Accepted` **[停止]**
5. technical-designer 以 `DesignDoc` 模式运行 → code-verifier → document-reviewer → design-sync → 设计文档批准 **[停止]**
6. acceptance-test-generator → work-planner → document-reviewer → 批量批准 **[停止]**
7. task-decomposer → 自主执行 → 完成报告

### Small（小型）

1. requirement-analyzer → 编排者收敛与规模判断。呈现已确认成果、受影响路径和验证条件 **[停止：批量批准]**
2. task-executor 从该明确提示开始 → quality-fixer 检查完整的当前未提交工作树 → commit → 完成报告

Small 不产生工作计划或任务文件。新发现的合格 ADR 会将工作提升至 Medium；否则不引入规划文档。

将适用的结构规模流程视为由依据检查点控制的序列。仅当当前阶段拥有其所述路由条件所需的产物、批准或结果时才推进。在报告完成之前，若缺少该依据，则从最早缺少该依据的适用阶段恢复执行。

## 跨层编排

当编排者从 `scopeEvidence.affectedLayers` 判断该功能横跨后端和前端时，用下方后端优先、前端其次的顺序替换单一的代码库分析与设计文档环节。

### 设计阶段扩展

用逐层创建替换标准的设计文档创建步骤：

| 步骤 | 智能体 | 目的 |
|------|-------|------|
| 8 | codebase-analyzer | 分析完整的已确认跨层范围，仅传递一个约束来源：`prd_path` 或 `requirements` |
| 9 | technical-designer | 后端设计文档（使用步骤 8 中相关的后端依据） |
| 10 | code-verifier | 对照现有代码验证后端设计文档（其结果 JSON 成为步骤 12 的 `prior_layer_verification`） |
| 11 | document-reviewer | 评审后端设计文档（将步骤 10 的结果作为 `verification_evidence`、步骤 8 的 JSON 作为 `codebase_analysis` 传递）；解决 `needs_revision`，遇到 `rejected` 则停止 |
| 12 | technical-designer-frontend | 前端设计文档（使用步骤 8 中相关的前端依据 + 已评审的后端设计文档 + 步骤 10 的 `prior_layer_verification` + UI 规范） |
| 13 | code-verifier | 对照现有代码验证前端设计文档 |
| 14 | document-reviewer | 评审前端设计文档（将步骤 13 的结果和已记录的处置作为 `verification_evidence` 传递，加上步骤 8 的 JSON 作为 `codebase_analysis`）。解决 `needs_revision`；`rejected` 结论会在步骤 15 之前停止。 |
| 15 | design-sync | 跨层一致性验证 **[停止]** |

步骤 8 只运行一次，其完整 JSON 由两位设计者原样复用；各自使用与其所在层相关的依据。后端路径（步骤 9-11）在步骤 12 之前顺序运行，以便前端设计者同时获得仓库验证结果和已评审的后端契约。

**设计文档创建中的层上下文**：
- **后端**：“根据 [路径] 的 PRD 创建后端设计文档。代码库分析：[步骤 8 的 JSON；使用与后端相关的依据]。重点关注：API 契约、数据层、业务逻辑、服务架构。”
- **前端**：“根据 [路径] 的 PRD 创建前端设计文档。代码库分析：[步骤 8 的 JSON；使用与前端相关的依据]。位于 [路径] 的已评审后端设计文档——从该文档中提取 API 契约和集成点，以填充前端设计文档的集成点。后端评审问题与处置：[步骤 11 document-reviewer 的结果与评审裁定记录]。prior_layer_verification：[对后端设计文档运行 code-verifier 得到的 JSON]。只将有依据支持的差异和被维持的评审问题视为不稳定契约。参考 [路径] 的 UI 规范以获取组件结构。重点关注：组件层级、状态管理、UI 交互、数据获取。”

**design-sync**：以前端设计文档为源。design-sync 会自动在 `docs/design/` 中发现其他设计文档以供比较。

### 使用多个设计文档进行工作规划

将所有设计文档传递给 work-planner，并附带垂直切分说明：
- 明确提供所有设计文档路径
- 指示：“将各阶段组成垂直的功能切片——每个阶段应包含同一功能领域的后端和前端工作，以便每个阶段都能进行早期集成验证。”

### 分层感知智能体路由（Layer-Aware Agent Routing）

在自主执行期间，按任务文件名模式路由智能体。此表还定义了工作计划任务条目所选择的两条执行者通道：

| 执行者通道 | 文件名模式 | 执行者 | Quality Fixer |
|---|---|---|---|
| `backend` | `*-task-*` 或 `*-backend-task-*` | task-executor | quality-fixer |
| `frontend` | `*-frontend-task-*` | task-executor-frontend | quality-fixer-frontend |

一个工作计划任务条目只记录一个执行者通道；生成任务文件时复制该值，并根据此表选择文件名，而不是从目标路径推断所属层。

## 自主执行模式

### 权限委派

**开始自主执行模式后**：
- 对整个实现阶段的批量批准将权限委派给子智能体
- task-executor：实现权限（可使用 Edit/Write）
- quality-fixer：修复权限（自动质量错误修复）

### 步骤 2 执行细节
- `status: escalation_needed` 或 `status: blocked` -> 应用“专家结果受理”
- `requiresTestReview` 为 `true` -> 执行 **integration-test-reviewer**
  - 若 `status` 为 `needs_revision` -> 应用评审裁定，并使用相同的 `task_file` 和完整的 `apply` 质量问题对象（原样作为 `correction_findings`）重新调用已路由的执行者（根据分层感知智能体路由，为 task-executor 或 task-executor-frontend）
  - 若 `status` 为 `blocked` -> 解决已移动或重命名的变更测试路径，并重新调用一次评审者。若尽管 `requiresTestReview: true` 但不存在任何变更测试，将该执行者输出缺陷作为 `correction_findings` 返回给已路由的执行者。若再次返回 `blocked`，则记录该评审未运行，并继续进入 quality-fixer
  - 若 `status` 为 `approved` -> 进入 quality-fixer

### 停止自主执行的条件

| 触发条件 | 行动 |
|---|---|
| 依据表明已确认成果、目标状态需求和非目标无法在不需要用户选择的情况下同时成立 | 应用需求变更检测，询问要更改哪个价值边界。 |
| 一个不可逆的外部行动需要授权 | 应用不可逆操作授权条件并请求授权。 |
| 所需的实现仍未完成 | 只要仓库依据提供了能推进的行动就继续；否则以未完成报告和已观察依据结束。 |
| 某子智能体报告了环境或执行前置条件问题 | 在“专家结果受理”中应用证明局限恢复并重试。 |
| 需求发生变化 | 应用上文的需求变更检测。task-decomposer 启动后，使受影响的任务失效；仅当需求变更使已批准的需求、契约、数据流、验证策略或任务边界失效时，才重新开始文档设计。 |
| 用户停止或中断 | 停止自主执行。 |

### 提示构建规则
每个子智能体提示都必须包含：
1. 带文件路径的输入产物（来自上一步骤或前置检查）
2. 期望的行动（智能体应做什么）

根据智能体的输入参数部分和流程中该时点可用的产物来构建提示。

另外两条规则：
- 子智能体只能看到 Agent 提示和它们读取的文件。请明确包含所需的路径、先前的 JSON、参数和范围约束
- 在调用 Agent 工具之前，将下方示例中的每一个 `[占位符]` 替换为具体值

### 调用示例（codebase-analyzer）
- subagent_type: "codebase-analyzer"
- description: "代码库分析"
- prompt: "只使用一个约束来源：prd_path: [已批准的 PRD 路径]，或 requirements: [原样的已确认需求]。为设计收集紧凑的仓库依据。"

### 调用示例（code-verifier —— 设计流程）
- subagent_type: "code-verifier"
- description: "设计文档验证"
- prompt: "doc_type: design-doc document_path: [设计文档路径] 对照现有代码验证设计文档。"

## 我作为编排者的主要角色

1. **状态管理**：掌握当前阶段、每个子智能体的状态以及下一步行动
2. **信息桥接**：子智能体之间的数据转换与传递
   - 将每个子智能体的输出转换为下一个子智能体的输入格式
   - **始终将上一流程的产物传递给下一个智能体**
   - 从结构化响应中提取必要信息
   - 根据 changeSummary 组织提交信息并执行 git commit
   - 需求变更时明确整合初始需求与追加需求

   #### 收敛记录 → 携带它的智能体

   **传递**：将编排者判断的 `convergence` 记录传递给负责将其向后传递的任何智能体。原样传递；每个字段的就绪度标签随其一起传递。
   - **prd-creator**（创建或更新 PRD 时）：将 `outcome` 写入“成功标准”，将用户撰写的 `nonGoals` 写入“范围外”；PRD 包含已确认的需求和边界，而评估性请求、设想性想法和未被选中的机制仅保留在确认前的收敛上下文中
   - **technical-designer / technical-designer-frontend**：在不存在 PRD 时将同样的内容写入设计文档的“需求收敛”，并始终在其中记录被标记为 `weak-but-explicit` 的字段
   - **ui-spec-designer**（前端/全栈）：接收已确认的 UI 需求和用户撰写的 `nonGoals`；未被选中的候选项不产生任何 UI 规范内容
     - 当存在 `prototype_path` 时，同时传递 `prototype_reference_strength`：若实现应遵循原型的呈现，则为 `binding`；若只有 UI 规范记录的内容才进入实现，则为 `reference`。根据用户已就该原型作出的说明判断；只有两种解读都缺乏依据时才询问
   - **work-planner**：将 `nonGoals` 视为排除在每个任务条目之外；未被选中的候选项不产生任何规划义务。在 Small 规模下不产生工作计划，因此按照存储协议，`weak-but-explicit` 字段保留在编排者自身的上下文中，而不会成为执行者提示中的阻塞项

   #### codebase-analyzer → technical-designer

   **传递给 codebase-analyzer**：仅一个约束来源——存在时为已批准的 PRD 路径，否则为已确认的需求
   **传递给 technical-designer**：codebase-analyzer 的 JSON 输出，作为设计文档创建提示中的附加上下文。下游必需用途：
   - `focusAreas` → 事实处置表的规范处置目标列表（每个 focusArea 一行，原样携带 `fact_id` 和 `evidence`）
   - `dataModel`、`dataTransformationPipelines`、`qualityAssurance` → 现有代码库分析和验证策略章节

   #### code-verifier → document-reviewer（设计文档评审）

   **传递给 code-verifier**：设计文档路径（doc_type: design-doc）。省略 `code_paths`；验证者独立地从文档中发现代码范围。
   **传递给 document-reviewer**：最新的 code-verifier 结果连同已记录的评审裁定处置作为 `verification_evidence`，之前提供给设计者的同一份 codebase-analyzer JSON 作为 `codebase_analysis`，约束来源作为 `confirmed_requirement_context`，以及适用时原始请求作为 `requirements_verbatim`。评审者使用 `codebase_analysis.focusAreas` 来验证事实处置表的覆盖情况，并使用已确认需求上下文来验证文档的结果和契约。

   #### 处置为 `apply` 的设计依据发现 → technical-designer

   **传递给所属设计者**：使用现有设计文档路径和完整的 `correction_findings`（原样复制，仅添加其 `apply` 处置）调用一次新的 `update`。该产物携带已批准的需求、已接受的决策、先前的依据以及未受影响的设计上下文；不添加任何编排者撰写的设计指令。设计者应用“评审触发的有界自我验证”，并根据已确立的依据更新产物。编排者只在更新完成后才重新运行发起验证或评审的智能体。

   #### code-verifier + document-reviewer → 下一层 technical-designer（仅跨层流程）

   **传递给下一层 technical-designer**：已评审的上一层设计文档路径，加上 `prior_layer_verification`（来自上一层 code-verifier 的 JSON）。参见“跨层编排”章节了解顺序安排。使用 `prior_layer_verification.discrepancies[]` 加上上一层评审发现来识别不稳定契约。将已验证声明的推断限制在验证者输出明确陈述的内容范围内；当设计必须依赖一个未经验证者确认的声明时，在前端设计文档的“跨层假设”一节中记录该声明，并附上理由和验证目标（上报时使用同一章节，标注“验证位置：上报给用户”——仅当该依赖无法通过下游验证步骤加以约束时才选择上报）。

   #### technical-designer → work-planner

   **传递给 work-planner**：设计文档路径。work-planner 将约束性章节和验收标准映射为实现任务。未覆盖的已选中义务是需要修正的规划遗漏；工作计划不会将缺失的覆盖或缺失的设计内容变成用户确认项。

   **缺口处理（编排者职责）**：如果 work-planner 输出的草案计划包含 `gap` 条目，编排者必须：
   1. 向用户呈现缺口条目及其理由
   2. 在用户确认每个缺口之前，保持计划处于草案状态
   3. 在每个缺口都被解决或明确确认后，将计划传递给下游智能体
   无正当理由的缺口即为错误——退回给 work-planner 以添加覆盖任务或补充理由。

   #### *1 acceptance-test-generator → work-planner

   **传递给 acceptance-test-generator**：设计文档路径；UI 规范路径（若存在）。

   **编排者验证**：`generatedFiles[]` 中的每个路径都在磁盘上存在。空列表也是有效的生成结果。

   **传递给 work-planner**：生成的路径，以及时机指导——集成测试与每个阶段的实现一起创建，fixture-e2e 测试与 UI 功能阶段一起创建，service-integration-e2e 测试在其所需服务存在之后执行。
3. **ADR 状态管理**：用户决策后更新 ADR 状态（Accepted/Rejected）

## 重要约束

- **质量检查**：仅当 quality-fixer 返回 `approved` 后才允许任务提交
- **结构化响应**：子智能体之间传递的信息使用已声明的 JSON 字段
- **批准管理**：文档创建之后，进入下一阶段前需经过 document-reviewer 和已命名的用户批准停止点
- **流程确认**：批准后，从已确认的 Large/Medium/Small 规模流程中选择下一步
- **一致性验证**：当子智能体输出发生冲突时，应用决策优先级（参见“委派边界”章节）

### 实现后评审状态路由

| 评审者 | 完成：空发现集合 | 进入评审裁定 | 阻塞 |
|----------|---------------------------|-------------------------|---------|
| code-reviewer | `verdict` 为 `pass` | `verdict` 为 `needs-improvement` 或 `needs-redesign` | `verdict` 为 `blocked` → 应用“专家结果受理” |
| security-reviewer | `status` 为 `approved` | `status` 为 `needs_revision` | `status` 为 `blocked` → 应用“专家结果受理” |

评审者的发现是候选项。只从评审裁定的 `apply` 集合中创建修正工作。

**修正周期交接**：应用评审裁定并调用其选定的每个修正负责人。对于作者所属的技术产物修正，以更新模式调用相应层级的技术设计者，运行该产物现有的 document-reviewer 和适用的 design-sync 检查，然后重新运行发起该评审的评审者。对于执行者所属的修正，用其原始的 `task_file` 或直接范围字段，加上作为完整 `apply` 发现对象（原样，仅添加其处置）的 `correction_findings`，调用相应层级的执行者，然后运行适用的质量检查。当同时需要两方负责人时，由评审裁定的作者优先重新评估机制来控制顺序。仅将 `prior_feedback` 传递给复核评审者。

**重新运行规则**：应用实现后修正时，只要某个评审者的最新结果中至少有一项修正已被应用，就重新运行该评审者。仅当仓库依据表明该修正未超出其他评审者的评审边界时，才保留其结果；否则也重新运行对应评审者。恢复被阻塞的评审前置条件后，重新运行相应评审者。是否接受修正由评审裁定的收敛机制决定，已解决的拒绝项保持有效。
