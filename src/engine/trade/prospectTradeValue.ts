// Prospect Trade Value — calculates trade value for prospects based on tools, ETA, and risk
// Mr. Baseball Dynasty

export type ValueTier = 'franchise' | 'premium' | 'solid' | 'role' | 'lottery' | 'marginal';

export interface TradeValueFactors {
  toolScore: number;     // 0-100
  etaScore: number;      // 0-100 (closer = better)
  riskDiscount: number;  // 0-30 (subtracted)
  positionValue: number; // 0-20 (premium positions score higher)
  ageBonus: number;      // 0-15
}

export interface ProspectTradeValueProfile {
  prospectId: number;
  name: string;
  age: number;
  position: string;
  currentLevel: string;
  overallRank: number;
  tradeValue: number; // 0-100
  tier: ValueTier;
  factors: TradeValueFactors;
  comparableTradeReturn: string;
  surplus: number; // years of team control remaining value
  untouchable: boolean;
}

export function generateDemoProspectTradeValue(): ProspectTradeValueProfile[] {
  const prospects = [
    { name: 'Jaylen Torres', pos: 'SS', level: 'AA', age: 21, rank: 3 },
    { name: 'Kenji Watanabe', pos: 'RHP', level: 'AAA', age: 23, rank: 8 },
    { name: 'Diego Ramirez', pos: 'CF', level: 'A+', age: 20, rank: 12 },
    { name: 'Caleb Thompson', pos: 'LHP', level: 'AA', age: 22, rank: 18 },
    { name: 'Elias Moreno', pos: '3B', level: 'A', age: 19, rank: 25 },
    { name: 'Ryu Nakamura', pos: 'C', level: 'AAA', age: 24, rank: 35 },
    { name: 'Andre Williams', pos: 'OF', level: 'A+', age: 20, rank: 42 },
    { name: 'Mason Clark', pos: 'RHP', level: 'AA', age: 21, rank: 55 },
    { name: 'Tyler Franklin', pos: '2B', level: 'AAA', age: 25, rank: 68 },
    { name: 'Omar Santos', pos: 'OF', level: 'A', age: 19, rank: 85 },
  ];

  const compReturns = [
    'Ace-caliber SP', '3-WAR starter + prospect', 'Quality SP rental',
    'Established reliever', 'Veteran bat + depth arm', 'Platoon outfielder',
    'League-avg starter', 'Backend SP + utility', 'Cash considerations',
    'PTBNL package',
  ];

  return prospects.map((p, i) => {
    const toolScore = 85 - i * 6 + Math.floor(Math.random() * 10);
    const etaScore = p.level === 'AAA' ? 80 + Math.floor(Math.random() * 15) :
      p.level === 'AA' ? 55 + Math.floor(Math.random() * 20) :
      p.level === 'A+' ? 35 + Math.floor(Math.random() * 20) :
      15 + Math.floor(Math.random() * 25);
    const riskDiscount = Math.floor(Math.random() * 25);
    const posValue = ['SS', 'C', 'CF'].includes(p.pos) ? 15 + Math.floor(Math.random() * 5) :
      ['LHP', 'RHP'].includes(p.pos) ? 10 + Math.floor(Math.random() * 8) :
      5 + Math.floor(Math.random() * 8);
    const ageBonus = Math.max(0, 25 - p.age) + Math.floor(Math.random() * 5);

    const tradeValue = Math.min(100, Math.max(5, Math.floor(
      (toolScore * 0.35 + etaScore * 0.25 + posValue * 1.0 + ageBonus * 0.8 - riskDiscount * 0.6)
    )));

    const tier: ValueTier = tradeValue > 85 ? 'franchise' : tradeValue > 70 ? 'premium' :
      tradeValue > 55 ? 'solid' : tradeValue > 40 ? 'role' : tradeValue > 25 ? 'lottery' : 'marginal';

    return {
      prospectId: 11000 + i,
      name: p.name,
      age: p.age,
      position: p.pos,
      currentLevel: p.level,
      overallRank: p.rank,
      tradeValue,
      tier,
      factors: {
        toolScore: Math.min(100, toolScore),
        etaScore,
        riskDiscount,
        positionValue: posValue,
        ageBonus,
      },
      comparableTradeReturn: compReturns[i],
      surplus: Math.max(1, 6 - Math.floor((p.age - 18) / 2)),
      untouchable: tradeValue > 80,
    };
  });
}
