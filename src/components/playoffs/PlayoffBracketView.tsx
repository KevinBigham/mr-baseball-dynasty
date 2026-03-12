/**
 * PlayoffBracketView — Standalone playoff bracket accessible from League > Playoffs.
 * Wraps the existing PlayoffBracket component from the dashboard.
 */

import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';

export default function PlayoffBracketView() {
  const { season } = useGameStore();
  const { franchiseHistory } = useLeagueStore();

  const lastSeason = franchiseHistory?.[franchiseHistory.length - 1];

  return (
    <div className="p-4">
      <div className="bloomberg-border" style={{ backgroundColor: '#0F1930' }}>
        <div className="bloomberg-header">PLAYOFF BRACKET — SEASON {season}</div>
        <div className="p-4">
          {lastSeason?.playoffResult ? (
            <div className="text-center space-y-3">
              <div className="text-2xl">🏆</div>
              <div className="text-sm font-bold" style={{ color: '#f97316' }}>
                {lastSeason.playoffResult === 'Champion' ? 'WORLD SERIES CHAMPION' : `ELIMINATED: ${lastSeason.playoffResult}`}
              </div>
              <div className="text-xs" style={{ color: '#A7B3C7' }}>
                Season {lastSeason.season} · {lastSeason.wins}-{lastSeason.losses}
              </div>
              <div className="text-[10px]" style={{ color: '#64748B' }}>
                Full interactive bracket coming in a future update.
              </div>
            </div>
          ) : (
            <div className="text-center py-6" style={{ color: '#64748B' }}>
              <div className="text-2xl mb-2">⚾</div>
              <div className="text-xs">Complete the regular season to see the playoff bracket.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
