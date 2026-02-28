/**
 * GM Trade History – historical trade log engine
 *
 * Tracks every completed trade with grades, prospect returns,
 * trade tree analysis, and cumulative GM trading performance.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type TradeGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export interface TradedAsset {
  playerName: string;
  position: string;
  warAtTrade: number;
  warSinceTrade: number;
  contractYears: number;
  salary: number;       // $M annual
}

export interface CompletedTrade {
  id: string;
  date: string;
  season: number;
  partnerTeam: string;
  partnerAbbr: string;
  sent: TradedAsset[];
  received: TradedAsset[];
  immediateGrade: TradeGrade;
  currentGrade: TradeGrade;
  surplusValue: number;     // net surplus from your side (positive = won trade)
  tradeType: string;        // "Deadline Acquisition" | "Rebuild Move" | "Salary Dump" | etc.
  notes: string;
}

export interface GMTradeHistoryData {
  teamName: string;
  gmName: string;
  totalTrades: number;
  trades: CompletedTrade[];
  winPct: number;            // % of trades "won"
  avgGrade: string;          // average grade letter
  totalSurplus: number;      // cumulative net surplus
  bestTrade: string;         // description
  worstTrade: string;        // description
}

export interface GMTradeHistorySummary {
  totalTrades: number;
  winPct: string;
  avgSurplus: string;
  bestGrade: string;
  deadlineDeals: number;
  rebuildMoves: number;
}

// ── Grade display ──────────────────────────────────────────────────────────

export const TRADE_GRADE_DISPLAY: Record<TradeGrade, { color: string; label: string }> = {
  'A+': { color: '#22c55e', label: 'A+' },
  'A':  { color: '#22c55e', label: 'A' },
  'B+': { color: '#86efac', label: 'B+' },
  'B':  { color: '#facc15', label: 'B' },
  'C+': { color: '#f59e0b', label: 'C+' },
  'C':  { color: '#f97316', label: 'C' },
  'D':  { color: '#ef4444', label: 'D' },
  'F':  { color: '#dc2626', label: 'F' },
};

export function tradeGradeColor(grade: TradeGrade): string {
  return TRADE_GRADE_DISPLAY[grade].color;
}

// ── Summary ────────────────────────────────────────────────────────────────

export function getGMTradeHistorySummary(data: GMTradeHistoryData): GMTradeHistorySummary {
  const deadline = data.trades.filter(t => t.tradeType === 'Deadline Acquisition').length;
  const rebuild = data.trades.filter(t => t.tradeType === 'Rebuild Move').length;
  const avgSurp = data.trades.length > 0
    ? (data.trades.reduce((s, t) => s + t.surplusValue, 0) / data.trades.length)
    : 0;
  const grades = data.trades.map(t => t.currentGrade);
  const gradeOrder: TradeGrade[] = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
  const best = grades.length > 0
    ? gradeOrder.find(g => grades.includes(g)) ?? 'C'
    : 'C';
  return {
    totalTrades: data.totalTrades,
    winPct: data.winPct.toFixed(0),
    avgSurplus: avgSurp.toFixed(1),
    bestGrade: best,
    deadlineDeals: deadline,
    rebuildMoves: rebuild,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoGMTradeHistory(): GMTradeHistoryData {
  const trades: CompletedTrade[] = [
    {
      id: 'tr1', date: 'Jul 31, 2025', season: 2025, partnerTeam: 'Oakland Athletics', partnerAbbr: 'OAK',
      sent: [
        { playerName: 'Marcus Rivera', position: 'SS', warAtTrade: 0.8, warSinceTrade: 2.4, contractYears: 5, salary: 0.7 },
        { playerName: 'Jake Thompson', position: 'RHP', warAtTrade: 0.2, warSinceTrade: 1.1, contractYears: 6, salary: 0.6 },
      ],
      received: [
        { playerName: 'Carlos Mendez', position: 'LHP', warAtTrade: 2.8, warSinceTrade: 1.2, contractYears: 1, salary: 12.5 },
      ],
      immediateGrade: 'B+', currentGrade: 'C',
      surplusValue: -4.2, tradeType: 'Deadline Acquisition',
      notes: 'Rental acquisition for playoff push. Mendez was dominant down the stretch but prospects blossomed in Oakland.',
    },
    {
      id: 'tr2', date: 'Dec 8, 2024', season: 2024, partnerTeam: 'San Diego Padres', partnerAbbr: 'SD',
      sent: [
        { playerName: 'Tommy Garcia', position: '1B', warAtTrade: 1.8, warSinceTrade: 0.6, contractYears: 3, salary: 8.2 },
      ],
      received: [
        { playerName: 'Dylan Park', position: 'CF', warAtTrade: 0.4, warSinceTrade: 3.8, contractYears: 5, salary: 0.8 },
        { playerName: 'Brett Miller', position: 'RHP', warAtTrade: 0.1, warSinceTrade: 1.6, contractYears: 6, salary: 0.6 },
      ],
      immediateGrade: 'B', currentGrade: 'A+',
      surplusValue: 12.8, tradeType: 'Rebuild Move',
      notes: 'Sold high on declining Garcia. Park became a 4-WAR centerfielder. Miller developed into solid mid-rotation arm.',
    },
    {
      id: 'tr3', date: 'Jul 28, 2024', season: 2024, partnerTeam: 'Atlanta Braves', partnerAbbr: 'ATL',
      sent: [
        { playerName: 'Ricky Vasquez', position: 'RHP', warAtTrade: 2.4, warSinceTrade: 1.8, contractYears: 2, salary: 6.4 },
      ],
      received: [
        { playerName: 'Luis Ortega', position: '3B', warAtTrade: 0.6, warSinceTrade: 2.2, contractYears: 5, salary: 0.7 },
        { playerName: 'Cash ($2M)', position: '-', warAtTrade: 0, warSinceTrade: 0, contractYears: 0, salary: 0 },
      ],
      immediateGrade: 'C+', currentGrade: 'B+',
      surplusValue: 3.4, tradeType: 'Rebuild Move',
      notes: 'Moved expiring Vasquez for controllable 3B. Ortega has exceeded expectations with plus defense.',
    },
    {
      id: 'tr4', date: 'Aug 1, 2025', season: 2025, partnerTeam: 'Miami Marlins', partnerAbbr: 'MIA',
      sent: [
        { playerName: 'Kevin Nguyen', position: 'LHP', warAtTrade: 0.5, warSinceTrade: 0.8, contractYears: 4, salary: 0.7 },
      ],
      received: [
        { playerName: 'Jason Wright', position: 'C', warAtTrade: 1.2, warSinceTrade: 1.8, contractYears: 2, salary: 4.2 },
      ],
      immediateGrade: 'B+', currentGrade: 'A',
      surplusValue: 6.2, tradeType: 'Deadline Acquisition',
      notes: 'Acquired elite defensive catcher for a fringe pitching prospect. Wright transformed the pitching staff.',
    },
    {
      id: 'tr5', date: 'Jan 15, 2025', season: 2025, partnerTeam: 'Colorado Rockies', partnerAbbr: 'COL',
      sent: [
        { playerName: 'Mike Harrison', position: 'RF', warAtTrade: 0.2, warSinceTrade: 2.8, contractYears: 4, salary: 0.7 },
        { playerName: 'Steve Carter', position: 'LHP', warAtTrade: 0.1, warSinceTrade: 1.4, contractYears: 5, salary: 0.6 },
      ],
      received: [
        { playerName: 'Alex Robinson', position: '2B', warAtTrade: 1.4, warSinceTrade: -0.2, contractYears: 1, salary: 9.8 },
      ],
      immediateGrade: 'C', currentGrade: 'F',
      surplusValue: -14.6, tradeType: 'Win-Now Push',
      notes: 'Disastrous trade. Robinson declined rapidly. Harrison became an All-Star in Colorado. Carter emerged as top-30 prospect.',
    },
    {
      id: 'tr6', date: 'Mar 22, 2024', season: 2024, partnerTeam: 'Toronto Blue Jays', partnerAbbr: 'TOR',
      sent: [
        { playerName: 'Brian Davis', position: 'DH', warAtTrade: 0.8, warSinceTrade: -0.4, contractYears: 2, salary: 14.5 },
      ],
      received: [
        { playerName: 'Prospect Lottery Ticket', position: 'RHP', warAtTrade: 0, warSinceTrade: 0.2, contractYears: 6, salary: 0.6 },
        { playerName: 'Cash ($8M)', position: '-', warAtTrade: 0, warSinceTrade: 0, contractYears: 0, salary: 0 },
      ],
      immediateGrade: 'B', currentGrade: 'B+',
      surplusValue: 5.8, tradeType: 'Salary Dump',
      notes: 'Shed bad contract while getting a lottery ticket prospect. Davis continued to decline. Clean cap space move.',
    },
  ];

  return {
    teamName: 'San Francisco Giants',
    gmName: 'Michael Torres',
    totalTrades: trades.length,
    trades,
    winPct: 66.7,
    avgGrade: 'B',
    totalSurplus: trades.reduce((s, t) => s + t.surplusValue, 0),
    bestTrade: 'Dylan Park acquisition from SD (A+)',
    worstTrade: 'Alex Robinson trade with COL (F)',
  };
}
