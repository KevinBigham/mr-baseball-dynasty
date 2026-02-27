import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { LineupData } from '../../types/trade';
import type { RosterData, RosterPlayer } from '../../types/league';

function GradeBadge({ value }: { value: number }) {
  const color =
    value >= 70 ? '#4ade80' :
    value >= 60 ? '#22d3ee' :
    value >= 50 ? '#fbbf24' :
    value >= 40 ? '#94a3b8' : '#6b7280';
  return <span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>{value}</span>;
}

function DragHandle() {
  return <span className="text-gray-600 cursor-grab active:cursor-grabbing select-none">⋮⋮</span>;
}

export default function LineupEditor() {
  const { gameStarted, userTeamId } = useGameStore();
  const [lineup, setLineup] = useState<LineupData | null>(null);
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [tab, setTab] = useState<'batting' | 'rotation'>('batting');
  const [msg, setMsg] = useState<{ text: string; color: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const [lu, ro] = await Promise.all([
      getEngine().getLineup(userTeamId),
      getEngine().getRoster(userTeamId),
    ]);
    setLineup(lu);
    setRoster(ro);
    setLoading(false);
  }, [gameStarted, userTeamId]);

  useEffect(() => { loadData(); }, [loadData]);

  const playerMap = new Map<number, RosterPlayer>();
  if (roster) {
    for (const p of [...roster.active, ...roster.il]) {
      playerMap.set(p.playerId, p);
    }
  }

  const handleSave = async () => {
    if (!lineup) return;
    const result = await getEngine().setLineup(lineup);
    if (result.ok) {
      setMsg({ text: 'Lineup saved!', color: '#4ade80' });
    } else {
      setMsg({ text: result.error ?? 'Failed to save lineup.', color: '#ef4444' });
    }
    setTimeout(() => setMsg(null), 3000);
  };

  const moveBatter = (from: number, to: number) => {
    if (!lineup) return;
    const order = [...lineup.battingOrder];
    const [item] = order.splice(from, 1);
    order.splice(to, 0, item);
    setLineup({ ...lineup, battingOrder: order });
  };

  const moveRotation = (from: number, to: number) => {
    if (!lineup) return;
    const rot = [...lineup.rotation];
    const [item] = rot.splice(from, 1);
    rot.splice(to, 0, item);
    setLineup({ ...lineup, rotation: rot });
  };

  const swapBatter = (idx: number, newPlayerId: number) => {
    if (!lineup) return;
    const order = [...lineup.battingOrder];
    // If this player is already in the order, swap positions
    const existingIdx = order.indexOf(newPlayerId);
    if (existingIdx >= 0) {
      order[existingIdx] = order[idx];
    }
    order[idx] = newPlayerId;
    setLineup({ ...lineup, battingOrder: order });
  };

  const swapRotation = (idx: number, newPlayerId: number) => {
    if (!lineup) return;
    const rot = [...lineup.rotation];
    const existingIdx = rot.indexOf(newPlayerId);
    if (existingIdx >= 0) {
      rot[existingIdx] = rot[idx];
    }
    rot[idx] = newPlayerId;
    setLineup({ ...lineup, rotation: rot });
  };

  const setCloser = (playerId: number) => {
    if (!lineup) return;
    setLineup({ ...lineup, closer: playerId });
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading || !lineup || !roster) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading lineup...</div>;

  const availableHitters = roster.active.filter(p => !p.isPitcher && !lineup.battingOrder.includes(p.playerId));
  const availableSPs = roster.active.filter(p => p.position === 'SP' && !lineup.rotation.includes(p.playerId));
  const availableRPs = roster.active.filter(p => (p.position === 'RP' || p.position === 'CL') && p.playerId !== lineup.closer);

  const slotLabels = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th'];
  const rotLabels = ['ACE', 'SP2', 'SP3', 'SP4', 'SP5'];

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, _idx: number) => e.preventDefault();
  const handleDrop = (targetIdx: number) => {
    if (dragIdx === null) return;
    if (tab === 'batting') moveBatter(dragIdx, targetIdx);
    else moveRotation(dragIdx, targetIdx);
    setDragIdx(null);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>LINEUP EDITOR</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('batting')}
            className={`text-xs font-bold px-3 py-1 uppercase tracking-wider transition-colors ${
              tab === 'batting' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >BATTING</button>
          <button
            onClick={() => setTab('rotation')}
            className={`text-xs font-bold px-3 py-1 uppercase tracking-wider transition-colors ${
              tab === 'rotation' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >PITCHING</button>
        </div>
      </div>

      {msg && (
        <div className="px-3 py-2 rounded text-xs font-bold" style={{
          background: `${msg.color}12`, border: `1px solid ${msg.color}40`, color: msg.color,
        }}>{msg.text}</div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {/* Main lineup */}
        <div className="col-span-2 bloomberg-border">
          <div className="bloomberg-header flex items-center justify-between">
            <span>{tab === 'batting' ? 'BATTING ORDER' : 'STARTING ROTATION'}</span>
            <span className="text-gray-500 font-normal text-xs">Drag to reorder</span>
          </div>
          <div className="p-2">
            {tab === 'batting' ? (
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-800">
                    <th className="px-2 py-1 w-6"></th>
                    <th className="text-left px-2 py-1 w-10">SLOT</th>
                    <th className="text-left px-2 py-1">NAME</th>
                    <th className="text-left px-2 py-1">POS</th>
                    <th className="px-2 py-1">OVR</th>
                    <th className="px-2 py-1">POT</th>
                    <th className="px-2 py-1">AVG</th>
                    <th className="px-2 py-1">HR</th>
                    <th className="px-2 py-1">RBI</th>
                    <th className="px-1 py-1 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {lineup.battingOrder.map((pid, i) => {
                    const p = playerMap.get(pid);
                    return (
                      <tr
                        key={pid}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={() => handleDrop(i)}
                        className={`text-xs transition-colors ${dragIdx === i ? 'bg-orange-900/30' : 'hover:bg-gray-800/50'}`}
                      >
                        <td className="px-2 py-1.5"><DragHandle /></td>
                        <td className="px-2 py-1.5 text-gray-500 font-bold">{slotLabels[i]}</td>
                        <td className="px-2 py-1.5 font-bold text-orange-300">{p?.name ?? '???'}</td>
                        <td className="px-2 py-1.5 text-gray-500">{p?.position ?? '-'}</td>
                        <td className="px-2 py-1.5 text-center"><GradeBadge value={p?.overall ?? 0} /></td>
                        <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{p?.potential ?? '-'}</td>
                        <td className="px-2 py-1.5 text-center tabular-nums text-gray-400">{p?.stats && 'avg' in p.stats ? p.stats.avg : '-'}</td>
                        <td className="px-2 py-1.5 text-center tabular-nums text-gray-400">{p?.stats && 'hr' in p.stats ? p.stats.hr : '-'}</td>
                        <td className="px-2 py-1.5 text-center tabular-nums text-gray-400">{p?.stats && 'rbi' in p.stats ? p.stats.rbi : '-'}</td>
                        <td className="px-1 py-1.5">
                          <select
                            value={pid}
                            onChange={e => swapBatter(i, Number(e.target.value))}
                            className="bg-gray-900 border border-gray-800 text-gray-400 text-xs px-1 py-0.5 rounded w-full"
                          >
                            <option value={pid}>{p?.name ?? '???'}</option>
                            {availableHitters.map(h => (
                              <option key={h.playerId} value={h.playerId}>{h.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <>
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800">
                      <th className="px-2 py-1 w-6"></th>
                      <th className="text-left px-2 py-1 w-10">SLOT</th>
                      <th className="text-left px-2 py-1">NAME</th>
                      <th className="px-2 py-1">OVR</th>
                      <th className="px-2 py-1">POT</th>
                      <th className="px-2 py-1">ERA</th>
                      <th className="px-2 py-1">W</th>
                      <th className="px-2 py-1">K/9</th>
                      <th className="px-1 py-1 w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineup.rotation.map((pid, i) => {
                      const p = playerMap.get(pid);
                      return (
                        <tr
                          key={pid}
                          draggable
                          onDragStart={() => handleDragStart(i)}
                          onDragOver={(e) => handleDragOver(e, i)}
                          onDrop={() => handleDrop(i)}
                          className={`text-xs transition-colors ${dragIdx === i ? 'bg-orange-900/30' : 'hover:bg-gray-800/50'}`}
                        >
                          <td className="px-2 py-1.5"><DragHandle /></td>
                          <td className="px-2 py-1.5 text-gray-500 font-bold">{rotLabels[i] ?? `SP${i + 1}`}</td>
                          <td className="px-2 py-1.5 font-bold text-orange-300">{p?.name ?? '???'}</td>
                          <td className="px-2 py-1.5 text-center"><GradeBadge value={p?.overall ?? 0} /></td>
                          <td className="px-2 py-1.5 text-center tabular-nums text-gray-600">{p?.potential ?? '-'}</td>
                          <td className="px-2 py-1.5 text-center tabular-nums text-gray-400">{p?.stats && 'era' in p.stats ? p.stats.era : '-'}</td>
                          <td className="px-2 py-1.5 text-center tabular-nums text-gray-400">{p?.stats && 'w' in p.stats ? p.stats.w : '-'}</td>
                          <td className="px-2 py-1.5 text-center tabular-nums text-gray-400">{p?.stats && 'k9' in p.stats ? p.stats.k9 : '-'}</td>
                          <td className="px-1 py-1.5">
                            <select
                              value={pid}
                              onChange={e => swapRotation(i, Number(e.target.value))}
                              className="bg-gray-900 border border-gray-800 text-gray-400 text-xs px-1 py-0.5 rounded w-full"
                            >
                              <option value={pid}>{p?.name ?? '???'}</option>
                              {availableSPs.map(sp => (
                                <option key={sp.playerId} value={sp.playerId}>{sp.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Closer */}
                <div className="mt-4 border-t border-gray-800 pt-3">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">CLOSER</span>
                    <span className="text-orange-300 font-bold text-xs">
                      {lineup.closer ? playerMap.get(lineup.closer)?.name ?? '???' : 'None'}
                    </span>
                    <select
                      value={lineup.closer ?? ''}
                      onChange={e => setCloser(Number(e.target.value))}
                      className="bg-gray-900 border border-gray-800 text-gray-400 text-xs px-2 py-1 rounded"
                    >
                      {lineup.closer && (
                        <option value={lineup.closer}>{playerMap.get(lineup.closer)?.name ?? '???'}</option>
                      )}
                      {availableRPs.map(rp => (
                        <option key={rp.playerId} value={rp.playerId}>{rp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bench / Available */}
        <div className="bloomberg-border">
          <div className="bloomberg-header">
            {tab === 'batting' ? 'BENCH' : 'BULLPEN'}
          </div>
          <div className="p-2 max-h-[28rem] overflow-y-auto">
            {tab === 'batting' ? (
              availableHitters.length === 0 ? (
                <div className="text-gray-600 text-xs">All position players are in the lineup.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="text-gray-600 text-xs border-b border-gray-800">
                      <th className="text-left px-2 py-1">NAME</th>
                      <th className="text-left px-2 py-1">POS</th>
                      <th className="px-2 py-1">OVR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableHitters.map(h => (
                      <tr key={h.playerId} className="text-xs hover:bg-gray-800/50">
                        <td className="px-2 py-1 text-gray-400">{h.name}</td>
                        <td className="px-2 py-1 text-gray-600">{h.position}</td>
                        <td className="px-2 py-1 text-center"><GradeBadge value={h.overall} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              <>
                {availableSPs.length > 0 && (
                  <>
                    <div className="text-gray-500 text-xs font-bold mb-1">AVAILABLE SP</div>
                    <table className="w-full mb-3">
                      <tbody>
                        {availableSPs.map(sp => (
                          <tr key={sp.playerId} className="text-xs hover:bg-gray-800/50">
                            <td className="px-2 py-1 text-gray-400">{sp.name}</td>
                            <td className="px-2 py-1 text-center"><GradeBadge value={sp.overall} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                <div className="text-gray-500 text-xs font-bold mb-1">RELIEVERS</div>
                <table className="w-full">
                  <tbody>
                    {roster.active
                      .filter(p => (p.position === 'RP' || p.position === 'CL') && p.playerId !== lineup.closer)
                      .map(rp => (
                        <tr key={rp.playerId} className="text-xs hover:bg-gray-800/50">
                          <td className="px-2 py-1 text-gray-400">{rp.name}</td>
                          <td className="px-2 py-1 text-gray-600">{rp.position}</td>
                          <td className="px-2 py-1 text-center"><GradeBadge value={rp.overall} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="bloomberg-border p-4 flex items-center justify-between">
        <span className="text-gray-500 text-xs">
          {tab === 'batting' ? `${lineup.battingOrder.length}/9 batters` : `${lineup.rotation.length} SP + ${lineup.closer ? '1 CL' : 'No CL'}`}
        </span>
        <button
          onClick={handleSave}
          className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs px-6 py-2 uppercase tracking-wider transition-colors"
        >
          SAVE LINEUP
        </button>
      </div>
    </div>
  );
}
