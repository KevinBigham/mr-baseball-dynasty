// ─── Minor League System ──────────────────────────────────────────────────
// AAA/AA/A affiliates, promotion/demotion tracking, and rehab assignments.

export type MinorLevel = 'AAA' | 'AA' | 'A+' | 'A' | 'Rookie';

export interface MinorLeaguePlayer {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  potential: number;
  level: MinorLevel;
  stats: MinorStats;
  eta: number;           // seasons until MLB-ready
  onRehabAssignment: boolean;
  serviceTime: number;    // days of minor league service
  onFortyMan: boolean;
  trend: 'rising' | 'steady' | 'falling';
  readyForPromotion: boolean;
}

export interface MinorStats {
  gamesPlayed: number;
  avg: number;
  hr: number;
  rbi: number;
  sb: number;
  era?: number;
  wins?: number;
  so?: number;
  ip?: number;
}

export interface AffiliateTeam {
  level: MinorLevel;
  name: string;
  city: string;
  record: { wins: number; losses: number };
  players: MinorLeaguePlayer[];
}

export const LEVEL_DISPLAY: Record<MinorLevel, { label: string; color: string; order: number }> = {
  AAA:    { label: 'Triple-A', color: '#ef4444', order: 1 },
  AA:     { label: 'Double-A', color: '#f59e0b', order: 2 },
  'A+':   { label: 'High-A', color: '#3b82f6', order: 3 },
  A:      { label: 'Single-A', color: '#22c55e', order: 4 },
  Rookie: { label: 'Rookie Ball', color: '#94a3b8', order: 5 },
};

export function getETALabel(eta: number): { label: string; color: string } {
  if (eta <= 0) return { label: 'MLB Ready', color: '#22c55e' };
  if (eta === 1) return { label: '1 Season', color: '#a3e635' };
  if (eta <= 2) return { label: `${eta} Seasons`, color: '#eab308' };
  return { label: `${eta}+ Seasons`, color: '#f97316' };
}

export function canPromote(player: MinorLeaguePlayer): boolean {
  if (player.level === 'AAA') return true; // to MLB
  return player.readyForPromotion;
}

export function promote(player: MinorLeaguePlayer): MinorLeaguePlayer {
  const levels: MinorLevel[] = ['Rookie', 'A', 'A+', 'AA', 'AAA'];
  const idx = levels.indexOf(player.level);
  if (idx >= levels.length - 1) return player; // Already at AAA
  return { ...player, level: levels[idx + 1], readyForPromotion: false };
}

export function demote(player: MinorLeaguePlayer): MinorLeaguePlayer {
  const levels: MinorLevel[] = ['Rookie', 'A', 'A+', 'AA', 'AAA'];
  const idx = levels.indexOf(player.level);
  if (idx <= 0) return player; // Already at lowest
  return { ...player, level: levels[idx - 1] };
}

export function getSystemSummary(affiliates: AffiliateTeam[]) {
  const totalPlayers = affiliates.reduce((s, a) => s + a.players.length, 0);
  const avgOvr = totalPlayers > 0
    ? Math.round(affiliates.flatMap(a => a.players).reduce((s, p) => s + p.overall, 0) / totalPlayers)
    : 0;
  const mlbReady = affiliates.flatMap(a => a.players).filter(p => p.eta <= 0).length;
  const fortyMan = affiliates.flatMap(a => a.players).filter(p => p.onFortyMan).length;
  const rehab = affiliates.flatMap(a => a.players).filter(p => p.onRehabAssignment).length;
  return { totalPlayers, avgOvr, mlbReady, fortyMan, rehab };
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoAffiliates(): AffiliateTeam[] {
  return [
    {
      level: 'AAA', name: 'Storm Chasers', city: 'Omaha', record: { wins: 55, losses: 42 },
      players: [
        { id: 201, name: 'Tyler Davis', pos: 'SS', age: 23, overall: 68, potential: 78, level: 'AAA', stats: { gamesPlayed: 85, avg: 0.298, hr: 14, rbi: 52, sb: 18 }, eta: 0, onRehabAssignment: false, serviceTime: 620, onFortyMan: true, trend: 'rising', readyForPromotion: true },
        { id: 202, name: 'Jake Rodriguez', pos: 'SP', age: 24, overall: 65, potential: 75, level: 'AAA', stats: { gamesPlayed: 20, avg: 0, hr: 0, rbi: 0, sb: 0, era: 3.42, wins: 9, so: 112, ip: 118 }, eta: 1, onRehabAssignment: false, serviceTime: 540, onFortyMan: true, trend: 'steady', readyForPromotion: false },
        { id: 203, name: 'Marcus Bell', pos: '1B', age: 29, overall: 72, potential: 72, level: 'AAA', stats: { gamesPlayed: 8, avg: 0.250, hr: 1, rbi: 3, sb: 0 }, eta: 0, onRehabAssignment: true, serviceTime: 0, onFortyMan: true, trend: 'steady', readyForPromotion: false },
      ],
    },
    {
      level: 'AA', name: 'Wind Surge', city: 'Wichita', record: { wins: 48, losses: 48 },
      players: [
        { id: 204, name: 'Leo Castillo', pos: 'CF', age: 22, overall: 60, potential: 80, level: 'AA', stats: { gamesPlayed: 92, avg: 0.275, hr: 18, rbi: 55, sb: 25 }, eta: 2, onRehabAssignment: false, serviceTime: 380, onFortyMan: false, trend: 'rising', readyForPromotion: true },
        { id: 205, name: 'Dmitri Volkov', pos: 'RP', age: 23, overall: 58, potential: 72, level: 'AA', stats: { gamesPlayed: 40, avg: 0, hr: 0, rbi: 0, sb: 0, era: 2.88, wins: 3, so: 78, ip: 56 }, eta: 2, onRehabAssignment: false, serviceTime: 340, onFortyMan: false, trend: 'rising', readyForPromotion: true },
      ],
    },
    {
      level: 'A+', name: 'Mighty Mussels', city: 'Fort Myers', record: { wins: 52, losses: 40 },
      players: [
        { id: 206, name: 'Shota Yamamoto', pos: 'SP', age: 20, overall: 55, potential: 85, level: 'A+', stats: { gamesPlayed: 18, avg: 0, hr: 0, rbi: 0, sb: 0, era: 2.55, wins: 8, so: 105, ip: 92 }, eta: 3, onRehabAssignment: false, serviceTime: 220, onFortyMan: false, trend: 'rising', readyForPromotion: true },
        { id: 207, name: 'Jaylen Thomas', pos: '3B', age: 21, overall: 52, potential: 75, level: 'A+', stats: { gamesPlayed: 88, avg: 0.265, hr: 12, rbi: 48, sb: 8 }, eta: 3, onRehabAssignment: false, serviceTime: 210, onFortyMan: false, trend: 'steady', readyForPromotion: false },
      ],
    },
    {
      level: 'A', name: 'Kernels', city: 'Cedar Rapids', record: { wins: 44, losses: 52 },
      players: [
        { id: 208, name: 'Pedro Alvarez Jr.', pos: 'C', age: 19, overall: 45, potential: 78, level: 'A', stats: { gamesPlayed: 72, avg: 0.240, hr: 8, rbi: 35, sb: 2 }, eta: 4, onRehabAssignment: false, serviceTime: 140, onFortyMan: false, trend: 'rising', readyForPromotion: false },
      ],
    },
    {
      level: 'Rookie', name: 'Twins DSL', city: 'Dominican Republic', record: { wins: 30, losses: 28 },
      players: [
        { id: 209, name: 'Angel Medina', pos: 'SS', age: 18, overall: 40, potential: 82, level: 'Rookie', stats: { gamesPlayed: 45, avg: 0.285, hr: 3, rbi: 22, sb: 15 }, eta: 5, onRehabAssignment: false, serviceTime: 60, onFortyMan: false, trend: 'rising', readyForPromotion: false },
      ],
    },
  ];
}
