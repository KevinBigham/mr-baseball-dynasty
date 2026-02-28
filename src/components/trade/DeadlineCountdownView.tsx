/**
 * DeadlineCountdownView – Trade deadline countdown and target tracker
 *
 * Bloomberg-terminal style deadline war room with posture,
 * targets, available pieces, and recent league deals.
 */
import { useMemo } from 'react';
import {
  POSTURE_DISPLAY,
  generateDemoDeadline,
} from '../../engine/trade/deadlineCountdown';

export default function DeadlineCountdownView() {
  const data = useMemo(() => generateDemoDeadline(), []);
  const posture = POSTURE_DISPLAY[data.teamPosture];

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        TRADE DEADLINE WAR ROOM
      </div>

      {/* ── Countdown + Status ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="bloomberg-border" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 140 }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>DEADLINE</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: data.daysUntilDeadline <= 7 ? '#ef4444' : '#f59e0b' }}>
            {data.daysUntilDeadline}
          </div>
          <div style={{ color: '#888', fontSize: 11 }}>days until {data.deadlineDate}</div>
        </div>
        <div className="bloomberg-border" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 140 }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>POSTURE</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: posture.color }}>
            {posture.emoji} {posture.label}
          </div>
        </div>
        {[
          { label: 'Record', value: data.teamRecord },
          { label: 'Games Back', value: data.gamesBack.toString() },
          { label: 'Playoff Odds', value: `${data.playoffOdds}%`, color: data.playoffOdds >= 55 ? '#22c55e' : '#f97316' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '12px 20px', textAlign: 'center', minWidth: 100 }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>{s.label.toUpperCase()}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: s.color ?? '#f59e0b' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Priority Needs ── */}
      <div className="bloomberg-border" style={{ padding: 12, marginBottom: 16 }}>
        <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PRIORITY NEEDS</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {data.priorityNeeds.map((need, i) => (
            <span key={i} style={{ background: '#1a1a3e', border: '1px solid #f59e0b', padding: '4px 10px', color: '#f59e0b', fontSize: 12 }}>
              {need}
            </span>
          ))}
        </div>
      </div>

      {/* ── Targets Table ── */}
      <div className="bloomberg-border" style={{ padding: 12, marginBottom: 16 }}>
        <div style={{ color: '#888', fontSize: 10, marginBottom: 8 }}>TRADE TARGETS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
              <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Team</th>
              <th style={{ textAlign: 'center', padding: 6 }}>OVR</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Rental</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Est. Cost</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Fills Need</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Likelihood</th>
            </tr>
          </thead>
          <tbody>
            {data.targets.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: 6, fontWeight: 600 }}>{t.name}</td>
                <td style={{ padding: 6, textAlign: 'center' }}>{t.pos}</td>
                <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{t.team}</td>
                <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{t.overall}</td>
                <td style={{ padding: 6, textAlign: 'center', color: t.isRental ? '#ef4444' : '#22c55e' }}>
                  {t.isRental ? 'YES' : 'NO'}
                </td>
                <td style={{ padding: 6, color: '#ccc' }}>{t.estimatedCost}</td>
                <td style={{ padding: 6, color: '#3b82f6' }}>{t.fillsNeed}</td>
                <td style={{ padding: 6, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <div style={{ width: 50, height: 6, background: '#222', borderRadius: 3 }}>
                      <div style={{
                        width: `${t.likelihood}%`,
                        height: 6,
                        borderRadius: 3,
                        background: t.likelihood >= 60 ? '#22c55e' : t.likelihood >= 30 ? '#f59e0b' : '#ef4444',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#888' }}>{t.likelihood}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Bottom Row: Available Pieces + Recent Deals ── */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="bloomberg-border" style={{ flex: '1 1 280px', padding: 12 }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>AVAILABLE TRADE PIECES</div>
          {data.availablePieces.map((p, i) => (
            <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #222', color: '#ccc' }}>
              {p}
            </div>
          ))}
        </div>
        <div className="bloomberg-border" style={{ flex: '1 1 340px', padding: 12 }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>RECENT LEAGUE DEALS</div>
          {data.recentDeals.map((d, i) => (
            <div key={i} style={{ padding: '4px 0', borderBottom: '1px solid #222', color: '#ccc' }}>
              {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
