// Dynasty Power Rankings — long-term franchise strength rankings
// Mr. Baseball Dynasty

export interface DynastyFactor {
  label: string;
  score: number; // 0-100
  rank: number;
  weight: number;
}

export interface DynastyTeam {
  teamId: number;
  teamName: string;
  abbr: string;
  overallRank: number;
  dynastyScore: number;
  tier: 'contender' | 'playoff' | 'bubble' | 'rebuilding' | 'tanking';
  factors: DynastyFactor[];
  projectedWins: number;
  windowOpen: boolean;
  windowYears: number;
  trend: 'ascending' | 'peak' | 'declining' | 'rebuilding';
  lastPlayoffs: number;
  titles: number;
}

export function generateDemoDynastyRankings(): DynastyTeam[] {
  const teams = [
    { name: 'New York Navigators', abbr: 'NYN', titles: 3 },
    { name: 'Los Angeles Stars', abbr: 'LAS', titles: 2 },
    { name: 'Chicago Windrunners', abbr: 'CHW', titles: 1 },
    { name: 'Houston Oilmen', abbr: 'HOU', titles: 2 },
    { name: 'Boston Harbormasters', abbr: 'BOS', titles: 4 },
    { name: 'Atlanta Firebirds', abbr: 'ATL', titles: 1 },
    { name: 'Tampa Bay Stingrays', abbr: 'TBR', titles: 0 },
    { name: 'Oakland Mountaineers', abbr: 'OAK', titles: 0 },
    { name: 'San Diego Surfers', abbr: 'SDS', titles: 0 },
    { name: 'Philadelphia Founders', abbr: 'PHF', titles: 1 },
  ];

  const factorDefs = [
    { label: 'Roster Talent', weight: 0.25 },
    { label: 'Farm System', weight: 0.20 },
    { label: 'Financial Flexibility', weight: 0.15 },
    { label: 'Coaching', weight: 0.10 },
    { label: 'Recent Performance', weight: 0.15 },
    { label: 'Market Size', weight: 0.05 },
    { label: 'Ownership Commitment', weight: 0.10 },
  ];

  const tiers: DynastyTeam['tier'][] = ['contender', 'contender', 'playoff', 'playoff', 'bubble', 'bubble', 'rebuilding', 'rebuilding', 'tanking', 'tanking'];
  const trends: DynastyTeam['trend'][] = ['peak', 'ascending', 'ascending', 'peak', 'declining', 'declining', 'rebuilding', 'rebuilding', 'ascending', 'declining'];

  return teams.map((t, i) => {
    const factors: DynastyFactor[] = factorDefs.map((fd, j) => ({
      label: fd.label,
      score: Math.max(10, 90 - i * 7 + Math.floor(Math.random() * 20)),
      rank: Math.min(10, i + 1 + Math.floor(Math.random() * 3) - 1),
      weight: fd.weight,
    }));

    const dynastyScore = Math.floor(factors.reduce((s, f) => s + f.score * f.weight, 0));

    return {
      teamId: 300 + i,
      teamName: t.name,
      abbr: t.abbr,
      overallRank: i + 1,
      dynastyScore,
      tier: tiers[i],
      factors,
      projectedWins: 95 - i * 5 + Math.floor(Math.random() * 10),
      windowOpen: i < 6,
      windowYears: i < 4 ? 3 + Math.floor(Math.random() * 4) : i < 6 ? 1 + Math.floor(Math.random() * 2) : 0,
      trend: trends[i],
      lastPlayoffs: i < 6 ? 2025 - Math.floor(Math.random() * 2) : 2020 - Math.floor(Math.random() * 5),
      titles: t.titles,
    };
  });
}
