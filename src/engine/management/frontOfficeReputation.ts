/**
 * frontOfficeReputation.ts – Front Office Reputation System
 *
 * Evaluates the GM/front office across multiple competency dimensions:
 * Draft Acumen, Trade Savvy, Player Development, Financial Management,
 * and Clubhouse Management. Tracks league, media, and player perceptions.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type TrendDirection = 'up' | 'down' | 'stable';

export interface ReputationFactor {
  name: string;
  score: number;         // 0-100
  trend: TrendDirection;
  description: string;
}

export interface HistoricalSnapshot {
  season: number;
  overallRep: number;
  wins: number;
  losses: number;
  playoffAppearance: boolean;
}

export interface FORepProfile {
  gmName: string;
  teamName: string;
  tenure: number;            // years as GM
  overallRep: number;        // 0-100 composite
  grade: string;             // A+ through F
  factors: ReputationFactor[];
  leaguePerception: number;  // 0-100
  mediaPerception: number;   // 0-100
  playerPerception: number;  // 0-100
  history: HistoricalSnapshot[];
  headline: string;          // summary blurb
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D+';
  if (score >= 45) return 'D';
  if (score >= 40) return 'D-';
  return 'F';
}

export function getGradeColor(grade: string): string {
  if (grade.startsWith('A')) return '#22c55e';
  if (grade.startsWith('B')) return '#3b82f6';
  if (grade.startsWith('C')) return '#f59e0b';
  if (grade.startsWith('D')) return '#f97316';
  return '#ef4444';
}

export function getTrendArrow(t: TrendDirection): string {
  if (t === 'up') return '\u25B2';    // ▲
  if (t === 'down') return '\u25BC';  // ▼
  return '\u25C6';                     // ◆
}

export function getTrendColor(t: TrendDirection): string {
  if (t === 'up') return '#22c55e';
  if (t === 'down') return '#ef4444';
  return '#6b7280';
}

export function getPerceptionLabel(score: number): string {
  if (score >= 85) return 'Highly Favorable';
  if (score >= 70) return 'Favorable';
  if (score >= 55) return 'Neutral';
  if (score >= 40) return 'Skeptical';
  return 'Unfavorable';
}

export function getPerceptionColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 70) return '#3b82f6';
  if (score >= 55) return '#f59e0b';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const FACTOR_NAMES = [
  'Draft Acumen',
  'Trade Savvy',
  'Player Development',
  'Financial Management',
  'Clubhouse Mgmt',
];

const FACTOR_DESCRIPTIONS: Record<string, string> = {
  'Draft Acumen': 'Ability to identify and select talent in the amateur draft.',
  'Trade Savvy': 'Skill at negotiating trades that benefit the organization.',
  'Player Development': 'Effectiveness of the minor-league pipeline and coaching.',
  'Financial Management': 'Fiscal responsibility, payroll optimization, and ROI on contracts.',
  'Clubhouse Mgmt': 'Maintaining team chemistry, handling egos, and fostering culture.',
};

function seededRand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function pickTrend(seed: number): TrendDirection {
  const r = seededRand(seed);
  if (r < 0.35) return 'up';
  if (r < 0.65) return 'stable';
  return 'down';
}

function buildFactors(seed: number, baseline: number): ReputationFactor[] {
  return FACTOR_NAMES.map((name, i) => {
    const variance = Math.round(seededRand(seed + i * 11) * 30 - 15);
    const score = Math.max(20, Math.min(98, baseline + variance));
    return {
      name,
      score,
      trend: pickTrend(seed + i * 7 + 3),
      description: FACTOR_DESCRIPTIONS[name] ?? '',
    };
  });
}

function buildHistory(seed: number, currentOverall: number): HistoricalSnapshot[] {
  const seasons: HistoricalSnapshot[] = [];
  let rep = currentOverall - 15 + Math.round(seededRand(seed) * 10);
  for (let s = 2020; s <= 2025; s++) {
    const drift = Math.round(seededRand(seed + s * 3) * 12 - 4);
    rep = Math.max(25, Math.min(98, rep + drift));
    const wins = 65 + Math.round(seededRand(seed + s * 7) * 30);
    seasons.push({
      season: s,
      overallRep: rep,
      wins,
      losses: 162 - wins,
      playoffAppearance: wins >= 88 || seededRand(seed + s * 11) > 0.7,
    });
  }
  return seasons;
}

function generateHeadline(gmName: string, grade: string, factors: ReputationFactor[]): string {
  const best = factors.reduce((a, b) => a.score > b.score ? a : b, factors[0]);
  const worst = factors.reduce((a, b) => a.score < b.score ? a : b, factors[0]);

  if (grade.startsWith('A')) {
    return `${gmName} has built an elite front office. ${best.name} (${best.score}) leads the way.`;
  }
  if (grade.startsWith('B')) {
    return `${gmName} runs a solid operation, though ${worst.name} (${worst.score}) could use attention.`;
  }
  if (grade.startsWith('C')) {
    return `${gmName}'s tenure is mixed. Strength in ${best.name}, but ${worst.name} drags the grade.`;
  }
  return `${gmName} is under pressure. The front office needs improvement across the board.`;
}

export function generateDemoFORep(): FORepProfile {
  const seed = 42;
  const gmName = 'David Hartwell';
  const teamName = 'Chicago Cubs';
  const baseline = 72;
  const factors = buildFactors(seed, baseline);
  const overallRep = Math.round(factors.reduce((s, f) => s + f.score, 0) / factors.length);
  const grade = getGrade(overallRep);

  return {
    gmName,
    teamName,
    tenure: 5,
    overallRep,
    grade,
    factors,
    leaguePerception: 68 + Math.round(seededRand(seed + 100) * 20),
    mediaPerception: 55 + Math.round(seededRand(seed + 200) * 25),
    playerPerception: 60 + Math.round(seededRand(seed + 300) * 22),
    history: buildHistory(seed, overallRep),
    headline: generateHeadline(gmName, grade, factors),
  };
}
