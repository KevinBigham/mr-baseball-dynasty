AUTO_TASK_ID: AT-008
TITLE: Replace inline import() types with proper imports in league.ts
DISCOVERY_SOURCE: architecture scan
DESCRIPTION: src/types/league.ts uses 8+ inline `import()` type references instead of standard top-level imports. This creates implicit coupling, makes dependency graphs harder to trace, and may contribute to the mixed static/dynamic import build warnings.
RECOMMENDED_ACTION: Convert inline import() types to top-level imports. If circular dependency is the reason for inline imports, document the cycle and consider interface extraction.
FILES_INVOLVED: src/types/league.ts, src/types/owner.ts, src/types/offseason.ts
ESTIMATED_COMPLEXITY: medium
STATUS: DISCOVERED
