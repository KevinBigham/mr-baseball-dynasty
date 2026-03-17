AUTO_TASK_ID: AT-003
TITLE: Implement owner patience delta tracking
DISCOVERY_SOURCE: code scan
DESCRIPTION: worker.ts line 1321 has `ownerPatienceChange: 0, // TODO: track delta`. Owner patience exists but changes are never computed, making the system decorative.
RECOMMENDED_ACTION: Wire ownerPatienceChange to season performance deltas (wins vs expectations, playoff results, fan satisfaction).
FILES_INVOLVED: src/engine/worker.ts
ESTIMATED_COMPLEXITY: medium
STATUS: DISCOVERED
