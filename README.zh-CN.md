# AI 编程项目模板：Claude Code 入门套件

*其他语言版本：[English](README.md) | [日本語](README.ja.md)*

[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24.15%2B-green?logo=node.js)](https://nodejs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Optimized-purple)](https://claude.ai/code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

为 TypeScript 仓库配置基于 Claude Code 的开发环境。`create-ai-project` 会添加项目级 `CLAUDE.md`、可直接使用的命令、专用智能体和技能，让 Claude 按照仓库中的规则，完成需求确认、设计、实现和验证。

这个入门套件既可以用于创建新项目，也可以持续更新项目中的 Claude Code 配置。你无需自行组装提示词和智能体定义，即可获得一套位于仓库内、可由团队进行版本管理、共享和调整的开发环境。

## 从这套环境开始开发

- 使用已配置好 TypeScript、格式化、lint 和测试工具的环境开始开发
- 在需求确认、设计、实现和评审中使用同一套项目规则
- 记录项目上下文和质量标准，供后续会话和其他贡献者使用
- 将团队知识整理为技能，在相关工作中供 Claude 参考

## 快速开始

### 创建新项目

```bash
npx create-ai-project my-project --lang=zh-CN
cd my-project
pnpm install
claude
```

如果想使用英文或日文工作流，请在创建时指定 `--lang=en` 或 `--lang=ja`。

### 开始第一次变更

启动 Claude Code 后，运行：

```text
/project-inject
/implement 为 API 添加速率限制
```

`/project-inject` 会记录项目约束、质量标准和开发约定，后续请求无需重复提供这些信息。

`/implement` 会明确需求、检查现有代码，并完成变更所需的设计、规划、实现和验证。在需要批准的环节，它会停下来等待确认。中大型变更还会对已完成的实现进行评审。

完整的配置和首次运行步骤请参阅[快速开始指南](docs/guides/zh-CN/quickstart.md)。

## 调整配置并与团队共享

使用 `/project-inject` 记录项目目标、约束、质量标准、开发约定和外部资料的位置。这些信息发生变化时，请重新运行该命令。后续会话可以直接使用记录的上下文，无需重新梳理之前的对话。

如果团队中的某项知识或判断标准只适用于特定工作，可以通过 `/create-skill` 或 `/refine-skill` 添加或改进相应技能。这些命令也会帮助你确定信息所属位置，并在使用前进行评审。具体示例请参阅[技能编辑指南](docs/guides/zh-CN/skills-editing-guide.md)。

将项目规则和技能与代码一同进行版本管理，团队就可以使用同一套配置，并根据项目需要持续调整。

## 更新 Claude Code 配置

在由这个入门套件创建的项目根目录，先查看更新内容，再应用更新：

```bash
npx create-ai-project update --dry-run
npx create-ai-project update
claude
```

更新程序会刷新受管理的 Claude Code 规则、命令、智能体和技能，不会替换源代码或现有的 `package.json` 设置。已保存的工作流模式也会保留。更新步骤的详细说明请参阅[快速开始指南](docs/guides/zh-CN/quickstart.md)。

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

## 指南

- [快速开始指南](docs/guides/zh-CN/quickstart.md)
- [使用场景和命令](docs/guides/zh-CN/use-cases.md)
- [技能编辑指南](docs/guides/zh-CN/skills-editing-guide.md)

## 许可证

[MIT](LICENSE)
