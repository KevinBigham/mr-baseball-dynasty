import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { ProspectReport } from '../../engine/scouting/prospectRankings';

function GradeBadge({ grade }: { grade: number }) {
  const color =
    grade >= 70 ? '#4ade80' :
    grade >= 60 ? '#22d3ee' :
    grade >= 50 ? '#fbbf24' :
    grade >= 40 ? '#94a3b8' : '#6b7280';
  return <span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>{grade}</span>;
}

function RiskBadge({ risk }: { risk: string }) {
  const colors: Record<string, string> = {
    Low: '#4ade80',
    Medium: '#fbbf24',
    High: '#fb923c',
    Extreme: '#ef4444',
  };
  return (
    <span className="px-1 py-0.5 text-xs font-bold rounded" style={{
      background: `${colors[risk] ?? '#6b7280'}15`,
      color: colors[risk] ?? '#6b7280',
    }}>
      {risk}
    </span>
  );
}

function CeilingBadge({ ceiling }: { ceiling: string }) {
  const colors: Record<string, string> = {
    Superstar: '#f59e0b',
    'All-Star': '#4ade80',
    'Above Average': '#22d3ee',
    Average: '#94a3b8',
    Bench: '#6b7280',
    Organizational: '#4b5563',
  };
  return (
    <span className="text-xs font-bold" style={{ color: colors[ceiling] ?? '#6b7280' }}>
      {ceiling}
    </span>
  );
}

function FVBadge({ fv }: { fv: number }) {
  const color =
    fv >= 70 ? '#f59e0b' :
    fv >= 60 ? '#4ade80' :
    fv >= 55 ? '#22d3ee' :
    fv >= 50 ? '#fbbf24' :
    fv >= 45 ? '#94a3b8' : '#6b7280';
  return (
    <span className="px-1.5 py-0.5 text-xs font-bold rounded font-mono tabular-nums" style={{
      background: `${color}15`, color,
    }}>
      {fv}
    </span>
  );
}

export default function ProspectRankingsView() {
  const { gameStarted, userTeamId } = useGameStore();
  const [tab, setTab] = useState<'league' | 'org'>('org');
  const [prospects, setProspects] = useState<ProspectReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<ProspectReport | null>(null);

  const loadProspects = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    if (tab === 'league') {
      const result = await getEngine().getLeagueProspects();
      setProspects(result);
    } else {
      const result = await getEngine().getOrgProspects(userTeamId);
      setProspects(result);
    }
    setLoading(false);
  }, [gameStarted, tab, userTeamId]);

  useEffect(() => { loadProspects(); }, [loadProspects]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PROSPECT RANKINGS</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('org')}
            className={`text-xs font-bold px-3 py-1 uppercase tracking-wider transition-colors ${
              tab === 'org' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>MY ORG</button>
          <button onClick={() => setTab('league')}
            className={`text-xs font-bold px-3 py-1 uppercase tracking-wider transition-colors ${
              tab === 'league' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>TOP 100</button>
        </div>
      </div>

      {loading ? (
        <div className="text-orange-400 text-xs animate-pulse">Loading prospects...</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Rankings table */}
          <div className="col-span-2 bloomberg-border">
            <div className="bloomberg-header">
              {tab === 'league' ? 'LEAGUE TOP 100 PROSPECTS' : 'ORGANIZATION TOP 30'}
            </div>
            <div className="max-h-[32rem] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                    <th className="px-2 py-1 text-left">#</th>
                    <th className="px-2 py-1 text-left">NAME</th>
                    <th className="px-2 py-1">POS</th>
                    <th className="px-2 py-1">AGE</th>
                    {tab === 'league' && <th className="px-2 py-1 text-left">TEAM</th>}
                    <th className="px-2 py-1">LVL</th>
                    <th className="px-2 py-1">FV</th>
                    <th className="px-2 py-1">OVR</th>
                    <th className="px-2 py-1">POT</th>
                    <th className="px-2 py-1">RISK</th>
                    <th className="px-2 py-1 text-left">CEILING</th>
                    <th className="px-2 py-1">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map(p => (
                    <tr
                      key={p.playerId}
                      className={`text-xs transition-colors cursor-pointer ${
                        selected?.playerId === p.playerId ? 'bg-orange-900/20' : 'hover:bg-gray-800/50'
                      }`}
                      onClick={() => setSelected(p)}
                    >
                      <td className="px-2 py-1 text-gray-500 font-bold">{tab === 'league' ? p.overallRank : p.orgRank}</td>
                      <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
                      <td className="px-2 py-1 text-gray-500 text-center">{p.position}</td>
                      <td className="px-2 py-1 tabular-nums text-center">{p.age}</td>
                      {tab === 'league' && (
                        <td className="px-2 py-1 text-blue-300 text-xs">{p.teamName}</td>
                      )}
                      <td className="px-2 py-1 text-center">
                        <span className="text-gray-500 text-xs">{p.level}</span>
                      </td>
                      <td className="px-2 py-1 text-center"><FVBadge fv={p.fv} /></td>
                      <td className="px-2 py-1 text-center"><GradeBadge grade={p.grades.overall} /></td>
                      <td className="px-2 py-1 text-center tabular-nums text-gray-600">{p.grades.potential}</td>
                      <td className="px-2 py-1 text-center"><RiskBadge risk={p.risk} /></td>
                      <td className="px-2 py-1"><CeilingBadge ceiling={p.ceiling} /></td>
                      <td className="px-2 py-1 text-gray-400 text-center tabular-nums">{p.eta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          <div className="bloomberg-border">
            <div className="bloomberg-header">SCOUTING REPORT</div>
            <div className="p-3">
              {selected ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-orange-400 font-bold text-sm">{selected.name}</div>
                    <div className="text-gray-500 text-xs">
                      {selected.position} / Age {selected.age} / {selected.level}
                    </div>
                    <div className="text-blue-300 text-xs">{selected.teamName}</div>
                  </div>

                  {/* FV + Ceiling + Risk */}
                  <div className="border-t border-gray-800 pt-2 grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-gray-600 text-xs">FV</div>
                      <FVBadge fv={selected.fv} />
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 text-xs">Ceiling</div>
                      <CeilingBadge ceiling={selected.ceiling} />
                    </div>
                    <div className="text-center">
                      <div className="text-gray-600 text-xs">Risk</div>
                      <RiskBadge risk={selected.risk} />
                    </div>
                  </div>

                  {/* Tool grades */}
                  <div className="border-t border-gray-800 pt-2">
                    <div className="text-gray-500 text-xs font-bold mb-1">TOOL GRADES</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {selected.isPitcher ? (
                        <>
                          {selected.grades.stuff != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Stuff</span><GradeBadge grade={selected.grades.stuff} /></div>
                          )}
                          {selected.grades.movement != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Movement</span><GradeBadge grade={selected.grades.movement} /></div>
                          )}
                          {selected.grades.command != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Command</span><GradeBadge grade={selected.grades.command} /></div>
                          )}
                          {selected.grades.stamina != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Stamina</span><GradeBadge grade={selected.grades.stamina} /></div>
                          )}
                        </>
                      ) : (
                        <>
                          {selected.grades.hit != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Hit</span><GradeBadge grade={selected.grades.hit} /></div>
                          )}
                          {selected.grades.power != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Power</span><GradeBadge grade={selected.grades.power} /></div>
                          )}
                          {selected.grades.eye != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Eye</span><GradeBadge grade={selected.grades.eye} /></div>
                          )}
                          {selected.grades.speed != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Speed</span><GradeBadge grade={selected.grades.speed} /></div>
                          )}
                          {selected.grades.field != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Field</span><GradeBadge grade={selected.grades.field} /></div>
                          )}
                          {selected.grades.arm != null && (
                            <div className="flex justify-between text-xs"><span className="text-gray-500">Arm</span><GradeBadge grade={selected.grades.arm} /></div>
                          )}
                        </>
                      )}
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Overall</span><GradeBadge grade={selected.grades.overall} /></div>
                      <div className="flex justify-between text-xs"><span className="text-gray-500">Potential</span><GradeBadge grade={selected.grades.potential} /></div>
                    </div>
                  </div>

                  {/* ETA */}
                  <div className="border-t border-gray-800 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">ETA</span>
                      <span className="text-orange-400 font-bold">{selected.eta}</span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t border-gray-800 pt-2">
                    <div className="text-gray-400 text-xs italic">&ldquo;{selected.summary}&rdquo;</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-600 text-xs">Select a prospect to view their scouting report.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
