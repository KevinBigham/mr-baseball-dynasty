import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { HOFCandidate, AllTimeLeader, CareerStat, FranchiseRecord } from '../../engine/history/careerStats';

type SubTab = 'hof' | 'alltime' | 'franchise';

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

export default function HallOfFame() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [tab, setTab] = useState<SubTab>('hof');
  const [hofCandidates, setHofCandidates] = useState<HOFCandidate[]>([]);
  const [leaders, setLeaders] = useState<AllTimeLeader[]>([]);
  const [leaderStat, setLeaderStat] = useState<CareerStat>('hr');
  const [franchiseRecords, setFranchiseRecords] = useState<FranchiseRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    if (tab === 'hof') {
      setLoading(true);
      getEngine().getHOFCandidates()
        .then(setHofCandidates)
        .finally(() => setLoading(false));
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
              {inducted.length > 0 && (
                <div className="bloomberg-border">
                  <div className="bloomberg-header">INDUCTED MEMBERS ({inducted.length})</div>
                  <div className="max-h-[20rem] overflow-y-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                          <th className="px-2 py-1 text-left">PLAYER</th>
                          <th className="px-2 py-1">POS</th>
                          <th className="px-2 py-1">SEASONS</th>
                          <th className="px-2 py-1 text-left">KEY STATS</th>
                          <th className="px-2 py-1 text-right">SCORE</th>
                          <th className="px-2 py-1 text-right">VOTE %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inducted.map(c => (
                          <tr key={c.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => goToPlayer(c.playerId)}>
                            <td className="px-2 py-1 font-bold text-yellow-400">{c.name}</td>
                            <td className="px-2 py-1 text-gray-500 text-center">{c.position}</td>
                            <td className="px-2 py-1 tabular-nums text-center text-gray-400">{c.seasons}</td>
                            <td className="px-2 py-1 text-gray-300 font-mono text-xs">{c.keyStats}</td>
                            <td className="px-2 py-1 tabular-nums text-right text-orange-400 font-bold">{c.hofScore}</td>
                            <td className="px-2 py-1 tabular-nums text-right text-green-400">{c.votePct}%</td>
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
                          <th className="px-2 py-1">SEASONS</th>
                          <th className="px-2 py-1 text-left">KEY STATS</th>
                          <th className="px-2 py-1 text-right">SCORE</th>
                          <th className="px-2 py-1 text-right">VOTE %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ballot.map(c => (
                          <tr key={c.playerId} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                            onClick={() => goToPlayer(c.playerId)}>
                            <td className="px-2 py-1 font-bold text-orange-300">{c.name}</td>
                            <td className="px-2 py-1 text-gray-500 text-center">{c.position}</td>
                            <td className="px-2 py-1 tabular-nums text-center text-gray-400">{c.seasons}</td>
                            <td className="px-2 py-1 text-gray-300 font-mono text-xs">{c.keyStats}</td>
                            <td className="px-2 py-1 tabular-nums text-right text-orange-400 font-bold">{c.hofScore}</td>
                            <td className="px-2 py-1 tabular-nums text-right">
                              <span className={c.votePct >= 75 ? 'text-green-400' : c.votePct >= 50 ? 'text-yellow-400' : 'text-gray-500'}>
                                {c.votePct}%
                              </span>
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
            <div className="bloomberg-border">
              <div className="bloomberg-header">YOUR FRANCHISE RECORDS</div>
              <div className="max-h-[36rem] overflow-y-auto">
                {franchiseRecords.length === 0 ? (
                  <div className="px-4 py-8 text-gray-600 text-xs text-center">
                    No franchise records yet. Play a season first.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                        <th className="px-2 py-1 text-left">TYPE</th>
                        <th className="px-2 py-1 text-left">STAT</th>
                        <th className="px-2 py-1 text-left">PLAYER</th>
                        <th className="px-2 py-1 text-right">VALUE</th>
                        <th className="px-2 py-1 text-right">SEASON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {franchiseRecords.map((r, idx) => (
                        <tr key={idx} className="text-xs hover:bg-gray-800/50 cursor-pointer"
                          onClick={() => goToPlayer(r.playerId)}>
                          <td className="px-2 py-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                              r.type === 'single_season'
                                ? 'bg-blue-900/30 text-blue-400'
                                : 'bg-purple-900/30 text-purple-400'
                            }`}>
                              {r.type === 'single_season' ? 'SEASON' : 'CAREER'}
                            </span>
                          </td>
                          <td className="px-2 py-1 font-bold text-gray-300">{r.stat}</td>
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
          )}
        </>
      )}
    </div>
  );
}
