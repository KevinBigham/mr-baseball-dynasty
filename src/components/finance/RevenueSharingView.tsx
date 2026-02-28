/**
 * RevenueSharingView – Revenue sharing model dashboard
 *
 * Bloomberg-terminal style revenue tracker with contributions,
 * distributions, market size breakdowns, and financial position.
 */
import { useState, useMemo } from 'react';
import {
  TeamRevenue,
  MARKET_DISPLAY,
  getRevenueSummary,
  generateDemoRevenueSharing,
} from '../../engine/finance/revenueSharing';

export default function RevenueSharingView() {
  const teams = useMemo(() => generateDemoRevenueSharing(), []);
  const summary = useMemo(() => getRevenueSummary(teams), [teams]);
  const [selected, setSelected] = useState<TeamRevenue | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        REVENUE SHARING — FINANCIAL MODEL
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Pool', value: `$${summary.totalPool}M` },
          { label: 'Avg Revenue', value: `$${summary.avgRevenue}M` },
          { label: 'Biggest Payer', value: summary.biggestPayer },
          { label: 'Biggest Receiver', value: summary.biggestReceiver },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 120, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Team List ── */}
        <div style={{ flex: '1 1 520px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Market</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Revenue</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Payroll</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Net Rev$</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Op Income</th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selected?.id === t.id ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{t.abbr}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: MARKET_DISPLAY[t.marketSize].color, fontSize: 10 }}>{MARKET_DISPLAY[t.marketSize].label}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>${t.totalRevenue}M</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>${t.payroll}M</td>
                  <td style={{ padding: 6, textAlign: 'center', color: t.netRevSharing >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {t.netRevSharing > 0 ? '+' : ''}{t.netRevSharing}M
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: t.operatingIncome >= 0 ? '#22c55e' : '#ef4444' }}>
                    ${t.operatingIncome}M
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 340px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.teamName}
                <span style={{ color: MARKET_DISPLAY[selected.marketSize].color, fontWeight: 400, marginLeft: 8, fontSize: 11 }}>{MARKET_DISPLAY[selected.marketSize].label}</span>
              </div>

              {/* Revenue Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6, marginTop: 12 }}>REVENUE BREAKDOWN</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'Local', value: `$${selected.localRevenue}M` },
                  { label: 'National', value: `$${selected.nationalRevenue}M` },
                  { label: 'Total', value: `$${selected.totalRevenue}M`, color: '#f59e0b' },
                  { label: 'TV Deal', value: `$${selected.tvDealValue}M/yr` },
                  { label: 'Attendance', value: `${selected.attendance}K` },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#ccc', fontWeight: 600, fontSize: 13 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Revenue Sharing */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>REVENUE SHARING</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#ef4444', fontWeight: 700 }}>-${selected.revenueShareContrib}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Contributed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontWeight: 700 }}>+${selected.revenueShareReceived}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Received</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.netRevSharing >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 16 }}>
                    {selected.netRevSharing > 0 ? '+' : ''}${selected.netRevSharing}M
                  </div>
                  <div style={{ color: '#666', fontSize: 9 }}>Net</div>
                </div>
              </div>

              {/* Financial Position */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>FINANCIAL POSITION</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>${selected.payroll}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Payroll</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.payrollPct > 60 ? '#ef4444' : '#ccc', fontWeight: 700 }}>{selected.payrollPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Payroll/Rev</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.operatingIncome >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>${selected.operatingIncome}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Op Income</div>
                </div>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a team to view revenue details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
