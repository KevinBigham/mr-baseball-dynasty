/**
 * WaiverClaimsView – Waiver claim strategy dashboard
 *
 * Bloomberg-terminal style waiver wire with claim recommendations,
 * deadlines, and player evaluations.
 */
import { useMemo } from 'react';
import {
  CLAIM_DISPLAY,
  generateDemoWaiverClaims,
} from '../../engine/roster/waiverClaims';

export default function WaiverClaimsView() {
  const data = useMemo(() => generateDemoWaiverClaims(), []);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        WAIVER CLAIMS — AVAILABLE TALENT
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Waiver Priority', value: `#${data.teamPriority}` },
          { label: 'Claims Made', value: data.claimsThisSeason },
          { label: 'Successful', value: data.successfulClaims, color: '#22c55e' },
          { label: 'Roster Spots Open', value: data.rosterSpotsOpen, color: data.rosterSpotsOpen > 0 ? '#22c55e' : '#ef4444' },
          { label: 'Available Players', value: data.availablePlayers.length },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Player Cards ── */}
      {data.availablePlayers.map(p => {
        const cd = CLAIM_DISPLAY[p.recommendation];
        return (
          <div key={p.id} className="bloomberg-border" style={{ padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b' }}>{p.name}</span>
                <span style={{ color: '#888', marginLeft: 8 }}>{p.pos} · {p.team} · Age {p.age} · OVR {p.overall}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ color: cd.color, fontWeight: 700 }}>{cd.emoji} {cd.label}</span>
                <span style={{ color: '#888', fontSize: 11 }}>Deadline: {p.claimDeadline}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 16, marginBottom: 6, fontSize: 12 }}>
              <span>Salary: <span style={{ color: p.salary > 5 ? '#ef4444' : '#22c55e' }}>${p.salary}M</span></span>
              <span>Type: <span style={{ color: '#888' }}>{p.waiverType.toUpperCase()}</span></span>
              <span>Fills Need: <span style={{ color: p.fillsNeed ? '#22c55e' : '#888' }}>{p.fillsNeed ? 'YES' : 'NO'}</span></span>
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#22c55e', fontSize: 10, marginBottom: 2 }}>UPSIDE</div>
                <div style={{ color: '#ccc' }}>{p.upside}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#ef4444', fontSize: 10, marginBottom: 2 }}>RISK</div>
                <div style={{ color: '#ccc' }}>{p.risk}</div>
              </div>
            </div>

            <div style={{ marginTop: 6, padding: 6, background: '#111', border: '1px solid #222', fontSize: 11, color: '#888' }}>
              Scout: {p.scoutNote}
            </div>
          </div>
        );
      })}
    </div>
  );
}
