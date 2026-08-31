# Service-Integration E2E 环境前置条件

以下前置条件仅适用于 `service-integration-e2e` 测试通道。该通道需要运行中的本地应用栈，以及真实的或服务级桩化的数据状态。`fixture-e2e` 测试通道使用真实浏览器配合模拟后端或确定性的 fixture 加载器，不需要实际运行的服务或真实数据库。

## 种子数据策略

通过 API fixture 或数据库播种准备测试数据，使测试流程从待验证行为本身开始：

```typescript
// fixtures/seed.fixture.ts
import { test as base } from '@playwright/test'

export const test = base.extend<{ seededData: SeedResult }>({
  seededData: async ({ request }, use) => {
    // Arrange: 测试前通过 API 创建测试数据
    // 示例：请根据项目实际的播种机制进行调整
    const result = await request.post('/api/test/seed', {
      data: { scenario: 'e2e-user-with-subscription' }
    })
    const seedData = await result.json()

    await use(seedData)

    // Cleanup: 测试后清理测试数据
    await request.delete(`/api/test/seed/${seedData.id}`)
  },
})
```

**原则**：
- 如果应用已有播种机制则使用它；仅在没有其他方案时才创建新的种子端点
- 种子数据的设置属于测试 fixture 的一部分，而不是独立的手动步骤
- 每个测试都必须自洽：创建自己的数据，并在之后清理
- 使用 API 端点或直接访问数据库来播种数据——不要通过 UI 流程

## 认证 Fixture

实现与应用实际登录流程一致的认证 fixture：

```typescript
// fixtures/auth.fixture.ts
export const test = base.extend<{ playerPage: Page }>({
  playerPage: async ({ page, request }, use) => {
    // 使用应用现有的认证端点——不要使用管理员后门
    // 示例：请根据项目实际的登录流程调整 URL 和 payload
    await request.post('/api/login', {
      data: { loginId: E2E_LOGIN_ID, password: E2E_PASSWORD }
    })
    // 将会话传递到浏览器上下文
    await page.goto('/')
    await use(page)
  },
})
```

**原则**：
- 使用应用现有的认证流程；认证 fixture 必须遵循真实用户所使用的相同路径
- 从配置好的测试环境或密钥 fixture 中加载测试凭据
- 如果认证流程需要特定的用户记录，请在 fixture 中播种这些记录

## 环境检查清单

在 service-integration-e2e 测试能够通过之前，请确认：
- [ ] 应用程序正在运行，且可通过 `baseURL` 访问
- [ ] 数据库中已有所需的种子数据（测试用户、必要记录）
- [ ] 认证流程能够使用测试凭据，针对真实认证流程正常工作
- [ ] 环境变量已设置（`E2E_*` 前缀）
- [ ] 外部服务要么可用，要么由服务级桩替代

将缺失的前置条件作为 E2E 测试实现任务本身的一部分来处理，或者在待测行为不需要实际运行的服务时，将验证转移到 `fixture-e2e` 测试通道。
