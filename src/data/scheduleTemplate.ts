import type { ScheduleEntry } from '../types/game';

// ─── Division definitions ─────────────────────────────────────────────────────
// AL: 1-15, NL: 16-30
// AL East: 1-5, AL Central: 6-10, AL West: 11-15
// NL East: 16-20, NL Central: 21-25, NL West: 26-30

const AL_EAST:    number[] = [1, 2, 3, 4, 5];
const AL_CENTRAL: number[] = [6, 7, 8, 9, 10];
const AL_WEST:    number[] = [11, 12, 13, 14, 15];
const NL_EAST:    number[] = [16, 17, 18, 19, 20];
const NL_CENTRAL: number[] = [21, 22, 23, 24, 25];
const NL_WEST:    number[] = [26, 27, 28, 29, 30];

const AL_DIVISIONS = [AL_EAST, AL_CENTRAL, AL_WEST];
const NL_DIVISIONS = [NL_EAST, NL_CENTRAL, NL_WEST];

const AL_TEAMS = [...AL_EAST, ...AL_CENTRAL, ...AL_WEST];
const NL_TEAMS = [...NL_EAST, ...NL_CENTRAL, ...NL_WEST];

function getDivision(teamId: number): number[] {
  for (const div of [...AL_DIVISIONS, ...NL_DIVISIONS]) {
    if (div.includes(teamId)) return div;
  }
  return [];
}

function isAL(teamId: number): boolean {
  return teamId <= 15;
}

function isDivisionalMatch(a: number, b: number): boolean {
  const divA = getDivision(a);
  return divA.includes(b);
}

function isInterleagueMatch(a: number, b: number): boolean {
  return isAL(a) !== isAL(b);
}

// ─── Game pair generation ─────────────────────────────────────────────────────

interface GamePair {
  homeTeamId: number;
  awayTeamId: number;
  isInterleague: boolean;
  isDivisional: boolean;
}

function addSeries(
  pairs: GamePair[],
  teamA: number,
  teamB: number,
  gameCount: number,
): void {
  // Alternate home/away: first half at A, second half at B
  const half = Math.floor(gameCount / 2);
  const remainder = gameCount % 2;

  for (let i = 0; i < half; i++) {
    pairs.push({
      homeTeamId: teamA,
      awayTeamId: teamB,
      isInterleague: isInterleagueMatch(teamA, teamB),
      isDivisional: isDivisionalMatch(teamA, teamB),
    });
  }
  for (let i = 0; i < half; i++) {
    pairs.push({
      homeTeamId: teamB,
      awayTeamId: teamA,
      isInterleague: isInterleagueMatch(teamB, teamA),
      isDivisional: isDivisionalMatch(teamB, teamA),
    });
  }
  // Odd game: home is teamA
  for (let i = 0; i < remainder; i++) {
    pairs.push({
      homeTeamId: teamA,
      awayTeamId: teamB,
      isInterleague: isInterleagueMatch(teamA, teamB),
      isDivisional: isDivisionalMatch(teamA, teamB),
    });
  }
}

function generateGamePairs(): GamePair[] {
  const pairs: GamePair[] = [];

  // ── DIVISIONAL: 19 games vs each of 4 division opponents (76 total) ────────
  // Each division has 5 teams. Each team plays 4 opponents × 19 games = 76.
  // For a 5-team division, each pair plays 19 games (10 + 9 or 9 + 10).
  for (const div of [...AL_DIVISIONS, ...NL_DIVISIONS]) {
    for (let i = 0; i < div.length; i++) {
      for (let j = i + 1; j < div.length; j++) {
        // 19 games per divisional pair (split roughly 10-9)
        addSeries(pairs, div[i]!, div[j]!, 19);
      }
    }
  }
  // Each team now has 76 divisional games scheduled.

  // ── INTRA-LEAGUE NON-DIVISIONAL: ~66 games ──────────────────────────────────
  // Each team plays 2 non-division opponents in own league at varying game counts.
  // AL/NL each has 3 divisions of 5. Each team plays 10 non-div opponents.
  // 66 games / 10 opponents = ~6-7 games each.
  // We'll do 6 vs 6 opponents and 7 vs 4 opponents = 36 + 28 = 64. Close enough.
  // Simplify: 6 games vs all 10 non-div same-league opponents = 60 games.
  // That gives 76 + 60 = 136, leaving 26 for interleague (13 home, 13 away).
  // We'll aim for: 6 games vs 10 intra-league non-div opponents.

  for (const leagueDivisions of [AL_DIVISIONS, NL_DIVISIONS]) {
    // For each team, play 6 games vs every non-division intra-league opponent
    for (let di = 0; di < leagueDivisions.length; di++) {
      const myDiv = leagueDivisions[di]!;
      // Other divisions in same league
      const otherDivs = leagueDivisions.filter((_, idx) => idx !== di);
      for (const otherDiv of otherDivs) {
        // Each team in myDiv vs each team in otherDiv: 6 games
        for (const teamA of myDiv) {
          for (const teamB of otherDiv) {
            if (teamA < teamB) {
              // Only process each pair once
              addSeries(pairs, teamA, teamB, 6);
            }
          }
        }
      }
    }
  }
  // Each team: 10 non-div same-league opponents × 6 = 60 games
  // Running total: 76 + 60 = 136

  // ── INTERLEAGUE: ~26 games ───────────────────────────────────────────────────
  // 162 - 136 = 26 games remaining. Split: 13 home, 13 away.
  // Each AL team is paired with one NL division (geographic rivalry).
  // AL East ↔ NL East, AL Central ↔ NL Central, AL West ↔ NL West
  // Each AL team (5) plays each team in rival NL division (5): 5 opponents.
  // 26 / 5 = ~5 games each. Round to: 3 vs 2 opponents, 2 vs 3 opponents.
  // Simple: 3 games vs 2 rivals, 2 games vs 3 rivals = 6 + 6 = 12. Need 26.
  // Better: each AL team plays their 5 NL rivals exactly once home + once away = 10 games.
  // Plus one NL non-rival division: 4 teams × 2 games = 8. Total: 18. Still short.
  // 
  // Simplest valid approach: each AL team plays all 15 NL teams once = not 26 games.
  // 
  // FINAL APPROACH: AL vs NL geographic rivals (same division index):
  //   - 3 games vs 3 opponents in rival division (home series)
  //   - 2 games vs 2 opponents in rival division (road series)
  // = 9 + 4 = 13 at home, 13 away... let's do 26 via: 
  //   Each cross-league divisional pair: 26 games / (5×5 pairs per league-div pairing) doesn't divide evenly.
  //
  // PRACTICAL: Do 4 games vs 4 of the 5 rival-division opponents + 2 games vs 1 opponent = 18.
  // Supplement with 2 games vs non-rival NL (cross the odd pair): total ~26.
  //
  // SIMPLEST CORRECT APPROACH for this engine:
  // AL East vs NL East: each of 5 AL × 5 NL = 25 pairs. 2 games each = 50 game PAIRS total.
  // That's 50 games for AL East alone — too many.
  //
  // THE REAL MLB APPROACH: ~26 interleague per team. 
  // Geographic rival: 6 games (3H+3A). 4 other series of 2 games (2×home or 2×away):
  //   2 home series × 2 games + 2 away series × 2 games = 8 more = 14 with rival.
  // Then 2 more games vs another opponent = 16. Still not 26.
  //
  // We'll do: each team plays their 5 rival-division opponents (3+3+2+2+3=13 home, 13 away):
  // AL vs NL rival division: AL East(1-5) vs NL East(16-20)
  // Each AL team plays each NL rival: home series (3 games) vs 2 opponents,
  //                                   away series (2 games) vs 3 opponents = 3+3+2+2+2 = 12.
  //                                   + 1 extra home game vs one opponent = 13H+13A.
  //
  // FINAL FINAL: just assign 26 interleague games cleanly.
  // Each AL team plays 26 interleague: 13H + 13A.
  // Pair AL divisions with NL divisions. Each team in AL div (5) plays 5 NL rivals.
  // 26 games vs 5 rivals: give each rival 5 games (3H+2A or 2H+3A) = 25, 1 extra.
  // We'll give 3 opponents 5 games (15) and 2 opponents 5 games: rounding to 3+3+3+3+2+2+2+... too complex.
  //
  // DONE: Use flat 4 games vs each of 5 geographic rivals (20 IL games) + 6 split from non-rival pairing.
  // That's good enough for the sim. 76 div + 60 non-div + 26 IL = 162. Let's shoot for that.

  const rivalPairings: [number[], number[]][] = [
    [AL_EAST, NL_EAST],
    [AL_CENTRAL, NL_CENTRAL],
    [AL_WEST, NL_WEST],
  ];

  for (const [alDiv, nlDiv] of rivalPairings) {
    // Each AL team plays each NL team in rival division:
    // 5 opponents. We want ~26 interleague games.
    // 5 opponents × 5 games = 25 games. Let one opponent get 1 extra = 26.
    // Simpler: 5 opponents × 4 games = 20. Then pick 2 cross-pairings for 3 extra games each = 26.
    // We'll do: 5 × 5 = 25, with one opponent at 5 games (3H+2A) and four at 5 games (same).
    // Split: AL team plays 3 NL rivals at home 3 times + 2 NL rivals at home 2 times = 9+4=13H
    //        AL team plays 3 NL rivals away  2 times + 2 NL rivals away  3 times = 6+6=12A.. not 13.
    // Easiest: each AL-NL pair plays exactly 5 games. 3 at AL home, 2 at NL home.
    // 5 pairs × 5 games = 25. The 26th game: give the geographic "natural rival" 1 extra.
    // For simplicity, just do 5 games per pair (25 total), acceptable rounding.

    for (const alTeam of alDiv) {
      for (const nlTeam of nlDiv) {
        if (alTeam < nlTeam) {
          // 5 games: 3 at AL home, 2 at NL home
          // add 3 with AL as home:
          for (let i = 0; i < 3; i++) {
            pairs.push({ homeTeamId: alTeam, awayTeamId: nlTeam, isInterleague: true, isDivisional: false });
          }
          // add 2 with NL as home:
          for (let i = 0; i < 2; i++) {
            pairs.push({ homeTeamId: nlTeam, awayTeamId: alTeam, isInterleague: true, isDivisional: false });
          }
        }
      }
    }
  }
  // Each team now has: 76 div + 60 intra + (5 opponents × 5 games) IL = 76+60+25 = 161 games.
  // We need 162. Add one extra cross-league game per team via one extra AL-NL pair.
  // Do this by adding 1 bonus game between AL team 1 and NL team 16, AL 6 and NL 21, AL 11 and NL 26,
  // etc — one per natural rival pairing, giving those teams 162 exactly.
  // This keeps totals valid without complex rebalancing.
  for (const [alDiv, nlDiv] of rivalPairings) {
    // One bonus game: first AL team hosts first NL team in the pairing
    pairs.push({
      homeTeamId: alDiv[0]!,
      awayTeamId: nlDiv[0]!,
      isInterleague: true,
      isDivisional: false,
    });
    // And the reverse for the second teams so they also reach 162
    pairs.push({
      homeTeamId: nlDiv[1]!,
      awayTeamId: alDiv[1]!,
      isInterleague: true,
      isDivisional: false,
    });
    // And third teams
    pairs.push({
      homeTeamId: alDiv[2]!,
      awayTeamId: nlDiv[2]!,
      isInterleague: true,
      isDivisional: false,
    });
    pairs.push({
      homeTeamId: nlDiv[3]!,
      awayTeamId: alDiv[3]!,
      isInterleague: true,
      isDivisional: false,
    });
    pairs.push({
      homeTeamId: alDiv[4]!,
      awayTeamId: nlDiv[4]!,
      isInterleague: true,
      isDivisional: false,
    });
  }

  return pairs;
}

// ─── Date assignment ──────────────────────────────────────────────────────────
// 2430 games / 15 per day = 162 game days.
// Start: 2026-04-01. Assign 15 games per game day.

function assignDates(pairs: GamePair[]): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  const startDate = new Date('2026-04-01T00:00:00Z');

  // Shuffle pairs so divisional games aren't all clumped at the start.
  // Use a deterministic Fisher-Yates shuffle with a fixed seed (no pure-rand dependency here).
  const shuffled = [...pairs];
  let seed = 123456789;
  function lcg(): number {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0x100000000;
  }
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    const tmp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp;
  }

  // Sort into game day buckets of 15
  const GAMES_PER_DAY = 15;

  for (let i = 0; i < shuffled.length; i++) {
    const gameDay = Math.floor(i / GAMES_PER_DAY);
    // Add game days, skipping one day per week (travel/off-days every 7 days)
    const calendarDay = gameDay + Math.floor(gameDay / 6); // 1 off-day per 6 game-days
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + calendarDay);

    const pair = shuffled[i]!;
    entries.push({
      gameId: i + 1,
      date: date.toISOString().slice(0, 10),
      homeTeamId: pair.homeTeamId,
      awayTeamId: pair.awayTeamId,
      isInterleague: pair.isInterleague,
      isDivisional: pair.isDivisional,
    });
  }

  return entries;
}

// ─── Public API ───────────────────────────────────────────────────────────────

let _cachedSchedule: ScheduleEntry[] | null = null;

export function generateScheduleTemplate(): ScheduleEntry[] {
  if (_cachedSchedule) return _cachedSchedule;
  const pairs = generateGamePairs();
  _cachedSchedule = assignDates(pairs);
  return _cachedSchedule;
}

// Validate game counts per team (dev/test utility)
export function validateSchedule(schedule: ScheduleEntry[]): Record<number, number> {
  const counts: Record<number, number> = {};
  for (const entry of schedule) {
    counts[entry.homeTeamId] = (counts[entry.homeTeamId] ?? 0) + 1;
    counts[entry.awayTeamId] = (counts[entry.awayTeamId] ?? 0) + 1;
  }
  return counts;
}
