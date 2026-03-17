AUTO_TASK_ID: AT-004
TITLE: Wire rivalry update to season events
DISCOVERY_SOURCE: code scan
DESCRIPTION: worker.ts line 1322 has `rivalryUpdate: null, // TODO: from rivalry system`. The rivalry system exists but updates never flow into the season loop.
RECOMMENDED_ACTION: Connect rivalry tracker to game results (division matchups, playoff eliminations, key series outcomes).
FILES_INVOLVED: src/engine/worker.ts, src/engine/rivalry.ts
ESTIMATED_COMPLEXITY: medium
STATUS: DISCOVERED
