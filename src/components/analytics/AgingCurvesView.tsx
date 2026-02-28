import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { AgingSpeed } from '../../engine/analytics/agingCurves';
import {
  AGING_SPEED_DISPLAY,
  getAgingCurvesSummary,
  generateDemoAgingCurves,
} from '../../engine/analytics/agingCurves';

function SpeedBadge({ speed }: { speed: AgingSpeed }) {
  const info = AGING_SPEED_DISPLAY[speed];
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

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? '#22c55e' : value >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all"
        style={{ width: `${value}%`, backgroundColor: color }} />
    </div>
  );
}

export default function AgingCurvesView() {
  const { gameStarted } = useGameStore();

  const profiles = useMemo(() => generateDemoAgingCurves(), []);
  const summary = useMemo(() => getAgingCurvesSummary(profiles), [profiles]);
  const [selectedId, setSelectedId] = useState<string | null>(profiles[0]?.id ?? null);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const selected = profiles.find(p => p.id === selectedId) ?? null;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>AGING CURVE PROJECTIONS</span>
        <span className="text-gray-600 text-[10px]">{summary.totalPlayers} PLAYERS</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-2">
        <StatCard label="PLAYERS" value={summary.totalPlayers} />
        <StatCard label="FASTEST AGER" value={summary.fastestAger} />
        <StatCard label="SLOWEST AGER" value={summary.slowestAger} />
        <StatCard label="AVG PEAK AGE" value={summary.avgPeakAge} />
        <StatCard label="HIGHEST PEAK" value={summary.highestPeak} />
      </div>

      {/* Two-column layout: table + detail */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left: player table */}
        <div className="col-span-2 bloomberg-border">
          <div className="bloomberg-header text-gray-500">PLAYER AGING PROFILES</div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800 text-[10px]">
                <th className="px-3 py-1.5 text-left">NAME</th>
                <th className="px-3 py-1.5 text-center">AGE</th>
                <th className="px-3 py-1.5 text-right">WAR</th>
                <th className="px-3 py-1.5 text-center">PEAK</th>
                <th className="px-3 py-1.5 text-center">SPEED</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const isSelected = p.id === selectedId;
                const warColor = p.currentWAR >= 5 ? '#22c55e' : p.currentWAR >= 3 ? '#f59e0b' : '#ef4444';
                return (
                  <tr key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    className={`cursor-pointer border-b border-gray-800/30 transition-colors ${
                      isSelected ? 'bg-orange-900/20' : 'hover:bg-gray-800/20'
                    }`}>
                    <td className="px-3 py-2">
                      <div className="text-orange-300 font-bold">{p.name}</div>
                      <div className="text-gray-600 text-[10px]">{p.team} | {p.position}</div>
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums text-gray-300">{p.currentAge}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold" style={{ color: warColor }}>
                      {p.currentWAR.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-center tabular-nums text-gray-400">
                      {p.peakAge} / {p.peakWAR.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <SpeedBadge speed={p.agingSpeed} />
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
              {/* Player header */}
              <div className="bloomberg-border px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-orange-300 font-bold text-sm">{selected.name}</div>
                  <SpeedBadge speed={selected.agingSpeed} />
                </div>
                <div className="text-gray-600 text-[10px]">
                  {selected.team} | {selected.position} | Age {selected.currentAge}
                </div>
                <div className="flex items-center gap-4 mt-2 text-[10px]">
                  <div>
                    <span className="text-gray-600">CURRENT WAR: </span>
                    <span className="text-orange-400 font-bold tabular-nums">{selected.currentWAR.toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">PEAK: </span>
                    <span className="text-green-400 font-bold tabular-nums">{selected.peakWAR.toFixed(1)}</span>
                    <span className="text-gray-600"> @ {selected.peakAge}</span>
                  </div>
                </div>
              </div>

              {/* Projections table */}
              <div className="bloomberg-border">
                <div className="bloomberg-header text-gray-500">5-YEAR PROJECTIONS</div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 text-[10px] border-b border-gray-800">
                      <th className="px-3 py-1 text-left">AGE</th>
                      <th className="px-3 py-1 text-right">WAR</th>
                      <th className="px-3 py-1 text-right">CONF</th>
                      <th className="px-3 py-1 text-left w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.projections.map(proj => {
                      const warColor = proj.projectedWAR >= 5 ? '#22c55e'
                        : proj.projectedWAR >= 3 ? '#f59e0b'
                        : proj.projectedWAR >= 1 ? '#94a3b8'
                        : '#ef4444';
                      return (
                        <tr key={proj.age} className="border-b border-gray-800/30">
                          <td className="px-3 py-1.5 tabular-nums text-gray-400">{proj.age}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums font-bold"
                            style={{ color: warColor }}>
                            {proj.projectedWAR.toFixed(1)}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-gray-400">{proj.confidence}%</td>
                          <td className="px-3 py-1.5">
                            <ConfidenceBar value={proj.confidence} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Decline info */}
              <div className="bloomberg-border px-4 py-3">
                <div className="bloomberg-header text-gray-500 -mx-4 -mt-3 px-4 py-1 mb-2">DECLINE PROFILE</div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-gray-600">DECLINE STARTS</span>
                    <span className="text-gray-300 tabular-nums">Age {selected.declineStartAge}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">YEARS OF PRIME</span>
                    <span className="text-green-400 font-bold tabular-nums">{selected.yearsOfPrime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">YEARS UNTIL DECLINE</span>
                    <span className={`font-bold tabular-nums ${
                      selected.declineStartAge - selected.currentAge > 3 ? 'text-green-400'
                      : selected.declineStartAge - selected.currentAge > 0 ? 'text-yellow-400'
                      : 'text-red-400'
                    }`}>
                      {Math.max(0, selected.declineStartAge - selected.currentAge)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contract risk */}
              <div className="bloomberg-border px-4 py-3">
                <div className="bloomberg-header text-gray-500 -mx-4 -mt-3 px-4 py-1 mb-2">CONTRACT RISK</div>
                <div className="text-[10px] text-gray-400 leading-relaxed">{selected.contractRisk}</div>
              </div>

              {/* Notes */}
              <div className="bloomberg-border px-4 py-3">
                <div className="bloomberg-header text-gray-500 -mx-4 -mt-3 px-4 py-1 mb-2">NOTES</div>
                <div className="text-[10px] text-gray-400 leading-relaxed">{selected.notes}</div>
              </div>
            </>
          ) : (
            <div className="bloomberg-border px-4 py-8 text-center text-gray-600 text-xs">
              Select a player to view aging projections.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
