import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  TREND_DISPLAY,
  generateDemoRunDiff,
  type TeamRunDiff,
} from '../../engine/analytics/runDifferential';

function TeamRow({ team, rank }: { team: TeamRunDiff; rank: number }) {
  const trendInfo = TREND_DISPLAY[team.trend];
  const rdColor = team.runDiff > 0 ? '#22c55e' : team.runDiff < 0 ? '#ef4444' : '#6b7280';
  const pythColor = team.pythDiff > 0 ? '#22c55e' : team.pythDiff < 0 ? '#ef4444' : '#6b7280';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-2 flex items-center gap-3">
        <span className="text-gray-600 font-bold text-sm w-6 text-right">{rank}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-orange-300 font-bold text-sm">{team.abbr}</span>
            <span className="text-gray-600 text-[10px]">{team.wins}-{team.losses}</span>
            <span className="px-1 py-0.5 text-[9px] font-bold rounded"
              style={{ backgroundColor: trendInfo.color + '22', color: trendInfo.color }}>
              {trendInfo.emoji} {trendInfo.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[10px]">
          <div className="text-center w-12">
            <div className="text-gray-600">RS</div>
            <div className="text-gray-300 font-bold tabular-nums">{team.runsScored}</div>
          </div>
          <div className="text-center w-12">
            <div className="text-gray-600">RA</div>
            <div className="text-gray-300 font-bold tabular-nums">{team.runsAllowed}</div>
          </div>
          <div className="text-center w-14">
            <div className="text-gray-600">RUN DIFF</div>
            <div className="font-bold tabular-nums" style={{ color: rdColor }}>
              {team.runDiff > 0 ? '+' : ''}{team.runDiff}
            </div>
          </div>
          <div className="text-center w-14">
            <div className="text-gray-600">PYTH W</div>
            <div className="text-gray-300 font-bold tabular-nums">{team.pythWins}-{team.pythLosses}</div>
          </div>
          <div className="text-center w-12">
            <div className="text-gray-600">LUCK</div>
            <div className="font-bold tabular-nums" style={{ color: pythColor }}>
              {team.pythDiff > 0 ? '+' : ''}{team.pythDiff}
            </div>
          </div>
          <div className="text-center w-14">
            <div className="text-gray-600">1-RUN</div>
            <div className="text-gray-300 font-bold tabular-nums">{team.oneRunRecord}</div>
          </div>
          <div className="text-center w-12">
            <div className="text-gray-600">L10 RD</div>
            <div className="font-bold tabular-nums" style={{ color: team.last10RunDiff >= 0 ? '#22c55e' : '#ef4444' }}>
              {team.last10RunDiff > 0 ? '+' : ''}{team.last10RunDiff}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RunDifferentialView() {
  const { gameStarted } = useGameStore();
  const [teams] = useState<TeamRunDiff[]>(() => generateDemoRunDiff());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const myTeam = teams[0];

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>RUN DIFFERENTIAL TRENDS</span>
        <span className="text-gray-600 text-[10px]">PYTHAGOREAN RECORDS</span>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TEAM RD</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: myTeam.runDiff >= 0 ? '#22c55e' : '#ef4444' }}>
            {myTeam.runDiff > 0 ? '+' : ''}{myTeam.runDiff}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RD/GAME</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{myTeam.runDiffPerGame.toFixed(2)}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PYTH WINS</div>
          <div className="text-gray-300 font-bold text-xl tabular-nums">{myTeam.pythWins}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LUCK</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: myTeam.pythDiff >= 0 ? '#22c55e' : '#ef4444' }}>
            {myTeam.pythDiff > 0 ? '+' : ''}{myTeam.pythDiff}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">BLOWOUTS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{myTeam.blowoutWins}</div>
        </div>
      </div>

      <div className="space-y-1">
        {teams.map((t, i) => (
          <TeamRow key={t.id} team={t} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
