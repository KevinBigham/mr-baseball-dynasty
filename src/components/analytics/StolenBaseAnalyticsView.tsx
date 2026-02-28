import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  STEAL_GRADE_DISPLAY,
  generateDemoStealCandidates,
  generateDemoCatchers,
  generateDemoSituations,
  getStealSummary,
  type StealCandidate,
  type CatcherArm,
  type StealSituation,
} from '../../engine/analytics/stolenBaseAnalytics';

function CandidateRow({ c }: { c: StealCandidate }) {
  const gradeInfo = STEAL_GRADE_DISPLAY[c.grade];
  const rvColor = c.runValue >= 2 ? '#22c55e' : c.runValue >= 0 ? '#eab308' : '#ef4444';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-2 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-orange-300 font-bold text-sm">{c.name}</span>
            <span className="text-gray-600 text-[10px]">{c.pos}</span>
            {c.greenLight && <span className="text-green-400 text-[9px] font-bold">GREEN LIGHT</span>}
          </div>
          <div className="text-gray-600 text-[9px]">Speed {c.speed} | Steal {c.stealing} | React {c.reactionTime}s</div>
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          <div className="text-center">
            <div className="text-gray-600">SB/ATT</div>
            <div className="text-gray-300 font-bold tabular-nums">{c.successes}/{c.attempts}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">RATE</div>
            <div className="font-bold tabular-nums" style={{ color: gradeInfo.color }}>{c.successRate}%</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">RUN VAL</div>
            <div className="font-bold tabular-nums" style={{ color: rvColor }}>{c.runValue > 0 ? '+' : ''}{c.runValue}</div>
          </div>
        </div>

        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
          style={{ backgroundColor: gradeInfo.color + '22', color: gradeInfo.color }}>
          {gradeInfo.label}
        </span>
      </div>
    </div>
  );
}

function CatcherRow({ c }: { c: CatcherArm }) {
  const gradeInfo = STEAL_GRADE_DISPLAY[c.grade];

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors px-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-orange-300 font-bold text-sm">{c.name}</div>
          <div className="text-gray-600 text-[9px]">Arm {c.throwStrength} | Pop {c.popTime}s</div>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="text-center">
            <div className="text-gray-600">CS/ATT</div>
            <div className="text-gray-300 font-bold tabular-nums">{c.caughtStealing}/{c.attempts}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">CS%</div>
            <div className="font-bold tabular-nums" style={{ color: gradeInfo.color }}>{c.csRate}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SituationCard({ s }: { s: StealSituation }) {
  const recColors: Record<string, string> = { green_light: '#22c55e', situational: '#eab308', hold: '#ef4444' };
  const probColor = s.successProb >= s.breakeven ? '#22c55e' : '#ef4444';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-gray-400 text-[10px]">INN {s.inning} — Runner on {s.base}</span>
        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded uppercase"
          style={{ backgroundColor: recColors[s.recommendation] + '22', color: recColors[s.recommendation] }}>
          {s.recommendation.replace('_', ' ')}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
        <div><span className="text-gray-600">Runner:</span> <span className="text-gray-300">{s.runner} (SPD {s.runnerSpeed})</span></div>
        <div><span className="text-gray-600">Catcher:</span> <span className="text-gray-300">{s.catcher} ({s.catcherPopTime}s)</span></div>
        <div><span className="text-gray-600">Pitcher:</span> <span className="text-gray-300">{s.pitcher} ({s.pitcherHoldTime}s)</span></div>
      </div>
      <div className="flex items-center gap-4 text-[10px]">
        <span><span className="text-gray-600">Success Prob:</span> <span className="font-bold" style={{ color: probColor }}>{s.successProb}%</span></span>
        <span><span className="text-gray-600">Breakeven:</span> <span className="text-gray-300">{s.breakeven}%</span></span>
        <span><span className="text-gray-600">RE Gain:</span> <span className="font-bold" style={{ color: s.runExpectancyGain >= 0 ? '#22c55e' : '#ef4444' }}>{s.runExpectancyGain > 0 ? '+' : ''}{s.runExpectancyGain.toFixed(2)}</span></span>
      </div>
    </div>
  );
}

export default function StolenBaseAnalyticsView() {
  const { gameStarted } = useGameStore();
  const [candidates] = useState<StealCandidate[]>(() => generateDemoStealCandidates());
  const [catchers] = useState<CatcherArm[]>(() => generateDemoCatchers());
  const [situations] = useState<StealSituation[]>(() => generateDemoSituations());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getStealSummary(candidates);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>STOLEN BASE ANALYTICS</span>
        <span className="text-gray-600 text-[10px]">BREAKEVEN ~70% SUCCESS RATE</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM SB</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.totalSuccesses}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">ATTEMPTS</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.totalAttempts}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">SUCCESS %</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.teamSuccessRate >= 70 ? '#22c55e' : '#ef4444' }}>{summary.teamSuccessRate}%</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RUN VALUE</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.teamRunValue >= 0 ? '#22c55e' : '#ef4444' }}>{summary.teamRunValue > 0 ? '+' : ''}{summary.teamRunValue}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GREEN LIGHT</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.greenLightCount}</div>
        </div>
      </div>

      {/* Live situations */}
      {situations.length > 0 && (
        <div>
          <div className="text-orange-400 text-[10px] font-bold mb-2">LIVE STEAL SITUATIONS</div>
          <div className="space-y-2">
            {situations.map(s => <SituationCard key={s.id} s={s} />)}
          </div>
        </div>
      )}

      {/* Candidates */}
      <div>
        <div className="text-blue-400 text-[10px] font-bold mb-2">BASE STEALING LEADERS</div>
        <div className="space-y-1">
          {candidates.sort((a, b) => b.successRate - a.successRate).map(c => (
            <CandidateRow key={c.id} c={c} />
          ))}
        </div>
      </div>

      {/* Catchers */}
      <div>
        <div className="text-red-400 text-[10px] font-bold mb-2">OPPOSING CATCHERS SCOUTED</div>
        <div className="grid grid-cols-2 gap-2">
          {catchers.map(c => <CatcherRow key={c.id} c={c} />)}
        </div>
      </div>
    </div>
  );
}
