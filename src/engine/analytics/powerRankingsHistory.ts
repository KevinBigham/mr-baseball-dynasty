/**
 * Power Rankings History — Mr. Baseball Dynasty
 *
 * Week-over-week rankings tracker:
 *   - Weekly rank + record + run differential + streak
 *   - High/low watermarks per team
 *   - Volatility scoring (how much a team bounces around)
 *   - Trend detection (rising, falling, stable)
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyRanking {
  week:    number;
  rank:    number;
  record:  string;
  runDiff: number;
  streak:  string;
}

export interface TeamRankHistory {
  id:            string;
  teamName:      string;
  abbr:          string;
  currentRank:   number;
  previousRank:  number;
  highestRank:   number;
  lowestRank:    number;
  weeklyHistory: WeeklyRanking[];
  avgRank:       number;
  volatility:    number;
  trend:         'rising' | 'falling' | 'stable';
  notes:         string;
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export function getRankingsHistorySummary(teams: TeamRankHistory[]): {
  totalTeams:    number;
  topTeam:       string;
  biggestRiser:  string;
  biggestFaller: string;
  mostVolatile:  string;
  mostStable:    string;
} {
  if (teams.length === 0) {
    return {
      totalTeams:    0,
      topTeam:       '—',
      biggestRiser:  '—',
      biggestFaller: '—',
      mostVolatile:  '—',
      mostStable:    '—',
    };
  }

  // Top team: currentRank === 1
  const topSorted = [...teams].sort((a, b) => a.currentRank - b.currentRank);
  const topTeam = topSorted[0]!.abbr;

  // Biggest riser: largest positive change (previousRank - currentRank)
  const riserSorted = [...teams].sort(
    (a, b) => (b.previousRank - b.currentRank) - (a.previousRank - a.currentRank),
  );
  const riser = riserSorted[0]!;
  const riserChange = riser.previousRank - riser.currentRank;
  const biggestRiser = `${riser.abbr} (+${riserChange})`;

  // Biggest faller: largest negative change
  const fallerSorted = [...teams].sort(
    (a, b) => (a.previousRank - a.currentRank) - (b.previousRank - b.currentRank),
  );
  const faller = fallerSorted[0]!;
  const fallerChange = faller.previousRank - faller.currentRank;
  const biggestFaller = `${faller.abbr} (${fallerChange})`;

  // Most volatile
  const volSorted = [...teams].sort((a, b) => b.volatility - a.volatility);
  const mostVolatile = volSorted[0]!.abbr;

  // Most stable
  const mostStable = volSorted[volSorted.length - 1]!.abbr;

  return {
    totalTeams: teams.length,
    topTeam,
    biggestRiser,
    biggestFaller,
    mostVolatile,
    mostStable,
  };
}

// ─── Demo Data ────────────────────────────────────────────────────────────────

function buildWeeklyHistory(
  ranks: number[],
  baseWins: number,
  baseLosses: number,
  baseRunDiff: number,
): WeeklyRanking[] {
  let wins = baseWins;
  let losses = baseLosses;
  let runDiff = baseRunDiff;
  let streakType: 'W' | 'L' = 'W';
  let streakCount = 1;

  return ranks.map((rank, i) => {
    const weekWins = Math.floor(Math.random() * 4) + 2; // 2-5 wins per week
    const weekLosses = 6 - weekWins; // ~6 games per week
    wins += weekWins;
    losses += weekLosses;
    runDiff += (weekWins - weekLosses) * 3;

    if (weekWins > weekLosses) {
      if (streakType === 'W') streakCount++;
      else { streakType = 'W'; streakCount = 1; }
    } else {
      if (streakType === 'L') streakCount++;
      else { streakType = 'L'; streakCount = 1; }
    }

    return {
      week: i + 1,
      rank,
      record: `${wins}-${losses}`,
      runDiff,
      streak: `${streakType}${streakCount}`,
    };
  });
}

function calcVolatility(ranks: number[]): number {
  if (ranks.length < 2) return 0;
  let totalChange = 0;
  for (let i = 1; i < ranks.length; i++) {
    totalChange += Math.abs(ranks[i]! - ranks[i - 1]!);
  }
  return Math.round((totalChange / (ranks.length - 1)) * 10) / 10;
}

function detectTrend(ranks: number[]): 'rising' | 'falling' | 'stable' {
  if (ranks.length < 4) return 'stable';
  const recent = ranks.slice(-4);
  const early = ranks.slice(0, 4);
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlyAvg = early.reduce((a, b) => a + b, 0) / early.length;
  const diff = earlyAvg - recentAvg; // positive = improving (lower rank number = better)
  if (diff > 1.5) return 'rising';
  if (diff < -1.5) return 'falling';
  return 'stable';
}

export function generateDemoPowerRankingsHistory(): TeamRankHistory[] {
  const teamData: Array<{
    id: string; name: string; abbr: string; ranks: number[];
    baseW: number; baseL: number; baseRD: number; notes: string;
  }> = [
    {
      id: 'prh-1', name: 'New York Yankees', abbr: 'NYY',
      ranks: [3, 2, 1, 1, 1, 2, 1, 1, 1, 1],
      baseW: 0, baseL: 0, baseRD: 0,
      notes: 'Dominant all season. Rotation anchored by two aces.',
    },
    {
      id: 'prh-2', name: 'Los Angeles Dodgers', abbr: 'LAD',
      ranks: [1, 1, 2, 2, 3, 1, 2, 2, 2, 2],
      baseW: 0, baseL: 0, baseRD: 0,
      notes: 'Consistent contender. Deep lineup and farm system.',
    },
    {
      id: 'prh-3', name: 'Houston Astros', abbr: 'HOU',
      ranks: [5, 4, 3, 3, 2, 3, 3, 3, 3, 3],
      baseW: 0, baseL: 0, baseRD: 0,
      notes: 'Steadily climbing. Young core maturing together.',
    },
    {
      id: 'prh-4', name: 'Atlanta Braves', abbr: 'ATL',
      ranks: [2, 3, 4, 5, 4, 4, 4, 5, 4, 4],
      baseW: 0, baseL: 0, baseRD: 0,
      notes: 'Slight regression from last year but still a threat.',
    },
    {
      id: 'prh-5', name: 'Baltimore Orioles', abbr: 'BAL',
      ranks: [8, 7, 6, 4, 5, 5, 5, 4, 5, 5],
      baseW: 0, baseL: 0, baseRD: 0,
      notes: 'Best farm system in baseball now producing at MLB level.',
    },
    {
      id: 'prh-6', name: 'Minnesota Twins', abbr: 'MIN',
      ranks: [4, 5, 5, 6, 6, 7, 8, 7, 6, 6],
      baseW: 0, baseL: 0, baseRD: 0,
      notes: 'Fading after strong start. Bullpen has been a problem.',
    },
    {
      id: 'prh-7', name: 'San Diego Padres', abbr: 'SD',
      ranks: [7, 8, 8, 7, 8, 6, 6, 6, 7, 7],
      baseW: 0, baseL: 0, baseRD: 0,
      notes: 'Inconsistent but talented. Payroll flexibility limited.',
    },
    {
      id: 'prh-8', name: 'Tampa Bay Rays', abbr: 'TB',
      ranks: [6, 6, 7, 8, 7, 8, 7, 8, 8, 8],
      baseW: 0, baseL: 0, baseRD: 0,
      notes: 'Rebuilding year. Trading veterans for prospects.',
    },
  ];

  return teamData.map(t => {
    const history = buildWeeklyHistory(t.ranks, t.baseW, t.baseL, t.baseRD);
    const currentRank = t.ranks[t.ranks.length - 1]!;
    const previousRank = t.ranks[t.ranks.length - 2]!;
    const highestRank = Math.min(...t.ranks);
    const lowestRank = Math.max(...t.ranks);
    const avgRank = Math.round(
      (t.ranks.reduce((a, b) => a + b, 0) / t.ranks.length) * 10,
    ) / 10;

    return {
      id: t.id,
      teamName: t.name,
      abbr: t.abbr,
      currentRank,
      previousRank,
      highestRank,
      lowestRank,
      weeklyHistory: history,
      avgRank,
      volatility: calcVolatility(t.ranks),
      trend: detectTrend(t.ranks),
      notes: t.notes,
    };
  });
}
