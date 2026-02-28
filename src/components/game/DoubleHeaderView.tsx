import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  DH_TYPE_DISPLAY,
  generateDemoDoubleHeaders,
  type DoubleHeaderState,
  type DHGame,
} from '../../engine/game/doubleHeader';

function GameCard({ game, label }: { game: DHGame; label: string }) {
  const statusColor = game.status === 'complete' ? '#22c55e' : game.status === 'in_progress' ? '#f97316' : '#6b7280';
  const isWin = game.score && game.score.us > game.score.them;

  return (
    <div className="bloomberg-border px-3 py-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-orange-300 font-bold text-xs">{label}</span>
        <span className="text-[10px] font-bold" style={{ color: statusColor }}>
          {game.status === 'complete' ? 'FINAL' : game.status === 'in_progress' ? 'LIVE' : 'UPCOMING'}
        </span>
      </div>
      {game.score && (
        <div className="text-lg font-bold tabular-nums mb-1" style={{ color: isWin ? '#22c55e' : '#ef4444' }}>
          {game.score.us}-{game.score.them} {isWin ? 'W' : 'L'}
        </div>
      )}
      <div className="text-[10px] text-gray-500 mb-1">
        <span className="text-gray-600 font-bold">SP:</span> {game.startingPitcher} ({game.pitcherOvr} OVR)
      </div>
      <div className="text-[10px] text-gray-600">{game.innings} INN | {game.lineupChanges} lineup changes</div>
      <div className="text-[10px] text-gray-500 mt-1 italic">{game.note}</div>
    </div>
  );
}

function DHCard({ dh }: { dh: DoubleHeaderState }) {
  const typeInfo = DH_TYPE_DISPLAY[dh.type];
  const relColor = dh.roster.availableRelievers <= 2 ? '#ef4444' : dh.roster.availableRelievers <= 4 ? '#eab308' : '#22c55e';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-orange-300 font-bold text-sm">vs {dh.opponent}</div>
            <div className="text-gray-600 text-[10px]">{dh.date}</div>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: typeInfo.color + '22', color: typeInfo.color }}>
            {typeInfo.label} DH
          </span>
        </div>

        {/* Games */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <GameCard game={dh.game1} label="GAME 1" />
          <GameCard game={dh.game2} label="GAME 2" />
        </div>

        {/* Roster status */}
        <div className="grid grid-cols-4 gap-2 text-[10px] mb-2">
          <div className="text-center">
            <div className="text-gray-600">RELIEVERS</div>
            <div className="font-bold tabular-nums" style={{ color: relColor }}>
              {dh.roster.availableRelievers}/{dh.roster.totalRelievers}
            </div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">FATIGUED</div>
            <div className="text-orange-400 tabular-nums font-bold">{dh.roster.positionPlayersFatigued}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">BENCH LEFT</div>
            <div className="text-gray-300 tabular-nums">{dh.roster.benchPlayersRemaining}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-600">26TH MAN</div>
            <div className={dh.roster.twentySixthManActive ? 'text-green-400 font-bold' : 'text-gray-600'}>
              {dh.roster.twentySixthManActive ? 'ACTIVE' : 'N/A'}
            </div>
          </div>
        </div>

        {/* Fatigue warnings */}
        {dh.fatigueWarnings.length > 0 && (
          <div className="space-y-0.5">
            {dh.fatigueWarnings.map((w, i) => (
              <div key={i} className="text-[10px] text-orange-400 flex items-start gap-1">
                <span>⚠️</span>
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DoubleHeaderView() {
  const { gameStarted } = useGameStore();
  const [doubleHeaders] = useState(() => generateDemoDoubleHeaders());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const completed = doubleHeaders.filter(d => d.game1.status === 'complete' && d.game2.status === 'complete').length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>DOUBLEHEADER MANAGEMENT</span>
        <span className="text-gray-600 text-[10px]">{doubleHeaders.length} DOUBLEHEADERS</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL DH</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{doubleHeaders.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">COMPLETED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{completed}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">UPCOMING</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{doubleHeaders.length - completed}</div>
        </div>
      </div>

      <div className="space-y-3">
        {doubleHeaders.map(dh => (
          <DHCard key={dh.id} dh={dh} />
        ))}
      </div>
    </div>
  );
}
