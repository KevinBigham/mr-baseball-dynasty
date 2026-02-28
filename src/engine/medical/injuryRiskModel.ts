/**
 * Injury Risk Model
 *
 * Probabilistic injury risk assessment based on workload,
 * age, injury history, position wear, and biomechanical
 * stress indicators. Helps manage player health proactively.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type RiskTier = 'minimal' | 'low' | 'moderate' | 'elevated' | 'high';

export const RISK_TIER_DISPLAY: Record<RiskTier, { label: string; color: string; emoji: string }> = {
  minimal:  { label: 'Minimal',   color: '#22c55e', emoji: '🟢' },
  low:      { label: 'Low',       color: '#3b82f6', emoji: '🔵' },
  moderate: { label: 'Moderate',  color: '#eab308', emoji: '🟡' },
  elevated: { label: 'Elevated',  color: '#f97316', emoji: '🟠' },
  high:     { label: 'High Risk', color: '#ef4444', emoji: '🔴' },
};

export interface InjuryHistoryEntry {
  year: number;
  injury: string;
  daysOut: number;
}

export interface RiskFactor {
  factor: string;
  score: number;          // 0-100 contribution
  description: string;
}

export interface PlayerInjuryRisk {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  riskTier: RiskTier;
  riskScore: number;         // 0-100 overall risk
  injuryProbability: number; // % chance of DL stint this season
  workloadPct: number;       // current workload vs max (0-100)
  injuryHistory: InjuryHistoryEntry[];
  riskFactors: RiskFactor[];
  recommendation: string;
}

export interface InjuryRiskSummary {
  totalPlayers: number;
  highRiskCount: number;
  elevatedCount: number;
  avgRiskScore: number;
  avgWorkload: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getRiskTier(score: number): RiskTier {
  if (score <= 15) return 'minimal';
  if (score <= 30) return 'low';
  if (score <= 50) return 'moderate';
  if (score <= 70) return 'elevated';
  return 'high';
}

export function getInjuryRiskSummary(players: PlayerInjuryRisk[]): InjuryRiskSummary {
  const n = players.length;
  return {
    totalPlayers: n,
    highRiskCount: players.filter(p => p.riskTier === 'high').length,
    elevatedCount: players.filter(p => p.riskTier === 'elevated').length,
    avgRiskScore: Math.round(players.reduce((s, p) => s + p.riskScore, 0) / n),
    avgWorkload: Math.round(players.reduce((s, p) => s + p.workloadPct, 0) / n),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoInjuryRisk(): PlayerInjuryRisk[] {
  return [
    {
      id: 0, name: 'Gerrit Cole', pos: 'SP', age: 33, overall: 89,
      riskTier: 'elevated', riskScore: 62, injuryProbability: 35, workloadPct: 88,
      injuryHistory: [
        { year: 2024, injury: 'Elbow inflammation', daysOut: 30 },
        { year: 2022, injury: 'Hamstring strain', daysOut: 15 },
      ],
      riskFactors: [
        { factor: 'Age', score: 65, description: 'Age 33 — entering higher-risk window for SP' },
        { factor: 'Workload', score: 72, description: 'Heavy workload — 180+ IP on pace' },
        { factor: 'History', score: 55, description: 'Two IL stints in recent history' },
        { factor: 'Velocity', score: 40, description: 'Velocity stable — no concerning drops' },
      ],
      recommendation: 'Monitor pitch count closely. Consider skipping a start in September.',
    },
    {
      id: 1, name: 'Shohei Ohtani', pos: 'DH', age: 29, overall: 95,
      riskTier: 'moderate', riskScore: 45, injuryProbability: 22, workloadPct: 70,
      injuryHistory: [
        { year: 2023, injury: 'UCL tear (surgery)', daysOut: 365 },
        { year: 2018, injury: 'UCL sprain', daysOut: 90 },
      ],
      riskFactors: [
        { factor: 'Surgical History', score: 80, description: 'Tommy John surgery — permanent elevated risk' },
        { factor: 'Current Workload', score: 25, description: 'DH only — reduced physical stress' },
        { factor: 'Age', score: 30, description: 'Age 29 — still in prime window' },
        { factor: 'Recovery', score: 35, description: 'Fully recovered — no current concerns' },
      ],
      recommendation: 'Manage carefully if pitching returns. Current DH role minimizes risk.',
    },
    {
      id: 2, name: 'Freddie Freeman', pos: '1B', age: 34, overall: 87,
      riskTier: 'moderate', riskScore: 48, injuryProbability: 25, workloadPct: 92,
      injuryHistory: [
        { year: 2024, injury: 'Ankle bone spur', daysOut: 20 },
      ],
      riskFactors: [
        { factor: 'Age', score: 70, description: 'Age 34 — increased recovery time' },
        { factor: 'Games Played', score: 65, description: 'Iron man — 150+ games annually wears' },
        { factor: 'Ankle', score: 50, description: 'Bone spur could recur under heavy load' },
        { factor: 'Position', score: 20, description: '1B is low-impact defensively' },
      ],
      recommendation: 'Strategic rest days every 2 weeks. Monitor ankle inflammation.',
    },
    {
      id: 3, name: 'Spencer Strider', pos: 'SP', age: 25, overall: 85,
      riskTier: 'high', riskScore: 78, injuryProbability: 45, workloadPct: 95,
      injuryHistory: [
        { year: 2024, injury: 'UCL sprain', daysOut: 60 },
        { year: 2023, injury: 'Oblique strain', daysOut: 25 },
      ],
      riskFactors: [
        { factor: 'UCL Health', score: 90, description: 'Recent UCL sprain — highest concern' },
        { factor: 'Workload Spike', score: 85, description: 'Career-high innings on a damaged UCL' },
        { factor: 'Velocity', score: 60, description: 'Slight velo dip — needs monitoring' },
        { factor: 'Age', score: 15, description: 'Young arm — good recovery potential' },
      ],
      recommendation: 'CAUTION: Strict pitch count limits. Consider shutting down early if playoff bound.',
    },
    {
      id: 4, name: 'Juan Soto', pos: 'RF', age: 25, overall: 90,
      riskTier: 'minimal', riskScore: 12, injuryProbability: 8, workloadPct: 82,
      injuryHistory: [],
      riskFactors: [
        { factor: 'Age', score: 10, description: 'Age 25 — peak durability window' },
        { factor: 'History', score: 5, description: 'No significant injury history' },
        { factor: 'Position', score: 15, description: 'Corner OF — moderate physical demand' },
        { factor: 'Workload', score: 18, description: 'Standard everyday player workload' },
      ],
      recommendation: 'No concerns. Maintain normal rest schedule.',
    },
    {
      id: 5, name: 'J.T. Realmuto', pos: 'C', age: 33, overall: 78,
      riskTier: 'elevated', riskScore: 65, injuryProbability: 38, workloadPct: 85,
      injuryHistory: [
        { year: 2024, injury: 'Knee meniscus', daysOut: 45 },
        { year: 2023, injury: 'Knee inflammation', daysOut: 20 },
        { year: 2022, injury: 'Thumb fracture', daysOut: 30 },
      ],
      riskFactors: [
        { factor: 'Position Wear', score: 85, description: 'Catching — highest physical toll position' },
        { factor: 'Knee History', score: 80, description: 'Chronic knee issues — catching wears knees' },
        { factor: 'Age', score: 65, description: 'Age 33 catcher — body breaking down' },
        { factor: 'Workload', score: 70, description: 'Too many games behind the plate' },
      ],
      recommendation: 'Limit to 4 games/week catching. Increase DH/rest days significantly.',
    },
  ];
}
