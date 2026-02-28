/**
 * minorLeaguePipelineValue.ts – Minor League Pipeline Value
 *
 * Calculates the aggregate prospect value of each team's farm system.
 * Ranks organizations by total prospect capital, depth, recent graduations,
 * and average prospect age to evaluate pipeline health.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type PipelineTier = 'elite' | 'above_avg' | 'avg' | 'below_avg' | 'barren';

export const PIPELINE_DISPLAY: Record<PipelineTier, { label: string; color: string }> = {
  elite:     { label: 'ELITE',     color: '#22c55e' },
  above_avg: { label: 'ABOVE AVG', color: '#3b82f6' },
  avg:       { label: 'AVERAGE',   color: '#eab308' },
  below_avg: { label: 'BELOW AVG', color: '#f97316' },
  barren:    { label: 'BARREN',    color: '#ef4444' },
};

export interface ProspectAsset {
  name: string;
  age: number;
  position: string;
  level: string;
  overallGrade: number;
  tradeValue: number;
}

export interface PipelineData {
  teamId: string;
  teamName: string;
  pipelineRank: number;
  tier: PipelineTier;
  totalValue: number;
  topProspects: ProspectAsset[];
  depthScore: number;
  recentGrads: number;
  avgAge: number;
}

// ── Logic ──────────────────────────────────────────────────────────────────

export function getPipelineTier(totalValue: number): PipelineTier {
  if (totalValue >= 450) return 'elite';
  if (totalValue >= 340) return 'above_avg';
  if (totalValue >= 220) return 'avg';
  if (totalValue >= 120) return 'below_avg';
  return 'barren';
}

export function getPipelineSummary(pipelines: PipelineData[]) {
  const n = pipelines.length;
  return {
    avgValue: Math.round(pipelines.reduce((s, p) => s + p.totalValue, 0) / n),
    eliteCount: pipelines.filter(p => p.tier === 'elite').length,
    barrenCount: pipelines.filter(p => p.tier === 'barren').length,
    avgDepth: Math.round(pipelines.reduce((s, p) => s + p.depthScore, 0) / n * 10) / 10,
    totalGrads: pipelines.reduce((s, p) => s + p.recentGrads, 0),
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

interface TeamSeed {
  id: string;
  team: string;
  value: number;
  depth: number;
  grads: number;
  avgAge: number;
  prospects: { name: string; age: number; pos: string; lvl: string; grade: number; tv: number }[];
}

const SEEDS: TeamSeed[] = [
  {
    id: 'BAL', team: 'Baltimore Orioles', value: 520, depth: 88, grads: 5, avgAge: 22.1,
    prospects: [
      { name: 'Jackson Holliday', age: 20, pos: 'SS', lvl: 'AAA', grade: 75, tv: 95 },
      { name: 'Coby Mayo',        age: 21, pos: '3B', lvl: 'AAA', grade: 65, tv: 78 },
      { name: 'Samuel Basallo',   age: 19, pos: 'C',  lvl: 'AA',  grade: 60, tv: 72 },
    ],
  },
  {
    id: 'CIN', team: 'Cincinnati Reds', value: 480, depth: 84, grads: 4, avgAge: 22.4,
    prospects: [
      { name: 'Cam Collier',      age: 19, pos: '3B', lvl: 'AA',  grade: 65, tv: 82 },
      { name: 'Rhett Lowder',     age: 22, pos: 'SP', lvl: 'AAA', grade: 60, tv: 70 },
      { name: 'Edwin Arroyo',     age: 20, pos: 'SS', lvl: 'AA',  grade: 58, tv: 65 },
    ],
  },
  {
    id: 'PIT', team: 'Pittsburgh Pirates', value: 460, depth: 82, grads: 3, avgAge: 21.8,
    prospects: [
      { name: 'Termarr Johnson',  age: 20, pos: '2B', lvl: 'AA',  grade: 65, tv: 80 },
      { name: 'Jared Jones',      age: 22, pos: 'SP', lvl: 'MLB', grade: 62, tv: 74 },
      { name: 'Bubba Chandler',   age: 21, pos: 'SP', lvl: 'A+',  grade: 58, tv: 66 },
    ],
  },
  {
    id: 'CLE', team: 'Cleveland Guardians', value: 390, depth: 76, grads: 4, avgAge: 23.0,
    prospects: [
      { name: 'Chase DeLauter',   age: 22, pos: 'OF', lvl: 'AA',  grade: 60, tv: 72 },
      { name: 'Travis Bazzana',   age: 22, pos: '2B', lvl: 'A+',  grade: 58, tv: 68 },
      { name: 'Daniel Espino',    age: 23, pos: 'SP', lvl: 'AAA', grade: 55, tv: 60 },
    ],
  },
  {
    id: 'TB', team: 'Tampa Bay Rays', value: 370, depth: 78, grads: 6, avgAge: 22.6,
    prospects: [
      { name: 'Curtis Mead',      age: 23, pos: '3B', lvl: 'AAA', grade: 58, tv: 65 },
      { name: 'Brock Jones',      age: 23, pos: 'OF', lvl: 'A+',  grade: 55, tv: 58 },
      { name: 'Carson Williams',   age: 21, pos: 'SS', lvl: 'AA',  grade: 55, tv: 56 },
    ],
  },
  {
    id: 'MIN', team: 'Minnesota Twins', value: 350, depth: 72, grads: 3, avgAge: 22.8,
    prospects: [
      { name: 'Walker Jenkins',   age: 19, pos: 'OF', lvl: 'A+',  grade: 62, tv: 75 },
      { name: 'Brooks Lee',       age: 23, pos: 'SS', lvl: 'AAA', grade: 58, tv: 64 },
      { name: 'Emmanuel Rodriguez', age: 20, pos: 'OF', lvl: 'AA', grade: 55, tv: 56 },
    ],
  },
  {
    id: 'LAD', team: 'Los Angeles Dodgers', value: 310, depth: 68, grads: 5, avgAge: 23.2,
    prospects: [
      { name: 'Dalton Rushing',   age: 23, pos: 'C',  lvl: 'AAA', grade: 58, tv: 66 },
      { name: 'Nick Frasso',      age: 24, pos: 'SP', lvl: 'AAA', grade: 52, tv: 50 },
      { name: 'Josue De Paula',   age: 21, pos: 'SP', lvl: 'AA',  grade: 52, tv: 48 },
    ],
  },
  {
    id: 'NYY', team: 'New York Yankees', value: 280, depth: 62, grads: 2, avgAge: 23.5,
    prospects: [
      { name: 'Jasson Dominguez', age: 21, pos: 'CF', lvl: 'AAA', grade: 60, tv: 72 },
      { name: 'George Lombard Jr.', age: 20, pos: 'SS', lvl: 'A+', grade: 52, tv: 48 },
      { name: 'Chase Hampton',    age: 23, pos: 'SP', lvl: 'AA',  grade: 50, tv: 42 },
    ],
  },
  {
    id: 'BOS', team: 'Boston Red Sox', value: 340, depth: 74, grads: 3, avgAge: 22.3,
    prospects: [
      { name: 'Marcelo Mayer',    age: 22, pos: 'SS', lvl: 'AAA', grade: 65, tv: 80 },
      { name: 'Roman Anthony',    age: 20, pos: 'OF', lvl: 'AA',  grade: 62, tv: 74 },
      { name: 'Kyle Teel',        age: 23, pos: 'C',  lvl: 'AAA', grade: 55, tv: 56 },
    ],
  },
  {
    id: 'ATL', team: 'Atlanta Braves', value: 240, depth: 58, grads: 4, avgAge: 23.6,
    prospects: [
      { name: 'Hurston Waldrep',  age: 23, pos: 'SP', lvl: 'AAA', grade: 55, tv: 58 },
      { name: 'Owen Murphy',      age: 21, pos: 'SP', lvl: 'A+',  grade: 55, tv: 56 },
      { name: 'AJ Smith-Shawver', age: 22, pos: 'SP', lvl: 'AAA', grade: 50, tv: 44 },
    ],
  },
  {
    id: 'CHW', team: 'Chicago White Sox', value: 180, depth: 48, grads: 1, avgAge: 21.5,
    prospects: [
      { name: 'Colson Montgomery', age: 22, pos: 'SS', lvl: 'AA', grade: 55, tv: 58 },
      { name: 'Noah Schultz',     age: 21, pos: 'SP', lvl: 'A+',  grade: 55, tv: 56 },
      { name: 'Edgar Quero',      age: 21, pos: 'C',  lvl: 'AA',  grade: 50, tv: 42 },
    ],
  },
  {
    id: 'OAK', team: 'Oakland Athletics', value: 150, depth: 44, grads: 1, avgAge: 21.0,
    prospects: [
      { name: 'Jacob Wilson',     age: 22, pos: 'SS', lvl: 'AA',  grade: 55, tv: 56 },
      { name: 'Tyler Soderstrom', age: 22, pos: '1B', lvl: 'AAA', grade: 52, tv: 48 },
      { name: 'Henry Bolte',      age: 21, pos: 'OF', lvl: 'A+',  grade: 50, tv: 40 },
    ],
  },
  {
    id: 'COL', team: 'Colorado Rockies', value: 100, depth: 36, grads: 1, avgAge: 22.0,
    prospects: [
      { name: 'Adael Amador',     age: 21, pos: 'SS', lvl: 'AAA', grade: 52, tv: 48 },
      { name: 'Chase Dollander',  age: 23, pos: 'SP', lvl: 'AA',  grade: 50, tv: 40 },
      { name: 'Yanquiel Fernandez', age: 22, pos: 'OF', lvl: 'A+', grade: 45, tv: 32 },
    ],
  },
  {
    id: 'LAA', team: 'Los Angeles Angels', value: 90, depth: 32, grads: 0, avgAge: 22.7,
    prospects: [
      { name: 'Caden Dana',       age: 20, pos: 'SP', lvl: 'A+',  grade: 55, tv: 56 },
      { name: 'Nolan Schanuel',   age: 23, pos: '1B', lvl: 'AAA', grade: 48, tv: 36 },
      { name: 'Christian Moore',   age: 22, pos: '2B', lvl: 'A+',  grade: 48, tv: 34 },
    ],
  },
];

export function generateDemoPipelineValue(): PipelineData[] {
  const sorted = [...SEEDS].sort((a, b) => b.value - a.value);

  return sorted.map((s, i) => ({
    teamId: s.id,
    teamName: s.team,
    pipelineRank: i + 1,
    tier: getPipelineTier(s.value),
    totalValue: s.value,
    topProspects: s.prospects.map(p => ({
      name: p.name,
      age: p.age,
      position: p.pos,
      level: p.lvl,
      overallGrade: p.grade,
      tradeValue: p.tv,
    })),
    depthScore: s.depth,
    recentGrads: s.grads,
    avgAge: s.avgAge,
  }));
}
