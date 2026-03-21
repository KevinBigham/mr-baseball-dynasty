/**
 * AwardsView — League Awards display.
 * Shows awards from past seasons via franchiseHistory.
 */

import { useLeagueStore } from '../../store/leagueStore';
import { StaggerList, StaggerItem } from '../ui/animated';

export default function AwardsView() {
  const { franchiseHistory } = useLeagueStore();

  if (!franchiseHistory || franchiseHistory.length === 0) {
    return (
      <div className="p-4">
        <div className="bloomberg-border" style={{ backgroundColor: '#0F1930' }}>
          <div className="bloomberg-header">LEAGUE AWARDS</div>
          <div className="p-8 text-center" style={{ color: '#64748B' }}>
            <div className="text-2xl mb-2">🏆</div>
            <div className="text-xs">Complete your first season to see awards.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-border" style={{ backgroundColor: '#0F1930' }}>
        <div className="bloomberg-header">LEAGUE AWARDS — SEASON HISTORY</div>
        <StaggerList staggerDelay={0.05} className="divide-y divide-[#1E2A4A]">
          {[...franchiseHistory].reverse().map(s => (
            <StaggerItem key={s.season}><div className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold" style={{ color: '#f97316' }}>SEASON {s.season}</span>
                <span className="text-[10px]" style={{ color: '#A7B3C7' }}>{s.wins}-{s.losses} ({s.pct.toFixed(3)})</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {s.awardsWon.length > 0 ? (
                  s.awardsWon.map((award, i) => (
                    <span key={i} className="text-[10px] font-semibold px-2 py-1 rounded"
                      style={{ backgroundColor: '#0B1020', border: '1px solid #1E2A4A', color: '#E2E8F0' }}>
                      🏆 {award}
                    </span>
                  ))
                ) : (
                  <span className="text-[10px]" style={{ color: '#64748B' }}>No awards this season</span>
                )}
                {s.playoffResult && (
                  <span className="text-[10px] font-semibold px-2 py-1 rounded"
                    style={{ backgroundColor: s.playoffResult === 'Champion' ? 'rgba(250,204,21,0.1)' : '#0B1020', border: `1px solid ${s.playoffResult === 'Champion' ? '#fbbf2440' : '#1E2A4A'}`, color: s.playoffResult === 'Champion' ? '#fbbf24' : '#A7B3C7' }}>
                    {s.playoffResult === 'Champion' ? '🏆 WORLD SERIES CHAMPION' : `Playoffs: ${s.playoffResult}`}
                  </span>
                )}
              </div>
            </div></StaggerItem>
          ))}
        </StaggerList>
      </div>
    </div>
  );
}
