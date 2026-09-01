---
name: frontend-technical-spec
description: 根据仓库依据定义 React 环境、组件架构、状态/数据流、构建验证以及前端非功能性标准。用于配置或设计 React 前端及其构建、运行时边界时使用。
---

# 技术设计规则（前端）

## 前置条件检测

在应用工具或框架相关规则之前，先检查 `package.json`、锁文件、TypeScript/构建配置、CI 定义以及具有代表性的组件。只有当仓库依据明确指出时，才可将 React、Vite、Next.js、状态库、表单库或脚本视为可用。将基于周边模式得出的结论标注为推断结果。当某个缺失的决策会影响渲染架构、兼容性、安全性或验证方式时，停下来并指出所需的具体依据或用户决策。

## 基础技术栈方针
以下规则适用于仓库配置已确认为基于 TypeScript 的 React 应用的情况。通过将当前需求与约束映射到组件职责、状态归属、服务端/客户端边界以及可观测的验证点来选择架构。

## 环境变量管理与安全

### 环境变量管理
- **使用构建工具的客户端暴露机制**：浏览器代码只能读取由所配置的打包工具/框架明确暴露的值；仅服务端可访问的环境变量不会进入客户端包
- 通过配置层集中管理环境变量
- 在应用使用前，在一个类型化的配置边界处解析所有暴露的值
- 仅当需求中定义了值缺失时的有效行为时才为其设置默认值；否则应在启动/构建验证阶段失败，并给出变量名和期望格式

```typescript
// 构建工具环境变量（仅限公开值；客户端暴露的变量需要 VITE_ 前缀）
const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  appName: import.meta.env.VITE_APP_NAME || 'My App'
}

// 在前端中不可用
const apiUrl = process.env.API_URL
```

### 安全性（客户端约束）
- **关键**：所有前端代码都是公开的，在浏览器中可见
- **将机密信息保留在服务端**：客户端暴露的配置只应包含公开值；API 密钥、令牌和凭据应由后端或受信任的服务持有
- 将本地 `.env` 文件排除在版本控制之外，并为所需的变量名提供不含机密信息的示例文件
- 只记录和返回当前信任边界所批准的字段；对密码、令牌和个人数据进行脱敏

**处理机密信息的正确方式**：
```typescript
// 安全风险：API 密钥在浏览器中暴露
const apiKey = import.meta.env.VITE_API_KEY
const response = await fetch(`https://api.example.com/data?key=${apiKey}`)

// 正确做法：后端管理机密信息，前端通过代理访问
const response = await fetch('/api/data') // 后端负责处理 API 密钥认证
```

## 架构设计

### 前端架构模式

**React 组件架构**：
- **函数组件**：强制要求；仅在 Error Boundary 场景下允许使用类组件（因为没有对应的 hook 替代方案）
- **自定义 Hook**：用于逻辑复用和依赖注入
- **组件层级**：Atoms -> Molecules -> Organisms -> Templates -> Pages
- **Props 驱动**：组件通过 props 接收所有必要数据
- **就近放置**：将测试、样式和相关文件放在组件旁边

按以下规则选择组件/状态模式：
- 当某个组件子树独占所有读写权限时，保持状态为局部状态
- 当多个后代组件需要相同的低频状态且 provider 边界明确时，使用 Context
- 仅当已配置该依赖项存在，且需要缓存、去重、后台刷新或请求生命周期状态时，才使用服务端状态库
- 仅当当前需求无法用局部状态、reducer 状态、已有 Context 或仓库既有的状态管理机制覆盖时，才引入新的状态管理依赖

**状态管理模式**：
- **局部状态**：使用 `useState` 管理组件专属状态
- **Context API**：用于跨组件树共享状态（主题、认证等）
- **自定义 Hook**：封装状态逻辑和副作用
- **服务端状态**：使用 React Query 或 SWR 缓存 API 数据

## 统一数据流原则

### 客户端数据流
在整个 React 应用中保持一致的数据流：

- **单一数据源**：每一份状态只有一个权威来源
  - UI 状态：组件状态或 Context
  - 服务端数据：缓存在 React Query/SWR 中的 API 响应
  - 表单数据：使用 React Hook Form 的受控组件

- **单向流动**：数据通过 props 自上而下流动
  ```
  API Response -> State -> Props -> Render -> UI
  User Input -> Event Handler -> State Update -> Re-render
  ```

- **不可变更新**：状态更新时使用不可变模式
  ```typescript
  // 不可变的状态更新
  setUsers(prev => [...prev, newUser])

  // 无效的可变状态更新
  users.push(newUser)
  setUsers(users)
  ```

### 数据流中的类型安全
- **前端 -> 后端**：Props/State（类型有保证）-> API 请求（序列化）
- **后端 -> 前端**：API 响应（`unknown`）-> 类型守卫 -> State（类型有保证）

```typescript
// 类型安全的数据流
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`)
  const data: unknown = await response.json()

  if (!isUser(data)) {
    throw new Error('Invalid user data')
  }

  return data // 类型已保证为 User
}
```

## 构建与测试
按以下优先级从 `packageManager` 字段、锁文件或 CI 命令中确定包管理器。只执行所选清单文件中存在的脚本。

### 构建命令
- 从 package.json 的 scripts 中自动检测并执行以下内容：
  - 开发服务器
  - 生产构建
  - 类型检查（不生成输出）

### 测试命令
- `test` - 运行测试

### 质量检查要求
实现完成后必须进行质量检查：

**阶段 1-3：基础检查**
- `check` - Biome（lint + format）
- `build` - TypeScript 构建

**阶段过渡依据**：所有已配置的 lint/format/type/build 检查均成功退出。若缺少必需脚本，则阻塞进入下一阶段，直到找到等效的仓库命令为止。

**阶段 4-5：测试与最终确认**
- `test` - 执行测试
- `check:all` - 整体集成检查

**完成依据**：已配置的测试全部通过，生产构建成功，且在测试修复后整体集成检查仍保持通过。将依赖特定环境的测试记录为受阻状态，并注明其确切的前提条件。

### 测试重点
- 对共享组件、自定义 Hook、工具函数等基础的、高复用性的单元，针对其可观测契约直接编写测试。对于 organisms、pages 等更高组合层级的界面，当该边界最能暴露相关故障时，通过集成测试或 E2E 测试进行验证

### 非功能需求
- **浏览器兼容性**：使用仓库中的 Browserslist/构建目标，或明确指定的产品需求；记录来源，并测试受影响的浏览器特定行为
- **渲染性能**：使用项目需求、CI 或性能配置中定义的浏览器矩阵和性能阈值。如果不存在，则将测得的情况作为诊断性依据报告，而不臆造通过阈值
