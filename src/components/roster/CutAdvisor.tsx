/**
 * CutAdvisor — Recommends DFA/release/option candidates
 * based on a scoring formula. Ported from MFD's buildCutAdvisor974.
 */

import { useMemo } from 'react';
import type { RosterPlayer } from '../../types/league';
import { toGrade } from '../../utils/gradeColor';
import AgingBadge from '../shared/AgingBadge';
import { formatSalary } from '../../utils/format';

interface CutAdvisorProps {
  players: RosterPlayer[];
  fortyManCount: number;
  onClickPlayer: (id: number) => void;
}

interface CutCandidate {
  player: RosterPlayer;
  score: number;
  reasons: string[];
}

const REASON_BADGES: Record<string, { label: string; color: string }> = {
  belowReplacement: { label: 'BELOW REPLACEMENT', color: '#ef4444' },
  overpaid:         { label: 'OVERPAID', color: '#fb923c' },
  blocked:          { label: 'BLOCKED', color: '#a78bfa' },
  agingOut:         { label: 'AGING OUT', color: '#6b7280' },
  noOptions:        { label: 'OUT OF OPTIONS', color: '#f59e0b' },
  lowCeiling:       { label: 'LOW CEILING', color: '#64748b' },
};

function scoreCandidates(players: RosterPlayer[]): CutCandidate[] {
  // Only consider 40-man roster players
  const fortyManPlayers = players.filter(p => p.isOn40Man);

  // Compute position starters (highest OVR per position)
  const starterIds = new Set<number>();
  const byPos = new Map<string, RosterPlayer[]>();
  for (const p of fortyManPlayers) {
    const list = byPos.get(p.position) ?? [];
    list.push(p);
    byPos.set(p.position, list);
  }
  for (const [, group] of byPos) {
    const best = group.sort((a, b) => b.overall - a.overall)[0];
    if (best) starterIds.add(best.playerId);
  }

  const candidates: CutCandidate[] = [];

  for (const p of fortyManPlayers) {
    const ovrGrade = toGrade(p.overall);
    const potGrade = toGrade(p.potential);
    const isStarter = starterIds.has(p.playerId);
    const salaryM = p.salary / 1_000_000;

    let score = 0;
    const reasons: string[] = [];

    // OVR penalty: low OVR = higher cut score
    score += (80 - ovrGrade) * 2;

    // Age penalty for old non-stars
    if (p.age > 32) {
      score += (p.age - 32) * 3;
      if (ovrGrade < 55) reasons.push('agingOut');
    }

    // Salary cost factor
    if (salaryM > 2) {
      score += salaryM * 1.5;
      if (salaryM > 5 && ovrGrade < 50) reasons.push('overpaid');
    }

    // Starter bonus (less likely to cut starters)
    if (isStarter) score -= 25;

    // Potential upside discount
    if (potGrade - ovrGrade > 10 && p.age <= 28) score -= 15;

    // Below replacement
    if (ovrGrade < 35) reasons.push('belowReplacement');

    // Blocked: backup behind someone much better
    const posGroup = byPos.get(p.position) ?? [];
    if (!isStarter && posGroup.length >= 2) {
      const best = posGroup[0];
      if (best && toGrade(best.overall) - ovrGrade > 15) {
        reasons.push('blocked');
        score += 5;
      }
    }

    // Low ceiling
    if (potGrade < 45 && p.age > 26) reasons.push('lowCeiling');

    // Out of options
    if (p.optionYearsRemaining === 0 && !isStarter) {
      reasons.push('noOptions');
      score += 5;
    }

    if (reasons.length > 0 || score > 30) {
      candidates.push({ player: p, score, reasons: reasons.length > 0 ? reasons : ['lowCeiling'] });
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, 8);
}

export default function CutAdvisor({ players, fortyManCount, onClickPlayer }: CutAdvisorProps) {
  const candidates = useMemo(() => scoreCandidates(players), [players]);

  if (candidates.length === 0) {
    return (
      <div className="bloomberg-border">
        <div className="bloomberg-header">ROSTER ADVISOR</div>
        <div className="p-6 text-gray-500 text-xs text-center">
          No clear cut candidates at this time. Your roster looks solid.
        </div>
      </div>
    );
  }

  const spotsOver = Math.max(0, fortyManCount - 40);

  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span>ROSTER ADVISOR</span>
          {spotsOver > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              {spotsOver} OVER 40-MAN
            </span>
          )}
        </div>
        <span className="text-gray-500 font-normal text-[10px]">{candidates.length} candidates</span>
      </div>

      <div className="divide-y divide-gray-800/50">
        {candidates.map(c => {
          const ovrGrade = toGrade(c.player.overall);
          const potGrade = toGrade(c.player.potential);
          return (
            <div
              key={c.player.playerId}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/20 transition-colors"
            >
              {/* Player info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onClickPlayer(c.player.playerId)}
                    className="text-orange-300 hover:text-orange-200 text-xs font-bold transition-colors truncate"
                  >
                    {c.player.name}
                  </button>
                  <span className="text-gray-500 text-[10px]">{c.player.position}</span>
                  <AgingBadge age={c.player.age} position={c.player.position} compact />
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-gray-500 text-[10px] tabular-nums">OVR {ovrGrade}</span>
                  <span className="text-gray-500 text-[10px] tabular-nums">POT {potGrade}</span>
                  <span className="text-gray-500 text-[10px]">{formatSalary(c.player.salary)}</span>
                  <span className="text-gray-700 text-[10px]">{c.player.contractYearsRemaining}yr left</span>
                </div>
              </div>

              {/* Reason badges */}
              <div className="flex gap-1 flex-wrap justify-end shrink-0">
                {c.reasons.map(r => {
                  const badge = REASON_BADGES[r];
                  if (!badge) return null;
                  return (
                    <span
                      key={r}
                      className="text-[8px] font-black tracking-wider px-1.5 py-0.5 rounded"
                      style={{
                        color: badge.color,
                        background: `${badge.color}10`,
                        border: `1px solid ${badge.color}30`,
                      }}
                    >
                      {badge.label}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2 text-gray-500 text-[10px]" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        Candidates ranked by cut priority score. Consider team needs before making moves.
      </div>
    </div>
  );
}
