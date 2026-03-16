# Scan Protocol

## When to Scan

| Trigger | Scan Types | Who Runs It |
|---|---|---|
| After every sprint completion | All 4 scan types | Ops (Cowork) |
| Before major release builds | Code health + build health | Ops or Reviewer |
| After large merges (3+ files) | Architecture drift + code health | Reviewer |
| When NEXT_TASK.md changes | Gameplay opportunities | Ops |

## Scan Types

### 1. Code Health Scan
```bash
# TODO/FIXME comments
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx"

# Files over 500 lines
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -rn | head -20

# Console statements in production code
grep -rn "console\.\(log\|warn\|error\)" src/ --include="*.ts" --include="*.tsx" | grep -v test

# Unused imports (TypeScript will flag these)
npx tsc --noEmit 2>&1 | grep "declared but"

# Dead variables
npx tsc --noEmit 2>&1 | grep "is assigned a value but never used"
```

### 2. Build Health Scan
```bash
# Full verification gate
npx tsc --noEmit
npm run test
npx vite build

# Check for new warnings in build output
npx vite build 2>&1 | grep -i "warning"

# Check test output for new stderr noise
npm run test 2>&1 | grep -i "warn\|error" | grep -v "PASS\|FAIL"
```

### 3. Architecture Drift Scan
```bash
# Math.random usage (determinism violation)
grep -rn "Math\.random" src/ --include="*.ts" --include="*.tsx"

# Inline import() types (implicit coupling)
grep -rn "import(" src/types/ --include="*.ts"

# Files with excessive exports
grep -rn "^export " src/ --include="*.ts" | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -10

# Direct state mutation candidates (outside worker)
grep -rn "_state\." src/components/ --include="*.tsx" | head -10
```

### 4. Gameplay Opportunities Scan
```bash
# Backlog items without matching code
# (manual review — check BACKLOG.md items against src/ for implementation stubs)

# Unimplemented engagement systems
grep -rn "TODO\|STUB\|PLACEHOLDER" src/engine/ --include="*.ts"

# Feature flags or disabled systems
grep -rn "enabled.*false\|disabled.*true\|FEATURE_FLAG" src/ --include="*.ts" --include="*.tsx"
```

## Output Routing

| Finding | Destination |
|---|---|
| Trivial fix (Tier 1) | Fix immediately → log in `AUTO_FIX_LOG.md` |
| Medium suggestion (Tier 2) | Write to `auto_tasks/REVIEWED/` |
| Complex discovery (Tier 3) | Write to `auto_tasks/DISCOVERED/` |

## Capacity Limits
- Maximum 10 tasks in `auto_tasks/DISCOVERED/` at any time
- If limit exceeded, keep highest-impact tasks, move lowest to `auto_tasks/REJECTED/` with a note
- `auto_tasks/REVIEWED/` has no hard limit but should be triaged each sprint
