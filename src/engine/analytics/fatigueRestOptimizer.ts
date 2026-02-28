/**
 * Player Fatigue & Rest Optimizer — Mr. Baseball Dynasty
 *
 * Tracks cumulative fatigue for position players and pitchers, recommends
 * optimal rest days, and models performance decline curves under fatigue.
 *
 * Key systems:
 *   - Fatigue accumulation: games played, pitch counts, innings, age factor
 *   - Rest recommendation: when to bench a player for maximum long-term output
 *   - Performance decline curves: how stats degrade as fatigue increases
 *   - 7-day rest schedule: optimized day-off suggestions
 *   - Injury risk multiplier: fatigue increases injury probability
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlayerType = 'hitter' | 'starter' | 'reliever';
export type FatigueLevel = 'fresh' | 'rested' | 'normal' | 'tired' | 'exhausted' | 'danger';
export type RestUrgency = 'none' | 'optional' | 'recommended' | 'urgent' | 'mandatory';

export interface FatiguePlayer {
  id: number;
  name: string;
  position: string;
  playerType: PlayerType;
  age: number;
  overall: number;
  // Fatigue metrics
  fatigueScore: number;         // 0-100 (0 = fresh, 100 = depleted)
  fatigueLevel: FatigueLevel;
  restUrgency: RestUrgency;
  // Workload context
  gamesPlayed: number;          // season total
  consecutiveGames: number;     // current streak without rest
  daysSinceRest: number;
  seasonWorkload: number;       // 0-100 normalized workload
  // Pitcher-specific
  pitchCount7Day?: number;      // last 7 days
  inningsPitched?: number;      // season IP
  avgPitchesPerStart?: number;
  // Hitter-specific
  plateAppearances?: number;    // season PA
  // Performance impact
  currentOVR: number;           // fatigue-adjusted overall
  ovrLoss: number;              // how much OVR lost to fatigue
  performanceMultiplier: number; // 0.0-1.0 (1.0 = no fatigue effect)
  // Risk
  injuryRiskMultiplier: number; // 1.0 = baseline, higher = more risk
  injuryHistory: number;        // prior injuries (0-5 scale)
  // Recommendation
  recommendedRestDays: number;
  nextSuggestedRest: string;    // e.g. "Tomorrow" or "In 3 days"
}

export interface PerformanceCurvePoint {
  fatigueLevel: number;       // 0-100
  ovrMultiplier: number;      // 0.0-1.0
  avgMultiplier: number;      // batting avg or ERA multiplier
  powerMultiplier: number;    // ISO or K/9 multiplier
  injuryRisk: number;         // injury probability multiplier
}

export interface PerformanceCurve {
  label: string;
  color: string;
  playerType: PlayerType;
  points: PerformanceCurvePoint[];
}

export interface RestScheduleDay {
  dayLabel: string;           // e.g. "Mon 7/14"
  dayOfWeek: string;
  isDoubleHeader: boolean;
  opponent: string;
  restingPlayers: Array<{
    id: number;
    name: string;
    position: string;
    reason: string;
  }>;
  availableCount: number;
  totalRosterSize: number;
}

export interface FatigueData {
  players: FatiguePlayer[];
  restSchedule: RestScheduleDay[];
  performanceCurves: PerformanceCurve[];
  teamFatigueAvg: number;
  freshCount: number;
  tiredCount: number;
  dangerCount: number;
  gamesIntoSeason: number;
  totalGames: number;
}

export const FATIGUE_DISPLAY: Record<FatigueLevel, { label: string; color: string }> = {
  fresh:     { label: 'FRESH',     color: '#22c55e' },
  rested:    { label: 'RESTED',    color: '#4ade80' },
  normal:    { label: 'NORMAL',    color: '#f59e0b' },
  tired:     { label: 'TIRED',     color: '#f97316' },
  exhausted: { label: 'EXHAUSTED', color: '#ef4444' },
  danger:    { label: 'DANGER',    color: '#dc2626' },
};

export const URGENCY_DISPLAY: Record<RestUrgency, { label: string; color: string }> = {
  none:        { label: 'NONE',        color: '#22c55e' },
  optional:    { label: 'OPTIONAL',    color: '#60a5fa' },
  recommended: { label: 'RECOMMENDED', color: '#f59e0b' },
  urgent:      { label: 'URGENT',      color: '#f97316' },
  mandatory:   { label: 'MANDATORY',   color: '#ef4444' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getFatigueLevel(score: number): FatigueLevel {
  if (score <= 15) return 'fresh';
  if (score <= 30) return 'rested';
  if (score <= 50) return 'normal';
  if (score <= 70) return 'tired';
  if (score <= 85) return 'exhausted';
  return 'danger';
}

function getRestUrgency(score: number, consecutive: number, age: number): RestUrgency {
  const ageFactor = age >= 35 ? 15 : age >= 32 ? 8 : 0;
  const adjusted = score + ageFactor + (consecutive > 12 ? 10 : 0);
  if (adjusted <= 25) return 'none';
  if (adjusted <= 45) return 'optional';
  if (adjusted <= 65) return 'recommended';
  if (adjusted <= 82) return 'urgent';
  return 'mandatory';
}

function getPerformanceMultiplier(fatigue: number): number {
  // Performance starts declining around 30 fatigue, accelerates after 60
  if (fatigue <= 20) return 1.0;
  if (fatigue <= 40) return 1.0 - (fatigue - 20) * 0.003;
  if (fatigue <= 60) return 0.94 - (fatigue - 40) * 0.005;
  if (fatigue <= 80) return 0.84 - (fatigue - 60) * 0.008;
  return 0.68 - (fatigue - 80) * 0.012;
}

function getInjuryRiskMultiplier(fatigue: number, age: number, history: number): number {
  const baseFatigueRisk = 1.0 + (fatigue / 100) * 2.5;
  const ageFactor = age >= 35 ? 1.6 : age >= 32 ? 1.3 : age >= 29 ? 1.1 : 1.0;
  const historyFactor = 1.0 + history * 0.25;
  return Math.round(baseFatigueRisk * ageFactor * historyFactor * 100) / 100;
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

interface PlayerSeed {
  name: string; pos: string; type: PlayerType; age: number; ovr: number;
  fatigue: number; gp: number; consec: number; daysSince: number;
  workload: number; injHist: number;
  pc7d?: number; ip?: number; avgPitch?: number; pa?: number;
}

const PLAYER_SEEDS: PlayerSeed[] = [
  // Hitters
  { name: 'Marcus Rivera',    pos: 'SS', type: 'hitter', age: 27, ovr: 86, fatigue: 22, gp: 118, consec: 8,  daysSince: 8,  workload: 78, injHist: 0, pa: 498 },
  { name: 'Jaylen Torres',    pos: '3B', type: 'hitter', age: 30, ovr: 82, fatigue: 55, gp: 125, consec: 18, daysSince: 18, workload: 85, injHist: 1, pa: 530 },
  { name: 'Derek Washington', pos: 'CF', type: 'hitter', age: 34, ovr: 78, fatigue: 72, gp: 120, consec: 14, daysSince: 14, workload: 82, injHist: 3, pa: 505 },
  { name: 'Carlos Mendoza',   pos: '1B', type: 'hitter', age: 29, ovr: 84, fatigue: 38, gp: 115, consec: 6,  daysSince: 6,  workload: 74, injHist: 0, pa: 485 },
  { name: 'Ryan Nakamura',    pos: 'RF', type: 'hitter', age: 25, ovr: 80, fatigue: 18, gp: 100, consec: 4,  daysSince: 4,  workload: 65, injHist: 0, pa: 420 },
  { name: 'Brett Sullivan',   pos: 'C',  type: 'hitter', age: 32, ovr: 76, fatigue: 68, gp: 105, consec: 10, daysSince: 10, workload: 80, injHist: 2, pa: 400 },
  { name: 'Andre Jackson',    pos: 'LF', type: 'hitter', age: 28, ovr: 81, fatigue: 45, gp: 122, consec: 12, daysSince: 12, workload: 80, injHist: 1, pa: 515 },
  { name: 'Tommy Whitfield',  pos: '2B', type: 'hitter', age: 36, ovr: 73, fatigue: 82, gp: 110, consec: 9,  daysSince: 9,  workload: 76, injHist: 4, pa: 445 },
  { name: 'Isaiah Park',      pos: 'DH', type: 'hitter', age: 31, ovr: 79, fatigue: 35, gp: 108, consec: 5,  daysSince: 5,  workload: 70, injHist: 1, pa: 455 },
  // Starters
  { name: 'Garrett Cole',     pos: 'SP', type: 'starter',  age: 29, ovr: 88, fatigue: 42, gp: 27,  consec: 0, daysSince: 4, workload: 82, injHist: 0, pc7d: 108, ip: 172.1, avgPitch: 96 },
  { name: 'Luis Espinoza',    pos: 'SP', type: 'starter',  age: 26, ovr: 85, fatigue: 28, gp: 25,  consec: 0, daysSince: 5, workload: 75, injHist: 0, pc7d: 94,  ip: 158.0, avgPitch: 92 },
  { name: 'David Kim',        pos: 'SP', type: 'starter',  age: 33, ovr: 82, fatigue: 65, gp: 28,  consec: 0, daysSince: 3, workload: 88, injHist: 2, pc7d: 115, ip: 180.2, avgPitch: 99 },
  { name: 'Jake Morrison',    pos: 'SP', type: 'starter',  age: 24, ovr: 78, fatigue: 48, gp: 22,  consec: 0, daysSince: 4, workload: 68, injHist: 0, pc7d: 102, ip: 132.0, avgPitch: 88 },
  { name: 'Omar Vasquez',     pos: 'SP', type: 'starter',  age: 37, ovr: 75, fatigue: 88, gp: 26,  consec: 0, daysSince: 2, workload: 90, injHist: 3, pc7d: 120, ip: 155.1, avgPitch: 94 },
  // Relievers
  { name: 'Tyler Banks',      pos: 'RP', type: 'reliever', age: 30, ovr: 77, fatigue: 58, gp: 55,  consec: 3, daysSince: 0, workload: 78, injHist: 1, pc7d: 65,  ip: 58.2, avgPitch: 20 },
  { name: 'Hector Ruiz',      pos: 'CL', type: 'reliever', age: 28, ovr: 83, fatigue: 32, gp: 48,  consec: 1, daysSince: 1, workload: 70, injHist: 0, pc7d: 42,  ip: 52.0, avgPitch: 18 },
  { name: 'Chris Donovan',    pos: 'RP', type: 'reliever', age: 35, ovr: 72, fatigue: 75, gp: 60,  consec: 4, daysSince: 0, workload: 85, injHist: 2, pc7d: 80,  ip: 62.1, avgPitch: 22 },
  { name: 'Sam Okafor',       pos: 'RP', type: 'reliever', age: 27, ovr: 74, fatigue: 40, gp: 45,  consec: 2, daysSince: 1, workload: 65, injHist: 0, pc7d: 48,  ip: 48.0, avgPitch: 19 },
];

const SCHEDULE_DATA: Array<{ day: string; dow: string; dh: boolean; opp: string }> = [
  { day: 'Mon 8/18', dow: 'Mon', dh: false, opp: 'vs BOS' },
  { day: 'Tue 8/19', dow: 'Tue', dh: false, opp: 'vs BOS' },
  { day: 'Wed 8/20', dow: 'Wed', dh: true,  opp: 'vs BOS (DH)' },
  { day: 'Thu 8/21', dow: 'Thu', dh: false, opp: '@ NYM' },
  { day: 'Fri 8/22', dow: 'Fri', dh: false, opp: '@ NYM' },
  { day: 'Sat 8/23', dow: 'Sat', dh: false, opp: '@ NYM' },
  { day: 'Sun 8/24', dow: 'Sun', dh: false, opp: '@ NYM' },
];

function getRestDays(fatigue: number, consec: number, age: number): number {
  if (fatigue >= 80) return 3;
  if (fatigue >= 65) return 2;
  if (fatigue >= 50 && age >= 32) return 2;
  if (fatigue >= 45) return 1;
  if (consec >= 15) return 1;
  return 0;
}

function getNextRestLabel(restDays: number, fatigue: number): string {
  if (fatigue >= 80) return 'TODAY';
  if (fatigue >= 65) return 'Tomorrow';
  if (fatigue >= 50) return 'In 2 days';
  if (restDays > 0) return 'In 3 days';
  return 'Not needed';
}

function buildPerformanceCurves(): PerformanceCurve[] {
  const points = (type: PlayerType): PerformanceCurvePoint[] => {
    const result: PerformanceCurvePoint[] = [];
    for (let f = 0; f <= 100; f += 5) {
      const perfMult = getPerformanceMultiplier(f);
      // Hitters lose AVG faster; pitchers lose K rate
      const avgMult = type === 'hitter'
        ? (1.0 - Math.max(0, (f - 25) / 100) * 0.35)
        : (1.0 + Math.max(0, (f - 30) / 100) * 0.45); // ERA goes up
      const powerMult = type === 'hitter'
        ? (1.0 - Math.max(0, (f - 20) / 100) * 0.40)
        : (1.0 - Math.max(0, (f - 30) / 100) * 0.30); // K rate drops
      const injRisk = getInjuryRiskMultiplier(f, 30, 1);
      result.push({
        fatigueLevel: f,
        ovrMultiplier: Math.round(perfMult * 1000) / 1000,
        avgMultiplier: Math.round(avgMult * 1000) / 1000,
        powerMultiplier: Math.round(powerMult * 1000) / 1000,
        injuryRisk: Math.round(injRisk * 100) / 100,
      });
    }
    return result;
  };

  return [
    { label: 'Position Player Fatigue Curve',  color: '#3b82f6', playerType: 'hitter',   points: points('hitter') },
    { label: 'Starting Pitcher Fatigue Curve', color: '#22c55e', playerType: 'starter',  points: points('starter') },
    { label: 'Reliever Fatigue Curve',         color: '#f59e0b', playerType: 'reliever', points: points('reliever') },
  ];
}

export function generateDemoFatigueRest(): FatigueData {
  const players: FatiguePlayer[] = PLAYER_SEEDS.map((seed, i) => {
    const perfMult = getPerformanceMultiplier(seed.fatigue);
    const ovrLoss = Math.round(seed.ovr * (1 - perfMult));
    const currentOVR = seed.ovr - ovrLoss;
    const restDays = getRestDays(seed.fatigue, seed.consec, seed.age);
    const fatigueLevel = getFatigueLevel(seed.fatigue);
    const restUrgency = getRestUrgency(seed.fatigue, seed.consec, seed.age);

    return {
      id: i,
      name: seed.name,
      position: seed.pos,
      playerType: seed.type,
      age: seed.age,
      overall: seed.ovr,
      fatigueScore: seed.fatigue,
      fatigueLevel,
      restUrgency,
      gamesPlayed: seed.gp,
      consecutiveGames: seed.consec,
      daysSinceRest: seed.daysSince,
      seasonWorkload: seed.workload,
      pitchCount7Day: seed.pc7d,
      inningsPitched: seed.ip,
      avgPitchesPerStart: seed.avgPitch,
      plateAppearances: seed.pa,
      currentOVR,
      ovrLoss,
      performanceMultiplier: Math.round(perfMult * 1000) / 1000,
      injuryRiskMultiplier: getInjuryRiskMultiplier(seed.fatigue, seed.age, seed.injHist),
      injuryHistory: seed.injHist,
      recommendedRestDays: restDays,
      nextSuggestedRest: getNextRestLabel(restDays, seed.fatigue),
    };
  });

  // Build 7-day rest schedule
  const tiredPlayers = [...players].sort((a, b) => b.fatigueScore - a.fatigueScore);
  const restSchedule: RestScheduleDay[] = SCHEDULE_DATA.map((day, dayIdx) => {
    // Assign rest to the most fatigued players, staggered across the week
    const resting: RestScheduleDay['restingPlayers'] = [];
    for (const p of tiredPlayers) {
      if (p.recommendedRestDays <= 0) continue;
      // Distribute rest days across the week
      const restDay = (p.id + dayIdx) % 7;
      if (restDay < p.recommendedRestDays) {
        const reasons: Record<string, string> = {
          danger:    'Mandatory rest — injury risk critical',
          exhausted: 'High fatigue — performance severely impacted',
          tired:     'Accumulated fatigue — preventive rest day',
          normal:    'Scheduled maintenance day',
        };
        resting.push({
          id: p.id,
          name: p.name,
          position: p.position,
          reason: reasons[p.fatigueLevel] ?? 'Routine rest',
        });
      }
    }

    return {
      dayLabel: day.day,
      dayOfWeek: day.dow,
      isDoubleHeader: day.dh,
      opponent: day.opp,
      restingPlayers: resting,
      availableCount: players.length - resting.length,
      totalRosterSize: players.length,
    };
  });

  const performanceCurves = buildPerformanceCurves();

  return {
    players,
    restSchedule,
    performanceCurves,
    teamFatigueAvg: Math.round(players.reduce((s, p) => s + p.fatigueScore, 0) / players.length),
    freshCount: players.filter(p => p.fatigueLevel === 'fresh' || p.fatigueLevel === 'rested').length,
    tiredCount: players.filter(p => p.fatigueLevel === 'tired' || p.fatigueLevel === 'exhausted').length,
    dangerCount: players.filter(p => p.fatigueLevel === 'danger').length,
    gamesIntoSeason: 130,
    totalGames: 162,
  };
}
