import React, { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useUIStore } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import type { PlayerProfileData, SplitLine } from '../../types/league';

function GradeBox({ label, value }: { label: string; value: number }) {
  const cls =
    value >= 70 ? 'grade-80' :
    value >= 60 ? 'grade-70' :
    value >= 50 ? 'grade-60' :
    value >= 40 ? 'grade-50' :
    value >= 30 ? 'grade-40' :
    'grade-30';

  return (
    <div className="flex flex-col items-center bloomberg-border px-3 py-2 bg-gray-900">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`text-xl font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

function statRow(label: string, value: number | undefined, decimals = 0): React.ReactNode {
  if (value === undefined || value === null) return null;
  const display = decimals > 0 ? value.toFixed(decimals) : String(value);
  return (
    <tr key={label} className="bloomberg-row text-xs">
      <td className="px-2 py-1 text-gray-500">{label}</td>
      <td className="text-right px-2 py-1 tabular-nums font-bold text-gray-200">{display}</td>
    </tr>
  );
}

export default function PlayerProfile() {
  const { selectedPlayerId, setActiveTab } = useUIStore();
  const { gameStarted } = useGameStore();
  const [data, setData] = useState<PlayerProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlayerId || !gameStarted) return;
    setLoading(true);
    setError(null);
    getEngine().getPlayerProfile(selectedPlayerId)
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [selectedPlayerId, gameStarted]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (!selectedPlayerId) return <div className="p-4 text-gray-500 text-xs">Select a player from the roster or leaderboard.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading player data…</div>;
  if (error) return <div className="p-4 text-red-400 text-xs">{error}</div>;
  if (!data) return null;

  const { player, seasonStats } = data;
  const isPitcher = ['SP', 'RP', 'CL'].includes(player.position);

  const serviceYears = Math.floor(player.serviceTimeDays / 172);
  const serviceRem   = player.serviceTimeDays % 172;

  return (
    <div className="p-4 max-w-3xl">
      <button
        onClick={() => setActiveTab('roster')}
        className="text-gray-500 hover:text-orange-400 text-xs mb-4 transition-colors"
      >
        ← BACK TO ROSTER
      </button>

      {/* Header */}
      <div className="bloomberg-border mb-4">
        <div className="bloomberg-header flex justify-between items-center">
          <span>{player.name}</span>
          <span className="text-gray-500 font-normal">
            {player.position} · AGE {player.age} · {player.bats}/{player.throws}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-0 divide-x divide-gray-800">
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">STATUS</div>
            <div className="text-orange-400 font-bold">{player.rosterStatus.replace(/_/g, ' ')}</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">CONTRACT</div>
            <div className="text-gray-200 font-bold">
              {player.contractYearsRemaining}Y / ${(player.salary / 1_000_000).toFixed(1)}M
            </div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">SERVICE TIME</div>
            <div className="text-gray-200 font-bold">{serviceYears}Y {serviceRem}D</div>
          </div>
          <div className="px-4 py-3">
            <div className="text-gray-500 text-xs">OVR / POT</div>
            <div className="text-orange-400 font-bold">{player.overall} / {player.potential}</div>
          </div>
        </div>
      </div>

      {/* Scouting grades */}
      <div className="bloomberg-border mb-4">
        <div className="bloomberg-header">SCOUTING GRADES (20–80)</div>
        <div className="flex gap-2 flex-wrap p-3">
          {Object.entries(player.grades).map(([label, val]) => (
            <GradeBox key={label} label={label} value={val} />
          ))}
        </div>
      </div>

      {/* Pitch repertoire (pitchers only) */}
      {isPitcher && data.pitchMix && (
        <div className="bloomberg-border mb-4">
          <div className="bloomberg-header">PITCH REPERTOIRE</div>
          <div className="flex gap-4 p-3">
            {[
              { label: 'FB', pct: data.pitchMix.fastball, color: 'bg-red-500' },
              { label: 'BRK', pct: data.pitchMix.breaking, color: 'bg-blue-500' },
              { label: 'OFF', pct: data.pitchMix.offspeed, color: 'bg-green-500' },
            ].filter(p => p.pct > 0).map(p => (
              <div key={p.label} className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">{p.label}</span>
                  <span className="text-gray-200 tabular-nums font-bold">{p.pct}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full ${p.color} rounded-full`} style={{ width: `${p.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Season stats */}
      {seasonStats && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">SEASON {(seasonStats as Record<string, number>).season ?? '—'} STATISTICS</div>
          <div className="grid grid-cols-2 gap-4 p-0">
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('W',    (seasonStats as Record<string, number>).w)}
                    {statRow('L',    (seasonStats as Record<string, number>).l)}
                    {statRow('SV',   (seasonStats as Record<string, number>).sv)}
                    {statRow('GS',   (seasonStats as Record<string, number>).gs)}
                    {statRow('IP',   (seasonStats as Record<string, number>).ip, 1)}
                    {statRow('ERA',  (seasonStats as Record<string, number>).era, 2)}
                    {statRow('FIP',  (seasonStats as Record<string, number>).fip, 2)}
                    {statRow('WHIP', (seasonStats as Record<string, number>).whip, 2)}
                  </>
                ) : (
                  <>
                    {statRow('PA',  (seasonStats as Record<string, number>).pa)}
                    {statRow('AB',  (seasonStats as Record<string, number>).ab)}
                    {statRow('H',   (seasonStats as Record<string, number>).h)}
                    {statRow('2B',  (seasonStats as Record<string, number>).doubles)}
                    {statRow('3B',  (seasonStats as Record<string, number>).triples)}
                    {statRow('HR',  (seasonStats as Record<string, number>).hr)}
                    {statRow('RBI', (seasonStats as Record<string, number>).rbi)}
                    {statRow('SB',  (seasonStats as Record<string, number>).sb)}
                  </>
                )}
              </tbody>
            </table>
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('K',       (seasonStats as Record<string, number>).ka)}
                    {statRow('BB',      (seasonStats as Record<string, number>).bba)}
                    {statRow('HR',      (seasonStats as Record<string, number>).hra)}
                    {statRow('QS',      (seasonStats as Record<string, number>).qs)}
                    {statRow('CG',      (seasonStats as Record<string, number>).cg)}
                    {statRow('P/GS',    (seasonStats as Record<string, number>).avgPitches)}
                  </>
                ) : (
                  <>
                    {statRow('AVG', (seasonStats as Record<string, number>).avg, 3)}
                    {statRow('OBP', (seasonStats as Record<string, number>).obp, 3)}
                    {statRow('SLG', (seasonStats as Record<string, number>).slg, 3)}
                    {statRow('OPS', (seasonStats as Record<string, number>).ops, 3)}
                    {statRow('BB',  (seasonStats as Record<string, number>).bb)}
                    {statRow('K',   (seasonStats as Record<string, number>).k)}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Career stats */}
      {data.careerStats && data.careerStats.seasons > 0 && (
        <div className="bloomberg-border mt-4">
          <div className="bloomberg-header">CAREER TOTALS ({data.careerStats.seasons} {data.careerStats.seasons === 1 ? 'SEASON' : 'SEASONS'})</div>
          <div className="grid grid-cols-2 gap-4 p-0">
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('W', data.careerStats.w)}
                    {statRow('L', data.careerStats.l)}
                    {statRow('SV', data.careerStats.sv)}
                    {statRow('IP', data.careerStats.ip, 1)}
                    {statRow('ERA', data.careerStats.era, 2)}
                  </>
                ) : (
                  <>
                    {statRow('PA', data.careerStats.pa)}
                    {statRow('H', data.careerStats.h)}
                    {statRow('HR', data.careerStats.hr)}
                    {statRow('RBI', data.careerStats.rbi)}
                    {statRow('SB', data.careerStats.sb)}
                  </>
                )}
              </tbody>
            </table>
            <table className="w-full">
              <tbody>
                {isPitcher ? (
                  <>
                    {statRow('K', data.careerStats.ka)}
                    {statRow('BB', data.careerStats.bba)}
                    {statRow('QS', data.careerStats.qs)}
                    {statRow('CG', data.careerStats.cg)}
                    {statRow('SHO', data.careerStats.sho)}
                  </>
                ) : (
                  <>
                    {statRow('AVG', data.careerStats.avg, 3)}
                    {statRow('OBP', data.careerStats.obp, 3)}
                    {statRow('BB', data.careerStats.bb)}
                    {statRow('K', data.careerStats.k)}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Platoon splits (hitters only) */}
      {data.splits && !isPitcher && (data.splits.vsLHP.pa > 0 || data.splits.vsRHP.pa > 0) && (
        <div className="bloomberg-border mt-4">
          <div className="bloomberg-header">PLATOON SPLITS</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="px-2 py-1 text-left">SPLIT</th>
                <th className="px-2 py-1 text-right">PA</th>
                <th className="px-2 py-1 text-right">AVG</th>
                <th className="px-2 py-1 text-right">OBP</th>
                <th className="px-2 py-1 text-right">SLG</th>
                <th className="px-2 py-1 text-right">OPS</th>
                <th className="px-2 py-1 text-right">HR</th>
                <th className="px-2 py-1 text-right">BB</th>
                <th className="px-2 py-1 text-right">K</th>
              </tr>
            </thead>
            <tbody>
              {(['vsLHP', 'vsRHP'] as const).map(key => {
                const sp: SplitLine = data.splits![key];
                if (sp.pa === 0) return null;
                return (
                  <tr key={key} className="bloomberg-row">
                    <td className="px-2 py-1 text-gray-400 font-bold">{key === 'vsLHP' ? 'vs LHP' : 'vs RHP'}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.pa}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.avg.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.obp.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.slg.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{sp.ops.toFixed(3)}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.hr}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.bb}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-200">{sp.k}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Season-by-season career log */}
      {data.seasonLog && data.seasonLog.length > 1 && (
        <div className="bloomberg-border mt-4">
          <div className="bloomberg-header">YEAR-BY-YEAR LOG</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-gray-800">
                  <th className="px-2 py-1 text-left">YR</th>
                  <th className="px-2 py-1 text-left">TEAM</th>
                  <th className="px-2 py-1 text-right">AGE</th>
                  {isPitcher ? (
                    <>
                      <th className="px-2 py-1 text-right">W</th>
                      <th className="px-2 py-1 text-right">L</th>
                      <th className="px-2 py-1 text-right">SV</th>
                      <th className="px-2 py-1 text-right">IP</th>
                      <th className="px-2 py-1 text-right">ERA</th>
                      <th className="px-2 py-1 text-right">K</th>
                      <th className="px-2 py-1 text-right">QS</th>
                    </>
                  ) : (
                    <>
                      <th className="px-2 py-1 text-right">G</th>
                      <th className="px-2 py-1 text-right">PA</th>
                      <th className="px-2 py-1 text-right">H</th>
                      <th className="px-2 py-1 text-right">HR</th>
                      <th className="px-2 py-1 text-right">RBI</th>
                      <th className="px-2 py-1 text-right">SB</th>
                      <th className="px-2 py-1 text-right">AVG</th>
                    </>
                  )}
                  <th className="px-2 py-1 text-left"></th>
                </tr>
              </thead>
              <tbody>
                {data.seasonLog.map(entry => (
                  <tr key={entry.season} className="bloomberg-row">
                    <td className="px-2 py-1 text-gray-400 tabular-nums">{entry.season}</td>
                    <td className="px-2 py-1 text-gray-500">{entry.teamName}</td>
                    <td className="px-2 py-1 text-right tabular-nums text-gray-500">{entry.age}</td>
                    {isPitcher ? (
                      <>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.w}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.l}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.sv}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.ip.toFixed(1)}</td>
                        <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{entry.era.toFixed(2)}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.ka}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.qs}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.g}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.pa}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.h}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.hr}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.rbi}</td>
                        <td className="px-2 py-1 text-right tabular-nums text-gray-200">{entry.sb}</td>
                        <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{entry.avg.toFixed(3)}</td>
                      </>
                    )}
                    <td className="px-2 py-1 text-yellow-500 text-xs">
                      {entry.awards.length > 0 ? entry.awards.join(', ') : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!seasonStats && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">STATISTICS</div>
          <div className="p-4 text-gray-500 text-xs">Simulate a season to see stats.</div>
        </div>
      )}
    </div>
  );
}
