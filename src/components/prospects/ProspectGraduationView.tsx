import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoProspectGrads,
  getImpactLabel,
  getGradSummary,
  type ProspectGrad,
} from '../../engine/prospects/prospectGraduation';

function GradCard({ prospect }: { prospect: ProspectGrad }) {
  const impactInfo = getImpactLabel(prospect.impact);
  const potColor = prospect.potential >= 80 ? '#22c55e' : prospect.potential >= 70 ? '#eab308' : '#94a3b8';
  const graduated = prospect.graduatedVia !== null;
  const isPitcher = prospect.pos === 'SP' || prospect.pos === 'RP';

  const progressLabel = isPitcher
    ? `${prospect.inningsPitched}/${prospect.ipThreshold} IP`
    : `${prospect.atBats}/${prospect.abThreshold} AB`;

  return (
    <div className={`bloomberg-border ${graduated ? 'border-green-800/40' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-orange-300 font-bold text-sm">{prospect.name}</span>
              <span className="text-gray-700 text-[10px]">#{prospect.prospectRank}</span>
            </div>
            <div className="text-gray-600 text-[10px]">{prospect.pos} | Age {prospect.age} | {prospect.team}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
              style={{ backgroundColor: impactInfo.color + '22', color: impactInfo.color }}>
              {impactInfo.emoji} {impactInfo.label}
            </span>
            {graduated && (
              <span className="text-green-400 text-[10px] font-bold">GRADUATED</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div>
            <div className="text-gray-600">OVR</div>
            <div className="text-gray-300 font-bold">{prospect.overall}</div>
          </div>
          <div>
            <div className="text-gray-600">POTENTIAL</div>
            <div className="font-bold" style={{ color: potColor }}>{prospect.potential}</div>
          </div>
          <div>
            <div className="text-gray-600">{isPitcher ? 'IP' : 'AB'}</div>
            <div className="text-gray-300 tabular-nums">{progressLabel}</div>
          </div>
          <div>
            <div className="text-gray-600">DAYS</div>
            <div className="text-gray-300 tabular-nums">{prospect.daysOnRoster}/{prospect.daysThreshold}</div>
          </div>
        </div>

        {/* Graduation progress bar */}
        <div className="mb-1">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-gray-600">GRADUATION PROGRESS</span>
            <span className="font-bold tabular-nums" style={{ color: prospect.pctToGraduation >= 100 ? '#22c55e' : prospect.pctToGraduation >= 75 ? '#eab308' : '#94a3b8' }}>
              {prospect.pctToGraduation}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all"
              style={{
                width: `${prospect.pctToGraduation}%`,
                backgroundColor: prospect.pctToGraduation >= 100 ? '#22c55e' : prospect.pctToGraduation >= 75 ? '#eab308' : '#3b82f6',
              }} />
          </div>
        </div>

        {graduated && prospect.graduatedVia && (
          <div className="text-green-400 text-[10px] mt-1">
            Graduated via {prospect.graduatedVia === 'ab' ? 'at-bats' : prospect.graduatedVia === 'ip' ? 'innings pitched' : 'days on roster'}
          </div>
        )}

        <div className="text-gray-600 text-[10px] mt-1">Called up: {prospect.callUpDate}</div>
      </div>
    </div>
  );
}

export default function ProspectGraduationView() {
  const { gameStarted } = useGameStore();
  const [prospects] = useState(() => generateDemoProspectGrads());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getGradSummary(prospects);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PROSPECT GRADUATION</span>
        <span className="text-gray-600 text-[10px]">{summary.total} PROSPECTS CALLED UP</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CALLED UP</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.total}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GRADUATED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.graduated}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">NEAR GRAD</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.nearGrad}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ELITE IMPACT</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.eliteImpact}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {prospects.sort((a, b) => a.prospectRank - b.prospectRank).map(p => (
          <GradCard key={p.id} prospect={p} />
        ))}
      </div>
    </div>
  );
}
