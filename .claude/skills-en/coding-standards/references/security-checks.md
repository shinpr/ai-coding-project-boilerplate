# Security Check Patterns

Last reviewed: 2026-03-21

## Stable Patterns

These patterns have low false-positive rates and are detectable through grep or static analysis.

### Hardcoded Secrets
- Credentials, API keys, or tokens assigned as string literals in source code
- Connection strings containing embedded passwords
- Private keys or certificates stored in source files
- Detection approach: search for high-entropy strings near assignment operators, common key names (`password`, `secret`, `api_key`, `token`, `private_key`), and platform-specific token formats

### SQL String Concatenation
- SQL statements constructed through string concatenation or interpolation with variables
- Detection approach: search for SQL keywords (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) combined with string concatenation operators or template literals containing variable references

### Dynamic Code Execution
- Use of `eval()`, `Function()`, `exec()`, `compile()` with dynamic input
- Dynamic import or require with variable paths
- Detection approach: search for these function calls where the argument is not a static literal

### Insecure Deserialization
- `pickle.loads()`, `yaml.load()` without SafeLoader, `marshal.loads()` with untrusted input
- `JSON.parse()` followed by direct use in `eval()` or `Function()`
- Detection approach: search for deserialization calls that accept external input without safe loader configuration

### Path Traversal
- File system paths constructed from user-supplied input without sanitization
- Patterns where request parameters flow into file read/write operations
- Detection approach: search for file operations where path arguments include request parameters, query strings, or user input variables

### CORS Wildcard
- `Access-Control-Allow-Origin` set to `*` in production configuration
- CORS middleware configured with wildcard origin
- Detection approach: search for CORS configuration with wildcard values

### Non-TLS URLs
- HTTP (non-TLS) URLs embedded in source code for production endpoints (outside configuration files, tests, and documentation)
- Detection approach: search for `http://` patterns in source files, excluding localhost, configuration files, tests, and documentation

## Trend-Sensitive Patterns

Updated: 2026-03-21
Sources: OWASP Top 10:2025, DryRun Agentic Coding Security Report (2026-03)

### Access Control Gaps in AI-Generated Code
- Endpoints or route handlers defined without authentication middleware
- Resource access operations (read, update, delete) without authorization verification
- Administrative or destructive operations accessible without elevated permissions
- Recent research indicates this pattern appears at elevated rates in AI-generated code — treat as high-priority review target

### Mishandling of Exceptional Conditions (OWASP A10:2025)
- Error handlers that expose internal system details (stack traces, database errors, file paths) in responses
- Error handlers that fail open (grant access or skip validation on error)
- Missing error handling on security-critical operations (authentication, authorization, cryptographic operations)

### Software Supply Chain Patterns (OWASP A03:2025)
- Dependencies imported without version pinning
- Use of deprecated or unmaintained packages for security-critical functions
- Detection approach: check dependency manifests for unpinned versions and known deprecated packages
