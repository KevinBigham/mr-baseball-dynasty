import { useState, useEffect, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { AwardHistoryEntry, ChampionHistoryEntry, TransactionLog, SeasonMilestone } from '../../engine/history/awardsHistory';
import type { Injury } from '../../engine/injuries/injuryEngine';

type EventCategory = 'all' | 'trade' | 'award' | 'milestone' | 'injury' | 'development';

interface TimelineEvent {
  id: string;
  category: EventCategory;
  icon: string;
  color: string;
  title: string;
  description: string;
  season: number;
  playerId?: number;
}

function EventIcon({ category }: { category: string }) {
  const icons: Record<string, { bg: string; text: string; label: string }> = {
    trade: { bg: 'bg-blue-900/40', text: 'text-blue-400', label: 'TRD' },
    award: { bg: 'bg-yellow-900/40', text: 'text-yellow-400', label: 'AWD' },
    milestone: { bg: 'bg-green-900/40', text: 'text-green-400', label: 'MIL' },
    injury: { bg: 'bg-red-900/40', text: 'text-red-400', label: 'INJ' },
    development: { bg: 'bg-orange-900/40', text: 'text-orange-400', label: 'DEV' },
  };
  const style = icons[category] ?? icons.trade;
  return (
    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

export default function SeasonTimeline() {
  const { gameStarted, season } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [awards, setAwards] = useState<AwardHistoryEntry[]>([]);
  const [champions, setChampions] = useState<ChampionHistoryEntry[]>([]);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [milestones, setMilestones] = useState<SeasonMilestone[]>([]);
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [devEvents, setDevEvents] = useState<Array<{ season: number; events: Array<{ playerId: number; playerName: string; type: string; overallDelta?: number }> }>>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<EventCategory>('all');
  const [viewSeason, setViewSeason] = useState(season - 1);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    Promise.all([
      getEngine().getAwardHistory(),
      getEngine().getChampionHistory(),
      getEngine().getTransactionLog(),
      getEngine().getMilestones(),
      getEngine().getInjuryReport(),
      getEngine().getDevelopmentEvents(),
    ]).then(([a, c, t, m, inj, dev]) => {
      setAwards(a);
      setChampions(c);
      setTransactions(t);
      setMilestones(m);
      setInjuries(inj);
      setDevEvents(dev);
    }).finally(() => setLoading(false));
  }, [gameStarted]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  const timeline = useMemo(() => {
    const events: TimelineEvent[] = [];

    // Awards
    awards.filter(a => a.season === viewSeason).forEach((a, i) => {
      events.push({
        id: `award-${i}`,
        category: 'award',
        icon: 'AWD',
        color: 'text-yellow-400',
        title: `${a.award}: ${a.name}`,
        description: `${a.teamName} — ${a.statLine}`,
        season: a.season,
        playerId: a.playerId,
      });
    });

    // Champions
    champions.filter(c => c.season === viewSeason).forEach((c, i) => {
      events.push({
        id: `champ-${i}`,
        category: 'award',
        icon: 'WS',
        color: 'text-yellow-400',
        title: `World Series Champion: ${c.teamName}`,
        description: `${c.record}${c.mvpName ? ` — WS MVP: ${c.mvpName}` : ''}`,
        season: c.season,
      });
    });

    // Transactions
    transactions.filter(t => t.season === viewSeason).forEach((t, i) => {
      events.push({
        id: `txn-${i}`,
        category: 'trade',
        icon: 'TRD',
        color: 'text-blue-400',
        title: `${t.type}`,
        description: t.description,
        season: t.season,
      });
    });

    // Milestones
    milestones.filter(m => m.season === viewSeason).forEach((m, i) => {
      events.push({
        id: `mile-${i}`,
        category: 'milestone',
        icon: 'MIL',
        color: 'text-green-400',
        title: `${m.name}: ${m.milestone}`,
        description: 'Career milestone achieved.',
        season: m.season,
        playerId: m.playerId,
      });
    });

    // Injuries (current season)
    if (viewSeason === season - 1) {
      injuries.forEach((inj, i) => {
        events.push({
          id: `inj-${i}`,
          category: 'injury',
          icon: 'INJ',
          color: 'text-red-400',
          title: `${inj.playerName}: ${inj.type}`,
          description: `${inj.severity.replace(/_/g, ' ')} — ${inj.gamesOut} games${inj.gamesRemaining > 0 ? ` (${inj.gamesRemaining} remaining)` : ' (recovered)'}`,
          season: viewSeason,
          playerId: inj.playerId,
        });
      });
    }

    // Development events
    devEvents.filter(d => d.season === viewSeason).forEach(d => {
      d.events.forEach((e, i) => {
        events.push({
          id: `dev-${d.season}-${i}`,
          category: 'development',
          icon: 'DEV',
          color: e.type === 'breakout' ? 'text-green-400' : e.type === 'bust' ? 'text-red-400' : 'text-gray-400',
          title: `${e.playerName}: ${e.type === 'breakout' ? 'Breakout Season' : e.type === 'bust' ? 'Bust' : 'Retired'}`,
          description: e.overallDelta ? `Overall change: ${e.overallDelta > 0 ? '+' : ''}${e.overallDelta}` : '',
          season: d.season,
          playerId: e.playerId,
        });
      });
    });

    return events;
  }, [awards, champions, transactions, milestones, injuries, devEvents, viewSeason, season]);

  const filtered = categoryFilter === 'all' ? timeline : timeline.filter(e => e.category === categoryFilter);
  const availableSeasons = [...new Set([
    ...awards.map(a => a.season),
    ...transactions.map(t => t.season),
    ...devEvents.map(d => d.season),
  ])].sort((a, b) => b - a);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading timeline...</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SEASON TIMELINE</span>
        <div className="flex items-center gap-2">
          <select value={viewSeason}
            onChange={e => setViewSeason(Number(e.target.value))}
            className="bg-gray-800 text-orange-400 text-xs px-2 py-0.5 rounded border border-gray-700">
            {availableSeasons.length > 0 ? availableSeasons.map(s => (
              <option key={s} value={s}>{s}</option>
            )) : <option value={viewSeason}>{viewSeason}</option>}
          </select>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2">
        {(['all', 'trade', 'award', 'milestone', 'injury', 'development'] as const).map(cat => (
          <button key={cat} onClick={() => setCategoryFilter(cat)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              categoryFilter === cat ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>
            {cat.toUpperCase()}
          </button>
        ))}
        <span className="text-gray-600 text-xs ml-auto">{filtered.length} events</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TRANSACTIONS</div>
          <div className="text-blue-400 font-bold text-lg tabular-nums">
            {timeline.filter(e => e.category === 'trade').length}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AWARDS</div>
          <div className="text-yellow-400 font-bold text-lg tabular-nums">
            {timeline.filter(e => e.category === 'award').length}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MILESTONES</div>
          <div className="text-green-400 font-bold text-lg tabular-nums">
            {timeline.filter(e => e.category === 'milestone').length}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">INJURIES</div>
          <div className="text-red-400 font-bold text-lg tabular-nums">
            {timeline.filter(e => e.category === 'injury').length}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DEV EVENTS</div>
          <div className="text-orange-400 font-bold text-lg tabular-nums">
            {timeline.filter(e => e.category === 'development').length}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">EVENTS</div>
        <div className="max-h-[36rem] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-gray-600 text-xs text-center">No events for this season.</div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {filtered.map(e => (
                <div key={e.id}
                  className={`flex items-start gap-3 px-3 py-2 hover:bg-gray-800/30 ${e.playerId ? 'cursor-pointer' : ''}`}
                  onClick={() => e.playerId && goToPlayer(e.playerId)}>
                  <EventIcon category={e.category} />
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-bold ${e.color}`}>{e.title}</div>
                    {e.description && (
                      <div className="text-gray-500 text-xs mt-0.5">{e.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
