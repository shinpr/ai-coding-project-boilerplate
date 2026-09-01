---
name: typescript-rules
description: 应用类型安全与错误处理规则。强制执行禁用 any 策略与类型守卫。在实现 TypeScript 或评审类型时使用。
---

# TypeScript 开发规则

## 前置条件检测

在应用项目约定之前，先检查 `tsconfig`、运行时/框架配置、lint/格式化配置、路径别名、package 脚本以及有代表性的模块。仅当配置或既有模式支持某条规则时，才将其视为项目特有规则。将基于有限样本得出的结论标注为推断所得。当相互竞争的约定会改变公共契约、运行时行为或错误边界时，应停下来指出所需的约束来源或用户决策。

## 后端实现中的类型安全

**数据流中的类型安全**
输入层（`unknown`）-> 类型守卫 -> 业务层（类型已保证）-> 输出层（序列化）

**后端特有的类型场景**：
- **API 通信**：将响应作为 `unknown` 接收，并通过类型守卫进行校验
- **表单输入**：外部输入作为 `unknown`，校验后再确定类型
- **遗留系统集成**：将遗留边界作为 `unknown` 接收；将任何有依据支撑的类型断言隔离在拥有该边界的适配器内
- **测试代码**：使用配置好的测试工具定义模拟输入/输出类型；对有意为之的部分 fixture 使用 `Partial<T>`，仅在配置了 Vitest 时使用带类型的 `vi.fn<[Args], Return>()`

## 编码约定

**类的使用标准**
- **推荐：使用函数与接口实现**
  - 理由：提升可测试性与函数组合的灵活性
- **允许使用类的情形**：
  - 框架要求（NestJS Controller/Service、TypeORM Entity 等）
  - 自定义错误类定义
  - 状态与业务逻辑紧密耦合时（例如 ShoppingCart、Session、StateMachine）
- **判断标准**：若“这份数据是否具有行为？”的答案是肯定的，可考虑使用类
  ```typescript
  // 函数与接口
  interface UserService { create(data: UserData): User }
  const userService: UserService = { create: (data) => {...} }
  ```

**函数设计**
- **最多 0-2 个参数**：3 个及以上参数时使用对象
  ```typescript
  // 对象参数
  function createUser({ name, email, role }: CreateUserParams) {}
  ```

**依赖注入**
- **将外部依赖作为参数注入**：确保可测试性与模块化
  ```typescript
  // 将依赖作为参数接收
  function createService(repository: Repository) { return {...} }
  ```

**异步处理**
- Promise 处理：遵循仓库既有风格；当能明确表达执行顺序与错误传播时使用 `async/await`
- 错误处理：当当前层能够转换、丰富、恢复或记录该失败时添加 `try-catch`。否则应让 Promise 拒绝传播到拥有该边界的位置
- 类型定义：明确定义返回值类型（例如 `Promise<Result>`）

**格式规则**
- 遵循仓库配置的格式化工具，包括其分号策略
- 类型使用 `PascalCase`，变量/函数使用 `camelCase`
- 仅通过 `tsconfig` 或所配置构建工具中声明的别名使用绝对导入；否则使用相对导入

**整洁代码原则**
- 在当前改动范围内移除未使用的代码
- 删除调试用的 `console.log()`
- 保持可执行源码中不含被注释掉的代码；版本控制系统会保留被移除的实现
- 注释解释“为什么”（而非“做了什么”）

## 错误处理

**错误结果规则**：每个失败都应有唯一的责任归属结果：返回一个带类型的预期错误、按明确规定的需求恢复，或携带诊断上下文向外传播。在拥有可观测性职责的边界处记录日志，以避免同一失败被重复记录。

**快速失败原则**：出错时应快速失败，以防止在无效状态下继续处理
```typescript
// 无效做法：回退值掩盖了调用方所需的失败信息
catch (error) {
  return defaultValue // 掩盖了错误
}

// 明确传播并附加上下文
catch (error) {
  throw new Error('Processing failed', { cause: error })
}
```

**Result 类型模式**：用类型表达错误以实现显式处理
```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

// 示例：用类型表达错误的可能性
function parseUser(data: unknown): Result<User, ValidationError> {
  if (!isValid(data)) return { ok: false, error: new ValidationError() }
  return { ok: true, value: data as User }
}
```

**自定义错误类**
```typescript
export class AppError extends Error {
  constructor(message: string, public readonly code: string, public readonly statusCode = 500) {
    super(message)
    this.name = this.constructor.name
  }
}
// 按用途区分：ValidationError(400)、BusinessRuleError(400)、DatabaseError(500)、ExternalServiceError(502)
```

**各层特有的错误处理（后端）**
- API 层：转换为 HTTP 响应，输出日志时排除敏感信息
- Service 层：检测业务规则违反，原样传播 AppError
- 仓储层：将技术错误转换为领域错误

**结构化日志与敏感信息保护**
仅记录当前信任边界所允许的字段。记录日志前应对凭证、令牌、密钥、支付数据和个人数据进行脱敏处理。

**异步错误处理**
- 当运行时暴露 `unhandledRejection`/`uncaughtException` 事件时，在应用入口处配置运行时级别的处理；库应将进程级策略留给宿主决定
- 在能够添加带类型结果、恢复逻辑或诊断上下文的那一层捕获异步失败
- 除非某项明确规定的需求要求在该层恢复，否则应在补充信息后继续传播失败

## 性能优化

- 流式处理：当实测的输入规模可能超出可用内存预算，或需求要求增量输出时，使用流式处理或有限批次；记录触发该判断的度量数据或约束条件
- 资源生命周期：在拥有其生命周期的边界处释放定时器、订阅、句柄及被持有的引用
