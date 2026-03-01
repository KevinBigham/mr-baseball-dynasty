/**
 * ArbitrationPanel — Resolve salary arbitration cases for eligible players.
 *
 * Players with 3-5 years of service get arbitration hearings.
 * User chooses: accept team offer, accept player ask, or go to hearing.
 */

import { useState, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import type { ArbitrationCase } from '../../engine/finances';
import type { UserTransaction } from './OffseasonSummary';
import { formatSalary } from '../../utils/format';

interface Props {
  cases: ArbitrationCase[];
  onComplete: () => void;
  onTransaction: (tx: UserTransaction) => void;
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

type CaseStatus = 'pending' | 'resolved';

export default function ArbitrationPanel({ cases, onComplete, onTransaction }: Props) {
  const [statuses, setStatuses] = useState<Map<number, CaseStatus>>(
    () => new Map(cases.map(c => [c.playerId, 'pending']))
  );
  const [hearingRevealed, setHearingRevealed] = useState<Set<number>>(new Set());
  const [resolvedSalaries, setResolvedSalaries] = useState<Map<number, number>>(new Map());
  const [busy, setBusy] = useState(false);

  const allResolved = cases.length === 0 || [...statuses.values()].every(s => s === 'resolved');

  const resolveCase = useCallback(async (playerId: number, salary: number, label: string) => {
    setBusy(true);
    const engine = getEngine();
    const result = await engine.resolveArbitrationCase(playerId, salary);
    if (result.ok) {
      setStatuses(prev => new Map(prev).set(playerId, 'resolved'));
      setResolvedSalaries(prev => new Map(prev).set(playerId, salary));
      const c = cases.find(c => c.playerId === playerId);
      if (c) {
        onTransaction({
          type: 'signing',
          description: `Arbitration: ${c.playerName} (${c.position}) — ${label} at ${formatSalary(salary)}`,
        });
      }
    }
    setBusy(false);
  }, [cases, onTransaction]);

  const revealHearing = useCallback((playerId: number) => {
    setHearingRevealed(prev => new Set(prev).add(playerId));
  }, []);

  if (cases.length === 0) {
    return (
      <div className="bloomberg-border bg-gray-900 p-6 text-center">
        <div className="text-gray-400 text-sm mb-4">
          No arbitration-eligible players on your roster this offseason.
        </div>
        <button
          onClick={onComplete}
          className="bg-orange-600 hover:bg-orange-500 text-black font-bold px-6 py-2 text-xs tracking-widest"
        >
          ADVANCE TO WAIVER WIRE →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bloomberg-border bg-gray-900 px-4 py-2">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-orange-500 font-bold text-xs tracking-widest">
              SALARY ARBITRATION
            </span>
            <span className="text-gray-500 text-xs ml-3">
              {[...statuses.values()].filter(s => s === 'resolved').length}/{cases.length} resolved
            </span>
          </div>
          {allResolved && (
            <button
              onClick={onComplete}
              className="bg-orange-600 hover:bg-orange-500 text-black font-bold px-4 py-1 text-xs tracking-widest"
            >
              ADVANCE TO WAIVER WIRE →
            </button>
          )}
        </div>
      </div>

      {cases.map(c => {
        const status = statuses.get(c.playerId) || 'pending';
        const resolved = status === 'resolved';
        const showHearing = hearingRevealed.has(c.playerId);
        const finalSalary = resolvedSalaries.get(c.playerId);

        return (
          <div
            key={c.playerId}
            className={`bloomberg-border bg-gray-900 px-4 py-3 ${resolved ? 'opacity-60' : ''}`}
          >
            {/* Player info row */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className={`font-mono font-bold text-sm ${ovrColor(c.overall)}`}>
                  {ovrGrade(c.overall)}
                </span>
                <div>
                  <span className="text-gray-200 font-bold text-sm">{c.playerName}</span>
                  <span className="text-gray-500 text-xs ml-2">{c.position}</span>
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="text-gray-400">Age {c.age} · {c.serviceYears} svc yrs</div>
                <div className="text-gray-500">Current: {formatSalary(c.currentSalary)}</div>
              </div>
            </div>

            {/* Offers row */}
            {!resolved && (
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 bloomberg-border bg-gray-800 p-2 text-center">
                  <div className="text-gray-500 text-[10px] tracking-widest">TEAM OFFER</div>
                  <div className="text-green-400 font-mono font-bold text-sm">
                    {formatSalary(c.teamOffer)}
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => resolveCase(c.playerId, c.teamOffer, 'Team Offer')}
                    className="mt-1 bg-green-700 hover:bg-green-600 text-white text-[10px] px-3 py-1 tracking-widest disabled:opacity-50"
                  >
                    ACCEPT
                  </button>
                </div>

                <div className="flex-1 bloomberg-border bg-gray-800 p-2 text-center">
                  <div className="text-gray-500 text-[10px] tracking-widest">HEARING</div>
                  {showHearing ? (
                    <>
                      <div className="text-orange-400 font-mono font-bold text-sm">
                        {formatSalary(c.hearingResult)}
                      </div>
                      <button
                        disabled={busy}
                        onClick={() => resolveCase(c.playerId, c.hearingResult, 'Hearing')}
                        className="mt-1 bg-orange-700 hover:bg-orange-600 text-white text-[10px] px-3 py-1 tracking-widest disabled:opacity-50"
                      >
                        ACCEPT
                      </button>
                    </>
                  ) : (
                    <button
                      disabled={busy}
                      onClick={() => revealHearing(c.playerId)}
                      className="mt-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-[10px] px-3 py-1 tracking-widest border border-gray-600"
                    >
                      GO TO HEARING
                    </button>
                  )}
                </div>

                <div className="flex-1 bloomberg-border bg-gray-800 p-2 text-center">
                  <div className="text-gray-500 text-[10px] tracking-widest">PLAYER ASK</div>
                  <div className="text-red-400 font-mono font-bold text-sm">
                    {formatSalary(c.playerAsk)}
                  </div>
                  <button
                    disabled={busy}
                    onClick={() => resolveCase(c.playerId, c.playerAsk, 'Player Ask')}
                    className="mt-1 bg-red-700 hover:bg-red-600 text-white text-[10px] px-3 py-1 tracking-widest disabled:opacity-50"
                  >
                    ACCEPT
                  </button>
                </div>
              </div>
            )}

            {/* Resolved badge */}
            {resolved && finalSalary !== undefined && (
              <div className="text-center text-xs text-green-500 mt-1">
                RESOLVED — {formatSalary(finalSalary)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
