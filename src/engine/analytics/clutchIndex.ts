/**
 * Clutch Performance Index
 *
 * Measures player performance in high-leverage situations:
 * late & close, RISP, 2 outs, tying/go-ahead at bats.
 * Tracks clutch rating and pressure performance splits.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ClutchRating = 'ice_cold_clutch' | 'struggles' | 'average' | 'clutch' | 'mr_clutch';

export const CLUTCH_DISPLAY: Record<ClutchRating, { label: string; emoji: string; color: string }> = {
  mr_clutch:       { label: 'Mr. Clutch',     emoji: '🏆', color: '#22c55e' },
  clutch:          { label: 'Clutch',          emoji: '💪', color: '#3b82f6' },
  average:         { label: 'Average',         emoji: '➖', color: '#6b7280' },
  struggles:       { label: 'Struggles',       emoji: '😰', color: '#f97316' },
  ice_cold_clutch: { label: 'Ice Cold',        emoji: '🥶', color: '#ef4444' },
};

export interface ClutchPlayer {
  id: number;
  name: string;
  pos: string;
  overall: number;
  // Overall clutch
  clutchWPA: number;          // Win Probability Added in clutch situations
  clutchRating: ClutchRating;
  clutchIndex: number;        // -5 to +5 scale
  // Situation splits
  rispAvg: number;
  rispOps: number;
  rbiWithRISP: number;
  lateCloseAvg: number;       // 7th+ within 1 run
  lateCloseOps: number;
  twoOutRBIAvg: number;
  goAheadRBI: number;
  walkoffHits: number;
  // Pressure metrics
  totalHighLevPA: number;
  highLevOps: number;
  lowLevOps: number;
  pressureDiff: number;       // high lev OPS - low lev OPS
}

export interface ClutchSummary {
  mrClutchCount: number;
  clutchCount: number;
  iceCount: number;
  avgClutchIndex: number;
  teamRISPAvg: number;
  totalWalkoffs: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getClutchRating(clutchIndex: number): ClutchRating {
  if (clutchIndex >= 3) return 'mr_clutch';
  if (clutchIndex >= 1) return 'clutch';
  if (clutchIndex >= -1) return 'average';
  if (clutchIndex >= -3) return 'struggles';
  return 'ice_cold_clutch';
}

export function getClutchSummary(players: ClutchPlayer[]): ClutchSummary {
  return {
    mrClutchCount: players.filter(p => p.clutchRating === 'mr_clutch').length,
    clutchCount: players.filter(p => p.clutchRating === 'clutch').length,
    iceCount: players.filter(p => p.clutchRating === 'ice_cold_clutch').length,
    avgClutchIndex: Math.round(players.reduce((s, p) => s + p.clutchIndex, 0) / players.length * 10) / 10,
    teamRISPAvg: Math.round(players.reduce((s, p) => s + p.rispAvg, 0) / players.length * 1000) / 1000,
    totalWalkoffs: players.reduce((s, p) => s + p.walkoffHits, 0),
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoClutchPlayers(): ClutchPlayer[] {
  const data = [
    { name: 'Freddie Freeman',   pos: '1B', ovr: 87, wpa: 3.2,  ci: 4.0,  rA: .335, rO: .920, rbi: 88, lcA: .310, lcO: .880, toA: .295, ga: 22, wo: 3, hlP: 120, hlO: .895, llO: .790 },
    { name: 'Jose Altuve',       pos: '2B', ovr: 82, wpa: 2.1,  ci: 2.5,  rA: .305, rO: .850, rbi: 72, lcA: .285, lcO: .820, toA: .278, ga: 18, wo: 2, hlP: 105, hlO: .845, llO: .780 },
    { name: 'Mookie Betts',      pos: '2B', ovr: 88, wpa: 1.8,  ci: 1.5,  rA: .290, rO: .840, rbi: 65, lcA: .275, lcO: .810, toA: .265, ga: 15, wo: 1, hlP: 115, hlO: .830, llO: .800 },
    { name: 'Aaron Judge',       pos: 'RF', ovr: 92, wpa: 1.2,  ci: 0.5,  rA: .270, rO: .870, rbi: 78, lcA: .260, lcO: .830, toA: .250, ga: 20, wo: 1, hlP: 130, hlO: .850, llO: .840 },
    { name: 'Pete Alonso',       pos: '1B', ovr: 80, wpa: 0.4,  ci: -0.2, rA: .255, rO: .780, rbi: 60, lcA: .240, lcO: .720, toA: .235, ga: 12, wo: 0, hlP: 100, hlO: .740, llO: .770 },
    { name: 'Cody Bellinger',    pos: 'CF', ovr: 75, wpa: -0.5, ci: -1.5, rA: .235, rO: .680, rbi: 45, lcA: .215, lcO: .640, toA: .210, ga: 8,  wo: 0, hlP: 90,  hlO: .660, llO: .750 },
    { name: 'Matt Olson',        pos: '1B', ovr: 82, wpa: -1.2, ci: -2.8, rA: .215, rO: .640, rbi: 38, lcA: .200, lcO: .580, toA: .195, ga: 6,  wo: 0, hlP: 110, hlO: .600, llO: .810 },
    { name: 'Giancarlo Stanton', pos: 'DH', ovr: 78, wpa: -1.8, ci: -3.5, rA: .195, rO: .580, rbi: 30, lcA: .185, lcO: .540, toA: .180, ga: 5,  wo: 0, hlP: 95,  hlO: .560, llO: .800 },
  ];

  return data.map((d, i) => ({
    id: i,
    name: d.name,
    pos: d.pos,
    overall: d.ovr,
    clutchWPA: d.wpa,
    clutchRating: getClutchRating(d.ci),
    clutchIndex: d.ci,
    rispAvg: d.rA,
    rispOps: d.rO,
    rbiWithRISP: d.rbi,
    lateCloseAvg: d.lcA,
    lateCloseOps: d.lcO,
    twoOutRBIAvg: d.toA,
    goAheadRBI: d.ga,
    walkoffHits: d.wo,
    totalHighLevPA: d.hlP,
    highLevOps: d.hlO,
    lowLevOps: d.llO,
    pressureDiff: Math.round((d.hlO - d.llO) * 1000) / 1000,
  }));
}
