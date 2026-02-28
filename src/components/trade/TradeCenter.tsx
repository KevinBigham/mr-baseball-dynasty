import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { TradeablePlayer } from '../../types/trade';
import type { TradeEvaluation, TradeRecord } from '../../engine/trade/tradeEngine';

function formatSalary(s: number): string {
  if (s >= 1_000_000) return `$${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `$${(s / 1000).toFixed(0)}K`;
  return `$${s}`;
}

function ValueBadge({ value }: { value: number }) {
  const color = value >= 60 ? '#4ade80' : value >= 40 ? '#fbbf24' : value >= 20 ? '#94a3b8' : '#6b7280';
  return (
    <span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>
      {value}
    </span>
  );
}

const TEAMS = [
  { id: 1,  abbr: 'ADM' }, { id: 2,  abbr: 'COL' }, { id: 3,  abbr: 'LOB' }, { id: 4,  abbr: 'STM' }, { id: 5,  abbr: 'HAM' },
  { id: 6,  abbr: 'WLV' }, { id: 7,  abbr: 'CRU' }, { id: 8,  abbr: 'FOX' }, { id: 9,  abbr: 'MIN' }, { id: 10, abbr: 'MON' },
  { id: 11, abbr: 'GUL' }, { id: 12, abbr: 'RAT' }, { id: 13, abbr: 'COU' }, { id: 14, abbr: 'LUM' }, { id: 15, abbr: 'ANG' },
  { id: 16, abbr: 'MET' }, { id: 17, abbr: 'BRA' }, { id: 18, abbr: 'TID' }, { id: 19, abbr: 'PAT' }, { id: 20, abbr: 'HUR' },
  { id: 21, abbr: 'CUB' }, { id: 22, abbr: 'RED' }, { id: 23, abbr: 'CIN' }, { id: 24, abbr: 'AST' }, { id: 25, abbr: 'BRW' },
  { id: 26, abbr: 'DOD' }, { id: 27, abbr: 'GNT' }, { id: 28, abbr: 'PAD' }, { id: 29, abbr: 'ROC' }, { id: 30, abbr: 'DIA' },
];

function PlayerRow({ p, selected, onToggle }: { p: TradeablePlayer; selected: boolean; onToggle: () => void }) {
  return (
    <tr
      className={`text-xs cursor-pointer transition-colors ${selected ? 'bg-orange-900/20' : 'hover:bg-gray-800/50'}`}
      onClick={onToggle}
    >
      <td className="px-2 py-1">
        <input type="checkbox" checked={selected} readOnly className="accent-orange-500" />
      </td>
      <td className="px-2 py-1 font-bold text-orange-300">{p.name}</td>
      <td className="px-2 py-1 text-gray-500">{p.position}</td>
      <td className="px-2 py-1 tabular-nums">{p.age}</td>
      <td className="px-2 py-1"><ValueBadge value={p.tradeValue} /></td>
      <td className="px-2 py-1 tabular-nums text-gray-400">{p.overall}</td>
      <td className="px-2 py-1 tabular-nums text-gray-600">{p.potential}</td>
      <td className="px-2 py-1 text-gray-600">{formatSalary(p.salary)}</td>
      <td className="px-2 py-1 text-gray-600">{p.contractYrs}yr</td>
    </tr>
  );
}

export default function TradeCenter() {
  const { gameStarted, userTeamId } = useGameStore();
  const [targetTeamId, setTargetTeamId] = useState<number>(1);
  const [myPlayers, setMyPlayers] = useState<TradeablePlayer[]>([]);
  const [theirPlayers, setTheirPlayers] = useState<TradeablePlayer[]>([]);
  const [mySelected, setMySelected] = useState<Set<number>>(new Set());
  const [theirSelected, setTheirSelected] = useState<Set<number>>(new Set());
  const [evaluation, setEvaluation] = useState<TradeEvaluation | null>(null);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; color: string } | null>(null);

  // Set initial target to a team that isn't the user's
  useEffect(() => {
    const first = TEAMS.find(t => t.id !== userTeamId);
    if (first) setTargetTeamId(first.id);
  }, [userTeamId]);

  const loadPlayers = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const engine = getEngine();
    const [my, their, history] = await Promise.all([
      engine.getTradeablePlayers(userTeamId),
      engine.getTradeablePlayers(targetTeamId),
      engine.getTradeHistory(),
    ]);
    setMyPlayers(my);
    setTheirPlayers(their);
    setTradeHistory(history);
    setMySelected(new Set());
    setTheirSelected(new Set());
    setEvaluation(null);
    setLoading(false);
  }, [gameStarted, userTeamId, targetTeamId]);

  useEffect(() => { loadPlayers(); }, [loadPlayers]);

  const toggleMy = (id: number) => {
    setMySelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setEvaluation(null);
  };

  const toggleTheir = (id: number) => {
    setTheirSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setEvaluation(null);
  };

  const handleEvaluate = async () => {
    if (mySelected.size === 0 || theirSelected.size === 0) return;
    const result = await getEngine().evaluateTrade({
      fromTeamId: userTeamId,
      toTeamId: targetTeamId,
      playersOffered: [...mySelected],
      playersRequested: [...theirSelected],
    });
    setEvaluation(result);
  };

  const handleExecute = async () => {
    if (!evaluation || evaluation.response !== 'ACCEPT') return;
    const record = await getEngine().executeTrade({
      fromTeamId: userTeamId,
      toTeamId: targetTeamId,
      playersOffered: [...mySelected],
      playersRequested: [...theirSelected],
    });
    setMsg({ text: `Trade completed! ${record.team1PlayerNames.join(', ')} for ${record.team2PlayerNames.join(', ')}`, color: '#4ade80' });
    setTimeout(() => setMsg(null), 5000);
    loadPlayers();
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const myValue = [...mySelected].reduce((sum, id) => {
    const p = myPlayers.find(x => x.playerId === id);
    return sum + (p?.tradeValue ?? 0);
  }, 0);
  const theirValue = [...theirSelected].reduce((sum, id) => {
    const p = theirPlayers.find(x => x.playerId === id);
    return sum + (p?.tradeValue ?? 0);
  }, 0);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TRADE CENTER</span>
        <select
          value={targetTeamId}
          onChange={e => setTargetTeamId(Number(e.target.value))}
          className="bg-gray-900 border border-gray-700 text-orange-400 text-xs px-2 py-1 rounded"
        >
          {TEAMS.filter(t => t.id !== userTeamId).map(t => (
            <option key={t.id} value={t.id}>{t.abbr}</option>
          ))}
        </select>
      </div>

      {msg && (
        <div className="px-3 py-2 rounded text-xs font-bold" style={{
          background: `${msg.color}12`, border: `1px solid ${msg.color}40`, color: msg.color,
        }}>{msg.text}</div>
      )}

      {loading ? (
        <div className="text-orange-400 text-xs animate-pulse">Loading trade assets...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* My team */}
          <div className="bloomberg-border">
            <div className="bloomberg-header flex items-center justify-between">
              <span>YOUR ASSETS</span>
              <span className="text-gray-500 font-normal text-xs">
                Selected value: <span className="text-orange-400 font-bold">{myValue}</span>
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                    <th className="px-2 py-1 w-6"></th>
                    <th className="text-left px-2 py-1">NAME</th>
                    <th className="text-left px-2 py-1">POS</th>
                    <th className="px-2 py-1">AGE</th>
                    <th className="px-2 py-1">VAL</th>
                    <th className="px-2 py-1">OVR</th>
                    <th className="px-2 py-1">POT</th>
                    <th className="px-2 py-1">SAL</th>
                    <th className="px-2 py-1">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {myPlayers.slice(0, 40).map(p => (
                    <PlayerRow key={p.playerId} p={p} selected={mySelected.has(p.playerId)} onToggle={() => toggleMy(p.playerId)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Their team */}
          <div className="bloomberg-border">
            <div className="bloomberg-header flex items-center justify-between">
              <span>{TEAMS.find(t => t.id === targetTeamId)?.abbr} ASSETS</span>
              <span className="text-gray-500 font-normal text-xs">
                Selected value: <span className="text-orange-400 font-bold">{theirValue}</span>
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                    <th className="px-2 py-1 w-6"></th>
                    <th className="text-left px-2 py-1">NAME</th>
                    <th className="text-left px-2 py-1">POS</th>
                    <th className="px-2 py-1">AGE</th>
                    <th className="px-2 py-1">VAL</th>
                    <th className="px-2 py-1">OVR</th>
                    <th className="px-2 py-1">POT</th>
                    <th className="px-2 py-1">SAL</th>
                    <th className="px-2 py-1">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {theirPlayers.slice(0, 40).map(p => (
                    <PlayerRow key={p.playerId} p={p} selected={theirSelected.has(p.playerId)} onToggle={() => toggleTheir(p.playerId)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trade controls */}
      <div className="bloomberg-border p-4 flex items-center gap-4">
        <button
          onClick={handleEvaluate}
          disabled={mySelected.size === 0 || theirSelected.size === 0}
          className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-xs px-4 py-2 uppercase tracking-wider transition-colors"
        >
          PROPOSE TRADE
        </button>

        {evaluation && (
          <div className="flex-1 flex items-center gap-3">
            <span className={`text-sm font-black ${
              evaluation.response === 'ACCEPT' ? 'text-green-400' :
              evaluation.response === 'INTERESTED' ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {evaluation.response}
            </span>
            <span className="text-gray-400 text-xs">{evaluation.reason}</span>
            {evaluation.response === 'ACCEPT' && (
              <button
                onClick={handleExecute}
                className="ml-auto bg-green-600 hover:bg-green-500 text-black font-bold text-xs px-4 py-2 uppercase tracking-wider transition-colors"
              >
                CONFIRM TRADE
              </button>
            )}
          </div>
        )}
      </div>

      {/* Trade history */}
      {tradeHistory.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">TRADE HISTORY</div>
          <div className="p-3 space-y-2">
            {tradeHistory.map((t, i) => (
              <div key={i} className="text-xs border-b border-gray-800 pb-2 last:border-0">
                <span className="text-gray-500">Season {t.season}:</span>{' '}
                <span className="text-orange-300">{t.team1PlayerNames.join(', ')}</span>
                <span className="text-gray-600"> for </span>
                <span className="text-blue-300">{t.team2PlayerNames.join(', ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
