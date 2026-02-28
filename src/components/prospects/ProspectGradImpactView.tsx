/**
 * ProspectGradImpactView — Prospect Graduation Impact Dashboard (Wave 78)
 *
 * Bloomberg-terminal style view forecasting the impact of top prospects
 * arriving at the MLB level. Shows WAR projections, roster displacement,
 * cost savings, and graduation timeline.
 */
import { useMemo, useState } from 'react';
import {
  generateDemoProspectGradImpact,
  READINESS_DISPLAY,
  type ProspectGradCandidate,
  type RosterImpactEntry,
  type ProspectGradData,
} from '../../engine/prospects/prospectGradImpact';

// ─── Style constants ─────────────────────────────────────────────────────────

const S = {
  bg:      '#030712',
  panel:   '#111827',
  border:  '#374151',
  accent:  '#f59e0b',
  text:    '#e5e7eb',
  muted:   '#6b7280',
  dim:     '#9ca3af',
  green:   '#22c55e',
  blue:    '#3b82f6',
  red:     '#ef4444',
  orange:  '#f97316',
  mono:    "'IBM Plex Mono', 'Fira Code', 'Consolas', monospace",
} as const;

const panelStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: S.panel,
  border: `1px solid ${S.border}`,
  borderRadius: 4,
  ...extra,
});

const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
  borderBottom: `1px solid ${S.accent}`,
  padding: '10px 20px',
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: 1.2,
  color: S.accent,
  textTransform: 'uppercase',
  fontFamily: S.mono,
};

const labelStyle: React.CSSProperties = {
  color: S.muted,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: 0.8,
  textTransform: 'uppercase',
  fontFamily: S.mono,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ReadinessBadge({ grade }: { grade: ProspectGradCandidate['readiness'] }) {
  const info = READINESS_DISPLAY[grade];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 700,
      borderRadius: 3,
      background: info.color + '22',
      color: info.color,
      border: `1px solid ${info.color}44`,
      fontFamily: S.mono,
    }}>
      {info.label.toUpperCase()}
    </span>
  );
}

function RecBadge({ rec }: { rec: RosterImpactEntry['recommendation'] }) {
  const colorMap: Record<string, string> = {
    PROMOTE: S.green, PLATOON: S.blue, WAIT: S.orange, TRADE_VET: S.red,
  };
  const c = colorMap[rec] ?? S.muted;
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 700,
      borderRadius: 3,
      background: c + '22',
      color: c,
      border: `1px solid ${c}44`,
      fontFamily: S.mono,
    }}>
      {rec.replace('_', ' ')}
    </span>
  );
}

function WARBarMini({ value, max = 6 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = value >= 4 ? S.green : value >= 2 ? S.accent : value >= 1 ? S.blue : S.muted;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: S.mono, minWidth: 30, textAlign: 'right' }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function StatBox({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={{ ...panelStyle({ padding: '10px 14px', textAlign: 'center', minWidth: 110 }) }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? S.accent, fontFamily: S.mono, marginTop: 2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ProspectCard({ prospect, isSelected, onClick }: {
  prospect: ProspectGradCandidate;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        ...panelStyle({
          padding: 14,
          cursor: 'pointer',
          transition: 'all 0.15s',
          borderColor: isSelected ? S.accent : S.border,
          background: isSelected ? '#1a1a2e' : S.panel,
        }),
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ color: S.accent, fontWeight: 700, fontSize: 14, fontFamily: S.mono }}>
            {prospect.name}
          </div>
          <div style={{ color: S.muted, fontSize: 11, fontFamily: S.mono }}>
            {prospect.position} | Age {prospect.age} | {prospect.currentLevel}
          </div>
        </div>
        <ReadinessBadge grade={prospect.readiness} />
      </div>

      {/* Ratings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        {[
          { label: 'OVR', val: prospect.overall, c: S.text },
          { label: 'POT', val: prospect.potential, c: S.blue },
          { label: 'ORG #', val: prospect.orgRank, c: S.accent },
          { label: 'MLB #', val: prospect.overallRank, c: S.green },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ ...labelStyle, fontSize: 9 }}>{s.label}</div>
            <div style={{ fontWeight: 700, fontSize: 16, color: s.c, fontFamily: S.mono }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* WAR Projections */}
      <div style={{ ...labelStyle, marginBottom: 4, fontSize: 9 }}>WAR PROJECTION (YR 1-3)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
        {[
          { yr: 'Y1', val: prospect.warProjection.year1 },
          { yr: 'Y2', val: prospect.warProjection.year2 },
          { yr: 'Y3', val: prospect.warProjection.year3 },
        ].map(w => (
          <div key={w.yr}>
            <div style={{ color: S.muted, fontSize: 9, fontFamily: S.mono }}>{w.yr}</div>
            <WARBarMini value={w.val} />
          </div>
        ))}
      </div>

      {/* Tools */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {prospect.keyTools.map((tool, i) => (
          <span key={i} style={{
            padding: '1px 6px',
            fontSize: 9,
            background: '#1e293b',
            border: `1px solid ${S.border}`,
            borderRadius: 3,
            color: S.dim,
            fontFamily: S.mono,
          }}>
            {tool}
          </span>
        ))}
      </div>

      {/* Stats + ETA */}
      <div style={{ fontSize: 10, color: S.dim, fontFamily: S.mono, marginBottom: 4 }}>
        {prospect.minorLeagueStats}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: S.mono }}>
        <span style={{ color: S.muted }}>ETA: <span style={{ color: S.accent }}>{prospect.eta}</span></span>
        <span style={{ color: S.muted }}>Readiness: <span style={{ color: READINESS_DISPLAY[prospect.readiness].color }}>{prospect.readinessScore}%</span></span>
      </div>

      {/* Concern */}
      {prospect.concern && (
        <div style={{ marginTop: 6, padding: '4px 8px', background: '#1c1917', border: `1px solid ${S.orange}33`, borderRadius: 3 }}>
          <span style={{ fontSize: 9, color: S.orange, fontFamily: S.mono }}>CONCERN: </span>
          <span style={{ fontSize: 9, color: S.dim, fontFamily: S.mono }}>{prospect.concern}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ProspectGradImpactView() {
  const data: ProspectGradData = useMemo(() => generateDemoProspectGradImpact(), []);
  const [selectedId, setSelectedId] = useState<number | null>(data.prospects[0]?.id ?? null);

  const selectedImpact = data.rosterImpact.find(r => r.prospectId === selectedId);

  const totalYear1WAR = data.prospects.reduce((s, p) => s + p.warProjection.year1, 0);
  const mlbReadyCount = data.prospects.filter(p => p.readiness === 'MLB_READY').length;

  return (
    <div style={{ padding: 18, color: S.text, fontFamily: S.mono, fontSize: 13, background: S.bg, minHeight: '100vh' }}>
      {/* ── Header ── */}
      <div style={headerStyle}>
        PROSPECT GRADUATION IMPACT
        <span style={{ float: 'right', fontSize: 10, color: S.muted, fontWeight: 400 }}>
          {data.teamAbbr} | {data.season} PIPELINE FORECAST
        </span>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatBox label="TOP PROSPECTS" value={data.prospects.length} sub="In graduation pipeline" />
        <StatBox label="MLB READY" value={mlbReadyCount} color={S.green} sub="Can contribute now" />
        <StatBox label="PROJ. YR1 WAR" value={totalYear1WAR.toFixed(1)} color={S.blue} sub="Combined year-1 impact" />
        <StatBox label="ANNUAL SAVINGS" value={`$${data.costSummary.totalAnnualSavings.toFixed(1)}M`} color={S.green} sub="vs. incumbent salaries" />
        <StatBox label="3-YEAR SAVINGS" value={`$${data.costSummary.threeYearSavings.toFixed(1)}M`} sub="Projected surplus value" />
      </div>

      {/* ── Main layout: Prospects + Detail ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Left: Prospect cards */}
        <div>
          <div style={{ ...labelStyle, marginBottom: 8 }}>GRADUATION CANDIDATES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {data.prospects.map(p => (
              <ProspectCard
                key={p.id}
                prospect={p}
                isSelected={selectedId === p.id}
                onClick={() => setSelectedId(p.id)}
              />
            ))}
          </div>
        </div>

        {/* Right: Roster Impact + Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Selected Roster Impact */}
          {selectedImpact && (
            <div style={panelStyle({ padding: 16 })}>
              <div style={{ ...labelStyle, marginBottom: 10 }}>ROSTER IMPACT ANALYSIS</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: S.accent }}>{selectedImpact.prospectName}</div>
                  <div style={{ fontSize: 11, color: S.muted }}>{selectedImpact.prospectPos}</div>
                </div>
                <div style={{ fontSize: 18, color: S.muted }}>vs</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: S.dim }}>{selectedImpact.incumbentName}</div>
                  <div style={{ fontSize: 11, color: S.muted }}>{selectedImpact.incumbentPos} | Age {selectedImpact.incumbentAge} | {selectedImpact.incumbentOvr} OVR</div>
                </div>
              </div>

              <RecBadge rec={selectedImpact.recommendation} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...labelStyle, fontSize: 9 }}>WAR UPGRADE</div>
                  <div style={{
                    fontSize: 20, fontWeight: 700, fontFamily: S.mono,
                    color: selectedImpact.warUpgrade >= 0 ? S.green : S.red,
                  }}>
                    {selectedImpact.warUpgrade >= 0 ? '+' : ''}{selectedImpact.warUpgrade.toFixed(1)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...labelStyle, fontSize: 9 }}>ANNUAL SAVINGS</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: S.mono, color: S.green }}>
                    ${selectedImpact.annualSavings.toFixed(1)}M
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ ...labelStyle, fontSize: 9 }}>SURPLUS VALUE</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: S.mono, color: S.accent }}>
                    ${selectedImpact.surplusValue.toFixed(1)}M
                  </div>
                </div>
              </div>

              {/* Salary comparison bar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ ...labelStyle, fontSize: 9, marginBottom: 6 }}>SALARY COMPARISON</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                      <span style={{ color: S.red }}>Veteran: ${selectedImpact.incumbentSalary}M</span>
                      <span style={{ color: S.green }}>Prospect: ${selectedImpact.prospectMinSalary}M</span>
                    </div>
                    <div style={{ position: 'relative', height: 10, background: '#1f2937', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        position: 'absolute', left: 0, top: 0, height: '100%',
                        width: `${(selectedImpact.incumbentSalary / 20) * 100}%`,
                        background: `${S.red}66`, borderRadius: 5,
                      }} />
                      <div style={{
                        position: 'absolute', left: 0, top: 0, height: '100%',
                        width: `${(selectedImpact.prospectMinSalary / 20) * 100}%`,
                        background: S.green, borderRadius: 5,
                      }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div style={{
                marginTop: 12, padding: '8px 10px',
                background: '#0f172a', border: `1px solid ${S.border}`, borderRadius: 3,
                fontSize: 11, color: S.dim, lineHeight: 1.5, fontFamily: S.mono,
              }}>
                {selectedImpact.notes}
              </div>
            </div>
          )}

          {/* Roster Impact Table */}
          <div style={panelStyle({ padding: 14 })}>
            <div style={{ ...labelStyle, marginBottom: 10 }}>ALL ROSTER IMPACTS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: S.mono }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                  {['Prospect', 'Replaces', 'WAR +/-', 'Savings', 'Action'].map(h => (
                    <th key={h} style={{ ...labelStyle, padding: '4px 6px', textAlign: h === 'Prospect' || h === 'Replaces' ? 'left' : 'center', fontSize: 9 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rosterImpact.map((r, i) => (
                  <tr
                    key={i}
                    onClick={() => setSelectedId(r.prospectId)}
                    style={{
                      borderBottom: `1px solid ${S.border}22`,
                      cursor: 'pointer',
                      background: selectedId === r.prospectId ? '#1a1a2e' : 'transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <td style={{ padding: '6px', color: S.accent }}>{r.prospectName}</td>
                    <td style={{ padding: '6px', color: S.dim }}>{r.incumbentName}</td>
                    <td style={{ padding: '6px', textAlign: 'center', color: r.warUpgrade >= 0 ? S.green : S.red, fontWeight: 700 }}>
                      {r.warUpgrade >= 0 ? '+' : ''}{r.warUpgrade.toFixed(1)}
                    </td>
                    <td style={{ padding: '6px', textAlign: 'center', color: S.green }}>${r.annualSavings.toFixed(1)}M</td>
                    <td style={{ padding: '6px', textAlign: 'center' }}>
                      <RecBadge rec={r.recommendation} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Graduation Timeline */}
          <div style={panelStyle({ padding: 14 })}>
            <div style={{ ...labelStyle, marginBottom: 10 }}>GRADUATION TIMELINE</div>
            <div style={{ position: 'relative', paddingLeft: 18 }}>
              {data.graduationTimeline.map((entry, i) => (
                <div key={i} style={{ marginBottom: i < data.graduationTimeline.length - 1 ? 14 : 0, position: 'relative' }}>
                  {/* Timeline connector */}
                  <div style={{
                    position: 'absolute', left: -14, top: 4, width: 8, height: 8,
                    borderRadius: '50%', background: S.accent, border: `2px solid ${S.bg}`,
                  }} />
                  {i < data.graduationTimeline.length - 1 && (
                    <div style={{
                      position: 'absolute', left: -11, top: 14, width: 2, height: 'calc(100% + 4px)',
                      background: `${S.border}`,
                    }} />
                  )}
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.accent, marginBottom: 4 }}>
                    {entry.month}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {entry.prospects.map((name, j) => (
                      <span key={j} style={{
                        padding: '2px 8px', fontSize: 10,
                        background: '#1e293b', border: `1px solid ${S.border}`,
                        borderRadius: 3, color: S.dim, fontFamily: S.mono,
                      }}>
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Summary */}
          <div style={panelStyle({ padding: 14 })}>
            <div style={{ ...labelStyle, marginBottom: 10 }}>COST SAVINGS SUMMARY</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ ...labelStyle, fontSize: 9 }}>VETERAN SALARY (TOTAL)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: S.red, fontFamily: S.mono }}>
                  ${data.costSummary.totalVeteranSalary.toFixed(1)}M
                </div>
              </div>
              <div>
                <div style={{ ...labelStyle, fontSize: 9 }}>PROSPECT SALARY (TOTAL)</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: S.green, fontFamily: S.mono }}>
                  ${data.costSummary.totalProspectSalary.toFixed(1)}M
                </div>
              </div>
            </div>
            <div style={{
              padding: '8px 10px', background: '#0f172a',
              border: `1px solid ${S.green}33`, borderRadius: 3,
              fontSize: 11, color: S.dim, lineHeight: 1.5, fontFamily: S.mono,
            }}>
              {data.costSummary.reinvestmentCapacity}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
