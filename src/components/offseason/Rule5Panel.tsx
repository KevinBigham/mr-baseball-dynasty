/**
 * Rule5Panel — Rule 5 Draft UI.
 *
 * User can select one eligible player (or pass), then AI teams make their picks.
 */

import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import type { Rule5Selection } from '../../engine/draft/rule5Draft';
import type { UserTransaction } from './OffseasonSummary';

interface Props {
  onComplete: (selections: Rule5Selection[]) => void;
  onTransaction: (tx: UserTransaction) => void;
}

interface EligiblePlayer {
  playerId: number;
  name: string;
  position: string;
  overall: number;
  potential: number;
  age: number;
  teamId: number;
  teamAbbr: string;
}

function ovrGrade(ovr: number): string {
  const grade = 20 + Math.round((ovr / 550) * 60);
  return String(Math.min(80, Math.max(20, grade)));
}

function ovrColor(ovr: number): string {
  const g = 20 + Math.round((ovr / 550) * 60);
  if (g >= 70) return 'text-green-400';
  if (g >= 55) return 'text-yellow-400';
  if (g >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export default function Rule5Panel({ onComplete, onTransaction }: Props) {
  const [eligible, setEligible] = useState<EligiblePlayer[]>([]);
  const [aiSelections, setAiSelections] = useState<Rule5Selection[]>([]);
  const [phase, setPhase] = useState<'user_pick' | 'ai_draft' | 'done'>('user_pick');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch eligible players on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const engine = getEngine();
      const players = await engine.getRule5Eligible();
      if (!cancelled) {
        setEligible(players);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const makeUserPick = useCallback(async () => {
    setBusy(true);
    setError(null);
    const engine = getEngine();

    if (selectedId) {
      const result = await engine.userRule5Pick(selectedId);
      if (!result.ok) {
        setError(result.error || 'Unable to select player.');
        setBusy(false);
        return;
      }
      const player = eligible.find(p => p.playerId === selectedId);
      if (player) {
        onTransaction({
          type: 'trade',
          description: `Rule 5 Draft: Selected ${player.name} (${player.position}) from ${player.teamAbbr}`,
        });
      }
    }

    // Now run AI draft
    setPhase('ai_draft');
    const selections = await engine.conductRule5Draft();
    setAiSelections(selections);
    setPhase('done');
    setBusy(false);
  }, [selectedId, eligible, onTransaction]);

  const passOnPick = useCallback(async () => {
    setBusy(true);
    setPhase('ai_draft');
    const engine = getEngine();
    const selections = await engine.conductRule5Draft();
    setAiSelections(selections);
    setPhase('done');
    setBusy(false);
  }, []);

  if (loading) {
    return (
      <div className="bloomberg-border bg-gray-900 p-6 text-center text-gray-400 text-sm">
        Loading Rule 5 eligible players...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bloomberg-border bg-gray-900 px-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-orange-500 font-bold text-xs tracking-widest">
              RULE 5 DRAFT
            </span>
            <span className="text-gray-500 text-xs ml-3">
              {eligible.length} eligible player{eligible.length !== 1 ? 's' : ''}
            </span>
          </div>
          {phase === 'done' && (
            <button
              onClick={() => onComplete(aiSelections)}
              className="bg-orange-600 hover:bg-orange-500 text-black font-bold px-4 py-1 text-xs tracking-widest"
            >
              ADVANCE TO FREE AGENCY →
            </button>
          )}
        </div>
      </div>

      {/* User Pick Phase */}
      {phase === 'user_pick' && (
        <div className="bloomberg-border bg-gray-900 p-4">
          <div className="text-gray-400 text-xs mb-3 tracking-widest">
            YOUR SELECTION — Pick one player or pass
          </div>

          {eligible.length === 0 ? (
            <div className="text-gray-500 text-sm text-center py-4">
              No eligible players available.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-800">
              {eligible.map(p => (
                <button
                  key={p.playerId}
                  onClick={() => setSelectedId(p.playerId === selectedId ? null : p.playerId)}
                  className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-800 transition-colors ${
                    selectedId === p.playerId ? 'bg-orange-900/20 border-l-2 border-orange-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`font-mono font-bold text-sm ${ovrColor(p.overall)}`}>
                      {ovrGrade(p.overall)}
                    </span>
                    <div>
                      <span className="text-gray-200 text-sm">{p.name}</span>
                      <span className="text-gray-500 text-xs ml-2">{p.position}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Age {p.age} · POT {ovrGrade(p.potential)} · {p.teamAbbr}
                  </div>
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="text-red-400 text-xs mt-2">{error}</div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              disabled={busy || !selectedId}
              onClick={makeUserPick}
              className="bg-green-700 hover:bg-green-600 text-white font-bold px-4 py-1.5 text-xs tracking-widest disabled:opacity-50"
            >
              SELECT PLAYER
            </button>
            <button
              disabled={busy}
              onClick={passOnPick}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-1.5 text-xs tracking-widest border border-gray-600"
            >
              PASS
            </button>
          </div>
        </div>
      )}

      {/* AI Draft Phase (loading) */}
      {phase === 'ai_draft' && (
        <div className="bloomberg-border bg-gray-900 p-6 text-center text-orange-400 text-sm animate-pulse">
          AI teams making Rule 5 selections...
        </div>
      )}

      {/* Results */}
      {phase === 'done' && aiSelections.length > 0 && (
        <div className="bloomberg-border bg-gray-900 p-4">
          <div className="text-gray-400 text-xs mb-3 tracking-widest">
            AI SELECTIONS — {aiSelections.length} player{aiSelections.length !== 1 ? 's' : ''} selected
          </div>
          <div className="divide-y divide-gray-800">
            {aiSelections.map((sel, i) => (
              <div key={`${sel.playerId}-${i}`} className="px-2 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold text-sm ${ovrColor(sel.overall)}`}>
                    {ovrGrade(sel.overall)}
                  </span>
                  <div>
                    <span className="text-gray-200 text-sm">{sel.playerName}</span>
                    <span className="text-gray-500 text-xs ml-2">{sel.position}</span>
                  </div>
                </div>
                <div className="text-xs">
                  <span className="text-gray-500">{sel.originalTeamAbbr}</span>
                  <span className="text-gray-600 mx-1">→</span>
                  <span className="text-green-400">{sel.selectingTeamAbbr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === 'done' && aiSelections.length === 0 && (
        <div className="bloomberg-border bg-gray-900 p-4 text-center text-gray-500 text-sm">
          No AI teams made Rule 5 selections this year.
        </div>
      )}
    </div>
  );
}
