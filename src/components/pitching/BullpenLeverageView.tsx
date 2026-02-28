import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { LeverageRole } from '../../engine/pitching/bullpenLeverageRoles';
import {
  LEVERAGE_ROLE_DISPLAY,
  getBullpenLeverageSummary,
  generateDemoBullpenLeverage,
} from '../../engine/pitching/bullpenLeverageRoles';

function RoleBadge({ role }: { role: LeverageRole }) {
  const info = LEVERAGE_ROLE_DISPLAY[role];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.label}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bloomberg-border px-3 py-2 text-center">
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className="text-orange-400 font-bold text-lg tabular-nums">{value}</div>
      {sub && <div className="text-gray-600 text-[10px]">{sub}</div>}
    </div>
  );
}

function ERABar({ era, label }: { era: number; label: string }) {
  const pct = Math.max(0, Math.min(100, 100 - (era / 7) * 100));
  const color = era <= 2.50 ? '#22c55e' : era <= 3.50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-600 text-[10px] w-14">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-gray-400 text-[10px] tabular-nums w-10 text-right" style={{ color }}>
        {era.toFixed(2)}
      </span>
    </div>
  );
}

export default function BullpenLeverageView() {
  const { gameStarted } = useGameStore();

  const relievers = useMemo(() => generateDemoBullpenLeverage(), []);
  const summary = useMemo(() => getBullpenLeverageSummary(relievers), [relievers]);
  const [selectedId, setSelectedId] = useState<string | null>(relievers[0]?.id ?? null);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const selected = relievers.find(r => r.id === selectedId) ?? null;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>BULLPEN LEVERAGE ROLES</span>
        <span className="text-gray-600 text-[10px]">{summary.totalRelievers} RELIEVERS</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-2">
        <StatCard label="RELIEVERS" value={summary.totalRelievers} />
        <StatCard label="BEST HIGH LEV" value={summary.bestHighLev} />
        <StatCard label="CLOSER" value={summary.closerName} />
        <StatCard label="ROLE MATCH%" value={`${summary.avgRoleMatch}%`} />
        <StatCard label="MISCAST" value={summary.misscastCount} sub={summary.misscastCount > 0 ? 'wrong role' : 'all good'} />
      </div>

      {/* Two-column layout: table + detail */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left: reliever table */}
        <div className="col-span-2 bloomberg-border">
          <div className="bloomberg-header text-gray-500">RELIEVER DEPLOYMENT</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 text-[10px]">
                <th className="px-3 py-1.5 text-left">NAME</th>
                <th className="px-3 py-1.5 text-center">ROLE</th>
                <th className="px-3 py-1.5 text-right">ERA</th>
                <th className="px-3 py-1.5 text-right">K/9</th>
                <th className="px-3 py-1.5 text-right">MATCH%</th>
              </tr>
            </thead>
            <tbody>
              {relievers.map(r => {
                const isSelected = r.id === selectedId;
                const eraColor = r.era <= 2.50 ? '#22c55e' : r.era <= 3.50 ? '#f59e0b' : '#ef4444';
                const matchColor = r.roleMatchPct >= 75 ? '#22c55e' : r.roleMatchPct >= 50 ? '#f59e0b' : '#ef4444';
                return (
                  <tr key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`cursor-pointer border-b border-gray-800/30 transition-colors ${
                      isSelected ? 'bg-orange-900/20' : 'hover:bg-gray-800/20'
                    }`}>
                    <td className="px-3 py-2">
                      <div className="text-orange-300 font-bold">{r.name}</div>
                      <div className="text-gray-600 text-[10px]">{r.throws}HP | Age {r.age}</div>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <RoleBadge role={r.currentRole} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold" style={{ color: eraColor }}>
                      {r.era.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-300">
                      {r.k9.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold" style={{ color: matchColor }}>
                      {r.roleMatchPct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Right: detail panel */}
        <div className="space-y-3">
          {selected ? (
            <>
              {/* Reliever header */}
              <div className="bloomberg-border px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-orange-300 font-bold text-sm">{selected.name}</div>
                  <span className="text-gray-600 text-[10px]">{selected.throws}HP</span>
                </div>
                <div className="text-gray-600 text-[10px]">
                  {selected.team} | Age {selected.age} | WHIP {selected.whip.toFixed(2)}
                </div>
              </div>

              {/* Current vs Optimal role */}
              <div className="bloomberg-border px-4 py-3">
                <div className="bloomberg-header text-gray-500 -mx-4 -mt-3 px-4 py-1 mb-2">ROLE ANALYSIS</div>
                <div className="space-y-2 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">CURRENT</span>
                    <RoleBadge role={selected.currentRole} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">OPTIMAL</span>
                    <RoleBadge role={selected.optimalRole} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">MATCH</span>
                    <span className={`font-bold tabular-nums ${
                      selected.roleMatchPct >= 75 ? 'text-green-400'
                      : selected.roleMatchPct >= 50 ? 'text-yellow-400'
                      : 'text-red-400'
                    }`}>
                      {selected.roleMatchPct}%
                    </span>
                  </div>
                  {selected.currentRole !== selected.optimalRole && (
                    <div className="mt-1 px-2 py-1 bg-red-900/20 border border-red-900/30 rounded text-red-400 text-[10px]">
                      MISCAST: Should be deployed as {LEVERAGE_ROLE_DISPLAY[selected.optimalRole].label}
                    </div>
                  )}
                </div>
              </div>

              {/* ERA by leverage */}
              <div className="bloomberg-border px-4 py-3">
                <div className="bloomberg-header text-gray-500 -mx-4 -mt-3 px-4 py-1 mb-2">ERA BY LEVERAGE</div>
                <div className="space-y-2">
                  <ERABar era={selected.highLevERA} label="HIGH LEV" />
                  <ERABar era={selected.medLevERA} label="MED LEV" />
                  <ERABar era={selected.lowLevERA} label="LOW LEV" />
                </div>
              </div>

              {/* Save / hold / inherited stats */}
              <div className="bloomberg-border px-4 py-3">
                <div className="bloomberg-header text-gray-500 -mx-4 -mt-3 px-4 py-1 mb-2">SITUATIONAL</div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">SAVE%</span>
                    <span className={`font-bold tabular-nums ${
                      selected.savePct >= 85 ? 'text-green-400'
                      : selected.savePct >= 70 ? 'text-yellow-400'
                      : selected.savePct > 0 ? 'text-red-400'
                      : 'text-gray-600'
                    }`}>
                      {selected.savePct > 0 ? `${selected.savePct}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">HOLDS</span>
                    <span className="text-gray-300 tabular-nums">{selected.holds}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IR STRANDED%</span>
                    <span className={`font-bold tabular-nums ${
                      selected.inheritedScore >= 75 ? 'text-green-400'
                      : selected.inheritedScore >= 60 ? 'text-yellow-400'
                      : 'text-red-400'
                    }`}>
                      {selected.inheritedScore}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bloomberg-border px-4 py-3">
                <div className="bloomberg-header text-gray-500 -mx-4 -mt-3 px-4 py-1 mb-2">NOTES</div>
                <div className="text-[10px] text-gray-400 leading-relaxed">{selected.notes}</div>
              </div>
            </>
          ) : (
            <div className="bloomberg-border px-4 py-8 text-center text-gray-600 text-xs">
              Select a reliever to view leverage analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
