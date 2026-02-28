/**
 * minorLeagueStandings.ts – Minor League Standings
 *
 * Standings for all minor league affiliates across AAA, AA, A+, and A levels.
 * Tracks W-L records, winning percentage, games back, streaks, and
 * top prospects at each level.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type MinorLeagueLevel = 'AAA' | 'AA' | 'A+' | 'A';

export interface MiLBTeamRecord {
  id: string;
  teamName: string;
  level: MinorLeagueLevel;
  parentClub: string;
  wins: number;
  losses: number;
  pct: number;
  gb: number;          // games back
  streak: string;      // e.g. "W5", "L2"
  lastTen: string;     // e.g. "7-3"
  topProspect: string;
  notes: string;
}

export interface MiLBStandingsData {
  level: MinorLeagueLevel;
  teams: MiLBTeamRecord[];
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface MiLBStandingsSummary {
  totalTeams: number;
  bestRecord: { name: string; pct: number };
  worstRecord: { name: string; pct: number };
  longestStreak: { name: string; streak: string };
}

export function getMiLBStandingsSummary(levels: MiLBStandingsData[]): MiLBStandingsSummary {
  const allTeams = levels.flatMap(l => l.teams);
  const n = allTeams.length;

  const sorted = [...allTeams].sort((a, b) => b.pct - a.pct);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // Longest streak: parse "W5", "L3" etc. to find longest
  let longestLen = 0;
  let longestTeam = '';
  let longestStr = '';
  allTeams.forEach(t => {
    const len = parseInt(t.streak.slice(1), 10);
    if (len > longestLen) {
      longestLen = len;
      longestTeam = t.teamName;
      longestStr = t.streak;
    }
  });

  return {
    totalTeams: n,
    bestRecord: { name: best.teamName, pct: best.pct },
    worstRecord: { name: worst.teamName, pct: worst.pct },
    longestStreak: { name: longestTeam, streak: longestStr },
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

interface TeamSeed {
  name: string;
  parent: string;
  wins: number;
  losses: number;
  streak: string;
  lastTen: string;
  prospect: string;
  note: string;
}

const AAA_TEAMS: TeamSeed[] = [
  { name: 'Syracuse Mets', parent: 'NYM', wins: 74, losses: 56, streak: 'W4', lastTen: '7-3', prospect: 'Brett Baty', note: 'Dominant first half, strong pitching depth.' },
  { name: 'Durham Bulls', parent: 'TB', wins: 72, losses: 58, streak: 'W2', lastTen: '6-4', prospect: 'Curtis Mead', note: 'Consistent contender with deep lineup.' },
  { name: 'Scranton/WB RailRiders', parent: 'NYY', wins: 68, losses: 62, streak: 'L1', lastTen: '5-5', prospect: 'Jasson Dominguez', note: 'Dominguez tearing up the level, call-up imminent.' },
  { name: 'Sugar Land Space Cowboys', parent: 'HOU', wins: 66, losses: 64, streak: 'W3', lastTen: '6-4', prospect: 'Drew Gilbert', note: 'Pitching factory keeps producing arms.' },
  { name: 'Sacramento River Cats', parent: 'SF', wins: 60, losses: 70, streak: 'L3', lastTen: '3-7', prospect: 'Marco Luciano', note: 'Luciano needs consistent ABs to break through.' },
  { name: 'Las Vegas Aviators', parent: 'OAK', wins: 52, losses: 78, streak: 'L5', lastTen: '2-8', prospect: 'Tyler Soderstrom', note: 'Rebuilding at every level. Future-focused.' },
];

const AA_TEAMS: TeamSeed[] = [
  { name: 'Binghamton Rumble Ponies', parent: 'NYM', wins: 70, losses: 60, streak: 'W6', lastTen: '8-2', prospect: 'Kevin Parada', note: 'Red hot stretch run, Parada driving the offense.' },
  { name: 'Portland Sea Dogs', parent: 'BOS', wins: 69, losses: 61, streak: 'W1', lastTen: '6-4', prospect: 'Marcelo Mayer', note: 'Mayer is a complete SS. ETA close.' },
  { name: 'Tulsa Drillers', parent: 'LAD', wins: 66, losses: 64, streak: 'L2', lastTen: '5-5', prospect: 'Dalton Rushing', note: 'Rushing showing power and patience behind the plate.' },
  { name: 'NW Arkansas Naturals', parent: 'KC', wins: 63, losses: 67, streak: 'W2', lastTen: '4-6', prospect: 'Gavin Cross', note: 'Cross adjusting to advanced pitching.' },
  { name: 'Rocket City Trash Pandas', parent: 'LAA', wins: 58, losses: 72, streak: 'L4', lastTen: '3-7', prospect: 'Nolan Schanuel', note: 'Below expectations this season.' },
  { name: 'Akron RubberDucks', parent: 'CLE', wins: 55, losses: 75, streak: 'L1', lastTen: '4-6', prospect: 'Chase DeLauter', note: 'DeLauter showing tools but results inconsistent.' },
];

const APLUS_TEAMS: TeamSeed[] = [
  { name: 'Brooklyn Cyclones', parent: 'NYM', wins: 76, losses: 54, streak: 'W7', lastTen: '9-1', prospect: 'Jett Williams', note: 'Best record in MiLB. Williams is electric.' },
  { name: 'Bowling Green Hot Rods', parent: 'TB', wins: 71, losses: 59, streak: 'W3', lastTen: '7-3', prospect: 'Brock Jones', note: 'System depth on full display.' },
  { name: 'South Bend Cubs', parent: 'CHC', wins: 67, losses: 63, streak: 'L1', lastTen: '5-5', prospect: 'Matt Shaw', note: 'Shaw showing everyday ability at the hot corner.' },
  { name: 'Asheville Tourists', parent: 'HOU', wins: 64, losses: 66, streak: 'W1', lastTen: '5-5', prospect: 'Zach Dezenzo', note: 'Dezenzo power starting to translate.' },
  { name: 'Rome Emperors', parent: 'ATL', wins: 60, losses: 70, streak: 'L3', lastTen: '3-7', prospect: 'Hurston Waldrep', note: 'Waldrep has the stuff but command is developing.' },
  { name: 'Fort Wayne TinCaps', parent: 'SD', wins: 54, losses: 76, streak: 'L2', lastTen: '4-6', prospect: 'Ethan Salas', note: 'Salas only 18. Long-term upside is elite.' },
];

const A_TEAMS: TeamSeed[] = [
  { name: 'St. Lucie Mets', parent: 'NYM', wins: 68, losses: 62, streak: 'W2', lastTen: '6-4', prospect: 'Luisangel Acuna', note: 'Acuna finding his footing in the system.' },
  { name: 'Inland Empire 66ers', parent: 'LAA', wins: 65, losses: 65, streak: 'L1', lastTen: '5-5', prospect: 'Caden Dana', note: 'Dana has top-of-rotation ceiling.' },
  { name: 'Delmarva Shorebirds', parent: 'BAL', wins: 64, losses: 66, streak: 'W4', lastTen: '7-3', prospect: 'Enrique Bradfield Jr', note: 'Elite speed and defense in CF.' },
  { name: 'Augusta GreenJackets', parent: 'ATL', wins: 62, losses: 68, streak: 'W1', lastTen: '4-6', prospect: 'Owen Murphy', note: 'Murphy has mid-rotation floor with high K rate.' },
  { name: 'Lake Elsinore Storm', parent: 'SD', wins: 58, losses: 72, streak: 'L6', lastTen: '2-8', prospect: 'Robby Snelling', note: 'Snelling lefty with plus curve. Needs innings.' },
  { name: 'Modesto Nuts', parent: 'SEA', wins: 55, losses: 75, streak: 'L2', lastTen: '3-7', prospect: 'Felnin Celesten', note: 'Toolsy SS still raw but intriguing ceiling.' },
];

function buildLevel(level: MinorLeagueLevel, seeds: TeamSeed[]): MiLBStandingsData {
  // Sort by wins descending to compute GB
  const sorted = [...seeds].sort((a, b) => b.wins - a.wins);
  const leaderWins = sorted[0].wins;
  const leaderLosses = sorted[0].losses;

  const teams: MiLBTeamRecord[] = sorted.map((t, i) => {
    const pct = Math.round(t.wins / (t.wins + t.losses) * 1000) / 1000;
    const gb = i === 0 ? 0 : Math.round(((leaderWins - t.wins) + (t.losses - leaderLosses)) / 2 * 10) / 10;

    return {
      id: `${level.toLowerCase().replace('+', 'p')}-${i}`,
      teamName: t.name,
      level,
      parentClub: t.parent,
      wins: t.wins,
      losses: t.losses,
      pct,
      gb,
      streak: t.streak,
      lastTen: t.lastTen,
      topProspect: t.prospect,
      notes: t.note,
    };
  });

  return { level, teams };
}

export function generateDemoMiLBStandings(): MiLBStandingsData[] {
  return [
    buildLevel('AAA', AAA_TEAMS),
    buildLevel('AA', AA_TEAMS),
    buildLevel('A+', APLUS_TEAMS),
    buildLevel('A', A_TEAMS),
  ];
}
