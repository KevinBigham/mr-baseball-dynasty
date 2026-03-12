/**
 * HomeCommandCenter.tsx — The operational dashboard.
 *
 * "The home screen should tell you what needs your attention,
 *  the sim button should always be visible, and every pause
 *  should present exactly one decision."
 *
 * Synthesized from 10 deep research reports on sports sim UI/UX.
 */

import { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import { getEngine } from '../../engine/engineClient';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionItem {
  id: string;
  priority: 'critical' | 'important' | 'info';
  headline: string;
  detail: string;
  action?: { label: string; tab: string; sub?: string };
}

interface HealthTile {
  label: string;
  value: string;
  sub?: string;
  color: string;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  critical: { border: 'border-red-600', bg: 'bg-red-950/30', badge: 'bg-red-700 text-red-100', badgeText: 'URGENT' },
  important: { border: 'border-orange-600', bg: 'bg-orange-950/20', badge: 'bg-orange-700 text-orange-100', badgeText: 'ACTION' },
  info: { border: 'border-gray-700', bg: 'bg-[#0F1930]', badge: 'bg-gray-700 text-gray-300', badgeText: 'FYI' },
};

// ─── Action Queue Builder ─────────────────────────────────────────────────────

function buildActionQueue(
  gamePhase: string,
  season: number,
  record: { w: number; l: number } | null,
  injuries: number,
  rosterSpace: { fortyMan: number; twentySix: number } | null,
  newsItems: Array<{ headline: string; category: string }>,
): ActionItem[] {
  const items: ActionItem[] = [];

  // Injuries
  if (injuries > 0) {
    items.push({
      id: 'injuries',
      priority: injuries >= 3 ? 'critical' : 'important',
      headline: `${injuries} PLAYER${injuries > 1 ? 'S' : ''} ON INJURED LIST`,
      detail: injuries >= 3 ? 'Multiple key players down. Consider call-ups.' : 'Review IL status and call-up options.',
      action: { label: 'MANAGE ROSTER', tab: 'team', sub: 'roster' },
    });
  }

  // 40-man roster pressure
  if (rosterSpace && rosterSpace.fortyMan >= 38) {
    items.push({
      id: 'roster-crunch',
      priority: rosterSpace.fortyMan >= 40 ? 'critical' : 'important',
      headline: `40-MAN ROSTER: ${rosterSpace.fortyMan}/40`,
      detail: rosterSpace.fortyMan >= 40 ? 'No room for transactions. DFA or release someone.' : 'Getting tight. Plan ahead.',
      action: { label: 'VIEW ROSTER', tab: 'team', sub: 'roster' },
    });
  }

  // Offseason prompt
  if (gamePhase === 'offseason') {
    items.push({
      id: 'offseason',
      priority: 'important',
      headline: 'OFFSEASON IN PROGRESS',
      detail: 'Free agents, arbitration, and draft decisions await.',
      action: { label: 'FRONT OFFICE', tab: 'frontoffice' },
    });
  }

  // Preseason
  if (gamePhase === 'preseason' && season === 1) {
    items.push({
      id: 'welcome',
      priority: 'info',
      headline: 'WELCOME TO YOUR FRANCHISE',
      detail: 'Review your roster, set your lineup, and sim your first season.',
      action: { label: 'VIEW TEAM', tab: 'team', sub: 'roster' },
    });
  }

  // Season record alerts
  if (record && record.w + record.l > 20) {
    const pct = record.w / (record.w + record.l);
    if (pct < 0.400) {
      items.push({
        id: 'losing',
        priority: 'important',
        headline: 'LOSING RECORD',
        detail: `${record.w}-${record.l} (.${Math.round(pct * 1000)}). Consider roster moves.`,
        action: { label: 'TRADE CENTER', tab: 'frontoffice', sub: 'trades' },
      });
    }
    if (pct > 0.620) {
      items.push({
        id: 'contending',
        priority: 'info',
        headline: 'CONTENDER STATUS',
        detail: `${record.w}-${record.l} (.${Math.round(pct * 1000)}). Your team is in the hunt.`,
      });
    }
  }

  // Recent news highlights
  const recentTrade = newsItems.find(n => n.category === 'trade');
  if (recentTrade) {
    items.push({
      id: 'recent-trade',
      priority: 'info',
      headline: recentTrade.headline,
      detail: 'Check the trade center for more activity.',
      action: { label: 'TRADES', tab: 'frontoffice', sub: 'trades' },
    });
  }

  return items;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HomeCommandCenter() {
  const {
    season, userTeamId, gamePhase, isSimulating, simProgress,
  } = useGameStore();

  const { newsItems } = useLeagueStore();
  const { navigate } = useUIStore();

  const [teamName, setTeamName] = useState('');
  const [record, setRecord] = useState<{ w: number; l: number } | null>(null);
  const [divRank, setDivRank] = useState(0);
  const [gamesBack, setGamesBack] = useState(0);
  const [injuries, setInjuries] = useState(0);
  const [rosterSpace, setRosterSpace] = useState<{ fortyMan: number; twentySix: number } | null>(null);

  // Fetch live data
  useEffect(() => {
    (async () => {
      try {
        const engine = getEngine();
        const teams = await engine.getTeams();
        const userTeam = teams.find((t: any) => t.teamId === userTeamId);
        if (userTeam) {
          setTeamName(`${userTeam.city} ${userTeam.name}`);
          setRecord({
            w: userTeam.seasonRecord?.wins ?? 0,
            l: userTeam.seasonRecord?.losses ?? 0,
          });
        }

        // Try to get pennant race data
        try {
          const race = await engine.getPennantRace();
          if (race) {
            setDivRank(race.userDivisionRank ?? 0);
            setGamesBack(race.userGamesBack ?? 0);
          }
        } catch { /* non-fatal */ }

        // Try to get roster counts
        try {
          const roster = await engine.getRoster(userTeamId);
          if (roster) {
            const active = (roster as any[]).filter((p: any) => p.rosterStatus === 'MLB_ACTIVE').length;
            const fortyMan = (roster as any[]).filter((p: any) => p.isOn40Man).length;
            const injured = (roster as any[]).filter((p: any) =>
              p.rosterStatus === 'IL_10' || p.rosterStatus === 'IL_60'
            ).length;
            setInjuries(injured);
            setRosterSpace({ fortyMan, twentySix: active });
          }
        } catch { /* non-fatal */ }
      } catch { /* engine not ready */ }
    })();
  }, [userTeamId, season, gamePhase, isSimulating]);

  const handleAction = useCallback((tab: string, sub?: string) => {
    navigate(tab as any, sub);
  }, [navigate]);

  // Build action queue
  const actions = buildActionQueue(
    gamePhase, season, record, injuries, rosterSpace,
    (newsItems ?? []).map((n: any) => ({ headline: n.headline ?? '', category: n.category ?? '' })),
  );

  // Health tiles
  const healthTiles: HealthTile[] = [];

  if (record && (record.w + record.l > 0)) {
    const pct = (record.w / (record.w + record.l)).toFixed(3);
    healthTiles.push({
      label: 'RECORD',
      value: `${record.w}-${record.l}`,
      sub: pct,
      color: record.w > record.l ? 'text-green-400' : record.w < record.l ? 'text-red-400' : 'text-gray-400',
    });
  }

  if (divRank > 0) {
    healthTiles.push({
      label: 'DIV RANK',
      value: `${divRank}${divRank === 1 ? 'ST' : divRank === 2 ? 'ND' : divRank === 3 ? 'RD' : 'TH'}`,
      sub: gamesBack > 0 ? `${gamesBack} GB` : 'LEADING',
      color: divRank === 1 ? 'text-green-400' : divRank <= 3 ? 'text-orange-400' : 'text-red-400',
    });
  }

  if (rosterSpace) {
    healthTiles.push({
      label: '40-MAN',
      value: `${rosterSpace.fortyMan}/40`,
      color: rosterSpace.fortyMan >= 40 ? 'text-red-400' : rosterSpace.fortyMan >= 38 ? 'text-orange-400' : 'text-gray-400',
    });
  }

  if (injuries > 0) {
    healthTiles.push({
      label: 'INJURIES',
      value: `${injuries}`,
      sub: 'ON IL',
      color: injuries >= 3 ? 'text-red-400' : 'text-orange-400',
    });
  }

  healthTiles.push({
    label: 'SEASON',
    value: `S${season}`,
    sub: gamePhase.toUpperCase().replace('_', ' '),
    color: 'text-gray-400',
  });

  return (
    <div className="space-y-3">
      {/* ── Team Header + Sim Status ──────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-orange-500 font-bold text-sm tracking-widest uppercase">
            {teamName || 'YOUR FRANCHISE'}
          </div>
          {record && (record.w + record.l > 0) && (
            <div className="text-gray-500 text-xs mt-0.5">
              {record.w}-{record.l} · {divRank > 0 ? `${divRank}${divRank===1?'st':divRank===2?'nd':divRank===3?'rd':'th'} in division` : `Season ${season}`}
              {gamesBack > 0 ? ` · ${gamesBack} GB` : divRank === 1 ? ' · DIVISION LEADER' : ''}
            </div>
          )}
        </div>
        {isSimulating && (
          <div className="flex items-center gap-2">
            <div className="w-28 h-1.5 bg-gray-800 rounded overflow-hidden">
              <div className="h-full bg-orange-500 transition-all" style={{ width: `${Math.round(simProgress * 100)}%` }} />
            </div>
            <span className="text-orange-400 text-[10px] font-bold tracking-wider animate-pulse">SIMMING</span>
          </div>
        )}
      </div>

      {/* ── Health Tiles ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {healthTiles.map(tile => (
          <div key={tile.label} className="border border-[#1E2A4A] bg-[#0F1930] rounded px-3 py-2">
            <div className="text-[9px] text-gray-500 font-bold tracking-widest">{tile.label}</div>
            <div className={`text-lg font-bold tracking-wide ${tile.color}`}>{tile.value}</div>
            {tile.sub && <div className="text-[9px] text-gray-500">{tile.sub}</div>}
          </div>
        ))}
      </div>

      {/* ── Action Queue ──────────────────────────────────────────── */}
      {actions.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] text-gray-500 font-bold tracking-[0.2em] uppercase">ACTION QUEUE</div>
          {actions.slice(0, 4).map(item => {
            const style = PRIORITY_STYLES[item.priority];
            return (
              <div key={item.id} className={`border ${style.border} ${style.bg} rounded px-3 py-2.5 flex items-start justify-between gap-3`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`${style.badge} text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wider`}>{style.badgeText}</span>
                    <span className="text-xs font-bold text-gray-200 truncate">{item.headline}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{item.detail}</div>
                </div>
                {item.action && (
                  <button
                    onClick={() => handleAction(item.action!.tab, item.action!.sub)}
                    className="shrink-0 border border-gray-700 hover:border-orange-500 text-gray-500 hover:text-orange-400 text-[9px] font-bold px-2.5 py-1.5 uppercase tracking-wider transition-colors rounded"
                  >
                    {item.action.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Compact News ──────────────────────────────────────────── */}
      {(newsItems ?? []).length > 0 && (
        <div className="border border-gray-800 bg-[#0F1930] rounded overflow-hidden">
          <div className="px-3 py-1.5 bg-[#0D1628] border-b border-[#1E2A4A50]">
            <span className="text-[9px] text-orange-500 font-bold tracking-[0.2em]">LATEST NEWS</span>
          </div>
          <div className="divide-y divide-gray-800/30">
            {(newsItems ?? []).slice(0, 4).map((item: any, i: number) => (
              <div key={item.id ?? i} className="px-3 py-2 flex items-start gap-2">
                <span className="text-[9px] text-gray-500 font-bold shrink-0 mt-0.5">
                  {item.category === 'trade' ? '↔' : item.category === 'injury' ? '🚑' : item.category === 'award' ? '🏆' : item.category === 'record' ? '📈' : '•'}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-300 font-semibold truncate">{item.headline}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
