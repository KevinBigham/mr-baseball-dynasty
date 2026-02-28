/**
 * BaserunningIQView – Baserunning intelligence dashboard
 *
 * Bloomberg-terminal style baserunning analysis with BsR,
 * extra-base rates, tagging efficiency, and decision breakdowns.
 */
import { useState, useMemo } from 'react';
import {
  BaserunnerProfile,
  BSR_DISPLAY,
  getBaserunningTeamSummary,
  generateDemoBaserunning,
} from '../../engine/analytics/baserunningIQ';

export default function BaserunningIQView() {
  const runners = useMemo(() => generateDemoBaserunning(), []);
  const summary = useMemo(() => getBaserunningTeamSummary(runners), [runners]);
  const [selected, setSelected] = useState<BaserunnerProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        BASERUNNING IQ — DECISION ANALYSIS
      </div>

      {/* ── Summary ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Team BsR', value: summary.teamBsR, color: summary.teamBsR >= 0 ? '#22c55e' : '#ef4444' },
          { label: 'Best Runner', value: summary.bestBaserunner },
          { label: 'Extra Base%', value: `${summary.extraBasePct}%` },
          { label: 'Outs On Bases', value: summary.totalOutsOnBases, color: '#ef4444' },
          { label: 'Elite Runners', value: summary.eliteRunners, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Runner List ── */}
        <div style={{ flex: '1 1 440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Player</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Spd</th>
                <th style={{ textAlign: 'center', padding: 6 }}>BsR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Xtra%</th>
                <th style={{ textAlign: 'center', padding: 6 }}>1st→3rd</th>
                <th style={{ textAlign: 'center', padding: 6 }}>TagUp</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {runners.map(r => {
                const bg = BSR_DISPLAY[r.bsrGrade];
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: selected?.id === r.id ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: r.speed >= 65 ? '#22c55e' : '#888' }}>{r.speed}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: r.bsr >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {r.bsr > 0 ? '+' : ''}{r.bsr}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{r.extraBaseTakenPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{r.firstToThirdPct}%</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{r.tagUpSuccessRate}%</td>
                    <td style={{ padding: 6, textAlign: 'center', color: bg.color, fontWeight: 600 }}>{bg.emoji} {bg.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Detail ── */}
        <div style={{ flex: '1 1 360px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.pos} · {selected.team} · OVR {selected.overall}</span>
              </div>
              <div style={{ color: BSR_DISPLAY[selected.bsrGrade].color, fontWeight: 700, marginBottom: 12 }}>
                {BSR_DISPLAY[selected.bsrGrade].emoji} {BSR_DISPLAY[selected.bsrGrade].label}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8 }}>Speed: {selected.speed}</span>
              </div>

              {/* Key Rates */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>BASERUNNING RATES</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                {[
                  { label: 'BsR', value: `${selected.bsr > 0 ? '+' : ''}${selected.bsr}`, color: selected.bsr >= 0 ? '#22c55e' : '#ef4444' },
                  { label: 'Extra Base%', value: `${selected.extraBaseTakenPct}%` },
                  { label: '1st→3rd', value: `${selected.firstToThirdPct}%` },
                  { label: 'Score 2nd', value: `${selected.scoringFromSecondPct}%` },
                  { label: 'Tag Up', value: `${selected.tagUpSuccessRate}%` },
                  { label: 'SB Rate', value: `${selected.stolenBaseSuccessRate}%` },
                  { label: 'SB Att', value: selected.stolenBaseAttempts },
                  { label: 'Outs', value: selected.outsOnBases, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#f59e0b', fontWeight: 600, fontSize: 13 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Decisions */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>RECENT DECISIONS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Situation</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Result</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.decisions.map((d, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4 }}>{d.situation}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: d.correct ? '#22c55e' : '#ef4444' }}>
                        {d.correct ? '✓' : '✗'}
                      </td>
                      <td style={{ padding: 4, textAlign: 'center', color: d.valueAdded >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                        {d.valueAdded > 0 ? '+' : ''}{d.valueAdded}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Notes */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a player to view baserunning analysis
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
