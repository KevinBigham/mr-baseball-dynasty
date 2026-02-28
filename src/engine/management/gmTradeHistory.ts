/**
 * gmTradeHistory.ts – GM Trade History ledger engine
 *
 * Bloomberg-terminal-style historical trade tracking for GMs.
 * Grades every completed trade with initial and retrospective
 * evaluations, tracks traded assets with WAR accounting,
 * and produces cumulative GM trading performance metrics.
 * All demo data — no sim engine changes.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type TradeGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F';

export interface TradedAsset {
  name: string;
  type: 'player' | 'prospect' | 'pick' | 'cash';
  warAtTrade: number;     // WAR accumulated at time of trade
  currentWAR: number;     // WAR since the trade (or projected for picks)
  surplus: number;        // surplus value above replacement (positive = valuable)
}

export interface HistoricalTrade {
  id: string;
  date: string;           // e.g. "Jul 31, 2025"
  partner: string;        // team traded with
  sent: TradedAsset[];
  received: TradedAsset[];
  initialGrade: TradeGrade;
  currentGrade: TradeGrade;
  netValue: number;       // net surplus (positive = won trade)
  description: string;    // one-line trade summary
}

export interface GMTradeRecord {
  gmName: string;
  teamName: string;
  totalTrades: number;
  trades: HistoricalTrade[];
  avgGrade: number;           // numeric avg (A+=7, A=6, B+=5, B=4, C=3, D=2, F=1)
  bestTrade: string;          // description of best trade
  worstTrade: string;         // description of worst trade
  totalNetValue: number;      // cumulative net surplus across all trades
  winningTradePct: number;    // % of trades with positive netValue
  notes: string;
}

// ─── Display Map ────────────────────────────────────────────────────────────

export const GRADE_DISPLAY: Record<TradeGrade, { label: string; color: string }> = {
  'A+': { label: 'A+', color: '#22c55e' },
  'A':  { label: 'A',  color: '#22c55e' },
  'B+': { label: 'B+', color: '#4ade80' },
  'B':  { label: 'B',  color: '#f59e0b' },
  'C':  { label: 'C',  color: '#f97316' },
  'D':  { label: 'D',  color: '#ef4444' },
  'F':  { label: 'F',  color: '#dc2626' },
};

export function gradeColor(grade: TradeGrade): string {
  return GRADE_DISPLAY[grade].color;
}

// ─── Grade Helpers ──────────────────────────────────────────────────────────

const GRADE_TO_NUM: Record<TradeGrade, number> = {
  'A+': 7, 'A': 6, 'B+': 5, 'B': 4, 'C': 3, 'D': 2, 'F': 1,
};

const NUM_TO_GRADE: [number, TradeGrade][] = [
  [6.5, 'A+'], [5.5, 'A'], [4.5, 'B+'], [3.5, 'B'], [2.5, 'C'], [1.5, 'D'], [0, 'F'],
];

function numToLetterGrade(n: number): TradeGrade {
  for (const [threshold, grade] of NUM_TO_GRADE) {
    if (n >= threshold) return grade;
  }
  return 'F';
}

// ─── Summary ────────────────────────────────────────────────────────────────

export interface GMTradeHistorySummary {
  totalTrades: number;
  avgGrade: string;       // letter grade
  bestDeal: string;
  worstDeal: string;
  netValue: string;       // formatted net surplus
  winPct: string;         // formatted winning trade pct
}

export function getGMTradeHistorySummary(record: GMTradeRecord): GMTradeHistorySummary {
  const avgNum = record.trades.length > 0
    ? record.trades.reduce((s, t) => s + GRADE_TO_NUM[t.currentGrade], 0) / record.trades.length
    : 0;

  return {
    totalTrades: record.totalTrades,
    avgGrade: numToLetterGrade(avgNum),
    bestDeal: record.bestTrade,
    worstDeal: record.worstTrade,
    netValue: (record.totalNetValue >= 0 ? '+' : '') + record.totalNetValue.toFixed(1),
    winPct: record.winningTradePct.toFixed(1),
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoGMTradeHistory(): GMTradeRecord {
  const trades: HistoricalTrade[] = [
    // Trade 1 — Great prospect haul (won big)
    {
      id: 'gmt-1',
      date: 'Dec 8, 2023',
      partner: 'San Diego Padres',
      sent: [
        { name: 'Tommy Garcia',    type: 'player',   warAtTrade: 1.8, currentWAR: 0.6,  surplus: -2.4 },
      ],
      received: [
        { name: 'Dylan Park',      type: 'prospect', warAtTrade: 0.0, currentWAR: 4.2,  surplus: 12.8 },
        { name: 'Brett Miller',    type: 'prospect', warAtTrade: 0.0, currentWAR: 1.8,  surplus: 4.6 },
      ],
      initialGrade: 'B',
      currentGrade: 'A+',
      netValue: 14.8,
      description: 'Sold high on declining 1B Garcia for CF Park + RHP Miller. Park became 4-WAR centerfielder.',
    },
    // Trade 2 — Deadline rental (overpaid)
    {
      id: 'gmt-2',
      date: 'Jul 31, 2024',
      partner: 'Oakland Athletics',
      sent: [
        { name: 'Marcus Rivera',   type: 'prospect', warAtTrade: 0.0, currentWAR: 2.6,  surplus: 8.4 },
        { name: 'Jake Thompson',   type: 'prospect', warAtTrade: 0.0, currentWAR: 1.4,  surplus: 3.8 },
      ],
      received: [
        { name: 'Carlos Mendez',   type: 'player',   warAtTrade: 2.8, currentWAR: 1.2,  surplus: -1.6 },
      ],
      initialGrade: 'B+',
      currentGrade: 'C',
      netValue: -8.6,
      description: 'Rental LHP Mendez for playoff push. Dominant in October but prospects blossomed in Oakland.',
    },
    // Trade 3 — Disastrous overpay
    {
      id: 'gmt-3',
      date: 'Jan 15, 2024',
      partner: 'Colorado Rockies',
      sent: [
        { name: 'Mike Harrison',   type: 'prospect', warAtTrade: 0.0, currentWAR: 3.2,  surplus: 10.8 },
        { name: 'Steve Carter',    type: 'prospect', warAtTrade: 0.0, currentWAR: 1.6,  surplus: 4.2 },
      ],
      received: [
        { name: 'Alex Robinson',   type: 'player',   warAtTrade: 1.4, currentWAR: -0.4, surplus: -5.2 },
      ],
      initialGrade: 'C',
      currentGrade: 'F',
      netValue: -15.0,
      description: 'Disastrous. Robinson declined rapidly. Harrison became an All-Star in Colorado. Carter a top-30 prospect.',
    },
    // Trade 4 — Smart catcher acquisition
    {
      id: 'gmt-4',
      date: 'Aug 1, 2024',
      partner: 'Miami Marlins',
      sent: [
        { name: 'Kevin Nguyen',    type: 'prospect', warAtTrade: 0.0, currentWAR: 0.8,  surplus: 1.6 },
      ],
      received: [
        { name: 'Jason Wright',    type: 'player',   warAtTrade: 1.2, currentWAR: 2.4,  surplus: 6.8 },
      ],
      initialGrade: 'B+',
      currentGrade: 'A',
      netValue: 7.2,
      description: 'Acquired elite defensive catcher Wright for fringe arm Nguyen. Wright transformed the pitching staff.',
    },
    // Trade 5 — Salary dump win
    {
      id: 'gmt-5',
      date: 'Mar 22, 2024',
      partner: 'Toronto Blue Jays',
      sent: [
        { name: 'Brian Davis',     type: 'player',   warAtTrade: 0.8, currentWAR: -0.6, surplus: -4.8 },
      ],
      received: [
        { name: 'Lottery Ticket P', type: 'prospect', warAtTrade: 0.0, currentWAR: 0.4,  surplus: 1.2 },
        { name: '$8M Cash',        type: 'cash',     warAtTrade: 0.0, currentWAR: 0.0,  surplus: 3.2 },
      ],
      initialGrade: 'B',
      currentGrade: 'B+',
      netValue: 5.6,
      description: 'Shed bad DH contract ($14.5M) while getting a lottery ticket arm + cash. Davis continued to decline in Toronto.',
    },
    // Trade 6 — Mid-tier rebuild swap
    {
      id: 'gmt-6',
      date: 'Jul 28, 2025',
      partner: 'Atlanta Braves',
      sent: [
        { name: 'Ricky Vasquez',   type: 'player',   warAtTrade: 2.4, currentWAR: 1.8,  surplus: 0.6 },
      ],
      received: [
        { name: 'Luis Ortega',     type: 'prospect', warAtTrade: 0.0, currentWAR: 2.2,  surplus: 6.4 },
        { name: '$2M Cash',        type: 'cash',     warAtTrade: 0.0, currentWAR: 0.0,  surplus: 0.8 },
      ],
      initialGrade: 'C',
      currentGrade: 'B+',
      netValue: 4.2,
      description: 'Moved expiring RHP Vasquez for controllable 3B Ortega + cash. Ortega exceeded expectations with plus defense.',
    },
    // Trade 7 — Draft pick trade
    {
      id: 'gmt-7',
      date: 'Jul 30, 2025',
      partner: 'Minnesota Twins',
      sent: [
        { name: '2026 2nd Rd Pick', type: 'pick',    warAtTrade: 0.0, currentWAR: 0.0,  surplus: 2.0 },
        { name: 'Daniel Foster',    type: 'prospect', warAtTrade: 0.0, currentWAR: 0.2,  surplus: 0.6 },
      ],
      received: [
        { name: 'Ryan Kowalski',   type: 'player',   warAtTrade: 1.8, currentWAR: 2.0,  surplus: 3.4 },
      ],
      initialGrade: 'B+',
      currentGrade: 'A',
      netValue: 3.8,
      description: 'Acquired 2B Kowalski for a pick + low-ceiling prospect. Kowalski provided elite defense and clutch hitting.',
    },
    // Trade 8 — Three-way deal
    {
      id: 'gmt-8',
      date: 'Nov 12, 2025',
      partner: 'Chicago White Sox',
      sent: [
        { name: 'Pedro Santiago',  type: 'player',   warAtTrade: 1.2, currentWAR: 0.8,  surplus: -0.8 },
        { name: '2026 PTBNL',     type: 'prospect', warAtTrade: 0.0, currentWAR: 0.0,  surplus: 0.4 },
      ],
      received: [
        { name: 'Terrence Hill',   type: 'prospect', warAtTrade: 0.0, currentWAR: 1.4,  surplus: 4.2 },
        { name: 'Owen Bradley',    type: 'prospect', warAtTrade: 0.0, currentWAR: 0.6,  surplus: 1.8 },
      ],
      initialGrade: 'B',
      currentGrade: 'B+',
      netValue: 5.4,
      description: 'Flipped aging RP Santiago + PTBNL for two young arms. Hill projecting as future #3 starter.',
    },
  ];

  const wins = trades.filter(t => t.netValue > 0).length;
  const avgGradeNum = trades.reduce((s, t) => s + GRADE_TO_NUM[t.currentGrade], 0) / trades.length;

  const sortedByValue = [...trades].sort((a, b) => b.netValue - a.netValue);
  const best = sortedByValue[0];
  const worst = sortedByValue[sortedByValue.length - 1];

  return {
    gmName: 'Michael Torres',
    teamName: 'San Francisco Giants',
    totalTrades: trades.length,
    trades,
    avgGrade: +avgGradeNum.toFixed(2),
    bestTrade: `${best.description} (${best.currentGrade})`,
    worstTrade: `${worst.description} (${worst.currentGrade})`,
    totalNetValue: +trades.reduce((s, t) => s + t.netValue, 0).toFixed(1),
    winningTradePct: +((wins / trades.length) * 100).toFixed(1),
    notes: 'Torres has been aggressive at the deadline but his best work is in offseason rebuilds. The Colorado disaster was his biggest miss, but the SD and MIA deals show elite talent evaluation.',
  };
}
