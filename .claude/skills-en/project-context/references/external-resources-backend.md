# Backend External Resource Axes

Hearing axes for server-side, data, or storage work. `/project-inject` loads this file when the user selects the Backend domain.

## Axis 1: Database Schema Source

The canonical source of the database schema (tables, columns, indexes, constraints).

**AskUserQuestion choices**:
- Migration files in the repository (e.g., a `migrations/` directory)
- Schema file in the repository (e.g., `schema.sql`, `prisma/schema.prisma`)
- Database MCP server that introspects a live database
- External schema registry (URL or hosted catalog)
- No persistent database
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: file path, URL, or MCP target identifier.
- **Access method**: file read, WebFetch, or MCP server name.

When multiple databases exist (primary, analytics, cache), capture each as a separate entry per the multiple-instance rule in `template.md`, using the database purpose as the disambiguating suffix.

## Axis 2: Migration History

How schema changes are tracked over time.

**AskUserQuestion choices**:
- Versioned migration files in the repository
- ORM-managed migration tool (e.g., Alembic, Flyway, Prisma Migrate)
- Manual change log document
- No migration tracking
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: directory path or migration tool name.
- **Access method**: CLI command for manual runs, or CI step / deployment hook name when migrations apply automatically.

## Axis 3: Secret Store

Where credentials, API keys, and other secrets are stored and accessed.

**AskUserQuestion choices**:
- Secret manager service (e.g., AWS Secrets Manager, Vault, GCP Secret Manager)
- Environment variables loaded from a `.env` file (development only)
- Encrypted file in the repository
- No secrets required
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: secret manager service name or MCP target.
- **Access method**: MCP server name, CLI command, or SDK call used to read secrets.

The actual secret values live in the store and are read from there at runtime — capture only how to reach them.

## Axis 4: Background Job Infrastructure

How asynchronous work is dispatched and observed.

**AskUserQuestion choices**:
- Queue service (e.g., SQS, Pub/Sub, RabbitMQ)
- Cron / scheduled tasks managed by the deployment platform
- In-process worker thread
- No background work
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: queue name or scheduler identifier.
- **Access method**: enqueue command, inspect command, or platform console URL.

## Self-Declaration Phase

After the four structured axes, ask once: "Are there any other backend external resources this project depends on beyond what the structured questions covered? List each in your next message, or reply 'none'."

Capture free-form answers under the "Additional Resources" subsection of the Backend block. Run this phase even when every structured axis returned "Not applicable".

Examples of resources that surface only via self-declaration: third-party SaaS APIs (payment, email, search index), distributed cache services (Redis, Memcached), object storage (S3, GCS), feature flag services consumed server-side, observability platforms (logs, traces, metrics).
