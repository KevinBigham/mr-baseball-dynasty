/**
 * Franchise Records Board — all-time franchise records for key stat categories
 *
 * Each record tracks the top-5 holders, whether the holder is a current player,
 * and organises records across batting, pitching, team, and postseason categories.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type RecordCategory = 'batting' | 'pitching' | 'team' | 'postseason';

export interface RecordEntry {
  rank: number;
  playerName: string;
  value: number | string;
  season: number;
  current: boolean;          // true = currently on the roster
}

export interface FranchiseRecord {
  category: RecordCategory;
  statLabel: string;
  unit: string;
  entries: RecordEntry[];    // top-5 sorted
}

export interface FranchiseRecordBoard {
  teamName: string;
  records: FranchiseRecord[];
}

// ── Demo Data ──────────────────────────────────────────────────────────────

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

function makeTop5(
  names: string[],
  currentNames: string[],
  baseVal: number,
  step: number,
  isDecimal: boolean,
  seasonRange: [number, number],
): RecordEntry[] {
  const used = new Set<string>();
  const entries: RecordEntry[] = [];
  for (let r = 0; r < 5; r++) {
    let n = pick(names);
    while (used.has(n)) n = pick(names);
    used.add(n);
    const val = isDecimal
      ? +(baseVal - r * step + (Math.random() - 0.5) * step * 0.3).toFixed(3)
      : Math.round(baseVal - r * step + (Math.random() - 0.5) * step * 0.5);
    entries.push({
      rank: r + 1,
      playerName: n,
      value: val,
      season: seasonRange[0] + Math.floor(Math.random() * (seasonRange[1] - seasonRange[0])),
      current: currentNames.includes(n),
    });
  }
  return entries;
}

export function generateDemoFranchiseRecords(): FranchiseRecordBoard {
  const legends = [
    'Bobby Collins', 'Frank "The Tank" DeLuca', 'Earl Washington', 'Hank Yamamoto',
    'Willie Stargill', 'Sammy Vance', 'Pete Montoya', 'Luis Cordero',
    'Red Patterson', 'Charlie Oakes', 'Dizzy McGraw', 'Joe Blackstone',
    'Reggie Ashford', 'Tommy Malone', 'Big Jim Fowler', 'Dutch Kowalski',
  ];
  const active = [
    'Marcus Rivera', 'Jake Morrison', 'Carlos Delgado', 'Tyler Blackburn',
    'Sam Whitfield', 'Daisuke Ito', 'Ryan Chen',
  ];
  const all = [...legends, ...active];

  const records: FranchiseRecord[] = [
    // ── Batting ──
    { category: 'batting', statLabel: 'Home Runs (Season)', unit: 'HR',
      entries: makeTop5(all, active, 52, 5, false, [1965, 2026]) },
    { category: 'batting', statLabel: 'Batting Average (Season)', unit: 'AVG',
      entries: makeTop5(all, active, 0.365, 0.012, true, [1942, 2025]) },
    { category: 'batting', statLabel: 'RBI (Season)', unit: 'RBI',
      entries: makeTop5(all, active, 148, 8, false, [1958, 2025]) },
    { category: 'batting', statLabel: 'Hits (Season)', unit: 'H',
      entries: makeTop5(all, active, 225, 7, false, [1950, 2026]) },
    { category: 'batting', statLabel: 'OPS (Season)', unit: 'OPS',
      entries: makeTop5(all, active, 1.085, 0.035, true, [1970, 2026]) },
    { category: 'batting', statLabel: 'Stolen Bases (Season)', unit: 'SB',
      entries: makeTop5(all, active, 68, 8, false, [1975, 2025]) },
    { category: 'batting', statLabel: 'WAR (Season)', unit: 'WAR',
      entries: makeTop5(all, active, 10.5, 0.8, true, [1960, 2026]) },

    // ── Pitching ──
    { category: 'pitching', statLabel: 'ERA (Season, min 150 IP)', unit: 'ERA',
      entries: makeTop5(all, active, 1.82, 0.18, true, [1948, 2024]) },
    { category: 'pitching', statLabel: 'Strikeouts (Season)', unit: 'K',
      entries: makeTop5(all, active, 298, 14, false, [1966, 2026]) },
    { category: 'pitching', statLabel: 'Wins (Season)', unit: 'W',
      entries: makeTop5(all, active, 27, 2, false, [1945, 2020]) },
    { category: 'pitching', statLabel: 'Saves (Season)', unit: 'SV',
      entries: makeTop5(all, active, 52, 4, false, [1988, 2025]) },
    { category: 'pitching', statLabel: 'WHIP (Season)', unit: 'WHIP',
      entries: makeTop5(all, active, 0.88, 0.04, true, [1955, 2025]) },
    { category: 'pitching', statLabel: 'Innings Pitched (Season)', unit: 'IP',
      entries: makeTop5(all, active, 298, 12, false, [1942, 2005]) },

    // ── Team ──
    { category: 'team', statLabel: 'Team Wins (Season)', unit: 'W',
      entries: makeTop5(['2024 Squad', '2019 Squad', '1998 Squad', '1987 Squad', '2003 Squad', '1975 Squad', '2012 Squad'], [], 108, 3, false, [1975, 2024]) },
    { category: 'team', statLabel: 'Team Runs Scored (Season)', unit: 'R',
      entries: makeTop5(['2022 Squad', '2018 Squad', '1999 Squad', '2001 Squad', '1992 Squad', '2015 Squad'], [], 892, 22, false, [1992, 2024]) },
    { category: 'team', statLabel: 'Team ERA (Season)', unit: 'ERA',
      entries: makeTop5(['2023 Squad', '2014 Squad', '1997 Squad', '2005 Squad', '1988 Squad', '2019 Squad'], [], 2.95, 0.12, true, [1988, 2024]) },

    // ── Postseason ──
    { category: 'postseason', statLabel: 'Postseason HR (Career)', unit: 'HR',
      entries: makeTop5(all, active, 18, 3, false, [1970, 2025]) },
    { category: 'postseason', statLabel: 'Postseason AVG (min 50 PA)', unit: 'AVG',
      entries: makeTop5(all, active, 0.382, 0.018, true, [1968, 2025]) },
    { category: 'postseason', statLabel: 'Postseason Wins (Career)', unit: 'W',
      entries: makeTop5(all, active, 10, 2, false, [1958, 2024]) },
    { category: 'postseason', statLabel: 'Postseason Saves (Career)', unit: 'SV',
      entries: makeTop5(all, active, 12, 2, false, [1985, 2025]) },
    { category: 'postseason', statLabel: 'World Series MVP Awards', unit: 'MVP',
      entries: makeTop5(all, active, 2, 0.5, false, [1960, 2024]) },
  ];

  return {
    teamName: 'New York Titans',
    records,
  };
}
