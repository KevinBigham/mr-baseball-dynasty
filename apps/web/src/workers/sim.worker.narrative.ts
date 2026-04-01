import type {
  AwardHistoryEntry,
  BriefingItem,
  Rivalry,
  SeasonHistoryEntry,
} from '@mbd/contracts';
import {
  calculateTeamPayroll,
  getTeamBudget,
} from '../../../../packages/sim-core/src/finance/contracts';
import { calculateAwardRaces, finalizeAwardResults } from '../../../../packages/sim-core/src/league/awards';
import {
  applyMoraleEvent,
  buildFrontOfficeBriefing,
  calculateTeamChemistry,
  createInitialPlayerMorale,
  createOwnerState,
  evaluateOwnerState,
  getPersonalityArchetype,
} from '../../../../packages/sim-core/src/league/narrativeState';
import { deriveRivalriesFromStandings } from '../../../../packages/sim-core/src/league/rivalries';
import { TEAMS } from '../../../../packages/sim-core/src/league/teams';
import { getUnreadNews } from '../../../../packages/sim-core/src/narrative/newsFeed';
import { detectProspectBreakouts } from '../../../../packages/sim-core/src/player/breakouts';
import type { FullGameState } from './sim.worker.helpers';
import { getTeamPlayers, timestamp } from './sim.worker.helpers';

export interface PersonalityProfileDTO {
  playerId: string;
  archetype: string;
  morale: ReturnType<typeof createInitialPlayerMorale>;
  personality: {
    workEthic: number;
    mentalToughness: number;
    leadership: number;
    competitiveness: number;
  };
  summary: string;
}

function dedupeBriefing(items: BriefingItem[]): BriefingItem[] {
  const seen = new Set<string>();
  const deduped: BriefingItem[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }
  return deduped.sort((a, b) => a.priority - b.priority);
}

function setStoryFlag(state: FullGameState, key: string, flag: string) {
  const existing = state.storyFlags.get(key) ?? [];
  if (!existing.includes(flag)) {
    state.storyFlags.set(key, [...existing, flag]);
  }
}

function rebuildBriefing(state: FullGameState) {
  const ownerState = state.ownerState.get(state.userTeamId);
  const chemistry = state.teamChemistry.get(state.userTeamId);
  if (!ownerState || !chemistry) return;

  const persistentItems = state.briefingQueue.filter(
    (item) => item.category === 'breakout' || item.category === 'award',
  );

  state.briefingQueue = dedupeBriefing([
    ...buildFrontOfficeBriefing({
      teamId: state.userTeamId,
      ownerState,
      chemistry,
      unreadNewsCount: getUnreadNews(state.news).length,
      rivalries: getRivalriesForTeam(state, state.userTeamId),
    }),
    ...persistentItems,
  ]);
}

export function ensureNarrativeState(state: FullGameState) {
  const activePlayerIds = new Set(state.players.map((player) => player.id));
  for (const playerId of Array.from(state.playerMorale.keys())) {
    if (!activePlayerIds.has(playerId)) {
      state.playerMorale.delete(playerId);
    }
  }

  for (const player of state.players) {
    if (!state.playerMorale.has(player.id)) {
      state.playerMorale.set(player.id, createInitialPlayerMorale(player, timestamp()));
    }
  }

  for (const team of TEAMS) {
    if (!state.teamChemistry.has(team.id)) {
      state.teamChemistry.set(
        team.id,
        calculateTeamChemistry(team.id, state.players, state.playerMorale),
      );
    }

    if (!state.ownerState.has(team.id)) {
      state.ownerState.set(team.id, createOwnerState(team.id, getTeamBudget(team.id)));
    }
  }

  rebuildBriefing(state);
}

export function refreshNarrativeState(
  state: FullGameState,
  gameResults: Array<{ homeTeamId: string; awayTeamId: string; homeScore: number; awayScore: number }>,
) {
  ensureNarrativeState(state);

  for (const game of gameResults) {
    const winnerId = game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;
    const loserId = winnerId === game.homeTeamId ? game.awayTeamId : game.homeTeamId;

    for (const player of state.players) {
      if (player.rosterStatus !== 'MLB') continue;
      if (player.teamId !== winnerId && player.teamId !== loserId) continue;

      const current = state.playerMorale.get(player.id) ?? createInitialPlayerMorale(player, timestamp());
      state.playerMorale.set(
        player.id,
        applyMoraleEvent(player, current, {
          type: player.teamId === winnerId ? 'win' : 'loss',
          impact: player.teamId === winnerId ? 4 : -4,
          summary: player.teamId === winnerId
            ? `Clubhouse bump after beating ${loserId.toUpperCase()}.`
            : `Loss to ${winnerId.toUpperCase()} put pressure on the room.`,
          timestamp: timestamp(),
        }),
      );
    }
  }

  for (const team of TEAMS) {
    state.teamChemistry.set(
      team.id,
      calculateTeamChemistry(team.id, state.players, state.playerMorale),
    );

    const record = state.seasonState.standings.getRecord(team.id);
    const currentOwner = state.ownerState.get(team.id) ?? createOwnerState(team.id, getTeamBudget(team.id));
    const payroll = calculateTeamPayroll(team.id, getTeamPlayers(team.id)).totalPayroll;
    const chemistryScore = state.teamChemistry.get(team.id)?.score ?? 50;

    state.ownerState.set(
      team.id,
      evaluateOwnerState(currentOwner, {
        wins: record?.wins ?? 0,
        losses: record?.losses ?? 0,
        payroll,
        chemistryScore,
        recentDecisionScore: 0,
      }),
    );
  }

  state.rivalries = deriveRivalriesFromStandings(
    state.rivalries,
    state.seasonState.standings.getFullStandings(),
  );

  const userOwner = state.ownerState.get(state.userTeamId);
  const userChemistry = state.teamChemistry.get(state.userTeamId);
  if (userOwner?.hotSeat) setStoryFlag(state, state.userTeamId, 'owner_hot_seat');
  if ((userChemistry?.score ?? 100) < 45) setStoryFlag(state, state.userTeamId, 'clubhouse_tension');
  if (Array.from(getRivalriesForTeam(state, state.userTeamId).values()).some((rivalry) => rivalry.intensity >= 55)) {
    setStoryFlag(state, state.userTeamId, 'heated_rivalry');
  }

  rebuildBriefing(state);
}

export function ensureAwardHistoryForSeason(state: FullGameState) {
  if (state.awardHistory.some((entry) => entry.season === state.season)) return;
  const races = calculateAwardRaces(state.players, state.seasonState.playerSeasonStats);
  const winners = finalizeAwardResults(state.season, races, state.players);
  state.awardHistory.push(...winners);
  state.briefingQueue = dedupeBriefing([
    ...state.briefingQueue,
    ...winners.map((winner) => ({
      id: `award-${winner.season}-${winner.award}`,
      priority: 2 as const,
      category: 'award' as const,
      headline: `${winner.award} winner recorded.`,
      body: winner.summary,
      relatedTeamIds: [winner.teamId],
      relatedPlayerIds: [winner.playerId],
      timestamp: `S${winner.season}D${state.day}`,
      acknowledged: false,
    })),
  ]);
}

export function recordSeasonHistory(state: FullGameState) {
  if (state.seasonHistory.some((entry) => entry.season === state.season)) return;

  const awards = state.awardHistory.filter((entry) => entry.season === state.season);
  const summary = state.playoffBracket?.champion
    ? `${state.playoffBracket.champion.toUpperCase()} finished the story on top.`
    : 'Season closed without a recorded champion.';

  const entry: SeasonHistoryEntry = {
    season: state.season,
    championTeamId: state.playoffBracket?.champion ?? null,
    summary,
    awards,
    keyMoments: state.news.slice(0, 5).map((item) => item.headline),
  };

  state.seasonHistory.push(entry);
}

export function recordBreakoutNarratives(
  state: FullGameState,
  beforePlayers: typeof state.players,
  afterPlayers: typeof state.players,
) {
  const breakouts = detectProspectBreakouts(beforePlayers, afterPlayers, `S${state.season + 1}D1`);
  if (breakouts.length === 0) return;

  const breakoutBriefings: BriefingItem[] = [];
  for (const breakout of breakouts) {
    const player = afterPlayers.find((candidate) => candidate.id === breakout.playerId);
    if (!player) continue;
    const headline = `${player.firstName} ${player.lastName} is trending up.`;
    state.news.unshift({
      id: `breakout-${state.season + 1}-${player.id}`,
      headline,
      body: breakout.summary,
      priority: 2,
      category: 'performance',
      timestamp: breakout.timestamp,
      relatedPlayerIds: [player.id],
      relatedTeamIds: [player.teamId],
      read: false,
    });
    breakoutBriefings.push({
      id: `brief-breakout-${player.id}`,
      priority: 2,
      category: 'breakout',
      headline,
      body: breakout.summary,
      relatedTeamIds: [player.teamId],
      relatedPlayerIds: [player.id],
      timestamp: breakout.timestamp,
      acknowledged: false,
    });
    setStoryFlag(state, player.teamId, 'prospect_breakout');
  }

  state.briefingQueue = dedupeBriefing([...breakoutBriefings, ...state.briefingQueue]);
}

export function getPersonalityProfileForPlayer(
  state: FullGameState,
  playerId: string,
): PersonalityProfileDTO | null {
  const player = state.players.find((candidate) => candidate.id === playerId);
  if (!player) return null;

  const morale = state.playerMorale.get(player.id) ?? createInitialPlayerMorale(player, timestamp());
  return {
    playerId: player.id,
    archetype: getPersonalityArchetype(player),
    morale,
    personality: player.personality,
    summary: `${player.firstName} ${player.lastName} profiles as a ${getPersonalityArchetype(player)} with ${morale.score} morale.`,
  };
}

export function getRivalriesForTeam(state: FullGameState, teamId: string): Map<string, Rivalry> {
  return new Map(
    Array.from(state.rivalries.entries()).filter(([, rivalry]) =>
      rivalry.teamA === teamId || rivalry.teamB === teamId,
    ),
  );
}

export function getAwardHistory(state: FullGameState): AwardHistoryEntry[] {
  return [...state.awardHistory].sort((a, b) => b.season - a.season);
}

export function getSeasonHistory(state: FullGameState): SeasonHistoryEntry[] {
  return [...state.seasonHistory].sort((a, b) => b.season - a.season);
}
