/**
 * Minor League Award Tracker — Mr. Baseball Dynasty (Wave 71)
 *
 * Tracks MiLB awards across all levels:
 *   - MVP, Pitcher of the Year, Batting Champion per level (AAA/AA/A+/A)
 *   - Current season race leaders with live stats
 *   - Historical winners archive
 *   - Organization prospect award history
 *
 * All data self-contained with rich demo generation.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type MiLBLevel = 'AAA' | 'AA' | 'A+' | 'A';

export type AwardCategory = 'MVP' | 'Pitcher of the Year' | 'Batting Champion' | 'Reliever of the Year' | 'Rookie of the Year';

export interface AwardCandidate {
  playerId: number;
  name: string;
  team: string;
  age: number;
  position: string;
  isOrgProspect: boolean;    // belongs to player's organization
  topProspectRank: number | null;  // org prospect rank, or null
  stats: AwardCandidateStats;
  awardScore: number;        // 0-100 calculated score for the race
}

export interface AwardCandidateStats {
  // Batting stats (for MVP / Batting Champ)
  gamesPlayed?: number;
  avg?: number;
  hr?: number;
  rbi?: number;
  runs?: number;
  obp?: number;
  slg?: number;
  ops?: number;
  sb?: number;
  war?: number;
  // Pitching stats (for Pitcher of Year / Reliever)
  wins?: number;
  losses?: number;
  era?: number;
  innings?: number;
  strikeouts?: number;
  whip?: number;
  saves?: number;
  holds?: number;
  fip?: number;
}

export interface AwardRace {
  level: MiLBLevel;
  category: AwardCategory;
  leaders: AwardCandidate[];  // sorted by awardScore desc
  gamesRemaining: number;     // in the MiLB season
  isFinal: boolean;           // true if season is over and winner is decided
}

export interface PastWinner {
  year: number;
  level: MiLBLevel;
  category: AwardCategory;
  playerId: number;
  name: string;
  team: string;
  position: string;
  keyStats: string;           // summary stat line
  isOrgProspect: boolean;
  eventualMLBTeam: string | null;   // where they ended up
  mlbCareerWAR: number | null;      // career WAR if reached MLB
}

export interface OrgAwardHistoryEntry {
  year: number;
  playerName: string;
  level: MiLBLevel;
  category: AwardCategory;
  keyStats: string;
  currentStatus: string;     // "Active MLB" | "AAA" | "Retired" etc.
}

export interface MiLBAwardData {
  currentRaces: AwardRace[];
  pastWinners: PastWinner[];
  orgAwardHistory: OrgAwardHistoryEntry[];
  seasonYear: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

export const LEVELS: MiLBLevel[] = ['AAA', 'AA', 'A+', 'A'];

export const AWARD_CATEGORIES: AwardCategory[] = [
  'MVP', 'Pitcher of the Year', 'Batting Champion', 'Reliever of the Year', 'Rookie of the Year',
];

export const LEVEL_COLORS: Record<MiLBLevel, string> = {
  'AAA': '#f59e0b',
  'AA':  '#3b82f6',
  'A+':  '#22c55e',
  'A':   '#a855f7',
};

export const CATEGORY_ICONS: Record<AwardCategory, string> = {
  'MVP': 'MVP',
  'Pitcher of the Year': 'POY',
  'Batting Champion': 'BAT',
  'Reliever of the Year': 'REL',
  'Rookie of the Year': 'ROY',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function r(lo: number, hi: number): number {
  return lo + Math.random() * (hi - lo);
}

function ri(lo: number, hi: number): number {
  return Math.round(r(lo, hi));
}

function rd(lo: number, hi: number, decimals: number): number {
  return Math.round(r(lo, hi) * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Name pools ───────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Marcus', 'Tyler', 'Jake', 'Bryce', 'Colton', 'Luis', 'Carlos', 'Devon',
  'Zach', 'Ryan', 'Kyle', 'Trevor', 'Austin', 'Dillon', 'Noah', 'Ethan',
  'Mason', 'Hunter', 'Juan', 'Rafael', 'Pedro', 'Kenji', 'Shohei', 'Wei',
  'Jordan', 'Brandon', 'Garrett', 'Cody', 'Tanner', 'Dylan', 'Connor', 'Chase',
  'Elijah', 'Isaiah', 'Jayden', 'Adrian', 'Omar', 'Felix', 'Miguel', 'Javier',
];

const LAST_NAMES = [
  'Rodriguez', 'Johnson', 'Williams', 'Martinez', 'Thompson', 'Garcia',
  'Anderson', 'Brown', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor',
  'Hernandez', 'Nakamura', 'Chen', 'Ohtani', 'Suzuki', 'Park',
  'Ramirez', 'Lopez', 'Gonzalez', 'Perez', 'Torres', 'Reyes',
  'Sullivan', 'O\'Brien', 'Murphy', 'Kelly', 'Cooper', 'Bell',
  'Freeman', 'Hayes', 'Crawford', 'Stewart', 'Price', 'Long',
];

const MILB_TEAMS: Record<MiLBLevel, string[]> = {
  'AAA': ['Syracuse Mets', 'Scranton RailRiders', 'Rochester Red Wings', 'Buffalo Bisons', 'Omaha Storm Chasers', 'Sacramento River Cats'],
  'AA':  ['Binghamton Rumble Ponies', 'Somerset Patriots', 'Hartford Yard Goats', 'Reading Fightin Phils', 'Akron RubberDucks', 'Portland Sea Dogs'],
  'A+':  ['Brooklyn Cyclones', 'Hudson Valley Renegades', 'Wilmington Blue Rocks', 'Jersey Shore BlueClaws', 'South Bend Cubs', 'Fort Wayne TinCaps'],
  'A':   ['St. Lucie Mets', 'Tampa Tarpons', 'Dunedin Blue Jays', 'Jupiter Hammerheads', 'Lakeland Flying Tigers', 'Clearwater Threshers'],
};

const POSITIONS_BATTING = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH'];
const POSITIONS_PITCHING = ['SP', 'RP'];

const MLB_TEAMS = ['NYM', 'NYY', 'BOS', 'LAD', 'ATL', 'HOU', 'PHI', 'SD', 'CHC', 'SF', 'SEA', 'MIN', 'TB', 'CLE', 'BAL', 'TEX'];

// ── Candidate generation ─────────────────────────────────────────────────────

let nextId = 3000;

function genBatterCandidate(level: MiLBLevel, isOrgProspect: boolean, tier: number): AwardCandidate {
  const id = nextId++;
  const name = `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
  const team = pickRandom(MILB_TEAMS[level]);
  const age = level === 'A' ? ri(19, 22) : level === 'A+' ? ri(20, 23) : level === 'AA' ? ri(21, 25) : ri(23, 28);
  const pos = pickRandom(POSITIONS_BATTING);
  const topRank = isOrgProspect ? ri(1, 30) : null;

  // Tier affects stat quality: 0 = race leader, higher = worse
  const tierMod = tier * 0.015;
  const gp = ri(95, 130);
  const avg = rd(0.280 - tierMod, 0.340 - tierMod, 3);
  const hr = ri(Math.max(5, 18 - tier * 4), Math.max(12, 32 - tier * 3));
  const rbi = ri(Math.max(30, 60 - tier * 8), Math.max(50, 95 - tier * 5));
  const runs = ri(Math.max(35, 55 - tier * 5), Math.max(55, 85 - tier * 4));
  const obp = rd(avg + 0.050, avg + 0.090, 3);
  const slg = rd(avg + 0.120 - tierMod, avg + 0.250 - tierMod, 3);
  const ops = rd(obp + slg - 0.01, obp + slg + 0.01, 3);
  const sb = ri(2, 25);
  const war = rd(2.0 - tier * 0.5, 5.5 - tier * 0.5, 1);

  const awardScore = clamp(Math.round(
    avg * 120 + hr * 1.2 + rbi * 0.4 + runs * 0.3 + obp * 80 + slg * 60 + sb * 0.3 + war * 6 - tier * 5
  ), 20, 99);

  return {
    playerId: id,
    name,
    team,
    age,
    position: pos,
    isOrgProspect,
    topProspectRank: topRank,
    stats: { gamesPlayed: gp, avg, hr, rbi, runs, obp, slg, ops, sb, war },
    awardScore,
  };
}

function genPitcherCandidate(level: MiLBLevel, isOrgProspect: boolean, tier: number, isReliever: boolean): AwardCandidate {
  const id = nextId++;
  const name = `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
  const team = pickRandom(MILB_TEAMS[level]);
  const age = level === 'A' ? ri(19, 22) : level === 'A+' ? ri(20, 23) : level === 'AA' ? ri(21, 25) : ri(23, 28);
  const pos = isReliever ? 'RP' : 'SP';
  const topRank = isOrgProspect ? ri(1, 30) : null;

  const tierMod = tier * 0.2;

  let stats: AwardCandidateStats;
  if (isReliever) {
    const saves = ri(Math.max(5, 22 - tier * 5), Math.max(10, 35 - tier * 3));
    const holds = ri(2, 12);
    const era = rd(1.50 + tierMod, 3.20 + tierMod, 2);
    const innings = rd(45, 72, 1);
    const strikeouts = ri(Math.max(30, 55 - tier * 5), Math.max(50, 85 - tier * 5));
    const whip = rd(0.85 + tierMod * 0.3, 1.20 + tierMod * 0.3, 2);
    const wins = ri(2, 7);
    const losses = ri(1, 5);
    const fip = rd(era - 0.3, era + 0.4, 2);

    stats = { wins, losses, era, innings, strikeouts, whip, saves, holds, fip };

    const awardScore = clamp(Math.round(
      (4.5 - era) * 15 + saves * 1.5 + strikeouts * 0.5 + (1.3 - whip) * 30 + holds * 0.5 - tier * 5
    ), 20, 99);

    return { playerId: id, name, team, age, position: pos, isOrgProspect, topProspectRank: topRank, stats, awardScore };
  } else {
    const wins = ri(Math.max(5, 10 - tier * 2), Math.max(8, 16 - tier));
    const losses = ri(2, 8 + tier);
    const era = rd(2.20 + tierMod, 3.80 + tierMod, 2);
    const innings = rd(120, 175, 1);
    const strikeouts = ri(Math.max(80, 130 - tier * 10), Math.max(110, 190 - tier * 10));
    const whip = rd(0.90 + tierMod * 0.2, 1.25 + tierMod * 0.2, 2);
    const fip = rd(era - 0.4, era + 0.3, 2);

    stats = { wins, losses, era, innings, strikeouts, whip, fip };

    const awardScore = clamp(Math.round(
      (4.0 - era) * 15 + wins * 2.5 + strikeouts * 0.25 + (1.3 - whip) * 25 + innings * 0.1 - tier * 5
    ), 20, 99);

    return { playerId: id, name, team, age, position: pos, isOrgProspect, topProspectRank: topRank, stats, awardScore };
  }
}

// ── Race generation ──────────────────────────────────────────────────────────

function genAwardRace(level: MiLBLevel, category: AwardCategory, gamesRemaining: number): AwardRace {
  const numLeaders = ri(4, 6);
  const leaders: AwardCandidate[] = [];

  for (let i = 0; i < numLeaders; i++) {
    const isOrg = i === 0 ? true : Math.random() < 0.25;  // first leader always org prospect for interest
    const tier = i;

    if (category === 'Pitcher of the Year') {
      leaders.push(genPitcherCandidate(level, isOrg, tier, false));
    } else if (category === 'Reliever of the Year') {
      leaders.push(genPitcherCandidate(level, isOrg, tier, true));
    } else if (category === 'Batting Champion') {
      const candidate = genBatterCandidate(level, isOrg, tier);
      // Batting champ emphasizes avg
      candidate.awardScore = clamp(Math.round((candidate.stats.avg ?? 0.250) * 300 - tier * 3), 20, 99);
      leaders.push(candidate);
    } else {
      // MVP and ROY use position players
      leaders.push(genBatterCandidate(level, isOrg, tier));
    }
  }

  // Sort by award score
  leaders.sort((a, b) => b.awardScore - a.awardScore);

  return {
    level,
    category,
    leaders,
    gamesRemaining,
    isFinal: gamesRemaining === 0,
  };
}

// ── Past winners generation ──────────────────────────────────────────────────

function genPastWinner(year: number, level: MiLBLevel, category: AwardCategory): PastWinner {
  const name = `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
  const team = pickRandom(MILB_TEAMS[level]);
  const isPitcher = category === 'Pitcher of the Year' || category === 'Reliever of the Year';
  const pos = isPitcher ? pickRandom(POSITIONS_PITCHING) : pickRandom(POSITIONS_BATTING);
  const isOrg = Math.random() < 0.3;
  const reachedMLB = Math.random() < 0.55;
  const mlbTeam = reachedMLB ? pickRandom(MLB_TEAMS) : null;
  const mlbWar = reachedMLB ? rd(-0.5, 35.0, 1) : null;

  let keyStats: string;
  if (category === 'Batting Champion') {
    keyStats = `.${ri(310, 365)} AVG, ${ri(8, 28)} HR, ${ri(45, 95)} RBI`;
  } else if (category === 'Pitcher of the Year') {
    keyStats = `${ri(8, 16)}-${ri(2, 8)}, ${rd(1.80, 3.50, 2)} ERA, ${ri(100, 195)} K`;
  } else if (category === 'Reliever of the Year') {
    keyStats = `${ri(15, 38)} SV, ${rd(1.20, 2.90, 2)} ERA, ${ri(50, 90)} K`;
  } else if (category === 'MVP') {
    keyStats = `.${ri(275, 340)} / ${ri(15, 38)} HR / ${ri(60, 110)} RBI / ${rd(2.0, 6.0, 1)} WAR`;
  } else {
    keyStats = `.${ri(265, 325)} / ${ri(8, 22)} HR / ${ri(40, 80)} RBI`;
  }

  return {
    year,
    level,
    category,
    playerId: nextId++,
    name,
    team,
    position: pos,
    keyStats,
    isOrgProspect: isOrg,
    eventualMLBTeam: mlbTeam,
    mlbCareerWAR: mlbWar,
  };
}

// ── Org history generation ───────────────────────────────────────────────────

function genOrgHistory(): OrgAwardHistoryEntry[] {
  const history: OrgAwardHistoryEntry[] = [];
  const statuses = ['Active MLB', 'Active MLB', 'AAA Roster', 'AA', 'Traded', 'Retired', 'Free Agent', 'Active MLB (All-Star)'];

  for (let year = 2025; year >= 2018; year--) {
    // 1-3 awards per year
    const count = ri(1, 3);
    for (let i = 0; i < count; i++) {
      const level = pickRandom(LEVELS);
      const cat = pickRandom(AWARD_CATEGORIES);
      const name = `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;

      const isPitcher = cat === 'Pitcher of the Year' || cat === 'Reliever of the Year';
      let keyStats: string;
      if (isPitcher) {
        keyStats = `${rd(2.00, 3.50, 2)} ERA, ${ri(80, 180)} K`;
      } else {
        keyStats = `.${ri(280, 345)} AVG, ${ri(10, 32)} HR`;
      }

      const yearsAgo = 2026 - year;
      const status = yearsAgo <= 1 ? pickRandom(['AAA Roster', 'Active MLB', 'AA']) :
        yearsAgo <= 3 ? pickRandom(['Active MLB', 'AAA Roster', 'Traded']) :
        pickRandom(statuses);

      history.push({ year, playerName: name, level, category: cat, keyStats, currentStatus: status });
    }
  }

  return history;
}

// ── Main demo generation ─────────────────────────────────────────────────────

export function generateDemoMiLBAwards(): MiLBAwardData {
  const currentRaces: AwardRace[] = [];
  const gamesRemaining = ri(15, 45);

  // Generate current races: each level gets MVP, POY, Batting Champ, Reliever, ROY
  for (const level of LEVELS) {
    for (const cat of AWARD_CATEGORIES) {
      currentRaces.push(genAwardRace(level, cat, gamesRemaining));
    }
  }

  // Generate past winners: 5 years back, 2-3 awards per level per year
  const pastWinners: PastWinner[] = [];
  for (let year = 2025; year >= 2020; year--) {
    for (const level of LEVELS) {
      // Not every award is given every year in our data — pick 2-3
      const cats = AWARD_CATEGORIES.sort(() => Math.random() - 0.5).slice(0, ri(2, 4));
      for (const cat of cats) {
        pastWinners.push(genPastWinner(year, level, cat));
      }
    }
  }

  const orgAwardHistory = genOrgHistory();

  return {
    currentRaces,
    pastWinners,
    orgAwardHistory,
    seasonYear: 2026,
  };
}

// ── Utility exports for UI ───────────────────────────────────────────────────

export function formatAvg(avg: number): string {
  return avg.toFixed(3).replace(/^0/, '');
}

export function formatERA(era: number): string {
  return era.toFixed(2);
}

export function getCategoryColor(cat: AwardCategory): string {
  switch (cat) {
    case 'MVP': return '#f59e0b';
    case 'Pitcher of the Year': return '#3b82f6';
    case 'Batting Champion': return '#22c55e';
    case 'Reliever of the Year': return '#a855f7';
    case 'Rookie of the Year': return '#ef4444';
    default: return '#9ca3af';
  }
}
