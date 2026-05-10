# Infrastructure External Resource Axes

Hearing axes for deployment, environment configuration, or infrastructure-as-code work. `/project-inject` loads this file when the user selects the Infrastructure domain.

## Axis 1: IaC Source

The canonical source of infrastructure definitions.

**AskUserQuestion choices**:
- Terraform configuration in the repository
- Pulumi or CDK code in the repository
- Kubernetes manifests / Helm charts in the repository
- Cloud-provider-native templates (e.g., CloudFormation, Bicep, Deployment Manager)
- Manual console configuration (no IaC)
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: directory path.
- **Access method**: CI pipeline name when plan/apply runs automatically, or CLI command when an operator runs it manually.

## Axis 2: Environment Configuration

How per-environment settings (development, staging, production) differ.

**AskUserQuestion choices**:
- Per-environment configuration files in the repository (e.g., `terraform/envs/`, `config/staging.yaml`)
- Environment variables managed by the deployment platform
- Workspace or stack abstraction in the IaC tool itself
- Single shared configuration (no per-environment differences)
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: configuration file paths, platform setting names, or workspace identifiers where environment-specific values are stored.
- **Access method**: file read, platform console URL, or CLI command.

When multiple environments are tracked separately (development, staging, production), capture each as a separate entry per the multiple-instance rule in `template.md`, using the environment name as the disambiguating suffix.

## Axis 3: Secrets in Infrastructure

How infrastructure code references secrets while keeping their values out of source control.

**AskUserQuestion choices**:
- Secrets sourced from a secret manager via IaC data lookup
- Secrets injected at apply time via environment variables
- Encrypted secret files committed alongside IaC
- No secrets in infrastructure
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: secret manager service name or IaC data source identifier.
- **Access method**: data lookup syntax, environment variable name, or apply-time injection mechanism.

When the same secret store appears in the Backend domain, render this axis as a cross-axis reference back to that location (notation defined in `template.md`).

## Axis 4: Deployment Trigger

How infrastructure and application changes reach environments.

**AskUserQuestion choices**:
- CI pipeline triggered on merge to a specific branch
- Manual approval step in CI
- Local apply by an operator
- Deployment platform's auto-deploy on push
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: CI pipeline name or deployment platform identifier.
- **Access method**: branch / tag convention that triggers each environment, plus any required manual approval step.

## Self-Declaration Phase

After the four structured axes, ask once: "Are there any other infrastructure external resources this project depends on beyond what the structured questions covered? List each in your next message, or reply 'none'."

Capture free-form answers under the "Additional Resources" subsection of the Infrastructure block. Run this phase even when every structured axis returned "Not applicable".

Examples of resources that surface only via self-declaration: state-storage backend for IaC tools, runbook documents for incident response, on-call rotation, observability dashboards, cost monitoring tools, compliance / audit logging targets.
