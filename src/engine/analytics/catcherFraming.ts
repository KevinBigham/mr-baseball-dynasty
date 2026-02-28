/**
 * Catcher Framing Analytics
 *
 * Measures a catcher's ability to receive pitches and influence
 * borderline strike calls. Tracks framing runs, strike zone
 * expansion, and pitcher-catcher battery synergy.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type FramingZone = 'shadow_up' | 'shadow_down' | 'shadow_in' | 'shadow_out' | 'heart' | 'chase';

export const ZONE_DISPLAY: Record<FramingZone, { label: string; color: string; desc: string }> = {
  shadow_up:   { label: 'Shadow Top',    color: '#ef4444', desc: 'Upper edge of strike zone' },
  shadow_down: { label: 'Shadow Bottom', color: '#3b82f6', desc: 'Lower edge of strike zone' },
  shadow_in:   { label: 'Shadow Inside', color: '#f97316', desc: 'Inner edge of strike zone' },
  shadow_out:  { label: 'Shadow Outside',color: '#22c55e', desc: 'Outer edge of strike zone' },
  heart:       { label: 'Heart',         color: '#6b7280', desc: 'Middle of the zone' },
  chase:       { label: 'Chase',         color: '#8b5cf6', desc: 'Outside the zone' },
};

export type FramingGrade = 'elite' | 'above_avg' | 'average' | 'below_avg' | 'poor';

export const GRADE_DISPLAY: Record<FramingGrade, { label: string; color: string; emoji: string }> = {
  elite:     { label: 'Elite',      color: '#22c55e', emoji: '🌟' },
  above_avg: { label: 'Above Avg',  color: '#3b82f6', emoji: '👍' },
  average:   { label: 'Average',    color: '#eab308', emoji: '➖' },
  below_avg: { label: 'Below Avg',  color: '#f97316', emoji: '👎' },
  poor:      { label: 'Poor',       color: '#ef4444', emoji: '❌' },
};

export interface CatcherFramer {
  id: number;
  name: string;
  team: string;
  overall: number;
  framingRuns: number;          // runs saved by framing (positive = good)
  strikeRate: number;           // % of borderline pitches called strikes
  leagueAvgStrikeRate: number;
  extraStrikes: number;         // total extra strikes gained
  extraBalls: number;           // total extra balls lost
  calledStrikeAboveExpected: number;
  grade: FramingGrade;
  zoneBreakdown: Record<FramingZone, { attempts: number; strikeRate: number }>;
  batteryBest: { pitcher: string; synergy: number };
  batteryWorst: { pitcher: string; synergy: number };
  gamesStarted: number;
  inningsCaught: number;
  rank: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getFramingGrade(framingRuns: number): FramingGrade {
  if (framingRuns >= 12) return 'elite';
  if (framingRuns >= 5) return 'above_avg';
  if (framingRuns >= -2) return 'average';
  if (framingRuns >= -8) return 'below_avg';
  return 'poor';
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const CATCHER_DATA = [
  { name: 'Jose Trevino', team: 'NYY', ovr: 72, fr: 15.2, sr: 52.3, gs: 110, inn: 945 },
  { name: 'Austin Hedges', team: 'CLE', ovr: 62, fr: 12.8, sr: 51.8, gs: 95, inn: 812 },
  { name: 'Cal Raleigh', team: 'SEA', ovr: 76, fr: 10.5, sr: 50.9, gs: 132, inn: 1122 },
  { name: 'Adley Rutschman', team: 'BAL', ovr: 79, fr: 8.3, sr: 50.2, gs: 140, inn: 1195 },
  { name: 'J.T. Realmuto', team: 'PHI', ovr: 78, fr: 3.1, sr: 48.8, gs: 125, inn: 1050 },
  { name: 'Will Smith', team: 'LAD', ovr: 80, fr: 1.2, sr: 48.2, gs: 128, inn: 1080 },
  { name: 'Salvador Perez', team: 'KC', ovr: 75, fr: -3.5, sr: 46.5, gs: 135, inn: 1148 },
  { name: 'Willson Contreras', team: 'STL', ovr: 74, fr: -8.2, sr: 44.8, gs: 120, inn: 1005 },
];

const PITCHER_NAMES = ['Cole', 'Strider', 'Wheeler', 'Burnes', 'Nola', 'Webb'];

export function generateDemoCatchers(): CatcherFramer[] {
  const leagueAvg = 48.0;

  return CATCHER_DATA.map((c, i) => {
    const grade = getFramingGrade(c.fr);
    const extraStrikes = Math.round(c.fr * 8);
    const extraBalls = Math.max(0, Math.round(-c.fr * 4));

    const zoneBreakdown: Record<FramingZone, { attempts: number; strikeRate: number }> = {
      shadow_up:   { attempts: 180 + i * 20, strikeRate: c.sr + 2 - i * 0.5 },
      shadow_down: { attempts: 200 + i * 15, strikeRate: c.sr + 3 - i * 0.3 },
      shadow_in:   { attempts: 160 + i * 10, strikeRate: c.sr - 1 + i * 0.2 },
      shadow_out:  { attempts: 190 + i * 18, strikeRate: c.sr + 1 - i * 0.4 },
      heart:       { attempts: 350 + i * 25, strikeRate: 92 + i * 0.3 },
      chase:       { attempts: 280 + i * 12, strikeRate: 8 + i * 0.8 },
    };

    return {
      id: i,
      name: c.name,
      team: c.team,
      overall: c.ovr,
      framingRuns: c.fr,
      strikeRate: c.sr,
      leagueAvgStrikeRate: leagueAvg,
      extraStrikes,
      extraBalls,
      calledStrikeAboveExpected: Math.round(c.fr * 12),
      grade,
      zoneBreakdown,
      batteryBest: { pitcher: PITCHER_NAMES[i % PITCHER_NAMES.length], synergy: 65 + (i * 7) % 30 },
      batteryWorst: { pitcher: PITCHER_NAMES[(i + 3) % PITCHER_NAMES.length], synergy: 25 + (i * 5) % 20 },
      gamesStarted: c.gs,
      inningsCaught: c.inn,
      rank: i + 1,
    };
  });
}
