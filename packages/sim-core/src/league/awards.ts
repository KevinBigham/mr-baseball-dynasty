import type { AwardHistoryEntry } from '@mbd/contracts';
import type { GeneratedPlayer } from '../player/generation.js';
import type { PlayerGameStats } from '../sim/gameSimulator.js';

export interface AwardRaceEntry {
  playerId: string;
  teamId: string;
  score: number;
  summary: string;
}

export interface AwardRaces {
  mvp: AwardRaceEntry[];
  cyYoung: AwardRaceEntry[];
  roy: AwardRaceEntry[];
}

function hitterScore(stats: PlayerGameStats): number {
  return (
    stats.hr * 4 +
    stats.rbi * 1.2 +
    stats.hits * 0.6 +
    stats.runs * 0.8 +
    stats.bb * 0.35
  );
}

function pitcherScore(stats: PlayerGameStats): number {
  return (
    stats.strikeouts * 0.75 +
    (stats.ip / 3) * 1.2 -
    stats.earnedRuns * 2.5 -
    stats.walks * 0.4
  );
}

function topFive(entries: AwardRaceEntry[]): AwardRaceEntry[] {
  return [...entries].sort((a, b) => b.score - a.score).slice(0, 5);
}

export function calculateAwardRaces(
  players: GeneratedPlayer[],
  statsByPlayer: Map<string, PlayerGameStats>,
): AwardRaces {
  const mvp: AwardRaceEntry[] = [];
  const cyYoung: AwardRaceEntry[] = [];
  const roy: AwardRaceEntry[] = [];

  for (const player of players) {
    const stats = statsByPlayer.get(player.id);
    if (!stats) continue;

    const isPitcher = player.pitcherAttributes != null;
    const score = isPitcher ? pitcherScore(stats) : hitterScore(stats);

    if (isPitcher) {
      cyYoung.push({
        playerId: player.id,
        teamId: player.teamId,
        score,
        summary: `${player.firstName} ${player.lastName} is dominating the Cy Young race.`,
      });
    } else {
      mvp.push({
        playerId: player.id,
        teamId: player.teamId,
        score,
        summary: `${player.firstName} ${player.lastName} is carrying the offense.`,
      });
    }

    if (player.age <= 23 || player.developmentPhase === 'Prospect' || player.developmentPhase === 'Ascent') {
      roy.push({
        playerId: player.id,
        teamId: player.teamId,
        score,
        summary: `${player.firstName} ${player.lastName} is forcing his way into the rookie spotlight.`,
      });
    }
  }

  return {
    mvp: topFive(mvp),
    cyYoung: topFive(cyYoung),
    roy: topFive(roy.length > 0 ? roy : mvp),
  };
}

function createAwardEntry(
  season: number,
  award: string,
  winner: AwardRaceEntry | undefined,
  fallback: GeneratedPlayer | undefined,
): AwardHistoryEntry {
  const playerId = winner?.playerId ?? fallback?.id ?? 'unknown';
  const teamId = winner?.teamId ?? fallback?.teamId ?? 'unknown';
  const summary = winner?.summary ?? `No qualified ${award} pool existed; defaulted to best available player.`;

  return {
    season,
    award,
    playerId,
    teamId,
    summary,
  };
}

export function finalizeAwardResults(
  season: number,
  races: AwardRaces,
  players: GeneratedPlayer[],
): AwardHistoryEntry[] {
  const fallback = players[0];
  return [
    createAwardEntry(season, 'MVP', races.mvp[0], fallback),
    createAwardEntry(season, 'CY_YOUNG', races.cyYoung[0], fallback),
    createAwardEntry(season, 'ROY', races.roy[0], fallback),
  ];
}
