#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# studio-scan.sh — AI Studio Health Scanner
# ═══════════════════════════════════════════════════════════════
#
# READ-ONLY. This script REPORTS signals. It does NOT modify code.
#
# Usage:
#   ./scripts/studio-scan.sh           # Run all 4 scan types
#   ./scripts/studio-scan.sh code      # Code health only
#   ./scripts/studio-scan.sh build     # Build health only
#   ./scripts/studio-scan.sh arch      # Architecture drift only
#   ./scripts/studio-scan.sh gameplay  # Gameplay opportunities only
#
# Output: scan-results.md in the repo root (gitignored, overwritten each run)
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
OUTPUT="$REPO_ROOT/scan-results.md"
SCAN_TYPE="${1:-all}"
TIMESTAMP="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"

# ── Header ──────────────────────────────────────────────────────
cat > "$OUTPUT" <<EOF
# Studio Scan Results
**Generated:** $TIMESTAMP
**Scan type:** $SCAN_TYPE
**Repo root:** $REPO_ROOT

---

EOF

# ── Helper ──────────────────────────────────────────────────────
section() {
  echo "" >> "$OUTPUT"
  echo "## $1" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
}

code_block() {
  echo '```' >> "$OUTPUT"
  cat >> "$OUTPUT"
  echo '```' >> "$OUTPUT"
}

# ── 1. Code Health Scan ─────────────────────────────────────────
run_code_health() {
  section "1. Code Health"

  echo "### TODO / FIXME / HACK comments" >> "$OUTPUT"
  (grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || echo "(none found)") | code_block

  echo "" >> "$OUTPUT"
  echo "### Files over 500 lines" >> "$OUTPUT"
  (find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | sort -rn | head -20) | code_block

  echo "" >> "$OUTPUT"
  echo "### Console statements in production code" >> "$OUTPUT"
  (grep -rn "console\.\(log\|warn\|error\)" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "test\|spec\|__test__" || echo "(none found)") | code_block

  echo "" >> "$OUTPUT"
  echo "### TypeScript unused/dead variable warnings" >> "$OUTPUT"
  (npx tsc --noEmit 2>&1 | grep -E "declared but|assigned a value but never used" || echo "(none found)") | code_block
}

# ── 2. Build Health Scan ────────────────────────────────────────
run_build_health() {
  section "2. Build Health"

  echo "### TypeScript typecheck" >> "$OUTPUT"
  if npx tsc --noEmit 2>&1 | tail -5 | code_block; then
    echo "**Result:** PASS" >> "$OUTPUT"
  else
    echo "**Result:** FAIL" >> "$OUTPUT"
  fi

  echo "" >> "$OUTPUT"
  echo "### Test suite" >> "$OUTPUT"
  (npm run test -- --reporter=verbose 2>&1 | tail -20) | code_block

  echo "" >> "$OUTPUT"
  echo "### Vite build" >> "$OUTPUT"
  if npx vite build 2>&1 | tail -10 | code_block; then
    echo "**Result:** PASS" >> "$OUTPUT"
  else
    echo "**Result:** FAIL" >> "$OUTPUT"
  fi

  echo "" >> "$OUTPUT"
  echo "### Build warnings" >> "$OUTPUT"
  (npx vite build 2>&1 | grep -i "warning" || echo "(no warnings)") | code_block
}

# ── 3. Architecture Drift Scan ──────────────────────────────────
run_arch_drift() {
  section "3. Architecture Drift"

  echo "### Math.random usage (determinism violation)" >> "$OUTPUT"
  (grep -rn "Math\.random" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || echo "(none found)") | code_block

  echo "" >> "$OUTPUT"
  echo "### Inline import() types (implicit coupling)" >> "$OUTPUT"
  (grep -rn "import(" src/types/ --include="*.ts" 2>/dev/null || echo "(none found)") | code_block

  echo "" >> "$OUTPUT"
  echo "### Files with excessive exports (top 10)" >> "$OUTPUT"
  (grep -rn "^export " src/ --include="*.ts" 2>/dev/null | awk -F: '{print $1}' | sort | uniq -c | sort -rn | head -10) | code_block

  echo "" >> "$OUTPUT"
  echo "### Direct state mutation outside worker" >> "$OUTPUT"
  (grep -rn "_state\." src/components/ --include="*.tsx" 2>/dev/null | head -10 || echo "(none found)") | code_block
}

# ── 4. Gameplay Opportunities Scan ──────────────────────────────
run_gameplay() {
  section "4. Gameplay Opportunities"

  echo "### Unimplemented stubs in engine" >> "$OUTPUT"
  (grep -rn "TODO\|STUB\|PLACEHOLDER" src/engine/ --include="*.ts" 2>/dev/null || echo "(none found)") | code_block

  echo "" >> "$OUTPUT"
  echo "### Feature flags / disabled systems" >> "$OUTPUT"
  (grep -rn "enabled.*false\|disabled.*true\|FEATURE_FLAG" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || echo "(none found)") | code_block
}

# ── Health Score Calculator ─────────────────────────────────────
calc_health_score() {
  section "5. Health Score Summary"

  local score=100

  # Deductions
  local todo_count
  todo_count=$(grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo 0)
  local large_files
  large_files=$(find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l 2>/dev/null | awk '$1 > 500 {count++} END {print count+0}')
  local console_count
  console_count=$(grep -rn "console\.\(log\|warn\|error\)" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -cv "test\|spec" || echo 0)
  local random_count
  random_count=$(grep -rn "Math\.random" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo 0)

  # Apply deductions (capped)
  local todo_deduct=$(( todo_count > 20 ? 10 : todo_count / 2 ))
  local large_deduct=$(( large_files * 3 ))
  local console_deduct=$(( console_count > 10 ? 5 : console_count / 2 ))
  local random_deduct=$(( random_count * 5 ))

  score=$(( score - todo_deduct - large_deduct - console_deduct - random_deduct ))
  [ $score -lt 0 ] && score=0

  cat >> "$OUTPUT" <<EOF
| Metric | Count | Deduction |
|---|---|---|
| TODO/FIXME/HACK comments | $todo_count | -$todo_deduct |
| Files over 500 lines | $large_files | -$large_deduct |
| Console statements (non-test) | $console_count | -$console_deduct |
| Math.random usage | $random_count | -$random_deduct |

**Repository Health Score: ${score}%**

EOF
}

# ── Run ─────────────────────────────────────────────────────────
echo "🏟️  Studio Scan starting ($SCAN_TYPE)..."

case "$SCAN_TYPE" in
  code)     run_code_health ;;
  build)    run_build_health ;;
  arch)     run_arch_drift ;;
  gameplay) run_gameplay ;;
  all)
    run_code_health
    run_build_health
    run_arch_drift
    run_gameplay
    calc_health_score
    ;;
  *)
    echo "Unknown scan type: $SCAN_TYPE"
    echo "Usage: ./scripts/studio-scan.sh [code|build|arch|gameplay|all]"
    exit 1
    ;;
esac

echo ""
echo "✅ Scan complete. Results written to: $OUTPUT"
echo "   (This file is for review only. It does not modify code.)"
