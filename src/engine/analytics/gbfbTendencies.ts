/**
 * gbfbTendencies.ts – Groundball/Flyball tendency analysis
 *
 * Analyzes batted ball tendencies for pitchers including GB%, FB%, LD%,
 * IFFB%, HR/FB rate, and wOBA allowed by batted ball type.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BattedBallProfile = 'extreme_gb' | 'gb' | 'neutral' | 'fb' | 'extreme_fb';

export interface PitcherBattedBall {
  id: string;
  name: string;
  team: string;
  role: 'SP' | 'RP';
  ip: number;
  gbPct: number;
  fbPct: number;
  ldPct: number;
  iffbPct: number;     // infield flyball %
  hrFbRate: number;    // HR per FB %
  profile: BattedBallProfile;
  gbWOBA: number;      // wOBA on ground balls
  fbWOBA: number;      // wOBA on fly balls
  ldWOBA: number;      // wOBA on line drives
  babip: number;
  avgEV: number;       // avg exit velo against
  hardHitPct: number;  // 95+ mph %
  softHitPct: number;  // < 85 mph %
  pullPct: number;
  centerPct: number;
  oppoPct: number;
  notes: string;
}

export const PROFILE_DISPLAY: Record<BattedBallProfile, { label: string; color: string }> = {
  extreme_gb: { label: 'EXTREME GB', color: '#22c55e' },
  gb: { label: 'GB', color: '#4ade80' },
  neutral: { label: 'NEUTRAL', color: '#facc15' },
  fb: { label: 'FB', color: '#f97316' },
  extreme_fb: { label: 'EXTREME FB', color: '#ef4444' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function classifyProfile(gbPct: number): BattedBallProfile {
  if (gbPct >= 55) return 'extreme_gb';
  if (gbPct >= 48) return 'gb';
  if (gbPct >= 42) return 'neutral';
  if (gbPct >= 35) return 'fb';
  return 'extreme_fb';
}

export function profileColor(p: BattedBallProfile): string {
  return PROFILE_DISPLAY[p].color;
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface GBFBSummary {
  totalPitchers: number;
  avgGBPct: number;
  avgFBPct: number;
  highestGB: string;
  lowestHRFB: string;
  teamBABIP: number;
}

export function getGBFBSummary(pitchers: PitcherBattedBall[]): GBFBSummary {
  const avgGB = pitchers.reduce((s, p) => s + p.gbPct, 0) / pitchers.length;
  const avgFB = pitchers.reduce((s, p) => s + p.fbPct, 0) / pitchers.length;
  const highestGB = pitchers.reduce((a, b) => a.gbPct > b.gbPct ? a : b);
  const lowestHRFB = pitchers.reduce((a, b) => a.hrFbRate < b.hrFbRate ? a : b);
  const teamBABIP = pitchers.reduce((s, p) => s + p.babip, 0) / pitchers.length;

  return {
    totalPitchers: pitchers.length,
    avgGBPct: Math.round(avgGB * 10) / 10,
    avgFBPct: Math.round(avgFB * 10) / 10,
    highestGB: highestGB.name,
    lowestHRFB: lowestHRFB.name,
    teamBABIP: Math.round(teamBABIP * 1000) / 1000,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoGBFB(): PitcherBattedBall[] {
  const data: Omit<PitcherBattedBall, 'id' | 'profile'>[] = [
    {
      name: 'Framber Valdez', team: 'HOU', role: 'SP', ip: 198.2,
      gbPct: 62.5, fbPct: 20.8, ldPct: 16.7, iffbPct: 12.5, hrFbRate: 8.2,
      gbWOBA: .248, fbWOBA: .382, ldWOBA: .658, babip: .278,
      avgEV: 86.2, hardHitPct: 28.5, softHitPct: 24.8,
      pullPct: 38.2, centerPct: 35.5, oppoPct: 26.3,
      notes: 'Elite groundball machine. Sinker/curveball combo keeps the ball on the ground. Low HR allowed despite fly balls.',
    },
    {
      name: 'Logan Webb', team: 'SF', role: 'SP', ip: 192.1,
      gbPct: 56.8, fbPct: 24.2, ldPct: 19.0, iffbPct: 14.8, hrFbRate: 9.5,
      gbWOBA: .255, fbWOBA: .395, ldWOBA: .672, babip: .285,
      avgEV: 87.5, hardHitPct: 30.2, softHitPct: 22.5,
      pullPct: 36.8, centerPct: 37.2, oppoPct: 26.0,
      notes: 'Heavy groundball pitcher with excellent sinker. IFFB rate adds value. Line drives are the vulnerability.',
    },
    {
      name: 'Corbin Burnes', team: 'BAL', role: 'SP', ip: 188.0,
      gbPct: 44.5, fbPct: 32.8, ldPct: 22.7, iffbPct: 18.2, hrFbRate: 10.5,
      gbWOBA: .262, fbWOBA: .348, ldWOBA: .645, babip: .272,
      avgEV: 85.8, hardHitPct: 26.8, softHitPct: 26.2,
      pullPct: 35.5, centerPct: 38.8, oppoPct: 25.7,
      notes: 'Balanced profile with elite weak contact. High IFFB rate suppresses fly ball damage. Low hard-hit rate.',
    },
    {
      name: 'Spencer Strider', team: 'ATL', role: 'SP', ip: 175.2,
      gbPct: 32.8, fbPct: 42.5, ldPct: 24.7, iffbPct: 8.5, hrFbRate: 14.2,
      gbWOBA: .272, fbWOBA: .425, ldWOBA: .688, babip: .265,
      avgEV: 88.2, hardHitPct: 32.5, softHitPct: 28.8,
      pullPct: 42.5, centerPct: 32.8, oppoPct: 24.7,
      notes: 'Extreme flyball pitcher — lives on strikeouts. When contact is made, it\'s often in the air. HR/FB rate is the risk.',
    },
    {
      name: 'Zack Wheeler', team: 'PHI', role: 'SP', ip: 195.0,
      gbPct: 48.2, fbPct: 28.5, ldPct: 23.3, iffbPct: 15.5, hrFbRate: 11.2,
      gbWOBA: .258, fbWOBA: .372, ldWOBA: .655, babip: .280,
      avgEV: 87.0, hardHitPct: 29.5, softHitPct: 23.8,
      pullPct: 37.5, centerPct: 36.2, oppoPct: 26.3,
      notes: 'Slightly groundball-leaning neutral. Good at suppressing fly ball damage with cutter. Well-rounded profile.',
    },
    {
      name: 'Pablo Lopez', team: 'MIN', role: 'SP', ip: 182.1,
      gbPct: 42.8, fbPct: 34.2, ldPct: 23.0, iffbPct: 16.2, hrFbRate: 12.8,
      gbWOBA: .265, fbWOBA: .405, ldWOBA: .662, babip: .288,
      avgEV: 87.8, hardHitPct: 31.2, softHitPct: 22.2,
      pullPct: 39.2, centerPct: 35.5, oppoPct: 25.3,
      notes: 'Neutral batted ball profile. Fly balls tend to carry. Need defense behind him to handle ground balls.',
    },
    {
      name: 'Ryan Pressly', team: 'HOU', role: 'RP', ip: 62.0,
      gbPct: 52.5, fbPct: 26.8, ldPct: 20.7, iffbPct: 22.5, hrFbRate: 6.8,
      gbWOBA: .242, fbWOBA: .345, ldWOBA: .635, babip: .265,
      avgEV: 84.5, hardHitPct: 24.2, softHitPct: 30.5,
      pullPct: 34.8, centerPct: 38.5, oppoPct: 26.7,
      notes: 'Elite contact suppressor. Low hard-hit rate combined with groundball lean. High IFFB rate on fly balls. Perfect closer profile.',
    },
    {
      name: 'Dylan Cease', team: 'SD', role: 'SP', ip: 178.0,
      gbPct: 38.5, fbPct: 38.2, ldPct: 23.3, iffbPct: 10.8, hrFbRate: 13.5,
      gbWOBA: .275, fbWOBA: .418, ldWOBA: .678, babip: .295,
      avgEV: 88.8, hardHitPct: 34.5, softHitPct: 25.8,
      pullPct: 41.2, centerPct: 33.5, oppoPct: 25.3,
      notes: 'Flyball-heavy profile with strikeout upside but HR risk. When hitters make contact, it tends to be pulled and in the air.',
    },
  ];

  return data.map((d, i) => ({
    ...d,
    id: `gbfb-${i}`,
    profile: classifyProfile(d.gbPct),
  }));
}
