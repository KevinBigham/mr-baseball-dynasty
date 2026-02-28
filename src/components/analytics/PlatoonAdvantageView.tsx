import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  SPLIT_DISPLAY,
  generateDemoPlatoonHitters,
  generateDemoPlatoonPitchers,
  getPlatoonSummary,
  type PlatoonHitter,
  type PlatoonPitcher,
} from '../../engine/analytics/platoonAdvantage';

function HitterCard({ h }: { h: PlatoonHitter }) {
  const splitInfo = SPLIT_DISPLAY[h.splitGrade];
  const ovrColor = h.overall >= 80 ? '#22c55e' : h.overall >= 70 ? '#eab308' : '#94a3b8';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {h.overall}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-orange-300 font-bold text-sm">{h.name}</span>
                <span className="text-gray-600 text-[10px]">{h.pos} ({h.hand})</span>
              </div>
              {h.platoonPartner && <div className="text-purple-400 text-[9px]">Platoon: {h.platoonPartner}</div>}
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: splitInfo.color + '22', color: splitInfo.color }}>
            {splitInfo.label}
          </span>
        </div>

        {/* Split comparison */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bloomberg-border px-2 py-1">
            <div className="text-red-400 font-bold text-[9px] mb-1">vs RHP ({h.vsRHP.pa} PA)</div>
            <div className="grid grid-cols-4 gap-1">
              <div><span className="text-gray-600">AVG</span> <div className="text-gray-300 font-bold tabular-nums">{h.vsRHP.avg.toFixed(3)}</div></div>
              <div><span className="text-gray-600">OBP</span> <div className="text-gray-300 font-bold tabular-nums">{h.vsRHP.obp.toFixed(3)}</div></div>
              <div><span className="text-gray-600">SLG</span> <div className="text-gray-300 font-bold tabular-nums">{h.vsRHP.slg.toFixed(3)}</div></div>
              <div><span className="text-gray-600">HR</span> <div className="text-gray-300 font-bold tabular-nums">{h.vsRHP.hr}</div></div>
            </div>
          </div>
          <div className="bloomberg-border px-2 py-1">
            <div className="text-blue-400 font-bold text-[9px] mb-1">vs LHP ({h.vsLHP.pa} PA)</div>
            <div className="grid grid-cols-4 gap-1">
              <div><span className="text-gray-600">AVG</span> <div className="text-gray-300 font-bold tabular-nums">{h.vsLHP.avg.toFixed(3)}</div></div>
              <div><span className="text-gray-600">OBP</span> <div className="text-gray-300 font-bold tabular-nums">{h.vsLHP.obp.toFixed(3)}</div></div>
              <div><span className="text-gray-600">SLG</span> <div className="text-gray-300 font-bold tabular-nums">{h.vsLHP.slg.toFixed(3)}</div></div>
              <div><span className="text-gray-600">HR</span> <div className="text-gray-300 font-bold tabular-nums">{h.vsLHP.hr}</div></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-[10px]">
          <span className="text-gray-600">OPS Split: <span className="font-bold" style={{ color: splitInfo.color }}>
            {h.opsSplit > 0 ? '+' : ''}{h.opsSplit.toFixed(3)}
          </span></span>
          {h.shouldPlatoon && <span className="text-red-400 font-bold">PLATOON CANDIDATE</span>}
        </div>
      </div>
    </div>
  );
}

function PitcherCard({ p }: { p: PlatoonPitcher }) {
  const splitInfo = SPLIT_DISPLAY[p.splitGrade];
  const ovrColor = p.overall >= 85 ? '#22c55e' : p.overall >= 75 ? '#eab308' : '#94a3b8';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border"
            style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
            {p.overall}
          </div>
          <div>
            <span className="text-orange-300 font-bold text-sm">{p.name}</span>
            <span className="text-gray-600 text-[10px] ml-1">({p.hand}HP)</span>
          </div>
        </div>
        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
          style={{ backgroundColor: splitInfo.color + '22', color: splitInfo.color }}>
          {splitInfo.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div>
          <span className="text-gray-600">vs RHB:</span>{' '}
          <span className="text-gray-300 tabular-nums">{p.vsRHB.ops.toFixed(3)} OPS | {p.vsRHB.kRate}% K</span>
        </div>
        <div>
          <span className="text-gray-600">vs LHB:</span>{' '}
          <span className="text-gray-300 tabular-nums">{p.vsLHB.ops.toFixed(3)} OPS | {p.vsLHB.kRate}% K</span>
        </div>
      </div>
    </div>
  );
}

export default function PlatoonAdvantageView() {
  const { gameStarted } = useGameStore();
  const [hitters] = useState<PlatoonHitter[]>(() => generateDemoPlatoonHitters());
  const [pitchers] = useState<PlatoonPitcher[]>(() => generateDemoPlatoonPitchers());
  const [tab, setTab] = useState<'hitters' | 'pitchers'>('hitters');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getPlatoonSummary(hitters);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PLATOON ADVANTAGE MATRIX</span>
        <span className="text-gray-600 text-[10px]">L/R SPLIT ANALYSIS</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">AVG SPLIT</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.avgSplit.toFixed(3)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MASSIVE</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.massiveSplitCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">MINIMAL</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.minimalSplitCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PLATOON PAIRS</div>
          <div className="text-purple-400 font-bold text-xl tabular-nums">{summary.platoonPairs}</div>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1">
        {(['hitters', 'pitchers'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${tab === t ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'hitters' && (
        <div className="grid grid-cols-2 gap-3">
          {hitters.sort((a, b) => Math.abs(b.opsSplit) - Math.abs(a.opsSplit)).map(h => (
            <HitterCard key={h.id} h={h} />
          ))}
        </div>
      )}

      {tab === 'pitchers' && (
        <div className="grid grid-cols-2 gap-3">
          {pitchers.map(p => (
            <PitcherCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
