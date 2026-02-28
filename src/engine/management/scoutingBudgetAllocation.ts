/**
 * scoutingBudgetAllocation.ts – Scouting Budget Allocation Engine
 *
 * Manages scout deployment and regional budget allocation across
 * domestic and international scouting territories. Tracks efficiency,
 * hit rates, and top prospect discoveries per region.
 * All demo data — no sim engine changes.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ScoutRegion = 'domestic' | 'latin_america' | 'asia_pacific' | 'europe' | 'africa';

export interface ScoutAllocation {
  region: ScoutRegion;
  budget: number;         // $M
  scouts: number;
  prospectsFound: number;
  hitRate: number;        // % of signings reaching MLB
  topFind: string;
}

export interface ScoutBudgetData {
  teamName: string;
  totalBudget: number;    // $M
  allocations: ScoutAllocation[];
  efficiency: number;     // 0-100 score
  leagueRank: number;     // 1-30
}

// ── Display Maps ───────────────────────────────────────────────────────────

export const REGION_DISPLAY: Record<ScoutRegion, { label: string; color: string; abbrev: string }> = {
  domestic:       { label: 'Domestic (US/CAN)',     color: '#3b82f6', abbrev: 'DOM' },
  latin_america:  { label: 'Latin America',         color: '#f59e0b', abbrev: 'LATAM' },
  asia_pacific:   { label: 'Asia-Pacific',          color: '#22c55e', abbrev: 'APAC' },
  europe:         { label: 'Europe',                color: '#a855f7', abbrev: 'EUR' },
  africa:         { label: 'Africa',                color: '#ef4444', abbrev: 'AFR' },
};

export function getEfficiencyGrade(score: number): { label: string; color: string } {
  if (score >= 85) return { label: 'Elite', color: '#22c55e' };
  if (score >= 70) return { label: 'Good', color: '#4ade80' };
  if (score >= 55) return { label: 'Average', color: '#f59e0b' };
  if (score >= 40) return { label: 'Below Avg', color: '#f97316' };
  return { label: 'Poor', color: '#ef4444' };
}

export function getHitRateColor(rate: number): string {
  if (rate >= 18) return '#22c55e';
  if (rate >= 12) return '#4ade80';
  if (rate >= 8) return '#f59e0b';
  if (rate >= 4) return '#f97316';
  return '#ef4444';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface ScoutBudgetSummary {
  totalBudget: string;
  totalScouts: number;
  totalProspects: number;
  avgHitRate: number;
  bestRegion: string;
  worstRegion: string;
}

export function getScoutBudgetSummary(data: ScoutBudgetData): ScoutBudgetSummary {
  const totalScouts = data.allocations.reduce((s, a) => s + a.scouts, 0);
  const totalProspects = data.allocations.reduce((s, a) => s + a.prospectsFound, 0);
  const avgHitRate = Math.round(
    data.allocations.reduce((s, a) => s + a.hitRate, 0) / data.allocations.length * 10
  ) / 10;
  const sorted = [...data.allocations].sort((a, b) => b.hitRate - a.hitRate);
  return {
    totalBudget: `$${data.totalBudget.toFixed(1)}M`,
    totalScouts,
    totalProspects,
    avgHitRate,
    bestRegion: REGION_DISPLAY[sorted[0].region].label,
    worstRegion: REGION_DISPLAY[sorted[sorted.length - 1].region].label,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoScoutBudget(): ScoutBudgetData {
  const allocations: ScoutAllocation[] = [
    {
      region: 'domestic',
      budget: 8.5,
      scouts: 18,
      prospectsFound: 42,
      hitRate: 14.2,
      topFind: 'Marcus Bell (1st Rd, SS)',
    },
    {
      region: 'latin_america',
      budget: 6.8,
      scouts: 14,
      prospectsFound: 56,
      hitRate: 11.8,
      topFind: 'Carlos Reyes (IFA, OF)',
    },
    {
      region: 'asia_pacific',
      budget: 4.2,
      scouts: 8,
      prospectsFound: 12,
      hitRate: 18.5,
      topFind: 'Kenji Tanaka (NPB, RHP)',
    },
    {
      region: 'europe',
      budget: 1.8,
      scouts: 4,
      prospectsFound: 6,
      hitRate: 8.3,
      topFind: 'Max Bauer (Germany, 1B)',
    },
    {
      region: 'africa',
      budget: 0.7,
      scouts: 2,
      prospectsFound: 3,
      hitRate: 6.7,
      topFind: 'Kofi Mensah (Ghana, OF)',
    },
  ];

  const totalBudget = +(allocations.reduce((s, a) => s + a.budget, 0).toFixed(1));
  const totalProspects = allocations.reduce((s, a) => s + a.prospectsFound, 0);
  const totalScouts = allocations.reduce((s, a) => s + a.scouts, 0);
  const weightedHitRate = allocations.reduce((s, a) => s + a.hitRate * a.prospectsFound, 0) / totalProspects;
  const efficiency = Math.round(weightedHitRate * 4.2 + (totalProspects / totalScouts) * 3);

  return {
    teamName: 'San Francisco Giants',
    totalBudget,
    allocations,
    efficiency: Math.min(100, efficiency),
    leagueRank: 8,
  };
}
