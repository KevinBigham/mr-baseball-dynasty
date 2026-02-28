/**
 * Salary Visualization Engine
 *
 * Builds salary breakdown by position, top contract hits with
 * value assessment, and 3-year salary projections for the team.
 *
 * Ported from football dynasty cap-visualization.js, adapted for
 * baseball luxury tax system (no hard cap).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface PositionSalaryBreakdown {
  position: string;
  total: number;
  pct: number;
  count: number;
}

export interface TopContract {
  name: string;
  position: string;
  overall: number;
  age: number;
  salary: number;
  years: number;
  value: 'fair' | 'watch' | 'overpay' | 'bargain';
  valueLabel: string;
}

export interface SalaryProjection {
  label: string;
  committed: number;
  expiring: number;
  luxuryTax: number;
  space: number;
  warning: string;
}

export interface SalaryVisualizationData {
  breakdown: PositionSalaryBreakdown[];
  topContracts: TopContract[];
  projections: SalaryProjection[];
  totalPayroll: number;
  luxuryTaxThreshold: number;
  overTax: number;
  deadMoney: number;
}

// ── Constants ───────────────────────────────────────────────────────────────

const LUXURY_TAX_THRESHOLD = 237; // $237M (approximation)
const COMPETITIVE_BALANCE_TAX = 293; // $293M

// ── Contract value assessment ───────────────────────────────────────────────

function assessContractValue(overall: number, age: number, salary: number): TopContract['value'] {
  // Simple value assessment based on OVR vs salary
  const expectedSalary = Math.max(1, (overall - 50) * 0.6); // Rough expected salary

  if (salary <= expectedSalary * 0.7) return 'bargain';
  if (salary <= expectedSalary * 1.1) return 'fair';
  if (salary <= expectedSalary * 1.4) return 'watch';
  return 'overpay';
}

const VALUE_LABELS: Record<TopContract['value'], string> = {
  bargain: '🟢 Bargain',
  fair: '✅ Fair',
  watch: '⚠️ Watch',
  overpay: '❌ Overpay',
};

// ── Build visualization ─────────────────────────────────────────────────────

export interface RosterContract {
  name: string;
  position: string;
  overall: number;
  age: number;
  salary: number;
  contractYears: number;
}

export function buildSalaryVisualization(
  roster: RosterContract[],
  deadMoney: number = 0,
): SalaryVisualizationData {
  // Position breakdown
  const posMap: Record<string, { total: number; count: number }> = {};
  let totalPayroll = 0;

  for (const p of roster) {
    if (p.salary <= 0) continue;
    if (!posMap[p.position]) posMap[p.position] = { total: 0, count: 0 };
    posMap[p.position].total += p.salary;
    posMap[p.position].count++;
    totalPayroll += p.salary;
  }

  const breakdown: PositionSalaryBreakdown[] = Object.entries(posMap)
    .map(([position, data]) => ({
      position,
      total: Math.round(data.total * 10) / 10,
      pct: totalPayroll > 0 ? Math.round(data.total / totalPayroll * 100) : 0,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total);

  // Top contracts
  const topContracts: TopContract[] = roster
    .filter(p => p.salary > 0)
    .sort((a, b) => b.salary - a.salary)
    .slice(0, 10)
    .map(p => {
      const value = assessContractValue(p.overall, p.age, p.salary);
      return {
        name: p.name,
        position: p.position,
        overall: p.overall,
        age: p.age,
        salary: p.salary,
        years: p.contractYears,
        value,
        valueLabel: VALUE_LABELS[value],
      };
    });

  // 3-year projections
  const projections: SalaryProjection[] = [];
  for (let yr = 0; yr < 3; yr++) {
    let committed = 0;
    let expiring = 0;
    for (const p of roster) {
      if (p.salary <= 0) continue;
      if (p.contractYears <= yr) expiring += p.salary;
      else committed += p.salary;
    }
    const space = LUXURY_TAX_THRESHOLD - committed;
    let warning = '';
    if (committed > COMPETITIVE_BALANCE_TAX) warning = '🚨 Above CBT';
    else if (committed > LUXURY_TAX_THRESHOLD) warning = '⚠️ Over luxury tax';
    else if (space < 20) warning = '📋 Tight budget';

    projections.push({
      label: `Year +${yr + 1}`,
      committed: Math.round(committed * 10) / 10,
      expiring: Math.round(expiring * 10) / 10,
      luxuryTax: LUXURY_TAX_THRESHOLD,
      space: Math.round(space * 10) / 10,
      warning,
    });
  }

  return {
    breakdown,
    topContracts,
    projections,
    totalPayroll: Math.round(totalPayroll * 10) / 10,
    luxuryTaxThreshold: LUXURY_TAX_THRESHOLD,
    overTax: Math.round(Math.max(0, totalPayroll - LUXURY_TAX_THRESHOLD) * 10) / 10,
    deadMoney,
  };
}
