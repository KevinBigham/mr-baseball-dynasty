/**
 * PlayoffBracketView — Standalone playoff bracket accessible from League > Playoffs.
 * Uses the canonical bracket artifact when available and falls back to a direct
 * worker fetch if the dashboard bundle has not hydrated this tab yet.
 */

import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useLeagueStore } from '../../store/leagueStore';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import DashboardPlayoffBracket from '../dashboard/PlayoffBracket';

export default function PlayoffBracketView() {
  const { season } = useGameStore();
  const { playoffBracket, setPlayoffBracket } = useLeagueStore();
  const { addToast } = useUIStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (playoffBracket) return;

    let cancelled = false;
    setLoading(true);
    getEngine().getPlayoffBracket()
      .then((bracket) => {
        if (cancelled) return;
        setPlayoffBracket(bracket);
      })
      .catch(() => {
        if (!cancelled) addToast('Could not load playoff bracket', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [playoffBracket, setPlayoffBracket, addToast]);

  return (
    <div className="p-4">
      {playoffBracket ? (
        <DashboardPlayoffBracket bracket={playoffBracket} />
      ) : (
        <div className="bloomberg-border" style={{ backgroundColor: '#0F1930' }}>
          <div className="bloomberg-header">PLAYOFF BRACKET — SEASON {season}</div>
          <div className="p-4 text-center py-6" style={{ color: '#64748B' }}>
            <div className="text-2xl mb-2">⚾</div>
            <div className="text-xs">
              {loading
                ? 'Loading playoff bracket...'
                : 'Complete the regular season to generate the playoff bracket.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
