/**
 * PitchSequenceView – Pitch sequence analysis dashboard
 *
 * Bloomberg-terminal style view showing pitch sequencing patterns,
 * tunneling combos, predictability grades, and count tendencies.
 */
import { useState, useMemo } from 'react';
import {
  PitcherSequenceProfile,
  PREDICTABILITY_DISPLAY,
  generateDemoSequences,
} from '../../engine/pitching/pitchSequence';

export default function PitchSequenceView() {
  const profiles = useMemo(() => generateDemoSequences(), []);
  const [selected, setSelected] = useState<PitcherSequenceProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PITCH SEQUENCE — PATTERN ANALYSIS
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Pitcher List ── */}
        <div style={{ flex: '1 1 400px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Pitcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Team</th>
                <th style={{ textAlign: 'center', padding: 6 }}>OVR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pred. Score</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => {
                const pg = PREDICTABILITY_DISPLAY[p.predictabilityGrade];
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelected(p)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === p.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.team}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{p.overall}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{p.predictabilityScore}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: pg.color, fontWeight: 600 }}>{pg.emoji} {pg.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail Panel ── */}
        <div style={{ flex: '1 1 440px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · {selected.pos}</span>
              </div>
              <div style={{ color: PREDICTABILITY_DISPLAY[selected.predictabilityGrade].color, fontWeight: 700, marginBottom: 12 }}>
                {PREDICTABILITY_DISPLAY[selected.predictabilityGrade].emoji} {PREDICTABILITY_DISPLAY[selected.predictabilityGrade].label}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>Score: {selected.predictabilityScore}/100</span>
              </div>

              {/* First Pitch Breakdown */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>FIRST PITCH BREAKDOWN</div>
              <div style={{ display: 'flex', gap: 2, marginBottom: 14, height: 14 }}>
                {Object.entries(selected.firstPitchBreakdown).map(([pitch, pct]) => (
                  <div key={pitch} style={{
                    width: `${pct}%`, background: pitch.includes('Seam') || pitch.includes('Sinker') ? '#ef4444' : pitch.includes('Slider') ? '#3b82f6' : pitch.includes('Curve') ? '#a855f7' : '#22c55e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff',
                  }}>
                    {pct >= 12 ? `${pitch} ${pct}%` : ''}
                  </div>
                ))}
              </div>

              {/* Top Combos */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>TOP SEQUENCE COMBOS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>1st Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>&rarr;</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>2nd Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Freq</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Whiff%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>RV/100</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Tunnel</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.topCombos.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{c.first}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#555' }}>&rarr;</td>
                      <td style={{ padding: 4, fontWeight: 600 }}>{c.second}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{c.frequency}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: c.whiffRate >= 30 ? '#f59e0b' : '#ccc' }}>{c.whiffRate}%</td>
                      <td style={{ padding: 4, textAlign: 'center', color: c.runValue <= -2 ? '#22c55e' : '#ccc' }}>{c.runValue}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: c.tunnelScore >= 80 ? '#22c55e' : '#ccc' }}>{c.tunnelScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Count Tendencies */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>COUNT TENDENCIES</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'center', padding: 4 }}>Count</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>Top Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>%</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>2nd Pitch</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>%</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Zone%</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.countTendencies.map((ct, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, textAlign: 'center', fontWeight: 700, color: '#f59e0b' }}>{ct.count}</td>
                      <td style={{ padding: 4 }}>{ct.topPitch}</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{ct.topPitchPct}%</td>
                      <td style={{ padding: 4, color: '#888' }}>{ct.secondPitch}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{ct.secondPitchPct}%</td>
                      <td style={{ padding: 4, textAlign: 'center' }}>{ct.zoneRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>TWO-STRIKE APPROACH</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12, marginBottom: 8 }}>
                {selected.twoStrikeApproach}
              </div>
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>NOTES</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.sequenceNotes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a pitcher to view sequence analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
