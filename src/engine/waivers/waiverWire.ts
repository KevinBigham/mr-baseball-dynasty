/**
 * Waiver Wire System — Mr. Baseball Dynasty
 *
 * Handles waiver claims for DFA'd players:
 *   - Players placed on waivers after DFA
 *   - Teams can claim players in reverse standings order
 *   - Claimed players go to claiming team's 40-man roster
 *   - Unclaimed players become free agents or go to minors
 *   - AI teams evaluate waiver claims based on need + talent
 *
 * Inspired by OOTP's waiver system.
 */

import type { Player } from '../../types/player';
import type { Team } from '../../types/team';
import { toScoutingScale } from '../player/attributes';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface WaiverPlayer {
  playerId:     number;
  name:         string;
  position:     string;
  age:          number;
  overall:      number;
  potential:    number;
  isPitcher:    boolean;
  salary:       number;
  contractYears: number;
  formerTeamId: number;
  formerTeamName: string;
  scoutGrade:   number;     // 20-80 display
  daysOnWaivers: number;    // 0-3 (claimed or cleared after 3)
}

export interface WaiverClaim {
  playerId:     number;
  playerName:   string;
  claimTeamId:  number;
  claimTeamName: string;
  formerTeamId: number;
  formerTeamName: string;
  position:     string;
  salary:       number;
}

export interface WaiverResult {
  claims:       WaiverClaim[];
  cleared:      number[];     // Player IDs that cleared waivers → free agent
  totalOnWaivers: number;
}

// ─── Identify waiverable players ────────────────────────────────────────────────

export function getWaiverPlayers(players: Player[], teams: Team[]): WaiverPlayer[] {
  const teamMap = new Map(teams.map(t => [t.teamId, t.name]));

  return players
    .filter(p => p.rosterData.rosterStatus === 'DFA' || p.rosterData.rosterStatus === 'WAIVERS')
    .map(p => ({
      playerId: p.playerId,
      name: p.name,
      position: p.position,
      age: p.age,
      overall: p.overall,
      potential: p.potential,
      isPitcher: p.isPitcher,
      salary: p.rosterData.salary,
      contractYears: p.rosterData.contractYearsRemaining,
      formerTeamId: p.teamId,
      formerTeamName: teamMap.get(p.teamId) ?? '???',
      scoutGrade: toScoutingScale(p.overall),
      daysOnWaivers: 0,
    }))
    .sort((a, b) => b.overall - a.overall);
}

// ─── Process waiver claims ──────────────────────────────────────────────────────

export function processWaivers(
  players: Player[],
  teams: Team[],
  userTeamId: number,
): WaiverResult {
  const claims: WaiverClaim[] = [];
  const cleared: number[] = [];
  const teamMap = new Map(teams.map(t => [t.teamId, t]));

  // Get DFA'd players
  const dfaPlayers = players.filter(p =>
    p.rosterData.rosterStatus === 'DFA' || p.rosterData.rosterStatus === 'WAIVERS'
  );

  if (dfaPlayers.length === 0) return { claims, cleared, totalOnWaivers: 0 };

  // AI teams in reverse standings order (worst team claims first)
  const aiTeams = teams
    .filter(t => t.teamId !== userTeamId)
    .sort((a, b) => a.seasonRecord.wins - b.seasonRecord.wins);

  for (const dfaPlayer of dfaPlayers) {
    let claimed = false;

    for (const team of aiTeams) {
      // Can't claim from your own team
      if (team.teamId === dfaPlayer.teamId) continue;

      // Check roster space
      const fortyManCount = players.filter(p =>
        p.teamId === team.teamId && p.rosterData.isOn40Man
      ).length;
      if (fortyManCount >= 40) continue;

      // AI evaluates: is this player worth claiming?
      const grade = toScoutingScale(dfaPlayer.overall);

      // Rebuilders claim young talent, contenders claim MLB-ready
      const isGoodFit = team.strategy === 'contender'
        ? grade >= 48 && dfaPlayer.age <= 32
        : team.strategy === 'rebuilder'
        ? dfaPlayer.age <= 27 && grade >= 42
        : grade >= 45;

      // Salary check: don't claim expensive busts
      const isAffordable = dfaPlayer.rosterData.salary <= team.budget * 0.05;

      if (isGoodFit && isAffordable) {
        // Execute claim
        const formerTeamId = dfaPlayer.teamId;
        dfaPlayer.teamId = team.teamId;
        dfaPlayer.rosterData.rosterStatus = 'MLB_ACTIVE';
        dfaPlayer.rosterData.isOn40Man = true;

        claims.push({
          playerId: dfaPlayer.playerId,
          playerName: dfaPlayer.name,
          claimTeamId: team.teamId,
          claimTeamName: team.name,
          formerTeamId,
          formerTeamName: teamMap.get(formerTeamId)?.name ?? '???',
          position: dfaPlayer.position,
          salary: dfaPlayer.rosterData.salary,
        });

        claimed = true;
        break; // Only one team can claim
      }
    }

    if (!claimed) {
      // Player clears waivers → becomes free agent
      dfaPlayer.rosterData.rosterStatus = 'FREE_AGENT';
      dfaPlayer.rosterData.isOn40Man = false;
      dfaPlayer.teamId = -1;
      cleared.push(dfaPlayer.playerId);
    }
  }

  return { claims, cleared, totalOnWaivers: dfaPlayers.length };
}

// ─── User claims a waiver player ────────────────────────────────────────────────

export function claimWaiverPlayer(
  player: Player,
  userTeamId: number,
  players: Player[],
): { ok: boolean; error?: string } {
  if (player.rosterData.rosterStatus !== 'DFA' && player.rosterData.rosterStatus !== 'WAIVERS') {
    return { ok: false, error: 'Player is not on waivers.' };
  }

  // Check 40-man space
  const fortyManCount = players.filter(p =>
    p.teamId === userTeamId && p.rosterData.isOn40Man
  ).length;
  if (fortyManCount >= 40) return { ok: false, error: '40-man roster full. DFA someone first.' };

  // Check 26-man space
  const activeCount = players.filter(p =>
    p.teamId === userTeamId && p.rosterData.rosterStatus === 'MLB_ACTIVE'
  ).length;
  if (activeCount >= 26) return { ok: false, error: 'Active roster full (26 max).' };

  player.teamId = userTeamId;
  player.rosterData.rosterStatus = 'MLB_ACTIVE';
  player.rosterData.isOn40Man = true;

  return { ok: true };
}
