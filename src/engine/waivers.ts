import type { Player } from '../types/player';
import type { Team } from '../types/team';
import type { StandingsRow } from '../types/league';
import { computeTeamProfile } from './aiTeamIntelligence';
import { evaluatePlayer } from './trading';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WaiverClaim {
  playerId: number;
  playerName: string;
  position: string;
  overall: number;
  claimingTeamId: number;
  claimingTeamAbbr: string;
  previousTeamId: number;
  outcome: 'claimed' | 'outrighted' | 'released';
  reason: string;
}

// ─── Process DFA waivers ─────────────────────────────────────────────────────

/**
 * Resolve all DFA'd players through waivers.
 * Claims in inverse-standings order (worst record = first claim).
 * AI teams claim if the player fills a need and they have 40-man space.
 * Unclaimed players are outrighted to minors or released.
 */
export function processWaivers(
  players: Player[],
  teams: Team[],
  userTeamId: number,
  standings?: StandingsRow[],
): WaiverClaim[] {
  const dfaPlayers = players.filter(p => p.rosterData.rosterStatus === 'DFA');
  if (dfaPlayers.length === 0) return [];

  // Waiver order: inverse standings (worst team claims first)
  const teamOrder = standings
    ? [...standings].sort((a, b) => a.wins - b.wins).map(s => s.teamId)
    : teams.map(t => t.teamId);

  const claims: WaiverClaim[] = [];

  for (const player of dfaPlayers) {
    const previousTeamId = player.teamId;
    let claimed = false;

    for (const teamId of teamOrder) {
      if (teamId === previousTeamId) continue; // Can't claim your own DFA'd player
      if (teamId === userTeamId) continue; // User claims manually

      const team = teams.find(t => t.teamId === teamId);
      if (!team) continue;

      // Check 40-man space
      const fortyManCount = players.filter(
        p => p.teamId === teamId && p.rosterData.isOn40Man,
      ).length;
      if (fortyManCount >= 40) continue;

      // Does this team want the player?
      const profile = computeTeamProfile(team, players, standings);
      const posNeed = profile.positionalNeeds.find(n => n.position === player.position);
      const value = evaluatePlayer(player);

      // Minimum interest threshold
      let interest = value;
      if (posNeed) {
        if (posNeed.severity === 'critical') interest += 20;
        else if (posNeed.severity === 'moderate') interest += 10;
      }

      // Rebuilders don't claim expensive veterans
      if (profile.mode === 'rebuilder' && player.age >= 30 && player.rosterData.salary > 5_000_000) {
        interest -= 30;
      }

      if (interest < 20) continue;

      // Claim the player
      player.teamId = teamId;
      player.rosterData.rosterStatus = 'MLB_ACTIVE';
      player.rosterData.isOn40Man = true;

      claims.push({
        playerId: player.playerId,
        playerName: player.name,
        position: player.position,
        overall: player.overall,
        claimingTeamId: teamId,
        claimingTeamAbbr: team.abbreviation,
        previousTeamId,
        outcome: 'claimed',
        reason: posNeed ? `Fills ${posNeed.severity} need at ${player.position}` : 'Depth claim',
      });

      claimed = true;
      break;
    }

    if (!claimed) {
      // Unclaimed: outright to minors if possible, otherwise release
      const originalTeam = teams.find(t => t.teamId === previousTeamId);
      if (player.overall >= 200 && player.rosterData.serviceTimeDays < 172 * 5) {
        // Outright to minors (stays with original team)
        player.rosterData.rosterStatus = 'MINORS_AAA';
        player.rosterData.isOn40Man = false;
        claims.push({
          playerId: player.playerId,
          playerName: player.name,
          position: player.position,
          overall: player.overall,
          claimingTeamId: previousTeamId,
          claimingTeamAbbr: originalTeam?.abbreviation ?? '???',
          previousTeamId,
          outcome: 'outrighted',
          reason: 'Cleared waivers — outrighted to minors',
        });
      } else {
        // Release
        player.rosterData.rosterStatus = 'FREE_AGENT';
        player.rosterData.isOn40Man = false;
        player.teamId = -1;
        claims.push({
          playerId: player.playerId,
          playerName: player.name,
          position: player.position,
          overall: player.overall,
          claimingTeamId: -1,
          claimingTeamAbbr: '',
          previousTeamId,
          outcome: 'released',
          reason: 'Cleared waivers — released',
        });
      }
    }
  }

  return claims;
}
