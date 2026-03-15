/**
 * TransactionLog — Complete history of every roster move your franchise has made.
 * Aggregates trades, signings, releases, and extensions into a filterable feed.
 */

import { useState } from 'react';
import { useLeagueStore, type TradeHistoryRecord } from '../../store/leagueStore';
import type { NewsItem } from '../../engine/narrative';
import CoachTip from '../shared/CoachTip';

type TxnType = 'trade' | 'signing' | 'release' | 'extension' | 'draft' | 'other';

interface Transaction {
  id: string;
  season: number;
  type: TxnType;
  icon: string;
  title: string;
  detail: string;
  isUserTeam: boolean;
}

function classifyNewsItem(n: NewsItem): TxnType | null {
  const h = n.headline.toLowerCase();
  if (h.includes('trade') || h.includes('dealt') || h.includes('acquired')) return 'trade';
  if (h.includes('sign') || h.includes('free agent')) return 'signing';
  if (h.includes('release') || h.includes('designat') || h.includes('dfa') || h.includes('waiv')) return 'release';
  if (h.includes('extend') || h.includes('extension')) return 'extension';
  if (h.includes('draft') || h.includes('select')) return 'draft';
  return null;
}

const TYPE_CONFIG: Record<TxnType, { icon: string; color: string; label: string }> = {
  trade:     { icon: '🔄', color: '#3b82f6', label: 'TRADE' },
  signing:   { icon: '✍️', color: '#22c55e', label: 'SIGNING' },
  release:   { icon: '📤', color: '#ef4444', label: 'RELEASE' },
  extension: { icon: '📝', color: '#a855f7', label: 'EXTENSION' },
  draft:     { icon: '🎓', color: '#f97316', label: 'DRAFT' },
  other:     { icon: '📋', color: '#6b7280', label: 'MOVE' },
};

function tradeToTxn(t: TradeHistoryRecord, idx: number): Transaction {
  return {
    id: `trade-${idx}`,
    season: t.season,
    type: 'trade',
    icon: '🔄',
    title: `Trade with ${t.partnerTeamAbbr}`,
    detail: `Sent: ${t.sent.join(', ')} → Received: ${t.received.join(', ')}`,
    isUserTeam: true,
  };
}

function newsToTxn(n: NewsItem, type: TxnType): Transaction {
  return {
    id: n.id,
    season: n.season,
    type,
    icon: TYPE_CONFIG[type].icon,
    title: n.headline,
    detail: n.body,
    isUserTeam: n.isUserTeam ?? false,
  };
}

type FilterMode = 'all' | 'trades' | 'signings' | 'releases' | 'my-team';

export default function TransactionLog() {
  const { newsItems, tradeHistory } = useLeagueStore();
  const [filter, setFilter] = useState<FilterMode>('all');

  // Build transaction list
  const txns: Transaction[] = [
    ...tradeHistory.map(tradeToTxn),
  ];

  // Extract transaction-like news items
  for (const n of newsItems) {
    const type = classifyNewsItem(n);
    if (type) txns.push(newsToTxn(n, type));
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = txns.filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  // Apply filter
  const filtered = unique.filter(t => {
    if (filter === 'trades') return t.type === 'trade';
    if (filter === 'signings') return t.type === 'signing' || t.type === 'extension';
    if (filter === 'releases') return t.type === 'release';
    if (filter === 'my-team') return t.isUserTeam;
    return true;
  });

  // Sort by season descending
  filtered.sort((a, b) => b.season - a.season || a.type.localeCompare(b.type));

  // Group by season
  const seasons = [...new Set(filtered.map(t => t.season))].sort((a, b) => b - a);

  if (unique.length === 0) {
    return (
      <div className="p-6">
        <CoachTip section="trades" />
        <div className="bloomberg-border p-8 text-center">
          <div className="text-3xl mb-2">📋</div>
          <div className="text-gray-400 text-sm">No transactions recorded yet.</div>
          <div className="text-gray-500 text-xs mt-1">
            Make your first trade, signing, or draft pick to start building your transaction history.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 flex items-center justify-between">
        <span>TRANSACTION LOG</span>
        <span className="text-xs text-gray-500 font-normal">{filtered.length} moves</span>
      </div>

      <CoachTip section="trades" />

      {/* Filter pills */}
      <div className="flex gap-1 flex-wrap">
        {([
          ['all', 'ALL MOVES'],
          ['my-team', 'MY TEAM'],
          ['trades', 'TRADES'],
          ['signings', 'SIGNINGS'],
          ['releases', 'RELEASES'],
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

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(['trade', 'signing', 'release', 'draft'] as TxnType[]).map(type => {
          const count = unique.filter(t => t.type === type).length;
          const cfg = TYPE_CONFIG[type];
          return (
            <div key={type} className="bloomberg-border px-3 py-2 text-center">
              <div className="text-lg">{cfg.icon}</div>
              <div className="text-xl font-black tabular-nums" style={{ color: cfg.color }}>
                {count}
              </div>
              <div className="text-[10px] text-gray-500 tracking-wider">{cfg.label}S</div>
            </div>
          );
        })}
      </div>

      {/* Transaction list by season */}
      {seasons.map(season => {
        const seasonTxns = filtered.filter(t => t.season === season);

        return (
          <div key={season} className="bloomberg-border">
            <div className="bloomberg-header text-xs flex items-center justify-between">
              <span>SEASON {season}</span>
              <span className="text-gray-500 font-normal">{seasonTxns.length} moves</span>
            </div>

            <div className="divide-y divide-gray-800/50">
              {seasonTxns.map(txn => {
                const cfg = TYPE_CONFIG[txn.type];
                return (
                  <div
                    key={txn.id}
                    className={[
                      'flex items-start gap-3 px-4 py-2.5 text-xs',
                      txn.isUserTeam ? 'bg-orange-950/10' : '',
                    ].join(' ')}
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">{txn.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider"
                          style={{
                            color: cfg.color,
                            backgroundColor: `${cfg.color}20`,
                          }}
                        >
                          {cfg.label}
                        </span>
                        {txn.isUserTeam && (
                          <span className="text-[10px] text-orange-500 font-bold">YOUR TEAM</span>
                        )}
                      </div>
                      <div className="text-gray-200 font-bold">{txn.title}</div>
                      <div className="text-gray-500 mt-0.5 leading-relaxed">{txn.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
