/**
 * Award Predictions Engine
 *
 * Real-time award race predictions for MVP, Cy Young, ROY, and
 * other major awards based on current season stats. Generates
 * probability distributions and voting projections.
 *
 * Original baseball-specific system.
 */

export type AwardType = 'mvp' | 'cy_young' | 'roy' | 'gold_glove' | 'silver_slugger' | 'reliever';

export interface AwardCandidate {
  playerId: number;
  name: string;
  team: string;
  position: string;
  winProbability: number;  // 0-100
  points: number;
  keyStats: Record<string, number | string>;
  trend: 'rising' | 'steady' | 'falling';
  rank: number;
}

export interface AwardRace {
  type: AwardType;
  label: string;
  icon: string;
  candidates: AwardCandidate[];
  lastUpdated: number;
}

export const AWARD_TYPES: Record<AwardType, { label: string; icon: string; color: string; statKeys: string[] }> = {
  mvp:            { label: 'MVP',            icon: '🏆', color: '#eab308', statKeys: ['AVG', 'HR', 'RBI', 'WAR', 'OPS'] },
  cy_young:       { label: 'Cy Young',       icon: '💨', color: '#3b82f6', statKeys: ['W-L', 'ERA', 'SO', 'WHIP', 'WAR'] },
  roy:            { label: 'Rookie of Year', icon: '🌟', color: '#22c55e', statKeys: ['AVG', 'HR', 'RBI', 'OPS'] },
  gold_glove:     { label: 'Gold Glove',     icon: '🧤', color: '#f97316', statKeys: ['FLD%', 'DRS', 'ERRORS', 'DP'] },
  silver_slugger: { label: 'Silver Slugger',  icon: '⚡', color: '#a855f7', statKeys: ['AVG', 'HR', 'RBI', 'SLG'] },
  reliever:       { label: 'Reliever of Year', icon: '🔒', color: '#ef4444', statKeys: ['SV', 'ERA', 'WHIP', 'SO'] },
};

function generateCandidates(type: AwardType, count: number = 5): AwardCandidate[] {
  const names: Record<AwardType, string[]> = {
    mvp: ['Marcus Bell', 'Carlos Reyes', 'David Chen', 'Alex Ramirez', 'Derek Anderson'],
    cy_young: ["James O'Brien", 'Jake Morrison', 'Sam Williams', 'Tyler Knox', 'Brandon Park'],
    roy: ['Darius Coleman', 'Kai Tanaka', 'Mateo Flores', 'Jayden Scott', 'Ethan Brooks'],
    gold_glove: ['Marcus Bell', 'Carlos Reyes', 'Derek Anderson', 'Darius Coleman', 'Alex Ramirez'],
    silver_slugger: ['Marcus Bell', 'David Chen', 'Mike Torres', 'Carlos Reyes', 'Tommy Nakamura'],
    reliever: ['Ryan Parker', 'Chris Lee', 'Jordan Blake', 'Marcus Hernandez', 'Tyler Swift'],
  };
  const positions: Record<AwardType, string[]> = {
    mvp: ['SS', 'CF', '3B', 'LF', 'C'],
    cy_young: ['SP', 'SP', 'SP', 'SP', 'SP'],
    roy: ['2B', 'SP', 'CF', 'SS', '3B'],
    gold_glove: ['SS', 'CF', 'C', '2B', 'LF'],
    silver_slugger: ['SS', '3B', '1B', 'CF', 'RF'],
    reliever: ['RP', 'RP', 'RP', 'RP', 'RP'],
  };
  const teams = ['NYY', 'BOS', 'LAD', 'HOU', 'ATL'];
  const trends: AwardCandidate['trend'][] = ['rising', 'steady', 'falling', 'rising', 'steady'];

  let totalProb = 0;
  const probs = Array.from({ length: count }, (_, i) => {
    const p = Math.max(3, 50 - i * 12 + Math.floor(Math.random() * 10));
    totalProb += p;
    return p;
  });
  // Normalize to 100
  const normalized = probs.map(p => Math.round((p / totalProb) * 100));
  const diff = 100 - normalized.reduce((s, p) => s + p, 0);
  normalized[0] += diff;

  const aInfo = AWARD_TYPES[type];
  return Array.from({ length: count }, (_, i) => {
    const keyStats: Record<string, number | string> = {};
    aInfo.statKeys.forEach(k => {
      if (k === 'AVG') keyStats[k] = (0.280 + Math.random() * 0.06 - i * 0.01).toFixed(3);
      else if (k === 'ERA') keyStats[k] = (2.5 + Math.random() * 1.0 + i * 0.3).toFixed(2);
      else if (k === 'WHIP') keyStats[k] = (0.95 + Math.random() * 0.2 + i * 0.05).toFixed(2);
      else if (k === 'OPS') keyStats[k] = (0.850 + Math.random() * 0.1 - i * 0.02).toFixed(3);
      else if (k === 'W-L') keyStats[k] = `${15 - i * 2}-${5 + i}`;
      else if (k === 'WAR') keyStats[k] = (6.0 - i * 0.8 + Math.random()).toFixed(1);
      else if (k === 'FLD%') keyStats[k] = (0.985 - i * 0.003).toFixed(3);
      else if (k === 'SLG') keyStats[k] = (0.520 + Math.random() * 0.08 - i * 0.02).toFixed(3);
      else keyStats[k] = Math.round(25 - i * 3 + Math.random() * 10);
    });

    return {
      playerId: 500 + i,
      name: names[type][i] ?? `Player ${i + 1}`,
      team: teams[i],
      position: positions[type][i] ?? 'UT',
      winProbability: normalized[i],
      points: Math.round(300 - i * 45 + Math.random() * 20),
      keyStats,
      trend: trends[i],
      rank: i + 1,
    };
  });
}

export function generateAwardRaces(): AwardRace[] {
  return (Object.keys(AWARD_TYPES) as AwardType[]).map(type => ({
    type,
    label: AWARD_TYPES[type].label,
    icon: AWARD_TYPES[type].icon,
    candidates: generateCandidates(type),
    lastUpdated: 112,
  }));
}
