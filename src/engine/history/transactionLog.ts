/**
 * transactionLog.ts – Transaction History Log Engine
 *
 * Complete chronological record of all roster transactions including
 * trades, signings, releases, DFAs, waiver claims, options, recalls,
 * extensions, draft picks, and retirements. Each entry tracks date,
 * type, players involved, teams, financial impact, and significance.
 *
 * All demo data — no sim engine integration.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type TransactionType =
  | 'trade'
  | 'signing'
  | 'release'
  | 'dfa'
  | 'waiver_claim'
  | 'option'
  | 'recall'
  | 'extension'
  | 'draft'
  | 'retirement';

export interface TransactionEntry {
  id: number;
  date: string;               // "YYYY-MM-DD" format
  season: number;
  type: TransactionType;
  description: string;
  playersInvolved: string[];
  teamsInvolved: string[];
  financialImpact: number;    // dollars (positive = spending, negative = savings)
  significance: 'major' | 'minor' | 'routine';
}

export interface TransactionLogData {
  teamName: string;
  transactions: TransactionEntry[];
  seasonSummary: {
    season: number;
    count: number;
    netSpend: number;
  }[];
}

// ── Display Maps ───────────────────────────────────────────────────────────

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  trade: 'TRADE',
  signing: 'SIGNING',
  release: 'RELEASE',
  dfa: 'DFA',
  waiver_claim: 'WAIVER',
  option: 'OPTION',
  recall: 'RECALL',
  extension: 'EXTENSION',
  draft: 'DRAFT',
  retirement: 'RETIRE',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  trade: '#f59e0b',
  signing: '#22c55e',
  release: '#ef4444',
  dfa: '#f97316',
  waiver_claim: '#a855f7',
  option: '#6b7280',
  recall: '#3b82f6',
  extension: '#14b8a6',
  draft: '#eab308',
  retirement: '#94a3b8',
};

export const SIGNIFICANCE_COLORS: Record<string, string> = {
  major: '#f59e0b',
  minor: '#6b7280',
  routine: '#374151',
};

// ── Demo Data ──────────────────────────────────────────────────────────────

const PLAYER_NAMES = [
  'Marcus Bell', 'Carlos Reyes', 'Derek Anderson', 'David Chen',
  'Alex Ramirez', 'Mike Torres', 'Tommy Nakamura', 'Darius Coleman',
  'Ryan Mitchell', 'Jake Williams', 'Brandon Scott', 'Tyler Evans',
  'Kevin Park', 'Chris Martinez', 'Jordan Lewis', 'Sam Thompson',
  'Anthony Rodriguez', 'Nick Patterson', 'Elijah Hayes', 'Jamal Wright',
  'Tanner Reed', 'Caleb Morgan', 'Oscar Gutierrez', 'Devon Clarke',
];

const TEAM_NAMES = [
  'Brooklyn Bolts', 'Portland Pines', 'Nashville Knights', 'Las Vegas Aces',
  'Charlotte Cougars', 'Montreal Expos', 'Austin Outlaws', 'Salt Lake Stingers',
];

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 11) % 2147483647;
    return (s & 0x7fffffff) / 0x7fffffff;
  };
}

function buildDemoTransactions(rand: () => number): TransactionEntry[] {
  const transactions: TransactionEntry[] = [];
  let nextId = 1;

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(rand() * arr.length)];
  }

  function pickTwo<T>(arr: T[]): [T, T] {
    const a = Math.floor(rand() * arr.length);
    let b = Math.floor(rand() * (arr.length - 1));
    if (b >= a) b++;
    return [arr[a], arr[b]];
  }

  function dateStr(season: number, month: number, day: number): string {
    const yr = 2023 + season;
    return `${yr}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  // Generate transactions across 3 seasons
  for (let season = 1; season <= 3; season++) {
    // Spring training signings
    for (let i = 0; i < 2 + Math.floor(rand() * 3); i++) {
      const player = pick(PLAYER_NAMES);
      const team = pick(TEAM_NAMES);
      const salary = Math.round((1 + rand() * 18) * 1_000_000);
      const years = 1 + Math.floor(rand() * 5);
      transactions.push({
        id: nextId++,
        date: dateStr(season, 2, 10 + Math.floor(rand() * 18)),
        season,
        type: 'signing',
        description: `Signed ${player} to a ${years}-year, $${(salary * years / 1_000_000).toFixed(1)}M deal.`,
        playersInvolved: [player],
        teamsInvolved: [team],
        financialImpact: salary * years,
        significance: salary > 10_000_000 ? 'major' : salary > 3_000_000 ? 'minor' : 'routine',
      });
    }

    // Draft picks
    for (let i = 0; i < 3; i++) {
      const player = pick(PLAYER_NAMES);
      const team = pick(TEAM_NAMES);
      const round = i + 1;
      const pickNum = round * 10 + Math.floor(rand() * 20);
      const bonus = Math.round((0.5 + rand() * 5) * 1_000_000);
      transactions.push({
        id: nextId++,
        date: dateStr(season, 7, 11 + i),
        season,
        type: 'draft',
        description: `Selected ${player} with the ${pickNum}${pickNum === 1 ? 'st' : pickNum === 2 ? 'nd' : pickNum === 3 ? 'rd' : 'th'} overall pick (Round ${round}). Signing bonus: $${(bonus / 1_000_000).toFixed(1)}M.`,
        playersInvolved: [player],
        teamsInvolved: [team],
        financialImpact: bonus,
        significance: round === 1 ? 'major' : 'routine',
      });
    }

    // Mid-season trades (1-3 per season)
    const numTrades = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < numTrades; i++) {
      const [team1, team2] = pickTwo(TEAM_NAMES);
      const [p1, p2] = pickTwo(PLAYER_NAMES);
      const p3 = pick(PLAYER_NAMES);
      const isBig = rand() > 0.6;
      transactions.push({
        id: nextId++,
        date: dateStr(season, 7, 20 + Math.floor(rand() * 11)),
        season,
        type: 'trade',
        description: isBig
          ? `${team1} acquires ${p1} from ${team2} in exchange for ${p2} and ${p3}.`
          : `${team1} acquires ${p1} from ${team2} for ${p2}.`,
        playersInvolved: isBig ? [p1, p2, p3] : [p1, p2],
        teamsInvolved: [team1, team2],
        financialImpact: 0,
        significance: isBig ? 'major' : 'minor',
      });
    }

    // Options and recalls (roster shuffles)
    for (let i = 0; i < 3 + Math.floor(rand() * 4); i++) {
      const player = pick(PLAYER_NAMES);
      const team = pick(TEAM_NAMES);
      const isOption = rand() > 0.45;
      transactions.push({
        id: nextId++,
        date: dateStr(season, 4 + Math.floor(rand() * 5), 1 + Math.floor(rand() * 28)),
        season,
        type: isOption ? 'option' : 'recall',
        description: isOption
          ? `${team} optioned ${player} to Triple-A.`
          : `${team} recalled ${player} from Triple-A.`,
        playersInvolved: [player],
        teamsInvolved: [team],
        financialImpact: 0,
        significance: 'routine',
      });
    }

    // DFAs and releases
    for (let i = 0; i < 1 + Math.floor(rand() * 2); i++) {
      const player = pick(PLAYER_NAMES);
      const team = pick(TEAM_NAMES);
      const isDFA = rand() > 0.4;
      const remainingSalary = Math.round((0.5 + rand() * 4) * 1_000_000);
      transactions.push({
        id: nextId++,
        date: dateStr(season, 5 + Math.floor(rand() * 4), 1 + Math.floor(rand() * 28)),
        season,
        type: isDFA ? 'dfa' : 'release',
        description: isDFA
          ? `${team} designated ${player} for assignment.`
          : `${team} released ${player}. Remaining salary: $${(remainingSalary / 1_000_000).toFixed(1)}M.`,
        playersInvolved: [player],
        teamsInvolved: [team],
        financialImpact: isDFA ? 0 : -remainingSalary,
        significance: 'minor',
      });
    }

    // Waiver claims
    if (rand() > 0.4) {
      const player = pick(PLAYER_NAMES);
      const [team1, team2] = pickTwo(TEAM_NAMES);
      transactions.push({
        id: nextId++,
        date: dateStr(season, 8, 1 + Math.floor(rand() * 28)),
        season,
        type: 'waiver_claim',
        description: `${team1} claimed ${player} off waivers from ${team2}.`,
        playersInvolved: [player],
        teamsInvolved: [team1, team2],
        financialImpact: 0,
        significance: 'minor',
      });
    }

    // Extensions
    if (rand() > 0.5) {
      const player = pick(PLAYER_NAMES);
      const team = pick(TEAM_NAMES);
      const years = 3 + Math.floor(rand() * 7);
      const total = Math.round((20 + rand() * 250) * 1_000_000);
      transactions.push({
        id: nextId++,
        date: dateStr(season, 3, 1 + Math.floor(rand() * 28)),
        season,
        type: 'extension',
        description: `${player} signed a ${years}-year, $${(total / 1_000_000).toFixed(0)}M extension with ${team}.`,
        playersInvolved: [player],
        teamsInvolved: [team],
        financialImpact: total,
        significance: total > 100_000_000 ? 'major' : 'minor',
      });
    }

    // Retirements (season 2+)
    if (season >= 2 && rand() > 0.5) {
      const player = pick(PLAYER_NAMES);
      const team = pick(TEAM_NAMES);
      transactions.push({
        id: nextId++,
        date: dateStr(season, 11, 1 + Math.floor(rand() * 28)),
        season,
        type: 'retirement',
        description: `${player} announced his retirement after ${12 + Math.floor(rand() * 10)} seasons.`,
        playersInvolved: [player],
        teamsInvolved: [team],
        financialImpact: 0,
        significance: rand() > 0.5 ? 'major' : 'minor',
      });
    }
  }

  // Sort by date descending
  transactions.sort((a, b) => b.date.localeCompare(a.date));

  return transactions;
}

export function generateDemoTransactionLog(): TransactionLogData {
  const rand = seededRand(31337);
  const transactions = buildDemoTransactions(rand);

  // Build season summaries
  const seasonMap = new Map<number, { count: number; netSpend: number }>();
  for (const t of transactions) {
    const entry = seasonMap.get(t.season) ?? { count: 0, netSpend: 0 };
    entry.count++;
    entry.netSpend += t.financialImpact;
    seasonMap.set(t.season, entry);
  }

  const seasonSummary = [...seasonMap.entries()]
    .map(([season, data]) => ({ season, count: data.count, netSpend: data.netSpend }))
    .sort((a, b) => b.season - a.season);

  return {
    teamName: 'Brooklyn Bolts',
    transactions,
    seasonSummary,
  };
}
