import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { FreeAgent, FreeAgencyResult } from '../../engine/offseason/freeAgency';

function formatSalary(s: number): string {
  if (s >= 1_000_000) return `$${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `$${(s / 1000).toFixed(0)}K`;
  return `$${s}`;
}

function GradeBadge({ grade }: { grade: number }) {
  const color =
    grade >= 70 ? '#4ade80' :
    grade >= 60 ? '#22d3ee' :
    grade >= 50 ? '#fbbf24' :
    grade >= 40 ? '#94a3b8' : '#6b7280';
  return (
    <span className="font-mono text-xs font-bold tabular-nums" style={{ color }}>
      {grade}
    </span>
  );
}

export default function FreeAgentMarket() {
  const { gameStarted } = useGameStore();
  const [agents, setAgents] = useState<FreeAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [offerSalary, setOfferSalary] = useState<string>('');
  const [offerYears, setOfferYears] = useState<number>(1);
  const [msg, setMsg] = useState<{ text: string; color: string } | null>(null);
  const [aiResult, setAiResult] = useState<FreeAgencyResult | null>(null);
  const [posFilter, setPosFilter] = useState<string>('ALL');

  const loadAgents = useCallback(async () => {
    if (!gameStarted) return;
    setLoading(true);
    const fas = await getEngine().getFreeAgents();
    setAgents(fas);
    setLoading(false);
  }, [gameStarted]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const selectedAgent = agents.find(a => a.playerId === selectedId) ?? null;

  const handleSign = async () => {
    if (!selectedAgent) return;
    const salary = parseFloat(offerSalary);
    if (isNaN(salary) || salary <= 0) {
      setMsg({ text: 'Enter a valid salary.', color: '#ef4444' });
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    const salaryNum = Math.round(salary * 1_000_000); // Input is in millions
    const result = await getEngine().signFreeAgent(selectedAgent.playerId, salaryNum, offerYears);
    if (result.ok) {
      setMsg({ text: `Signed ${selectedAgent.name} — ${offerYears}yr / ${formatSalary(salaryNum)}`, color: '#4ade80' });
      setSelectedId(null);
      setOfferSalary('');
      setOfferYears(1);
      loadAgents();
    } else {
      setMsg({ text: result.error ?? 'Failed to sign player.', color: '#ef4444' });
    }
    setTimeout(() => setMsg(null), 5000);
  };

  const handleRunAI = async () => {
    setLoading(true);
    const result = await getEngine().runAIFreeAgency();
    setAiResult(result);
    loadAgents();
    setMsg({ text: `AI free agency complete: ${result.signings.length} signings, ${result.unsigned.length} unsigned`, color: '#22d3ee' });
    setTimeout(() => setMsg(null), 8000);
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const positions = ['ALL', ...new Set(agents.map(a => a.position))];
  const filtered = posFilter === 'ALL' ? agents : agents.filter(a => a.position === posFilter);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>FREE AGENT MARKET</span>
        <div className="flex items-center gap-2">
          <select
            value={posFilter}
            onChange={e => setPosFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-orange-400 text-xs px-2 py-1 rounded"
          >
            {positions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <button
            onClick={handleRunAI}
            className="bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs px-3 py-1 uppercase tracking-wider transition-colors"
          >
            RUN AI FA
          </button>
        </div>
      </div>

      {msg && (
        <div className="px-3 py-2 rounded text-xs font-bold" style={{
          background: `${msg.color}12`, border: `1px solid ${msg.color}40`, color: msg.color,
        }}>{msg.text}</div>
      )}

      {loading ? (
        <div className="text-orange-400 text-xs animate-pulse">Loading free agents...</div>
      ) : agents.length === 0 ? (
        <div className="text-gray-500 text-xs">No free agents available this offseason.</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {/* Player list */}
          <div className="col-span-2 bloomberg-border">
            <div className="bloomberg-header flex items-center justify-between">
              <span>AVAILABLE ({filtered.length})</span>
              <span className="text-gray-500 font-normal text-xs">Click a player to make an offer</span>
            </div>
            <div className="max-h-[28rem] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                    <th className="text-left px-2 py-1">NAME</th>
                    <th className="text-left px-2 py-1">POS</th>
                    <th className="px-2 py-1">AGE</th>
                    <th className="px-2 py-1">GRD</th>
                    <th className="px-2 py-1">OVR</th>
                    <th className="px-2 py-1">POT</th>
                    <th className="px-2 py-1">VAL</th>
                    <th className="px-2 py-1">ASK $</th>
                    <th className="px-2 py-1">ASK YR</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(fa => (
                    <tr
                      key={fa.playerId}
                      className={`text-xs cursor-pointer transition-colors ${
                        selectedId === fa.playerId ? 'bg-orange-900/20' : 'hover:bg-gray-800/50'
                      }`}
                      onClick={() => {
                        setSelectedId(fa.playerId);
                        setOfferSalary((fa.askingSalary / 1_000_000).toFixed(1));
                        setOfferYears(fa.askingYears);
                      }}
                    >
                      <td className="px-2 py-1 font-bold text-orange-300">{fa.name}</td>
                      <td className="px-2 py-1 text-gray-500">{fa.position}</td>
                      <td className="px-2 py-1 tabular-nums">{fa.age}</td>
                      <td className="px-2 py-1"><GradeBadge grade={fa.scoutGrade} /></td>
                      <td className="px-2 py-1 tabular-nums text-gray-400">{fa.overall}</td>
                      <td className="px-2 py-1 tabular-nums text-gray-600">{fa.potential}</td>
                      <td className="px-2 py-1 tabular-nums text-gray-400">{fa.tradeValue}</td>
                      <td className="px-2 py-1 text-green-400 tabular-nums">{formatSalary(fa.askingSalary)}</td>
                      <td className="px-2 py-1 text-gray-400 tabular-nums">{fa.askingYears}yr</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Offer panel */}
          <div className="bloomberg-border">
            <div className="bloomberg-header">MAKE OFFER</div>
            <div className="p-3 space-y-3">
              {selectedAgent ? (
                <>
                  <div>
                    <div className="text-orange-400 font-bold text-sm">{selectedAgent.name}</div>
                    <div className="text-gray-500 text-xs">{selectedAgent.position} / Age {selectedAgent.age}</div>
                    <div className="text-gray-600 text-xs mt-1">
                      Grade: <GradeBadge grade={selectedAgent.scoutGrade} />
                      {' '} OVR: <span className="text-gray-400">{selectedAgent.overall}</span>
                      {' '} POT: <span className="text-gray-400">{selectedAgent.potential}</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-800 pt-2">
                    <div className="text-gray-500 text-xs mb-1">Asking: {formatSalary(selectedAgent.askingSalary)}/yr x {selectedAgent.askingYears}yr</div>
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs block mb-1">SALARY ($M/yr)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={offerSalary}
                      onChange={e => setOfferSalary(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 text-orange-400 text-xs px-2 py-1.5 rounded font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-gray-500 text-xs block mb-1">YEARS</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7].map(yr => (
                        <button
                          key={yr}
                          onClick={() => setOfferYears(yr)}
                          className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                            offerYears === yr
                              ? 'bg-orange-600 text-black'
                              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                          }`}
                        >
                          {yr}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Total: <span className="text-orange-400 font-bold">
                      {formatSalary(parseFloat(offerSalary || '0') * 1_000_000 * offerYears)}
                    </span>
                  </div>
                  <button
                    onClick={handleSign}
                    className="w-full bg-green-600 hover:bg-green-500 text-black font-bold text-xs px-4 py-2 uppercase tracking-wider transition-colors"
                  >
                    SIGN PLAYER
                  </button>
                </>
              ) : (
                <div className="text-gray-600 text-xs">Select a free agent from the list to make an offer.</div>
              )}
            </div>

            {/* AI results */}
            {aiResult && aiResult.signings.length > 0 && (
              <div className="border-t border-gray-800">
                <div className="bloomberg-header text-xs">AI SIGNINGS</div>
                <div className="p-2 max-h-40 overflow-y-auto space-y-1">
                  {aiResult.signings.map((s, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-orange-300">{s.playerName}</span>
                      <span className="text-gray-600"> → </span>
                      <span className="text-blue-300">{s.teamName}</span>
                      <span className="text-gray-600"> ({formatSalary(s.salary)}/{s.years}yr)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
