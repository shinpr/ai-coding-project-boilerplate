# 快速开始

本指南将带你完成新建或现有 TypeScript 项目的初始配置，并首次运行 `/implement`。

## 创建或更新项目

创建新项目：

```bash
npx create-ai-project my-project
cd my-project
npm install
```

对于现有项目，请在项目根目录运行更新程序：

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
```

更新程序会刷新受管理的 Claude 命令、智能体、技能和规则，不会替换源代码或包配置。

## 记录项目的前置信息

在项目中启动 Claude Code：

```bash
claude
```

然后运行：

```text
/project-inject
```

通过交互式问答，仅记录会影响智能体决策的仓库特有信息，例如：

- 项目目标和领域约束；
- 与仓库默认设置不同的目录约定；
- 当前开发阶段；
- schema、API 契约或基础设施配置等外部依据的访问方式。

结果会存储在 `.claude/skills/project-context/SKILL.md` 中，并在后续会话中加载。上述前置信息发生变化时，请重新运行 `/project-inject`。

## 实现一次变更

```text
/implement 为 API 添加速率限制
```

工作流会：

1. 确认目标、需求、排除项和需要决策的事项；
2. 在选择实现方式前检查仓库；
3. 当一个完整的小型目标只有一条明确路径时直接实现；
4. 对中型或大型工作创建并获得必要设计文档和工作计划的批准，仅在确实需要相应决策时才添加 PRD、UI 规范或 ADR；
5. 按已批准的任务边界逐项实现，运行仓库中适用的检查，并提交已批准的变更；
6. 根据设计文档验证已完成的中型或大型实现，并报告所有无法运行的检查。

当工作流需要产品决策、持久文档的批准、用户持有的权限或不可逆操作时，它会请求用户输入。仓库内部的实现细节由智能体自行决定。

## 继续已规划的工作

使用 `/implement` 继续端到端工作流；如果已经存在批准的工作计划或已生成的任务文件，则使用 `/build`：

```text
/implement 继续当前实现
/build docs/plans/20260809-feature-example.md
```

`/build` 会解析所选计划的任务文件，逐个完成任务，并在删除已消费的任务文件后保留工作计划。

## 后续参考

- [使用场景和命令](./use-cases.md) — 选择命令并了解其职责边界
- [技能编辑指南](./skills-editing-guide.md) — 添加项目知识或可复用的决策标准
- [README](../../../README.zh-CN.md) — 查看工作流概览和更新说明
