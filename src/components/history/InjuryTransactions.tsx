import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { Injury } from '../../engine/injuries/injuryEngine';
import type { AwardHistoryEntry, ChampionHistoryEntry, TransactionLog, SeasonMilestone } from '../../engine/history/awardsHistory';
import type { ArbitrationCase } from '../../engine/offseason/arbitration';
import type { Rule5Selection } from '../../engine/offseason/rule5Draft';

type SubTab = 'injuries' | 'transactions' | 'awards' | 'milestones' | 'arbitration' | 'rule5';

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    day_to_day: '#fbbf24',
    il_10: '#fb923c',
    il_60: '#ef4444',
    season_ending: '#dc2626',
  };
  const labels: Record<string, string> = {
    day_to_day: 'DTD',
    il_10: '10-IL',
    il_60: '60-IL',
    season_ending: 'OUT',
  };
  return (
    <span className="px-1.5 py-0.5 text-xs font-bold rounded" style={{
      background: `${colors[severity] ?? '#6b7280'}15`,
      color: colors[severity] ?? '#6b7280',
    }}>
      {labels[severity] ?? severity}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    Trade: '#60a5fa',
    Signing: '#4ade80',
    Draft: '#fbbf24',
    DFA: '#ef4444',
    'Rule 5': '#a78bfa',
    'Intl Signing': '#22d3ee',
    Arbitration: '#fb923c',
  };
  return (
    <span className="px-1.5 py-0.5 text-xs font-bold rounded" style={{
      background: `${colors[type] ?? '#6b7280'}15`,
      color: colors[type] ?? '#6b7280',
    }}>
      {type.toUpperCase()}
    </span>
  );
}

export default function InjuryTransactions() {
  const { gameStarted } = useGameStore();
  const [tab, setTab] = useState<SubTab>('injuries');
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  const [awardHistory, setAwardHistory] = useState<AwardHistoryEntry[]>([]);
  const [champions, setChampions] = useState<ChampionHistoryEntry[]>([]);
  const [milestones, setMilestones] = useState<SeasonMilestone[]>([]);
  const [arbCases, setArbCases] = useState<ArbitrationCase[]>([]);
  const [rule5Picks, setRule5Picks] = useState<Rule5Selection[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const engine = getEngine();
    const [inj, txns, awards, champs, mils, arb, r5] = await Promise.all([
      engine.getInjuryReport(),
      engine.getTransactionLog(),
      engine.getAwardHistory(),
      engine.getChampionHistory(),
      engine.getMilestones(),
      engine.getArbitrationHistory(),
      engine.getRule5History(),
    ]);
    setInjuries(inj);
    setTransactions(txns);
    setAwardHistory(awards);
    setChampions(champs);
    setMilestones(mils);
    setArbCases(arb);
    setRule5Picks(r5);
    setLoading(false);
  }, [gameStarted]);

  useEffect(() => { loadData(); }, [loadData]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const tabs: Array<{ id: SubTab; label: string }> = [
    { id: 'injuries', label: 'INJURIES' },
    { id: 'transactions', label: 'TRANSACTIONS' },
    { id: 'awards', label: 'AWARDS' },
    { id: 'milestones', label: 'MILESTONES' },
    { id: 'arbitration', label: 'ARBITRATION' },
    { id: 'rule5', label: 'RULE 5' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>HISTORY & TRANSACTIONS</span>
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
        <div className="text-orange-400 text-xs animate-pulse">Loading data...</div>
      ) : (
        <>
          {/* ── Injuries ── */}
          {tab === 'injuries' && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">SEASON INJURY REPORT ({injuries.length} injuries)</div>
              <div className="max-h-[36rem] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                      <th className="px-2 py-1 text-left">PLAYER</th>
                      <th className="px-2 py-1">POS</th>
                      <th className="px-2 py-1 text-left">INJURY</th>
                      <th className="px-2 py-1">SEVERITY</th>
                      <th className="px-2 py-1">GAMES OUT</th>
                      <th className="px-2 py-1">GAME #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {injuries.length === 0 ? (
                      <tr><td colSpan={6} className="px-2 py-4 text-gray-600 text-xs text-center">No injuries recorded this season.</td></tr>
                    ) : injuries.map((inj, idx) => (
                      <tr key={`${inj.playerId}-${idx}`} className="text-xs hover:bg-gray-800/50">
                        <td className="px-2 py-1 font-bold text-orange-300">{inj.playerName}</td>
                        <td className="px-2 py-1 text-gray-500 text-center">{inj.isPitcher ? 'P' : 'H'}</td>
                        <td className="px-2 py-1 text-gray-400">{inj.type}</td>
                        <td className="px-2 py-1 text-center"><SeverityBadge severity={inj.severity} /></td>
                        <td className="px-2 py-1 text-center tabular-nums text-gray-400">{inj.gamesOut}</td>
                        <td className="px-2 py-1 text-center tabular-nums text-gray-600">{inj.gameOccurred}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Transactions ── */}
          {tab === 'transactions' && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">TRANSACTION LOG ({transactions.length} transactions)</div>
              <div className="max-h-[36rem] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                      <th className="px-2 py-1 text-left">SEASON</th>
                      <th className="px-2 py-1 text-left">DATE</th>
                      <th className="px-2 py-1">TYPE</th>
                      <th className="px-2 py-1 text-left">DESCRIPTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.length === 0 ? (
                      <tr><td colSpan={4} className="px-2 py-4 text-gray-600 text-xs text-center">No transactions recorded yet.</td></tr>
                    ) : transactions.map((t, idx) => (
                      <tr key={idx} className="text-xs hover:bg-gray-800/50">
                        <td className="px-2 py-1 tabular-nums text-gray-500">{t.season}</td>
                        <td className="px-2 py-1 text-gray-400">{t.date}</td>
                        <td className="px-2 py-1 text-center"><TypeBadge type={t.type} /></td>
                        <td className="px-2 py-1 text-gray-300">{t.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Awards ── */}
          {tab === 'awards' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bloomberg-border">
                <div className="bloomberg-header">AWARD WINNERS</div>
                <div className="max-h-[36rem] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                        <th className="px-2 py-1">SEASON</th>
                        <th className="px-2 py-1 text-left">AWARD</th>
                        <th className="px-2 py-1 text-left">PLAYER</th>
                        <th className="px-2 py-1 text-left">TEAM</th>
                        <th className="px-2 py-1 text-left">STAT LINE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {awardHistory.length === 0 ? (
                        <tr><td colSpan={5} className="px-2 py-4 text-gray-600 text-xs text-center">No awards recorded yet.</td></tr>
                      ) : awardHistory.map((a, idx) => (
                        <tr key={idx} className="text-xs hover:bg-gray-800/50">
                          <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{a.season}</td>
                          <td className="px-2 py-1 text-yellow-400 font-bold">{a.award}</td>
                          <td className="px-2 py-1 text-orange-300 font-bold">{a.name}</td>
                          <td className="px-2 py-1 text-blue-300">{a.teamName}</td>
                          <td className="px-2 py-1 text-gray-400 font-mono text-xs">{a.statLine}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bloomberg-border">
                <div className="bloomberg-header">CHAMPIONSHIP HISTORY</div>
                <div className="max-h-[36rem] overflow-y-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                        <th className="px-2 py-1">SEASON</th>
                        <th className="px-2 py-1 text-left">CHAMPION</th>
                        <th className="px-2 py-1">RECORD</th>
                        <th className="px-2 py-1 text-left">WS MVP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {champions.length === 0 ? (
                        <tr><td colSpan={4} className="px-2 py-4 text-gray-600 text-xs text-center">No champions yet.</td></tr>
                      ) : champions.map((c, idx) => (
                        <tr key={idx} className="text-xs hover:bg-gray-800/50">
                          <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{c.season}</td>
                          <td className="px-2 py-1 text-yellow-400 font-bold">{c.teamName}</td>
                          <td className="px-2 py-1 text-gray-400 tabular-nums text-center">{c.record}</td>
                          <td className="px-2 py-1 text-orange-300">{c.mvpName ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Milestones ── */}
          {tab === 'milestones' && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">CAREER MILESTONES</div>
              <div className="max-h-[36rem] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                      <th className="px-2 py-1">SEASON</th>
                      <th className="px-2 py-1 text-left">PLAYER</th>
                      <th className="px-2 py-1 text-left">MILESTONE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {milestones.length === 0 ? (
                      <tr><td colSpan={3} className="px-2 py-4 text-gray-600 text-xs text-center">No milestones reached yet.</td></tr>
                    ) : milestones.map((m, idx) => (
                      <tr key={idx} className="text-xs hover:bg-gray-800/50">
                        <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{m.season}</td>
                        <td className="px-2 py-1 text-orange-300 font-bold">{m.name}</td>
                        <td className="px-2 py-1 text-yellow-400 font-bold">{m.milestone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Arbitration ── */}
          {tab === 'arbitration' && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">ARBITRATION RESULTS ({arbCases.length} cases)</div>
              <div className="max-h-[36rem] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                      <th className="px-2 py-1 text-left">PLAYER</th>
                      <th className="px-2 py-1">POS</th>
                      <th className="px-2 py-1">AGE</th>
                      <th className="px-2 py-1">SVC</th>
                      <th className="px-2 py-1">ARB YR</th>
                      <th className="px-2 py-1 text-right">PLAYER FILED</th>
                      <th className="px-2 py-1 text-right">TEAM FILED</th>
                      <th className="px-2 py-1 text-right">RESULT</th>
                      <th className="px-2 py-1">OUTCOME</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arbCases.length === 0 ? (
                      <tr><td colSpan={9} className="px-2 py-4 text-gray-600 text-xs text-center">No arbitration cases yet.</td></tr>
                    ) : arbCases.map((c, idx) => (
                      <tr key={idx} className="text-xs hover:bg-gray-800/50">
                        <td className="px-2 py-1 font-bold text-orange-300">{c.name}</td>
                        <td className="px-2 py-1 text-gray-500 text-center">{c.position}</td>
                        <td className="px-2 py-1 tabular-nums text-center">{c.age}</td>
                        <td className="px-2 py-1 tabular-nums text-center text-gray-400">{c.serviceYears}</td>
                        <td className="px-2 py-1 tabular-nums text-center text-gray-400">{c.arbYear}{c.isSuperTwo ? '*' : ''}</td>
                        <td className="px-2 py-1 tabular-nums text-right text-green-400">${(c.playerFiling / 1_000_000).toFixed(1)}M</td>
                        <td className="px-2 py-1 tabular-nums text-right text-red-400">${(c.teamFiling / 1_000_000).toFixed(1)}M</td>
                        <td className="px-2 py-1 tabular-nums text-right text-orange-400 font-bold">${(c.projectedSalary / 1_000_000).toFixed(1)}M</td>
                        <td className="px-2 py-1 text-center">
                          {c.isSettled ? (
                            <span className="text-gray-400">Settled</span>
                          ) : (
                            <span className={c.playerWon ? 'text-green-400' : 'text-red-400'}>
                              {c.playerWon ? 'Player Won' : 'Team Won'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Rule 5 ── */}
          {tab === 'rule5' && (
            <div className="bloomberg-border">
              <div className="bloomberg-header">RULE 5 DRAFT SELECTIONS ({rule5Picks.length} picks)</div>
              <div className="max-h-[36rem] overflow-y-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                      <th className="px-2 py-1 text-left">PLAYER</th>
                      <th className="px-2 py-1">POS</th>
                      <th className="px-2 py-1 text-left">FROM</th>
                      <th className="px-2 py-1 text-left">TO</th>
                      <th className="px-2 py-1">OVR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rule5Picks.length === 0 ? (
                      <tr><td colSpan={5} className="px-2 py-4 text-gray-600 text-xs text-center">No Rule 5 selections yet.</td></tr>
                    ) : rule5Picks.map((r, idx) => (
                      <tr key={idx} className="text-xs hover:bg-gray-800/50">
                        <td className="px-2 py-1 font-bold text-orange-300">{r.playerName}</td>
                        <td className="px-2 py-1 text-gray-500 text-center">{r.position}</td>
                        <td className="px-2 py-1 text-red-400">{r.fromTeamName}</td>
                        <td className="px-2 py-1 text-green-400">{r.toTeamName}</td>
                        <td className="px-2 py-1 tabular-nums text-center text-gray-400">{r.overall}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
