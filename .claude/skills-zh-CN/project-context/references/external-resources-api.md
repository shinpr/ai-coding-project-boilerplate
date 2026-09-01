# API 契约外部资源轴

用于 API 契约设计、客户端集成或服务端接口实现的询问轴。

## 轴 1：API Schema 来源

API 契约（请求/响应结构、接口、RPC 方法）的权威来源。

**AskUserQuestion 选项**：
- OpenAPI / Swagger 规范（仓库中的文件或托管 URL）
- Protobuf 定义（仓库中的文件）
- GraphQL schema（SDL 文件或 introspection 端点）
- 仓库中的代码优先契约定义（例如客户端与服务端共享的 TypeScript 类型）
- 临时 JSON（无正式契约）
- 不适用

**后续问题（当该轴存在时）**：采集两个字段：
- **位置**：文件路径或 URL
- **访问方式**：文件读取或 WebFetch

当存在多个契约时（公开 API、内部服务），按照 `template.md` 中多实例规则，将每个契约作为单独条目采集，并以契约用途作为区分后缀。

## 轴 2：Mock 环境

客户端如何在与线上服务端隔离的情况下调用 API。

**AskUserQuestion 选项**：
- 从 schema 生成的 mock（例如通过 OpenAPI / Protobuf 工具生成）
- 仓库中手写的 mock 服务
- 托管的 mock 服务（URL）
- 实时开发服务器（无独立 mock）
- 不适用

**后续问题（当该轴存在时）**：采集两个字段：
- **位置**：mock URL 或仓库路径
- **访问方式**：CLI 命令、WebFetch，或生成步骤名称。说明 schema 变更时 mock 是否自动更新（例如 `regenerate from openapi.yaml on commit`）

## 轴 3：认证方式

API 如何对请求进行认证与授权。

**AskUserQuestion 选项**：
- 由认证服务签发的 Bearer token（例如 JWT）
- header 或 query 参数中的 API key
- 由独立登录流程设置的 session cookie
- 双向 TLS
- 无认证
- 不适用

**后续问题（当该轴存在时）**：采集两个字段：
- **位置**：认证服务 URL、环境变量名，或开发与测试中使用的 fixture 文件路径
- **访问方式**：SDK 调用、CLI 命令，或文件读取

当相同的密钥也存在于后端密钥存储中时，将此轴渲染为指回该位置的跨轴引用（记法定义见 `template.md`）。

## 轴 4：Schema 变更流程

破坏性和非破坏性 schema 变更如何评审与发布。

**AskUserQuestion 选项**：
- 有文档记录的契约评审流程（附文档链接）
- 版本化接口（例如 `/v1/`、`/v2/`）
- 仅允许向后兼容的变更，无正式版本管理
- 不适用

**后续问题（当该轴存在时）**：采集两个字段：
- **位置**：文档路径或 URL
- **访问方式**：文件读取、WebFetch，或版本协商规则说明（例如 `breaking changes require a new /vN/ path`）

## 自我声明阶段

在四个结构化轴之后，统一提问一次：“除了上述结构化问题涉及的内容外，这个项目还依赖其他 API 外部资源吗？请在下一条消息中逐条列出，或回复‘无’。”

将自由格式的回答记录在“API 契约”领域块的“其他资源”子章节下。即使所有结构化轴都返回“不适用”，也要执行此阶段。

仅通过自我声明才会浮现的资源示例：速率限制配置、位于 API 之前的网关或代理、契约测试套件（例如 Pact broker URL）、API 网关管理控制台、设计过程中参考的第三方 API 文档。
