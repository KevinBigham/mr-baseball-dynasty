/**
 * swingDecision.ts – Swing Decision Analysis Engine
 *
 * Bloomberg-terminal-style swing decision quality metrics. Measures
 * chase rate, in-zone contact rate, whiff rate by zone, and overall
 * decision quality grade. All demo data — no sim engine changes.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type DecisionGrade = 'elite' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export interface ZoneDecision {
  zone: string;        // 'heart' | 'edge' | 'chase' | 'waste'
  pitchesSeen: number;
  swingPct: number;
  contactPct: number;
  whiffPct: number;
  valuePct: number;    // % of swings that produced positive value
}

export interface SwingProfile {
  id: string;
  name: string;
  team: string;
  position: string;
  overallGrade: DecisionGrade;
  decisionScore: number;     // 0-100
  chaseRate: number;         // % swings at pitches outside zone
  inZoneSwingRate: number;   // % swings at pitches in zone
  inZoneContactRate: number;
  whiffRate: number;
  firstPitchSwingPct: number;
  twoStrikeApproach: number; // score 0-100
  zoneDecisions: ZoneDecision[];
  notes: string;
}

// ── Display Map ────────────────────────────────────────────────────────────

export const DECISION_GRADE_DISPLAY: Record<DecisionGrade, { label: string; color: string }> = {
  elite:     { label: 'Elite',      color: '#22c55e' },
  above_avg: { label: 'Above Avg',  color: '#4ade80' },
  average:   { label: 'Average',    color: '#f59e0b' },
  below_avg: { label: 'Below Avg',  color: '#f97316' },
  poor:      { label: 'Poor',       color: '#ef4444' },
};

function gradeFromScore(score: number): DecisionGrade {
  if (score >= 85) return 'elite';
  if (score >= 70) return 'above_avg';
  if (score >= 50) return 'average';
  if (score >= 35) return 'below_avg';
  return 'poor';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface SwingDecisionSummary {
  totalPlayers: number;
  bestDecider: string;
  lowestChase: string;
  bestContact: string;
  avgDecisionScore: number;
  avgChaseRate: string;
}

export function getSwingDecisionSummary(profiles: SwingProfile[]): SwingDecisionSummary {
  const best = [...profiles].sort((a, b) => b.decisionScore - a.decisionScore)[0];
  const lowestChase = [...profiles].sort((a, b) => a.chaseRate - b.chaseRate)[0];
  const bestContact = [...profiles].sort((a, b) => b.inZoneContactRate - a.inZoneContactRate)[0];
  const avgScore = Math.round(profiles.reduce((s, p) => s + p.decisionScore, 0) / profiles.length);
  const avgChase = (profiles.reduce((s, p) => s + p.chaseRate, 0) / profiles.length).toFixed(1);

  return {
    totalPlayers: profiles.length,
    bestDecider: `${best.name} (${best.decisionScore})`,
    lowestChase: `${lowestChase.name} (${lowestChase.chaseRate}%)`,
    bestContact: `${bestContact.name} (${bestContact.inZoneContactRate}%)`,
    avgDecisionScore: avgScore,
    avgChaseRate: `${avgChase}%`,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const HITTERS = [
  { name: 'Juan Soto',      team: 'NYY', pos: 'RF', chase: 14.2, izSwing: 72.8, izContact: 88.4, whiff: 18.2, fps: 24.5, twoK: 82 },
  { name: 'Steven Kwan',    team: 'CLE', pos: 'LF', chase: 11.8, izSwing: 76.4, izContact: 92.6, whiff: 12.4, fps: 28.2, twoK: 78 },
  { name: 'Aaron Judge',    team: 'NYY', pos: 'CF', chase: 24.6, izSwing: 68.2, izContact: 82.8, whiff: 28.4, fps: 30.2, twoK: 60 },
  { name: 'Bobby Witt Jr',  team: 'KC',  pos: 'SS', chase: 28.4, izSwing: 74.2, izContact: 84.6, whiff: 24.8, fps: 34.6, twoK: 55 },
  { name: 'Shohei Ohtani',  team: 'LAD', pos: 'DH', chase: 22.8, izSwing: 70.6, izContact: 86.2, whiff: 26.2, fps: 32.4, twoK: 62 },
  { name: 'Luis Arraez',    team: 'SD',  pos: '1B', chase: 10.4, izSwing: 80.2, izContact: 94.8, whiff: 8.6,  fps: 26.8, twoK: 88 },
  { name: 'Freddie Freeman', team: 'LAD', pos: '1B', chase: 16.8, izSwing: 74.8, izContact: 90.2, whiff: 16.4, fps: 28.6, twoK: 76 },
  { name: 'Javier Baez',    team: 'DET', pos: 'SS', chase: 38.2, izSwing: 64.8, izContact: 72.4, whiff: 36.8, fps: 42.4, twoK: 34 },
  { name: 'Mookie Betts',   team: 'LAD', pos: '2B', chase: 18.4, izSwing: 72.2, izContact: 87.8, whiff: 20.6, fps: 26.2, twoK: 72 },
  { name: 'Ronald Acuna Jr', team: 'ATL', pos: 'RF', chase: 20.2, izSwing: 71.4, izContact: 85.4, whiff: 22.8, fps: 30.8, twoK: 66 },
];

function makeZoneDecisions(chase: number, izContact: number, seed: number): ZoneDecision[] {
  return [
    {
      zone: 'heart',
      pitchesSeen: 120 + (seed % 40),
      swingPct: 78 + (seed % 12),
      contactPct: izContact + 4,
      whiffPct: Math.max(2, 100 - izContact - 4 - ((seed * 3) % 8)),
      valuePct: 62 + (seed % 15),
    },
    {
      zone: 'edge',
      pitchesSeen: 180 + (seed % 60),
      swingPct: 55 + (seed % 18),
      contactPct: izContact - 8,
      whiffPct: 100 - izContact + 8 + ((seed * 2) % 6),
      valuePct: 38 + (seed % 12),
    },
    {
      zone: 'chase',
      pitchesSeen: 140 + (seed % 50),
      swingPct: chase,
      contactPct: Math.max(30, izContact - 25),
      whiffPct: Math.min(65, 100 - izContact + 25),
      valuePct: 12 + (seed % 8),
    },
    {
      zone: 'waste',
      pitchesSeen: 80 + (seed % 30),
      swingPct: Math.max(3, chase - 10),
      contactPct: Math.max(20, izContact - 35),
      whiffPct: Math.min(80, 100 - izContact + 35),
      valuePct: 5 + (seed % 5),
    },
  ];
}

export function generateDemoSwingDecision(): SwingProfile[] {
  return HITTERS.map((h, i) => {
    const decisionScore = Math.round(100 - h.chase * 1.2 + (h.izContact - 80) * 0.8 + (h.twoK - 50) * 0.3);
    const clamped = Math.max(15, Math.min(98, decisionScore));

    return {
      id: `sd-${i}`,
      name: h.name,
      team: h.team,
      position: h.pos,
      overallGrade: gradeFromScore(clamped),
      decisionScore: clamped,
      chaseRate: h.chase,
      inZoneSwingRate: h.izSwing,
      inZoneContactRate: h.izContact,
      whiffRate: h.whiff,
      firstPitchSwingPct: h.fps,
      twoStrikeApproach: h.twoK,
      zoneDecisions: makeZoneDecisions(h.chase, h.izContact, i * 7 + 3),
      notes: h.chase <= 15
        ? `${h.name} has elite pitch recognition. Rarely chases and makes consistent hard contact in the zone.`
        : h.chase >= 30
        ? `${h.name} is an aggressive hacker. High chase rate leads to exploitable two-strike patterns.`
        : `${h.name} has a balanced approach with room for improvement on chase mitigation.`,
    };
  });
}
