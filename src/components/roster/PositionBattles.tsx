/**
 * PositionBattles — Detects and displays roster competitions
 * where starter and backup are within 5 OVR points (20-80 scale).
 * Ported from MFD's detectPositionBattles974 concept.
 */

import type { RosterPlayer } from '../../types/league';
import { toGrade } from '../../utils/gradeColor';
import AgingBadge from '../shared/AgingBadge';
import { formatSalary } from '../../utils/format';
import { useState } from 'react';

interface Battle {
  position: string;
  incumbent: RosterPlayer;
  challenger: RosterPlayer;
  gap: number; // OVR gap on 20-80 scale
}

function detectBattles(players: RosterPlayer[]): Battle[] {
  // Group by position
  const byPos = new Map<string, RosterPlayer[]>();
  for (const p of players) {
    const list = byPos.get(p.position) ?? [];
    list.push(p);
    byPos.set(p.position, list);
  }

  const battles: Battle[] = [];
  for (const [position, group] of byPos) {
    if (group.length < 2) continue;
    // Sort by overall descending
    const sorted = [...group].sort((a, b) => b.overall - a.overall);
    const incumbent = sorted[0];
    const challenger = sorted[1];
    const gap = toGrade(incumbent.overall) - toGrade(challenger.overall);
    if (gap <= 5) {
      battles.push({ position, incumbent, challenger, gap });
    }
  }

  // Sort by closest battles first, limit to 4
  return battles.sort((a, b) => a.gap - b.gap).slice(0, 4);
}

function CompareBar({ label, left, right, unit, inverse }: {
  label: string;
  left: number;
  right: number;
  unit?: string;
  inverse?: boolean;
}) {
  const leftWins = inverse ? left < right : left > right;
  const rightWins = inverse ? right < left : right > left;
  const tied = left === right;

  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span
        className={`w-10 text-right tabular-nums font-bold ${leftWins ? 'text-green-400' : tied ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {unit === '$' ? formatSalary(left) : left}
      </span>
      <span className="flex-1 text-center text-gray-500 text-[9px]">{label}</span>
      <span
        className={`w-10 text-left tabular-nums font-bold ${rightWins ? 'text-green-400' : tied ? 'text-gray-400' : 'text-gray-500'}`}
      >
        {unit === '$' ? formatSalary(right) : right}
      </span>
    </div>
  );
}

function BattleCard({ battle, onClickPlayer }: {
  battle: Battle;
  onClickPlayer: (id: number) => void;
}) {
  const { incumbent, challenger, position, gap } = battle;
  const iOvr = toGrade(incumbent.overall);
  const cOvr = toGrade(challenger.overall);
  const iPot = toGrade(incumbent.potential);
  const cPot = toGrade(challenger.potential);

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(251,191,36,0.2)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{ background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.15)' }}
      >
        <span className="text-yellow-500 text-[10px] font-black tracking-widest">⚔️ {position} BATTLE</span>
        <span className="text-gray-500 text-[9px]">{gap === 0 ? 'DEAD HEAT' : `${gap} pt gap`}</span>
      </div>

      {/* Players */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-0 px-3 py-2">
        {/* Incumbent */}
        <div className="text-right">
          <button
            onClick={() => onClickPlayer(incumbent.playerId)}
            className="text-orange-300 hover:text-orange-200 text-xs font-bold transition-colors"
          >
            {incumbent.name}
          </button>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="text-gray-500 text-[9px]">STARTER</span>
            <AgingBadge age={incumbent.age} position={position} compact />
          </div>
        </div>

        {/* VS divider */}
        <div className="px-3 flex items-center">
          <span className="text-gray-500 text-[9px] font-bold">VS</span>
        </div>

        {/* Challenger */}
        <div className="text-left">
          <button
            onClick={() => onClickPlayer(challenger.playerId)}
            className="text-orange-300 hover:text-orange-200 text-xs font-bold transition-colors"
          >
            {challenger.name}
          </button>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-gray-500 text-[9px]">CHALLENGER</span>
            <AgingBadge age={challenger.age} position={position} compact />
          </div>
        </div>
      </div>

      {/* Comparison bars */}
      <div className="px-3 pb-2 space-y-0.5">
        <CompareBar label="OVR" left={iOvr} right={cOvr} />
        <CompareBar label="POT" left={iPot} right={cPot} />
        <CompareBar label="AGE" left={incumbent.age} right={challenger.age} inverse />
        <CompareBar label="SAL" left={incumbent.salary} right={challenger.salary} unit="$" inverse />
      </div>
    </div>
  );
}

interface PositionBattlesProps {
  players: RosterPlayer[];
  onClickPlayer: (id: number) => void;
}

export default function PositionBattles({ players, onClickPlayer }: PositionBattlesProps) {
  const [expanded, setExpanded] = useState(true);
  const battles = detectBattles(players);

  if (battles.length === 0) return null;

  return (
    <div className="bloomberg-border mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="bloomberg-header w-full flex items-center justify-between cursor-pointer hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>POSITION BATTLES</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
          >
            {battles.length}
          </span>
        </div>
        <span className="text-gray-500 text-[10px]">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {battles.map(b => (
            <BattleCard
              key={`${b.position}-${b.incumbent.playerId}`}
              battle={b}
              onClickPlayer={onClickPlayer}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { detectBattles };
