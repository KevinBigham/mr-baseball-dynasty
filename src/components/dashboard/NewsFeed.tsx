import { useState, useEffect, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { AwardHistoryEntry, ChampionHistoryEntry, TransactionLog, SeasonMilestone } from '../../engine/history/awardsHistory';
import type { Injury } from '../../engine/injuries/injuryEngine';

interface NewsItem {
  id: string;
  type: 'trade' | 'award' | 'milestone' | 'injury' | 'champion' | 'signing';
  headline: string;
  detail: string;
  season: number;
  playerId?: number;
  priority: number; // 1=highest
}

function PriorityDot({ priority }: { priority: number }) {
  const color = priority <= 1 ? 'bg-red-500' : priority <= 2 ? 'bg-orange-500' : priority <= 3 ? 'bg-yellow-500' : 'bg-gray-600';
  return <div className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />;
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    trade: 'bg-blue-900/40 text-blue-400',
    award: 'bg-yellow-900/40 text-yellow-400',
    milestone: 'bg-green-900/40 text-green-400',
    injury: 'bg-red-900/40 text-red-400',
    champion: 'bg-yellow-900/40 text-yellow-400',
    signing: 'bg-purple-900/40 text-purple-400',
  };
  const labels: Record<string, string> = {
    trade: 'TRADE',
    award: 'AWARD',
    milestone: 'MILESTONE',
    injury: 'INJURY',
    champion: 'CHAMPS',
    signing: 'SIGNING',
  };
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${styles[type] ?? styles.trade}`}>
      {labels[type] ?? type.toUpperCase()}
    </span>
  );
}

export default function NewsFeed() {
  const { gameStarted, season } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [awards, setAwards] = useState<AwardHistoryEntry[]>([]);
  const [champions, setChampions] = useState<ChampionHistoryEntry[]>([]);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [milestones, setMilestones] = useState<SeasonMilestone[]>([]);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    Promise.all([
      getEngine().getAwardHistory(),
      getEngine().getChampionHistory(),
      getEngine().getTransactionLog(),
      getEngine().getMilestones(),
      getEngine().getInjuryReport(),
    ]).then(([a, c, t, m, inj]) => {
      setAwards(a);
      setChampions(c);
      setTransactions(t);
      setMilestones(m);
      setInjuries(inj);
    }).finally(() => setLoading(false));
  }, [gameStarted]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  const news = useMemo(() => {
    const items: NewsItem[] = [];

    // Awards — high priority
    awards.forEach((a, i) => {
      items.push({
        id: `award-${i}`,
        type: 'award',
        headline: `${a.name} wins ${a.award}`,
        detail: `${a.teamName} — ${a.statLine}`,
        season: a.season,
        playerId: a.playerId,
        priority: 1,
      });
    });

    // Champions — highest priority
    champions.forEach((c, i) => {
      items.push({
        id: `champ-${i}`,
        type: 'champion',
        headline: `${c.teamName} wins the World Series`,
        detail: `Record: ${c.record}${c.mvpName ? ` — WS MVP: ${c.mvpName}` : ''}`,
        season: c.season,
        priority: 1,
      });
    });

    // Transactions
    transactions.forEach((t, i) => {
      const isTrade = t.type === 'Trade' || t.description.toLowerCase().includes('trade');
      items.push({
        id: `txn-${i}`,
        type: isTrade ? 'trade' : 'signing',
        headline: t.description,
        detail: `${t.phase} — Season ${t.season}`,
        season: t.season,
        priority: isTrade ? 2 : 3,
      });
    });

    // Milestones
    milestones.forEach((m, i) => {
      items.push({
        id: `mile-${i}`,
        type: 'milestone',
        headline: `${m.name} reaches ${m.milestone}`,
        detail: 'Career milestone achieved',
        season: m.season,
        playerId: m.playerId,
        priority: 2,
      });
    });

    // Injuries (current season)
    injuries.forEach((inj, i) => {
      items.push({
        id: `inj-${i}`,
        type: 'injury',
        headline: `${inj.playerName} placed on IL (${inj.type})`,
        detail: `${inj.severity.replace(/_/g, ' ')} — ${inj.gamesOut} games${inj.gamesRemaining > 0 ? `, ${inj.gamesRemaining} remaining` : ' (cleared)'}`,
        season: season - 1,
        playerId: inj.playerId,
        priority: inj.gamesOut >= 30 ? 2 : 4,
      });
    });

    // Sort by season desc, then priority
    items.sort((a, b) => {
      if (b.season !== a.season) return b.season - a.season;
      return a.priority - b.priority;
    });

    return items;
  }, [awards, champions, transactions, milestones, injuries, season]);

  const filtered = typeFilter === 'all' ? news : news.filter(n => n.type === typeFilter);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading news...</div>;

  const types = ['all', 'trade', 'award', 'milestone', 'injury', 'signing', 'champion'] as const;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>LEAGUE NEWS FEED</span>
        <span className="text-gray-600 text-[10px]">{news.length} TOTAL EVENTS</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-6 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TRADES</div>
          <div className="text-blue-400 font-bold text-lg tabular-nums">{news.filter(n => n.type === 'trade').length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AWARDS</div>
          <div className="text-yellow-400 font-bold text-lg tabular-nums">{news.filter(n => n.type === 'award').length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MILESTONES</div>
          <div className="text-green-400 font-bold text-lg tabular-nums">{news.filter(n => n.type === 'milestone').length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">INJURIES</div>
          <div className="text-red-400 font-bold text-lg tabular-nums">{news.filter(n => n.type === 'injury').length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SIGNINGS</div>
          <div className="text-purple-400 font-bold text-lg tabular-nums">{news.filter(n => n.type === 'signing').length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TITLES</div>
          <div className="text-yellow-400 font-bold text-lg tabular-nums">{news.filter(n => n.type === 'champion').length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1">
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              typeFilter === t ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {t.toUpperCase()}
          </button>
        ))}
        <span className="text-gray-600 text-xs ml-auto">{filtered.length} events</span>
      </div>

      {/* News feed */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">NEWS FEED</div>
        <div className="max-h-[36rem] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-gray-600 text-xs text-center">No events to show.</div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {filtered.slice(0, 200).map(item => (
                <div key={item.id}
                  className={`flex items-start gap-2 px-3 py-2 hover:bg-gray-800/30 ${item.playerId ? 'cursor-pointer' : ''}`}
                  onClick={() => item.playerId && goToPlayer(item.playerId)}>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <PriorityDot priority={item.priority} />
                    <TypeBadge type={item.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 font-bold">{item.headline}</div>
                    <div className="text-gray-500 text-xs">{item.detail}</div>
                  </div>
                  <span className="text-gray-700 text-[10px] tabular-nums shrink-0">S{item.season}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
