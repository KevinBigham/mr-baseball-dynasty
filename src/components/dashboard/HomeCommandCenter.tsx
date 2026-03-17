/**
 * HomeCommandCenter.tsx — The operational dashboard.
 *
 * "The home screen should tell you what needs your attention,
 *  the sim button should always be visible, and every pause
 *  should present exactly one decision."
 *
 * Synthesized from 10 deep research reports on sports sim UI/UX.
 */

import { useCallback, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import { getTeamLabel } from '../../data/teamOptions';
import type { ClubhouseEvent, TeamChemistryState } from '../../types/chemistry';
import type { StandingsRow } from '../../types/league';

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

function summarizeDivisionRace(rows: StandingsRow[], userTeamId: number): { rank: number; gamesBack: number } {
  const userRow = rows.find((row) => row.teamId === userTeamId);
  if (!userRow) return { rank: 0, gamesBack: 0 };

  const divisionRows = rows
    .filter((row) => row.league === userRow.league && row.division === userRow.division)
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.teamId - b.teamId);

  return {
    rank: divisionRows.findIndex((row) => row.teamId === userTeamId) + 1,
    gamesBack: userRow.gb ?? 0,
  };
}

// ─── Action Queue Builder ─────────────────────────────────────────────────────

function buildActionQueue(
  gamePhase: string,
  record: { w: number; l: number } | null,
  injuries: number,
  rosterSpace: { fortyMan: number; twentySix: number } | null,
  teamChemistry: TeamChemistryState | null,
  clubhouseEvents: ClubhouseEvent[],
  newsItems: Array<{ headline: string; category: string }>,
): ActionItem[] {
  const items: ActionItem[] = [];

  if (injuries > 0) {
    items.push({
      id: 'injuries',
      priority: injuries >= 3 ? 'critical' : 'important',
      headline: `${injuries} PLAYER${injuries > 1 ? 'S' : ''} ON INJURED LIST`,
      detail: injuries >= 3 ? 'Multiple key players down. Consider call-ups.' : 'Review IL status and call-up options.',
      action: { label: 'MANAGE ROSTER', tab: 'team', sub: 'roster' },
    });
  }

  if (rosterSpace && rosterSpace.fortyMan >= 38) {
    items.push({
      id: 'roster-crunch',
      priority: rosterSpace.fortyMan >= 40 ? 'critical' : 'important',
      headline: `40-MAN ROSTER: ${rosterSpace.fortyMan}/40`,
      detail: rosterSpace.fortyMan >= 40 ? 'No room for transactions. DFA or release someone.' : 'Getting tight. Plan ahead.',
      action: { label: 'VIEW ROSTER', tab: 'team', sub: 'roster' },
    });
  }

  if (gamePhase === 'offseason') {
    items.push({
      id: 'offseason',
      priority: 'important',
      headline: 'OFFSEASON IN PROGRESS',
      detail: 'Free agents, arbitration, and draft decisions await.',
      action: { label: 'FRONT OFFICE', tab: 'frontoffice' },
    });
  }

  if (!record || (record.w + record.l) === 0) {
    items.push({
      id: 'welcome',
      priority: 'info',
      headline: 'WELCOME TO YOUR FRANCHISE',
      detail: 'Review your roster, set your lineup, and sim your first season.',
      action: { label: 'VIEW TEAM', tab: 'team', sub: 'roster' },
    });
  }

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

  const latestClubhouseEvent = clubhouseEvents[0] ?? null;
  if (latestClubhouseEvent && ['clubhouse_crisis', 'clubhouse_friction', 'morale_collapse'].includes(latestClubhouseEvent.kind)) {
    items.push({
      id: 'clubhouse-event',
      priority: latestClubhouseEvent.kind === 'clubhouse_crisis' ? 'critical' : 'important',
      headline: latestClubhouseEvent.kind === 'clubhouse_crisis' ? 'CLUBHOUSE CRISIS' : 'CLUBHOUSE TENSION',
      detail: latestClubhouseEvent.description,
      action: { label: 'VIEW ROSTER', tab: 'team', sub: 'roster' },
    });
  } else if (teamChemistry && (teamChemistry.morale <= 35 || teamChemistry.cohesion <= 35)) {
    items.push({
      id: 'clubhouse-health',
      priority: 'important',
      headline: teamChemistry.cohesion <= 35 ? 'CLUBHOUSE COHESION FALLING' : 'CLUBHOUSE MORALE FALLING',
      detail: `Morale ${teamChemistry.morale} · Cohesion ${teamChemistry.cohesion}. Consider roster moves or leadership upgrades.`,
      action: { label: 'ROSTER', tab: 'team', sub: 'roster' },
    });
  }

  const recentTrade = newsItems.find((item) => item.category === 'trade');
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

  const { standings, roster, newsItems, teamChemistry, clubhouseEvents } = useLeagueStore();
  const { navigate } = useUIStore();

  const standingsRows = standings?.standings ?? [];
  const userRow = useMemo(() => standingsRows.find((row) => row.teamId === userTeamId) ?? null, [standingsRows, userTeamId]);
  const divisionRace = useMemo(() => summarizeDivisionRace(standingsRows, userTeamId), [standingsRows, userTeamId]);

  const record = userRow ? { w: userRow.wins, l: userRow.losses } : null;
  const teamName = userRow?.name ?? getTeamLabel(userTeamId);
  const injuries = roster?.il.length ?? 0;
  const rosterSpace = roster ? {
    fortyMan: roster.active.length + roster.il.length + roster.minors.length + roster.dfa.length,
    twentySix: roster.active.length,
  } : null;

  const handleAction = useCallback((tab: string, sub?: string) => {
    navigate(tab as any, sub);
  }, [navigate]);

  const actions = buildActionQueue(
    gamePhase,
    record,
    injuries,
    rosterSpace,
    teamChemistry,
    clubhouseEvents,
    (newsItems ?? []).map((item: any) => ({
      headline: item.headline ?? '',
      category: item.category ?? item.type ?? '',
    })),
  );

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

  if (divisionRace.rank > 0) {
    healthTiles.push({
      label: 'DIV RANK',
      value: `${divisionRace.rank}${divisionRace.rank === 1 ? 'ST' : divisionRace.rank === 2 ? 'ND' : divisionRace.rank === 3 ? 'RD' : 'TH'}`,
      sub: divisionRace.gamesBack > 0 ? `${divisionRace.gamesBack} GB` : 'LEADING',
      color: divisionRace.rank === 1 ? 'text-green-400' : divisionRace.rank <= 3 ? 'text-orange-400' : 'text-red-400',
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

  if (teamChemistry) {
    healthTiles.push({
      label: 'CLUBHOUSE',
      value: `${teamChemistry.morale}`,
      sub: `COH ${teamChemistry.cohesion}`,
      color: teamChemistry.morale >= 60 ? 'text-green-400' : teamChemistry.morale >= 40 ? 'text-orange-400' : 'text-red-400',
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-orange-500 font-bold text-sm tracking-widest uppercase">
            {teamName || 'YOUR FRANCHISE'}
          </div>
          {record && (record.w + record.l > 0) && (
            <div className="text-gray-500 text-xs mt-0.5">
              {record.w}-{record.l} · {divisionRace.rank > 0 ? `${divisionRace.rank}${divisionRace.rank === 1 ? 'st' : divisionRace.rank === 2 ? 'nd' : divisionRace.rank === 3 ? 'rd' : 'th'} in division` : `Season ${season}`}
              {divisionRace.gamesBack > 0 ? ` · ${divisionRace.gamesBack} GB` : divisionRace.rank === 1 ? ' · DIVISION LEADER' : ''}
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

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {healthTiles.map((tile) => (
          <div key={tile.label} className="border border-[#1E2A4A] bg-[#0F1930] rounded px-3 py-2">
            <div className="text-[9px] text-gray-500 font-bold tracking-widest">{tile.label}</div>
            <div className={`text-lg font-bold tracking-wide ${tile.color}`}>{tile.value}</div>
            {tile.sub && <div className="text-[9px] text-gray-500">{tile.sub}</div>}
          </div>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="space-y-2">
          <div className="text-[9px] text-gray-500 font-bold tracking-[0.2em] uppercase">ACTION QUEUE</div>
          {actions.slice(0, 4).map((item) => {
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

      {(newsItems ?? []).length > 0 && (
        <div className="border border-gray-800 bg-[#0F1930] rounded overflow-hidden">
          <div className="px-3 py-1.5 bg-[#0D1628] border-b border-[#1E2A4A50]">
            <span className="text-[9px] text-orange-500 font-bold tracking-[0.2em]">LATEST NEWS</span>
          </div>
          <div className="divide-y divide-gray-800/30">
            {(newsItems ?? []).slice(0, 4).map((item: any, i: number) => (
              <div key={item.id ?? i} className="px-3 py-2 flex items-start gap-2">
                <span className="text-[9px] text-gray-500 font-bold shrink-0 mt-0.5">
                  {item.category === 'trade' ? '↔' : item.category === 'injury' ? '🚑' : item.category === 'award' ? '🏆' : item.category === 'record' ? '📈' : item.category === 'clubhouse' ? '🤝' : '•'}
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
