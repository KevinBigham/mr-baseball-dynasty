# Healing Rules

## Tier 1 — AUTO FIX (May Modify Code)

The self-healing system may automatically fix ONLY these issues:

| Issue | Action | Risk |
|---|---|---|
| Unused imports | Remove the import line | None — TypeScript will catch if needed |
| Trailing whitespace | Trim line endings | None |
| Console.log in production src | Remove or comment out | Low — debug output only |
| Duplicate semicolons | Remove duplicate | None |
| Dead variables (declared, never read) | Remove declaration | Low — linter-equivalent |
| Missing trailing newline | Add newline at EOF | None |

### Auto Fix Constraints
- ONLY touch files under `src/`
- NEVER touch test files, config files, or documentation
- NEVER change logic, control flow, types, or function signatures
- NEVER modify files listed as hot files in AGENTS.md without human approval
- Log EVERY change in `AUTO_FIX_LOG.md` before committing
- Run `npx tsc --noEmit` after any batch of fixes — revert if it fails

## Tier 2 — ASSISTED FIX (Suggestion Only)

Generate a suggestion file in `auto_tasks/REVIEWED/` for:

| Issue | Why Not Auto-Fix |
|---|---|
| Dependency version drift | Could break build |
| Missing test coverage for a function | Requires understanding intent |
| Missing type definition (uses `any`) | Requires design knowledge |
| Small refactor opportunity | Requires understanding context |
| Deprecated API usage | Requires choosing replacement |

## Tier 3 — DISCOVERY (Auto Task)

Generate a task file in `auto_tasks/DISCOVERED/` for:

| Issue | Why Not Even Suggest |
|---|---|
| File exceeds 500 lines | Requires architectural decision on split strategy |
| Circular dependency detected | Requires architectural redesign |
| Gameplay system stub (TODO without implementation) | Requires architect spec |
| Performance bottleneck suspected | Requires profiling data |
| State mutation outside worker | Requires understanding data flow |

## Hard Boundaries — NEVER Auto-Fix

- Anything that changes game logic or simulation output
- Anything that touches save/persistence schemas
- Anything that modifies typed contracts in `src/types/`
- Anything in `src/engine/worker.ts` (too hot, too critical)
- Anything that requires a new dependency
- Anything that changes the public API surface

## Scope Protections (Sprint 07f)

These additional guardrails prevent self-healing from causing more problems than it solves:

1. **File size limit:** Self-healing may NOT modify any file larger than 1,000 lines. Large files require human judgment — auto-fixes in complex files carry high regression risk.
2. **No gameplay logic:** Self-healing must NEVER modify game simulation output, player attribute calculations, matchup math, or any system that affects gameplay results. If in doubt, don't touch it.
3. **Pre/post verification required:** Before applying any Tier 1 fix batch, run `npx tsc --noEmit`. After applying fixes, run the full verification gate (`npx tsc --noEmit && npm run test && npx vite build`). If ANY step fails, **revert all changes immediately**.
4. **Revert-first policy:** If post-fix verification fails, revert ALL changes from that batch — do not attempt to debug or partially revert. Log the failure in `AUTO_FIX_LOG.md` with the reason.
5. **Batch size limit:** Maximum 5 auto-fixes per batch. Apply, verify, commit. Then start a new batch if needed. This keeps reverts small and debuggable.
