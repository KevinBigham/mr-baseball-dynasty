/**
 * Contract Projections
 *
 * Projects future free agent contract values based on
 * performance, age, position, and market trends.
 * Identifies buy-low and sell-high opportunities.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ContractTier = 'mega' | 'premium' | 'solid' | 'role_player' | 'minimum';

export const TIER_DISPLAY: Record<ContractTier, { label: string; color: string; range: string }> = {
  mega:        { label: 'Mega Deal',   color: '#ef4444', range: '$200M+' },
  premium:     { label: 'Premium',     color: '#f97316', range: '$80-200M' },
  solid:       { label: 'Solid',       color: '#eab308', range: '$30-80M' },
  role_player: { label: 'Role Player', color: '#3b82f6', range: '$5-30M' },
  minimum:     { label: 'Minimum',     color: '#6b7280', range: '<$5M' },
};

export interface ContractProjection {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  currentSalary: number;       // millions per year
  yearsRemaining: number;
  faYear: number;              // year they hit FA
  projectedAAV: number;        // projected avg annual value
  projectedYears: number;
  projectedTotal: number;      // total contract value
  tier: ContractTier;
  surplusValue: number;        // value over current contract (positive = team-friendly)
  comparables: string[];       // similar recent contracts
  riskLevel: 'low' | 'medium' | 'high';
  ageConcern: boolean;
  trendingUp: boolean;
}

export interface ProjectionSummary {
  totalCommitted: number;
  totalSurplus: number;
  megaDealCount: number;
  upcomingFAs: number;
  avgSurplusValue: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getContractTier(projectedTotal: number): ContractTier {
  if (projectedTotal >= 200) return 'mega';
  if (projectedTotal >= 80) return 'premium';
  if (projectedTotal >= 30) return 'solid';
  if (projectedTotal >= 5) return 'role_player';
  return 'minimum';
}

export function getProjectionSummary(projections: ContractProjection[]): ProjectionSummary {
  return {
    totalCommitted: Math.round(projections.reduce((s, p) => s + p.currentSalary * p.yearsRemaining, 0)),
    totalSurplus: Math.round(projections.reduce((s, p) => s + p.surplusValue, 0) * 10) / 10,
    megaDealCount: projections.filter(p => p.tier === 'mega').length,
    upcomingFAs: projections.filter(p => p.yearsRemaining <= 1).length,
    avgSurplusValue: Math.round(projections.reduce((s, p) => s + p.surplusValue, 0) / projections.length * 10) / 10,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoProjections(): ContractProjection[] {
  const data = [
    { name: 'Shohei Ohtani',    pos: 'DH/SP', age: 30, ovr: 95, sal: 70, yr: 8, fa: 2034, aav: 70, py: 10, pt: 700, sv: 15, comp: ['Mike Trout $426M', 'Mookie Betts $365M'], risk: 'medium' as const, ac: false, tu: true },
    { name: 'Julio Rodriguez',  pos: 'CF',     age: 24, ovr: 85, sal: 14, yr: 10, fa: 2036, aav: 35, py: 12, pt: 420, sv: 85, comp: ['Ronald Acuna $100M', 'Wander Franco $182M'], risk: 'low' as const, ac: false, tu: true },
    { name: 'Corbin Burnes',    pos: 'SP',     age: 30, ovr: 87, sal: 26, yr: 4, fa: 2030, aav: 28, py: 5, pt: 140, sv: 12, comp: ['Justin Verlander $130M', 'Gerrit Cole $324M'], risk: 'medium' as const, ac: false, tu: false },
    { name: 'Pete Alonso',      pos: '1B',     age: 30, ovr: 80, sal: 20, yr: 2, fa: 2028, aav: 22, py: 5, pt: 110, sv: -5, comp: ['Matt Olson $168M', 'Freddie Freeman $162M'], risk: 'medium' as const, ac: false, tu: false },
    { name: 'Aaron Judge',      pos: 'RF',     age: 33, ovr: 92, sal: 40, yr: 6, fa: 2032, aav: 40, py: 9, pt: 360, sv: -10, comp: ['Giancarlo Stanton $325M'], risk: 'high' as const, ac: true, tu: false },
    { name: 'Bobby Witt Jr.',   pos: 'SS',     age: 24, ovr: 86, sal: 7.4, yr: 8, fa: 2033, aav: 32, py: 11, pt: 352, sv: 120, comp: ['Corey Seager $325M', 'Trea Turner $300M'], risk: 'low' as const, ac: false, tu: true },
    { name: 'Gerrit Cole',      pos: 'SP',     age: 34, ovr: 89, sal: 36, yr: 3, fa: 2029, aav: 25, py: 3, pt: 75, sv: -25, comp: ['Max Scherzer $130M', 'Zack Greinke $206M'], risk: 'high' as const, ac: true, tu: false },
    { name: 'Gunnar Henderson', pos: 'SS',     age: 23, ovr: 83, sal: 0.72, yr: 4, fa: 2030, aav: 30, py: 10, pt: 300, sv: 105, comp: ['Wander Franco $182M', 'Bo Bichette (arb)'], risk: 'low' as const, ac: false, tu: true },
  ];

  return data.map((d, i) => ({
    id: i,
    name: d.name,
    pos: d.pos,
    age: d.age,
    overall: d.ovr,
    currentSalary: d.sal,
    yearsRemaining: d.yr,
    faYear: d.fa,
    projectedAAV: d.aav,
    projectedYears: d.py,
    projectedTotal: d.pt,
    tier: getContractTier(d.pt),
    surplusValue: d.sv,
    comparables: d.comp,
    riskLevel: d.risk,
    ageConcern: d.ac,
    trendingUp: d.tu,
  }));
}
