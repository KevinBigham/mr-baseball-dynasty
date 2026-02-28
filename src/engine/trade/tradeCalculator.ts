/**
 * Trade Value Calculator
 *
 * Evaluates trade fairness using a composite value model based on
 * player overall, age, contract, potential, and positional scarcity.
 * Provides trade balance analysis and surplus value calculations.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type TradeBalance = 'heavily_favor_you' | 'favor_you' | 'fair' | 'favor_them' | 'heavily_favor_them';

export const BALANCE_DISPLAY: Record<TradeBalance, { label: string; color: string; emoji: string }> = {
  heavily_favor_you:  { label: 'Heavily Favors You',  color: '#22c55e', emoji: '🎉' },
  favor_you:          { label: 'Favors You',          color: '#3b82f6', emoji: '👍' },
  fair:               { label: 'Fair Trade',          color: '#eab308', emoji: '🤝' },
  favor_them:         { label: 'Favors Them',         color: '#f97316', emoji: '⚠️' },
  heavily_favor_them: { label: 'Heavily Favors Them', color: '#ef4444', emoji: '🚫' },
};

export interface TradeAsset {
  id: number;
  name: string;
  pos: string;
  age: number;
  overall: number;
  potential: number;
  salary: number;         // M/yr
  yearsRemaining: number;
  tradeValue: number;     // composite value 0-100
  surplusValue: number;   // value over contract
  isProspect: boolean;
}

export interface TradePackage {
  sending: TradeAsset[];
  receiving: TradeAsset[];
  sendingValue: number;
  receivingValue: number;
  balance: TradeBalance;
  balanceDiff: number;
  analysis: string;
}

// ─── Logic ──────────────────────────────────────────────────────────────────

export function calcTradeValue(player: { overall: number; age: number; potential: number; salary: number; yearsRemaining: number; isProspect: boolean }): number {
  let value = 0;

  // Base value from overall (40% weight)
  value += (player.overall - 40) * 0.8;

  // Age curve (25% weight) — prime is 25-30
  const ageFactor = player.age <= 25 ? 15 : player.age <= 28 ? 12 : player.age <= 30 ? 8 : player.age <= 33 ? 4 : 0;
  value += ageFactor;

  // Potential (20% weight)
  if (player.isProspect) {
    value += (player.potential - 50) * 0.5;
  } else {
    value += (player.potential - player.overall) * 0.2;
  }

  // Contract value (15% weight) — cheap and long = good
  const contractValue = player.yearsRemaining * Math.max(0, 8 - player.salary);
  value += contractValue * 0.5;

  return Math.max(0, Math.round(value));
}

export function getTradeBalance(sendingValue: number, receivingValue: number): TradeBalance {
  const diff = receivingValue - sendingValue;
  const pct = sendingValue > 0 ? diff / sendingValue : 0;
  if (pct >= 0.25) return 'heavily_favor_you';
  if (pct >= 0.10) return 'favor_you';
  if (pct >= -0.10) return 'fair';
  if (pct >= -0.25) return 'favor_them';
  return 'heavily_favor_them';
}

export function analyzeTrade(sending: TradeAsset[], receiving: TradeAsset[]): TradePackage {
  const sendVal = sending.reduce((s, a) => s + a.tradeValue, 0);
  const recVal = receiving.reduce((s, a) => s + a.tradeValue, 0);
  const balance = getTradeBalance(sendVal, recVal);
  const diff = recVal - sendVal;

  let analysis = '';
  if (balance === 'fair') analysis = 'Both sides receive comparable value. A solid trade for both teams.';
  else if (balance === 'favor_you') analysis = `You\'re getting the better end by +${diff} value points.`;
  else if (balance === 'heavily_favor_you') analysis = `This is a steal — you\'re gaining +${diff} in value!`;
  else if (balance === 'favor_them') analysis = `They\'re getting slightly more value (${Math.abs(diff)} point gap).`;
  else analysis = `This heavily favors the other side (${Math.abs(diff)} point gap). Reconsider.`;

  return { sending, receiving, sendingValue: sendVal, receivingValue: recVal, balance, balanceDiff: diff, analysis };
}

// ─── Demo data ──────────────────────────────────────────────────────────────

function makeAsset(id: number, name: string, pos: string, age: number, overall: number, potential: number, salary: number, years: number, prospect: boolean): TradeAsset {
  const tradeValue = calcTradeValue({ overall, age, potential, salary, yearsRemaining: years, isProspect: prospect });
  const surplusValue = Math.round((tradeValue * 0.8 - salary * years * 2) * 10) / 10;
  return { id, name, pos, age, overall, potential, salary, yearsRemaining: years, tradeValue, surplusValue, isProspect: prospect };
}

export function generateDemoTrade(): TradePackage {
  const sending: TradeAsset[] = [
    makeAsset(1, 'Chris Sale', 'SP', 35, 82, 82, 18, 1, false),
    makeAsset(2, 'Walker Jenkins', 'CF', 20, 58, 86, 0.72, 6, true),
  ];

  const receiving: TradeAsset[] = [
    makeAsset(3, 'Bobby Witt Jr.', 'SS', 24, 86, 90, 4.2, 5, false),
  ];

  return analyzeTrade(sending, receiving);
}

export function generateDemoAssets(): { yourPlayers: TradeAsset[]; theirPlayers: TradeAsset[] } {
  return {
    yourPlayers: [
      makeAsset(10, 'Marcus Webb', 'SP', 26, 78, 84, 2.5, 4, false),
      makeAsset(11, 'Tyler Ohtani', 'DH', 28, 82, 82, 15, 3, false),
      makeAsset(12, 'Chase Burns', 'SP', 22, 64, 82, 0.72, 6, true),
      makeAsset(13, 'Jackson Merrill', 'CF', 21, 68, 85, 0.72, 6, true),
      makeAsset(14, 'Kyle Washington', 'RF', 30, 75, 75, 8, 2, false),
    ],
    theirPlayers: [
      makeAsset(20, 'Gunnar Henderson', 'SS', 23, 84, 90, 0.72, 6, false),
      makeAsset(21, 'Adley Rutschman', 'C', 26, 79, 82, 1.8, 4, false),
      makeAsset(22, 'Grayson Rodriguez', 'SP', 24, 76, 85, 0.72, 5, false),
      makeAsset(23, 'Coby Mayo', '3B', 22, 67, 80, 0.72, 6, true),
      makeAsset(24, 'Heston Kjerstad', 'RF', 25, 70, 78, 0.72, 5, false),
    ],
  };
}
