/**
 * Pitch Tunneling Analytics
 *
 * Measures how well a pitcher's different pitch types
 * look alike at the tunnel point (~23 feet from home plate).
 * Better tunneling = more deception = more swings and misses.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type TunnelGrade = 'elite' | 'plus' | 'average' | 'below_avg' | 'poor';

export const TUNNEL_GRADE_DISPLAY: Record<TunnelGrade, { label: string; color: string }> = {
  elite:     { label: 'Elite',     color: '#22c55e' },
  plus:      { label: 'Plus',      color: '#3b82f6' },
  average:   { label: 'Average',   color: '#eab308' },
  below_avg: { label: 'Below Avg', color: '#f97316' },
  poor:      { label: 'Poor',      color: '#ef4444' },
};

export type PitchType = 'FF' | 'SI' | 'SL' | 'CU' | 'CH' | 'CT' | 'SW' | 'KC' | 'FS';

export const PITCH_LABELS: Record<PitchType, { name: string; color: string }> = {
  FF: { name: '4-Seam',     color: '#ef4444' },
  SI: { name: 'Sinker',     color: '#f97316' },
  SL: { name: 'Slider',     color: '#3b82f6' },
  CU: { name: 'Curveball',  color: '#22c55e' },
  CH: { name: 'Changeup',   color: '#8b5cf6' },
  CT: { name: 'Cutter',     color: '#eab308' },
  SW: { name: 'Sweeper',    color: '#06b6d4' },
  KC: { name: 'Knuckle-CV', color: '#14b8a6' },
  FS: { name: 'Splitter',   color: '#ec4899' },
};

export interface PitchPair {
  pitch1: PitchType;
  pitch2: PitchType;
  tunnelScore: number;       // 0-100, higher = better tunnel
  tunnelGrade: TunnelGrade;
  separationInches: number;  // inches of difference at tunnel point
  whiffRateOnPair: number;   // percentage
  usage: number;             // times this pair sequenced
}

export interface TunnelingPitcher {
  id: number;
  name: string;
  hand: 'L' | 'R';
  overall: number;
  pitches: PitchType[];
  overallTunnelScore: number;
  overallGrade: TunnelGrade;
  bestPair: PitchPair;
  worstPair: PitchPair;
  allPairs: PitchPair[];
  whiffRate: number;
  chaseRate: number;
  deceptionIndex: number;   // composite metric 0-100
}

export interface TunnelSummary {
  avgTunnelScore: number;
  eliteCount: number;
  plusCount: number;
  avgWhiffRate: number;
  bestTunneler: string;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getTunnelGrade(score: number): TunnelGrade {
  if (score >= 85) return 'elite';
  if (score >= 70) return 'plus';
  if (score >= 55) return 'average';
  if (score >= 40) return 'below_avg';
  return 'poor';
}

export function getTunnelSummary(pitchers: TunnelingPitcher[]): TunnelSummary {
  const best = pitchers.reduce((b, p) => p.overallTunnelScore > b.overallTunnelScore ? p : b, pitchers[0]);
  return {
    avgTunnelScore: Math.round(pitchers.reduce((s, p) => s + p.overallTunnelScore, 0) / pitchers.length),
    eliteCount: pitchers.filter(p => p.overallGrade === 'elite').length,
    plusCount: pitchers.filter(p => p.overallGrade === 'plus').length,
    avgWhiffRate: Math.round(pitchers.reduce((s, p) => s + p.whiffRate, 0) / pitchers.length * 10) / 10,
    bestTunneler: best.name,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

function makePair(p1: PitchType, p2: PitchType, score: number, sep: number, whiff: number, usage: number): PitchPair {
  return { pitch1: p1, pitch2: p2, tunnelScore: score, tunnelGrade: getTunnelGrade(score), separationInches: sep, whiffRateOnPair: whiff, usage };
}

export function generateDemoTunneling(): TunnelingPitcher[] {
  const data = [
    {
      name: 'Spencer Strider', hand: 'R' as const, ovr: 86, pitches: ['FF', 'SL', 'CH'] as PitchType[],
      pairs: [makePair('FF', 'SL', 92, 1.8, 42.5, 180), makePair('FF', 'CH', 78, 3.2, 35.0, 120), makePair('SL', 'CH', 65, 4.5, 28.0, 60)],
      whiff: 35.2, chase: 38.5, dec: 88,
    },
    {
      name: 'Corbin Burnes', hand: 'R' as const, ovr: 87, pitches: ['CT', 'CU', 'SI', 'CH'] as PitchType[],
      pairs: [makePair('CT', 'SI', 88, 2.2, 38.0, 200), makePair('CT', 'CU', 75, 3.5, 33.0, 150), makePair('SI', 'CH', 72, 3.8, 30.0, 100), makePair('CU', 'CH', 60, 5.0, 25.0, 80)],
      whiff: 28.8, chase: 34.2, dec: 82,
    },
    {
      name: 'Logan Webb', hand: 'R' as const, ovr: 83, pitches: ['SI', 'SL', 'CH', 'CT'] as PitchType[],
      pairs: [makePair('SI', 'CH', 85, 2.5, 32.0, 160), makePair('SI', 'SL', 70, 3.8, 28.0, 140), makePair('CH', 'SL', 62, 4.2, 24.0, 90), makePair('CT', 'SL', 68, 3.5, 26.0, 80)],
      whiff: 24.5, chase: 32.8, dec: 75,
    },
    {
      name: 'Blake Snell', hand: 'L' as const, ovr: 84, pitches: ['FF', 'SL', 'CU', 'CH'] as PitchType[],
      pairs: [makePair('FF', 'SL', 82, 2.8, 36.0, 170), makePair('FF', 'CU', 58, 5.5, 30.0, 100), makePair('SL', 'CH', 70, 3.5, 28.0, 80), makePair('FF', 'CH', 74, 3.2, 32.0, 110)],
      whiff: 32.0, chase: 36.0, dec: 80,
    },
    {
      name: 'Kevin Gausman', hand: 'R' as const, ovr: 82, pitches: ['FF', 'FS', 'SL'] as PitchType[],
      pairs: [makePair('FF', 'FS', 90, 1.5, 40.0, 220), makePair('FF', 'SL', 68, 4.0, 30.0, 130), makePair('FS', 'SL', 55, 5.2, 22.0, 70)],
      whiff: 30.5, chase: 35.0, dec: 85,
    },
    {
      name: 'Tyler Glasnow', hand: 'R' as const, ovr: 85, pitches: ['FF', 'CU', 'SL'] as PitchType[],
      pairs: [makePair('FF', 'CU', 60, 5.0, 35.0, 150), makePair('FF', 'SL', 78, 3.0, 32.0, 130), makePair('CU', 'SL', 52, 6.0, 20.0, 50)],
      whiff: 33.0, chase: 37.0, dec: 72,
    },
  ];

  return data.map((d, i) => {
    const allPairs = d.pairs;
    const avgScore = Math.round(allPairs.reduce((s, p) => s + p.tunnelScore, 0) / allPairs.length);
    const bestPair = allPairs.reduce((b, p) => p.tunnelScore > b.tunnelScore ? p : b, allPairs[0]);
    const worstPair = allPairs.reduce((w, p) => p.tunnelScore < w.tunnelScore ? p : w, allPairs[0]);
    return {
      id: i,
      name: d.name,
      hand: d.hand,
      overall: d.ovr,
      pitches: d.pitches,
      overallTunnelScore: avgScore,
      overallGrade: getTunnelGrade(avgScore),
      bestPair,
      worstPair,
      allPairs,
      whiffRate: d.whiff,
      chaseRate: d.chase,
      deceptionIndex: d.dec,
    };
  });
}
