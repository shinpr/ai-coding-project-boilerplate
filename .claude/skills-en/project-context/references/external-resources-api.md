# API Contract External Resource Axes

Hearing axes for API contract design, client integration, or server endpoint implementation. `/project-inject` loads this file when the user selects the API domain.

## Axis 1: API Schema Source

The canonical source of API contracts (request/response shapes, endpoints, RPC methods).

**AskUserQuestion choices**:
- OpenAPI / Swagger specification (file in repository or hosted URL)
- Protobuf definitions (file in repository)
- GraphQL schema (SDL file or introspection endpoint)
- Code-first contract definitions in the repository (e.g., TypeScript types shared between client and server)
- Ad-hoc JSON (no formal contract)
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: file path or URL.
- **Access method**: file read or WebFetch.

When multiple contracts exist (public API, internal services), capture each as a separate entry per the multiple-instance rule in `template.md`, using the contract purpose as the disambiguating suffix.

## Axis 2: Mock Environment

How clients exercise the API in isolation from the live server.

**AskUserQuestion choices**:
- Generated mocks from the schema (e.g., from OpenAPI / Protobuf tooling)
- Hand-written mock server in the repository
- Hosted mock service (URL)
- Live development server (no separate mock)
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: mock URL or repository path.
- **Access method**: CLI command, WebFetch, or generation step name. State whether the mock auto-updates when the schema changes (e.g., `regenerate from openapi.yaml on commit`).

## Axis 3: Authentication Method

How the API authenticates and authorizes requests.

**AskUserQuestion choices**:
- Bearer token (e.g., JWT) issued by an auth service
- API key in a header or query parameter
- Session cookie set by a separate login flow
- Mutual TLS
- No authentication
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: auth service URL, environment variable name, or fixture file path used in development and testing.
- **Access method**: SDK call, CLI command, or file read.

When the same secrets live in the backend secret store, render this axis as a cross-axis reference back to that location (notation defined in `template.md`).

## Axis 4: Schema Change Process

How breaking and non-breaking schema changes are reviewed and rolled out.

**AskUserQuestion choices**:
- Documented contract review process (link to the document)
- Versioned endpoints (e.g., `/v1/`, `/v2/`)
- Backward-compatible changes only, no formal versioning
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: document path or URL.
- **Access method**: file read, WebFetch, or version negotiation rule statement (e.g., `breaking changes require a new /vN/ path`).

## Self-Declaration Phase

After the four structured axes, ask once: "Are there any other API external resources this project depends on beyond what the structured questions covered? List each in your next message, or reply 'none'."

Capture free-form answers under the "Additional Resources" subsection of the API block. Run this phase even when every structured axis returned "Not applicable".

Examples of resources that surface only via self-declaration: rate-limit configuration, gateway or proxy in front of the API, contract test suite (e.g., Pact broker URL), API gateway management consoles, third-party API documentation consulted during design.
