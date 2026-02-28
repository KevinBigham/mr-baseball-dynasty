import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  LEGACY_DISPLAY,
  generateDemoRetirementCandidates,
  type RetirementCandidate,
} from '../../engine/player/retirementWatch';

function CandidateCard({ candidate }: { candidate: RetirementCandidate }) {
  const legacyInfo = LEGACY_DISPLAY[candidate.legacy];
  const oddsColor = candidate.retirementOdds >= 80 ? '#ef4444' : candidate.retirementOdds >= 50 ? '#f97316' : '#eab308';

  return (
    <div className={`bloomberg-border ${candidate.farewellTour ? 'border-yellow-800/40' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-orange-300 font-bold text-sm">{candidate.name}</span>
              {candidate.farewellTour && <span className="text-yellow-400 text-[10px] font-bold animate-pulse">FAREWELL TOUR</span>}
            </div>
            <div className="text-gray-600 text-[10px]">{candidate.pos} | Age {candidate.age} | {candidate.seasons} seasons</div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: legacyInfo.color + '22', color: legacyInfo.color }}>
            {legacyInfo.emoji} {legacyInfo.label}
          </span>
        </div>

        {/* Odds */}
        <div className="grid grid-cols-3 gap-2 text-center mb-2">
          <div className="bloomberg-border px-2 py-1">
            <div className="text-gray-600 text-[10px]">RETIRE ODDS</div>
            <div className="font-bold tabular-nums" style={{ color: oddsColor }}>{candidate.retirementOdds}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1">
            <div className="text-gray-600 text-[10px]">HOF CHANCE</div>
            <div className="font-bold tabular-nums text-yellow-400">{candidate.hallOfFameChance}%</div>
          </div>
          <div className="bloomberg-border px-2 py-1">
            <div className="text-gray-600 text-[10px]">CURRENT OVR</div>
            <div className="font-bold tabular-nums" style={{ color: candidate.overall >= 65 ? '#eab308' : '#94a3b8' }}>{candidate.overall}</div>
          </div>
        </div>

        {/* Career highlights */}
        <div className="text-[10px] mb-2">
          <div className="text-gray-600 font-bold mb-0.5">CAREER HIGHLIGHTS</div>
          <div className="flex flex-wrap gap-1">
            {candidate.careerHighlights.map(h => (
              <span key={h} className="px-1 py-0.5 bg-gray-800 text-gray-400 rounded">{h}</span>
            ))}
          </div>
        </div>

        {/* Last season stats */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span className="text-gray-600 font-bold">LAST SEASON:</span>
          {Object.entries(candidate.lastSeasonStats).map(([k, v]) => (
            <span key={k}>{k}: <span className="text-gray-300">{v}</span></span>
          ))}
        </div>

        {/* Retirement odds bar */}
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-2">
          <div className="h-full rounded-full transition-all" style={{ width: `${candidate.retirementOdds}%`, backgroundColor: oddsColor }} />
        </div>
      </div>
    </div>
  );
}

export default function RetirementWatchView() {
  const { gameStarted } = useGameStore();
  const [candidates] = useState(() => generateDemoRetirementCandidates());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const farewellTours = candidates.filter(c => c.farewellTour).length;
  const likelyRetiring = candidates.filter(c => c.retirementOdds >= 75).length;
  const hofBound = candidates.filter(c => c.hallOfFameChance >= 65).length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>RETIREMENT WATCH</span>
        <span className="text-gray-600 text-[10px]">{candidates.length} CANDIDATES</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LIKELY RETIRING</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{likelyRetiring}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">FAREWELL TOURS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{farewellTours}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">HOF BOUND</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{hofBound}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {candidates.sort((a, b) => b.retirementOdds - a.retirementOdds).map(c => (
          <CandidateCard key={c.id} candidate={c} />
        ))}
      </div>
    </div>
  );
}
