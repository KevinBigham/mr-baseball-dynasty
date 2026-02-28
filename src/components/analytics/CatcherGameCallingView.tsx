/**
 * CatcherGameCallingView – Catcher game-calling dashboard
 *
 * Bloomberg-terminal style catcher evaluation with calling grades,
 * pitch mix tendencies, pitcher handling profiles, and total value.
 */
import { useState, useMemo } from 'react';
import {
  CatcherCallingProfile,
  CALLING_GRADE_DISPLAY,
  getCatcherCallingSummary,
  generateDemoCatcherCalling,
} from '../../engine/analytics/catcherGameCalling';

export default function CatcherGameCallingView() {
  const catchers = useMemo(() => generateDemoCatcherCalling(), []);
  const summary = useMemo(() => getCatcherCallingSummary(catchers), [catchers]);
  const [selected, setSelected] = useState<CatcherCallingProfile | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        CATCHER GAME CALLING — PITCH CALLING ANALYTICS
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Catchers', value: summary.totalCatchers },
          { label: 'Best Caller', value: summary.bestCaller, color: '#22c55e' },
          { label: 'Best Framer', value: summary.bestFramer, color: '#22c55e' },
          { label: 'Avg Call Runs', value: summary.avgCallingRuns },
          { label: 'Elite Callers', value: summary.eliteCallers, color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 460px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Catcher</th>
                <th style={{ textAlign: 'center', padding: 6 }}>GS</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Staff ERA</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Frame</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Call</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Total</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {catchers.map(c => {
                const gd = CALLING_GRADE_DISPLAY[c.callingGrade];
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selected?.id === c.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{c.gamesStarted}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>{c.staffERA.toFixed(2)}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: c.framingRuns >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {c.framingRuns > 0 ? '+' : ''}{c.framingRuns}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: c.callingRuns >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {c.callingRuns > 0 ? '+' : ''}{c.callingRuns}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: c.totalCatcherValue >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                      {c.totalCatcherValue > 0 ? '+' : ''}{c.totalCatcherValue}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: gd.color, fontWeight: 600 }}>{gd.emoji} {gd.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ flex: '1 1 380px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selected.team} · Age {selected.age} · OVR {selected.overall}</span>
              </div>
              <div style={{ color: CALLING_GRADE_DISPLAY[selected.callingGrade].color, fontWeight: 700, marginBottom: 12 }}>
                {CALLING_GRADE_DISPLAY[selected.callingGrade].emoji} {CALLING_GRADE_DISPLAY[selected.callingGrade].label} Game-Caller
              </div>

              {/* Value Components */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>CATCHER VALUE (RUNS)</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'Framing', value: selected.framingRuns },
                  { label: 'Blocking', value: selected.blockingRuns },
                  { label: 'Throwing', value: selected.throwingRuns },
                  { label: 'Calling', value: selected.callingRuns },
                  { label: 'Total', value: selected.totalCatcherValue },
                ].map(v => (
                  <div key={v.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: v.value >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: 14 }}>
                      {v.value > 0 ? '+' : ''}{v.value}
                    </div>
                    <div style={{ color: '#666', fontSize: 9 }}>{v.label}</div>
                  </div>
                ))}
              </div>

              {/* Pitch Mix */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>CALLING TENDENCIES</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.fbPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Fastball</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.breakingPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Breaking</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{selected.offspeedPct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Offspeed</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.firstPitchStrikePct >= 62 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{selected.firstPitchStrikePct}%</div>
                  <div style={{ color: '#666', fontSize: 9 }}>1st Pitch K%</div>
                </div>
              </div>

              {/* Pitcher Handling */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>PITCHER HANDLING</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Pitcher</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>ERA w/</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>ERA w/o</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.pitcherHandling.map(ph => (
                    <tr key={ph.pitcherId} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ padding: 4, fontWeight: 600 }}>{ph.pitcherName}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: ph.eraWith < ph.eraWithout ? '#22c55e' : '#ef4444' }}>{ph.eraWith.toFixed(2)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#888' }}>{ph.eraWithout.toFixed(2)}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: ph.rating >= 0 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>
                        {ph.rating > 0 ? '+' : ''}{ph.rating.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ANALYSIS</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a catcher to view game-calling profile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
