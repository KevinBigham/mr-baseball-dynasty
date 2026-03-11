/**
 * newsFeed.ts — League news story generation for the Front Office Command Loop.
 *
 * Converts raw engine events (injuries, transactions, awards, etc.) into
 * structured NewsStory objects for display in the Front Office Briefing and
 * End-of-Day Digest.
 *
 * All story generators use only real data — no faked precision.
 * If a field is unavailable, the story degrades gracefully.
 */

import type { InjuryEvent } from '../injuries';
import type { PlayoffSeries } from './playoffs';
import type { AwardWinner } from './awards';
import type { ClubhouseEvent } from '../../types/chemistry';

// ─── Types ────────────────────────────────────────────────────────────────────

export type NewsPriority = 'breaking' | 'major' | 'minor' | 'routine';

export type NewsCategory =
  | 'injury'
  | 'transaction'
  | 'trade'
  | 'signing'
  | 'award'
  | 'development'
  | 'standings'
  | 'playoff'
  | 'draft'
  | 'clubhouse'
  | 'ownership';

export interface NewsStory {
  id: string;
  season: number;
  gameDay: number;     // 0 = offseason, 1-162 = regular season, 163+ = postseason
  category: NewsCategory;
  priority: NewsPriority;
  headline: string;
  body: string;
  teamIds: number[];   // referenced teams
  playerIds: number[]; // referenced players
}

// ─── News ID counter ──────────────────────────────────────────────────────────

let _newsIdSeq = 1;

function nextId(): string {
  return `news_${_newsIdSeq++}`;
}

export function resetNewsIdCounter(): void {
  _newsIdSeq = 1;
}

// ─── Injury story generators ──────────────────────────────────────────────────

/**
 * Generate a single NewsStory from an InjuryEvent.
 */
export function generateInjuryStory(
  event: InjuryEvent,
  teamName: string,
  season: number,
  gameDay: number,
): NewsStory {
  const priority: NewsPriority =
    event.injury.severity === 'severe'
      ? 'breaking'
      : event.injury.severity === 'moderate'
        ? 'major'
        : 'minor';

  const ilType = event.injury.ilDays >= 60 ? '60-day IL' : '10-day IL';

  return {
    id: nextId(),
    season,
    gameDay,
    category: 'injury',
    priority,
    headline: `${event.playerName} Placed on ${ilType}`,
    body: `${teamName} placed ${event.playerName} on the ${ilType} with ${event.injury.type.toLowerCase()}. Expected to miss approximately ${event.injury.ilDays} days.`,
    teamIds: [event.teamId],
    playerIds: [event.playerId],
  };
}

/**
 * Convert an array of InjuryEvents into NewsStory objects.
 * Deduplicates by player — only the first injury per player is represented so
 * the feed doesn't flood with repeats for the same player.
 */
export function generateInjuryNewsItems(
  events: InjuryEvent[],
  teamNames: Map<number, string>,
  season: number,
): NewsStory[] {
  const seen = new Set<number>();
  const stories: NewsStory[] = [];

  for (const evt of events) {
    if (seen.has(evt.playerId)) continue;
    seen.add(evt.playerId);

    const teamName = teamNames.get(evt.teamId) ?? `Team #${evt.teamId}`;
    stories.push(generateInjuryStory(evt, teamName, season, evt.injury.gameInjured ?? 0));
  }

  return stories;
}

// ─── Trade story generator ────────────────────────────────────────────────────

export function generateTradeStory(
  season: number,
  gameDay: number,
  fromTeamName: string,
  toTeamName: string,
  playersOffered: string[],
  playersReceived: string[],
  playerIds: number[],
  teamIds: number[],
): NewsStory {
  const offeredStr = playersOffered.length > 0 ? playersOffered.join(', ') : 'draft considerations';
  const receivedStr = playersReceived.length > 0 ? playersReceived.join(', ') : 'draft considerations';
  return {
    id: nextId(),
    season,
    gameDay,
    category: 'trade',
    priority: 'major',
    headline: `${fromTeamName} and ${toTeamName} Complete Trade`,
    body: `${fromTeamName} acquired ${receivedStr} from ${toTeamName} in exchange for ${offeredStr}.`,
    teamIds,
    playerIds,
  };
}

// ─── Playoff story generator ──────────────────────────────────────────────────

export function generatePlayoffStory(
  season: number,
  series: PlayoffSeries,
  round: string,
  winnerName: string,
  loserName: string,
): NewsStory {
  const wins = Math.max(series.higherSeedWins, series.lowerSeedWins);
  const losses = Math.min(series.higherSeedWins, series.lowerSeedWins);

  const roundLabel =
    round === 'WS' ? 'World Series'
    : round === 'CS' ? 'Championship Series'
    : round === 'DS' ? 'Division Series'
    : 'Wild Card Round';

  const isChampionship = round === 'WS';

  return {
    id: nextId(),
    season,
    gameDay: 163, // postseason = after game 162
    category: 'playoff',
    priority: isChampionship ? 'breaking' : 'major',
    headline: isChampionship
      ? `${winnerName} Win the World Series`
      : `${winnerName} Advance in ${roundLabel}`,
    body: `${winnerName} defeated ${loserName} in the ${roundLabel}, ${wins}–${losses}.`,
    teamIds: [series.winnerTeamId, series.loserTeamId],
    playerIds: [],
  };
}

// ─── Award story generator ────────────────────────────────────────────────────

export function generateAwardStory(
  season: number,
  award: AwardWinner,
  teamName: string,
): NewsStory {
  return {
    id: nextId(),
    season,
    gameDay: 0,
    category: 'award',
    priority: 'major',
    headline: `${award.playerName} Wins ${award.awardName}`,
    body: `${award.playerName} of the ${teamName} has been named the ${season} ${award.awardName} winner.`,
    teamIds: [award.teamId],
    playerIds: [award.playerId],
  };
}

// ─── Retirement story generator ───────────────────────────────────────────────

export function generateRetirementStory(
  season: number,
  playerName: string,
  position: string,
  teamName: string,
  careerYears: number,
  playerId: number,
  teamId: number,
): NewsStory {
  return {
    id: nextId(),
    season,
    gameDay: 0,
    category: 'development',
    priority: 'major',
    headline: `${playerName} Announces Retirement`,
    body: `${playerName} (${position}) has announced his retirement after ${careerYears} year${careerYears !== 1 ? 's' : ''} in the league. He spent his final season with the ${teamName}.`,
    teamIds: [teamId],
    playerIds: [playerId],
  };
}

// ─── Signing story generator ──────────────────────────────────────────────────

export function generateSigningStory(
  season: number,
  playerName: string,
  teamName: string,
  years: number,
  annualSalary: number,
  playerId: number,
  teamId: number,
): NewsStory {
  const salaryStr =
    annualSalary >= 1_000_000
      ? `$${(annualSalary / 1_000_000).toFixed(1)}M`
      : `$${(annualSalary / 1_000).toFixed(0)}K`;

  return {
    id: nextId(),
    season,
    gameDay: 0,
    category: 'signing',
    priority: annualSalary >= 10_000_000 ? 'major' : 'minor',
    headline: `${teamName} Signs ${playerName}`,
    body: `${teamName} has signed ${playerName} to a ${years}-year deal worth ${salaryStr}/year.`,
    teamIds: [teamId],
    playerIds: [playerId],
  };
}

// ─── Clubhouse story generator ────────────────────────────────────────────────

export function generateClubhouseStory(
  season: number,
  teamName: string,
  event: ClubhouseEvent,
): NewsStory {
  return {
    id: `clubhouse-${season}-${event.eventId}`,
    season,
    gameDay: 0,
    category: 'clubhouse',
    priority: 'routine',
    headline: `${teamName}: Clubhouse Update`,
    body: event.description,
    teamIds: [event.teamId],
    playerIds: [],
  };
}

// ─── Owner mandate story generator ───────────────────────────────────────────

export function generateOwnerMandateStory(
  season: number,
  ownerName: string,
  teamName: string,
  score: number,
  jobSecurity: string,
  summary: string,
  teamId: number,
): NewsStory {
  const securityLabel =
    jobSecurity === 'hot' ? 'under pressure'
    : jobSecurity === 'warm' ? 'cautiously optimistic'
    : 'in good standing';

  return {
    id: nextId(),
    season,
    gameDay: 0,
    category: 'ownership',
    priority: jobSecurity === 'hot' ? 'major' : 'routine',
    headline: `${teamName} Owner Sets ${season} Expectations`,
    body: `${ownerName} enters ${season} ${securityLabel} (approval: ${score}/100). ${summary}`,
    teamIds: [teamId],
    playerIds: [],
  };
}

// ─── Draft story generator ────────────────────────────────────────────────────

export function generateDraftStory(
  season: number,
  pickNumber: number,
  playerName: string,
  position: string,
  teamName: string,
  prospectType: string,
  playerId: number,
  teamId: number,
): NewsStory {
  const priority: NewsPriority =
    pickNumber <= 5 ? 'breaking' : pickNumber <= 20 ? 'major' : 'minor';

  return {
    id: nextId(),
    season,
    gameDay: 0,
    category: 'draft',
    priority,
    headline: `${teamName} Selects ${playerName} at Pick #${pickNumber}`,
    body: `With pick #${pickNumber}, ${teamName} selected ${playerName} (${position}), a ${prospectType.toLowerCase()} prospect.`,
    teamIds: [teamId],
    playerIds: [playerId],
  };
}

// ─── Transaction pulse story generator ───────────────────────────────────────

export function generateTransactionPulseStory(
  season: number,
  gameDay: number,
  teamName: string,
  transactionType: string,
  description: string,
  playerName: string | null,
  playerIds: number[],
  teamId: number,
): NewsStory {
  const typeLabel = transactionType.replace(/_/g, ' ');
  const headline = playerName
    ? `${teamName}: ${typeLabel} — ${playerName}`
    : `${teamName}: ${typeLabel}`;

  return {
    id: nextId(),
    season,
    gameDay,
    category: 'transaction',
    priority: 'minor',
    headline,
    body: description,
    teamIds: [teamId],
    playerIds,
  };
}

// ─── Feed utilities ───────────────────────────────────────────────────────────

const PRIORITY_WEIGHT: Record<NewsPriority, number> = {
  breaking: 100,
  major: 50,
  minor: 20,
  routine: 5,
};

/**
 * Sort stories by recency (most recent game day first), then by priority.
 */
export function sortNewsFeed(stories: NewsStory[]): NewsStory[] {
  return [...stories].sort((a, b) => {
    if (b.gameDay !== a.gameDay) return b.gameDay - a.gameDay;
    return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
  });
}

/**
 * Filter stories that involve a specific team.
 */
export function filterByTeam(stories: NewsStory[], teamId: number): NewsStory[] {
  return stories.filter(s => s.teamIds.includes(teamId));
}

/**
 * Return the top N stories after sorting by recency + priority.
 */
export function getTopStories(stories: NewsStory[], limit = 10): NewsStory[] {
  return sortNewsFeed(stories).slice(0, limit);
}
