/**
 * FATrackerView – Free agent tracker & market dashboard
 *
 * Bloomberg-terminal style FA market tracker with signing status,
 * projected contracts, team interest, and comparable deals.
 */
import { useState, useMemo } from 'react';
import {
  FreeAgentEntry,
  STATUS_DISPLAY,
  getFATrackerSummary,
  generateDemoFATracker,
} from '../../engine/offseason/faTracker';

export default function FATrackerView() {
  const agents = useMemo(() => generateDemoFATracker(), []);
  const summary = useMemo(() => getFATrackerSummary(agents), [agents]);
  const [selected, setSelected] = useState<FreeAgentEntry | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        FREE AGENT TRACKER — MARKET DASHBOARD
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total FAs', value: summary.totalFAs },
          { label: 'Signed', value: summary.signedCount, color: '#22c55e' },
          { label: 'Committed', value: `$${summary.totalCommitted}M` },
          { label: 'Biggest Deal', value: summary.biggestDeal },
          { label: 'Hottest', value: summary.hottest, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 480px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Age</th>
                <th style={{ textAlign: 'center', padding: 6 }}>WAR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Proj AAV</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map(a => (
                <tr
                  key={a.id}
                  onClick={() => setSelected(a)}
                  style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === a.id ? '#1a1a3e' : 'transparent' }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{a.pos}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{a.age}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{a.recentWAR}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>${a.projectedAAV}M</td>
                  <td style={{ padding: 6, textAlign: 'center', color: STATUS_DISPLAY[a.marketStatus].color, fontWeight: 600 }}>{STATUS_DISPLAY[a.marketStatus].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 360px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · Age {selected.age}</span>
              </div>
              <div style={{ color: STATUS_DISPLAY[selected.marketStatus].color, fontWeight: 700, marginBottom: 12 }}>
                {STATUS_DISPLAY[selected.marketStatus].label}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>Former: {selected.formerTeam} · {selected.recentWAR} WAR</span>
              </div>

              {/* Contract Info */}
              {selected.signedTeam ? (
                <div style={{ padding: 10, border: '1px solid #22c55e', marginBottom: 14 }}>
                  <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>SIGNED</div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.signedYears}yr / ${(selected.signedAAV! * selected.signedYears!).toFixed(0)}M</span>
                    <span style={{ color: '#888', marginLeft: 8 }}>(${selected.signedAAV}M AAV)</span>
                  </div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>Team: {selected.signedTeam} · Date: {selected.signingDate}</div>
                </div>
              ) : (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>PROJECTED CONTRACT</div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.projectedYears}yr / ${selected.projectedTotal}M</span>
                    <span style={{ color: '#888', marginLeft: 8 }}>(${selected.projectedAAV}M AAV)</span>
                  </div>
                </div>
              )}

              {/* Interested Teams */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>INTERESTED TEAMS</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {selected.interestedTeams.map(t => (
                  <span key={t} style={{ padding: '2px 8px', border: '1px solid #333', fontSize: 11, color: t === selected.signedTeam ? '#22c55e' : '#ccc' }}>{t}</span>
                ))}
              </div>

              {/* QO & Comp */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.qo === 'rejected' ? '#ef4444' : selected.qo === 'accepted' ? '#22c55e' : '#888', fontWeight: 700 }}>{selected.qo.toUpperCase()}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>QO Status</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>COMPARABLE SIGNING</div>
              <div style={{ padding: 4, color: '#ccc', fontSize: 11, marginBottom: 12 }}>{selected.comp}</div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>NOTES</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a free agent to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
