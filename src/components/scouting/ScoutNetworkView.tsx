import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  REGION_DISPLAY,
  generateDemoScouts,
  calculateCoverage,
  getNetworkSummary,
  getIntelLabel,
  assignScout,
  unassignScout,
  type Scout,
  type ScoutRegion,
  type RegionCoverage,
} from '../../engine/scouting/scoutNetwork';

function RegionCard({ coverage }: { coverage: RegionCoverage }) {
  const info = REGION_DISPLAY[coverage.region];
  const intelInfo = getIntelLabel(coverage.intelLevel);
  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span>{info.emoji}</span>
            <span className="font-bold text-xs" style={{ color: info.color }}>{info.label}</span>
          </div>
          <span className="text-[10px] font-bold" style={{ color: intelInfo.color }}>{intelInfo.label}</span>
        </div>
        <div className="text-gray-500 text-[10px] mb-2">{info.desc}</div>
        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1.5">
          <div className="h-full rounded-full transition-all" style={{ width: `${coverage.intelLevel}%`, backgroundColor: info.color }} />
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-600">Scouts: <span className="text-gray-300">{coverage.scoutsAssigned}</span></span>
          <span className="text-gray-600">Found: <span className="text-gray-300">{coverage.prospectsFound}</span></span>
          {coverage.topProspectOvr > 0 && (
            <span className="text-gray-600">Top: <span className="text-orange-400 font-bold">{coverage.topProspectOvr} OVR</span></span>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoutRow({ scout, onAssign, onUnassign }: { scout: Scout; onAssign: (r: ScoutRegion) => void; onUnassign: () => void }) {
  const ovrColor = scout.overall >= 75 ? '#22c55e' : scout.overall >= 65 ? '#eab308' : '#ef4444';
  const specInfo = REGION_DISPLAY[scout.specialty];

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800/30 last:border-0 text-xs">
      <span className="font-bold tabular-nums w-7 text-right" style={{ color: ovrColor }}>{scout.overall}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-orange-300 font-bold truncate">{scout.name}</span>
          <span className="text-gray-700 text-[10px]">{scout.experience}yr</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>Eye: {scout.eyeForTalent}/10</span>
          <span>Reports: {scout.reportsThisSeason}</span>
          {scout.topFind && <span className="text-green-400">Find: {scout.topFind}</span>}
        </div>
      </div>
      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
        style={{ backgroundColor: specInfo.color + '22', color: specInfo.color }}>
        {specInfo.emoji} {specInfo.label}
      </span>
      {scout.assignment ? (
        <button onClick={onUnassign}
          className="text-[10px] font-bold px-2 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30">
          RECALL
        </button>
      ) : (
        <select
          onChange={e => onAssign(e.target.value as ScoutRegion)}
          value=""
          className="text-[10px] bg-gray-800 text-gray-400 rounded px-1 py-1 border border-gray-700">
          <option value="" disabled>ASSIGN</option>
          {Object.keys(REGION_DISPLAY).map(r => (
            <option key={r} value={r}>{REGION_DISPLAY[r as ScoutRegion].label}</option>
          ))}
        </select>
      )}
    </div>
  );
}

export default function ScoutNetworkView() {
  const { gameStarted } = useGameStore();
  const [scouts, setScouts] = useState<Scout[]>(() => generateDemoScouts());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const coverage = calculateCoverage(scouts);
  const summary = getNetworkSummary(scouts, coverage);

  const handleAssign = (scoutId: number, region: ScoutRegion) => {
    setScouts(prev => prev.map(s => s.id === scoutId ? assignScout(s, region) : s));
  };
  const handleUnassign = (scoutId: number) => {
    setScouts(prev => prev.map(s => s.id === scoutId ? unassignScout(s) : s));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SCOUTING NETWORK</span>
        <span className="text-gray-600 text-[10px]">{summary.coveragePct}% GLOBAL COVERAGE</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SCOUTS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.totalScouts}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ASSIGNED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.assigned}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">UNASSIGNED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.unassigned}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG OVR</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgOvr}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">BUDGET</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">${summary.totalSalary.toFixed(1)}M</div>
        </div>
      </div>

      {/* Region coverage */}
      <div>
        <div className="text-gray-500 text-[10px] font-bold mb-2 px-1">REGIONAL COVERAGE</div>
        <div className="grid grid-cols-4 gap-2">
          {coverage.map(c => <RegionCard key={c.region} coverage={c} />)}
        </div>
      </div>

      {/* Scout roster */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">SCOUT ROSTER ({scouts.length})</div>
        {scouts.map(s => (
          <ScoutRow key={s.id} scout={s}
            onAssign={r => handleAssign(s.id, r)}
            onUnassign={() => handleUnassign(s.id)} />
        ))}
      </div>
    </div>
  );
}
