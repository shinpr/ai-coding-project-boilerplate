---
name: frontend-typescript-testing
description: 使用仓库已配置的 React 测试与浏览器测试工具（包括 RTL、MSW、Vitest，以及存在时的 Playwright）设计前端测试。适用于新增或评审组件测试、加载/错误状态测试、集成测试或前端 E2E 测试时。
---

# TypeScript 测试规则（前端）

## 前置条件检测

在选择框架或命令之前，先检查 `package.json`、锁文件、测试配置以及现有测试的 import。仅在依赖/配置确实存在时才应用 Vitest、React Testing Library、MSW 或 Playwright 的规则。若仓库配置了不同的等效工具，则使用该工具。若无法确定可运行的测试工具，应报告已检查的路径以及缺失的框架或命令，而不是凭空指定。

## 参考资料

| 测试类型 | 参考 | 使用场景 |
|-----------|-----------|-------------|
| **单元测试 / 集成测试** | 本文档 | 使用 RTL + Vitest + MSW 实现 React 组件测试 |
| **E2E** | [references/e2e.md](references/e2e.md) | 使用 Playwright 实现浏览器级 E2E 测试 |

## 测试框架
- **Vitest**：当仓库配置或现有测试选用 Vitest 时使用
- **React Testing Library**：用于组件测试
- **MSW (Mock Service Worker)**：用于 API 模拟
- 测试导入：`import { describe, it, expect, beforeEach, vi } from 'vitest'`
- 组件测试导入：`import { render, screen } from '@testing-library/react'`
- 用户交互：`import userEvent from '@testing-library/user-event'`
- Mock 创建：使用 `vi.mock()`

## 基本测试策略

### 质量要求
- **回归防护**：在关键路径和高复用组件上，断言指定的验收结果、公开分支或失败状态
- **独立性**：每个测试都能独立运行，不依赖其他测试
- **可复现性**：控制时间、随机性、环境变量、网络响应和浏览器状态，使相同的输入产生相同的可观测结果
- **可读性**：每个测试只描述一个用户可见的行为，分离 setup/action/assertion，并将 fixture 限制为该行为实际用到的值

### 应将测试严谨性集中于何处
对于跨功能复用的共享组件、自定义 hook 和工具函数，应覆盖其公开分支、错误状态和边界契约，因为它们的回归影响范围更大。当行为依赖于多个已渲染单元时，通过集成测试/E2E 测试来验证页面级组合。

### 测试类型与范围
1. **单元测试（React Testing Library）**
   - 验证单个组件或函数的行为
   - Mock 所有外部依赖
   - 数量最多，采用细粒度实现
   - 关注用户可观测的行为

2. **集成测试（React Testing Library + MSW）**
   - 验证多个组件之间的协作
   - 使用 MSW (Mock Service Worker) 模拟 API
   - 不进行实际的数据库连接（数据库由后端管理）
   - 验证实现主要验收标准或涉及多个已渲染组件协作的流程

3. **E2E 测试中的跨功能验证**
   - 新增功能时，必须验证其对现有功能的影响
   - 对每个集成点分类：失败会破坏主要用户流程或契约的为高优先级，失败会降低次要可观测行为的为中优先级。需覆盖高优先级和中优先级
   - 验证模式：现有功能运行 -> 启用新功能 -> 验证现有功能的连续性
   - 成功标准：保持源验收标准所指定的显示内容与交互行为；仅在项目配置或需求定义了阈值及其度量方法时，才应用渲染耗时阈值
   - 设计为可在 CI/CD 流水线中自动执行

## 测试实现规范

### 目录结构与命名
- 将组件的测试与该组件放在同一目录下，使实现与测试同步移动
- 测试文件：`{ComponentName}.test.tsx`
- 集成测试文件：`{FeatureName}.integration.test.tsx`
- 测试套件：以描述目标组件或功能的名称命名
- 测试用例：以描述从用户视角出发的预期行为命名

### 测试代码质量规则

保持每个已提交的测试处于有效状态。当测试保护的是当前行为时应修复它；只有在其对应行为已不再被要求、且源需求或实现契约确认该行为可移除时，才能删除该测试。

## Mock 类型安全强制要求

使用 `satisfies` 将 MSW handler 的响应体约束为其所代表的领域类型，使偏离契约的 fixture 在编译期失败，而不是让测试针对应用实际不会收到的数据形状“通过”。

将组件或依赖的 mock 类型限定为被测对象实际使用的部分——例如 `Pick<Props, 'usedProp'>`、`Pick<Router, 'push'>`——而不是完整接口，并用 `satisfies` 约束该字面量，使多余或命名错误的成员在编译期失败。

## 测试设计模式

测试用户可见的结果，而不是实现细节。按用户感知的 role 和可访问名称查询（`getByRole`/`getByLabelText`/`getByText`），而不是 `getByTestId` 或 `container.querySelector`。通过 `userEvent` 驱动交互，每个测试使用 `userEvent.setup()`，而不是触发原始事件，使测试重现浏览器的事件序列。对每个交互和异步断言都使用 `await`——未 await 的交互会针对更新前的渲染结果进行断言，因此异步 UI 应使用 `findBy*`。

覆盖空状态、错误状态和加载/异步状态，而不仅是正常路径。通过为单个测试覆盖 MSW handler 来产生错误状态，而不是修改共享的 handler 集合。

当所需的 UI 状态、可访问名称或外部契约未知时，应停止对该断言的测试设计，并指出所需的 UI 规范、验收标准、实现契约或用户决策。可继续编写预期行为已明确的独立断言。
