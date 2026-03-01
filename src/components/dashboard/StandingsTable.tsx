import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import type { StandingsRow } from '../../types/league';
import TeamDetailModal from './TeamDetailModal';

function computeGB(rows: StandingsRow[]): StandingsRow[] {
  if (rows.length === 0) return rows;
  const leader = rows.reduce((a, b) => a.wins > b.wins ? a : b);
  return rows.map(r => ({
    ...r,
    gb: r === leader ? 0 : ((leader.wins - r.wins) + (r.losses - leader.losses)) / 2,
  }));
}

function groupByDivision(rows: StandingsRow[]): Record<string, StandingsRow[]> {
  const groups: Record<string, StandingsRow[]> = {};
  for (const r of rows) {
    const key = `${r.league} ${r.division}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  }
  for (const key of Object.keys(groups)) {
    groups[key] = computeGB(groups[key]!.sort((a, b) => b.wins - a.wins || a.losses - b.losses));
  }
  return groups;
}

function computePlayoffIds(rows: StandingsRow[]): Set<number> {
  const ids = new Set<number>();
  for (const league of ['AL', 'NL'] as const) {
    const teams = rows.filter(r => r.league === league)
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
    const divWinners = new Map<string, StandingsRow>();
    for (const t of teams) {
      if (!divWinners.has(t.division)) divWinners.set(t.division, t);
    }
    for (const w of divWinners.values()) ids.add(w.teamId);
    let wc = 0;
    for (const t of teams) {
      if (wc >= 3) break;
      if (!ids.has(t.teamId)) { ids.add(t.teamId); wc++; }
    }
  }
  return ids;
}

function runDiff(row: StandingsRow): string {
  const d = row.runsScored - row.runsAllowed;
  return d >= 0 ? `+${d}` : `${d}`;
}

const DIV_ORDER = ['AL East', 'AL Central', 'AL West', 'NL East', 'NL Central', 'NL West'];

function PlayoffPicturePanel({
  rows, league, userTeamId, onSelect,
}: {
  rows: StandingsRow[]; league: 'AL' | 'NL'; userTeamId: number; onSelect: (id: number) => void;
}) {
  const leagueRows = rows
    .filter(r => r.league === league)
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  const divWinners = new Map<string, StandingsRow>();
  for (const t of leagueRows) {
    if (!divWinners.has(t.division)) divWinners.set(t.division, t);
  }
  const dwIds = new Set([...divWinners.values()].map(t => t.teamId));

  const wcTeams: StandingsRow[] = [];
  for (const t of leagueRows) {
    if (wcTeams.length >= 3) break;
    if (!dwIds.has(t.teamId)) wcTeams.push(t);
  }
  const wcIds = new Set(wcTeams.map(t => t.teamId));

  const bubble = leagueRows.filter(t => !dwIds.has(t.teamId) && !wcIds.has(t.teamId)).slice(0, 3);

  const RowEl = ({ t, badge }: { t: StandingsRow; badge?: string }) => (
    <div
      className={[
        'flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-gray-800/40 transition-colors text-xs',
        t.teamId === userTeamId ? 'bg-orange-950/20' : '',
      ].join(' ')}
      onClick={() => onSelect(t.teamId)}
    >
      <div className="flex items-center gap-2">
        {badge && <span className="w-8 text-center">{badge}</span>}
        <span className={`font-bold ${
          t.teamId === userTeamId ? 'text-orange-400' :
          dwIds.has(t.teamId) ? 'text-yellow-300' :
          wcIds.has(t.teamId) ? 'text-blue-300' : 'text-gray-500'
        }`}>{t.abbreviation}</span>
        <span className="text-gray-600">{t.division}</span>
      </div>
      <div className="flex items-center gap-4 tabular-nums">
        <span className="text-gray-400">{t.wins}-{t.losses}</span>
        <span className={t.runsScored > t.runsAllowed ? 'text-green-500' : 'text-red-500'}>{runDiff(t)}</span>
      </div>
    </div>
  );

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header">{league} PLAYOFF PICTURE</div>

      <div className="text-yellow-500/80 text-xs px-3 py-1 bg-yellow-950/20 border-b border-gray-800 font-bold tracking-widest">
        DIVISION LEADERS
      </div>
      {[...divWinners.values()].map(t => <RowEl key={t.teamId} t={t} badge="▲" />)}

      <div className="text-blue-400/80 text-xs px-3 py-1 bg-blue-950/20 border-b border-gray-800 border-t border-gray-800 font-bold tracking-widest">
        WILD CARD
      </div>
      {wcTeams.map((t, i) => <RowEl key={t.teamId} t={t} badge={`WC${i+1}`} />)}

      {bubble.length > 0 && (
        <>
          <div className="text-gray-600 text-xs px-3 py-1 border-b border-gray-800 border-t border-gray-800 font-bold tracking-widest">
            ON THE BUBBLE
          </div>
          {bubble.map(t => {
            const wcEdge = wcTeams[2];
            const gb = wcEdge ? ((wcEdge.wins - t.wins) + (t.losses - wcEdge.losses)) / 2 : 0;
            return (
              <div key={t.teamId}
                className={[
                  'flex items-center justify-between px-3 py-1.5 cursor-pointer hover:bg-gray-800/40 transition-colors text-xs',
                  t.teamId === userTeamId ? 'bg-orange-950/20' : '',
                ].join(' ')}
                onClick={() => onSelect(t.teamId)}
              >
                <div className="flex items-center gap-2">
                  <span className="w-8 text-center text-gray-700">—</span>
                  <span className={`font-bold ${t.teamId === userTeamId ? 'text-orange-400' : 'text-gray-500'}`}>
                    {t.abbreviation}
                  </span>
                </div>
                <div className="flex items-center gap-4 tabular-nums">
                  <span className="text-gray-500">{t.wins}-{t.losses}</span>
                  <span className="text-red-400 text-xs">{gb > 0 ? `${gb.toFixed(1)} back` : 'tied'}</span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

export default function StandingsView() {
  const { standings, setStandings } = useLeagueStore();
  const { gameStarted, userTeamId } = useGameStore();
  // Team detail modal handles navigation via its own UIStore calls
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'divisions' | 'picture'>('divisions');
  const [detailTeamId, setDetailTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (!gameStarted || standings) return;
    setLoading(true);
    getEngine().getStandings()
      .then(setStandings)
      .finally(() => setLoading(false));
  }, [gameStarted, standings, setStandings]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading standings…</div>;
  if (!standings) return <div className="p-4 text-gray-500 text-xs">No standings yet. Simulate a season first.</div>;

  const grouped   = groupByDivision(standings.standings);
  const playoffIds = computePlayoffIds(standings.standings);

  const handleRowClick = (teamId: number) => {
    setDetailTeamId(teamId);
  };

  return (
    <div className="p-4">
      <div className="bloomberg-header mb-4 -mx-4 -mt-4 px-8 py-2 flex items-center justify-between">
        <span>MLB STANDINGS — SEASON {standings.season}</span>
        <div className="flex gap-1">
          {(['divisions', 'picture'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={[
                'text-xs px-3 py-1 border font-normal transition-colors',
                view === v
                  ? 'border-orange-500 text-orange-400 bg-orange-950/30'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {v === 'divisions' ? 'DIVISIONS' : 'PLAYOFF PICTURE'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Division view ──────────────────────────────────────────────── */}
      {view === 'divisions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {DIV_ORDER.map(divKey => {
            const rows = grouped[divKey];
            if (!rows) return null;

            return (
              <div key={divKey} className="bloomberg-border">
                <div className="bloomberg-header text-xs">{divKey}</div>
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800">
                      <th className="px-1 py-1 w-5"></th>
                      <th className="text-left px-2 py-1 w-20">TEAM</th>
                      <th className="text-right px-2 py-1">W</th>
                      <th className="text-right px-2 py-1">L</th>
                      <th className="text-right px-2 py-1">PCT</th>
                      <th className="text-right px-2 py-1">GB</th>
                      <th className="text-right px-2 py-1">DIFF</th>
                      <th className="text-right px-2 py-1 text-orange-600" title="Pythagorean wins">xW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, i) => {
                      const inPO    = playoffIds.has(row.teamId);
                      const isDiv   = i === 0;
                      const isUser  = row.teamId === userTeamId;

                      return (
                        <tr
                          key={row.teamId}
                          className={[
                            'bloomberg-row cursor-pointer text-xs',
                            isUser ? 'bg-orange-950/20' : '',
                          ].join(' ')}
                          onClick={() => handleRowClick(row.teamId)}
                        >
                          <td className="px-1 py-1 text-center">
                            {isDiv && <span className="text-yellow-400">▲</span>}
                            {!isDiv && inPO && <span className="text-blue-400 text-xs">✦</span>}
                            {!inPO && <span className="text-gray-800">·</span>}
                          </td>
                          <td className={[
                            'px-2 py-1 font-bold',
                            isUser   ? 'text-orange-400' :
                            isDiv    ? 'text-yellow-300' :
                            inPO     ? 'text-blue-300' : 'text-gray-400',
                          ].join(' ')}>
                            {row.abbreviation}
                          </td>
                          <td className="text-right px-2 py-1 tabular-nums">{row.wins}</td>
                          <td className="text-right px-2 py-1 tabular-nums">{row.losses}</td>
                          <td className="text-right px-2 py-1 tabular-nums">{row.pct.toFixed(3).replace('0.', '.')}</td>
                          <td className="text-right px-2 py-1 tabular-nums text-gray-500">
                            {row.gb === 0 ? '—' : row.gb.toFixed(1)}
                          </td>
                          <td className={[
                            'text-right px-2 py-1 tabular-nums',
                            row.runsScored > row.runsAllowed ? 'text-green-500' : 'text-red-500',
                          ].join(' ')}>
                            {runDiff(row)}
                          </td>
                          <td className="text-right px-2 py-1 tabular-nums text-orange-600">{row.pythagWins}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Playoff picture view ───────────────────────────────────────── */}
      {view === 'picture' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PlayoffPicturePanel rows={standings.standings} league="AL" userTeamId={userTeamId} onSelect={handleRowClick} />
          <PlayoffPicturePanel rows={standings.standings} league="NL" userTeamId={userTeamId} onSelect={handleRowClick} />
          <div className="lg:col-span-2 flex gap-6 text-xs text-gray-600">
            <span><span className="text-yellow-400">▲</span> Division Leader</span>
            <span><span className="text-blue-400">✦</span> Wild Card</span>
            <span><span className="text-orange-400 font-bold">■</span> Your Team</span>
            <span>DIFF = Run Differential &nbsp;·&nbsp; xW = Pythagorean Wins</span>
          </div>
        </div>
      )}

      {/* Team detail modal */}
      {detailTeamId !== null && (
        <TeamDetailModal
          teamId={detailTeamId}
          standingsRow={standings.standings.find(r => r.teamId === detailTeamId)}
          onClose={() => setDetailTeamId(null)}
        />
      )}
    </div>
  );
}
