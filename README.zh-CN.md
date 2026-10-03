# AI 编程项目模板：Claude Code 入门套件

*其他语言版本：[English](README.md) | [日本語](README.ja.md)*

[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.15%2B-green?logo=node.js)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Optimized-purple)](https://claude.ai/code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

为 TypeScript 仓库配置基于 Claude Code 的开发环境。`create-ai-project` 会添加项目级 `CLAUDE.md`、可直接使用的命令、专用智能体和技能，让 Claude 在开发时遵循仓库中的规则。

这个入门套件既可以用于创建新项目，也可以持续更新项目中的 Claude Code 配置。你无需自行组装提示词和智能体定义，即可获得一套位于仓库内、可由团队进行版本管理、共享和调整的开发环境。

## 从这套环境开始开发

- 使用已配置好的 TypeScript、Biome 格式化与 lint 检查，以及 Vitest 测试工具开始开发
- 记录项目上下文和质量标准，供后续会话和其他贡献者使用
- 将团队知识整理为技能，在相关工作中供 Claude 参考

## 快速开始

请先安装 Node.js 24.15 或更高版本、pnpm 和 Claude Code。

### 创建新项目

```bash
npx create-ai-project my-project --lang=zh-CN
cd my-project
pnpm install
claude
```

如果想使用英文或日文工作流，请在创建时指定 `--lang=en` 或 `--lang=ja`。

### 进行第一次变更

启动 Claude Code 后，运行：

```text
/project-inject
/implement 为 API 添加速率限制
```

首次使用时，运行 `/project-inject` 记录项目上下文。

`/implement` 会明确需求并查看现有代码。简单变更可以直接推进，无需创建设计文档。需要设计决策时，它会先创建设计和计划，等待批准后再实现。之后会运行适用的检查，中大型变更还会进行实现评审。

完整的配置和首次运行步骤请参阅[快速开始指南](docs/guides/zh-CN/quickstart.md)。

## 选择适合的命令

| 你想做什么 | 从这里开始 |
|---|---|
| 从需求确认推进至实现和验证完成 | `/implement` |
| 完成范围明确的变更 | `/task` |
| 在实现前设计变更 | `/design`、`/front-design` |
| 将已批准的设计转化为可执行计划 | `/plan`、`/front-plan` |
| 按已批准的计划推进实现 | `/build`、`/front-build` |
| 评审已完成的实现，确认其符合约定的目标和仓库标准 | `/review`、`/front-review` |
| 在确定修复方案前调查问题，不修改代码 | `/diagnose` |

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

默认使用 Normal 模式。想减少独立检查和智能体调用次数时，可以选择 Lite 模式。它会跳过设计文档与代码的核对、设计文档之间的一致性检查，以及单独的安全评审。按计划推进实现时，Normal 模式会在每项任务完成后运行 lint、测试等质量检查。Lite 模式会在实现结束后集中运行这些检查，再进入代码评审。

Claude 仍会检查自己实现的变更，并进行必要的测试评审和代码评审。仍会在相同的环节征求你的批准。小规模变更以及评审后的修正，也照常进行质量检查。

要将 Lite 模式设为项目默认值，请在项目根目录运行：

```bash
node scripts/set-workflow-mode.js lite
```

设置会保存到 `CLAUDE.md`，后续会话无需在每次请求中指定模式。运行 `node scripts/set-workflow-mode.js normal` 可恢复 Normal 模式。你在对话中明确指定的模式优先于项目默认值，并在本次会话中持续生效，直到你要求更改。

## 根据项目调整配置

使用 `/project-inject` 记录项目目标、约束、质量标准、开发约定和外部资料的位置。这些信息发生变化时，请重新运行该命令。

如果团队中的某项知识或判断标准只适用于特定工作，可以通过 `/create-skill` 或 `/refine-skill` 添加或改进相应技能。这些命令也会帮助你确定信息所属位置，并在使用前进行评审。具体示例请参阅[技能编辑指南](docs/guides/zh-CN/skills-editing-guide.md)。

## 更新 Claude Code 配置

在由这个入门套件创建的项目根目录，先查看更新内容，再应用更新：

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
claude
```

更新程序会替换受管理的 Claude Code 规则、命令、智能体和技能。对这些文件所做的本地修改会被覆盖。源代码、现有的 `package.json` 设置和已保存的工作流模式会保留。

更新前，请提交项目特有的规则和技能修改，包括通过 `/project-inject`、`/create-skill` 或 `/refine-skill` 所做的修改。更新后，检查差异并手动重新应用需要保留的自定义内容。更新步骤的详细说明请参阅[快速开始指南](docs/guides/zh-CN/quickstart.md)。

## 指南

- [快速开始指南](docs/guides/zh-CN/quickstart.md)
- [使用场景和命令](docs/guides/zh-CN/use-cases.md)
- [技能编辑指南](docs/guides/zh-CN/skills-editing-guide.md)

## 许可证

[MIT](LICENSE)
