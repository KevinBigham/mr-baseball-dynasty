import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  TIER_DISPLAY,
  generateDemoCompPicks,
  type CompPickSummary,
  type DepartedFA,
  type CompPickResult,
} from '../../engine/draft/compPicks';

function DepartedFARow({ fa }: { fa: DepartedFA }) {
  const ovrColor = fa.overall >= 80 ? '#22c55e' : fa.overall >= 70 ? '#eab308' : '#94a3b8';
  const qoColor = fa.qualifyingOfferAccepted ? '#22c55e' : fa.qualifyingOfferMade ? '#f97316' : '#6b7280';

  return (
    <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800/30 border-b border-gray-800/50 text-[10px]">
      <span className="text-orange-300 font-bold w-28">{fa.name}</span>
      <span className="text-gray-600 w-8">{fa.pos}</span>
      <span className="tabular-nums font-bold w-8" style={{ color: ovrColor }}>{fa.overall}</span>
      <span className="text-gray-500 w-10">Age {fa.age}</span>
      <span className="font-bold w-16" style={{ color: qoColor }}>
        {fa.qualifyingOfferAccepted ? 'QO ACC' : fa.qualifyingOfferMade ? 'QO REJ' : 'NO QO'}
      </span>
      <span className="text-gray-400 flex-1">
        {fa.signedWith
          ? <>{fa.signedWith} — {fa.contractYears}yr/${fa.contractAAV}M</>
          : <span className="text-green-400">Returned (QO accepted)</span>
        }
      </span>
    </div>
  );
}

function CompPickCard({ pick }: { pick: CompPickResult }) {
  const tierInfo = TIER_DISPLAY[pick.tier];
  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1">
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: tierInfo.color + '22', color: tierInfo.color }}>
            {tierInfo.label} — {tierInfo.round}
          </span>
          <span className="text-gray-600 text-[10px] font-bold tabular-nums">{pick.player.overall} OVR</span>
        </div>
        <div className="text-gray-400 text-[10px]">{pick.reason}</div>
      </div>
    </div>
  );
}

export default function CompPicksView() {
  const { gameStarted } = useGameStore();
  const [data] = useState<CompPickSummary>(() => generateDemoCompPicks());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const qoMade = data.departedFAs.filter(f => f.qualifyingOfferMade).length;
  const qoRejected = data.departedFAs.filter(f => f.qualifyingOfferMade && !f.qualifyingOfferAccepted && f.signedWith).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>COMPENSATORY PICKS</span>
        <span className="text-gray-600 text-[10px]">{data.compPicks.length} COMP PICKS AWARDED</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DEPARTED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{data.departedFAs.filter(f => f.signedWith).length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GAINED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{data.gainedFAs.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">QO MADE</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{qoMade}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">QO REJECTED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{qoRejected}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COMP PICKS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{data.compPicks.length}</div>
        </div>
      </div>

      {/* Comp picks awarded */}
      {data.compPicks.length > 0 && (
        <div>
          <div className="text-gray-600 text-[10px] font-bold mb-2">COMPENSATORY PICKS AWARDED</div>
          <div className="space-y-2">
            {data.compPicks.map(p => (
              <CompPickCard key={p.id} pick={p} />
            ))}
          </div>
        </div>
      )}

      {/* Departed FAs */}
      <div className="bloomberg-border">
        <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-gray-600 font-bold border-b border-gray-700">
          <span className="w-28">NAME</span>
          <span className="w-8">POS</span>
          <span className="w-8">OVR</span>
          <span className="w-10">AGE</span>
          <span className="w-16">QO</span>
          <span className="flex-1">DESTINATION</span>
        </div>
        {data.departedFAs.map(fa => (
          <DepartedFARow key={fa.id} fa={fa} />
        ))}
      </div>

      {/* Gained FAs */}
      <div>
        <div className="text-gray-600 text-[10px] font-bold mb-2">FREE AGENTS GAINED</div>
        <div className="bloomberg-border">
          {data.gainedFAs.map(fa => (
            <div key={fa.id} className="flex items-center gap-2 px-3 py-2 text-[10px] border-b border-gray-800/50">
              <span className="text-orange-300 font-bold">{fa.name}</span>
              <span className="text-gray-600">{fa.pos}</span>
              <span className="text-gray-300 tabular-nums font-bold">{fa.overall}</span>
              <span className="text-gray-500">from {fa.signedFrom}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-[10px] text-gray-600 italic">
        Net FA balance: <span className={data.netFABalance >= 0 ? 'text-green-400' : 'text-red-400'}>{data.netFABalance >= 0 ? '+' : ''}{data.netFABalance}</span>
      </div>
    </div>
  );
}
