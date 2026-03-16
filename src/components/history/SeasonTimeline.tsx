/**
 * SeasonTimeline — A rich, scrollable timeline of everything that happened
 * during your franchise history. Aggregates news items, moments, trade history,
 * and season summaries into one immersive feed.
 */

import { useState } from 'react';
import { useLeagueStore, type SeasonSummary } from '../../store/leagueStore';
import type { NewsItem } from '../../engine/narrative';
import type { SeasonMoment } from '../../engine/moments';
import CoachTip from '../shared/CoachTip';

type TimelineEntry = {
  id: string;
  season: number;
  icon: string;
  headline: string;
  body: string;
  category:
    | 'award'
    | 'division'
    | 'development'
    | 'retirement'
    | 'trade'
    | 'moment'
    | 'summary'
    | 'league'
    | 'milestone'
    | 'rumor'
    | 'injury'
    | 'transaction'
    | 'signing'
    | 'standings'
    | 'playoff'
    | 'draft'
    | 'clubhouse'
    | 'ownership'
    | 'record';
  isUserTeam: boolean;
  priority: number;
};

function newsToEntry(n: NewsItem): TimelineEntry {
  return {
    id: n.id,
    season: n.season,
    icon: n.icon,
    headline: n.headline,
    body: n.body,
    category: n.type,
    isUserTeam: n.isUserTeam ?? false,
    priority: n.priority,
  };
}

function momentToEntry(m: SeasonMoment): TimelineEntry {
  return {
    id: m.id,
    season: m.season,
    icon: m.icon,
    headline: m.headline,
    body: m.detail,
    category: 'moment',
    isUserTeam: m.isUserTeam,
    priority: m.weight,
  };
}

function summaryToEntry(s: SeasonSummary): TimelineEntry {
  const result = s.playoffResult === 'Champion' ? '🏆 World Series Champions'
    : s.playoffResult ? `Postseason: ${s.playoffResult}` : 'Missed playoffs';
  return {
    id: `summary-${s.season}`,
    season: s.season,
    icon: s.playoffResult === 'Champion' ? '🏆' : s.wins >= 90 ? '🔥' : s.wins >= 81 ? '📈' : '📉',
    headline: `Season ${s.season} — ${s.wins}-${s.losses}`,
    body: `${result}. ${s.keyMoment}`,
    category: 'summary',
    isUserTeam: true,
    priority: 10,
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  award: '#fbbf24',
  division: '#22c55e',
  development: '#a855f7',
  retirement: '#6b7280',
  trade: '#3b82f6',
  moment: '#f97316',
  summary: '#ef4444',
  league: '#06b6d4',
  milestone: '#eab308',
  rumor: '#94a3b8',
  injury: '#ef4444',
  transaction: '#94a3b8',
  signing: '#3b82f6',
  standings: '#06b6d4',
  playoff: '#f97316',
  draft: '#a855f7',
  clubhouse: '#fb923c',
  ownership: '#eab308',
  record: '#14b8a6',
};

const CATEGORY_LABELS: Record<string, string> = {
  award: 'AWARD',
  division: 'DIVISION',
  development: 'DEVELOPMENT',
  retirement: 'RETIREMENT',
  trade: 'TRADE',
  moment: 'MOMENT',
  summary: 'SEASON',
  league: 'LEAGUE',
  milestone: 'MILESTONE',
  rumor: 'RUMOR',
  injury: 'INJURY',
  transaction: 'TRANSACTION',
  signing: 'SIGNING',
  standings: 'STANDINGS',
  playoff: 'PLAYOFF',
  draft: 'DRAFT',
  clubhouse: 'CLUBHOUSE',
  ownership: 'OWNERSHIP',
  record: 'RECORD',
};

type FilterMode = 'all' | 'my-team' | 'awards' | 'trades' | 'moments';

export default function SeasonTimeline() {
  const { newsItems, moments, franchiseHistory, tradeHistory } = useLeagueStore();
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());

  // Build unified timeline
  const entries: TimelineEntry[] = [
    ...newsItems.map(newsToEntry),
    ...moments.map(momentToEntry),
    ...franchiseHistory.map(summaryToEntry),
    ...tradeHistory.map((t, i) => ({
      id: `trade-${i}`,
      season: t.season,
      icon: '🔄',
      headline: `Trade with ${t.partnerTeamAbbr}`,
      body: `Sent: ${t.sent.join(', ')} — Received: ${t.received.join(', ')}`,
      category: 'trade' as const,
      isUserTeam: true,
      priority: 6,
    })),
  ];

  // Apply filter
  const filtered = entries.filter(e => {
    if (filter === 'my-team') return e.isUserTeam;
    if (filter === 'awards') return e.category === 'award';
    if (filter === 'trades') return e.category === 'trade';
    if (filter === 'moments') return e.category === 'moment' || e.category === 'summary';
    return true;
  });

  // Group by season, sort descending
  const seasons = [...new Set(filtered.map(e => e.season))].sort((a, b) => b - a);

  const toggleSeason = (s: number) => {
    setExpandedSeasons(prev => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s); else next.add(s);
      return next;
    });
  };

  if (entries.length === 0) {
    return (
      <div className="p-6">
        <CoachTip section="history" />
        <div className="bloomberg-border p-8 text-center">
          <div className="text-3xl mb-2">📜</div>
          <div className="text-gray-400 text-sm">Your story hasn't been written yet.</div>
          <div className="text-gray-500 text-xs mt-1">
            Simulate your first season to see your dynasty timeline unfold here.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 flex items-center justify-between">
        <span>DYNASTY TIMELINE</span>
        <span className="text-xs text-gray-500 font-normal">{filtered.length} events</span>
      </div>

      <CoachTip section="history" />

      {/* Filters */}
      <div className="flex gap-1 flex-wrap">
        {([
          ['all', 'ALL'],
          ['my-team', 'MY TEAM'],
          ['awards', 'AWARDS'],
          ['trades', 'TRADES'],
          ['moments', 'MOMENTS'],
        ] as [FilterMode, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              'text-xs px-3 py-1.5 border font-normal transition-colors min-h-[44px]',
              filter === key
                ? 'border-orange-500 text-orange-400 bg-orange-950/30'
                : 'border-gray-700 text-gray-500 hover:text-gray-300',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline by season */}
      {seasons.map(season => {
        const seasonEntries = filtered
          .filter(e => e.season === season)
          .sort((a, b) => b.priority - a.priority);

        const isExpanded = expandedSeasons.has(season) || seasons.length <= 2;
        const summary = franchiseHistory.find(s => s.season === season);
        const previewEntries = isExpanded ? seasonEntries : seasonEntries.slice(0, 3);

        return (
          <div key={season} className="bloomberg-border">
            <button
              onClick={() => toggleSeason(season)}
              className="bloomberg-header text-xs w-full flex items-center justify-between cursor-pointer hover:bg-gray-800/50 transition-colors"
            >
              <span>
                SEASON {season}
                {summary && (
                  <span className="ml-3 font-normal text-gray-400">
                    {summary.wins}-{summary.losses}
                    {summary.playoffResult === 'Champion' && ' 🏆'}
                    {summary.playoffResult && summary.playoffResult !== 'Champion' && ` · ${summary.playoffResult}`}
                  </span>
                )}
              </span>
              <span className="text-gray-500">
                {seasonEntries.length} events {!isExpanded && '▸'}
                {isExpanded && '▾'}
              </span>
            </button>

            <div className="divide-y divide-gray-800/50">
              {previewEntries.map(entry => (
                <div
                  key={entry.id}
                  className={[
                    'flex items-start gap-3 px-4 py-2.5 text-xs',
                    entry.isUserTeam ? 'bg-orange-950/10' : '',
                  ].join(' ')}
                >
                  <span className="text-lg flex-shrink-0 mt-0.5">{entry.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider"
                        style={{
                          color: CATEGORY_COLORS[entry.category] ?? '#94a3b8',
                          backgroundColor: `${CATEGORY_COLORS[entry.category] ?? '#94a3b8'}20`,
                        }}
                      >
                        {CATEGORY_LABELS[entry.category] ?? entry.category.toUpperCase()}
                      </span>
                      {entry.isUserTeam && (
                        <span className="text-[10px] text-orange-500 font-bold">YOUR TEAM</span>
                      )}
                    </div>
                    <div className="text-gray-200 font-bold">{entry.headline}</div>
                    <div className="text-gray-500 mt-0.5 leading-relaxed">{entry.body}</div>
                  </div>
                </div>
              ))}

              {!isExpanded && seasonEntries.length > 3 && (
                <button
                  onClick={() => toggleSeason(season)}
                  className="w-full px-4 py-2 text-xs text-orange-500 hover:text-orange-400 transition-colors text-center"
                >
                  Show {seasonEntries.length - 3} more events ▸
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
