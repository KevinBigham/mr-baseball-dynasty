import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ROLE_DISPLAY,
  generateDemoCallups,
  getCallupSummary,
  callUp,
  sendDown,
  type CallupCandidate,
} from '../../engine/roster/septemberCallups';

function CandidateCard({ candidate, onCallUp, onSendDown }: { candidate: CallupCandidate; onCallUp: () => void; onSendDown: () => void }) {
  const roleInfo = ROLE_DISPLAY[candidate.suggestedRole];
  const ovrColor = candidate.overall >= 70 ? '#22c55e' : candidate.overall >= 60 ? '#eab308' : '#94a3b8';
  const potColor = candidate.potential >= 80 ? '#22c55e' : candidate.potential >= 70 ? '#3b82f6' : '#94a3b8';
  const isCalledUp = candidate.status === 'called_up';

  return (
    <div className={`bloomberg-border ${candidate.status === 'sent_down' ? 'opacity-40' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border"
              style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
              {candidate.overall}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{candidate.name}</div>
              <div className="text-gray-600 text-[10px]">{candidate.pos} | Age {candidate.age} | {candidate.level}</div>
            </div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: roleInfo.color + '22', color: roleInfo.color }}>
            {roleInfo.emoji} {roleInfo.label}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">POT</div>
            <div className="font-bold tabular-nums" style={{ color: potColor }}>{candidate.potential}</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">SVC TIME</div>
            <div className="text-gray-300 tabular-nums">{candidate.serviceTimeDays}d</div>
          </div>
          <div className="bloomberg-border px-2 py-1 text-center">
            <div className="text-gray-600">IMPACT</div>
            <div className="font-bold tabular-nums" style={{ color: candidate.impactRating >= 7 ? '#22c55e' : candidate.impactRating >= 4 ? '#eab308' : '#94a3b8' }}>
              {candidate.impactRating}/10
            </div>
          </div>
        </div>

        {/* Minor league stats */}
        <div className="text-[10px] text-gray-500 mb-2">
          <span className="text-gray-600 font-bold">MINORS: </span>
          {candidate.minorStats.avg && <span>AVG {candidate.minorStats.avg} </span>}
          {candidate.minorStats.era && <span>ERA {candidate.minorStats.era} </span>}
          {candidate.minorStats.hr !== undefined && <span>{candidate.minorStats.hr} HR </span>}
          {candidate.minorStats.sb !== undefined && <span>{candidate.minorStats.sb} SB </span>}
          {candidate.minorStats.k !== undefined && <span>{candidate.minorStats.k} K </span>}
        </div>

        <div className="text-[10px] text-gray-600 mb-2">
          Options remaining: <span className="text-gray-300">{candidate.optionsRemaining}</span>
        </div>

        {/* Actions */}
        {candidate.status === 'candidate' && (
          <button onClick={onCallUp}
            className="w-full text-[10px] font-bold py-1 rounded bg-green-600/20 text-green-400 hover:bg-green-600/30">
            CALL UP
          </button>
        )}
        {isCalledUp && (
          <button onClick={onSendDown}
            className="w-full text-[10px] font-bold py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30">
            SEND DOWN
          </button>
        )}
      </div>
    </div>
  );
}

export default function SeptemberCallupsView() {
  const { gameStarted } = useGameStore();
  const [candidates, setCandidates] = useState<CallupCandidate[]>(() => generateDemoCallups());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getCallupSummary(candidates);

  const handleCallUp = (id: number) => { setCandidates(prev => prev.map(c => c.id === id ? callUp(c) : c)); };
  const handleSendDown = (id: number) => { setCandidates(prev => prev.map(c => c.id === id ? sendDown(c) : c)); };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>SEPTEMBER CALL-UPS</span>
        <span className="text-gray-600 text-[10px]">ROSTER {summary.rosterSize + summary.calledUp}/{summary.maxRoster}</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CALLED UP</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.calledUp}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CANDIDATES</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.candidates}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GAMES LEFT</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{summary.gamesRemaining}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">GAMES BACK</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: summary.gamesBack <= 3 ? '#eab308' : '#ef4444' }}>
            {summary.gamesBack}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {candidates.sort((a, b) => b.impactRating - a.impactRating).map(c => (
          <CandidateCard key={c.id} candidate={c} onCallUp={() => handleCallUp(c.id)} onSendDown={() => handleSendDown(c.id)} />
        ))}
      </div>
    </div>
  );
}
