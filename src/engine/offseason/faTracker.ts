/**
 * faTracker.ts – Free agent tracker & market dashboard
 *
 * Tracks free agent market status, projected contracts, market heat,
 * team interest, comparable signings, and signing timeline.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type MarketStatus = 'signed' | 'hot' | 'active' | 'quiet' | 'unsigned';
export type QualifyingOffer = 'accepted' | 'rejected' | 'none';

export interface FreeAgentEntry {
  id: string;
  name: string;
  pos: string;
  age: number;
  formerTeam: string;
  recentWAR: number;
  marketStatus: MarketStatus;
  projectedYears: number;
  projectedAAV: number;     // $M
  projectedTotal: number;   // $M
  qo: QualifyingOffer;
  interestedTeams: string[];
  signedTeam?: string;
  signedYears?: number;
  signedAAV?: number;
  signingDate?: string;
  comp: string;              // comparable FA signing
  notes: string;
}

export const STATUS_DISPLAY: Record<MarketStatus, { label: string; color: string }> = {
  signed:   { label: 'Signed',   color: '#22c55e' },
  hot:      { label: 'Hot',      color: '#ef4444' },
  active:   { label: 'Active',   color: '#f59e0b' },
  quiet:    { label: 'Quiet',    color: '#888' },
  unsigned: { label: 'Unsigned', color: '#666' },
};

// ── Summary ────────────────────────────────────────────────────────────────

export interface FATrackerSummary {
  totalFAs: number;
  signedCount: number;
  totalCommitted: number;    // $M
  biggestDeal: string;
  hottest: string;
  avgAAV: number;
}

export function getFATrackerSummary(agents: FreeAgentEntry[]): FATrackerSummary {
  const signed = agents.filter(a => a.marketStatus === 'signed');
  const totalCommit = signed.reduce((s, a) => s + (a.signedAAV ?? 0) * (a.signedYears ?? 0), 0);
  const biggest = signed.reduce((a, b) => ((a.signedAAV ?? 0) * (a.signedYears ?? 0)) > ((b.signedAAV ?? 0) * (b.signedYears ?? 0)) ? a : b, signed[0]);
  const hot = agents.filter(a => a.marketStatus === 'hot')[0];
  const avgAAV = signed.length > 0 ? Math.round(signed.reduce((s, a) => s + (a.signedAAV ?? 0), 0) / signed.length * 10) / 10 : 0;
  return {
    totalFAs: agents.length,
    signedCount: signed.length,
    totalCommitted: Math.round(totalCommit),
    biggestDeal: biggest?.name ?? '',
    hottest: hot?.name ?? 'N/A',
    avgAAV,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const FA_LIST: Array<{ name: string; pos: string; age: number; team: string; war: number; status: MarketStatus; projYrs: number; projAAV: number; qo: QualifyingOffer }> = [
  { name: 'Juan Soto', pos: 'RF', age: 26, team: 'NYY', war: 7.2, status: 'signed', projYrs: 15, projAAV: 51, qo: 'rejected' },
  { name: 'Corbin Burnes', pos: 'SP', age: 30, team: 'BAL', war: 4.8, status: 'signed', projYrs: 6, projAAV: 30, qo: 'rejected' },
  { name: 'Pete Alonso', pos: '1B', age: 30, team: 'NYM', war: 3.5, status: 'hot', projYrs: 5, projAAV: 28, qo: 'rejected' },
  { name: 'Alex Bregman', pos: '3B', age: 31, team: 'HOU', war: 4.1, status: 'active', projYrs: 5, projAAV: 26, qo: 'rejected' },
  { name: 'Anthony Santander', pos: 'RF', age: 30, team: 'BAL', war: 4.5, status: 'signed', projYrs: 5, projAAV: 25, qo: 'rejected' },
  { name: 'Willy Adames', pos: 'SS', age: 29, team: 'MIL', war: 5.2, status: 'signed', projYrs: 7, projAAV: 32, qo: 'rejected' },
  { name: 'Blake Snell', pos: 'SP', age: 32, team: 'SF', war: 2.0, status: 'quiet', projYrs: 3, projAAV: 22, qo: 'none' },
  { name: 'Max Fried', pos: 'SP', age: 31, team: 'ATL', war: 3.8, status: 'signed', projYrs: 8, projAAV: 27, qo: 'rejected' },
  { name: 'Christian Walker', pos: '1B', age: 34, team: 'ARI', war: 3.2, status: 'active', projYrs: 3, projAAV: 18, qo: 'none' },
  { name: 'Teoscar Hernández', pos: 'LF', age: 32, team: 'LAD', war: 3.0, status: 'signed', projYrs: 3, projAAV: 20, qo: 'none' },
];

const INTERESTED: string[][] = [
  ['NYY', 'NYM', 'LAD', 'BOS', 'TOR'],
  ['ARI', 'BAL', 'PHI', 'SF'],
  ['NYM', 'LAD', 'SEA', 'HOU'],
  ['HOU', 'DET', 'BOS', 'CHC'],
  ['TOR', 'NYY', 'SEA'],
  ['SF', 'LAD', 'BOS', 'NYM'],
  ['LAD', 'NYY', 'ATL'],
  ['NYY', 'ATL', 'TOR', 'BOS'],
  ['ARI', 'SEA', 'HOU'],
  ['LAD', 'BOS', 'PHI'],
];

const COMPS = [
  'Bryce Harper (13yr/$330M)', 'Max Scherzer (3yr/$130M)', 'Freddie Freeman (6yr/$162M)',
  'Carlos Correa (6yr/$200M)', 'Nick Castellanos (5yr/$100M)', 'Trea Turner (11yr/$300M)',
  'Kevin Gausman (5yr/$110M)', 'Jacob deGrom (5yr/$185M)', 'José Abreu (3yr/$58M)',
  'Teoscar Hernández (1yr/$23M)',
];

export function generateDemoFATracker(): FreeAgentEntry[] {
  return FA_LIST.map((fa, i) => {
    const signed = fa.status === 'signed';
    return {
      id: `fa-${i}`,
      name: fa.name,
      pos: fa.pos,
      age: fa.age,
      formerTeam: fa.team,
      recentWAR: fa.war,
      marketStatus: fa.status,
      projectedYears: fa.projYrs,
      projectedAAV: fa.projAAV,
      projectedTotal: fa.projYrs * fa.projAAV,
      qo: fa.qo,
      interestedTeams: INTERESTED[i],
      signedTeam: signed ? INTERESTED[i][0] : undefined,
      signedYears: signed ? fa.projYrs : undefined,
      signedAAV: signed ? fa.projAAV + ((i * 3) % 5) - 2 : undefined,
      signingDate: signed ? `Dec ${10 + i * 3}` : undefined,
      comp: COMPS[i],
      notes: signed ? `Signed ${fa.projYrs}-year deal with ${INTERESTED[i][0]}. Strong market drove price above initial projections.` :
             fa.status === 'hot' ? 'Multiple teams bidding. Deal expected soon.' :
             fa.status === 'active' ? 'Exploring market. Seeking best fit and value.' :
             'Market slow to develop. May need to wait for first tier to sign.',
    };
  });
}
