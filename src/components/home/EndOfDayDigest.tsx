/**
 * EndOfDayDigest.tsx — Compresses consequence into a scannable digest.
 * Shows standings, roster depth, injuries, front office pulse, and headlines.
 * Degrades gracefully when data is missing with honest empty state.
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

  // Recommended next action copy based on game phase
  const nextAction = gamePhase === 'preseason' ? 'Review your roster and start the season when ready.'
    : gamePhase === 'in_season' ? 'Simulate the next series and check your roster for adjustments.'
    : gamePhase === 'postseason' ? 'Review the season results and prepare for the offseason.'
    : gamePhase === 'offseason' ? 'Make offseason moves: free agency, trades, and arbitration decisions await.'
    : gamePhase === 'simulating' ? 'Simulation in progress...'
    : gamePhase === 'fired' ? 'Your tenure has ended. Start a new franchise to try again.'
    : 'Continue playing to generate more data.';

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-3 flex items-center justify-between">
        <span>END-OF-DAY DIGEST</span>
        <span className="text-gray-500 font-normal text-[10px]">SUMMARY</span>
      </div>
      <div className="p-3 space-y-4">
        {blocks.length > 0 ? (
          blocks.map((block, i) => (
            <DigestSection key={i} block={block} />
          ))
        ) : (
          <div className="text-center py-2">
            <div className="text-gray-500 text-xs mb-1">No digest data available yet.</div>
            <div className="text-gray-700 text-[10px]">
              Start the season to see standings, injury reports, and headlines here.
            </div>
          </div>
        )}

        {/* Next recommended action — always shown */}
        <div className="pt-2 border-t border-gray-800">
          <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-1">
            RECOMMENDED NEXT
          </div>
          <div className="text-gray-300 text-xs">
            {nextAction}
          </div>
        </div>
      </div>
    </div>
  );
}
