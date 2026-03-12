/**
 * Season awards computation.
 * Determines MVP, Cy Young, and Rookie of the Year for each league.
 * Uses player season stats to compute award scores.
 */

import type { Team } from '../../types/team';
import type { Player, PlayerSeason } from '../../types/player';
import type { RandomGenerator } from '../math/prng';

export interface AwardWinner {
  awardName: string;
  playerId: number;
  playerName: string;
  teamId: number;
  statLine: string;
}

export interface SeasonAwards {
  season: number;
  alMVP: AwardWinner;
  nlMVP: AwardWinner;
  alCyYoung: AwardWinner;
  nlCyYoung: AwardWinner;
  alROY: AwardWinner | null;
  nlROY: AwardWinner | null;
}

// ─── Award scoring ───────────────────────────────────────────────────────────

function mvpScore(ps: PlayerSeason): number {
  const avg = ps.ab > 0 ? ps.hits / ps.ab : 0;
  return (ps.hr * 3) + (ps.rbi * 1.5) + (ps.runs * 1.2) + (ps.hits * 0.8) + (avg * 100);
}

function cyYoungScore(ps: PlayerSeason): number {
  if (ps.ip < 20) return -999;
  const era = ps.ip > 0 ? (ps.earnedRuns / ps.ip) * 9 : 99;
  const kRate = ps.ip > 0 ? ps.kPitching / ps.ip * 9 : 0;
  return (ps.wins * 5) + (ps.saves * 3) + (kRate * 10) - (era * 15) + (ps.ip * 0.3);
}

function formatHitterLine(ps: PlayerSeason): string {
  const avg = ps.ab > 0 ? (ps.hits / ps.ab).toFixed(3).replace('0.', '.') : '.000';
  return `${avg} / ${ps.hr} HR / ${ps.rbi} RBI / ${ps.runs} R`;
}

function formatPitcherLine(ps: PlayerSeason): string {
  const era = ps.ip > 0 ? ((ps.earnedRuns / ps.ip) * 9).toFixed(2) : '0.00';
  return `${ps.wins}-${ps.losses}, ${era} ERA, ${ps.kPitching} K, ${Math.floor(ps.ip)} IP`;
}

function findBest(
  players: Player[],
  playerSeasons: Map<number, PlayerSeason>,
  conferenceId: number,
  teams: Team[],
  scoreFn: (ps: PlayerSeason) => number,
  filterFn: (p: Player) => boolean,
  minThreshold = 0,
): { player: Player; ps: PlayerSeason } | null {
  const teamConf = new Map(teams.map(t => [t.teamId, t.conferenceId]));
  let best: { player: Player; ps: PlayerSeason; score: number } | null = null;

  for (const p of players) {
    if (!filterFn(p)) continue;
    if (teamConf.get(p.teamId) !== conferenceId) continue;
    const ps = playerSeasons.get(p.playerId);
    if (!ps) continue;
    const score = scoreFn(ps);
    if (score <= minThreshold) continue;
    if (!best || score > best.score) {
      best = { player: p, ps, score };
    }
  }
  return best;
}

// ─── Main computation ────────────────────────────────────────────────────────

const emptyWinner: AwardWinner = {
  awardName: '', playerId: 0, playerName: '', teamId: 0, statLine: '',
};

export function computeSeasonAwards(
  season: number,
  players: Player[],
  playerSeasons: Map<number, PlayerSeason>,
  teams: Team[],
  gen: RandomGenerator,
): [SeasonAwards, RandomGenerator] {
  function makeWinner(
    awardName: string,
    result: { player: Player; ps: PlayerSeason } | null,
    isPitcher: boolean,
  ): AwardWinner {
    if (!result) return { ...emptyWinner, awardName };
    return {
      awardName,
      playerId: result.player.playerId,
      playerName: result.player.name,
      teamId: result.player.teamId,
      statLine: isPitcher ? formatPitcherLine(result.ps) : formatHitterLine(result.ps),
    };
  }

  const isHitter = (p: Player) => !p.isPitcher && p.rosterData.rosterStatus !== 'RETIRED';
  const isPitcher = (p: Player) => p.isPitcher && p.rosterData.rosterStatus !== 'RETIRED';
  const isRookieHitter = (p: Player) => !p.isPitcher && Math.floor(p.rosterData.serviceTimeDays / 172) <= 2;
  const isRookiePitcher = (p: Player) => p.isPitcher && Math.floor(p.rosterData.serviceTimeDays / 172) <= 2;
  const isRookie = (p: Player) => Math.floor(p.rosterData.serviceTimeDays / 172) <= 2 && p.rosterData.rosterStatus !== 'RETIRED';

  // AL = conferenceId 0, NL = conferenceId 1
  const alMVP = findBest(players, playerSeasons, 0, teams, mvpScore, isHitter);
  const nlMVP = findBest(players, playerSeasons, 1, teams, mvpScore, isHitter);
  const alCY = findBest(players, playerSeasons, 0, teams, cyYoungScore, isPitcher);
  const nlCY = findBest(players, playerSeasons, 1, teams, cyYoungScore, isPitcher);

  // ROY: best rookie by either hitting or pitching score
  const alROYh = findBest(players, playerSeasons, 0, teams, mvpScore, isRookieHitter);
  const alROYp = findBest(players, playerSeasons, 0, teams, cyYoungScore, isRookiePitcher);
  const nlROYh = findBest(players, playerSeasons, 1, teams, mvpScore, isRookieHitter);
  const nlROYp = findBest(players, playerSeasons, 1, teams, cyYoungScore, isRookiePitcher);

  // Pick best rookie regardless of position
  const alROY = alROYh && alROYp
    ? (mvpScore(alROYh.ps) >= cyYoungScore(alROYp.ps) ? alROYh : alROYp)
    : alROYh ?? alROYp;
  const nlROY = nlROYh && nlROYp
    ? (mvpScore(nlROYh.ps) >= cyYoungScore(nlROYp.ps) ? nlROYh : nlROYp)
    : nlROYh ?? nlROYp;

  void isRookie; // used indirectly

  return [{
    season,
    alMVP: makeWinner('AL MVP', alMVP, false),
    nlMVP: makeWinner('NL MVP', nlMVP, false),
    alCyYoung: makeWinner('AL Cy Young', alCY, true),
    nlCyYoung: makeWinner('NL Cy Young', nlCY, true),
    alROY: alROY ? makeWinner('AL ROY', alROY, alROY.player.isPitcher) : null,
    nlROY: nlROY ? makeWinner('NL ROY', nlROY, nlROY.player.isPitcher) : null,
  }, gen];
}
