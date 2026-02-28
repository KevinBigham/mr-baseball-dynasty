import { generateDemoGameScript, getScriptColor } from '../../engine/analytics/gameScriptAnalyzer';

const data = generateDemoGameScript();

export default function GameScriptView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>GAME SCRIPT ANALYZER</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} ({data.overallRecord}) — Performance by game state</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'CLOSE GAMES', value: data.closeGameRecord, color: '#3b82f6' },
          { label: 'BLOWOUTS', value: data.blowoutRecord, color: '#22c55e' },
          { label: 'EXTRA INNINGS', value: data.extraInningRecord, color: '#f59e0b' },
          { label: 'ONE-RUN GAMES', value: data.onRunRecord, color: '#e5e7eb' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>GAME SCRIPTS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '130px 55px 50px 60px 60px 60px 70px', gap: 4, marginBottom: 6 }}>
          {['SCRIPT', 'W-L', 'WIN%', 'R/G', 'RA/G', 'CMBACK', 'BLOWN'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.scripts.map(s => (
          <div key={s.script} style={{ display: 'grid', gridTemplateColumns: '130px 55px 50px 60px 60px 60px 70px', gap: 4, padding: '4px 0', borderTop: '1px solid #1f2937', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 600 }}>{s.script}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>{s.wins}-{s.losses}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: getScriptColor(s.winPct) }}>{(s.winPct * 100).toFixed(0)}%</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{s.avgRunsScored.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: '#ef4444' }}>{s.avgRunsAllowed.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: s.comebackRate > 0 ? '#22c55e' : '#6b7280' }}>{s.comebackRate > 0 ? `${s.comebackRate}%` : '—'}</div>
            <div style={{ fontSize: 10, color: s.blownLeadRate > 0 ? '#ef4444' : '#6b7280' }}>{s.blownLeadRate > 0 ? `${s.blownLeadRate}%` : '—'}</div>
          </div>
        ))}
      </div>

      <div style={{ border: '1px solid #374151', background: '#111827', padding: 14 }}>
        <div style={{ color: '#f59e0b', fontSize: 10, fontWeight: 700, marginBottom: 8 }}>INNING-BY-INNING</div>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 60px 60px 60px 60px', gap: 4, marginBottom: 6 }}>
          {['INN', 'SCORED', 'ALLOWED', 'DIFF', 'BIG INN'].map(h => (
            <div key={h} style={{ fontSize: 9, color: '#6b7280', fontWeight: 700 }}>{h}</div>
          ))}
        </div>
        {data.inningPerformance.map(ip => (
          <div key={ip.inning} style={{ display: 'grid', gridTemplateColumns: '40px 60px 60px 60px 60px', gap: 4, padding: '3px 0', borderTop: '1px solid #1f2937' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>{ip.inning}</div>
            <div style={{ fontSize: 10, color: '#22c55e' }}>{ip.runsScored}</div>
            <div style={{ fontSize: 10, color: '#ef4444' }}>{ip.runsAllowed}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: ip.runDiff > 0 ? '#22c55e' : '#ef4444' }}>{ip.runDiff > 0 ? '+' : ''}{ip.runDiff}</div>
            <div style={{ fontSize: 10, color: '#3b82f6' }}>{ip.bigInnings}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
