// Player Comparison Matrix — side-by-side multi-stat player comparison
// Mr. Baseball Dynasty

export interface CompStat {
  label: string;
  category: 'hitting' | 'pitching' | 'fielding' | 'baserunning' | 'value';
  value: number;
  leagueAvg: number;
  percentile: number; // 0-100
}

export interface CompPlayer {
  playerId: number;
  name: string;
  position: string;
  age: number;
  team: string;
  stats: CompStat[];
  overallWAR: number;
  contractAAV: number;
  valueRating: number; // 0-100
}

export interface ComparisonResult {
  players: CompPlayer[];
  advantages: { playerId: number; statLabel: string }[];
  overallWinner: number;
}

export function generateDemoPlayerComp(): ComparisonResult {
  const playerDefs = [
    { name: 'Marcus Rivera', pos: 'SS', age: 27, team: 'NYN', war: 5.8 },
    { name: 'Tyler Brooks', pos: 'SS', age: 25, team: 'LAA', war: 4.2 },
    { name: 'Kenji Sato', pos: 'SS', age: 29, team: 'CHW', war: 3.9 },
  ];

  const statDefs: { label: string; category: CompStat['category']; avg: number }[] = [
    { label: 'AVG', category: 'hitting', avg: 0.260 },
    { label: 'OBP', category: 'hitting', avg: 0.330 },
    { label: 'SLG', category: 'hitting', avg: 0.420 },
    { label: 'wRC+', category: 'hitting', avg: 100 },
    { label: 'HR', category: 'hitting', avg: 22 },
    { label: 'SB', category: 'baserunning', avg: 12 },
    { label: 'BsR', category: 'baserunning', avg: 0 },
    { label: 'DRS', category: 'fielding', avg: 0 },
    { label: 'UZR', category: 'fielding', avg: 0 },
    { label: 'fWAR', category: 'value', avg: 2.5 },
  ];

  const players: CompPlayer[] = playerDefs.map((pd, i) => {
    const stats: CompStat[] = statDefs.map(sd => {
      const variance = sd.avg * 0.3;
      const value = +(sd.avg + (Math.random() - 0.4) * variance).toFixed(3);
      return {
        label: sd.label,
        category: sd.category,
        value: sd.label === 'HR' || sd.label === 'SB' ? Math.round(value) : value,
        leagueAvg: sd.avg,
        percentile: Math.floor(30 + Math.random() * 60),
      };
    });

    return {
      playerId: 9000 + i,
      name: pd.name,
      position: pd.pos,
      age: pd.age,
      team: pd.team,
      stats,
      overallWAR: pd.war,
      contractAAV: Math.floor(8000000 + Math.random() * 25000000),
      valueRating: Math.floor(50 + Math.random() * 45),
    };
  });

  const advantages: { playerId: number; statLabel: string }[] = [];
  for (const sd of statDefs) {
    let best = players[0];
    for (const p of players) {
      const pStat = p.stats.find(s => s.label === sd.label)!;
      const bStat = best.stats.find(s => s.label === sd.label)!;
      if (pStat.value > bStat.value) best = p;
    }
    advantages.push({ playerId: best.playerId, statLabel: sd.label });
  }

  const overallWinner = players.reduce((a, b) => a.overallWAR > b.overallWAR ? a : b).playerId;

  return { players, advantages, overallWinner };
}
