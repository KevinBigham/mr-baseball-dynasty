import { createPRNG } from '../math/prng';
import { simulateGame } from './gameSimulator';
import type { SimulateGameInput } from './gameSimulator';
import type { ScheduleEntry } from '../../types/game';
import type { Player, PlayerSeasonStats, PitcherGameStats } from '../../types/player';
import type { Team, TeamSeasonStats } from '../../types/team';
import type { SeasonResult } from '../../types/league';

// ─── Blank stat accumulators ──────────────────────────────────────────────────

function blankPlayerSeason(playerId: number, teamId: number, season: number): PlayerSeasonStats {
  return {
    playerId,
    teamId,
    season,
    g: 0, pa: 0, ab: 0, r: 0, h: 0,
    doubles: 0, triples: 0, hr: 0,
    rbi: 0, bb: 0, k: 0, sb: 0, cs: 0, hbp: 0,
    w: 0, l: 0, sv: 0, hld: 0, bs: 0,
    gp: 0, gs: 0, outs: 0,
    ha: 0, ra: 0, er: 0, bba: 0, ka: 0, hra: 0,
    pitchCount: 0,
  };
}

function getOrCreate(
  map: Map<number, PlayerSeasonStats>,
  playerId: number,
  teamId: number,
  season: number,
): PlayerSeasonStats {
  if (!map.has(playerId)) {
    map.set(playerId, blankPlayerSeason(playerId, teamId, season));
  }
  return map.get(playerId)!;
}

// ─── Season accumulation helpers ──────────────────────────────────────────────

function accumulateBatting(
  statsMap: Map<number, PlayerSeasonStats>,
  playerGameStats: Array<{ playerId: number; pa: number; ab: number; r: number; h: number;
    doubles: number; triples: number; hr: number; rbi: number; bb: number; k: number }>,
  playerTeamMap: Map<number, number>,
  season: number,
): void {
  for (const gs of playerGameStats) {
    const teamId = playerTeamMap.get(gs.playerId) ?? -1;
    const s = getOrCreate(statsMap, gs.playerId, teamId, season);
    s.g++;
    s.pa    += gs.pa;
    s.ab    += gs.ab;
    s.r     += gs.r;
    s.h     += gs.h;
    s.doubles += gs.doubles;
    s.triples += gs.triples;
    s.hr    += gs.hr;
    s.rbi   += gs.rbi;
    s.bb    += gs.bb;
    s.k     += gs.k;
  }
}

function accumulatePitching(
  statsMap: Map<number, PlayerSeasonStats>,
  pitcherGameStats: PitcherGameStats[],
  playerTeamMap: Map<number, number>,
  playerPositionMap: Map<number, string>,
  season: number,
): void {
  for (const pg of pitcherGameStats) {
    const teamId = playerTeamMap.get(pg.playerId) ?? -1;
    const s = getOrCreate(statsMap, pg.playerId, teamId, season);
    s.gp++;

    // A starter is credited with a start if they recorded any outs and play SP
    const pos = playerPositionMap.get(pg.playerId);
    if (pos === 'SP' && pg.outs > 0) s.gs++;

    s.outs      += pg.outs;
    s.ha        += pg.h;
    s.ra        += pg.r;
    s.er        += pg.er;
    s.bba       += pg.bb;
    s.ka        += pg.k;
    s.hra       += pg.hr;
    s.pitchCount += pg.pitchCount;

    if (pg.decision === 'W') s.w++;
    if (pg.decision === 'L') s.l++;
    if (pg.decision === 'S') s.sv++;
    if (pg.decision === 'H') s.hld++;
    if (pg.decision === 'BS') s.bs++;
  }
}

// ─── Standard deviation helper ────────────────────────────────────────────────

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

// ─── Main season simulator ────────────────────────────────────────────────────

export async function simulateSeason(
  teams: Team[],
  players: Player[],
  schedule: ScheduleEntry[],
  baseSeed: number,
  onProgress?: (pct: number) => void,
): Promise<SeasonResult> {
  const season = new Date().getFullYear(); // Caller should pass season number; use current year as fallback

  // Build lookup maps for player metadata
  const playerTeamMap = new Map<number, number>();
  const playerPositionMap = new Map<number, string>();
  for (const p of players) {
    playerTeamMap.set(p.playerId, p.teamId);
    playerPositionMap.set(p.playerId, p.position);
  }

  // Build team map
  const teamMap = new Map<number, Team>();
  for (const t of teams) teamMap.set(t.teamId, t);

  // Team record accumulators
  const teamWins   = new Map<number, number>();
  const teamLosses = new Map<number, number>();
  const teamRS     = new Map<number, number>();
  const teamRA     = new Map<number, number>();
  for (const t of teams) {
    teamWins.set(t.teamId, 0);
    teamLosses.set(t.teamId, 0);
    teamRS.set(t.teamId, 0);
    teamRA.set(t.teamId, 0);
  }

  // Player season stats accumulator
  const playerStatsMap = new Map<number, PlayerSeasonStats>();

  // Track rotation indices per team (so each game advances the rotation)
  const rotationIndex = new Map<number, number>();
  // Track bullpen cycle offset per team (so different relievers pitch each game)
  const bullpenOffset = new Map<number, number>();
  for (const t of teams) {
    rotationIndex.set(t.teamId, 0);
    bullpenOffset.set(t.teamId, 0);
  }

  const total = schedule.length;
  let completed = 0;

  // Use PRNG only for game seed generation — derive per-game seed deterministically
  let gen = createPRNG(baseSeed);
  void gen; // We derive seeds directly from baseSeed + gameId instead; gen kept for future use

  for (const entry of schedule) {
    const homeTeam = teamMap.get(entry.homeTeamId);
    const awayTeam = teamMap.get(entry.awayTeamId);

    if (!homeTeam || !awayTeam) {
      completed++;
      continue;
    }

    // Deterministic per-game seed: combine baseSeed with gameId via mixing
    const gameSeed = (baseSeed ^ (entry.gameId * 2654435761)) >>> 0;

    // Snapshot rotation + bullpen indices into team objects for this game
    const homeWithRotation: Team = {
      ...homeTeam,
      rotationIndex: rotationIndex.get(entry.homeTeamId) ?? 0,
      bullpenReliefCounter: bullpenOffset.get(entry.homeTeamId) ?? 0,
    };
    const awayWithRotation: Team = {
      ...awayTeam,
      rotationIndex: rotationIndex.get(entry.awayTeamId) ?? 0,
      bullpenReliefCounter: bullpenOffset.get(entry.awayTeamId) ?? 0,
    };

    const input: SimulateGameInput = {
      gameId: entry.gameId,
      season,
      date: entry.date,
      homeTeam: homeWithRotation,
      awayTeam: awayWithRotation,
      players,
      seed: gameSeed,
    };

    const result = simulateGame(input);

    // Advance rotation (each game uses next starter in 5-man rotation)
    rotationIndex.set(entry.homeTeamId, (rotationIndex.get(entry.homeTeamId) ?? 0) + 1);
    rotationIndex.set(entry.awayTeamId, (rotationIndex.get(entry.awayTeamId) ?? 0) + 1);
    // Advance bullpen offset so different relievers pitch each game
    bullpenOffset.set(entry.homeTeamId, (bullpenOffset.get(entry.homeTeamId) ?? 0) + 3);
    bullpenOffset.set(entry.awayTeamId, (bullpenOffset.get(entry.awayTeamId) ?? 0) + 3);

    // Update team records
    if (result.homeScore > result.awayScore) {
      teamWins.set(entry.homeTeamId, (teamWins.get(entry.homeTeamId) ?? 0) + 1);
      teamLosses.set(entry.awayTeamId, (teamLosses.get(entry.awayTeamId) ?? 0) + 1);
    } else {
      teamWins.set(entry.awayTeamId, (teamWins.get(entry.awayTeamId) ?? 0) + 1);
      teamLosses.set(entry.homeTeamId, (teamLosses.get(entry.homeTeamId) ?? 0) + 1);
    }
    teamRS.set(entry.homeTeamId, (teamRS.get(entry.homeTeamId) ?? 0) + result.homeScore);
    teamRS.set(entry.awayTeamId, (teamRS.get(entry.awayTeamId) ?? 0) + result.awayScore);
    teamRA.set(entry.homeTeamId, (teamRA.get(entry.homeTeamId) ?? 0) + result.awayScore);
    teamRA.set(entry.awayTeamId, (teamRA.get(entry.awayTeamId) ?? 0) + result.homeScore);

    // Accumulate player stats from box score
    const box = result.boxScore;
    accumulateBatting(playerStatsMap, box.homeBatting, playerTeamMap, season);
    accumulateBatting(playerStatsMap, box.awayBatting, playerTeamMap, season);
    accumulatePitching(playerStatsMap, box.homePitching, playerTeamMap, playerPositionMap, season);
    accumulatePitching(playerStatsMap, box.awayPitching, playerTeamMap, playerPositionMap, season);

    completed++;

    if (completed % 100 === 0 && onProgress) {
      onProgress(completed / total);
      // Yield to event loop to keep UI responsive
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
  }

  if (onProgress) onProgress(1.0);

  // ── Build TeamSeasonStats ─────────────────────────────────────────────────
  const teamSeasons: TeamSeasonStats[] = teams.map(t => ({
    teamId: t.teamId,
    season,
    record: {
      wins: teamWins.get(t.teamId) ?? 0,
      losses: teamLosses.get(t.teamId) ?? 0,
      runsScored: teamRS.get(t.teamId) ?? 0,
      runsAllowed: teamRA.get(t.teamId) ?? 0,
    },
    payroll: 0, // Salary tracking is v1.0
  }));

  // ── League environment stats ──────────────────────────────────────────────
  let totalHits = 0;
  let totalAB   = 0;
  let totalER   = 0;
  let totalOuts = 0;
  let totalRuns = 0;

  for (const s of playerStatsMap.values()) {
    // Batting aggregates
    totalHits += s.h;
    totalAB   += s.ab;
    // Pitching aggregates
    totalER   += s.er;
    totalOuts += s.outs;
    // Runs (use pitching ra to avoid double-counting)
    totalRuns += s.ra;
  }

  const leagueBA  = totalAB   > 0 ? totalHits / totalAB          : 0.255;
  const leagueERA = totalOuts > 0 ? (totalER / totalOuts) * 27   : 4.10;
  // totalRuns sums each pitcher's RA (= runs scored by opponents).
  // Each game has 2 teams pitching, so divide by games*2 to get per-team-per-game.
  const leagueRPG = schedule.length > 0 ? totalRuns / (schedule.length * 2) : 4.5;

  const winTotals = teamSeasons.map(ts => ts.record.wins);
  const teamWinsSD = stddev(winTotals);

  const playerSeasons = Array.from(playerStatsMap.values());

  return {
    season,
    teamSeasons,
    playerSeasons,
    boxScores: [], // Not stored at season level (too large); hot storage handles individual games
    leagueBA,
    leagueERA,
    leagueRPG,
    teamWinsSD,
  };
}

// ─── Service time advancement ─────────────────────────────────────────────────
// Call once per game day for MLB_ACTIVE and IL players.

export function advanceServiceTime(players: Player[], gameDay: number): void {
  void gameDay; // Parameter reserved for future per-day rate adjustments
  for (const player of players) {
    const status = player.rosterData.rosterStatus;
    if (status === 'MLB_ACTIVE' || status === 'MLB_IL_10' || status === 'MLB_IL_60') {
      player.rosterData.serviceTimeDays++;
      player.rosterData.serviceTimeCurrentTeamDays++;
    }
  }
}

// ─── Seasonal counter reset (run at start of each new season) ────────────────

export function resetSeasonCounters(players: Player[]): void {
  for (const player of players) {
    player.rosterData.optionUsedThisSeason    = false;
    player.rosterData.minorLeagueDaysThisSeason = 0;
    player.rosterData.demotionsThisSeason      = 0;
  }
}
