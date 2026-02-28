/**
 * Roster Crunch / Transaction Log
 *
 * Tracks 26-man and 40-man roster status, option counts,
 * DFA candidates, waiver priority, and roster moves needed
 * when making transactions.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type RosterAction = 'dfa' | 'option' | 'designate' | 'release' | 'il_move' | 'recall' | 'waiver_claim';

export const ACTION_DISPLAY: Record<RosterAction, { label: string; emoji: string; color: string }> = {
  dfa:          { label: 'DFA',           emoji: '❌', color: '#ef4444' },
  option:       { label: 'Option',        emoji: '⬇️', color: '#f97316' },
  designate:    { label: 'Designate',     emoji: '📋', color: '#eab308' },
  release:      { label: 'Release',       emoji: '🚪', color: '#ef4444' },
  il_move:      { label: 'IL Move',       emoji: '🏥', color: '#3b82f6' },
  recall:       { label: 'Recall',        emoji: '⬆️', color: '#22c55e' },
  waiver_claim: { label: 'Waiver Claim',  emoji: '🎯', color: '#8b5cf6' },
};

export interface RosterSpot {
  id: number;
  name: string;
  pos: string;
  overall: number;
  age: number;
  salary: number;          // millions
  optionsRemaining: number;
  onFortyMan: boolean;
  on26Man: boolean;
  onIL: boolean;
  ilType: '10-day' | '15-day' | '60-day' | null;
  serviceYears: number;
  outOfOptions: boolean;
  dfaCandidate: boolean;
  suggestedAction: RosterAction | null;
  moveReason: string;
}

export interface RosterCrunchSummary {
  roster26Count: number;
  roster40Count: number;
  ilCount: number;
  openSpots26: number;
  openSpots40: number;
  outOfOptionsCount: number;
  dfaCandidates: number;
  pendingMoves: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getRosterSummary(spots: RosterSpot[]): RosterCrunchSummary {
  const on26 = spots.filter(s => s.on26Man).length;
  const on40 = spots.filter(s => s.onFortyMan).length;
  const onIL = spots.filter(s => s.onIL).length;
  return {
    roster26Count: on26,
    roster40Count: on40,
    ilCount: onIL,
    openSpots26: 26 - on26,
    openSpots40: 40 - on40,
    outOfOptionsCount: spots.filter(s => s.outOfOptions).length,
    dfaCandidates: spots.filter(s => s.dfaCandidate).length,
    pendingMoves: spots.filter(s => s.suggestedAction !== null).length,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoRosterCrunch(): RosterSpot[] {
  const data = [
    { name: 'Generic Prospect A',   pos: 'SP', ovr: 72, age: 24, sal: 0.72, opt: 2, fm: true,  m26: false, il: false, ilt: null,       svc: 1.5, oo: false, dfa: false, act: 'recall' as RosterAction,       reason: 'Starter needed after trade' },
    { name: 'Aging Veteran B',      pos: 'RP', ovr: 58, age: 34, sal: 4.5,  opt: 0, fm: true,  m26: true,  il: false, ilt: null,       svc: 10, oo: true,  dfa: true,  act: 'dfa' as RosterAction,           reason: 'Below replacement level' },
    { name: 'Depth Piece C',        pos: 'IF', ovr: 62, age: 27, sal: 0.72, opt: 1, fm: true,  m26: true,  il: false, ilt: null,       svc: 3,  oo: false, dfa: false, act: 'option' as RosterAction,        reason: 'Make room for call-up' },
    { name: 'Injured Star D',       pos: 'SS', ovr: 85, age: 28, sal: 15,   opt: 0, fm: true,  m26: false, il: true,  ilt: '60-day' as const,  svc: 6,  oo: true,  dfa: false, act: null,                        reason: '' },
    { name: 'Rule 5 Pick E',        pos: 'OF', ovr: 55, age: 23, sal: 0.72, opt: 0, fm: true,  m26: true,  il: false, ilt: null,       svc: 0.1, oo: true, dfa: true,  act: 'designate' as RosterAction,     reason: 'Must stay on 26-man or return' },
    { name: 'Setup Man F',          pos: 'RP', ovr: 75, age: 30, sal: 5,    opt: 0, fm: true,  m26: true,  il: false, ilt: null,       svc: 7,  oo: true,  dfa: false, act: null,                        reason: '' },
    { name: 'Utility Man G',        pos: 'UT', ovr: 65, age: 29, sal: 2,    opt: 0, fm: true,  m26: true,  il: false, ilt: null,       svc: 5,  oo: true,  dfa: false, act: null,                        reason: '' },
    { name: 'Hot Prospect H',       pos: 'OF', ovr: 68, age: 22, sal: 0.72, opt: 3, fm: true,  m26: false, il: false, ilt: null,       svc: 0,  oo: false, dfa: false, act: null,                        reason: '' },
    { name: 'Injured Reliever I',   pos: 'RP', ovr: 70, age: 31, sal: 3,    opt: 0, fm: true,  m26: false, il: true,  ilt: '15-day' as const,  svc: 8,  oo: true,  dfa: false, act: null,                        reason: '' },
    { name: 'Waiver Target J',      pos: '1B', ovr: 70, age: 26, sal: 0.72, opt: 2, fm: false, m26: false, il: false, ilt: null,       svc: 2,  oo: false, dfa: false, act: 'waiver_claim' as RosterAction,  reason: 'Solid platoon bat available' },
  ];

  return data.map((d, i) => ({
    id: i,
    name: d.name,
    pos: d.pos,
    overall: d.ovr,
    age: d.age,
    salary: d.sal,
    optionsRemaining: d.opt,
    onFortyMan: d.fm,
    on26Man: d.m26,
    onIL: d.il,
    ilType: d.ilt as '10-day' | '15-day' | '60-day' | null,
    serviceYears: d.svc,
    outOfOptions: d.oo,
    dfaCandidate: d.dfa,
    suggestedAction: d.act as RosterAction | null,
    moveReason: d.reason,
  }));
}
