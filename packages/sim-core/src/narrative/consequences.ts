import type { BriefingItem } from '@mbd/contracts';
import { getTeamById } from '../league/teams.js';
import type { MoraleEvent } from '../league/narrativeState.js';
import type { GameRNG } from '../math/prng.js';
import { toDisplayRating } from '../player/attributes.js';
import type { GeneratedPlayer } from '../player/generation.js';
import type { PlayoffBracket } from '../sim/playoffSimulator.js';
import { generateNews, generateRetirementNews, generateSeasonRecap } from './newsFeed.js';
import type { NewsItem } from './newsFeed.js';

export interface OwnerDecisionDelta {
  delta: number;
  summary: string;
}

export interface PlayerMoraleDelta {
  playerId: string;
  event: MoraleEvent;
}

export interface ConsequenceBundle {
  newsItems: NewsItem[];
  briefingItems: BriefingItem[];
  playerMoraleEvents: PlayerMoraleDelta[];
  ownerDecisionDelta: OwnerDecisionDelta | null;
  storyFlags: string[];
  seasonHistoryMoments: string[];
}

export interface TradeConsequenceContext {
  rng: GameRNG;
  season: number;
  day: number;
  userTeamId: string;
  partnerTeamId: string;
  acquiredPlayers: GeneratedPlayer[];
  tradedAwayPlayers: GeneratedPlayer[];
  remainingUserPlayers: GeneratedPlayer[];
  userFairness: number;
  payrollAfterTrade: number;
  payrollTarget: number;
}

export interface SigningConsequenceContext {
  rng: GameRNG;
  season: number;
  day: number;
  userTeamId: string;
  player: GeneratedPlayer;
  annualSalary: number;
  years: number;
  marketValue: number;
  payrollAfterSigning: number;
  payrollTarget: number;
  remainingUserPlayers: GeneratedPlayer[];
}

export type UserPostseasonOutcome =
  | 'champion'
  | 'world_series_loss'
  | 'championship_series_loss'
  | 'division_series_loss'
  | 'wild_card_loss'
  | 'missed_playoffs';

export interface PostseasonConsequenceContext {
  rng: GameRNG;
  season: number;
  userTeamId: string;
  playoffBracket: PlayoffBracket;
  standings: Array<{ teamId: string; wins: number; losses: number }>;
  userPlayers: GeneratedPlayer[];
  userOutcome: UserPostseasonOutcome;
}

export interface RetirementConsequenceContext {
  rng: GameRNG;
  season: number;
  day: number;
  userTeamId: string;
  retiredPlayers: GeneratedPlayer[];
  remainingUserPlayers: GeneratedPlayer[];
}

function teamLabel(teamId: string): string {
  const team = getTeamById(teamId);
  return team ? `${team.city} ${team.name}` : teamId.toUpperCase();
}

function makeTimestamp(season: number, day: number): string {
  return `S${season}D${day}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildBriefingFromNews(
  newsItem: NewsItem,
  timestamp: string,
  priority: number = newsItem.priority,
): BriefingItem {
  return {
    id: `brief-${newsItem.id}`,
    priority: priority as 1 | 2 | 3 | 4 | 5,
    category: 'news',
    headline: newsItem.headline,
    body: newsItem.body,
    relatedTeamIds: newsItem.relatedTeamIds,
    relatedPlayerIds: newsItem.relatedPlayerIds,
    timestamp,
    acknowledged: false,
  };
}

function buildMoraleDelta(
  playerId: string,
  type: MoraleEvent['type'],
  impact: number,
  summary: string,
  timestamp: string,
): PlayerMoraleDelta {
  return {
    playerId,
    event: {
      type,
      impact,
      summary,
      timestamp,
    },
  };
}

function postseasonSummary(
  outcome: UserPostseasonOutcome,
  championTeamId: string | null,
): { text: string; moraleImpact: number; ownerDelta: number; storyFlags: string[] } {
  switch (outcome) {
    case 'champion':
      return {
        text: `${teamLabel(championTeamId ?? '')} finished the story on top.`,
        moraleImpact: 8,
        ownerDelta: 15,
        storyFlags: ['championship_window'],
      };
    case 'world_series_loss':
      return {
        text: 'The club fell in the final round but still pushed the window open.',
        moraleImpact: 5,
        ownerDelta: 9,
        storyFlags: ['deep_october_run'],
      };
    case 'championship_series_loss':
      return {
        text: 'A deep October push ended short of the final series.',
        moraleImpact: 3,
        ownerDelta: 6,
        storyFlags: ['deep_october_run'],
      };
    case 'division_series_loss':
    case 'wild_card_loss':
      return {
        text: 'The playoff exit landed early and left unfinished business.',
        moraleImpact: -4,
        ownerDelta: 3,
        storyFlags: ['postseason_sting'],
      };
    default:
      return {
        text: 'October arrived without this club in the bracket.',
        moraleImpact: 0,
        ownerDelta: 0,
        storyFlags: [],
      };
  }
}

export function buildTradeConsequenceBundle(
  context: TradeConsequenceContext,
): ConsequenceBundle {
  const timestamp = makeTimestamp(context.season, context.day);
  const primaryIncoming = context.acquiredPlayers[0] ?? context.tradedAwayPlayers[0];
  const primaryOutgoing = context.tradedAwayPlayers[0] ?? context.acquiredPlayers[0];
  const newsItems = generateNews(
    context.rng.fork(),
    {
      type: 'trade',
      season: context.season,
      day: context.day,
      data: {
        player1Id: primaryIncoming?.id,
        player2Id: primaryOutgoing?.id,
        team1Id: context.userTeamId,
        team2Id: context.partnerTeamId,
        team1Name: teamLabel(context.userTeamId),
        team2Name: teamLabel(context.partnerTeamId),
      },
    },
    [...context.acquiredPlayers, ...context.tradedAwayPlayers],
    context.season,
    context.day,
  );

  const clubhouseImpact =
    context.userFairness >= 20 ? 4 :
    context.userFairness <= -20 ? -4 :
    0;
  const playerMoraleEvents = [
    ...context.acquiredPlayers.map((player) =>
      buildMoraleDelta(
        player.id,
        'trade',
        6,
        `${player.firstName} ${player.lastName} arrives with a fresh opportunity.`,
        timestamp,
      ),
    ),
    ...context.tradedAwayPlayers.map((player) =>
      buildMoraleDelta(
        player.id,
        'trade',
        -10,
        `${player.firstName} ${player.lastName} was moved out in the trade.`,
        timestamp,
      ),
    ),
    ...(
      clubhouseImpact === 0
        ? []
        : context.remainingUserPlayers.map((player) =>
            buildMoraleDelta(
              player.id,
              'trade',
              clubhouseImpact,
              clubhouseImpact > 0
                ? 'The room sees this trade as a push in the right direction.'
                : 'The room is uneasy about what this trade cost.',
              timestamp,
            ),
          )
    ),
  ];

  const payrollPenalty = Math.floor(Math.max(0, context.payrollAfterTrade - context.payrollTarget) / 15);
  const ownerDelta = clamp(Math.round(context.userFairness / 10) - payrollPenalty, -12, 12);

  return {
    newsItems,
    briefingItems: newsItems.map((item) => buildBriefingFromNews(item, timestamp, 2)),
    playerMoraleEvents,
    ownerDecisionDelta: {
      delta: ownerDelta,
      summary: ownerDelta >= 0
        ? 'Ownership views the trade as a credible swing at improvement.'
        : 'Ownership sees the trade as a risky use of payroll and assets.',
    },
    storyFlags: ownerDelta >= 4 ? ['trade_spark'] : ownerDelta <= -4 ? ['trade_backlash'] : [],
    seasonHistoryMoments: [],
  };
}

export function buildSigningConsequenceBundle(
  context: SigningConsequenceContext,
): ConsequenceBundle {
  const timestamp = makeTimestamp(context.season, context.day);
  const newsItems = generateNews(
    context.rng.fork(),
    {
      type: 'signing',
      season: context.season,
      day: context.day,
      data: {
        playerId: context.player.id,
        teamId: context.userTeamId,
        teamName: teamLabel(context.userTeamId),
        years: context.years,
      },
    },
    [context.player],
    context.season,
    context.day,
  );

  const teammateImpact = context.annualSalary <= context.marketValue ? 3 : 1;
  const withinTarget = context.payrollAfterSigning <= context.payrollTarget;
  const atOrBelowMarket = context.annualSalary <= context.marketValue;
  const ownerDelta =
    withinTarget && atOrBelowMarket ? 8 :
    withinTarget || atOrBelowMarket ? 4 :
    -6;

  return {
    newsItems,
    briefingItems: newsItems.map((item) => buildBriefingFromNews(item, timestamp, 2)),
    playerMoraleEvents: [
      buildMoraleDelta(
        context.player.id,
        'promotion',
        10,
        `${context.player.firstName} ${context.player.lastName} secured the deal and a clear role.`,
        timestamp,
      ),
      ...context.remainingUserPlayers.map((player) =>
        buildMoraleDelta(
          player.id,
          'promotion',
          teammateImpact,
          'The clubhouse sees the front office adding real talent.',
          timestamp,
        ),
      ),
    ],
    ownerDecisionDelta: {
      delta: ownerDelta,
      summary: ownerDelta >= 0
        ? 'Ownership approved the signing and the payroll fit.'
        : 'Ownership is uneasy about the signing cost relative to the payroll plan.',
    },
    storyFlags: ownerDelta >= 8 ? ['winter_statement'] : ownerDelta < 0 ? ['winter_overreach'] : [],
    seasonHistoryMoments: [`Signed ${context.player.firstName} ${context.player.lastName} to a ${context.years}-year contract.`],
  };
}

export function buildPostseasonConsequenceBundle(
  context: PostseasonConsequenceContext,
): ConsequenceBundle {
  const summary = postseasonSummary(context.userOutcome, context.playoffBracket.champion);
  const championshipNews = context.playoffBracket.champion
    ? generateNews(
        context.rng.fork(),
        {
          type: 'season_end',
          season: context.season,
          day: 162,
          data: {
            championId: context.playoffBracket.champion,
            championName: teamLabel(context.playoffBracket.champion),
            season: context.season,
          },
        },
        [],
        context.season,
        162,
      )
    : [];
  const recapNews = generateSeasonRecap(
    context.rng.fork(),
    context.standings,
    context.playoffBracket.champion,
    context.season,
  );
  const newsItems = [...championshipNews, ...recapNews];

  return {
    newsItems,
    briefingItems: context.userOutcome === 'missed_playoffs'
      ? []
      : [{
          id: `brief-postseason-${context.season}`,
          priority: 1,
          category: 'news',
          headline: `Season ${context.season} postseason summary`,
          body: summary.text,
          relatedTeamIds: [context.userTeamId],
          relatedPlayerIds: [],
          timestamp: `S${context.season}D162`,
          acknowledged: false,
        }],
    playerMoraleEvents: summary.moraleImpact === 0
      ? []
      : context.userPlayers.map((player) =>
          buildMoraleDelta(
            player.id,
            'award',
            summary.moraleImpact,
            summary.text,
            `S${context.season}D162`,
          ),
        ),
    ownerDecisionDelta: summary.ownerDelta === 0
      ? null
      : {
          delta: summary.ownerDelta,
          summary: summary.text,
        },
    storyFlags: summary.storyFlags,
    seasonHistoryMoments: [
      summary.text,
      ...newsItems.slice(0, 2).map((item) => item.headline),
    ].slice(0, 3),
  };
}

export function buildRetirementConsequenceBundle(
  context: RetirementConsequenceContext,
): ConsequenceBundle {
  const timestamp = makeTimestamp(context.season, context.day);
  const newsItems: NewsItem[] = [];
  const seasonHistoryMoments: string[] = [];
  let ownerDecisionDelta: OwnerDecisionDelta | null = null;
  let clubhouseLoss = false;

  for (const player of context.retiredPlayers) {
    const userRetiree = player.teamId === context.userTeamId;
    const notableLeagueRetiree = player.rosterStatus === 'MLB' && player.personality.leadership >= 70;
    if (!userRetiree && !notableLeagueRetiree) continue;

    const newsItem = generateRetirementNews(
      context.rng.fork(),
      player,
      context.season,
      context.day,
      teamLabel(player.teamId),
    );
    newsItems.push(newsItem);
    seasonHistoryMoments.push(newsItem.headline);

    if (userRetiree && player.rosterStatus === 'MLB' && player.personality.leadership >= 70) {
      clubhouseLoss = true;
    }

    if (userRetiree && player.rosterStatus === 'MLB' && toDisplayRating(player.overallRating) >= 60) {
      ownerDecisionDelta = {
        delta: -2,
        summary: `Ownership now expects the front office to replace the void left by ${player.firstName} ${player.lastName}.`,
      };
    }
  }

  return {
    newsItems,
    briefingItems: newsItems
      .filter((item) => item.relatedTeamIds.includes(context.userTeamId))
      .map((item) => buildBriefingFromNews(item, timestamp, 1)),
    playerMoraleEvents: clubhouseLoss
      ? context.remainingUserPlayers.map((player) =>
          buildMoraleDelta(
            player.id,
            'loss',
            -4,
            'A respected veteran left the room, and the clubhouse feels it.',
            timestamp,
          ),
        )
      : [],
    ownerDecisionDelta,
    storyFlags: clubhouseLoss ? ['clubhouse_transition'] : [],
    seasonHistoryMoments,
  };
}
