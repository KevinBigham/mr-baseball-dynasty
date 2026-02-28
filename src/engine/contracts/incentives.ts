// ─── Contract Incentives ──────────────────────────────────────────────────
// Performance-based bonus triggers for player contracts in baseball.

export interface IncentiveType {
  id: string;
  label: string;
  emoji: string;
  threshold: number;
  bonus: number; // $M
  positions: string[];
  unit: string;
}

export const INCENTIVE_TYPES: IncentiveType[] = [
  { id: 'pa', label: 'Plate Appearances', emoji: '🏏', threshold: 502, bonus: 1.0, positions: ['C','1B','2B','3B','SS','LF','CF','RF','DH'], unit: 'PA' },
  { id: 'hr', label: 'Home Runs', emoji: '💣', threshold: 30, bonus: 2.0, positions: ['C','1B','2B','3B','SS','LF','CF','RF','DH'], unit: 'HR' },
  { id: 'rbi', label: 'Runs Batted In', emoji: '💪', threshold: 100, bonus: 1.5, positions: ['C','1B','2B','3B','SS','LF','CF','RF','DH'], unit: 'RBI' },
  { id: 'avg', label: 'Batting Average', emoji: '🎯', threshold: 0.300, bonus: 2.0, positions: ['C','1B','2B','3B','SS','LF','CF','RF','DH'], unit: 'AVG' },
  { id: 'sb', label: 'Stolen Bases', emoji: '💨', threshold: 30, bonus: 1.0, positions: ['2B','SS','CF','LF','RF'], unit: 'SB' },
  { id: 'ip', label: 'Innings Pitched', emoji: '⚾', threshold: 180, bonus: 1.5, positions: ['SP'], unit: 'IP' },
  { id: 'wins', label: 'Pitcher Wins', emoji: '🏆', threshold: 15, bonus: 1.5, positions: ['SP'], unit: 'W' },
  { id: 'era', label: 'ERA Under', emoji: '📉', threshold: 3.00, bonus: 2.5, positions: ['SP','RP'], unit: 'ERA' },
  { id: 'saves', label: 'Saves', emoji: '🚪', threshold: 30, bonus: 2.0, positions: ['RP'], unit: 'SV' },
  { id: 'so', label: 'Strikeouts', emoji: '🔥', threshold: 200, bonus: 2.0, positions: ['SP'], unit: 'K' },
  { id: 'allstar', label: 'All-Star Selection', emoji: '⭐', threshold: 1, bonus: 2.5, positions: ['C','1B','2B','3B','SS','LF','CF','RF','DH','SP','RP'], unit: '' },
  { id: 'playoffs', label: 'Make Playoffs', emoji: '🏟️', threshold: 1, bonus: 1.0, positions: ['C','1B','2B','3B','SS','LF','CF','RF','DH','SP','RP'], unit: '' },
];

export interface PlayerIncentive {
  type: IncentiveType;
  current: number;
  hit: boolean;
  pctComplete: number;
}

export interface IncentiveCheckResult {
  hit: PlayerIncentive[];
  miss: PlayerIncentive[];
  totalBonus: number;
  totalPotential: number;
}

export function checkIncentives(incentives: IncentiveType[], stats: Record<string, number>): IncentiveCheckResult {
  const hit: PlayerIncentive[] = [];
  const miss: PlayerIncentive[] = [];
  let totalBonus = 0;
  let totalPotential = 0;

  for (const inc of incentives) {
    const current = stats[inc.id] ?? 0;
    let isHit: boolean;

    // ERA is "under" threshold (lower is better)
    if (inc.id === 'era') {
      isHit = current > 0 && current <= inc.threshold;
    } else {
      isHit = current >= inc.threshold;
    }

    const pctComplete = inc.id === 'era'
      ? (current > 0 ? Math.min(100, Math.round((inc.threshold / current) * 100)) : 0)
      : Math.min(100, Math.round((current / inc.threshold) * 100));

    const pi: PlayerIncentive = { type: inc, current, hit: isHit, pctComplete };
    if (isHit) {
      hit.push(pi);
      totalBonus += inc.bonus;
    } else {
      miss.push(pi);
    }
    totalPotential += inc.bonus;
  }

  return { hit, miss, totalBonus, totalPotential };
}

export function formatValue(inc: IncentiveType, value: number): string {
  if (inc.id === 'avg' || inc.id === 'era') return value.toFixed(3);
  return String(Math.round(value));
}

export function formatThreshold(inc: IncentiveType): string {
  if (inc.id === 'avg') return inc.threshold.toFixed(3);
  if (inc.id === 'era') return `≤${inc.threshold.toFixed(2)}`;
  if (inc.id === 'allstar' || inc.id === 'playoffs') return 'Yes';
  return `${inc.threshold}+`;
}

// ─── Demo data ────────────────────────────────────────────────────────────

export interface DemoIncentivePlayer {
  id: number;
  name: string;
  pos: string;
  salary: number;
  incentives: IncentiveType[];
  stats: Record<string, number>;
  result: IncentiveCheckResult;
}

export function generateDemoIncentivePlayers(): DemoIncentivePlayer[] {
  const players: { name: string; pos: string; salary: number; incs: string[]; stats: Record<string, number> }[] = [
    { name: 'Marcus Bell', pos: '1B', salary: 22, incs: ['hr', 'rbi', 'pa', 'allstar'], stats: { hr: 32, rbi: 95, pa: 520, allstar: 1 } },
    { name: 'Carlos Reyes', pos: 'SS', salary: 18, incs: ['avg', 'sb', 'pa'], stats: { avg: 0.312, sb: 36, pa: 545 } },
    { name: "James O'Brien", pos: 'SP', salary: 28, incs: ['wins', 'so', 'ip', 'era'], stats: { wins: 14, so: 210, ip: 195, era: 2.85 } },
    { name: 'Derek Tanaka', pos: 'RP', salary: 12, incs: ['saves', 'era'], stats: { saves: 28, era: 3.15 } },
    { name: 'Ryan Mitchell', pos: 'CF', salary: 15, incs: ['hr', 'sb', 'allstar', 'playoffs'], stats: { hr: 22, sb: 18, allstar: 0, playoffs: 1 } },
  ];

  return players.map((p, i) => {
    const incentives = p.incs.map(id => INCENTIVE_TYPES.find(t => t.id === id)!);
    const result = checkIncentives(incentives, p.stats);
    return { id: i + 1, name: p.name, pos: p.pos, salary: p.salary, incentives, stats: p.stats, result };
  });
}
