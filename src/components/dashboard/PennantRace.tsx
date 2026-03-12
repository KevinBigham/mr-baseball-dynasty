/**
 * PennantRace — Compact pennant race indicator during in-season play.
 *
 * Shows division rank, games back, wild card position, magic/elimination numbers.
 */

import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';

interface PennantRaceData {
  userDivisionRank: number;
  userGamesBack: number;
  userWildCardRank: number;
  userWCGamesBack: number;
  divisionLeader: { teamId: number; abbr: string; wins: number; losses: number };
  isInPlayoffPosition: boolean;
  magicNumber: number | null;
  eliminationNumber: number | null;
}

export default function PennantRace() {
  const { userTeamId } = useGameStore();
  const [data, setData] = useState<PennantRaceData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const engine = getEngine();
        const race = await engine.getPennantRace();
        if (!cancelled) setData(race);
      } catch {
        // Pennant race not available yet (no games played)
      }
    })();
    return () => { cancelled = true; };
  }, [userTeamId]);

  if (!data) return (
    <div className="bloomberg-border bg-gray-900 px-4 py-3">
      <div className="text-gray-500 text-xs text-center">Loading pennant race data...</div>
    </div>
  );

  const {
    userDivisionRank, userGamesBack, userWildCardRank, userWCGamesBack,
    divisionLeader, isInPlayoffPosition, magicNumber, eliminationNumber,
  } = data;

  const rankSuffix = (r: number) => {
    if (r === 1) return 'st';
    if (r === 2) return 'nd';
    if (r === 3) return 'rd';
    return 'th';
  };

  const playoffColor = isInPlayoffPosition ? '#4ade80' : '#ef4444';
  const playoffLabel = isInPlayoffPosition ? 'IN' : 'OUT';

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>PENNANT RACE</span>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{
            background: `${playoffColor}22`,
            color: playoffColor,
            border: `1px solid ${playoffColor}44`,
          }}
        >
          PLAYOFF {playoffLabel}
        </span>
      </div>
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-4">
          {/* Division */}
          <div>
            <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">DIVISION</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-orange-400 font-black text-lg tabular-nums">
                {userDivisionRank}{rankSuffix(userDivisionRank)}
              </span>
              {userGamesBack > 0 && (
                <span className="text-gray-500 text-xs tabular-nums">
                  {userGamesBack.toFixed(1)} GB
                </span>
              )}
            </div>
            {userDivisionRank > 1 && (
              <div className="text-gray-500 text-[10px] mt-0.5">
                Leader: {divisionLeader.abbr} ({divisionLeader.wins}-{divisionLeader.losses})
              </div>
            )}
          </div>

          {/* Wild Card */}
          <div>
            <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">WILD CARD</div>
            <div className="flex items-baseline gap-1.5">
              <span className={`font-black text-lg tabular-nums ${
                userWildCardRank <= 3 ? 'text-green-400' : 'text-gray-400'
              }`}>
                {userWildCardRank <= 3 ? `WC${userWildCardRank}` : `${userWildCardRank}${rankSuffix(userWildCardRank)}`}
              </span>
              {userWCGamesBack > 0 && userWildCardRank > 3 && (
                <span className="text-gray-500 text-xs tabular-nums">
                  {userWCGamesBack.toFixed(1)} GB
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Magic / Elimination numbers */}
        {(magicNumber !== null || eliminationNumber !== null) && (
          <div className="mt-3 pt-3 border-t border-gray-800 flex gap-4">
            {magicNumber !== null && magicNumber > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[10px] uppercase">MAGIC #</span>
                <span className="text-green-400 font-bold text-sm tabular-nums">{magicNumber}</span>
              </div>
            )}
            {magicNumber === 0 && (
              <div className="text-green-400 text-xs font-bold">CLINCHED DIVISION</div>
            )}
            {eliminationNumber !== null && eliminationNumber > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[10px] uppercase">ELIM #</span>
                <span className="text-red-400 font-bold text-sm tabular-nums">{eliminationNumber}</span>
              </div>
            )}
            {eliminationNumber === 0 && (
              <div className="text-red-400 text-xs font-bold">ELIMINATED</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
