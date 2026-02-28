/**
 * batterVsPitcherHistory.ts – Batter vs Pitcher Historical Matchup Data
 *
 * Tracks individual batter-pitcher matchup histories across seasons.
 * Surfaces head-to-head stats, dominant matchups, and platoon tendencies
 * to inform lineup and pitching usage decisions.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type MatchupEdge = 'batter' | 'pitcher' | 'even';

export interface BvPMatchup {
  batterId: number;
  batterName: string;
  pitcherId: number;
  pitcherName: string;
  pa: number;
  hits: number;
  hr: number;
  bb: number;
  k: number;
  avg: number;
  slg: number;
  ops: number;
  edge: MatchupEdge;
}

export interface BvPSummary {
  totalMatchups: number;
  batterDominated: number;
  pitcherDominated: number;
  even: number;
  highestOPS: BvPMatchup;
  lowestOPS: BvPMatchup;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getEdge(ops: number, pa: number): MatchupEdge {
  if (pa < 5) return 'even';
  if (ops >= 0.850) return 'batter';
  if (ops <= 0.600) return 'pitcher';
  return 'even';
}

export function getBvPSummary(matchups: BvPMatchup[]): BvPSummary {
  const sig = matchups.filter(m => m.pa >= 5);
  const sorted = [...sig].sort((a, b) => b.ops - a.ops);
  return {
    totalMatchups: matchups.length,
    batterDominated: sig.filter(m => m.edge === 'batter').length,
    pitcherDominated: sig.filter(m => m.edge === 'pitcher').length,
    even: sig.filter(m => m.edge === 'even').length,
    highestOPS: sorted[0] ?? matchups[0],
    lowestOPS: sorted[sorted.length - 1] ?? matchups[0],
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const BATTERS = [
  { id: 1, name: 'Marcus Rivera' },
  { id: 2, name: 'James Park' },
  { id: 3, name: 'DeShawn Williams' },
  { id: 4, name: 'Tyler Morrison' },
  { id: 5, name: 'Carlos Reyes' },
];

const PITCHERS = [
  { id: 101, name: 'Jake Anderson' },
  { id: 102, name: 'Takeshi Yamamoto' },
  { id: 103, name: 'Clayton Webb' },
  { id: 104, name: 'Miguel Salazar' },
  { id: 105, name: 'Ryan O\'Brien' },
];

export function generateDemoBvPHistory(): BvPMatchup[] {
  const matchups: BvPMatchup[] = [];
  let seed = 42;

  for (const batter of BATTERS) {
    for (const pitcher of PITCHERS) {
      seed = (seed * 16807) % 2147483647;
      const r = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };

      const pa = Math.floor(5 + r() * 20);
      const hitRate = 0.15 + r() * 0.25;
      const hits = Math.round(pa * hitRate);
      const hr = Math.round(hits * (0.05 + r() * 0.2));
      const bb = Math.round(pa * (0.05 + r() * 0.1));
      const k = Math.round(pa * (0.15 + r() * 0.15));
      const ab = pa - bb;
      const avg = ab > 0 ? Math.round((hits / ab) * 1000) / 1000 : 0;
      const tb = hits + hr * 3 + Math.round(hits * 0.3);
      const slg = ab > 0 ? Math.round((tb / ab) * 1000) / 1000 : 0;
      const obp = pa > 0 ? Math.round(((hits + bb) / pa) * 1000) / 1000 : 0;
      const ops = Math.round((obp + slg) * 1000) / 1000;

      matchups.push({
        batterId: batter.id,
        batterName: batter.name,
        pitcherId: pitcher.id,
        pitcherName: pitcher.name,
        pa, hits, hr, bb, k,
        avg, slg, ops,
        edge: getEdge(ops, pa),
      });
    }
  }

  return matchups;
}
