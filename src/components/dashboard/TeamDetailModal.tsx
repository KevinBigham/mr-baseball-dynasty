import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer, StandingsRow } from '../../types/league';

interface TeamInfo {
  teamId: number; name: string; abbreviation: string;
  league: string; division: string; budget: number;
  wins: number; losses: number;
}

interface Props {
  teamId: number;
  standingsRow?: StandingsRow;
  onClose: () => void;
}

function ovrGrade(ovr: number): { grade: string; color: string } {
  const g = Math.round(20 + (ovr / 550) * 60);
  if (g >= 70) return { grade: '70+', color: 'text-green-400' };
  if (g >= 60) return { grade: String(g), color: 'text-blue-400' };
  if (g >= 50) return { grade: String(g), color: 'text-gray-300' };
  if (g >= 40) return { grade: String(g), color: 'text-orange-400' };
  return { grade: String(g), color: 'text-red-400' };
}

function formatSalary(sal: number): string {
  if (sal >= 1_000_000) return `$${(sal / 1_000_000).toFixed(1)}M`;
  if (sal >= 1_000) return `$${(sal / 1_000).toFixed(0)}K`;
  return `$${sal}`;
}

export default function TeamDetailModal({ teamId, standingsRow, onClose }: Props) {
  const { setActiveTab, setSelectedTeam } = useUIStore();
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [topPlayers, setTopPlayers] = useState<RosterPlayer[]>([]);
  const [payroll, setPayroll] = useState(0);
  const [rosterStats, setRosterStats] = useState({ active: 0, fortyMan: 0, avgAge: 0, avgOvr: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const engine = getEngine();
      const [teams, roster] = await Promise.all([
        engine.getLeagueTeams(),
        engine.getFullRoster(teamId),
      ]);
      if (cancelled) return;

      const team = teams.find(t => t.teamId === teamId);
      if (team) setTeamInfo(team);

      const all = [...roster.active, ...roster.il];
      const sorted = all.sort((a, b) => b.overall - a.overall).slice(0, 8);
      setTopPlayers(sorted);

      const totalSalary = all.reduce((s, p) => s + (p.salary || 0), 0);
      setPayroll(totalSalary);

      const avgAge = all.length > 0 ? all.reduce((s, p) => s + p.age, 0) / all.length : 0;
      const avgOvr = all.length > 0 ? all.reduce((s, p) => s + p.overall, 0) / all.length : 0;
      setRosterStats({
        active: roster.active.length,
        fortyMan: roster.fortyManCount ?? 0,
        avgAge: Math.round(avgAge * 10) / 10,
        avgOvr,
      });

      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [teamId]);

  const row = standingsRow;
  const runDiff = row ? row.runsScored - row.runsAllowed : 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bloomberg-border bg-gray-900 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bloomberg-header px-4 flex items-center justify-between">
          <span>{teamInfo?.name ?? `Team ${teamId}`}</span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-sm">✕</button>
        </div>

        {loading ? (
          <div className="px-4 py-8 text-center text-orange-400 text-xs animate-pulse">Loading...</div>
        ) : (
          <div className="p-4 space-y-4">
            {/* Team overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <MiniStat label="RECORD" value={row ? `${row.wins}-${row.losses}` : `${teamInfo?.wins}-${teamInfo?.losses}`} />
              <MiniStat label="PCT" value={row ? row.pct.toFixed(3) : '—'} />
              <MiniStat
                label="RUN DIFF"
                value={`${runDiff >= 0 ? '+' : ''}${runDiff}`}
                color={runDiff > 0 ? 'text-green-400' : runDiff < 0 ? 'text-red-400' : 'text-gray-400'}
              />
              <MiniStat label="xW" value={row ? String(row.pythagWins) : '—'} />
            </div>

            {/* Roster composition */}
            <div className="grid grid-cols-4 gap-2">
              <MiniStat label="ACTIVE" value={`${rosterStats.active}/26`} />
              <MiniStat label="40-MAN" value={`${rosterStats.fortyMan}/40`} />
              <MiniStat label="AVG AGE" value={rosterStats.avgAge.toFixed(1)} />
              <MiniStat label="AVG OVR" value={String(Math.round(20 + (rosterStats.avgOvr / 550) * 60))} />
            </div>

            {/* Payroll */}
            <div className="grid grid-cols-2 gap-2">
              <MiniStat label="PAYROLL" value={formatSalary(payroll)} />
              <MiniStat label="BUDGET" value={teamInfo ? `$${teamInfo.budget}M` : '—'} />
            </div>

            {/* Top players */}
            <div>
              <div className="text-gray-500 text-xs font-bold tracking-widest mb-1.5">TOP PLAYERS</div>
              <div className="space-y-0.5">
                {topPlayers.map(p => {
                  const g = ovrGrade(p.overall);
                  const keyStat = p.isPitcher
                    ? `${p.stats.era?.toFixed(2) ?? '—'} ERA`
                    : `${p.stats.avg?.toFixed(3) ?? '—'} / ${p.stats.hr ?? 0} HR`;
                  return (
                    <div key={p.playerId} className="flex items-center justify-between py-1 border-b border-gray-800/50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold w-6 text-right tabular-nums ${g.color}`}>{g.grade}</span>
                        <span className="text-gray-500 w-6">{p.position}</span>
                        <span className="text-gray-300 font-bold">{p.name}</span>
                      </div>
                      <span className="text-gray-500 tabular-nums">{keyStat}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-800">
              <button
                onClick={() => {
                  setSelectedTeam(teamId);
                  setActiveTab('roster');
                  onClose();
                }}
                className="flex-1 border border-orange-800 hover:border-orange-500 text-orange-700 hover:text-orange-400 text-xs py-2 uppercase tracking-wider transition-colors"
              >
                VIEW FULL ROSTER
              </button>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-700 hover:border-gray-500 text-gray-500 hover:text-gray-300 text-xs py-2 uppercase tracking-wider transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-800/50 px-2 py-1.5">
      <div className="text-gray-600 text-[10px] uppercase">{label}</div>
      <div className={`font-bold text-sm tabular-nums ${color ?? 'text-gray-300'}`}>{value}</div>
    </div>
  );
}
