import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  TIER_DISPLAY,
  generateDemoProjections,
  getProjectionSummary,
  type ContractProjection,
} from '../../engine/contracts/contractProjections';

function ProjectionCard({ proj }: { proj: ContractProjection }) {
  const tierInfo = TIER_DISPLAY[proj.tier];
  const ovrColor = proj.overall >= 85 ? '#22c55e' : proj.overall >= 75 ? '#eab308' : '#94a3b8';
  const surplusColor = proj.surplusValue > 0 ? '#22c55e' : proj.surplusValue < 0 ? '#ef4444' : '#6b7280';
  const riskColors: Record<string, string> = { low: '#22c55e', medium: '#eab308', high: '#ef4444' };

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {proj.overall}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-bold text-sm">{proj.name}</span>
                {proj.trendingUp && <span className="text-green-400 text-[9px]">📈</span>}
                {proj.ageConcern && <span className="text-red-400 text-[9px]">🕰️</span>}
              </div>
              <div className="text-gray-600 text-[10px]">{proj.pos} | Age {proj.age} | FA {proj.faYear}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: tierInfo.color + '22', color: tierInfo.color }}>
            {tierInfo.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">CURRENT</div>
            <div className="text-gray-300 font-bold tabular-nums">${proj.currentSalary}M/yr</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">PROJ AAV</div>
            <div className="text-orange-400 font-bold tabular-nums">${proj.projectedAAV}M</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">PROJ TOTAL</div>
            <div className="font-bold tabular-nums" style={{ color: tierInfo.color }}>${proj.projectedTotal}M</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">SURPLUS</div>
            <div className="font-bold tabular-nums" style={{ color: surplusColor }}>
              {proj.surplusValue > 0 ? '+' : ''}${proj.surplusValue}M
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-gray-600">Yrs Left: <span className="text-gray-300 font-bold">{proj.yearsRemaining}</span></span>
          <span className="text-gray-600">Proj: <span className="text-gray-300">{proj.projectedYears}yr/${proj.projectedTotal}M</span></span>
          <span className="font-bold" style={{ color: riskColors[proj.riskLevel] }}>
            {proj.riskLevel.toUpperCase()} RISK
          </span>
        </div>

        {proj.comparables.length > 0 && (
          <div className="text-[9px] text-gray-500 mt-1">
            Comps: {proj.comparables.join(' | ')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContractProjectionsView() {
  const { gameStarted } = useGameStore();
  const [projections] = useState<ContractProjection[]>(() => generateDemoProjections());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getProjectionSummary(projections);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>CONTRACT PROJECTIONS</span>
        <span className="text-gray-600 text-[10px]">MARKET VALUE ANALYSIS</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COMMITTED</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">${summary.totalCommitted}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL SURPLUS</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.totalSurplus >= 0 ? '#22c55e' : '#ef4444' }}>
            {summary.totalSurplus > 0 ? '+' : ''}${summary.totalSurplus}M
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MEGA DEALS</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.megaDealCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">UPCOMING FAs</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.upcomingFAs}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {projections.sort((a, b) => b.surplusValue - a.surplusValue).map(p => (
          <ProjectionCard key={p.id} proj={p} />
        ))}
      </div>
    </div>
  );
}
