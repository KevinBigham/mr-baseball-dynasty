AUTO_TASK_ID: AT-001
TITLE: Split worker.ts into domain modules
DISCOVERY_SOURCE: code scan
DESCRIPTION: worker.ts is 4,856 lines — the largest file by 5x. It contains all engine API methods in a single file, making it a merge-conflict magnet and hard to navigate.
RECOMMENDED_ACTION: Extract logical groups (draft, trading, roster, sim, persistence) into separate modules. Worker.ts becomes a thin facade re-exporting from domain files.
FILES_INVOLVED: src/engine/worker.ts
ESTIMATED_COMPLEXITY: high
STATUS: DISCOVERED
