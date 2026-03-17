AUTO_TASK_ID: AT-006
TITLE: Audit and remove console statements from production source
DISCOVERY_SOURCE: code scan
DESCRIPTION: 10 console.log/warn/error statements found in non-test source files. Production code should use structured error handling, not console output.
RECOMMENDED_ACTION: Replace with proper error boundaries, toast notifications, or remove if purely debug leftovers. Keep only intentional error logging.
FILES_INVOLVED: (run grep -rn "console\." src/ --include="*.ts" --include="*.tsx" to locate)
ESTIMATED_COMPLEXITY: low
STATUS: DISCOVERED
