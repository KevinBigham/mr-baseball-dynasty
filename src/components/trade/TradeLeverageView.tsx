/**
 * TradeLeverageView – Trade leverage index dashboard
 *
 * Bloomberg-terminal style negotiation leverage analysis with
 * factor breakdowns, advantage scoring, and approach recommendations.
 */
import { useState, useMemo } from 'react';
import {
  TradePartnerLeverage,
  LEVERAGE_GRADE_DISPLAY,
  getTradeLeverageSummary,
  generateDemoTradeLeverage,
} from '../../engine/trade/tradeLeverage';

export default function TradeLeverageView() {
  const partners = useMemo(() => generateDemoTradeLeverage(), []);
  const summary = useMemo(() => getTradeLeverageSummary(partners), [partners]);
  const [selected, setSelected] = useState<TradePartnerLeverage | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        TRADE LEVERAGE — NEGOTIATION INDEX
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Trade Partners', value: summary.totalPartners },
          { label: 'Your Advantage', value: summary.advantageCount, color: '#22c55e' },
          { label: 'Their Advantage', value: summary.disadvantageCount, color: '#ef4444' },
          { label: 'Avg Leverage', value: `${summary.avgLeverageScore > 0 ? '+' : ''}${summary.avgLeverageScore}` },
          { label: 'Best Target', value: summary.bestTarget },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Partner List ── */}
        <div style={{ flex: '1 1 460px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Target</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>WAR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Your Lev.</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Their Lev.</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Score</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Edge</th>
              </tr>
            </thead>
            <tbody>
              {partners.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setSelected(p)}
                  style={{
                    borderBottom: '1px solid #222',
                    cursor: 'pointer',
                    background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, fontWeight: 600 }}>{p.targetPlayer}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.partnerTeam}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.targetWAR}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: LEVERAGE_GRADE_DISPLAY[p.yourLeverage].color }}>{LEVERAGE_GRADE_DISPLAY[p.yourLeverage].label}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: LEVERAGE_GRADE_DISPLAY[p.theirLeverage].color }}>{LEVERAGE_GRADE_DISPLAY[p.theirLeverage].label}</td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.leverageScore >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                    {p.leverageScore > 0 ? '+' : ''}{p.leverageScore}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: p.overallAdvantage === 'you' ? '#22c55e' : p.overallAdvantage === 'them' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                    {p.overallAdvantage === 'you' ? '▲ YOU' : p.overallAdvantage === 'them' ? '▼ THEM' : '= EVEN'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.targetPlayer}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.targetPos} · {selected.partnerTeam} ({selected.partnerRecord})</span>
              </div>
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: selected.overallAdvantage === 'you' ? '#22c55e' : selected.overallAdvantage === 'them' ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                  {selected.overallAdvantage === 'you' ? '▲ Your Advantage' : selected.overallAdvantage === 'them' ? '▼ Their Advantage' : '= Even Leverage'}
                </span>
                <span style={{ color: '#888', marginLeft: 8 }}>Deal Likelihood: {selected.dealLikelihood}%</span>
              </div>

              {/* Leverage Factors */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>LEVERAGE FACTORS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Factor</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>You</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Them</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Edge</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.factors.map((f, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4 }}>
                        {f.factor}
                        <span style={{ color: '#444', fontSize: 9, marginLeft: 4 }}>{f.impact.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: f.advantage === 'you' ? '#22c55e' : '#888' }}>{f.yourScore}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: f.advantage === 'them' ? '#ef4444' : '#888' }}>{f.theirScore}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: f.advantage === 'you' ? '#22c55e' : f.advantage === 'them' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                        {f.advantage === 'you' ? '▲' : f.advantage === 'them' ? '▼' : '='}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Approach */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>SUGGESTED APPROACH</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#f59e0b', fontSize: 12, marginBottom: 12 }}>
                {selected.suggestedApproach}
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a trade partner to view leverage analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
