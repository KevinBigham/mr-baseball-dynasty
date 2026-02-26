/**
 * WeeklyCard.tsx — "This Week in MRBD" Editorial Digest
 *
 * A rotating set of editorial storylines generated from the season's data.
 * Displayed post-sim as the league's unofficial weekly wrap-up.
 * Each "edition" covers: Top Story, Power Rankings shift, Prospect Pipeline,
 * Hot Seat Watch, and League Buzz.
 */

import { useState } from 'react';
import type { SeasonResult } from '../../types/league';
import type { StandingsRow } from '../../types/league';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyStory {
  column:  string;       // e.g. "TOP STORY", "POWER RANKINGS", "HOT SEAT"
  icon:    string;
  color:   string;
  headline: string;
  body:    string;
}

// ─── Story generators ─────────────────────────────────────────────────────────

function buildTopStory(_result: SeasonResult, userWins: number, isChampion: boolean, isPlayoff: boolean): WeeklyStory {
  if (isChampion) return {
    column: 'TOP STORY', icon: '🏆', color: '#fbbf24',
    headline: 'Champions. Full Stop.',
    body: `Your team closed out the World Series. The locker room celebration will live forever. The front office delivered on every promise made in the offseason.`,
  };
  if (isPlayoff) return {
    column: 'TOP STORY', icon: '🔥', color: '#f97316',
    headline: 'October Baseball Was Everything We Promised',
    body: `A ${userWins}-win regular season booked an October ticket. The front office built the right roster at the right time. The playoff run told its own story.`,
  };
  if (userWins >= 90) return {
    column: 'TOP STORY', icon: '📊', color: '#4ade80',
    headline: `${userWins} Wins and No Ring to Show For It`,
    body: `A dominant regular season. The schedule cooperated. The roster performed. And yet — no October baseball. The offseason questions will be sharp.`,
  };
  if (userWins >= 82) return {
    column: 'TOP STORY', icon: '📈', color: '#fbbf24',
    headline: 'A Winning Record in a Competitive Season',
    body: `${userWins} wins is nothing to dismiss. The franchise finished above .500 against a league that got better across the board. Progress, even without the glamour.`,
  };
  return {
    column: 'TOP STORY', icon: '🏗️', color: '#6b7280',
    headline: `${userWins} Wins — The Rebuild Demands Patience`,
    body: `The standings don't reflect the progress in the pipeline. The front office is playing a longer game than the record suggests. Eyes on the draft board.`,
  };
}

function buildPowerRankings(standings: StandingsRow[] | null, userTeamId: number): WeeklyStory {
  if (!standings || standings.length === 0) return {
    column: 'POWER RANKINGS', icon: '⚡', color: '#60a5fa',
    headline: 'Standings Take Shape Across Both Leagues',
    body: `The final standings revealed the true pecking order after 162 games of separation. Some contenders validated the preseason hype. Others did not.`,
  };

  const sorted    = [...standings].sort((a, b) => b.wins - a.wins);
  const userRow   = standings.find(s => s.teamId === userTeamId);
  const userRank  = sorted.findIndex(s => s.teamId === userTeamId) + 1;
  const top       = sorted[0];
  const bottom    = sorted[sorted.length - 1];

  const userLine = userRow
    ? `Your franchise finished #${userRank} leaguewide at ${userRow.wins}–${userRow.losses}.`
    : '';

  return {
    column: 'POWER RANKINGS', icon: '⚡', color: '#60a5fa',
    headline: `${top.abbreviation} on Top — ${bottom.abbreviation} at the Bottom`,
    body: `${top.name} led the league with ${top.wins} wins. ${bottom.name} finished ${bottom.wins}–${bottom.losses} in a lost campaign. ${userLine}`,
  };
}

function buildProspectPipeline(result: SeasonResult): WeeklyStory {
  const breakouts  = (result.developmentEvents ?? []).filter(e => e.type === 'breakout');
  const retirements = (result.developmentEvents ?? []).filter(e => e.type === 'retirement');

  if (breakouts.length >= 5) return {
    column: 'PROSPECT PIPELINE', icon: '🌱', color: '#4ade80',
    headline: `A Historic Breakout Cycle — ${breakouts.length} Emerge`,
    body: `The minor leagues delivered at an extraordinary rate this offseason. ${breakouts.length} players posted OVR jumps that turned heads across every front office.`,
  };
  if (breakouts.length >= 2) return {
    column: 'PROSPECT PIPELINE', icon: '🌱', color: '#4ade80',
    headline: `The Next Wave Is Arriving`,
    body: `${breakouts.length} significant development jumps leaguewide. The ${result.season + 1} roster pictures look very different after this offseason's work.`,
  };
  if (retirements.length >= 4) return {
    column: 'PROSPECT PIPELINE', icon: '🌱', color: '#a78bfa',
    headline: `The Veterans Are Clearing the Path`,
    body: `${retirements.length} retirements open roster spots for the next generation. Every ending is someone else's opportunity.`,
  };
  return {
    column: 'PROSPECT PIPELINE', icon: '🌱', color: '#6b7280',
    headline: 'A Quiet Development Cycle — Patient Clubs Ahead',
    body: `Minimal headline breakouts leaguewide this offseason. The teams investing in player development infrastructure now will separate themselves in 2–3 seasons.`,
  };
}

function buildHotSeatWatch(result: SeasonResult, userWins: number): WeeklyStory {
  // Look for teams with very low wins in standings
  const lowWinTeams = result.teamSeasons
    .filter((ts: { record: { wins: number } }) => ts.record.wins < 65)
    .length;

  if (userWins < 70) return {
    column: 'HOT SEAT WATCH', icon: '🔥', color: '#ef4444',
    headline: `Your Front Office Is Under the Microscope`,
    body: `A sub-70 win campaign invites uncomfortable questions about organizational direction. The owner's patience is a finite resource. The next offseason is critical.`,
  };
  if (lowWinTeams >= 5) return {
    column: 'HOT SEAT WATCH', icon: '🔥', color: '#ef4444',
    headline: `Leaguewide Accountability Season Is Here`,
    body: `${lowWinTeams} teams finished under 65 wins. Front office shuffles are coming. Managers are dusting off resumes. The offseason will feature significant turnover.`,
  };
  return {
    column: 'HOT SEAT WATCH', icon: '🔥', color: '#fb923c',
    headline: 'Front Office Stability Across the League',
    body: `A relatively stable season in the dugout. The franchises that underperformed expectations will make the quiet changes — no high-profile firings, but movement is coming.`,
  };
}

function buildLeagueBuzz(result: SeasonResult): WeeklyStory {
  const era = result.leagueERA;
  const rpg = result.leagueRPG;

  if (era <= 3.80) return {
    column: 'LEAGUE BUZZ', icon: '⚾', color: '#9ca3af',
    headline: `Pitchers Owned This Season — ERA at ${era.toFixed(2)}`,
    body: `Historically dominant pitching suppressed offense leaguewide. Batting averages suffered. Expected value models are already adjusting for next season's conditions.`,
  };
  if (era >= 4.40) return {
    column: 'LEAGUE BUZZ', icon: '🏏', color: '#9ca3af',
    headline: `Offenses Exploded — ${rpg.toFixed(1)} R/G Leaguewide`,
    body: `Hitters had a field day across both leagues. ERA ballooned, slugging percentages soared, and pitching staffs were pushed to their limits from game one.`,
  };
  if (result.teamWinsSD <= 8.5) return {
    column: 'LEAGUE BUZZ', icon: '⚖️', color: '#9ca3af',
    headline: `Historic Parity — Every Game Mattered`,
    body: `The tightest win distribution in recent memory. Competitive balance drove September drama across every division. The league office is quietly celebrating.`,
  };
  return {
    column: 'LEAGUE BUZZ', icon: '📰', color: '#9ca3af',
    headline: `A Season That Delivered in Every Sense`,
    body: `League ERA settled at ${era.toFixed(2)} with ${rpg.toFixed(1)} runs per game. Close to the historical baseline — a season where roster construction and execution decided everything.`,
  };
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function buildWeeklyCard(
  result:     SeasonResult,
  standings:  StandingsRow[] | null,
  userTeamId: number,
  userWins:   number,
  isChampion: boolean,
  isPlayoff:  boolean,
): WeeklyStory[] {
  return [
    buildTopStory(result, userWins, isChampion, isPlayoff),
    buildPowerRankings(standings, userTeamId),
    buildProspectPipeline(result),
    buildHotSeatWatch(result, userWins),
    buildLeagueBuzz(result),
  ];
}

export default function WeeklyCard({
  stories,
  season,
}: {
  stories: WeeklyStory[];
  season:  number;
}) {
  const [page, setPage] = useState(0);

  if (stories.length === 0) return null;

  const story = stories[page];

  return (
    <div className="bloomberg-border bg-gray-900">
      {/* Header */}
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>📰 THIS WEEK IN MRBD — {season} SEASON WRAP</span>
        <div className="flex items-center gap-1">
          {stories.map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className="w-2 h-2 rounded-full transition-colors"
              style={{ background: i === page ? '#f97316' : '#374151' }}
            />
          ))}
        </div>
      </div>

      {/* Active story */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-base">{story.icon}</span>
          <span
            className="text-xs font-bold tracking-widest uppercase"
            style={{ color: story.color }}
          >
            {story.column}
          </span>
        </div>
        <div className="text-gray-200 text-sm font-bold leading-snug mb-1.5">
          {story.headline}
        </div>
        <div className="text-gray-400 text-xs leading-relaxed">
          {story.body}
        </div>
      </div>

      {/* Navigation */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <button
          onClick={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          className="text-xs px-3 py-1 text-gray-700 hover:text-orange-500 disabled:text-gray-800 transition-colors"
        >
          ← PREV
        </button>
        <span className="text-gray-700 text-xs tabular-nums">
          {page + 1} / {stories.length}
        </span>
        <button
          onClick={() => setPage(p => Math.min(stories.length - 1, p + 1))}
          disabled={page === stories.length - 1}
          className="text-xs px-3 py-1 text-gray-700 hover:text-orange-500 disabled:text-gray-800 transition-colors"
        >
          NEXT →
        </button>
      </div>
    </div>
  );
}
