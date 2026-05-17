### Newly Introduced Vulnerabilities

*   **ID:** VULN-001
*   **Vulnerability:** Broken Access Control (RBAC Bypass)
*   **Vulnerability Type:** Security
*   **Severity:** High
*   **Source Location:** `app/admin/report/log/page.tsx`
*   **Line Content:** `await requireAdminSession('/admin/login')` (Line 50)
*   **Description:** The page uses `requireAdminSession`, which only verifies that a user is authenticated as an admin-type user (admin or clerk). It does not enforce that only users with the 'admin' role can access the system logs, allowing lower-privileged 'clerk' users to view sensitive system data.
*   **Recommendation:** Replace `requireAdminSession` with `requireAdminRole('admin')` to ensure only full administrators can access this page.

*   **ID:** VULN-002
*   **Vulnerability:** Privacy Violation (PII Exposure in Logs)
*   **Vulnerability Type:** Privacy
*   **Severity:** Medium
*   **Source Location:** `app/admin/report/log/SystemLogClient.tsx`
*   **Sink Location:** Clipboard / 3rd Party (Claude Code)
*   **Data Type:** IP Address (PII)
*   **Line Content:** `navigator.clipboard.writeText(data.json)` (Line 115)
*   **Description:** The "Export JSON" feature copies raw logs, including Nginx access logs containing IP addresses, to the clipboard. The UI explicitly recommends sharing this data with Claude Code (a 3rd party) for analysis, which constitutes a privacy leak of user PII (IP addresses).
*   **Recommendation:** Implement IP address masking (e.g., zeroing out the last octet) in the server-side log processing before sending data to the client. Update the "Usage hint" to include a privacy warning.

*   **ID:** VULN-003
*   **Vulnerability:** Information Exposure (Internal Paths)
*   **Vulnerability Type:** Security
*   **Severity:** Low
*   **Source Location:** `app/admin/report/log/SystemLogClient.tsx`
*   **Line Content:** `{pm2Type === 'stdout' ? data.pm2OutPath : data.pm2ErrPath}` (Line 282)
*   **Description:** The UI displays absolute server paths for PM2 log files (e.g., `/root/.pm2/logs/planprom-out.log`). This exposes the internal file system structure and sensitive information about the server environment (e.g., the app is running as root).
*   **Recommendation:** Redact the absolute path prefix in the UI, showing only the filename or a generic label.

*   **ID:** VULN-004
*   **Vulnerability:** Insecure Coding Practice (Command Injection Risk)
*   **Vulnerability Type:** Security
*   **Severity:** Low
*   **Source Location:** `app/admin/report/log/page.tsx`
*   **Line Content:** `const out = execSync(\`tail -n ${n} "${path}" 2>/dev/null\`, { encoding: 'utf8', timeout: 5000 })` (Line 31)
*   **Description:** Using `execSync` with template literals for shell commands is a dangerous pattern. Although the inputs currently appear to be controlled, if a malicious file name were to exist in the log directory, it could lead to command injection.
*   **Recommendation:** Use `child_process.spawnSync` or `child_process.execFileSync` with an array of arguments to avoid shell command interpretation.
