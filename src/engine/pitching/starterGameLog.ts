/**
 * Starter Game Log — Mr. Baseball Dynasty
 *
 * Detailed game-by-game log for starting pitchers tracking results,
 * innings pitched, pitch counts, game scores, quality starts, and
 * rolling ERA calculations. Provides season-level aggregation.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GameLogEntry {
  date: string;
  opponent: string;
  result: 'W' | 'L' | 'ND';
  ip: number;
  hits: number;
  runs: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  pitchCount: number;
  era: number;
  gameScore: number;
  qualityStart: boolean;
}

export interface StarterGameLogData {
  pitcherId: number;
  name: string;
  entries: GameLogEntry[];
  seasonERA: number;
  seasonIP: number;
  totalQS: number;
  avgGameScore: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OPPONENTS = [
  'NYY', 'BOS', 'TBR', 'BAL', 'TOR', 'CHW', 'CLE', 'DET', 'KCR', 'MIN',
  'HOU', 'LAA', 'OAK', 'SEA', 'TEX', 'ATL', 'MIA', 'NYM', 'PHI', 'WSN',
  'CHC', 'CIN', 'MIL', 'PIT', 'STL', 'ARI', 'COL', 'LAD', 'SDP', 'SFG',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Game Score (Bill James formula): 50 + IP*3 + K - H*2 - ER*4 - BB*2 + bonus for 0 ER */
function calcGameScore(ip: number, k: number, h: number, er: number, bb: number): number {
  const fullInnings = Math.floor(ip);
  const partialOuts = Math.round((ip - fullInnings) * 10);
  const totalOuts = fullInnings * 3 + partialOuts;
  let gs = 50;
  gs += totalOuts;           // 1 point per out
  gs += k;                   // 1 per K
  gs -= h * 2;               // -2 per hit
  gs -= er * 4;              // -4 per ER
  gs -= bb * 2;              // -2 per BB
  if (er === 0 && totalOuts >= 18) gs += 5; // shutout bonus
  return clamp(Math.round(gs), 0, 105);
}

function formatIP(outs: number): number {
  const full = Math.floor(outs / 3);
  const partial = outs % 3;
  return parseFloat(`${full}.${partial}`);
}

function generateEntries(seed: number, skill: number, count: number): GameLogEntry[] {
  const rand = seededRandom(seed);
  const entries: GameLogEntry[] = [];
  let totalER = 0;
  let totalOuts = 0;

  const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

  for (let i = 0; i < count; i++) {
    const monthIdx = Math.min(5, Math.floor(i / 5));
    const day = clamp(Math.floor(rand() * 28) + 1, 1, 28);
    const date = `${months[monthIdx]} ${day}`;
    const opponent = OPPONENTS[Math.floor(rand() * OPPONENTS.length)]!;

    // Higher skill = more outs, fewer hits/runs
    const skillFactor = skill / 80;
    const outsRecorded = clamp(Math.floor(15 + rand() * 12 * skillFactor), 3, 27);
    const ip = formatIP(outsRecorded);

    const hits = clamp(Math.floor((1 - skillFactor * 0.3) * (3 + rand() * 8)), 0, 14);
    const walks = clamp(Math.floor(rand() * 5 * (1 - skillFactor * 0.2)), 0, 7);
    const earnedRuns = clamp(Math.floor(rand() * 6 * (1 - skillFactor * 0.35)), 0, 10);
    const runs = earnedRuns + (rand() > 0.85 ? 1 : 0);
    const strikeouts = clamp(Math.floor(2 + rand() * 10 * skillFactor), 0, 15);
    const pitchCount = clamp(Math.floor(outsRecorded * 4.5 + rand() * 20), 50, 120);

    totalER += earnedRuns;
    totalOuts += outsRecorded;
    const era = totalOuts > 0 ? (totalER * 27) / totalOuts : 0;
    const gameScore = calcGameScore(ip, strikeouts, hits, earnedRuns, walks);
    const qualityStart = outsRecorded >= 18 && earnedRuns <= 3;

    // Determine result based on earned runs and randomness
    let result: 'W' | 'L' | 'ND';
    if (earnedRuns <= 2 && rand() > 0.3) result = 'W';
    else if (earnedRuns >= 5 && rand() > 0.3) result = 'L';
    else if (earnedRuns <= 3 && rand() > 0.5) result = 'W';
    else if (earnedRuns >= 4) result = 'L';
    else result = 'ND';

    entries.push({
      date,
      opponent,
      result,
      ip,
      hits,
      runs,
      earnedRuns,
      walks,
      strikeouts,
      pitchCount,
      era: parseFloat(era.toFixed(2)),
      gameScore,
      qualityStart,
    });
  }

  return entries;
}

// ─── Demo Data Generator ──────────────────────────────────────────────────────

export function generateDemoStarterGameLog(): StarterGameLogData[] {
  const pitchers: Array<{ id: number; name: string; skill: number; starts: number }> = [
    { id: 201, name: 'Marcus Rivera', skill: 82, starts: 30 },
    { id: 202, name: 'Takeshi Yamamoto', skill: 76, starts: 28 },
    { id: 203, name: 'Clayton Webb', skill: 71, starts: 26 },
    { id: 204, name: 'Dustin Kowalski', skill: 65, starts: 24 },
    { id: 205, name: 'Andre Washington', skill: 60, starts: 22 },
  ];

  return pitchers.map(p => {
    const entries = generateEntries(p.id * 137, p.skill, p.starts);
    const totalOuts = entries.reduce((s, e) => {
      const full = Math.floor(e.ip);
      const partial = Math.round((e.ip - full) * 10);
      return s + full * 3 + partial;
    }, 0);
    const totalER = entries.reduce((s, e) => s + e.earnedRuns, 0);
    const seasonERA = totalOuts > 0 ? parseFloat(((totalER * 27) / totalOuts).toFixed(2)) : 0;
    const seasonIP = formatIP(totalOuts);
    const totalQS = entries.filter(e => e.qualityStart).length;
    const avgGameScore = entries.length > 0
      ? parseFloat((entries.reduce((s, e) => s + e.gameScore, 0) / entries.length).toFixed(1))
      : 0;

    return {
      pitcherId: p.id,
      name: p.name,
      entries,
      seasonERA,
      seasonIP,
      totalQS,
      avgGameScore,
    };
  });
}
