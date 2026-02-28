/**
 * Plate Discipline Analytics
 *
 * Comprehensive plate discipline metrics including walk rate,
 * chase rate, contact rates, zone awareness, and swing decisions.
 * Key to identifying disciplined vs free-swinging hitters.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type DisciplineGrade = 'elite' | 'plus' | 'average' | 'below_avg' | 'poor';

export const DISCIPLINE_DISPLAY: Record<DisciplineGrade, { label: string; color: string; emoji: string }> = {
  elite:     { label: 'Elite Eye',   color: '#22c55e', emoji: '👁️' },
  plus:      { label: 'Plus Eye',    color: '#3b82f6', emoji: '👀' },
  average:   { label: 'Average',     color: '#eab308', emoji: '➖' },
  below_avg: { label: 'Below Avg',   color: '#f97316', emoji: '😐' },
  poor:      { label: 'Free Swinger', color: '#ef4444', emoji: '💨' },
};

export interface DisciplinePlayer {
  id: number;
  name: string;
  pos: string;
  overall: number;
  pa: number;              // plate appearances
  bbRate: number;          // walk percentage
  kRate: number;           // strikeout percentage
  bbkRatio: number;        // BB/K ratio
  chaseRate: number;       // swing at pitches outside zone
  contactRate: number;     // overall contact percentage
  zoneContactRate: number; // contact on pitches in zone
  outZoneSwing: number;    // O-Swing%
  zoneSwing: number;       // Z-Swing%
  swstrRate: number;       // swinging strike percentage
  firstPitchSwing: number; // % of first pitches swung at
  pitchesPerPA: number;    // avg pitches seen per PA
  disciplineGrade: DisciplineGrade;
}

export interface DisciplineSummary {
  teamBBRate: number;
  teamKRate: number;
  teamChaseRate: number;
  teamContactRate: number;
  eliteEyeCount: number;
  freeSwingCount: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getDisciplineGrade(bbRate: number, chaseRate: number): DisciplineGrade {
  const score = bbRate * 2 - chaseRate;
  if (score >= 15) return 'elite';
  if (score >= 8) return 'plus';
  if (score >= 0) return 'average';
  if (score >= -8) return 'below_avg';
  return 'poor';
}

export function getDisciplineSummary(players: DisciplinePlayer[]): DisciplineSummary {
  const n = players.length;
  return {
    teamBBRate: Math.round(players.reduce((s, p) => s + p.bbRate, 0) / n * 10) / 10,
    teamKRate: Math.round(players.reduce((s, p) => s + p.kRate, 0) / n * 10) / 10,
    teamChaseRate: Math.round(players.reduce((s, p) => s + p.chaseRate, 0) / n * 10) / 10,
    teamContactRate: Math.round(players.reduce((s, p) => s + p.contactRate, 0) / n * 10) / 10,
    eliteEyeCount: players.filter(p => p.disciplineGrade === 'elite').length,
    freeSwingCount: players.filter(p => p.disciplineGrade === 'poor').length,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoDiscipline(): DisciplinePlayer[] {
  const data = [
    { name: 'Juan Soto',       pos: 'RF',  ovr: 90, pa: 550, bb: 15.5, k: 18.2, chase: 18.5, cR: 82.0, zc: 92.5, oz: 22.0, zs: 68.0, sw: 8.5,  fps: 22, pppa: 4.35 },
    { name: 'Kyle Schwarber',  pos: 'LF',  ovr: 78, pa: 520, bb: 14.2, k: 28.5, chase: 22.0, cR: 72.5, zc: 88.0, oz: 26.0, zs: 72.0, sw: 14.0, fps: 30, pppa: 4.20 },
    { name: 'Shohei Ohtani',   pos: 'DH',  ovr: 95, pa: 580, bb: 12.8, k: 22.0, chase: 28.0, cR: 78.0, zc: 90.0, oz: 32.0, zs: 75.0, sw: 12.0, fps: 35, pppa: 3.90 },
    { name: 'Luis Arraez',     pos: '1B',  ovr: 76, pa: 550, bb: 8.5,  k: 8.0,  chase: 16.0, cR: 92.0, zc: 96.5, oz: 18.0, zs: 80.0, sw: 4.0,  fps: 40, pppa: 3.65 },
    { name: 'Salvador Perez',  pos: 'C',   ovr: 78, pa: 500, bb: 4.2,  k: 22.0, chase: 38.0, cR: 75.0, zc: 86.0, oz: 42.0, zs: 78.0, sw: 12.5, fps: 48, pppa: 3.40 },
    { name: 'Bo Bichette',     pos: 'SS',  ovr: 76, pa: 530, bb: 5.0,  k: 18.0, chase: 34.0, cR: 80.0, zc: 90.0, oz: 38.0, zs: 74.0, sw: 10.0, fps: 42, pppa: 3.55 },
    { name: 'Freddie Freeman',  pos: '1B', ovr: 87, pa: 560, bb: 11.0, k: 16.5, chase: 20.0, cR: 85.0, zc: 93.0, oz: 24.0, zs: 70.0, sw: 7.5,  fps: 28, pppa: 4.10 },
    { name: 'Mookie Betts',    pos: '2B',  ovr: 88, pa: 540, bb: 12.0, k: 14.0, chase: 22.0, cR: 84.0, zc: 92.0, oz: 25.0, zs: 72.0, sw: 7.0,  fps: 32, pppa: 4.05 },
  ];

  return data.map((d, i) => ({
    id: i,
    name: d.name,
    pos: d.pos,
    overall: d.ovr,
    pa: d.pa,
    bbRate: d.bb,
    kRate: d.k,
    bbkRatio: Math.round((d.bb / d.k) * 100) / 100,
    chaseRate: d.chase,
    contactRate: d.cR,
    zoneContactRate: d.zc,
    outZoneSwing: d.oz,
    zoneSwing: d.zs,
    swstrRate: d.sw,
    firstPitchSwing: d.fps,
    pitchesPerPA: d.pppa,
    disciplineGrade: getDisciplineGrade(d.bb, d.chase),
  }));
}
