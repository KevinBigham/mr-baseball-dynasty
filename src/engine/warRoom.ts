/**
 * warRoom.ts — Trade Deadline War Room Engine
 *
 * Generates deadline trade offers, AI league trades, expiring offers,
 * bidding wars, and counter-offer logic. Pure functions, deterministic.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DeadlineOffer {
  id: string;
  fromTeamId: number;
  fromTeamAbbr: string;
  offeredPlayers: Array<{ name: string; position: string; overall: number }>;
  requestedPlayers: Array<{ name: string; position: string; overall: number }>;
  fairness: number;         // 0-100
  confidence: number;       // 0-100 — GM willingness
  expiresInAdvances: number; // How many advances before offer expires
  hasBiddingWar: boolean;   // Another team is also interested
  rivalBidder: string | null; // "NYY also interested"
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'countered';
}

export interface LeagueTrade {
  id: string;
  buyerAbbr: string;
  sellerAbbr: string;
  playerMoved: string;
  playerPosition: string;
  prospectsSent: number;
  headline: string;
}

export interface TransactionTick {
  id: string;
  timestamp: string;       // In-game date
  type: 'trade' | 'signing' | 'callup' | 'dfa' | 'waiver';
  headline: string;
  teamAbbrs: string[];
}

// ─── Deterministic helpers ──────────────────────────────────────────────

function hashSeed(a: number, b: number): number {
  let h = (a * 2654435761 + b) | 0;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  h = ((h >> 16) ^ h) * 0x45d9f3b;
  return ((h >> 16) ^ h) & 0x7fffffff;
}

const TEAM_ABBRS = [
  'NYY','BOS','TBR','TOR','BAL','CLE','MIN','CHW','DET','KCR',
  'HOU','SEA','LAA','TEX','OAK','ATL','NYM','PHI','MIA','WSN',
  'MIL','CHC','STL','PIT','CIN','LAD','SFG','SDP','ARI','COL',
];

const PLAYER_NAMES = [
  'J. Martinez','M. Johnson','K. Williams','D. Brown','A. Davis',
  'R. Garcia','T. Miller','C. Wilson','P. Anderson','S. Thomas',
  'B. Jackson','L. White','N. Harris','E. Martin','F. Thompson',
];

const POSITIONS = ['SP','RP','C','1B','2B','3B','SS','LF','CF','RF'];

// ─── Generators ─────────────────────────────────────────────────────────

/**
 * Generate AI league trades happening around the deadline.
 */
export function generateLeagueTrades(
  season: number,
  segment: number,
  count: number,
): LeagueTrade[] {
  const trades: LeagueTrade[] = [];
  for (let i = 0; i < count; i++) {
    const seed = hashSeed(season * 100 + segment, i);
    const buyerIdx = seed % TEAM_ABBRS.length;
    const sellerIdx = (seed + 7) % TEAM_ABBRS.length;
    if (buyerIdx === sellerIdx) continue;

    const nameIdx = seed % PLAYER_NAMES.length;
    const posIdx = seed % POSITIONS.length;
    const prospects = 1 + (seed % 3);

    trades.push({
      id: `lt-${season}-${segment}-${i}`,
      buyerAbbr: TEAM_ABBRS[buyerIdx],
      sellerAbbr: TEAM_ABBRS[sellerIdx],
      playerMoved: PLAYER_NAMES[nameIdx],
      playerPosition: POSITIONS[posIdx],
      prospectsSent: prospects,
      headline: `${TEAM_ABBRS[buyerIdx]} acquires ${PLAYER_NAMES[nameIdx]} (${POSITIONS[posIdx]}) from ${TEAM_ABBRS[sellerIdx]} for ${prospects} prospect${prospects > 1 ? 's' : ''}`,
    });
  }
  return trades;
}

/**
 * Generate transaction ticker entries for a given phase.
 */
export function generateTransactionTicker(
  season: number,
  segment: number,
  phase: 'season' | 'deadline' | 'offseason',
): TransactionTick[] {
  const ticks: TransactionTick[] = [];
  const count = phase === 'deadline' ? 5 : phase === 'offseason' ? 4 : 2;

  for (let i = 0; i < count; i++) {
    const seed = hashSeed(season * 1000 + segment * 10, i + 100);
    const teamIdx = seed % TEAM_ABBRS.length;
    const nameIdx = (seed + 3) % PLAYER_NAMES.length;
    const posIdx = seed % POSITIONS.length;

    const types: TransactionTick['type'][] = phase === 'deadline'
      ? ['trade', 'trade', 'callup', 'dfa', 'waiver']
      : phase === 'offseason'
      ? ['signing', 'signing', 'trade', 'dfa']
      : ['callup', 'dfa'];

    const type = types[i % types.length];
    const team = TEAM_ABBRS[teamIdx];
    const name = PLAYER_NAMES[nameIdx];
    const pos = POSITIONS[posIdx];

    const headlines: Record<TransactionTick['type'], string> = {
      trade: `${team} trades for ${name} (${pos})`,
      signing: `${team} signs ${name} (${pos}) to multi-year deal`,
      callup: `${team} promotes ${name} (${pos}) from AAA`,
      dfa: `${team} DFAs ${name} (${pos})`,
      waiver: `${name} (${pos}) clears waivers — assigned to ${team} AAA`,
    };

    ticks.push({
      id: `tick-${season}-${segment}-${i}`,
      timestamp: `${season}-07-${15 + i}`,
      type,
      headline: headlines[type],
      teamAbbrs: [team],
    });
  }

  return ticks;
}

/**
 * Check if current segment is deadline-eligible.
 */
export function isDeadlineMode(segment: number): boolean {
  // Segments 1 and 2 correspond to June-July and July-August
  return segment === 1 || segment === 2;
}
