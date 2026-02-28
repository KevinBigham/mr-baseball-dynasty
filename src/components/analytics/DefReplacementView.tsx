import { generateDemoDefReplacement, getNetBenefitColor } from '../../engine/analytics/defReplacementEngine';

const data = generateDemoDefReplacement();

export default function DefReplacementView() {
  return (
    <div style={{ padding: 24, fontFamily: 'monospace', color: '#e5e7eb', minHeight: '100vh', background: '#030712' }}>
      <div style={{ borderBottom: '1px solid #374151', paddingBottom: 12, marginBottom: 16 }}>
        <h2 style={{ color: '#f59e0b', fontSize: 18, fontWeight: 700, margin: 0 }}>DEFENSIVE REPLACEMENT ENGINE</h2>
        <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0 0' }}>{data.teamName} — Late-game defensive substitution optimizer</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'SEASON DEF SUBS', value: data.seasonDefSubsUsed, color: '#f59e0b' },
          { label: 'RUNS SAVED', value: `+${data.seasonRunsSaved.toFixed(1)}`, color: '#22c55e' },
        ].map(m => (
          <div key={m.label} style={{ padding: 10, background: '#111827', border: '1px solid #374151', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 700 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: m.color, marginTop: 4 }}>{m.value}</div>
          </div>
        ))}
      </div>

      {data.scenarios.map((sc, idx) => (
        <div key={idx} style={{ border: '1px solid #374151', background: '#111827', padding: 14, marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>Inning {sc.inning}</span>
            <span style={{ fontSize: 11, color: '#22c55e' }}>Lead: +{sc.leadSize}</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{sc.outs} out{sc.outs !== 1 ? 's' : ''}</span>
          </div>

          {sc.options.map((opt, i) => (
            <div key={i} style={{ background: '#0a0f1a', border: '1px solid #1f2937', padding: 10, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 11 }}>
                  <span style={{ color: '#ef4444' }}>{opt.currentPlayer}</span>
                  <span style={{ color: '#6b7280' }}> ({opt.currentPosition}, DEF {opt.currentDefRating}) </span>
                  <span style={{ color: '#f59e0b' }}>{'\u2192'} </span>
                  <span style={{ color: '#22c55e' }}>{opt.replacement}</span>
                  <span style={{ color: '#6b7280' }}> (DEF {opt.replacementDefRating})</span>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', fontWeight: 700, color: opt.recommendation === 'strong-yes' ? '#22c55e' : opt.recommendation === 'yes' ? '#3b82f6' : opt.recommendation === 'situational' ? '#f59e0b' : '#ef4444', border: `1px solid`, borderColor: opt.recommendation === 'strong-yes' ? '#22c55e44' : opt.recommendation === 'yes' ? '#3b82f644' : opt.recommendation === 'situational' ? '#f59e0b44' : '#ef444444' }}>
                  {opt.recommendation.toUpperCase()}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 10 }}>
                <span style={{ color: '#22c55e' }}>+{opt.ratingGain} DEF</span>
                <span style={{ color: '#ef4444' }}>-{opt.offenseLoss.toFixed(2)} offense</span>
                <span style={{ color: getNetBenefitColor(opt.netBenefit), fontWeight: 700 }}>Net: {opt.netBenefit > 0 ? '+' : ''}{opt.netBenefit.toFixed(2)} runs</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
