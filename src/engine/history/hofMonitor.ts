/**
 * Hall of Fame Monitor — Mr. Baseball Dynasty (Wave 54)
 *
 * Tracks active players' HOF candidacy metrics and probability.
 * Computes a composite HOF score from career counting stats,
 * rate stats, awards, and peak seasons. Provides comparable
 * HOF players and status classification.
 *
 * Uses the 0-550 internal attribute scale (400 = MLB avg, display as 20-80).
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface HOFMetric {
  label: string;
  value: number;
  threshold: number;    // typical HOF threshold
  pctOfThreshold: number; // 0-150+
}

export interface CareerHighlight {
  season: number;
  achievement: string;
}

export interface HOFCandidate {
  playerId: number;
  name: string;
  position: string;
  age: number;
  yearsPlayed: number;
  hofProbability: number;   // 0-100
  hofScore: number;         // 0-200
  metrics: HOFMetric[];
  highlights: CareerHighlight[];
  comparables: string[];    // historical HOF comps
  status: 'lock' | 'likely' | 'borderline' | 'longshot' | 'no_chance';
}

// ── Constants ────────────────────────────────────────────────────────────────

export const STATUS_DISPLAY: Record<HOFCandidate['status'], { label: string; color: string }> = {
  lock:       { label: 'LOCK',        color: '#f59e0b' },
  likely:     { label: 'LIKELY',      color: '#22c55e' },
  borderline: { label: 'BORDERLINE',  color: '#eab308' },
  longshot:   { label: 'LONGSHOT',    color: '#6b7280' },
  no_chance:  { label: 'NO CHANCE',   color: '#ef4444' },
};

function statusFromProbability(prob: number): HOFCandidate['status'] {
  if (prob >= 90) return 'lock';
  if (prob >= 65) return 'likely';
  if (prob >= 35) return 'borderline';
  if (prob >= 10) return 'longshot';
  return 'no_chance';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function roundTo(val: number, decimals: number): number {
  const f = Math.pow(10, decimals);
  return Math.round(val * f) / f;
}

function pick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── HOF metric thresholds ────────────────────────────────────────────────────

interface MetricTemplate {
  label: string;
  threshold: number;
  genFn: (skill: number, years: number) => number;
}

const HITTER_METRICS: MetricTemplate[] = [
  { label: 'Career WAR',    threshold: 65,   genFn: (s, y) => roundTo(y * (2 + s * 5) + rand(-3, 3), 1) },
  { label: 'Hits',          threshold: 3000, genFn: (s, y) => Math.round(y * (120 + s * 80) + rand(-50, 50)) },
  { label: 'Home Runs',     threshold: 500,  genFn: (s, y) => Math.round(y * (15 + s * 25) + rand(-10, 10)) },
  { label: 'RBIs',          threshold: 1500, genFn: (s, y) => Math.round(y * (60 + s * 60) + rand(-30, 30)) },
  { label: 'AVG',           threshold: 300,  genFn: (s) => Math.round(250 + s * 60 + rand(-10, 10)) },
  { label: 'OPS+',          threshold: 140,  genFn: (s) => Math.round(100 + s * 55 + rand(-8, 8)) },
  { label: 'All-Star Games',threshold: 10,   genFn: (s, y) => Math.round(Math.min(y, y * s * 0.8 + rand(-1, 1))) },
  { label: 'Gold Gloves',   threshold: 5,    genFn: (s, y) => Math.round(Math.max(0, y * s * 0.3 + rand(-1, 1))) },
];

const PITCHER_METRICS: MetricTemplate[] = [
  { label: 'Career WAR',    threshold: 60,   genFn: (s, y) => roundTo(y * (1.5 + s * 4.5) + rand(-3, 3), 1) },
  { label: 'Wins',          threshold: 250,  genFn: (s, y) => Math.round(y * (8 + s * 12) + rand(-5, 5)) },
  { label: 'Strikeouts',    threshold: 3000, genFn: (s, y) => Math.round(y * (120 + s * 120) + rand(-40, 40)) },
  { label: 'ERA+',          threshold: 130,  genFn: (s) => Math.round(100 + s * 45 + rand(-8, 8)) },
  { label: 'WHIP',          threshold: 115,  genFn: (s) => Math.round(130 - s * 25 + rand(-5, 5)) },
  { label: 'Cy Young Awards', threshold: 3, genFn: (s, y) => Math.round(Math.max(0, (y * s * 0.15) + rand(-0.5, 0.5))) },
  { label: 'All-Star Games',threshold: 8,    genFn: (s, y) => Math.round(Math.min(y, y * s * 0.6 + rand(-1, 1))) },
  { label: 'Complete Games', threshold: 40,  genFn: (s, y) => Math.round(Math.max(0, y * (0.5 + s * 2) + rand(-2, 2))) },
];

// ── Historical comps ─────────────────────────────────────────────────────────

const HITTER_COMPS = [
  'Derek Jeter', 'Ken Griffey Jr.', 'Chipper Jones', 'Mike Piazza',
  'Roberto Alomar', 'Craig Biggio', 'Jim Thome', 'Vladimir Guerrero',
  'Manny Ramirez', 'Edgar Martinez', 'Adrian Beltre', 'Ichiro Suzuki',
  'Albert Pujols', 'Miguel Cabrera', 'Mike Trout',
];

const PITCHER_COMPS = [
  'Pedro Martinez', 'Randy Johnson', 'Greg Maddux', 'Tom Glavine',
  'John Smoltz', 'Roy Halladay', 'Mariano Rivera', 'Trevor Hoffman',
  'Mike Mussina', 'Curt Schilling', 'Max Scherzer', 'Justin Verlander',
  'Clayton Kershaw', 'CC Sabathia', 'Jack Morris',
];

const ACHIEVEMENTS = [
  'MVP Award', 'Cy Young Award', 'All-Star Selection', 'Silver Slugger',
  'Gold Glove', 'Batting Title', 'ERA Title', 'Home Run Derby Champion',
  'World Series MVP', 'Rookie of the Year', '200-Hit Season',
  '40-HR Season', '100-RBI Season', '20-Win Season', '250-K Season',
  '30-Save Season', 'No-Hitter', 'Cycle', '3000th Hit', '500th Home Run',
];

// ── Demo data generation ─────────────────────────────────────────────────────

interface DemoPlayer {
  id: number;
  name: string;
  position: string;
  age: number;
  years: number;
  skill: number; // 0-1 (talent level)
}

const DEMO_PLAYERS: DemoPlayer[] = [
  { id: 300, name: 'Marcus Bell',      position: 'SS',  age: 36, years: 16, skill: 0.92 },
  { id: 301, name: "James O'Brien",    position: 'SP',  age: 34, years: 13, skill: 0.85 },
  { id: 302, name: 'Derek Anderson',   position: 'C',   age: 33, years: 12, skill: 0.72 },
  { id: 303, name: 'Carlos Reyes',     position: 'CF',  age: 28, years: 7,  skill: 0.78 },
  { id: 304, name: 'Jake Morrison',    position: 'SP',  age: 30, years: 9,  skill: 0.68 },
  { id: 305, name: 'Mike Torres',      position: '1B',  age: 32, years: 11, skill: 0.60 },
  { id: 306, name: 'David Chen',       position: '3B',  age: 29, years: 8,  skill: 0.55 },
  { id: 307, name: 'Tommy Nakamura',   position: 'RF',  age: 37, years: 17, skill: 0.50 },
];

function generateCandidate(player: DemoPlayer): HOFCandidate {
  const isPitcher = player.position === 'SP' || player.position === 'RP';
  const templates = isPitcher ? PITCHER_METRICS : HITTER_METRICS;
  const comps = isPitcher ? PITCHER_COMPS : HITTER_COMPS;

  const metrics: HOFMetric[] = templates.map(tmpl => {
    const value = Math.max(0, tmpl.genFn(player.skill, player.years));
    const pctOfThreshold = roundTo((value / tmpl.threshold) * 100, 0);
    return {
      label: tmpl.label,
      value,
      threshold: tmpl.threshold,
      pctOfThreshold,
    };
  });

  // HOF score: weighted average of pctOfThreshold values
  const hofScore = roundTo(
    metrics.reduce((s, m) => s + m.pctOfThreshold, 0) / metrics.length,
    0,
  );

  // Probability based on score, years, and skill
  const yearBonus = Math.min(20, player.years * 1.2);
  const rawProb = hofScore * 0.7 + yearBonus + player.skill * 15;
  const hofProbability = Math.round(Math.max(1, Math.min(99, rawProb)));

  // Generate career highlights
  const numHighlights = Math.max(1, Math.round(player.years * player.skill * 0.6));
  const highlights: CareerHighlight[] = [];
  const usedAchievements = pick(ACHIEVEMENTS, Math.min(numHighlights, 8));
  for (let i = 0; i < usedAchievements.length; i++) {
    const season = 2026 - player.years + Math.round(rand(0, player.years - 1));
    highlights.push({ season, achievement: usedAchievements[i] });
  }
  highlights.sort((a, b) => a.season - b.season);

  // Pick 2-3 comparable players
  const comparables = pick(comps, Math.round(rand(2, 3)));

  return {
    playerId: player.id,
    name: player.name,
    position: player.position,
    age: player.age,
    yearsPlayed: player.years,
    hofProbability,
    hofScore,
    metrics,
    highlights,
    comparables,
    status: statusFromProbability(hofProbability),
  };
}

export function generateDemoHOFMonitor(): HOFCandidate[] {
  return DEMO_PLAYERS
    .map(generateCandidate)
    .sort((a, b) => b.hofProbability - a.hofProbability);
}
