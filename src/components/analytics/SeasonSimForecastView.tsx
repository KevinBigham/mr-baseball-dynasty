/**
 * SeasonSimForecastView — Monte Carlo Season Projection Dashboard (Wave 78)
 *
 * Bloomberg-terminal style view showing Monte Carlo season simulations.
 * Win distribution bell curve, playoff probability breakdown, scenario
 * analysis, swing factors, and division race tracking.
 */
import { useMemo, useState } from 'react';
import {
  generateDemoSeasonForecast,
  CATEGORY_COLORS,
  type SeasonForecastData,
  type WinDistributionBucket,
  type SeasonScenario,
  type SwingFactor,
} from '../../engine/analytics/seasonSimForecast';

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
  purple:  '#8b5cf6',
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

function StatBox({ label, value, color, sub }: { label: string; value: string | number; color?: string; sub?: string }) {
  return (
    <div style={panelStyle({ padding: '10px 14px', textAlign: 'center', minWidth: 100 })}>
      <div style={labelStyle}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? S.accent, fontFamily: S.mono, marginTop: 2 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: S.muted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function WinDistributionChart({ buckets, median }: { buckets: WinDistributionBucket[]; median: number }) {
  const maxFreq = Math.max(...buckets.map(b => b.frequency));
  const barMaxHeight = 120;

  // Only show buckets with frequency > 0
  const visible = buckets.filter(b => b.frequency > 0);

  return (
    <div style={panelStyle({ padding: 14 })}>
      <div style={{ ...labelStyle, marginBottom: 12 }}>WIN DISTRIBUTION (10,000 SIMULATIONS)</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: barMaxHeight + 30, overflow: 'hidden' }}>
        {visible.map(b => {
          const height = maxFreq > 0 ? (b.frequency / maxFreq) * barMaxHeight : 0;
          const isMedian = b.wins === median;
          const isPlayoff = b.wins >= 88; // rough playoff threshold
          let barColor: string;
          if (isMedian) barColor = S.accent;
          else if (b.wins >= 95) barColor = S.green;
          else if (isPlayoff) barColor = S.blue;
          else if (b.wins >= 80) barColor = S.orange;
          else barColor = S.red;

          return (
            <div key={b.wins} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 8, color: isMedian ? S.accent : 'transparent',
                fontFamily: S.mono, fontWeight: 700, marginBottom: 2,
              }}>
                {b.frequency}%
              </div>
              <div
                style={{
                  width: '100%',
                  maxWidth: 16,
                  height,
                  background: barColor,
                  borderRadius: '2px 2px 0 0',
                  opacity: isMedian ? 1 : 0.7,
                  transition: 'height 0.3s',
                  border: isMedian ? `1px solid ${S.accent}` : 'none',
                }}
                title={`${b.wins} wins: ${b.frequency}% of sims`}
              />
              {(b.wins % 5 === 0 || isMedian) && (
                <div style={{
                  fontSize: 8, color: isMedian ? S.accent : S.muted,
                  fontFamily: S.mono, marginTop: 4,
                  fontWeight: isMedian ? 700 : 400,
                }}>
                  {b.wins}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 10, fontFamily: S.mono }}>
        <span style={{ color: S.red }}>Worst outcomes</span>
        <span style={{ color: S.accent, fontWeight: 700 }}>Median: {median}W</span>
        <span style={{ color: S.green }}>Best outcomes</span>
      </div>
    </div>
  );
}

function ProbabilityGauge({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: S.dim, fontFamily: S.mono }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: S.mono }}>{pct.toFixed(1)}%</span>
      </div>
      <div style={{ height: 8, background: '#1f2937', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${Math.min(100, pct)}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          borderRadius: 4, transition: 'width 0.4s',
        }} />
      </div>
    </div>
  );
}

function ScenarioCard({ scenario, isSelected, onClick }: {
  scenario: SeasonScenario;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        ...panelStyle({
          padding: 12,
          cursor: 'pointer',
          borderColor: isSelected ? scenario.color : S.border,
          background: isSelected ? `${scenario.color}0a` : S.panel,
          transition: 'all 0.15s',
        }),
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: scenario.color,
          }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: scenario.color, fontFamily: S.mono }}>
            {scenario.label}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: S.muted, fontFamily: S.mono }}>
          {scenario.probability}% chance
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: scenario.color, fontFamily: S.mono, marginBottom: 4 }}>
        {scenario.wins}-{scenario.losses}
      </div>
      <div style={{ fontSize: 11, color: S.dim, fontFamily: S.mono, marginBottom: 6 }}>
        {scenario.description}
      </div>
      <div style={{
        fontSize: 10, color: scenario.color, fontFamily: S.mono,
        padding: '3px 8px', background: `${scenario.color}15`, borderRadius: 3,
        display: 'inline-block',
      }}>
        {scenario.outcome}
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: SwingFactor['category'] }) {
  const c = CATEGORY_COLORS[category];
  return (
    <span style={{
      padding: '1px 6px', fontSize: 9, fontWeight: 700,
      background: c + '22', color: c, borderRadius: 3, fontFamily: S.mono,
    }}>
      {category}
    </span>
  );
}

function TrendArrow({ trend }: { trend: 'UP' | 'DOWN' | 'STABLE' }) {
  const config: Record<string, { symbol: string; color: string }> = {
    UP:     { symbol: '>>',  color: S.green },
    DOWN:   { symbol: 'vv',  color: S.red },
    STABLE: { symbol: '--',  color: S.muted },
  };
  const t = config[trend];
  return <span style={{ color: t.color, fontWeight: 700, fontFamily: S.mono, fontSize: 11 }}>{t.symbol}</span>;
}

function LikelihoodBar({ pct }: { pct: number }) {
  const color = pct >= 65 ? S.green : pct >= 50 ? S.accent : pct >= 35 ? S.orange : S.red;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: S.mono, minWidth: 30, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SeasonSimForecastView() {
  const data: SeasonForecastData = useMemo(() => generateDemoSeasonForecast(), []);
  const [selectedScenario, setSelectedScenario] = useState<string>(data.scenarios[2]?.id ?? 'likely');

  const proj = data.projections;
  const prob = data.probabilities;
  const activeScenario = data.scenarios.find(s => s.id === selectedScenario);

  return (
    <div style={{ padding: 18, color: S.text, fontFamily: S.mono, fontSize: 13, background: S.bg, minHeight: '100vh' }}>
      {/* ── Header ── */}
      <div style={headerStyle}>
        SEASON SIMULATION FORECAST
        <span style={{ float: 'right', fontSize: 10, color: S.muted, fontWeight: 400 }}>
          {data.teamAbbr} | {data.season} | {proj.simCount.toLocaleString()} SIMULATIONS
        </span>
      </div>

      {/* ── Projection Summary Cards ── */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatBox label="CURRENT" value={data.currentRecord} sub={`${data.gamesPlayed} GP`} />
        <StatBox label="PROJ. WINS" value={proj.medianWins} color={S.accent} sub={`Mean: ${proj.meanWins}`} />
        <StatBox label="10TH PCTL" value={proj.p10Wins} color={S.red} sub="Floor scenario" />
        <StatBox label="90TH PCTL" value={proj.p90Wins} color={S.green} sub="Ceiling scenario" />
        <StatBox label="PLAYOFF" value={`${prob.anyPlayoff}%`}
          color={prob.anyPlayoff >= 70 ? S.green : prob.anyPlayoff >= 50 ? S.accent : S.red}
          sub="Combined odds" />
        <StatBox label="WORLD SERIES" value={`${prob.worldSeries}%`}
          color={S.blue} sub="Championship odds" />
      </div>

      {/* ── Distribution Chart ── */}
      <WinDistributionChart buckets={data.distribution} median={proj.medianWins} />

      {/* ── Percentile Range Indicator ── */}
      <div style={{ ...panelStyle({ padding: 14, marginTop: 16 }) }}>
        <div style={{ ...labelStyle, marginBottom: 10 }}>WIN TOTAL RANGE</div>
        <div style={{ position: 'relative', height: 40, margin: '0 20px' }}>
          {/* Background bar */}
          <div style={{
            position: 'absolute', top: 14, left: 0, right: 0, height: 12,
            background: '#1f2937', borderRadius: 6,
          }} />
          {/* 10th-90th percentile range */}
          {(() => {
            const range = proj.ceilingWins - proj.floorWins;
            const leftPct = ((proj.p10Wins - proj.floorWins) / range) * 100;
            const widthPct = ((proj.p90Wins - proj.p10Wins) / range) * 100;
            return (
              <div style={{
                position: 'absolute', top: 14, left: `${leftPct}%`, width: `${widthPct}%`,
                height: 12, background: `${S.blue}44`, borderRadius: 6,
              }} />
            );
          })()}
          {/* 25th-75th percentile range */}
          {(() => {
            const range = proj.ceilingWins - proj.floorWins;
            const leftPct = ((proj.p25Wins - proj.floorWins) / range) * 100;
            const widthPct = ((proj.p75Wins - proj.p25Wins) / range) * 100;
            return (
              <div style={{
                position: 'absolute', top: 14, left: `${leftPct}%`, width: `${widthPct}%`,
                height: 12, background: `${S.accent}66`, borderRadius: 6,
              }} />
            );
          })()}
          {/* Median marker */}
          {(() => {
            const range = proj.ceilingWins - proj.floorWins;
            const leftPct = ((proj.medianWins - proj.floorWins) / range) * 100;
            return (
              <div style={{
                position: 'absolute', top: 10, left: `${leftPct}%`, width: 3, height: 20,
                background: S.accent, borderRadius: 2, transform: 'translateX(-1px)',
              }} />
            );
          })()}
          {/* Labels */}
          {[
            { val: proj.floorWins, label: 'FLOOR', pct: 0, color: S.red },
            { val: proj.p10Wins, label: 'P10', pct: ((proj.p10Wins - proj.floorWins) / (proj.ceilingWins - proj.floorWins)) * 100, color: S.orange },
            { val: proj.medianWins, label: 'MEDIAN', pct: ((proj.medianWins - proj.floorWins) / (proj.ceilingWins - proj.floorWins)) * 100, color: S.accent },
            { val: proj.p90Wins, label: 'P90', pct: ((proj.p90Wins - proj.floorWins) / (proj.ceilingWins - proj.floorWins)) * 100, color: S.green },
            { val: proj.ceilingWins, label: 'CEIL', pct: 100, color: S.green },
          ].map(m => (
            <div key={m.label} style={{
              position: 'absolute', top: 30, left: `${m.pct}%`, transform: 'translateX(-50%)',
              textAlign: 'center', fontSize: 8, fontFamily: S.mono,
            }}>
              <div style={{ color: m.color, fontWeight: 700 }}>{m.val}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, fontSize: 9, fontFamily: S.mono }}>
          <span style={{ color: S.blue }}>Blue: 10th-90th pctl</span>
          <span style={{ color: S.accent }}>Gold: 25th-75th pctl</span>
          <span style={{ color: S.accent }}>Line: Median</span>
        </div>
      </div>

      {/* ── Two-column: Probabilities + Scenarios ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Left: Probability Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={panelStyle({ padding: 14 })}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>POSTSEASON PROBABILITIES</div>
            <ProbabilityGauge label="Make Playoffs" pct={prob.anyPlayoff} color={S.blue} />
            <ProbabilityGauge label="Win Division" pct={prob.division} color={S.accent} />
            <ProbabilityGauge label="Wild Card" pct={prob.wildCard} color={S.green} />
            <ProbabilityGauge label="Win Pennant" pct={prob.pennant} color={S.purple} />
            <ProbabilityGauge label="Win World Series" pct={prob.worldSeries} color={S.accent} />
          </div>

          <div style={panelStyle({ padding: 14 })}>
            <div style={{ ...labelStyle, marginBottom: 12 }}>WIN TOTAL THRESHOLDS</div>
            <ProbabilityGauge label="100+ Wins" pct={prob.hundredPlus} color={S.green} />
            <ProbabilityGauge label="90+ Wins" pct={prob.ninetyPlus} color={S.blue} />
            <ProbabilityGauge label="Sub-80 Wins" pct={prob.subEighty} color={S.red} />
          </div>

          {/* Division Race */}
          <div style={panelStyle({ padding: 14 })}>
            <div style={{ ...labelStyle, marginBottom: 10 }}>DIVISION RACE</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: S.mono }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                  {['Team', 'Proj W', 'Playoff %'].map(h => (
                    <th key={h} style={{ ...labelStyle, padding: '4px 8px', textAlign: h === 'Team' ? 'left' : 'center', fontSize: 9 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.divisionRivals.map((r, i) => {
                  const isUs = r.team === data.teamAbbr;
                  return (
                    <tr key={i} style={{
                      borderBottom: `1px solid ${S.border}22`,
                      background: isUs ? `${S.accent}0a` : 'transparent',
                    }}>
                      <td style={{
                        padding: '6px 8px', fontFamily: S.mono, fontSize: 12,
                        color: isUs ? S.accent : S.dim, fontWeight: isUs ? 700 : 400,
                      }}>
                        {r.team} {isUs ? '(YOU)' : ''}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: S.text, fontWeight: 700, fontFamily: S.mono, fontSize: 12 }}>
                        {r.projWins}
                      </td>
                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                        <span style={{
                          color: r.playoffPct >= 70 ? S.green : r.playoffPct >= 40 ? S.accent : r.playoffPct >= 15 ? S.orange : S.red,
                          fontWeight: 700, fontFamily: S.mono, fontSize: 12,
                        }}>
                          {r.playoffPct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...labelStyle, marginBottom: 0 }}>SEASON SCENARIOS</div>
          {data.scenarios.map(s => (
            <ScenarioCard
              key={s.id}
              scenario={s}
              isSelected={selectedScenario === s.id}
              onClick={() => setSelectedScenario(s.id)}
            />
          ))}

          {/* Selected scenario assumptions */}
          {activeScenario && (
            <div style={{
              ...panelStyle({
                padding: 14,
                borderColor: activeScenario.color + '66',
                background: `${activeScenario.color}08`,
              }),
            }}>
              <div style={{ ...labelStyle, marginBottom: 8, color: activeScenario.color }}>
                {activeScenario.label.toUpperCase()} ASSUMPTIONS
              </div>
              {activeScenario.keyAssumptions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 6 }}>
                  <span style={{
                    minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${activeScenario.color}22`, color: activeScenario.color,
                    fontSize: 9, fontWeight: 700, borderRadius: 3, fontFamily: S.mono,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 11, color: S.dim, lineHeight: 1.5, fontFamily: S.mono }}>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Swing Factors ── */}
      <div style={{ ...panelStyle({ padding: 14, marginTop: 16 }) }}>
        <div style={{ ...labelStyle, marginBottom: 12 }}>KEY SWING FACTORS</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: S.mono }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}` }}>
              {['Factor', 'Category', 'WAR Swing', 'Upside', 'Downside', 'Upside Likelihood'].map((h, i) => (
                <th key={h} style={{
                  ...labelStyle, padding: '6px 8px',
                  textAlign: i === 0 || i === 3 || i === 4 ? 'left' : 'center',
                  fontSize: 9,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.swingFactors.map(f => (
              <tr key={f.id} style={{ borderBottom: `1px solid ${S.border}22` }}>
                <td style={{ padding: '8px 8px', color: S.text, fontWeight: 600, fontSize: 11 }}>
                  {f.factor}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                  <CategoryBadge category={f.category} />
                </td>
                <td style={{
                  padding: '8px 8px', textAlign: 'center', fontWeight: 700,
                  color: f.warSwing >= 3 ? S.accent : S.dim, fontSize: 12,
                }}>
                  {f.warSwing > 0 ? `+/-${f.warSwing.toFixed(1)}` : 'N/A'}
                </td>
                <td style={{ padding: '8px 8px', color: S.green, fontSize: 10, maxWidth: 160 }}>
                  {f.upside}
                </td>
                <td style={{ padding: '8px 8px', color: S.red, fontSize: 10, maxWidth: 160 }}>
                  {f.downside}
                </td>
                <td style={{ padding: '8px 8px', minWidth: 100 }}>
                  <LikelihoodBar pct={f.likelihood} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Team Strengths / Weaknesses ── */}
      <div style={{ ...panelStyle({ padding: 14, marginTop: 16 }) }}>
        <div style={{ ...labelStyle, marginBottom: 12 }}>TEAM PROFILE (STRENGTHS & WEAKNESSES)</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: S.mono }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}` }}>
              {['Area', 'Rating', 'League Rank', 'Trend', 'Impact'].map((h, i) => (
                <th key={h} style={{ ...labelStyle, padding: '6px 8px', textAlign: i === 4 ? 'left' : 'center', fontSize: 9 }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.strengths.map((s, i) => {
              const ratingColor = s.rating >= 80 ? S.green : s.rating >= 65 ? S.accent : s.rating >= 50 ? S.orange : S.red;
              const rankColor = s.leagueRank <= 5 ? S.green : s.leagueRank <= 15 ? S.accent : s.leagueRank <= 22 ? S.orange : S.red;
              return (
                <tr key={i} style={{ borderBottom: `1px solid ${S.border}22` }}>
                  <td style={{ padding: '8px 8px', textAlign: 'center', color: S.text, fontWeight: 600, fontSize: 12 }}>
                    {s.area}
                  </td>
                  <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <div style={{ width: 50, height: 6, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${s.rating}%`, background: ratingColor, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: ratingColor, fontFamily: S.mono }}>{s.rating}</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 8px', textAlign: 'center', color: rankColor, fontWeight: 700, fontSize: 12 }}>
                    #{s.leagueRank}
                  </td>
                  <td style={{ padding: '8px 8px', textAlign: 'center' }}>
                    <TrendArrow trend={s.trend} />
                  </td>
                  <td style={{ padding: '8px 8px', color: S.dim, fontSize: 10, maxWidth: 250 }}>
                    {s.impact}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Simulation Disclaimer ── */}
      <div style={{
        marginTop: 16, padding: '8px 14px',
        background: '#0f172a', border: `1px solid ${S.border}`, borderRadius: 3,
        fontSize: 10, color: S.muted, fontFamily: S.mono, textAlign: 'center',
      }}>
        Based on {proj.simCount.toLocaleString()} Monte Carlo simulations | StdDev: {proj.standardDev.toFixed(1)} wins | Updated through game {data.gamesPlayed}
      </div>
    </div>
  );
}
