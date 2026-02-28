// ── Team Power Ranking Engine ────────────────────────────────────
// Comprehensive multi-factor power ranking system

export interface RankingCategory {
  category: string;
  score: number;          // 0-100
  leagueRank: number;
  trend: 'up' | 'down' | 'steady';
  keyFactor: string;
}

export interface TeamRanking {
  rank: number;
  teamName: string;
  abbreviation: string;
  record: string;
  overallScore: number;   // 0-100
  categories: RankingCategory[];
  strengthOfScheduleRemaining: number;
  playoffProb: number;
  wsProb: number;
  tierLabel: string;       // "Elite", "Contender", "Fringe", "Rebuilding"
}

export interface PowerRankingData {
  asOfDate: string;
  userTeamRank: number;
  rankings: TeamRanking[];
}

export function getTierColor(tier: string): string {
  if (tier === 'Elite') return '#22c55e';
  if (tier === 'Contender') return '#3b82f6';
  if (tier === 'Fringe') return '#f59e0b';
  return '#ef4444';
}

export function generateDemoPowerRankings(): PowerRankingData {
  const teams: TeamRanking[] = [
    {
      rank: 1, teamName: 'Los Angeles Dodgers', abbreviation: 'LAD', record: '58-32', overallScore: 94,
      categories: [
        { category: 'Offense', score: 92, leagueRank: 2, trend: 'steady', keyFactor: 'Best OPS in NL' },
        { category: 'Starting Pitching', score: 95, leagueRank: 1, trend: 'up', keyFactor: 'Three Cy Young candidates' },
        { category: 'Bullpen', score: 88, leagueRank: 5, trend: 'steady', keyFactor: 'Deep pen; 2.85 ERA' },
        { category: 'Defense', score: 90, leagueRank: 3, trend: 'steady', keyFactor: '+35 DRS' },
        { category: 'Depth', score: 96, leagueRank: 1, trend: 'steady', keyFactor: 'Best 26-40 in MLB' },
      ],
      strengthOfScheduleRemaining: 0.510, playoffProb: 98.5, wsProb: 22.4, tierLabel: 'Elite',
    },
    {
      rank: 2, teamName: 'Atlanta Braves', abbreviation: 'ATL', record: '55-35', overallScore: 91,
      categories: [
        { category: 'Offense', score: 95, leagueRank: 1, trend: 'up', keyFactor: 'Most HR in MLB' },
        { category: 'Starting Pitching', score: 88, leagueRank: 4, trend: 'steady', keyFactor: 'Strong top 3' },
        { category: 'Bullpen', score: 82, leagueRank: 10, trend: 'down', keyFactor: 'Closer shaky recently' },
        { category: 'Defense', score: 85, leagueRank: 8, trend: 'steady', keyFactor: 'Average defense' },
        { category: 'Depth', score: 90, leagueRank: 3, trend: 'steady', keyFactor: 'Farm producing' },
      ],
      strengthOfScheduleRemaining: 0.495, playoffProb: 95.2, wsProb: 18.1, tierLabel: 'Elite',
    },
    {
      rank: 6, teamName: 'San Francisco Giants', abbreviation: 'SFG', record: '50-40', overallScore: 82,
      categories: [
        { category: 'Offense', score: 78, leagueRank: 10, trend: 'up', keyFactor: 'Improving with RISP' },
        { category: 'Starting Pitching', score: 88, leagueRank: 5, trend: 'up', keyFactor: 'Vega is elite; rotation deep' },
        { category: 'Bullpen', score: 84, leagueRank: 7, trend: 'steady', keyFactor: 'Doval dominant' },
        { category: 'Defense', score: 82, leagueRank: 9, trend: 'up', keyFactor: 'Santos elite behind plate' },
        { category: 'Depth', score: 75, leagueRank: 12, trend: 'steady', keyFactor: 'Thin at corner OF' },
      ],
      strengthOfScheduleRemaining: 0.505, playoffProb: 68.5, wsProb: 8.2, tierLabel: 'Contender',
    },
    {
      rank: 15, teamName: 'Chicago Cubs', abbreviation: 'CHC', record: '44-46', overallScore: 62,
      categories: [
        { category: 'Offense', score: 65, leagueRank: 18, trend: 'down', keyFactor: 'Cold since ASB' },
        { category: 'Starting Pitching', score: 68, leagueRank: 15, trend: 'steady', keyFactor: 'Inconsistent back end' },
        { category: 'Bullpen', score: 55, leagueRank: 22, trend: 'down', keyFactor: 'Blown saves costly' },
        { category: 'Defense', score: 60, leagueRank: 20, trend: 'steady', keyFactor: 'Below avg everywhere' },
        { category: 'Depth', score: 58, leagueRank: 19, trend: 'steady', keyFactor: 'Injuries exposed thin roster' },
      ],
      strengthOfScheduleRemaining: 0.488, playoffProb: 18.2, wsProb: 1.5, tierLabel: 'Fringe',
    },
    {
      rank: 28, teamName: 'Colorado Rockies', abbreviation: 'COL', record: '30-60', overallScore: 28,
      categories: [
        { category: 'Offense', score: 45, leagueRank: 28, trend: 'down', keyFactor: 'Road splits atrocious' },
        { category: 'Starting Pitching', score: 22, leagueRank: 30, trend: 'down', keyFactor: 'Worst ERA in NL' },
        { category: 'Bullpen', score: 30, leagueRank: 28, trend: 'steady', keyFactor: 'Overworked; high ERA' },
        { category: 'Defense', score: 35, leagueRank: 27, trend: 'down', keyFactor: 'Errors piling up' },
        { category: 'Depth', score: 20, leagueRank: 30, trend: 'steady', keyFactor: 'Minimal MLB-ready talent' },
      ],
      strengthOfScheduleRemaining: 0.520, playoffProb: 0.1, wsProb: 0.0, tierLabel: 'Rebuilding',
    },
  ];

  return { asOfDate: 'July 15', userTeamRank: 6, rankings: teams };
}
