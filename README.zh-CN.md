# AI 编程项目模板：Claude Code 入门套件

*其他语言版本：[English](README.md) | [日本語](README.ja.md)*

[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.15%2B-green?logo=node.js)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Optimized-purple)](https://claude.ai/code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

这个 TypeScript 入门套件让 Claude Code 从需求确认开始，完成设计、实现和验证。即使途中发现其他问题，工作流也会根据约定的目标判断哪些工作需要做。

开发规则保存在仓库中。团队可以共享规则、根据项目调整，并在后续 Claude Code 会话中继续使用同一套配置。

## 什么时候适合使用工作流

如果需要在实现前明确范围、保留设计决策，或将工作交给另一个会话或贡献者，可以使用这些工作流。你批准实现范围后，Claude 会自行处理实现细节，并继续完成检查、提交和评审。需要改变约定的目标或本次不做的内容，或者不可逆的外部操作需要授权时，它会交给你决定。

设计和评审需要时间。范围明确的小修正可以从 `/task` 开始。对于一次性实验，也可以直接向 Claude 提出请求。

## 快速开始

### 创建新项目

```bash
npx create-ai-project my-project --lang=zh-CN
cd my-project
pnpm install
claude
```

如果想使用英文或日文工作流，请在创建时指定 `--lang=en` 或 `--lang=ja`。

### 更新由这个入门套件创建的项目

在项目根目录运行：

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
claude
```

更新程序会刷新 Claude Code 配置，不会替换源代码或现有的 `package.json` 设置。已保存的工作流模式也会保留。

### 开始第一次变更

启动 Claude Code 后，运行：

```text
/project-inject
/implement 为 API 添加速率限制
```

`/project-inject` 会记录项目约束、质量标准和开发约定，后续请求无需重复提供这些信息。

`/implement` 会确认目标、检查现有代码，并创建变更所需的设计和规划文档。评审会确认约定的行为是否已实现，并检查不必要的改动和严重缺陷。发现的问题会先按约定的目标判断是否需要修正。完成报告会说明哪些检查被省略，哪些未能执行。

完整的配置和首次运行步骤请参阅[快速开始指南](docs/guides/zh-CN/quickstart.md)。

## 选择适合的命令

| 你想做什么 | 从这里开始 |
|---|---|
| 从需求确认推进至实现和验证完成 | `/implement` |
| 完成范围明确的变更 | `/task` |
| 在实现前设计变更 | `/design`、`/front-design` |
| 将已批准的设计转化为可执行计划 | `/plan`、`/front-plan` |
| 从已批准的计划继续实现 | `/build`、`/front-build` |
| 评审已完成的实现，确认其符合约定的目标和仓库标准 | `/review`、`/front-review` |
| 在选择修复方案前调查问题 | `/diagnose` |

### 先设计，后实现

```text
/design 为 API 添加速率限制
/plan
/build
```

设计命令会停下来等待批准。之后可以依据已批准的文档，在新的会话中或由另一位贡献者继续规划和实现。计划会记录每项任务要完成什么、如何验证，因此交接时无需重新梳理之前的对话。

前端开发使用对应的命令：

```text
/front-design 添加用户个人资料仪表盘
/front-plan
/front-build
```

有关示例和完整命令参考，请参阅[使用场景和命令](docs/guides/zh-CN/use-cases.md)。

## 工作流模式

默认的 Normal 模式运行完整的验证流程。Lite 模式会跳过设计文档与代码的独立核对、设计文档之间的一致性检查，以及单独的安全评审。按计划推进实现时，仓库质量检查会集中到实现结束后、代码评审前进行。

代码评审、针对性的实现检查、必需的测试评审和批准节点保持不变。简单变更和评审修正也照常进行质量检查。

要将 Lite 模式设为项目默认值，请在项目根目录运行：

```bash
node scripts/set-workflow-mode.js lite
```

设置会保存到 `CLAUDE.md`，后续会话无需在每次请求中指定模式。运行 `node scripts/set-workflow-mode.js normal` 可恢复 Normal 模式。你在对话中明确指定的模式优先于项目默认值，并在本次会话中持续生效，直到你要求更改。

## 根据项目进行调整

使用 `/project-inject` 记录适用于整个仓库的事实、约束和质量标准。Claude 就能在后续工作中查阅项目目标、开发约定和外部资料。

如果团队中的某项知识或判断标准只适用于特定工作，可以通过 `/create-skill` 或 `/refine-skill` 添加或改进相应技能。这些命令也会帮助你确定信息所属位置，并在使用前进行评审。具体示例请参阅[技能编辑指南](docs/guides/zh-CN/skills-editing-guide.md)。

## 指南

- [快速开始指南](docs/guides/zh-CN/quickstart.md)
- [使用场景和命令](docs/guides/zh-CN/use-cases.md)
- [技能编辑指南](docs/guides/zh-CN/skills-editing-guide.md)

## 许可证

[MIT](LICENSE)
