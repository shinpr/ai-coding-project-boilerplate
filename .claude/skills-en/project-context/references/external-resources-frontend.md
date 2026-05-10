# Frontend External Resource Axes

Hearing axes for frontend work — component implementation, screen design, visual adjustment, design system migration. `/project-inject` loads this file when the user selects the Frontend domain.

## Axis 1: Design Origin

The canonical source of the visual specification.

**AskUserQuestion choices**:
- Design tool (a hosted design platform)
- Specification file in the repository (e.g., `DESIGN.md`, `docs/design/...`)
- Public documentation URL
- Existing implementation only (no separate design source)
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields (Source type is set by the choice above):
- **Location**: public URL, repository file path, or MCP target identifier.
- **Access method**: WebFetch, file read, MCP server name, or manual screenshot procedure.

## Axis 2: Design System

Reusable component library and design tokens.

**AskUserQuestion choices**:
- Component library with MCP server access
- Component library with documentation URL
- Storybook or equivalent component catalog
- Internal package with team-internal documentation only
- No design system (ad-hoc components)
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: Storybook URL, package name, or internal documentation path.
- **Access method**: WebFetch, file read, or MCP server name.

## Axis 3: Guidelines

Usage guidance, accessibility rules, anti-patterns, naming conventions for UI work.

**AskUserQuestion choices**:
- Project-level guideline file (e.g., `DESIGN.md`, `docs/guidelines/...`)
- External documentation site
- Inline guidance inside the design system catalog
- No documented guidelines
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: file path or URL.
- **Access method**: file read or WebFetch.

When multiple files address different concerns (CSS, accessibility, i18n), capture each as a separate entry per the multiple-instance rule in `template.md`.

## Axis 4: Visual Verification Environment

How rendered output is confirmed during implementation.

**AskUserQuestion choices**:
- End-to-end test runner with screenshot capability
- Storybook or equivalent isolated component preview
- Browser automation tool (dedicated CLI or MCP server)
- Manual browser inspection only
- Not applicable

**Follow-up (when the axis is present)**: Capture two fields:
- **Location**: preview URL, MCP target, or test runner identifier.
- **Access method**: entry command, MCP server name, or browser automation tool name.

## Self-Declaration Phase

After the four structured axes, ask once: "Are there any other frontend external resources this project depends on beyond what the structured questions covered? List each in your next message, or reply 'none'."

Capture free-form answers under the "Additional Resources" subsection of the Frontend block. Run this phase even when every structured axis returned "Not applicable".

Examples of resources that surface only via self-declaration: brand asset CDNs, font hosting services, icon library subscriptions, A/B testing dashboards that gate visual variants, analytics dashboards consulted for visual KPIs.
