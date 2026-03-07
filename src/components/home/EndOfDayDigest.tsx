/**
 * EndOfDayDigest.tsx — Compresses consequence into a scannable digest.
 * Shows standings, injuries, front office pulse, and headlines.
 */

import { useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { buildDigest } from '../../utils/briefingAdapter';
import DigestSection from './DigestSection';

export default function EndOfDayDigest() {
  const { userTeamId, ownerPatience, teamMorale, gamePhase } = useGameStore();
  const { standings, roster, newsItems } = useLeagueStore();

  const blocks = useMemo(() => buildDigest({
    standings: standings?.standings ?? null,
    userTeamId,
    roster,
    ownerPatience,
    teamMorale,
    gamePhase,
    newsItems,
  }), [standings, userTeamId, roster, ownerPatience, teamMorale, gamePhase, newsItems]);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-3 flex items-center justify-between">
        <span>END-OF-DAY DIGEST</span>
        <span className="text-gray-500 font-normal text-[10px]">SUMMARY</span>
      </div>
      <div className="p-3 space-y-4">
        {blocks.map((block, i) => (
          <DigestSection key={i} block={block} />
        ))}

        {/* Next recommended action */}
        <div className="pt-2 border-t border-gray-800">
          <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
            RECOMMENDED NEXT
          </div>
          <div className="text-gray-300 text-xs">
            {gamePhase === 'preseason' && 'Review your roster and start the season.'}
            {gamePhase === 'in_season' && 'Simulate the next series and monitor your roster.'}
            {gamePhase === 'postseason' && 'Review the season results and prepare for the offseason.'}
            {gamePhase === 'offseason' && 'Make offseason moves: free agency, trades, and arbitration.'}
            {gamePhase === 'simulating' && 'Simulation in progress...'}
            {gamePhase === 'fired' && 'Your tenure has ended.'}
          </div>
        </div>
      </div>
    </div>
  );
}
