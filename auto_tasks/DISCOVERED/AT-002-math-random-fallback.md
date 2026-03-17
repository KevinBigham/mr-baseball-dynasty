AUTO_TASK_ID: AT-002
TITLE: Remove Math.random() fallback in frontOffice.ts
DISCOVERY_SOURCE: code scan
DESCRIPTION: src/data/frontOffice.ts line 201 falls back to Math.random() when no seeded PRNG is provided. This violates the determinism contract and could produce non-reproducible game states.
RECOMMENDED_ACTION: Remove the Math.random() fallback. Require a seeded PRNG parameter or throw if none is provided.
FILES_INVOLVED: src/data/frontOffice.ts
ESTIMATED_COMPLEXITY: low
STATUS: DISCOVERED
