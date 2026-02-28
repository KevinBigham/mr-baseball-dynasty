/**
 * umpireStrikeZone.ts – Umpire Strike Zone Tendency Analysis
 *
 * Models how different umpires call the strike zone.
 * Tracks zone expansion/compression, consistency scores,
 * called strike rates by zone area, and pitch framing impact.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type ZoneArea = 'up_left' | 'up_mid' | 'up_right' | 'mid_left' | 'heart' | 'mid_right' | 'low_left' | 'low_mid' | 'low_right' | 'high' | 'low' | 'inside' | 'outside';

export interface ZoneTendency {
  area: ZoneArea;
  calledStrikeRate: number;
  leagueAvg: number;
  differential: number;
}

export interface UmpireProfile {
  umpId: number;
  name: string;
  gamesUmped: number;
  consistencyScore: number;
  zoneExpansion: number;
  avgPitchesPerGame: number;
  tendencies: ZoneTendency[];
  favorsPitcher: boolean;
  notableCall: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getConsistencyColor(score: number): string {
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#4ade80';
  if (score >= 70) return '#f59e0b';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}

export function getExpansionLabel(exp: number): { label: string; color: string } {
  if (exp > 1.5) return { label: 'WIDE', color: '#ef4444' };
  if (exp > 0.5) return { label: 'SLIGHTLY WIDE', color: '#f59e0b' };
  if (exp > -0.5) return { label: 'NEUTRAL', color: '#9ca3af' };
  if (exp > -1.5) return { label: 'SLIGHTLY TIGHT', color: '#3b82f6' };
  return { label: 'TIGHT', color: '#22c55e' };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const ZONE_AREAS: ZoneArea[] = ['up_left', 'up_mid', 'up_right', 'mid_left', 'heart', 'mid_right', 'low_left', 'low_mid', 'low_right', 'high', 'low', 'inside', 'outside'];

const LEAGUE_AVGS: Record<ZoneArea, number> = {
  up_left: 0.38, up_mid: 0.52, up_right: 0.40,
  mid_left: 0.72, heart: 0.95, mid_right: 0.74,
  low_left: 0.65, low_mid: 0.82, low_right: 0.67,
  high: 0.18, low: 0.55, inside: 0.42, outside: 0.35,
};

export function generateDemoUmpireZones(): UmpireProfile[] {
  const umps = [
    { id: 1, name: 'Ron Kulpa', games: 142, cons: 78, exp: 1.8, fav: true, note: 'Expands zone significantly on 3-2 counts' },
    { id: 2, name: 'Angel Hernandez', games: 128, cons: 62, exp: 2.1, fav: false, note: 'Inconsistent zone, high controversy rate' },
    { id: 3, name: 'Pat Hoberg', games: 148, cons: 96, exp: -0.2, fav: false, note: 'Most accurate umpire in MLB' },
    { id: 4, name: 'CB Bucknor', games: 136, cons: 68, exp: 1.4, fav: true, note: 'Expands low and outside significantly' },
    { id: 5, name: 'Laz Diaz', games: 130, cons: 72, exp: 0.8, fav: true, note: 'Slightly pitcher-friendly, tight up zone' },
    { id: 6, name: 'Jordan Baker', games: 144, cons: 85, exp: 0.3, fav: false, note: 'Balanced zone, slightly above average' },
    { id: 7, name: 'Jim Wolf', games: 140, cons: 88, exp: -0.4, fav: false, note: 'Tight zone benefits hitters slightly' },
    { id: 8, name: 'Nic Lentz', games: 138, cons: 82, exp: 0.6, fav: true, note: 'Wide zone on inside corner to RHH' },
  ];

  let seed = 777;
  const r = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  return umps.map(u => {
    const tendencies: ZoneTendency[] = ZONE_AREAS.map(area => {
      const leagueAvg = LEAGUE_AVGS[area];
      const bias = u.exp * 0.02 * (area === 'heart' ? 0.1 : 1);
      const noise = (r() - 0.5) * 0.08;
      const calledStrikeRate = Math.round(Math.max(0, Math.min(1, leagueAvg + bias + noise)) * 1000) / 1000;
      return {
        area,
        calledStrikeRate,
        leagueAvg,
        differential: Math.round((calledStrikeRate - leagueAvg) * 1000) / 1000,
      };
    });

    return {
      umpId: u.id,
      name: u.name,
      gamesUmped: u.games,
      consistencyScore: u.cons,
      zoneExpansion: u.exp,
      avgPitchesPerGame: Math.round(270 + r() * 30),
      tendencies,
      favorsPitcher: u.fav,
      notableCall: u.note,
    };
  });
}
