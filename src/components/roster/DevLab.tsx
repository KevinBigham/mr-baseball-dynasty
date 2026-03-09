/**
 * DevLab.tsx — Player Development Lab
 *
 * Bloomberg-styled panel for assigning minor league prospects to
 * focused training programs that boost specific attributes at the
 * cost of others during offseason development.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useUIStore } from '../../store/uiStore';
import type { RosterPlayer } from '../../types/league';
import type { DevAssignment, DevProgram, ProgramDefinition } from '../../engine/devPrograms';
import { DEV_PROGRAMS, getProgramsForPlayer } from '../../engine/devPrograms';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert raw OVR (0-550) to scouting scale (20-80) */
function toScout(ovr: number): number {
  return Math.round(20 + (Math.max(0, Math.min(550, ovr)) / 550) * 60);
}

/** Friendly attribute name for display */
function attrLabel(attr: string): string {
  const map: Record<string, string> = {
    contact: 'CON', power: 'POW', eye: 'EYE', speed: 'SPD',
    fielding: 'FLD', stuff: 'STF', command: 'CMD', movement: 'MOV',
    stamina: 'STA',
  };
  return map[attr] ?? attr.toUpperCase();
}

// ─── Program Selector Row ──────────────────────────────────────────────────

function ProgramSelector({
  programs,
  currentProgram,
  onSelect,
}: {
  programs: ProgramDefinition[];
  currentProgram: DevProgram | null;
  onSelect: (program: DevProgram) => void;
}) {
  return (
    <select
      value={currentProgram ?? 'balanced'}
      onChange={e => onSelect(e.target.value as DevProgram)}
      className="bg-gray-800 text-gray-300 text-xs border border-gray-700 px-2 py-1
                 focus:border-orange-700 outline-none cursor-pointer"
      style={{ minWidth: '140px' }}
    >
      {programs.map(p => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}

// ─── Prospect Row ────────────────────────────────────────────────────────────

function ProspectRow({
  player,
  programs,
  assignment,
  onAssign,
  onRemove,
  onClickPlayer,
}: {
  player: RosterPlayer;
  programs: ProgramDefinition[];
  assignment: DevAssignment | null;
  onAssign: (playerId: number, program: DevProgram) => void;
  onRemove: (playerId: number) => void;
  onClickPlayer: (playerId: number) => void;
}) {
  const currentProgram = assignment?.program ?? null;
  const activeProgramDef = currentProgram && currentProgram !== 'balanced'
    ? DEV_PROGRAMS.find(p => p.id === currentProgram)
    : null;

  const ovrScout = toScout(player.overall);
  const potScout = toScout(player.potential);

  return (
    <tr className="bloomberg-row text-xs border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
      {/* Name */}
      <td
        className="px-3 py-2 font-bold text-orange-300 cursor-pointer hover:text-orange-200 whitespace-nowrap"
        onClick={() => onClickPlayer(player.playerId)}
      >
        {player.name}
      </td>

      {/* Position */}
      <td className="px-2 py-2 text-gray-500">{player.position}</td>

      {/* Age */}
      <td className="px-2 py-2 tabular-nums text-right text-gray-400">{player.age}</td>

      {/* OVR / POT */}
      <td className="px-2 py-2 tabular-nums text-right">
        <span className="text-orange-400 font-bold">{ovrScout}</span>
        <span className="text-gray-500 mx-0.5">/</span>
        <span className="text-gray-400">{potScout}</span>
      </td>

      {/* Program Selector */}
      <td className="px-2 py-2">
        <ProgramSelector
          programs={programs}
          currentProgram={currentProgram}
          onSelect={(prog) => onAssign(player.playerId, prog)}
        />
      </td>

      {/* Boost indicator */}
      <td className="px-2 py-2 text-center whitespace-nowrap">
        {activeProgramDef ? (
          <span className="text-green-400 font-bold text-xs">
            {attrLabel(activeProgramDef.boostAttr)} +{activeProgramDef.boostAmount}
          </span>
        ) : (
          <span className="text-gray-700">--</span>
        )}
      </td>

      {/* Penalty indicator */}
      <td className="px-2 py-2 text-center whitespace-nowrap">
        {activeProgramDef ? (
          <span className="text-red-400 font-bold text-xs">
            {attrLabel(activeProgramDef.penaltyAttr)} {activeProgramDef.penaltyAmount}
          </span>
        ) : (
          <span className="text-gray-700">--</span>
        )}
      </td>

      {/* Remove button */}
      <td className="px-2 py-2 text-center">
        {assignment && assignment.program !== 'balanced' ? (
          <button
            onClick={() => onRemove(player.playerId)}
            className="text-gray-500 hover:text-red-400 text-xs transition-colors px-1"
            title="Remove assignment"
          >
            X
          </button>
        ) : null}
      </td>
    </tr>
  );
}

// ─── Main DevLab Component ────────────────────────────────────────────────────

export default function DevLab({
  players,
}: {
  players: RosterPlayer[];
}) {
  const [assignments, setAssignments] = useState<Record<number, DevAssignment>>({});
  const [loading, setLoading] = useState(true);
  const { addToast, setSelectedPlayer, setActiveTab } = useUIStore();

  // Load existing assignments from worker
  useEffect(() => {
    (async () => {
      try {
        const engine = getEngine();
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        const data = await engine.getDevAssignments();
        setAssignments(data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter prospects: minor leaguers, age <= 28, potential > overall, NOT on MLB active roster
  const prospects = useMemo(() => {
    return players
      .filter(p => {
        const isMLB = p.rosterStatus === 'MLB_ACTIVE' || p.rosterStatus === 'MLB_IL_10' || p.rosterStatus === 'MLB_IL_60';
        if (isMLB) return false;
        if (p.age > 28) return false;
        if (p.potential <= p.overall) return false;
        return true;
      })
      .sort((a, b) => b.potential - a.potential);
  }, [players]);

  const slotsUsed = useMemo(() => {
    return Object.values(assignments).filter(a => a.program !== 'balanced').length;
  }, [assignments]);

  const handleAssign = useCallback(async (playerId: number, program: DevProgram) => {
    const engine = getEngine();
    if (program === 'balanced') {
      // Remove the assignment
      const res = await engine.removeDevProgram(playerId);
      if (res.ok) {
        setAssignments(prev => {
          const next = { ...prev };
          delete next[playerId];
          return next;
        });
      }
      return;
    }
    const result = await engine.assignDevProgram(playerId, program);
    if (result.ok) {
      setAssignments(prev => ({
        ...prev,
        [playerId]: { playerId, program, assignedSeason: 0 },
      }));
    } else {
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      addToast(result.error ?? 'Failed to assign program.', 'error');
    }
  }, [addToast]);

  const handleRemove = useCallback(async (playerId: number) => {
    const engine = getEngine();
    const res = await engine.removeDevProgram(playerId);
    if (res.ok) {
      setAssignments(prev => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
    }
  }, []);

  const openPlayer = useCallback((id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  }, [setSelectedPlayer, setActiveTab]);

  if (loading) {
    return (
      <div className="bloomberg-border" style={{ background: '#0a0a0f' }}>
        <div className="bloomberg-header px-4">PLAYER DEVELOPMENT LAB</div>
        <div className="p-6 text-center text-gray-500 text-xs">Loading...</div>
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <div className="bloomberg-border" style={{ background: '#0a0a0f' }}>
        <div className="bloomberg-header px-4">PLAYER DEVELOPMENT LAB</div>
        <div className="p-6 text-center">
          <div className="text-gray-500 text-sm mb-2">No eligible prospects found.</div>
          <div className="text-gray-500 text-xs">
            Prospects must be in the minors, age 28 or younger, with potential above current overall.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bloomberg-border" style={{ background: '#0a0a0f' }}>
      {/* Header */}
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>PLAYER DEVELOPMENT LAB</span>
        <div className="flex items-center gap-4 font-normal normal-case">
          <span className="text-xs">
            <span
              className={`font-bold tabular-nums ${slotsUsed >= 10 ? 'text-red-400' : 'text-orange-400'}`}
            >
              {slotsUsed}
            </span>
            <span className="text-gray-500">/10 SLOTS USED</span>
          </span>
        </div>
      </div>

      {/* Description bar */}
      <div className="px-4 py-2 border-b border-gray-800 text-xs text-gray-500">
        Assign minor league prospects to focused training programs. Each program boosts one attribute
        at the cost of another during offseason development. Maximum 10 active assignments.
      </div>

      {/* Summary stats */}
      <div className="px-4 py-2 border-b border-gray-800 flex gap-6 flex-wrap">
        {[
          { label: 'PROSPECTS', value: String(prospects.length), color: '#f97316' },
          { label: 'ASSIGNED', value: String(slotsUsed), color: slotsUsed >= 10 ? '#ef4444' : '#4ade80' },
          { label: 'AVAILABLE', value: String(Math.max(0, 10 - slotsUsed)), color: '#94a3b8' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-gray-500 text-[10px] uppercase">{s.label}</div>
            <div className="font-bold text-sm tabular-nums" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <caption className="sr-only">Player Development Lab Assignments</caption>
          <thead>
            <tr className="text-gray-500 text-xs border-b border-gray-800">
              <th className="text-left px-3 py-1.5">NAME</th>
              <th className="text-left px-2 py-1.5">POS</th>
              <th className="text-right px-2 py-1.5">AGE</th>
              <th className="text-right px-2 py-1.5">OVR/POT</th>
              <th className="text-left px-2 py-1.5">PROGRAM</th>
              <th className="text-center px-2 py-1.5">BOOST</th>
              <th className="text-center px-2 py-1.5">COST</th>
              <th className="text-center px-2 py-1.5" />
            </tr>
          </thead>
          <tbody>
            {prospects.map(p => (
              <ProspectRow
                key={p.playerId}
                player={p}
                programs={getProgramsForPlayer(p.isPitcher)}
                assignment={assignments[p.playerId] ?? null}
                onAssign={handleAssign}
                onRemove={handleRemove}
                onClickPlayer={openPlayer}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Program Legend */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="text-gray-500 text-[10px] uppercase mb-2">PROGRAM REFERENCE</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {DEV_PROGRAMS.filter(p => p.id !== 'balanced').map(p => (
            <div key={p.id} className="flex items-center gap-2 text-xs py-0.5">
              <span className="text-orange-400 font-bold w-28 shrink-0">{p.name}</span>
              <span className="text-gray-500 flex-1 truncate">{p.description}</span>
              <span className="text-green-400 font-mono shrink-0">
                {attrLabel(p.boostAttr)}+{p.boostAmount}
              </span>
              <span className="text-red-400 font-mono shrink-0">
                {attrLabel(p.penaltyAttr)}{p.penaltyAmount}
              </span>
              <span className="text-gray-500 text-[10px] shrink-0">
                {p.forPitchers ? 'P' : 'H'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
