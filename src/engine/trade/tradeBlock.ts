/**
 * Trade Block Manager
 *
 * Allows the GM to actively manage which players are on the trade block,
 * set asking prices, and track incoming interest from other teams.
 * Original baseball-specific system.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type AskingPrice = 'premium' | 'fair' | 'salary_dump' | 'best_offer';

export interface TradeBlockEntry {
  playerId: number;
  playerName: string;
  position: string;
  overall: number;
  age: number;
  salary: number;
  contractYears: number;
  askingPrice: AskingPrice;
  addedDay: number;
  interest: TradeInterest[];
  notes: string;
}

export interface TradeInterest {
  teamName: string;
  teamAbbr: string;
  offerType: 'prospects' | 'player' | 'picks' | 'package';
  quality: 'strong' | 'fair' | 'lowball';
  desc: string;
}

// ── Asking price config ─────────────────────────────────────────────────────

export const ASKING_PRICE_DISPLAY: Record<AskingPrice, { label: string; color: string; icon: string; desc: string }> = {
  premium:     { label: 'PREMIUM',     color: '#eab308', icon: '💎', desc: 'Top prospect package required' },
  fair:        { label: 'FAIR VALUE',  color: '#22c55e', icon: '⚖️', desc: 'Reasonable return expected' },
  salary_dump: { label: 'SALARY DUMP', color: '#ef4444', icon: '💸', desc: 'Taking salary off books, low return OK' },
  best_offer:  { label: 'BEST OFFER',  color: '#3b82f6', icon: '📞', desc: 'Open to whatever works' },
};

// ── Block management ────────────────────────────────────────────────────────

export function addToBlock(
  block: TradeBlockEntry[],
  player: { id: number; name: string; position: string; overall: number; age: number; salary: number; contractYears: number },
  askingPrice: AskingPrice,
  gameDay: number,
  notes: string = '',
): TradeBlockEntry[] {
  if (block.some(e => e.playerId === player.id)) return block;
  return [
    ...block,
    {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      overall: player.overall,
      age: player.age,
      salary: player.salary,
      contractYears: player.contractYears,
      askingPrice,
      addedDay: gameDay,
      interest: [],
      notes,
    },
  ];
}

export function removeFromBlock(block: TradeBlockEntry[], playerId: number): TradeBlockEntry[] {
  return block.filter(e => e.playerId !== playerId);
}

export function updateAskingPrice(block: TradeBlockEntry[], playerId: number, newPrice: AskingPrice): TradeBlockEntry[] {
  return block.map(e => e.playerId === playerId ? { ...e, askingPrice: newPrice } : e);
}

// ── Interest generation ─────────────────────────────────────────────────────

const TEAM_NAMES = [
  'Baltimore Colonials', 'Boston Lobsters', 'Tampa Bay Steamers', 'Cleveland Ironmen',
  'Detroit Gears', 'Kansas City Monarchs', 'Minnesota Wolves', 'Chicago Comets',
  'Houston Drillers', 'Los Angeles Seraphs', 'Oakland Rivets', 'Seattle Cascades',
];

export function generateInterest(entry: TradeBlockEntry): TradeInterest[] {
  // Higher OVR = more interest
  const interestCount = entry.overall >= 78 ? 3 :
    entry.overall >= 70 ? 2 :
    entry.overall >= 60 ? 1 : 0;

  if (interestCount === 0) return [];

  const shuffled = [...TEAM_NAMES].sort(() => Math.random() - 0.5);
  const types: TradeInterest['offerType'][] = ['prospects', 'player', 'picks', 'package'];
  const qualities: TradeInterest['quality'][] = ['strong', 'fair', 'lowball'];

  return shuffled.slice(0, interestCount).map((teamName) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const quality = entry.askingPrice === 'salary_dump' ? 'lowball' :
      qualities[Math.floor(Math.random() * qualities.length)];

    const descs: Record<string, string[]> = {
      prospects: ['Top-100 prospect + filler', 'Two mid-tier prospects', 'Lottery ticket prospect'],
      player:    ['Major league ready starter', 'Platoon bat + cash', 'Bullpen arm + utility infielder'],
      picks:     ['1st + 3rd round pick', '2nd round pick + PTBNL', 'Comp round pick'],
      package:   ['Prospect + pick package', 'Young starter + pick', 'Two MLB pieces + prospect'],
    };

    return {
      teamName,
      teamAbbr: teamName.split(' ').pop()?.toUpperCase().slice(0, 3) ?? 'UNK',
      offerType: type,
      quality,
      desc: descs[type][Math.floor(Math.random() * descs[type].length)],
    };
  });
}

// ── Summary ─────────────────────────────────────────────────────────────────

export function getBlockSummary(block: TradeBlockEntry[]) {
  return {
    total: block.length,
    withInterest: block.filter(e => e.interest.length > 0).length,
    totalInterest: block.reduce((s, e) => s + e.interest.length, 0),
    premium: block.filter(e => e.askingPrice === 'premium').length,
    salaryDumps: block.filter(e => e.askingPrice === 'salary_dump').length,
    totalSalary: block.reduce((s, e) => s + e.salary, 0),
  };
}
