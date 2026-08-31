# Task: [任务名称]

Metadata:
- Source Work Plan Task: [P1-T1 — 本文件所对应的工作计划任务的稳定 ID]
- Dependencies: none | [工作计划任务 ID（docs/plans/tasks/{plan-name}-task-NN.md）-> Deliverable: 路径，当前置任务产出产物时填写]
- Executor lane: backend | frontend
- Rollback boundary: [从工作计划任务中原样复制]

依赖关系以前置任务的稳定工作计划任务 ID 及承载该任务的任务文件来命名，因为文件的 `-task-{NN}` 序号遵循该任务在工作计划中的位置，而非其 ID。

## Implementation Outcome

[完成来源工作计划任务的仓库变更。]

## Governing Sources

每一条直接构成约束的引用，均从工作计划中原样保留，以便执行者在源头阅读权威契约。

- [设计文档路径（§ 章节）；验收标准 ID]
- [UI 规范或 ADR 路径（§ 章节），当其直接构成约束时]

## Target Files

- [ ] [实现文件或所属目录]
- [ ] [测试文件，当结果需要测试时]

## Investigation Targets

实现前需阅读的最小代表性集合，每项为一个文件路径，可附带可选的搜索提示：

- [约束文档章节 — 例如 docs/design/payment.md（§ Payment Flow）]
- [现有实现 — 例如 src/orders/checkout（processOrder 函数）]
- [相邻的代表性测试]

## Investigation Notes

- [仅记录会影响实现、范围或验证的事实。]

## Implementation Steps

1. 阅读 Investigation Targets，并记录相关的仓库事实。
2. 添加或更新所引用验证方法所需的聚焦测试。
3. 实现完成该成果所需的最小仓库变更。
4. 在聚焦检查保持通过的前提下，于同一成果范围内进行重构。
5. 运行下方的操作验证方法。

## Operation Verification Methods

- **验证方法**：[构成约束的验证方法或仓库命令]
- **成功标准**：[与所引用验收标准相关联的可观测结果]
- **验证级别**：[L1：作为终端用户功能的功能性操作 / L2：已添加并通过新测试 / L3：代码可构建且无错误 — 依据 implementation-approach 技能]

## Verification Focus

（仅当工作计划提供此内容时包含本节。）

- **主要失败点**：[从工作计划中原样复制]
- **可观测检查**：[从工作计划中原样复制]

## Completion Criteria

- [ ] 所引用的实现结果已完成
- [ ] 所引用的验收标准已满足
- [ ] 所需的聚焦测试已通过
- [ ] Operation Verification 已成功
- [ ] （当存在 Verification Focus 时）可观测检查能够检测到主要失败点

## Notes

- [仅记录与执行相关的信息]
