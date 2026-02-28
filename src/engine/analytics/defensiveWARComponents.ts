/**
 * defensiveWARComponents.ts – Defensive WAR Breakdown
 *
 * Breaks down defensive WAR into its constituent components:
 *   - Range factor
 *   - Arm strength
 *   - Error avoidance
 *   - Double play ability
 *   - Positioning value
 *   - Framing (catchers only)
 *
 * Each component has a runs-saved value, percentile, and grade.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type DefenseGrade = 'elite' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export interface DefenseComponent {
  name: string;
  value: number;       // runs saved (positive = good)
  percentile: number;  // 0-100
  grade: DefenseGrade;
}

export interface DefensiveWARProfile {
  id: string;
  name: string;
  team: string;
  position: string;
  totalDWAR: number;
  components: DefenseComponent[];
  overallGrade: DefenseGrade;
  percentile: number;
  notes: string;
}

// ── Grade Display Map ──────────────────────────────────────────────────────

export const DEF_GRADE_DISPLAY: Record<DefenseGrade, { label: string; color: string }> = {
  elite:     { label: 'Elite',     color: '#22c55e' },
  above_avg: { label: 'Above Avg', color: '#3b82f6' },
  average:   { label: 'Average',   color: '#f59e0b' },
  below_avg: { label: 'Below Avg', color: '#ef4444' },
  poor:      { label: 'Poor',      color: '#ef4444' },
};

// ── Helpers ────────────────────────────────────────────────────────────────

function gradeFromPercentile(pct: number): DefenseGrade {
  if (pct >= 85) return 'elite';
  if (pct >= 65) return 'above_avg';
  if (pct >= 40) return 'average';
  if (pct >= 20) return 'below_avg';
  return 'poor';
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface DefensiveWARSummary {
  totalPlayers: number;
  bestDefender: { name: string; dwar: number };
  bestByComponent: { name: string; component: string };
  avgDWAR: number;
}

export function getDefensiveWARSummary(profiles: DefensiveWARProfile[]): DefensiveWARSummary {
  const n = profiles.length;

  let bestName = '';
  let bestDWAR = -Infinity;
  let bestCompName = '';
  let bestCompLabel = '';
  let bestCompVal = -Infinity;
  let totalDWAR = 0;

  for (const p of profiles) {
    totalDWAR += p.totalDWAR;
    if (p.totalDWAR > bestDWAR) {
      bestDWAR = p.totalDWAR;
      bestName = p.name;
    }
    for (const c of p.components) {
      if (c.value > bestCompVal) {
        bestCompVal = c.value;
        bestCompName = p.name;
        bestCompLabel = c.name;
      }
    }
  }

  return {
    totalPlayers: n,
    bestDefender: { name: bestName, dwar: Math.round(bestDWAR * 10) / 10 },
    bestByComponent: { name: bestCompName, component: bestCompLabel },
    avgDWAR: Math.round((totalDWAR / n) * 10) / 10,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_PLAYERS: { name: string; team: string; position: string; catcher?: boolean }[] = [
  { name: 'Andrelton Simmons', team: 'MIN', position: 'SS' },
  { name: 'Matt Chapman',      team: 'SF',  position: '3B' },
  { name: 'J.T. Realmuto',     team: 'PHI', position: 'C', catcher: true },
  { name: 'Kevin Kiermaier',   team: 'TOR', position: 'CF' },
  { name: 'Nolan Arenado',     team: 'STL', position: '3B' },
  { name: 'Nico Hoerner',      team: 'CHC', position: '2B' },
  { name: 'Adley Rutschman',   team: 'BAL', position: 'C', catcher: true },
  { name: 'Trea Turner',       team: 'PHI', position: 'SS' },
];

const COMPONENT_NAMES = ['Range Factor', 'Arm Strength', 'Error Avoidance', 'Double Play Ability', 'Positioning Value'];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateDemoDefensiveWAR(): DefensiveWARProfile[] {
  return DEMO_PLAYERS.map((dp, pi) => {
    const rng = seededRandom(pi * 313 + 17);

    // Build components
    const componentNames = dp.catcher
      ? [...COMPONENT_NAMES, 'Framing']
      : [...COMPONENT_NAMES];

    const components: DefenseComponent[] = componentNames.map((name, ci) => {
      // Base percentile varies by player quality and component
      const basePercentile = 35 + rng() * 55 + (pi < 4 ? 10 : -5);
      const percentile = clamp(Math.round(basePercentile + (ci * 3 - 6) * (rng() - 0.3)), 1, 99);
      const grade = gradeFromPercentile(percentile);

      // Runs saved: roughly maps percentile to runs
      // Elite = +8-15, average = -2 to +2, poor = -5 to -10
      const runs = Math.round(((percentile - 50) / 50) * 12 * 10) / 10;

      return { name, value: runs, percentile, grade };
    });

    // Total dWAR = sum of component runs / 10 (approximate runs-to-WAR conversion)
    const totalRuns = components.reduce((s, c) => s + c.value, 0);
    const totalDWAR = Math.round(totalRuns / 10 * 10) / 10;

    // Overall percentile and grade
    const avgPercentile = Math.round(components.reduce((s, c) => s + c.percentile, 0) / components.length);
    const overallGrade = gradeFromPercentile(avgPercentile);

    // Notes
    const bestComp = components.reduce((a, b) => a.percentile > b.percentile ? a : b, components[0]);
    const worstComp = components.reduce((a, b) => a.percentile < b.percentile ? a : b, components[0]);

    const notes = avgPercentile >= 75
      ? `Gold Glove caliber. Exceptional ${bestComp.name.toLowerCase()} (${bestComp.percentile}th pct). Anchors the defense.`
      : avgPercentile >= 55
      ? `Reliable defender. ${bestComp.name} is a plus tool. ${worstComp.name} could improve.`
      : avgPercentile >= 40
      ? `Average defender. ${worstComp.name} is a liability (${worstComp.percentile}th pct). Workable at ${dp.position}.`
      : `Below average glove. Weak ${worstComp.name.toLowerCase()} (${worstComp.percentile}th pct) hurts overall value.`;

    return {
      id: `dwar-${pi}`,
      name: dp.name,
      team: dp.team,
      position: dp.position,
      totalDWAR,
      components,
      overallGrade,
      percentile: avgPercentile,
      notes,
    };
  });
}
