import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  STATUS_DISPLAY,
  generateDemoQOCandidates,
  getQOSummary,
  makeOffer,
  resolveOffer,
  type QOCandidate,
} from '../../engine/contracts/qualifyingOffer';

function CandidateCard({ candidate, onOffer, onResolve }: { candidate: QOCandidate; onOffer: () => void; onResolve: () => void }) {
  const statusInfo = STATUS_DISPLAY[candidate.status];
  const ovrColor = candidate.overall >= 80 ? '#22c55e' : candidate.overall >= 70 ? '#eab308' : '#94a3b8';
  const acceptColor = candidate.acceptChance >= 60 ? '#22c55e' : candidate.acceptChance >= 30 ? '#eab308' : '#ef4444';

  return (
    <div className={`bloomberg-border ${candidate.status === 'not_eligible' ? 'opacity-40' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {candidate.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{candidate.name}</div>
              <div className="text-gray-600 text-[10px]">{candidate.pos} | Age {candidate.age} | {candidate.warLastSeason} WAR</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: statusInfo.color + '22', color: statusInfo.color }}>
            {statusInfo.emoji} {statusInfo.label}
          </span>
        </div>

        {/* Financial info */}
        <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">QO VALUE</div>
            <div className="text-orange-400 font-bold tabular-nums">${candidate.qoAmount}M</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">PROJ MARKET</div>
            <div className="text-green-400 font-bold tabular-nums">${candidate.projectedMarket}M</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">ACCEPT %</div>
            <div className="font-bold tabular-nums" style={{ color: acceptColor }}>{candidate.acceptChance}%</div>
          </div>
        </div>

        {/* Accept chance bar */}
        <div className="flex items-center gap-2 text-[10px] mb-2">
          <span className="text-gray-600">ACCEPT ODDS</span>
          <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${candidate.acceptChance}%`, backgroundColor: acceptColor }} />
          </div>
        </div>

        {candidate.previousQO && (
          <div className="text-red-400 text-[10px] mb-2">Previously received QO — not eligible again</div>
        )}

        <div className="text-[10px] text-gray-500 mb-2">
          Comp pick if rejected: <span className="text-gray-300">{candidate.compPickValue}</span>
        </div>

        {/* Actions */}
        {candidate.status === 'eligible' && (
          <button onClick={onOffer}
            className="w-full text-[10px] font-bold py-1 rounded bg-orange-600/20 text-orange-400 hover:bg-orange-600/30">
            EXTEND QO (${candidate.qoAmount}M)
          </button>
        )}
        {candidate.status === 'offered' && (
          <button onClick={onResolve}
            className="w-full text-[10px] font-bold py-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30">
            RESOLVE DECISION
          </button>
        )}
      </div>
    </div>
  );
}

export default function QualifyingOfferView() {
  const { gameStarted } = useGameStore();
  const [candidates, setCandidates] = useState<QOCandidate[]>(() => generateDemoQOCandidates());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getQOSummary(candidates);

  const handleOffer = (id: number) => {
    setCandidates(prev => prev.map(c => c.id === id ? makeOffer(c) : c));
  };
  const handleResolve = (id: number) => {
    setCandidates(prev => prev.map(c => c.id === id ? resolveOffer(c) : c));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>QUALIFYING OFFERS</span>
        <span className="text-gray-600 text-[10px]">QO AMOUNT: ${summary.qoAmount}M</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ELIGIBLE</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{summary.eligibleCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">OFFERED</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.offeredCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ACCEPTED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.acceptedCount}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">REJECTED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{summary.rejectedCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {candidates.sort((a, b) => b.overall - a.overall).map(c => (
          <CandidateCard key={c.id} candidate={c}
            onOffer={() => handleOffer(c.id)}
            onResolve={() => handleResolve(c.id)} />
        ))}
      </div>
    </div>
  );
}
