AUTO_TASK_ID: AT-007
TITLE: Audit bridge.ts for unused exports
DISCOVERY_SOURCE: code scan
DESCRIPTION: src/engine/bridge.ts has 54 export statements — more than any other file. Some may be unused re-exports that inflate the module surface and confuse import auto-complete.
RECOMMENDED_ACTION: Run a dead-export analysis. Remove any exports not imported elsewhere. Consider splitting into domain-specific bridges if justified.
FILES_INVOLVED: src/engine/bridge.ts
ESTIMATED_COMPLEXITY: low
STATUS: DISCOVERED
