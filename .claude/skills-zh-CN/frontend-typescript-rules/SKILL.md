---
name: frontend-typescript-rules
description: 应用 React/TypeScript 类型安全、组件设计与状态管理规则。用于实现 React 组件时使用。
---

# TypeScript 开发规则（前端）

前端专属的 React/TypeScript 实现规则：阈值、边界类型安全、组件/状态设计、错误处理与项目约定。

## 前置条件检测

在应用某项项目约定之前，先检查 TypeScript、打包器/框架、lint/format、路径别名以及具有代表性的组件配置。当配置或既有仓库模式支持某项约定时，将其视为已观察到；仅凭少量示例得出的结论应标注为推断。当存在相互冲突的模式，且会影响公共行为、兼容性或组件边界时，应停下来指出所需的权威来源或决策点。

## 反模式与阈值
触发设计调整的信号：
- Prop 透传超过 3 层 → 提升到 Context 或状态管理
- 组件超过 300 行 → 拆分
- Props 数量超过 10 个 → 拆分组件（3-7 个为合理区间）
- 可选 props 超过 50% → 引入默认值或 Context
- Props 嵌套超过 2 层 → 拉平
- 相同的 `as` 断言出现 3 次以上 → 重新审视类型设计

## 边界处的类型安全
将不可信或类型未知的数据接收为 `unknown`，并通过类型守卫进行收窄。仅当运行时/框架不变量能够证明所断言的类型时才使用 `as`，并在附近注释中记录该不变量。既有的生成代码或第三方声明中包含 `any` 属于需要包装的边界输入，而不是在应用契约中扩散 `any` 的理由。

在应用内部，React Props/State 已由类型保证——无需 `unknown`。在每一个外部边界处，先接收为 `unknown`，再通过类型守卫收窄后使用：API 响应、`localStorage`/`sessionStorage`、URL 参数、解析后的 JSON。受控组件的表单输入通过 React 合成事件保持类型安全。

```typescript
const raw: unknown = await (await fetch(url)).json()
if (!isUser(raw)) throw new ValidationError('invalid user')
const user = raw // 已收窄为 User
```

## 组件与状态设计
- **仅使用函数组件。** 类组件仅允许用于 Error Boundary（不存在对应的 Hook 方案）。
- **显式为 Props 定义类型**，使用具名类型并解构：`function UserCard({ user, onSelect }: UserCardProps)`。直接在函数上标注 props 类型，使 props 契约保持显式。
- **Props 驱动：** 当有一个明确的父组件拥有依赖项时，通过 props 传递。当多个非相邻的后代组件共享该值、且逐层传递 props 会引入无所有权作用的中间组件时，使用 Context 或既有的全局状态方案。
- **自定义 Hook** 是逻辑复用与依赖注入的基本单元（通过 Hook 注入协作对象以提升可测试性）。
- **函数参数：** 0-2 个使用位置参数；3 个及以上使用单一 options 对象。
- **State 结构：** 显式定义 state 类型；对于具有离散转换的多字段 state，使用带判别联合 action 类型的 `useReducer`，而不是大量 `useState` 调用。
- **服务端/客户端边界**（仅限 RSC 框架，例如 Next.js App Router）：数据获取/渲染默认使用服务端组件，将交互逻辑隔离在所需最小范围的 `"use client"` 边界之后；仅浏览器可用的 API（`window`、`localStorage`、事件处理函数）应保留在客户端组件内，因为在服务端组件中调用它们会破坏渲染。纯客户端 SPA（例如 Vite）没有服务端组件运行时，因此可跳过此项。

## 错误处理
- 为每个错误设定一个明确的处理结果：将其转换为带类型的预期失败、在所属的 UI 边界处处理，或连同其诊断上下文一并向上传播。在拥有可观测性职责的层级记录日志，避免同一个失败被重复记录。
- **快速失败：** 遇到无效状态时应抛出异常，而不是静默返回兜底值。
- 使用 `Result` 类型将预期内的失败表示为值；将 `throw` 保留给非预期/不可恢复的情况。
- 使用继承自基类 `AppError` 的专用错误类，携带 `code`（例如 ValidationError、ApiError、NotFoundError）。
- **各层职责：** API 层将传输层错误转换为领域错误；Hook 向上传播 `AppError`；Error Boundary 捕获渲染期错误并展示兜底 UI。
- **Effect 竞态/清理：** 对 `useEffect` 中的数据获取要防范乱序响应与卸载后的状态更新——中止或忽略过期结果（使用 `AbortController` 或挂载标志），或使用能自动取消与去重的服务端状态库（React Query/SWR）。仅靠 `try-catch` 无法覆盖这类情况。
- 仅记录当前信任边界所允许的诊断字段；记录日志前应对凭证、令牌、支付数据等敏感值进行脱敏。

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

class AppError extends Error {
  constructor(message: string, readonly code: string, readonly statusCode = 500) {
    super(message); this.name = this.constructor.name
  }
}
```

Error Boundary ——唯一必须使用类组件的场景：
```typescript
class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? this.props.fallback : this.props.children }
}
```

## 项目约定
- **环境变量：** 通过所配置打包器暴露的访问方式读取客户端环境变量。匹配已观察到的打包器：Vite 使用 `import.meta.env.VITE_*`，Next.js 公共变量使用 `process.env.NEXT_PUBLIC_*`，CRA 使用 `process.env.REACT_APP_*`。前端构建产物包含公开配置；敏感值应保留在服务端边界之后。
- **构建体积与性能：** 使用 `build` 脚本对照项目预算监控构建体积；使用 `React.lazy` + `Suspense` 进行代码分割；组织状态结构以尽量减少重新渲染。记忆化（Memoization）：启用 React Compiler 时应依赖它；仅在有性能分析依据或身份稳定性依据时（经测量确认的瓶颈，或第三方 API/effect 依赖需要稳定的引用身份）才手动使用 `React.memo`/`useMemo`/`useCallback` 作为例外手段。
- **命名：** 组件/类型使用 `PascalCase`；变量/函数使用 `camelCase`；Hook 以 `use` 为前缀；常量使用 `SCREAMING_SNAKE_CASE`。
- **导入：** 遵循在 `tsconfig`、lint 配置及代表性文件中观察到的别名与导入顺序规则。仅在配置的别名支持时使用 `src/` 绝对路径。
- **格式化：** 遵循仓库配置的格式化工具；若使用 Biome，分号与代码风格以其项目配置为准。
