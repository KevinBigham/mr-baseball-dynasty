/**
 * Batted Ball Profile / GB-FB Tendencies
 *
 * Tracks ground ball, fly ball, and line drive rates.
 * Identifies pull/center/oppo tendencies and launch angles.
 * Used for defensive positioning and scouting reports.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type BattedBallType = 'ground_ball' | 'line_drive' | 'fly_ball' | 'popup';
export type HitDirection = 'pull' | 'center' | 'oppo';
export type HitterProfile = 'extreme_gb' | 'gb_leaning' | 'neutral' | 'fb_leaning' | 'extreme_fb';

export const PROFILE_DISPLAY: Record<HitterProfile, { label: string; color: string; desc: string }> = {
  extreme_gb: { label: 'Extreme GB',  color: '#3b82f6', desc: 'GB% > 55% — ground ball machine' },
  gb_leaning: { label: 'GB Lean',     color: '#06b6d4', desc: 'GB% 48-55% — slight GB tendency' },
  neutral:    { label: 'Neutral',      color: '#6b7280', desc: 'Balanced batted ball distribution' },
  fb_leaning: { label: 'FB Lean',     color: '#f97316', desc: 'FB% 38-45% — slight FB tendency' },
  extreme_fb: { label: 'Extreme FB',  color: '#ef4444', desc: 'FB% > 45% — high fly ball rate' },
};

export interface BattedBallProfile {
  id: number;
  name: string;
  pos: string;
  overall: number;
  gbRate: number;         // percentage
  ldRate: number;         // percentage
  fbRate: number;         // percentage
  popupRate: number;      // percentage
  pullRate: number;       // percentage
  centerRate: number;     // percentage
  oppoRate: number;       // percentage
  avgLaunchAngle: number; // degrees
  avgExitVelo: number;    // mph
  hardHitRate: number;    // % of batted balls 95+ mph
  barrelRate: number;     // % barrels
  profile: HitterProfile;
  xwOBA: number;          // expected wOBA based on batted ball data
}

export interface BatProfileSummary {
  avgGBRate: number;
  avgFBRate: number;
  avgLaunchAngle: number;
  avgExitVelo: number;
  avgHardHitRate: number;
  highestBarrelRate: string;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getHitterProfile(gbRate: number, fbRate: number): HitterProfile {
  if (gbRate >= 55) return 'extreme_gb';
  if (gbRate >= 48) return 'gb_leaning';
  if (fbRate >= 45) return 'extreme_fb';
  if (fbRate >= 38) return 'fb_leaning';
  return 'neutral';
}

export function getBatProfileSummary(players: BattedBallProfile[]): BatProfileSummary {
  const n = players.length;
  const highestBarrel = players.reduce((best, p) => p.barrelRate > best.barrelRate ? p : best, players[0]);
  return {
    avgGBRate: Math.round(players.reduce((s, p) => s + p.gbRate, 0) / n * 10) / 10,
    avgFBRate: Math.round(players.reduce((s, p) => s + p.fbRate, 0) / n * 10) / 10,
    avgLaunchAngle: Math.round(players.reduce((s, p) => s + p.avgLaunchAngle, 0) / n * 10) / 10,
    avgExitVelo: Math.round(players.reduce((s, p) => s + p.avgExitVelo, 0) / n * 10) / 10,
    avgHardHitRate: Math.round(players.reduce((s, p) => s + p.hardHitRate, 0) / n * 10) / 10,
    highestBarrelRate: highestBarrel.name,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoBatProfiles(): BattedBallProfile[] {
  const data = [
    { name: 'Aaron Judge',       pos: 'RF',  ovr: 92, gb: 35.2, ld: 22.5, fb: 38.1, pu: 4.2, pull: 44, ctr: 32, opp: 24, la: 18.5, ev: 95.8, hh: 52.3, br: 18.5, xw: .425 },
    { name: 'Jose Ramirez',      pos: '3B',  ovr: 88, gb: 48.5, ld: 24.0, fb: 24.5, pu: 3.0, pull: 42, ctr: 35, opp: 23, la: 8.2,  ev: 89.5, hh: 38.2, br: 8.5,  xw: .375 },
    { name: 'Mookie Betts',      pos: '2B',  ovr: 88, gb: 42.0, ld: 25.5, fb: 28.5, pu: 4.0, pull: 40, ctr: 33, opp: 27, la: 12.8, ev: 91.2, hh: 42.5, br: 12.2, xw: .395 },
    { name: 'Freddie Freeman',   pos: '1B',  ovr: 87, gb: 46.5, ld: 26.0, fb: 24.0, pu: 3.5, pull: 38, ctr: 36, opp: 26, la: 9.5,  ev: 90.8, hh: 40.0, br: 10.5, xw: .385 },
    { name: 'Matt Olson',        pos: '1B',  ovr: 82, gb: 32.0, ld: 20.5, fb: 42.5, pu: 5.0, pull: 52, ctr: 28, opp: 20, la: 20.2, ev: 92.5, hh: 45.0, br: 15.8, xw: .360 },
    { name: 'Ozzie Albies',      pos: '2B',  ovr: 78, gb: 52.0, ld: 22.0, fb: 22.5, pu: 3.5, pull: 40, ctr: 34, opp: 26, la: 5.8,  ev: 87.2, hh: 32.5, br: 6.0,  xw: .330 },
    { name: 'Kyle Schwarber',    pos: 'LF',  ovr: 78, gb: 28.5, ld: 19.0, fb: 46.0, pu: 6.5, pull: 55, ctr: 25, opp: 20, la: 22.8, ev: 91.0, hh: 44.5, br: 16.2, xw: .345 },
    { name: 'Bo Bichette',       pos: 'SS',  ovr: 76, gb: 56.5, ld: 21.5, fb: 18.5, pu: 3.5, pull: 38, ctr: 38, opp: 24, la: 2.5,  ev: 88.0, hh: 34.0, br: 5.0,  xw: .310 },
    { name: 'Joey Gallo',        pos: 'RF',  ovr: 62, gb: 25.0, ld: 17.0, fb: 48.5, pu: 9.5, pull: 58, ctr: 22, opp: 20, la: 25.5, ev: 92.8, hh: 48.0, br: 17.0, xw: .300 },
  ];

  return data.map((d, i) => ({
    id: i,
    name: d.name,
    pos: d.pos,
    overall: d.ovr,
    gbRate: d.gb,
    ldRate: d.ld,
    fbRate: d.fb,
    popupRate: d.pu,
    pullRate: d.pull,
    centerRate: d.ctr,
    oppoRate: d.opp,
    avgLaunchAngle: d.la,
    avgExitVelo: d.ev,
    hardHitRate: d.hh,
    barrelRate: d.br,
    profile: getHitterProfile(d.gb, d.fb),
    xwOBA: d.xw,
  }));
}
