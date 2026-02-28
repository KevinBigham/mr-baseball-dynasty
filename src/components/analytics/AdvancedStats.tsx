import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { AdvancedHitterStats, AdvancedPitcherStats, LeagueEnvironment } from '../../engine/analytics/sabermetrics';

type SubTab = 'hitters' | 'pitchers' | 'league';

function StatBadge({ value, avg = 100, invert = false }: { value: number; avg?: number; invert?: boolean }) {
  const isGood = invert ? value < avg : value > avg;
  const isGreat = invert ? value < avg * 0.8 : value > avg * 1.2;
  const color = isGreat ? '#4ade80' : isGood ? '#86efac' : value === avg ? '#9ca3af' : '#ef4444';
  return <span style={{ color }} className="font-bold tabular-nums">{value}</span>;
}

export default function AdvancedStats() {
  const { gameStarted } = useGameStore();
  const { setSelectedPlayer, setActiveTab } = useUIStore();
  const [tab, setTab] = useState<SubTab>('hitters');
  const [hitters, setHitters] = useState<AdvancedHitterStats[]>([]);
  const [pitchers, setPitchers] = useState<AdvancedPitcherStats[]>([]);
  const [env, setEnv] = useState<LeagueEnvironment | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const engine = getEngine();
    const data = await engine.getAdvancedStats();
    setHitters(data.hitters);
    setPitchers(data.pitchers);
    setEnv(data.env);
    setLoading(false);
  }, [gameStarted]);

  useEffect(() => { loadData(); }, [loadData]);

  const openPlayer = (id: number) => { setSelectedPlayer(id); setActiveTab('profile'); };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const tabs: Array<{ id: SubTab; label: string }> = [
    { id: 'hitters', label: 'HITTERS' },
    { id: 'pitchers', label: 'PITCHERS' },
    { id: 'league', label: 'LEAGUE ENV' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>ADVANCED ANALYTICS</span>
        <div className="flex items-center gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`text-xs font-bold px-3 py-1 uppercase tracking-wider transition-colors ${
                tab === t.id ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-orange-400 text-xs animate-pulse">Computing advanced stats...</div>
      ) : (
        <>
          {tab === 'hitters' && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">ADVANCED HITTER LEADERBOARD (WAR) — {hitters.length} qualified</div>
              <div className="max-h-[38rem] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                      <th className="px-1 py-1 text-center w-6">#</th>
                      <th className="px-2 py-1 text-left">PLAYER</th>
                      <th className="px-1 py-1">TM</th>
                      <th className="px-1 py-1">POS</th>
                      <th className="px-1 py-1">PA</th>
                      <th className="px-1 py-1">AVG</th>
                      <th className="px-1 py-1">OBP</th>
                      <th className="px-1 py-1">SLG</th>
                      <th className="px-1 py-1">ISO</th>
                      <th className="px-1 py-1">BABIP</th>
                      <th className="px-1 py-1">wOBA</th>
                      <th className="px-1 py-1 text-orange-400">wRC+</th>
                      <th className="px-1 py-1 text-orange-400">OPS+</th>
                      <th className="px-1 py-1">K%</th>
                      <th className="px-1 py-1">BB%</th>
                      <th className="px-1 py-1 text-yellow-400 font-bold">WAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hitters.slice(0, 50).map((h, idx) => (
                      <tr key={h.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer" onClick={() => openPlayer(h.playerId)}>
                        <td className="px-1 py-1 text-gray-600 text-center">{idx + 1}</td>
                        <td className="px-2 py-1 font-bold text-orange-300 whitespace-nowrap">{h.name}</td>
                        <td className="px-1 py-1 text-center text-gray-500">{h.teamAbbr}</td>
                        <td className="px-1 py-1 text-center text-gray-500">{h.position}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-400">{h.pa}</td>
                        <td className="px-1 py-1 tabular-nums text-center">{h.avg.toFixed(3).slice(1)}</td>
                        <td className="px-1 py-1 tabular-nums text-center">{h.obp.toFixed(3).slice(1)}</td>
                        <td className="px-1 py-1 tabular-nums text-center">{h.slg.toFixed(3).slice(1)}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-400">{h.iso.toFixed(3).slice(1)}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-500">{h.babip.toFixed(3).slice(1)}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-blue-300">{h.woba.toFixed(3).slice(1)}</td>
                        <td className="px-1 py-1 text-center"><StatBadge value={h.wrcPlus} /></td>
                        <td className="px-1 py-1 text-center"><StatBadge value={h.opsPlus} /></td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-400">{(h.kPct * 100).toFixed(1)}%</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-400">{(h.bbPct * 100).toFixed(1)}%</td>
                        <td className="px-1 py-1 tabular-nums text-center font-bold text-yellow-400">{h.war.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'pitchers' && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">ADVANCED PITCHER LEADERBOARD (WAR) — {pitchers.length} qualified</div>
              <div className="max-h-[38rem] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                      <th className="px-1 py-1 text-center w-6">#</th>
                      <th className="px-2 py-1 text-left">PLAYER</th>
                      <th className="px-1 py-1">TM</th>
                      <th className="px-1 py-1">IP</th>
                      <th className="px-1 py-1">W-L</th>
                      <th className="px-1 py-1">ERA</th>
                      <th className="px-1 py-1 text-orange-400">FIP</th>
                      <th className="px-1 py-1">WHIP</th>
                      <th className="px-1 py-1">K/9</th>
                      <th className="px-1 py-1">BB/9</th>
                      <th className="px-1 py-1">HR/9</th>
                      <th className="px-1 py-1">K/BB</th>
                      <th className="px-1 py-1 text-orange-400">ERA+</th>
                      <th className="px-1 py-1 text-orange-400">FIP-</th>
                      <th className="px-1 py-1 text-yellow-400 font-bold">WAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pitchers.slice(0, 50).map((p, idx) => (
                      <tr key={p.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer" onClick={() => openPlayer(p.playerId)}>
                        <td className="px-1 py-1 text-gray-600 text-center">{idx + 1}</td>
                        <td className="px-2 py-1 font-bold text-orange-300 whitespace-nowrap">{p.name}</td>
                        <td className="px-1 py-1 text-center text-gray-500">{p.teamAbbr}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-400">{p.ip.toFixed(1)}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-400">{p.w}-{p.l}</td>
                        <td className="px-1 py-1 tabular-nums text-center">{p.era.toFixed(2)}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-blue-300">{p.fip.toFixed(2)}</td>
                        <td className="px-1 py-1 tabular-nums text-center">{p.whip.toFixed(2)}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-400">{p.k9.toFixed(1)}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-400">{p.bb9.toFixed(1)}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-500">{p.hr9.toFixed(1)}</td>
                        <td className="px-1 py-1 tabular-nums text-center text-gray-400">{p.kbb.toFixed(2)}</td>
                        <td className="px-1 py-1 text-center"><StatBadge value={p.eraPlus} /></td>
                        <td className="px-1 py-1 text-center"><StatBadge value={p.fipMinus} invert /></td>
                        <td className="px-1 py-1 tabular-nums text-center font-bold text-yellow-400">{p.war.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'league' && env && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bloomberg-border p-4">
                <div className="text-gray-600 text-xs mb-2 uppercase tracking-wider">League Batting</div>
                <div className="space-y-2">
                  <StatRow label="AVG" value={env.lgBA.toFixed(3)} />
                  <StatRow label="OBP" value={env.lgOBP.toFixed(3)} />
                  <StatRow label="SLG" value={env.lgSLG.toFixed(3)} />
                  <StatRow label="OPS" value={(env.lgOBP + env.lgSLG).toFixed(3)} />
                </div>
              </div>
              <div className="bloomberg-border p-4">
                <div className="text-gray-600 text-xs mb-2 uppercase tracking-wider">League Pitching</div>
                <div className="space-y-2">
                  <StatRow label="ERA" value={env.lgERA.toFixed(2)} />
                  <StatRow label="FIP" value={env.lgFIP.toFixed(2)} />
                  <StatRow label="R/9" value={env.lgR9.toFixed(2)} />
                  <StatRow label="FIP Const." value={env.fipConstant.toFixed(2)} />
                </div>
              </div>
              <div className="bloomberg-border p-4">
                <div className="text-gray-600 text-xs mb-2 uppercase tracking-wider">League Totals</div>
                <div className="space-y-2">
                  <StatRow label="Total K" value={env.lgK.toLocaleString()} />
                  <StatRow label="Total BB" value={env.lgBB.toLocaleString()} />
                  <StatRow label="Total HR" value={env.lgHR.toLocaleString()} />
                  <StatRow label="Total IP" value={env.lgIP.toFixed(0)} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className="text-orange-300 text-sm font-bold tabular-nums">{value}</span>
    </div>
  );
}
