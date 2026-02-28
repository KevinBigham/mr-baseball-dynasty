/**
 * DraftCapitalView – Draft pick portfolio and capital tracker
 *
 * Bloomberg-terminal style draft capital dashboard showing
 * owned picks, traded picks, and historical selection results.
 */
import { useState, useMemo } from 'react';
import {
  TIER_DISPLAY,
  generateDemoDraftCapital,
} from '../../engine/draft/draftCapital';

type Tab = 'owned' | 'traded' | 'history';

export default function DraftCapitalView() {
  const data = useMemo(() => generateDemoDraftCapital(), []);
  const [tab, setTab] = useState<Tab>('owned');

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        DRAFT CAPITAL — PICK PORTFOLIO
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Owned Picks', value: data.ownedPicks.length },
          { label: 'Traded Away', value: data.tradedAwayPicks.length, color: '#ef4444' },
          { label: 'Premium Picks', value: data.premiumPickCount, color: '#22c55e' },
          { label: 'Total Pick Value', value: `$${data.totalOwnedValue.toFixed(1)}M`, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {([['owned', 'OWNED PICKS'], ['traded', 'TRADED AWAY'], ['history', 'HISTORY']] as const).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              background: tab === t ? '#f59e0b' : '#1a1a2e',
              color: tab === t ? '#000' : '#ccc',
              border: '1px solid #333',
              padding: '4px 14px',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 12,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Owned Picks ── */}
      {tab === 'owned' && (
        <div className="bloomberg-border" style={{ padding: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'center', padding: 6 }}>Year</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Round</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Overall</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Origin</th>
                <th style={{ textAlign: 'center', padding: 6 }}>From</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Slot $</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Tier</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {data.ownedPicks.map(p => {
                const td = TIER_DISPLAY[p.tier];
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{p.year}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>R{p.round}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{p.overallSlot ?? 'TBD'}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: p.origin === 'acquired' ? '#22c55e' : p.origin === 'comp' ? '#3b82f6' : '#ccc' }}>
                      {p.origin.toUpperCase().replace('_', ' ')}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.fromTeam}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.slotValue ? `$${p.slotValue}M` : '—'}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: td.color, fontWeight: 600 }}>{td.label}</td>
                    <td style={{ padding: 6, color: '#888' }}>{p.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Traded Away ── */}
      {tab === 'traded' && (
        <div className="bloomberg-border" style={{ padding: 12 }}>
          {data.tradedAwayPicks.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#555' }}>No picks traded away</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                  <th style={{ textAlign: 'center', padding: 6 }}>Year</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Round</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Overall</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Traded To</th>
                  <th style={{ textAlign: 'center', padding: 6 }}>Tier</th>
                  <th style={{ textAlign: 'left', padding: 6 }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.tradedAwayPicks.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{p.year}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>R{p.round}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#ef4444' }}>{p.overallSlot ?? 'TBD'}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f97316' }}>{p.tradedTo}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: TIER_DISPLAY[p.tier].color }}>{TIER_DISPLAY[p.tier].label}</td>
                    <td style={{ padding: 6, color: '#888' }}>{p.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── History ── */}
      {tab === 'history' && (
        <div className="bloomberg-border" style={{ padding: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'center', padding: 6 }}>Year</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Rd</th>
                <th style={{ textAlign: 'center', padding: 6 }}>#</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Level</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Current Status</th>
              </tr>
            </thead>
            <tbody>
              {data.historicalPicks.map((h, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: 6, textAlign: 'center', fontWeight: 700 }}>{h.year}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>R{h.round}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>#{h.overall}</td>
                  <td style={{ padding: 6, fontWeight: 600 }}>{h.playerName}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{h.pos}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{h.currentLevel}</td>
                  <td style={{ padding: 6, color: h.currentGrade.includes('Rising') ? '#22c55e' : h.currentGrade.includes('Stalling') ? '#ef4444' : '#ccc' }}>
                    {h.currentGrade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
