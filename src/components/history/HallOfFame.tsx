import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { HOFCandidate, AllTimeLeader, CareerStat, FranchiseRecord } from '../../engine/history/careerStats';
import type { AwardHistoryEntry, ChampionHistoryEntry } from '../../engine/history/awardsHistory';

type SubTab = 'hof' | 'alltime' | 'franchise' | 'champions';

const HITTING_STATS: Array<{ id: CareerStat; label: string }> = [
  { id: 'h', label: 'Hits' },
  { id: 'hr', label: 'Home Runs' },
  { id: 'rbi', label: 'RBI' },
  { id: 'r', label: 'Runs' },
  { id: 'sb', label: 'Stolen Bases' },
  { id: 'avg', label: 'Batting Avg' },
];

const PITCHING_STATS: Array<{ id: CareerStat; label: string }> = [
  { id: 'w', label: 'Wins' },
  { id: 'ka', label: 'Strikeouts' },
  { id: 'sv', label: 'Saves' },
  { id: 'era', label: 'ERA' },
];

function HOFScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, score);
  const color = score >= 75 ? 'bg-yellow-500' : score >= 50 ? 'bg-orange-500' : score >= 30 ? 'bg-blue-500' : 'bg-gray-600';
  return (
    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function VotePctRing({ pct }: { pct: number }) {
  const color = pct >= 75 ? 'text-green-400' : pct >= 50 ? 'text-yellow-400' : 'text-gray-500';
  return (
    <div className="flex items-center gap-1">
      <span className={`font-bold tabular-nums ${color}`}>{pct}%</span>
      {pct >= 75 && <span className="text-yellow-400 text-[10px]">IN</span>}
    </div>
  );
}

export default function HallOfFame() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [tab, setTab] = useState<SubTab>('hof');
  const [hofCandidates, setHofCandidates] = useState<HOFCandidate[]>([]);
  const [leaders, setLeaders] = useState<AllTimeLeader[]>([]);
  const [leaderStat, setLeaderStat] = useState<CareerStat>('hr');
  const [franchiseRecords, setFranchiseRecords] = useState<FranchiseRecord[]>([]);
  const [awards, setAwards] = useState<AwardHistoryEntry[]>([]);
  const [champions, setChampions] = useState<ChampionHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    if (tab === 'hof') {
      setLoading(true);
      getEngine().getHOFCandidates()
        .then(setHofCandidates)
        .finally(() => setLoading(false));
    }
    if (tab === 'champions') {
      setLoading(true);
      Promise.all([
        getEngine().getAwardHistory(),
        getEngine().getChampionHistory(),
      ]).then(([a, c]) => {
        setAwards(a);
        setChampions(c);
      }).finally(() => setLoading(false));
    }
  }, [gameStarted, tab]);

  useEffect(() => {
    if (!gameStarted || tab !== 'alltime') return;
    setLoading(true);
    getEngine().getAllTimeLeaders(leaderStat, 25)
      .then(setLeaders)
      .finally(() => setLoading(false));
  }, [gameStarted, tab, leaderStat]);

  useEffect(() => {
    if (!gameStarted || tab !== 'franchise') return;
    setLoading(true);
    const userTeamId = useGameStore.getState().userTeamId;
    if (userTeamId == null) return;
    getEngine().getFranchiseRecords(userTeamId)
      .then(setFranchiseRecords)
      .finally(() => setLoading(false));
  }, [gameStarted, tab]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const tabs: Array<{ id: SubTab; label: string }> = [
    { id: 'hof', label: 'HALL OF FAME' },
    { id: 'alltime', label: 'ALL-TIME LEADERS' },
    { id: 'franchise', label: 'FRANCHISE RECORDS' },
    { id: 'champions', label: 'CHAMPIONS & AWARDS' },
  ];

  const inducted = hofCandidates.filter(c => c.inducted);
  const ballot = hofCandidates.filter(c => !c.inducted);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>RECORD BOOK</span>
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
          {/* ── Hall of Fame ── */}
          {tab === 'hof' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bloomberg-border px-3 py-2 text-center">
                  <div className="text-gray-500 text-[10px]">INDUCTED</div>
                  <div className="text-yellow-400 font-bold text-xl tabular-nums">{inducted.length}</div>
                </div>
                <div className="bloomberg-border px-3 py-2 text-center">
                  <div className="text-gray-500 text-[10px]">ON BALLOT</div>
                  <div className="text-orange-400 font-bold text-xl tabular-nums">{ballot.length}</div>
                </div>
                <div className="bloomberg-border px-3 py-2 text-center">
                  <div className="text-gray-500 text-[10px]">HIGHEST SCORE</div>
                  <div className="text-green-400 font-bold text-xl tabular-nums">
                    {hofCandidates.length > 0 ? Math.max(...hofCandidates.map(c => c.hofScore)) : '—'}
                  </div>
                </div>
              </div>

              {inducted.length > 0 && (
                <div className="bloomberg-border">
                  <div className="bloomberg-header">INDUCTED MEMBERS ({inducted.length})</div>
                  <div className="max-h-[20rem] overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                          <th className="px-2 py-1 text-left">PLAYER</th>
                          <th className="px-2 py-1">POS</th>
                          <th className="px-2 py-1">YRS</th>
                          <th className="px-2 py-1 text-left">KEY STATS</th>
                          <th className="px-2 py-1">SCORE</th>
                          <th className="px-2 py-1 text-right">VOTE %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inducted.sort((a, b) => b.hofScore - a.hofScore).map(c => (
                          <tr key={c.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => goToPlayer(c.playerId)}>
                            <td className="px-2 py-1 font-bold text-yellow-400">{c.name}</td>
                            <td className="px-2 py-1 text-gray-500 text-center">{c.position}</td>
                            <td className="px-2 py-1 tabular-nums text-center text-gray-400">{c.seasons}</td>
                            <td className="px-2 py-1 text-gray-300 font-mono text-xs">{c.keyStats}</td>
                            <td className="px-2 py-1">
                              <div className="flex items-center gap-1 justify-center">
                                <HOFScoreBar score={c.hofScore} />
                                <span className="tabular-nums text-orange-400 font-bold w-6 text-right">{c.hofScore}</span>
                              </div>
                            </td>
                            <td className="px-2 py-1 text-right"><VotePctRing pct={c.votePct} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="bloomberg-border">
                <div className="bloomberg-header">
                  {ballot.length > 0 ? `ON THE BALLOT (${ballot.length})` : 'HALL OF FAME'}
                </div>
                <div className="max-h-[24rem] overflow-y-auto">
                  {ballot.length === 0 && inducted.length === 0 ? (
                    <div className="px-4 py-8 text-gray-600 text-xs text-center">
                      No HOF candidates yet. Play more seasons to see retired players evaluated.
                    </div>
                  ) : ballot.length === 0 ? (
                    <div className="px-4 py-4 text-gray-600 text-xs text-center">
                      No active ballot candidates.
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                          <th className="px-2 py-1 text-left">PLAYER</th>
                          <th className="px-2 py-1">POS</th>
                          <th className="px-2 py-1">YRS</th>
                          <th className="px-2 py-1 text-left">KEY STATS</th>
                          <th className="px-2 py-1">SCORE</th>
                          <th className="px-2 py-1 text-right">VOTE %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ballot.sort((a, b) => b.hofScore - a.hofScore).map(c => (
                          <tr key={c.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => goToPlayer(c.playerId)}>
                            <td className="px-2 py-1 font-bold text-orange-300">{c.name}</td>
                            <td className="px-2 py-1 text-gray-500 text-center">{c.position}</td>
                            <td className="px-2 py-1 tabular-nums text-center text-gray-400">{c.seasons}</td>
                            <td className="px-2 py-1 text-gray-300 font-mono text-xs">{c.keyStats}</td>
                            <td className="px-2 py-1">
                              <div className="flex items-center gap-1 justify-center">
                                <HOFScoreBar score={c.hofScore} />
                                <span className="tabular-nums text-orange-400 font-bold w-6 text-right">{c.hofScore}</span>
                              </div>
                            </td>
                            <td className="px-2 py-1 text-right"><VotePctRing pct={c.votePct} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── All-Time Leaders ── */}
          {tab === 'alltime' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="bloomberg-border flex-1">
                  <div className="bloomberg-header">HITTING</div>
                  <div className="flex flex-wrap gap-1 p-2">
                    {HITTING_STATS.map(s => (
                      <button key={s.id} onClick={() => setLeaderStat(s.id)}
                        className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                          leaderStat === s.id
                            ? 'bg-orange-600 text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bloomberg-border flex-1">
                  <div className="bloomberg-header">PITCHING</div>
                  <div className="flex flex-wrap gap-1 p-2">
                    {PITCHING_STATS.map(s => (
                      <button key={s.id} onClick={() => setLeaderStat(s.id)}
                        className={`text-xs font-bold px-2 py-1 rounded transition-colors ${
                          leaderStat === s.id
                            ? 'bg-orange-600 text-black'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bloomberg-border">
                <div className="bloomberg-header">
                  ALL-TIME {(HITTING_STATS.find(s => s.id === leaderStat) ?? PITCHING_STATS.find(s => s.id === leaderStat))?.label.toUpperCase()} LEADERS
                </div>
                <div className="max-h-[32rem] overflow-y-auto">
                  {leaders.length === 0 ? (
                    <div className="px-4 py-8 text-gray-600 text-xs text-center">
                      No career data yet. Play more seasons.
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                          <th className="px-2 py-1 text-right w-8">#</th>
                          <th className="px-2 py-1 text-left">PLAYER</th>
                          <th className="px-2 py-1 text-right">VALUE</th>
                          <th className="px-2 py-1 text-right">SEASONS</th>
                          <th className="px-2 py-1 text-center">HOF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaders.map(l => (
                          <tr key={l.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => goToPlayer(l.playerId)}>
                            <td className="px-2 py-1 text-right tabular-nums text-gray-600">{l.rank}</td>
                            <td className="px-2 py-1 font-bold text-orange-300">{l.name}</td>
                            <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{l.display}</td>
                            <td className="px-2 py-1 text-right tabular-nums text-gray-400">{l.seasons}</td>
                            <td className="px-2 py-1 text-center">
                              {l.hofInducted && <span className="text-yellow-400 font-bold">HOF</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Franchise Records ── */}
          {tab === 'franchise' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Single-season records */}
                <div className="bloomberg-border">
                  <div className="bloomberg-header text-blue-400">SINGLE-SEASON RECORDS</div>
                  <div className="max-h-[30rem] overflow-y-auto">
                    {franchiseRecords.filter(r => r.type === 'single_season').length === 0 ? (
                      <div className="px-4 py-8 text-gray-600 text-xs text-center">No records yet.</div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                            <th className="px-2 py-1 text-left">STAT</th>
                            <th className="px-2 py-1 text-left">PLAYER</th>
                            <th className="px-2 py-1 text-right">VALUE</th>
                            <th className="px-2 py-1 text-right">YEAR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {franchiseRecords.filter(r => r.type === 'single_season').map((r, idx) => (
                            <tr key={idx} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                              onClick={() => goToPlayer(r.playerId)}>
                              <td className="px-2 py-1 font-bold text-blue-400">{r.stat}</td>
                              <td className="px-2 py-1 text-orange-300 font-bold">{r.name}</td>
                              <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{r.display}</td>
                              <td className="px-2 py-1 text-right tabular-nums text-gray-500">{r.season ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Career records */}
                <div className="bloomberg-border">
                  <div className="bloomberg-header text-purple-400">CAREER RECORDS</div>
                  <div className="max-h-[30rem] overflow-y-auto">
                    {franchiseRecords.filter(r => r.type === 'career').length === 0 ? (
                      <div className="px-4 py-8 text-gray-600 text-xs text-center">
                        Career records tracked over multiple seasons.
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                            <th className="px-2 py-1 text-left">STAT</th>
                            <th className="px-2 py-1 text-left">PLAYER</th>
                            <th className="px-2 py-1 text-right">VALUE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {franchiseRecords.filter(r => r.type === 'career').map((r, idx) => (
                            <tr key={idx} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                              onClick={() => goToPlayer(r.playerId)}>
                              <td className="px-2 py-1 font-bold text-purple-400">{r.stat}</td>
                              <td className="px-2 py-1 text-orange-300 font-bold">{r.name}</td>
                              <td className="px-2 py-1 text-right tabular-nums font-bold text-orange-400">{r.display}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Champions & Awards ── */}
          {tab === 'champions' && (
            <div className="space-y-4">
              {/* Championships */}
              {champions.length > 0 && (
                <div className="bloomberg-border">
                  <div className="bloomberg-header text-yellow-400">WORLD SERIES CHAMPIONS ({champions.length})</div>
                  <div className="max-h-[16rem] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-0 divide-x divide-gray-800">
                      {champions.sort((a, b) => b.season - a.season).map(c => (
                        <div key={c.season} className="px-3 py-2 flex items-center justify-between hover:bg-gray-800/30">
                          <div>
                            <span className="text-yellow-400 font-bold text-sm">{c.season}</span>
                            <span className="text-gray-300 ml-2 text-xs font-bold">{c.teamName}</span>
                            <span className="text-gray-600 ml-1 text-xs">({c.record})</span>
                          </div>
                          {c.mvpName && (
                            <span className="text-gray-500 text-[10px]">MVP: <span className="text-orange-300">{c.mvpName}</span></span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Award history by season */}
              {awards.length > 0 && (() => {
                const seasons = [...new Set(awards.map(a => a.season))].sort((a, b) => b - a);
                return (
                  <div className="bloomberg-border">
                    <div className="bloomberg-header">AWARD WINNERS BY SEASON</div>
                    <div className="max-h-[28rem] overflow-y-auto">
                      {seasons.map(s => {
                        const seasonAwards = awards.filter(a => a.season === s);
                        return (
                          <div key={s} className="border-b border-gray-800/50">
                            <div className="px-3 py-1.5 bg-gray-900/50 text-gray-500 text-xs font-bold">{s}</div>
                            {seasonAwards.map((a, i) => (
                              <div key={i}
                                className="flex items-center gap-2 px-3 py-1 text-xs hover:bg-gray-800/30 cursor-pointer"
                                onClick={() => goToPlayer(a.playerId)}>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  a.award.includes('MVP') ? 'bg-yellow-900/40 text-yellow-400' :
                                  a.award.includes('Cy Young') ? 'bg-blue-900/40 text-blue-400' :
                                  'bg-green-900/40 text-green-400'
                                }`}>{a.award}</span>
                                <span className="text-orange-300 font-bold">{a.name}</span>
                                <span className="text-gray-600">{a.teamName}</span>
                                <span className="text-gray-500 ml-auto font-mono text-[10px]">{a.statLine}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {champions.length === 0 && awards.length === 0 && (
                <div className="px-4 py-8 text-gray-600 text-xs text-center">
                  No award history yet. Play some seasons first.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
