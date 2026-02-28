// ── Trade Value Calculator ───────────────────────────────────────
// Calculates comprehensive trade value for each player on the roster

export interface TradeValueComponent {
  component: string;
  value: number;
  description: string;
}

export interface TradeValuePlayer {
  playerName: string;
  position: string;
  age: number;
  contractYearsLeft: number;
  currentSalary: number;        // millions
  totalTradeValue: number;      // 0-100 composite
  surplusValue: number;         // WAR above cost in $M
  components: TradeValueComponent[];
  tradeability: 'untouchable' | 'available at right price' | 'actively shopping' | 'not tradeable';
  bestReturn: string;
  worstCase: string;
}

export interface TradeValueData {
  teamName: string;
  players: TradeValuePlayer[];
  totalRosterValue: number;
  mostValuable: string;
  bestSurplus: string;
}

export function getTradeabilityColor(t: string): string {
  if (t === 'untouchable') return '#22c55e';
  if (t === 'available at right price') return '#3b82f6';
  if (t === 'actively shopping') return '#ef4444';
  return '#6b7280';
}

export function generateDemoTradeValue(): TradeValueData {
  const players: TradeValuePlayer[] = [
    {
      playerName: 'Marcus Webb',
      position: 'CF',
      age: 27,
      contractYearsLeft: 2,
      currentSalary: 15.0,
      totalTradeValue: 92,
      surplusValue: 22.5,
      components: [
        { component: 'On-field WAR', value: 35, description: '5.5 WAR — elite production' },
        { component: 'Contract value', value: 25, description: '2 years at $15M/yr — massive surplus' },
        { component: 'Age/projection', value: 20, description: 'Peak years; 3+ WAR through age-31' },
        { component: 'Positional value', value: 12, description: 'CF premium — rare combo of tools' },
      ],
      tradeability: 'untouchable',
      bestReturn: '2 top-100 prospects + 1 MLB-ready arm',
      worstCase: 'N/A — do not trade',
    },
    {
      playerName: 'Alejandro Vega',
      position: 'SP',
      age: 26,
      contractYearsLeft: 3,
      currentSalary: 8.5,
      totalTradeValue: 95,
      surplusValue: 30.0,
      components: [
        { component: 'On-field WAR', value: 38, description: '5.8 WAR — ace caliber' },
        { component: 'Contract value', value: 30, description: '3 years team control at $8.5M — absurd surplus' },
        { component: 'Age/projection', value: 18, description: 'Still improving; durable arm' },
        { component: 'Positional value', value: 9, description: 'Ace SP — most valued position in trade market' },
      ],
      tradeability: 'untouchable',
      bestReturn: '3 top-100 prospects',
      worstCase: 'N/A — cornerstone of franchise',
    },
    {
      playerName: 'Tony Reyes',
      position: 'RF',
      age: 30,
      contractYearsLeft: 1,
      currentSalary: 11.0,
      totalTradeValue: 48,
      surplusValue: 5.0,
      components: [
        { component: 'On-field WAR', value: 18, description: '2.5 WAR — solid contributor' },
        { component: 'Contract value', value: 12, description: '1 year at $11M — fair value' },
        { component: 'Age/projection', value: 8, description: 'Aging; some decline risk' },
        { component: 'Positional value', value: 10, description: 'Corner OF with power arm' },
      ],
      tradeability: 'available at right price',
      bestReturn: 'A-ball top-10 org prospect',
      worstCase: 'PTBNL or low-level lottery ticket',
    },
    {
      playerName: 'Derek Palmer',
      position: 'LF',
      age: 32,
      contractYearsLeft: 1,
      currentSalary: 10.0,
      totalTradeValue: 35,
      surplusValue: 2.0,
      components: [
        { component: 'On-field WAR', value: 14, description: '2.0 WAR — average starter' },
        { component: 'Contract value', value: 8, description: '1 year at $10M — slight overpay' },
        { component: 'Age/projection', value: 5, description: 'Declining phase; 1-2 years left' },
        { component: 'Positional value', value: 8, description: 'LF — least valuable OF spot' },
      ],
      tradeability: 'actively shopping',
      bestReturn: 'AA prospect or salary relief',
      worstCase: 'No market; keep for depth',
    },
    {
      playerName: 'Brandon Crawford',
      position: 'SS',
      age: 36,
      contractYearsLeft: 1,
      currentSalary: 16.0,
      totalTradeValue: 15,
      surplusValue: -5.0,
      components: [
        { component: 'On-field WAR', value: 8, description: '1.2 WAR — below average' },
        { component: 'Contract value', value: 2, description: '1 year at $16M — overpaid' },
        { component: 'Age/projection', value: 2, description: 'Final season; sharp decline' },
        { component: 'Positional value', value: 3, description: 'Defensive rep still has value' },
      ],
      tradeability: 'not tradeable',
      bestReturn: 'May need to eat salary to move',
      worstCase: 'DFA if prospect ready',
    },
  ];

  return {
    teamName: 'San Francisco Giants',
    players,
    totalRosterValue: players.reduce((s, p) => s + p.totalTradeValue, 0),
    mostValuable: 'Alejandro Vega',
    bestSurplus: 'Alejandro Vega ($30M surplus)',
  };
}
