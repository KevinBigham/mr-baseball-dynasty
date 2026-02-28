/**
 * gamePaceAnalysis.ts – Game Pace & Time of Game Analysis
 *
 * Tracks game duration, pitch pace, pitch clock violations,
 * and time-per-inning metrics for team-level pace profiling.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GamePaceEntry {
  date: string;
  opponent: string;
  gameTime: number;           // total minutes
  pitchesThrown: number;
  inningsPlayed: number;
  pacePerInning: number;      // minutes per inning
  pitchClockViolations: number;
}

export interface TeamPaceProfile {
  teamName: string;
  avgGameTime: number;        // minutes
  avgPace: number;            // avg minutes per inning
  fastestGame: GamePaceEntry;
  slowestGame: GamePaceEntry;
  entries: GamePaceEntry[];
  leagueRank: number;         // 1 = fastest
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface PaceSummary {
  avgGameTime: number;
  leagueRank: number;
  fastestGameTime: number;
  slowestGameTime: number;
  totalViolations: number;
  avgPitchesPerGame: number;
  leagueAvgGameTime: number;
}

export function getPaceSummary(profile: TeamPaceProfile): PaceSummary {
  const n = profile.entries.length;
  const totalPitches = profile.entries.reduce((s, e) => s + e.pitchesThrown, 0);
  const totalViolations = profile.entries.reduce((s, e) => s + e.pitchClockViolations, 0);

  return {
    avgGameTime: profile.avgGameTime,
    leagueRank: profile.leagueRank,
    fastestGameTime: profile.fastestGame.gameTime,
    slowestGameTime: profile.slowestGame.gameTime,
    totalViolations: totalViolations,
    avgPitchesPerGame: Math.round(totalPitches / n),
    leagueAvgGameTime: 162,   // league average ~2:42 = 162 min
  };
}

// ─── Pace Color ─────────────────────────────────────────────────────────────

export function paceColor(minutes: number): string {
  if (minutes <= 145) return '#22c55e';
  if (minutes <= 155) return '#4ade80';
  if (minutes <= 165) return '#facc15';
  if (minutes <= 175) return '#f97316';
  return '#ef4444';
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

const OPPONENTS = [
  'NYY', 'BOS', 'TBR', 'BAL', 'TOR',
  'CLE', 'MIN', 'CHW', 'DET', 'KCR',
  'HOU', 'SEA', 'TEX', 'LAA', 'OAK',
  'ATL', 'NYM', 'PHI', 'MIA', 'WSN',
];

function seededRand(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function makeEntry(index: number): GamePaceEntry {
  const r = (offset: number) => seededRand(index * 31 + offset);

  const innings = r(1) > 0.85 ? Math.floor(10 + r(2) * 3) : 9;
  const basePace = 15 + r(3) * 8;           // 15-23 min per inning
  const pacePerInning = Math.round(basePace * 10) / 10;
  const gameTime = Math.round(pacePerInning * innings);
  const pitchesPerInning = 14 + Math.floor(r(4) * 6);
  const pitchesThrown = pitchesPerInning * innings + Math.floor(r(5) * 20);
  const violations = r(6) > 0.7 ? Math.floor(1 + r(7) * 3) : 0;
  const month = 4 + Math.floor(index / 5);
  const day = 1 + (index * 3) % 28;
  const dateStr = `2025-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    date: dateStr,
    opponent: OPPONENTS[index % OPPONENTS.length],
    gameTime,
    pitchesThrown,
    inningsPlayed: innings,
    pacePerInning,
    pitchClockViolations: violations,
  };
}

export function generateDemoGamePace(): TeamPaceProfile {
  const entries: GamePaceEntry[] = [];
  for (let i = 0; i < 20; i++) {
    entries.push(makeEntry(i));
  }

  const totalTime = entries.reduce((s, e) => s + e.gameTime, 0);
  const totalPace = entries.reduce((s, e) => s + e.pacePerInning, 0);
  const avgGameTime = Math.round(totalTime / entries.length);
  const avgPace = Math.round(totalPace / entries.length * 10) / 10;

  let fastest = entries[0];
  let slowest = entries[0];
  for (const e of entries) {
    if (e.gameTime < fastest.gameTime) fastest = e;
    if (e.gameTime > slowest.gameTime) slowest = e;
  }

  return {
    teamName: 'New York Yankees',
    avgGameTime,
    avgPace,
    fastestGame: fastest,
    slowestGame: slowest,
    entries,
    leagueRank: 8,
  };
}
