/**
 * Player Conditioning & Fatigue System
 *
 * Tracks player energy, stamina, and conditioning over the
 * grueling 162-game season. Manages rest days, load management,
 * and the physical toll of daily baseball.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type FatigueLevel = 'fresh' | 'rested' | 'normal' | 'tired' | 'exhausted' | 'injured_risk';

export const FATIGUE_DISPLAY: Record<FatigueLevel, { label: string; emoji: string; color: string; ovrMod: number }> = {
  fresh:        { label: 'Fresh',         emoji: '💪', color: '#22c55e', ovrMod: 2 },
  rested:       { label: 'Rested',        emoji: '✅', color: '#3b82f6', ovrMod: 1 },
  normal:       { label: 'Normal',        emoji: '➖', color: '#6b7280', ovrMod: 0 },
  tired:        { label: 'Tired',         emoji: '😓', color: '#eab308', ovrMod: -2 },
  exhausted:    { label: 'Exhausted',     emoji: '🥵', color: '#f97316', ovrMod: -5 },
  injured_risk: { label: 'Injury Risk',   emoji: '🚨', color: '#ef4444', ovrMod: -8 },
};

export interface ConditioningPlayer {
  id: number;
  name: string;
  pos: string;
  overall: number;
  adjustedOvr: number;
  age: number;
  energy: number;           // 0-100
  stamina: number;          // 20-80 scale, base attribute
  durability: number;       // 20-80 scale
  gamesPlayed: number;
  consecutiveStarts: number;
  daysSinceRest: number;
  fatigueLevel: FatigueLevel;
  restRecommendation: 'none' | 'optional' | 'recommended' | 'mandatory';
  injuryRisk: number;       // 0-100 percentage
  seasonWorkload: number;   // PA or IP total
  isPitcher: boolean;
}

export interface ConditioningSummary {
  freshCount: number;
  restedCount: number;
  normalCount: number;
  tiredCount: number;
  exhaustedCount: number;
  injuryRiskCount: number;
  avgEnergy: number;
  restDaysNeeded: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getFatigueLevel(energy: number): FatigueLevel {
  if (energy >= 90) return 'fresh';
  if (energy >= 75) return 'rested';
  if (energy >= 55) return 'normal';
  if (energy >= 35) return 'tired';
  if (energy >= 15) return 'exhausted';
  return 'injured_risk';
}

export function getRestRecommendation(player: ConditioningPlayer): 'none' | 'optional' | 'recommended' | 'mandatory' {
  if (player.energy < 15) return 'mandatory';
  if (player.energy < 35 || player.consecutiveStarts >= 20) return 'recommended';
  if (player.energy < 55 || player.consecutiveStarts >= 14) return 'optional';
  return 'none';
}

export function calculateInjuryRisk(player: ConditioningPlayer): number {
  let risk = 0;
  // Age factor
  if (player.age >= 35) risk += 20;
  else if (player.age >= 32) risk += 10;
  else if (player.age >= 28) risk += 5;

  // Energy factor
  risk += Math.max(0, (50 - player.energy));

  // Durability attribute (inverse — lower durability = more risk)
  risk += Math.max(0, (50 - player.durability) * 0.5);

  // Consecutive starts
  if (player.consecutiveStarts >= 20) risk += 15;
  else if (player.consecutiveStarts >= 14) risk += 8;

  return Math.min(95, Math.max(2, Math.round(risk)));
}

export function getConditioningSummary(players: ConditioningPlayer[]): ConditioningSummary {
  const freshCount = players.filter(p => p.fatigueLevel === 'fresh').length;
  const restedCount = players.filter(p => p.fatigueLevel === 'rested').length;
  const normalCount = players.filter(p => p.fatigueLevel === 'normal').length;
  const tiredCount = players.filter(p => p.fatigueLevel === 'tired').length;
  const exhaustedCount = players.filter(p => p.fatigueLevel === 'exhausted').length;
  const injuryRiskCount = players.filter(p => p.fatigueLevel === 'injured_risk').length;
  const avgEnergy = Math.round(players.reduce((s, p) => s + p.energy, 0) / players.length);
  const restDaysNeeded = players.filter(p => p.restRecommendation === 'recommended' || p.restRecommendation === 'mandatory').length;

  return { freshCount, restedCount, normalCount, tiredCount, exhaustedCount, injuryRiskCount, avgEnergy, restDaysNeeded };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_PLAYERS = [
  { name: 'Aaron Judge',       pos: 'RF',  age: 33, ovr: 92, energy: 42, stam: 65, dur: 55, gp: 128, con: 18, rest: 3, pa: 520, pitcher: false },
  { name: 'Marcus Semien',     pos: '2B',  age: 33, ovr: 82, energy: 88, stam: 75, dur: 72, gp: 140, con: 2, rest: 0, pa: 580, pitcher: false },
  { name: 'Jose Ramirez',      pos: '3B',  age: 32, ovr: 88, energy: 72, stam: 78, dur: 80, gp: 145, con: 12, rest: 1, pa: 590, pitcher: false },
  { name: 'Salvador Perez',    pos: 'C',   age: 34, ovr: 78, energy: 28, stam: 60, dur: 50, gp: 120, con: 22, rest: 5, pa: 480, pitcher: false },
  { name: 'Julio Rodriguez',   pos: 'CF',  age: 24, ovr: 85, energy: 95, stam: 72, dur: 70, gp: 148, con: 5, rest: 0, pa: 610, pitcher: false },
  { name: 'Pete Alonso',       pos: '1B',  age: 30, ovr: 80, energy: 65, stam: 70, dur: 68, gp: 138, con: 10, rest: 2, pa: 555, pitcher: false },
  { name: 'Corbin Carroll',    pos: 'LF',  age: 24, ovr: 79, energy: 82, stam: 68, dur: 62, gp: 142, con: 6, rest: 0, pa: 570, pitcher: false },
  { name: 'Adley Rutschman',   pos: 'C',   age: 27, ovr: 83, energy: 55, stam: 65, dur: 65, gp: 130, con: 14, rest: 3, pa: 500, pitcher: false },
  { name: 'Gerrit Cole',       pos: 'SP',  age: 34, ovr: 89, energy: 35, stam: 72, dur: 58, gp: 28, con: 1, rest: 4, pa: 170, pitcher: true },
  { name: 'Zack Wheeler',      pos: 'SP',  age: 34, ovr: 86, energy: 48, stam: 78, dur: 60, gp: 30, con: 1, rest: 3, pa: 185, pitcher: true },
  { name: 'Logan Webb',        pos: 'SP',  age: 27, ovr: 83, energy: 78, stam: 80, dur: 75, gp: 30, con: 1, rest: 1, pa: 190, pitcher: true },
  { name: 'Emmanuel Clase',    pos: 'CL',  age: 26, ovr: 84, energy: 12, stam: 55, dur: 60, gp: 65, con: 8, rest: 0, pa: 62, pitcher: true },
];

export function generateDemoConditioning(): ConditioningPlayer[] {
  return DEMO_PLAYERS.map((p, i) => {
    const fatigueLevel = getFatigueLevel(p.energy);
    const ovrMod = FATIGUE_DISPLAY[fatigueLevel].ovrMod;
    const player: ConditioningPlayer = {
      id: i,
      name: p.name,
      pos: p.pos,
      overall: p.ovr,
      adjustedOvr: Math.max(40, p.ovr + ovrMod),
      age: p.age,
      energy: p.energy,
      stamina: p.stam,
      durability: p.dur,
      gamesPlayed: p.gp,
      consecutiveStarts: p.con,
      daysSinceRest: p.rest,
      fatigueLevel,
      restRecommendation: 'none',
      injuryRisk: 0,
      seasonWorkload: p.pa,
      isPitcher: p.pitcher,
    };
    player.restRecommendation = getRestRecommendation(player);
    player.injuryRisk = calculateInjuryRisk(player);
    return player;
  });
}
