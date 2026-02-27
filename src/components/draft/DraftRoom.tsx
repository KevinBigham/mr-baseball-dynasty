import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { DraftProspect, DraftState } from '../../engine/draft/draftEngine';

function GradeBadge({ grade }: { grade: number }) {
  const color =
    grade >= 70 ? '#4ade80' :
    grade >= 60 ? '#22d3ee' :
    grade >= 50 ? '#fbbf24' :
    grade >= 40 ? '#94a3b8' : '#6b7280';
  return <span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>{grade}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    college: '#60a5fa',
    high_school: '#fb923c',
    intl_amateur: '#a78bfa',
  };
  const labels: Record<string, string> = {
    college: 'COL',
    high_school: 'HS',
    intl_amateur: 'INTL',
  };
  return (
    <span className="px-1.5 py-0.5 text-xs font-bold rounded" style={{
      background: `${colors[type] ?? '#6b7280'}20`,
      color: colors[type] ?? '#6b7280',
    }}>
      {labels[type] ?? type}
    </span>
  );
}

export default function DraftRoom() {
  const { gameStarted, userTeamId } = useGameStore();
  const [draftState, setDraftState] = useState<DraftState | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<DraftProspect | null>(null);
  const [msg, setMsg] = useState<{ text: string; color: string } | null>(null);
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [autoPicking, setAutoPicking] = useState(false);

  const loadDraft = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const state = await getEngine().getDraftState();
    setDraftState(state);
    setLoading(false);
  }, [gameStarted]);

  useEffect(() => { loadDraft(); }, [loadDraft]);

  const isUserPick = draftState && !draftState.completed && draftState.currentPick < draftState.picks.length
    ? draftState.picks[draftState.currentPick].teamId === userTeamId
    : false;

  const currentPick = draftState?.picks[draftState.currentPick] ?? null;

  const handleDraftPlayer = async (prospectId: number) => {
    if (!draftState || !isUserPick) return;
    const result = await getEngine().makeDraftPick(prospectId);
    if (result.ok) {
      const prospect = draftState.prospects.find(p => p.prospectId === prospectId);
      setMsg({ text: `Drafted ${prospect?.name ?? 'player'} (Round ${currentPick?.round}, Pick ${currentPick?.pick})`, color: '#4ade80' });
      setSelectedProspect(null);
      loadDraft();
    } else {
      setMsg({ text: result.error ?? 'Failed to draft player.', color: '#ef4444' });
    }
    setTimeout(() => setMsg(null), 5000);
  };

  const handleSimToNextPick = async () => {
    if (!draftState) return;
    setAutoPicking(true);
    const result = await getEngine().simDraftToNextUserPick();
    setAutoPicking(false);
    if (result.completed) {
      setMsg({ text: 'Draft complete!', color: '#22d3ee' });
    }
    loadDraft();
    setTimeout(() => setMsg(null), 5000);
  };

  const handleStartDraft = async () => {
    setLoading(true);
    await getEngine().startDraft();
    loadDraft();
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading draft...</div>;

  // No draft started yet
  if (!draftState) {
    return (
      <div className="p-4 space-y-4">
        <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">AMATEUR DRAFT</div>
        <div className="bloomberg-border p-6 text-center space-y-4">
          <div className="text-gray-400 text-sm">The amateur draft has not started yet.</div>
          <div className="text-gray-600 text-xs">170 prospects from college, high school, and international pools are available.</div>
          <button
            onClick={handleStartDraft}
            className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs px-8 py-3 uppercase tracking-wider transition-colors"
          >
            START DRAFT
          </button>
        </div>
      </div>
    );
  }

  const available = draftState.prospects.filter(p => {
    // Not yet picked
    const picked = draftState.picks.some(pk => pk.prospectId === p.prospectId);
    if (picked) return false;
    if (posFilter !== 'ALL' && p.position !== posFilter) return false;
    if (typeFilter !== 'ALL' && p.draftType !== typeFilter) return false;
    return true;
  });

  const recentPicks = draftState.picks.filter(pk => pk.prospectId !== null).slice(-10).reverse();
  const positions = ['ALL', ...new Set(draftState.prospects.map(p => p.position))];

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>AMATEUR DRAFT</span>
        <div className="flex items-center gap-3">
          {!draftState.completed && currentPick && (
            <span className="text-gray-400 text-xs">
              Round {currentPick.round} — Pick {currentPick.pick} —{' '}
              <span className={isUserPick ? 'text-orange-400 font-bold' : 'text-blue-400'}>
                {isUserPick ? 'YOUR PICK' : currentPick.teamName}
              </span>
            </span>
          )}
          {draftState.completed && <span className="text-green-400 text-xs font-bold">DRAFT COMPLETE</span>}
        </div>
      </div>

      {msg && (
        <div className="px-3 py-2 rounded text-xs font-bold" style={{
          background: `${msg.color}12`, border: `1px solid ${msg.color}40`, color: msg.color,
        }}>{msg.text}</div>
      )}

      {/* Action bar */}
      {!draftState.completed && !isUserPick && (
        <div className="bloomberg-border p-3 flex items-center justify-between">
          <span className="text-gray-500 text-xs">AI teams are on the clock...</span>
          <button
            onClick={handleSimToNextPick}
            disabled={autoPicking}
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs px-4 py-1.5 uppercase tracking-wider transition-colors disabled:opacity-50"
          >
            {autoPicking ? 'SIMMING...' : 'SIM TO MY PICK'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Prospect board */}
        <div className="col-span-2 bloomberg-border">
          <div className="bloomberg-header flex items-center justify-between">
            <span>PROSPECT BOARD ({available.length} available)</span>
            <div className="flex items-center gap-2">
              <select value={posFilter} onChange={e => setPosFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-orange-400 text-xs px-2 py-1 rounded">
                {positions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-orange-400 text-xs px-2 py-1 rounded">
                <option value="ALL">ALL</option>
                <option value="college">College</option>
                <option value="high_school">High School</option>
                <option value="intl_amateur">International</option>
              </select>
            </div>
          </div>
          <div className="max-h-[32rem] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1 text-left">#</th>
                  <th className="px-2 py-1 text-left">NAME</th>
                  <th className="px-2 py-1">POS</th>
                  <th className="px-2 py-1">AGE</th>
                  <th className="px-2 py-1">TYPE</th>
                  <th className="px-2 py-1">GRD</th>
                  <th className="px-2 py-1">OVR</th>
                  <th className="px-2 py-1">POT</th>
                  <th className="px-2 py-1 text-left">REPORT</th>
                  {isUserPick && <th className="px-2 py-1"></th>}
                </tr>
              </thead>
              <tbody>
                {available.slice(0, 60).map(p => (
                  <tr
                    key={p.prospectId}
                    className={`text-xs transition-colors cursor-pointer ${
                      selectedProspect?.prospectId === p.prospectId ? 'bg-orange-900/20' : 'hover:bg-gray-800/50'
                    }`}
                    onClick={() => setSelectedProspect(p)}
                  >
                    <td className="px-2 py-1 text-gray-600">{p.overallRank}</td>
                    <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
                    <td className="px-2 py-1 text-gray-500 text-center">{p.position}</td>
                    <td className="px-2 py-1 tabular-nums text-center">{p.age}</td>
                    <td className="px-2 py-1 text-center"><TypeBadge type={p.draftType} /></td>
                    <td className="px-2 py-1 text-center"><GradeBadge grade={p.scoutedGrade} /></td>
                    <td className="px-2 py-1 tabular-nums text-center text-gray-400">{p.scoutedOverall}</td>
                    <td className="px-2 py-1 tabular-nums text-center text-gray-600">{p.scoutedPotential}</td>
                    <td className="px-2 py-1 text-gray-600 truncate max-w-[200px]">{p.reportBlurb}</td>
                    {isUserPick && (
                      <td className="px-2 py-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDraftPlayer(p.prospectId); }}
                          className="bg-green-600 hover:bg-green-500 text-black font-bold text-xs px-2 py-0.5 uppercase transition-colors"
                        >
                          DRAFT
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right panel: scouting report + recent picks */}
        <div className="space-y-4">
          {/* Scouting report */}
          <div className="bloomberg-border">
            <div className="bloomberg-header">SCOUTING REPORT</div>
            <div className="p-3">
              {selectedProspect ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-orange-400 font-bold text-sm">{selectedProspect.name}</div>
                    <div className="text-gray-500 text-xs">
                      {selectedProspect.position} / Age {selectedProspect.age} / {selectedProspect.bats}/{selectedProspect.throws}
                    </div>
                    <div className="mt-1"><TypeBadge type={selectedProspect.draftType} /></div>
                  </div>
                  <div className="border-t border-gray-800 pt-2 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Rank</span>
                      <span className="text-orange-400">#{selectedProspect.overallRank}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Grade</span>
                      <GradeBadge grade={selectedProspect.scoutedGrade} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Overall</span>
                      <span className="text-gray-300 tabular-nums">{selectedProspect.scoutedOverall}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Potential</span>
                      <span className="text-gray-300 tabular-nums">{selectedProspect.scoutedPotential}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-800 pt-2">
                    <div className="text-gray-400 text-xs italic">&ldquo;{selectedProspect.reportBlurb}&rdquo;</div>
                  </div>
                  {isUserPick && (
                    <button
                      onClick={() => handleDraftPlayer(selectedProspect.prospectId)}
                      className="w-full bg-green-600 hover:bg-green-500 text-black font-bold text-xs px-4 py-2 uppercase tracking-wider transition-colors"
                    >
                      DRAFT {selectedProspect.name.split(' ').pop()}
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-gray-600 text-xs">Select a prospect to view their scouting report.</div>
              )}
            </div>
          </div>

          {/* Recent picks */}
          <div className="bloomberg-border">
            <div className="bloomberg-header">RECENT PICKS</div>
            <div className="p-2 max-h-48 overflow-y-auto">
              {recentPicks.length === 0 ? (
                <div className="text-gray-600 text-xs p-2">No picks made yet.</div>
              ) : (
                <div className="space-y-1">
                  {recentPicks.map(pk => {
                    const prospect = draftState.prospects.find(p => p.prospectId === pk.prospectId);
                    return (
                      <div key={pk.pick} className="flex items-center gap-2 text-xs">
                        <span className="text-gray-600 w-8 tabular-nums">#{pk.pick}</span>
                        <span className={pk.teamId === userTeamId ? 'text-orange-400' : 'text-blue-300'}>{pk.teamName}</span>
                        <span className="text-gray-600">—</span>
                        <span className="text-gray-300">{prospect?.name ?? pk.playerName ?? '???'}</span>
                        <span className="text-gray-600">{prospect?.position}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
