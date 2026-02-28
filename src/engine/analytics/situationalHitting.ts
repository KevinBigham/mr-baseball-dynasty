/**
 * Situational Hitting
 *
 * Detailed performance splits by game situation including RISP,
 * bases loaded, 2-out situations, late-and-close, sac fly
 * opportunities, and run-scoring efficiency.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type ClutchRating = 'lockdown' | 'reliable' | 'average' | 'shaky' | 'chokes';

export const CLUTCH_DISPLAY: Record<ClutchRating, { label: string; color: string; emoji: string }> = {
  lockdown: { label: 'Lockdown',  color: '#22c55e', emoji: '🔒' },
  reliable: { label: 'Reliable',  color: '#3b82f6', emoji: '✅' },
  average:  { label: 'Average',   color: '#eab308', emoji: '➖' },
  shaky:    { label: 'Shaky',     color: '#f97316', emoji: '😬' },
  chokes:   { label: 'Chokes',    color: '#ef4444', emoji: '😰' },
};

export interface SituationSplit {
  situation: string;
  pa: number;
  avg: number;
  obp: number;
  slg: number;
  rbi: number;
  kRate: number;
}

export interface SituationalPlayer {
  id: number;
  name: string;
  pos: string;
  overall: number;
  clutchRating: ClutchRating;
  overallAvg: number;
  splits: SituationSplit[];
  rbiEfficiency: number;       // % of runners on base driven in
  twoOutRBI: number;
  goAheadRBI: number;
  walkOffHits: number;
}

export interface SituationalSummary {
  teamRISPAvg: number;
  teamBasesLoadedAvg: number;
  team2OutRBIPct: number;
  lockdownCount: number;
  chokesCount: number;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function getClutchRating(rispAvg: number, overallAvg: number): ClutchRating {
  const diff = rispAvg - overallAvg;
  if (diff >= .040) return 'lockdown';
  if (diff >= .010) return 'reliable';
  if (diff >= -.010) return 'average';
  if (diff >= -.040) return 'shaky';
  return 'chokes';
}

export function getSituationalSummary(players: SituationalPlayer[]): SituationalSummary {
  const n = players.length;
  const rispSplits = players.map(p => p.splits.find(s => s.situation === 'RISP'));
  const loadedSplits = players.map(p => p.splits.find(s => s.situation === 'Bases Loaded'));
  return {
    teamRISPAvg: Math.round(rispSplits.reduce((s, sp) => s + (sp?.avg ?? 0), 0) / n * 1000) / 1000,
    teamBasesLoadedAvg: Math.round(loadedSplits.reduce((s, sp) => s + (sp?.avg ?? 0), 0) / n * 1000) / 1000,
    team2OutRBIPct: Math.round(players.reduce((s, p) => s + p.twoOutRBI, 0) / players.reduce((s, p) => s + p.splits[0]?.rbi || 0, 0) * 100),
    lockdownCount: players.filter(p => p.clutchRating === 'lockdown').length,
    chokesCount: players.filter(p => p.clutchRating === 'chokes').length,
  };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

export function generateDemoSituational(): SituationalPlayer[] {
  const makeSplits = (risp: number, loaded: number, twoOut: number, late: number, sacFly: number, leadoff: number): SituationSplit[] => [
    { situation: 'RISP', pa: 120, avg: risp, obp: risp + .080, slg: risp + .200, rbi: 45, kRate: 18 },
    { situation: 'Bases Loaded', pa: 25, avg: loaded, obp: loaded + .050, slg: loaded + .300, rbi: 18, kRate: 15 },
    { situation: '2-Out RISP', pa: 55, avg: twoOut, obp: twoOut + .070, slg: twoOut + .180, rbi: 22, kRate: 20 },
    { situation: 'Late & Close', pa: 80, avg: late, obp: late + .090, slg: late + .170, rbi: 15, kRate: 19 },
    { situation: 'Sac Fly Opp', pa: 30, avg: sacFly, obp: sacFly + .060, slg: sacFly + .100, rbi: 12, kRate: 12 },
    { situation: 'Leading Off', pa: 140, avg: leadoff, obp: leadoff + .100, slg: leadoff + .150, rbi: 0, kRate: 22 },
  ];

  return [
    { id: 0, name: 'Freddie Freeman', pos: '1B', overall: 87, clutchRating: 'lockdown', overallAvg: .291,
      splits: makeSplits(.340, .380, .325, .310, .350, .275), rbiEfficiency: 42, twoOutRBI: 28, goAheadRBI: 15, walkOffHits: 3 },
    { id: 1, name: 'Juan Soto', pos: 'RF', overall: 90, clutchRating: 'reliable', overallAvg: .300,
      splits: makeSplits(.318, .360, .305, .320, .310, .285), rbiEfficiency: 38, twoOutRBI: 22, goAheadRBI: 12, walkOffHits: 1 },
    { id: 2, name: 'Shohei Ohtani', pos: 'DH', overall: 95, clutchRating: 'average', overallAvg: .285,
      splits: makeSplits(.280, .300, .270, .275, .290, .310), rbiEfficiency: 35, twoOutRBI: 18, goAheadRBI: 14, walkOffHits: 2 },
    { id: 3, name: 'Mookie Betts', pos: '2B', overall: 88, clutchRating: 'reliable', overallAvg: .278,
      splits: makeSplits(.295, .340, .290, .305, .320, .260), rbiEfficiency: 40, twoOutRBI: 25, goAheadRBI: 10, walkOffHits: 2 },
    { id: 4, name: 'Trea Turner', pos: 'SS', overall: 82, clutchRating: 'shaky', overallAvg: .265,
      splits: makeSplits(.230, .200, .215, .240, .250, .290), rbiEfficiency: 25, twoOutRBI: 10, goAheadRBI: 6, walkOffHits: 0 },
    { id: 5, name: 'Salvador Perez', pos: 'C', overall: 78, clutchRating: 'lockdown', overallAvg: .255,
      splits: makeSplits(.310, .400, .295, .280, .330, .230), rbiEfficiency: 45, twoOutRBI: 30, goAheadRBI: 18, walkOffHits: 4 },
    { id: 6, name: 'Kyle Schwarber', pos: 'LF', overall: 78, clutchRating: 'chokes', overallAvg: .248,
      splits: makeSplits(.195, .180, .175, .210, .220, .270), rbiEfficiency: 22, twoOutRBI: 8, goAheadRBI: 5, walkOffHits: 1 },
  ];
}
