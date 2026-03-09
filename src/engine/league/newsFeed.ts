/**
 * News feed generation.
 * Stub — Sprint 04 branch surgery.
 */

import type { PlayoffSeries } from './playoffs';
import type { AwardWinner } from './awards';
import type { ClubhouseEvent } from '../../types/chemistry';

export interface NewsStory {
  id: string;
  season: number;
  headline: string;
  body: string;
  category: string;
  playerIds: number[];
  teamIds: number[];
  timestamp: number;
}

export function sortNewsFeed(stories: NewsStory[]): NewsStory[] {
  return [...stories].sort((a, b) => b.timestamp - a.timestamp);
}

export function generatePlayoffStory(
  season: number,
  _series: PlayoffSeries,
  round: string,
  winnerName: string,
  _loserName: string,
): NewsStory {
  return {
    id: `playoff-${season}-${round}`,
    season,
    headline: `${winnerName} advances in ${round}`,
    body: '',
    category: 'playoffs',
    playerIds: [],
    teamIds: [],
    timestamp: Date.now(),
  };
}

export function generateAwardStory(season: number, award: AwardWinner, _teamName: string): NewsStory {
  return {
    id: `award-${season}-${award.awardName}`,
    season,
    headline: `${award.playerName} wins ${award.awardName}`,
    body: '',
    category: 'awards',
    playerIds: [award.playerId],
    teamIds: [award.teamId],
    timestamp: Date.now(),
  };
}

export function generateRetirementStory(
  season: number, name: string, _pos: string, _team: string,
  _years: number, playerId: number, teamId: number,
): NewsStory {
  return {
    id: `retire-${season}-${playerId}`,
    season,
    headline: `${name} retires`,
    body: '',
    category: 'retirement',
    playerIds: [playerId],
    teamIds: [teamId],
    timestamp: Date.now(),
  };
}

export function generateSigningStory(
  season: number, name: string, _team: string,
  _years: number, _salary: number, playerId: number, teamId: number,
): NewsStory {
  return {
    id: `signing-${season}-${playerId}`,
    season,
    headline: `${name} signs`,
    body: '',
    category: 'signing',
    playerIds: [playerId],
    teamIds: [teamId],
    timestamp: Date.now(),
  };
}

export function generateClubhouseStory(
  season: number, _teamName: string, event: ClubhouseEvent,
): NewsStory {
  return {
    id: `clubhouse-${season}-${event.eventId}`,
    season,
    headline: event.description,
    body: '',
    category: 'clubhouse',
    playerIds: [],
    teamIds: [event.teamId],
    timestamp: Date.now(),
  };
}

export function generateOwnerMandateStory(
  season: number, ownerName: string, _teamName: string,
  _score: number, _security: string, _summary: string, teamId: number,
): NewsStory {
  return {
    id: `owner-${season}-${teamId}`,
    season,
    headline: `${ownerName} sets new mandate`,
    body: '',
    category: 'owner',
    playerIds: [],
    teamIds: [teamId],
    timestamp: Date.now(),
  };
}

export function generateDraftStory(
  season: number, _pick: number, name: string, _pos: string,
  _team: string, _type: string, playerId: number, teamId: number,
): NewsStory {
  return {
    id: `draft-${season}-${playerId}`,
    season,
    headline: `${name} drafted`,
    body: '',
    category: 'draft',
    playerIds: [playerId],
    teamIds: [teamId],
    timestamp: Date.now(),
  };
}

export function generateTransactionPulseStory(
  season: number, _gameDay: number, _teamName: string,
  _type: string, _desc: string, _playerName: string | null,
  playerIds: number[], teamId: number,
): NewsStory {
  return {
    id: `tx-${season}-${Date.now()}`,
    season,
    headline: 'Transaction update',
    body: '',
    category: 'transaction',
    playerIds,
    teamIds: [teamId],
    timestamp: Date.now(),
  };
}

export function generateTradeStory(
  season: number, _gameDay: number, _fromTeam: string, _toTeam: string,
  _offeredNames: string[], _requestedNames: string[],
  playerIds: number[], teamIds: number[],
): NewsStory {
  return {
    id: `trade-${season}-${Date.now()}`,
    season,
    headline: 'Trade completed',
    body: '',
    category: 'trade',
    playerIds,
    teamIds,
    timestamp: Date.now(),
  };
}
