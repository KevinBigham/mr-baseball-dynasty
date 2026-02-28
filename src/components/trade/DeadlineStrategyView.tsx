/**
 * DeadlineStrategyView — Trade Deadline Strategy Board (Wave 78)
 *
 * Bloomberg-terminal style strategic trade deadline dashboard.
 * Buy/sell/hold recommendations, target list, sell-high candidates,
 * trade chip inventory, urgency indicators, and risk assessment.
 */
import { useMemo, useState } from 'react';
import {
  generateDemoDeadlineStrategy,
  POSTURE_DISPLAY,
  URGENCY_DISPLAY,
  type DeadlineStrategyData,
  type TargetAcquisition,
  type SellHighCandidate,
} from '../../engine/trade/deadlineStrategyBoard';

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

const thStyle = (align: string = 'center'): React.CSSProperties => ({
  ...labelStyle,
  padding: '6px 8px',
  textAlign: align as any,
  fontSize: 9,
  borderBottom: `1px solid ${S.border}`,
});

const tdStyle = (align: string = 'center', color?: string): React.CSSProperties => ({
  padding: '8px 8px',
  textAlign: align as any,
  color: color ?? S.dim,
  fontFamily: S.mono,
  fontSize: 11,
  borderBottom: `1px solid ${S.border}22`,
});

// ─── Sub-components ──────────────────────────────────────────────────────────

function PostureBanner({ posture }: { posture: DeadlineStrategyData['recommendation'] }) {
  const info = POSTURE_DISPLAY[posture];
  return (
    <div style={{
      ...panelStyle({
        padding: '14px 20px',
        borderColor: info.color,
        borderWidth: 2,
        background: `${info.color}0a`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }),
    }}>
      <div>
        <div style={{ ...labelStyle, marginBottom: 4 }}>STRATEGY RECOMMENDATION</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: info.color, fontFamily: S.mono }}>
          {info.label.toUpperCase()}
        </div>
      </div>
      <div style={{ maxWidth: 400, textAlign: 'right', fontSize: 12, color: S.dim, fontFamily: S.mono, lineHeight: 1.5 }}>
        {info.desc}
      </div>
    </div>
  );
}

function UrgencyDot({ level }: { level: TargetAcquisition['urgency'] }) {
  const info = URGENCY_DISPLAY[level];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 6px', fontSize: 9, fontWeight: 700,
      background: info.color + '22', color: info.color,
      borderRadius: 3, fontFamily: S.mono,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: info.color,
        animation: level === 'CRITICAL' ? 'pulse 1.2s ease-in-out infinite' : undefined,
      }} />
      {info.label.toUpperCase()}
    </span>
  );
}

function DemandBadge({ demand }: { demand: SellHighCandidate['marketDemand'] }) {
  const colors: Record<string, string> = { HOT: S.red, WARM: S.orange, TEPID: S.muted };
  const c = colors[demand] ?? S.muted;
  return (
    <span style={{
      padding: '2px 6px', fontSize: 9, fontWeight: 700,
      background: c + '22', color: c, borderRadius: 3, fontFamily: S.mono,
    }}>
      {demand}
    </span>
  );
}

function ChipTypeBadge({ type }: { type: 'PROSPECT' | 'MLB_PLAYER' | 'DRAFT_PICK' }) {
  const colors: Record<string, string> = { PROSPECT: S.blue, MLB_PLAYER: S.green, DRAFT_PICK: S.accent };
  const c = colors[type] ?? S.muted;
  return (
    <span style={{
      padding: '1px 6px', fontSize: 9, fontWeight: 700,
      background: c + '22', color: c, borderRadius: 3, fontFamily: S.mono,
    }}>
      {type.replace('_', ' ')}
    </span>
  );
}

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

function FitBar({ score }: { score: number }) {
  const color = score >= 85 ? S.green : score >= 70 ? S.accent : score >= 55 ? S.blue : S.muted;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ flex: 1, height: 5, background: '#1f2937', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: S.mono, minWidth: 24 }}>{score}</span>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function DeadlineStrategyView() {
  const data: DeadlineStrategyData = useMemo(() => generateDemoDeadlineStrategy(), []);
  const [tab, setTab] = useState<'targets' | 'sell' | 'chips'>('targets');

  const snap = data.snapshot;
  const deadlineUrgent = data.daysUntilDeadline <= 7;

  return (
    <div style={{ padding: 18, color: S.text, fontFamily: S.mono, fontSize: 13, background: S.bg, minHeight: '100vh' }}>
      {/* ── Header ── */}
      <div style={headerStyle}>
        TRADE DEADLINE STRATEGY BOARD
        <span style={{ float: 'right', fontSize: 10, color: S.muted, fontWeight: 400 }}>
          {data.teamAbbr} | {data.deadlineDate} DEADLINE
        </span>
      </div>

      {/* ── Countdown + Snapshot ── */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={panelStyle({
          padding: '12px 20px', textAlign: 'center', minWidth: 120,
          borderColor: deadlineUrgent ? S.red : S.border,
        })}>
          <div style={labelStyle}>DEADLINE</div>
          <div style={{
            fontSize: 32, fontWeight: 800, fontFamily: S.mono,
            color: deadlineUrgent ? S.red : S.accent,
          }}>
            {data.daysUntilDeadline}
          </div>
          <div style={{ fontSize: 10, color: deadlineUrgent ? S.red : S.muted }}>
            {deadlineUrgent ? 'DAYS — ACT NOW' : 'days remaining'}
          </div>
        </div>
        <StatBox label="RECORD" value={snap.record} sub={`${snap.winPct.toFixed(3)} WIN%`} />
        <StatBox label="DIV RANK" value={`#${snap.divisionRank}`} sub={`${snap.gamesBack} GB`} />
        <StatBox label="PLAYOFF ODDS" value={`${snap.playoffOdds}%`}
          color={snap.playoffOdds >= 70 ? S.green : snap.playoffOdds >= 50 ? S.accent : S.red}
          sub={`${snap.remainingGames} games left`} />
        <StatBox label="RUN DIFF" value={snap.runDifferential > 0 ? `+${snap.runDifferential}` : `${snap.runDifferential}`}
          color={snap.runDifferential > 0 ? S.green : S.red} sub="Run differential" />
      </div>

      {/* ── Posture Banner ── */}
      <PostureBanner posture={data.recommendation} />

      {/* ── Window Analysis ── */}
      <div style={{ ...panelStyle({ padding: 14, marginTop: 16, marginBottom: 16 }) }}>
        <div style={{ ...labelStyle, marginBottom: 10 }}>COMPETITIVE WINDOW ANALYSIS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <div style={{ ...labelStyle, fontSize: 9 }}>WINDOW YEARS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: S.accent, fontFamily: S.mono }}>
              {data.window.yearsRemaining} yrs
            </div>
          </div>
          <div>
            <div style={{ ...labelStyle, fontSize: 9 }}>CORE UNDER CONTROL</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: S.blue, fontFamily: S.mono }}>
              {data.window.corePlayersUnderControl}
            </div>
          </div>
          <div>
            <div style={{ ...labelStyle, fontSize: 9 }}>FARM RANK</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: S.dim, fontFamily: S.mono }}>
              #{data.window.farmSystemRank}
            </div>
          </div>
          <div>
            <div style={{ ...labelStyle, fontSize: 9 }}>PAYROLL FLEX</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: S.green, fontFamily: S.mono, marginTop: 4 }}>
              {data.window.payrollFlexibility}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ ...labelStyle, fontSize: 9, marginRight: 4, paddingTop: 3 }}>PENDING FAs:</span>
          {data.window.keyFreeAgents.map((fa, i) => (
            <span key={i} style={{
              padding: '2px 8px', fontSize: 10, background: '#1e293b',
              border: `1px solid ${S.border}`, borderRadius: 3, color: S.dim, fontFamily: S.mono,
            }}>
              {fa}
            </span>
          ))}
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
        {([
          { key: 'targets' as const, label: `TARGETS (${data.targets.length})` },
          { key: 'sell' as const, label: `SELL-HIGH (${data.sellCandidates.length})` },
          { key: 'chips' as const, label: `TRADE CHIPS (${data.tradeChips.length})` },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '8px 18px', fontSize: 11, fontWeight: 700,
              fontFamily: S.mono, cursor: 'pointer',
              background: tab === t.key ? S.accent + '22' : S.panel,
              color: tab === t.key ? S.accent : S.muted,
              border: `1px solid ${tab === t.key ? S.accent : S.border}`,
              borderRadius: 3,
              letterSpacing: 0.6,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Targets Table ── */}
      {tab === 'targets' && (
        <div style={panelStyle({ padding: 14 })}>
          <div style={{ ...labelStyle, marginBottom: 10 }}>TARGET ACQUISITION LIST</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: S.mono }}>
            <thead>
              <tr>
                {['Player', 'Pos', 'Team', 'OVR', 'Salary', 'Ctrl', 'Fit', 'WAR+', 'Urgency', 'Est. Cost'].map((h, i) => (
                  <th key={h} style={thStyle(i === 0 || i === 9 ? 'left' : 'center')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.targets.map(t => (
                <tr key={t.id} style={{ transition: 'background 0.1s' }}>
                  <td style={tdStyle('left', S.accent)}>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    <div style={{ fontSize: 9, color: S.muted }}>{t.need}</div>
                  </td>
                  <td style={tdStyle()}>{t.position}</td>
                  <td style={tdStyle()}>{t.team}</td>
                  <td style={tdStyle('center', t.overall >= 80 ? S.green : S.dim)}>
                    <span style={{ fontWeight: 700 }}>{t.overall}</span>
                  </td>
                  <td style={tdStyle()}>${t.salary}M</td>
                  <td style={tdStyle('center', t.isRental ? S.orange : S.green)}>
                    {t.isRental ? 'RENTAL' : `${t.yearsLeft}yr`}
                  </td>
                  <td style={{ ...tdStyle(), minWidth: 80 }}>
                    <FitBar score={t.fitScore} />
                  </td>
                  <td style={tdStyle('center', S.green)}>
                    <span style={{ fontWeight: 700 }}>+{t.impactProjection.toFixed(1)}</span>
                  </td>
                  <td style={tdStyle()}>
                    <UrgencyDot level={t.urgency} />
                  </td>
                  <td style={tdStyle('left', S.dim)}>
                    <div style={{ fontSize: 10, maxWidth: 180 }}>{t.estimatedCost}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Notes for top target */}
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: '#0f172a', border: `1px solid ${S.border}`, borderRadius: 3,
            fontSize: 11, color: S.dim, lineHeight: 1.5, fontFamily: S.mono,
          }}>
            <span style={{ color: S.accent, fontWeight: 700 }}>TOP TARGET NOTE: </span>
            {data.targets[0]?.notes}
          </div>
        </div>
      )}

      {/* ── Sell-High Candidates ── */}
      {tab === 'sell' && (
        <div style={panelStyle({ padding: 14 })}>
          <div style={{ ...labelStyle, marginBottom: 10 }}>SELL-HIGH CANDIDATES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.sellCandidates.map(c => (
              <div key={c.id} style={panelStyle({ padding: 14, background: '#0f172a' })}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: S.accent, fontFamily: S.mono }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: 11, color: S.muted, fontFamily: S.mono }}>
                      {c.position} | Age {c.age} | {c.overall} OVR | ${c.salary}M | {c.yearsLeft > 0 ? `${c.yearsLeft}yr ctrl` : 'Expiring'}
                    </div>
                  </div>
                  <DemandBadge demand={c.marketDemand} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ ...labelStyle, fontSize: 9 }}>CURRENT WAR</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: S.blue, fontFamily: S.mono }}>{c.currentWAR.toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={{ ...labelStyle, fontSize: 9 }}>PROJ. DECLINE</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: S.red, fontFamily: S.mono }}>-{c.projectedDecline.toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={{ ...labelStyle, fontSize: 9 }}>TRADE VALUE</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: S.green, fontFamily: S.mono, marginTop: 4 }}>{c.tradeValue}</div>
                  </div>
                </div>

                <div style={{
                  padding: '6px 10px', background: '#111827', border: `1px solid ${S.border}`,
                  borderRadius: 3, fontSize: 11, color: S.dim, fontFamily: S.mono, marginBottom: 8,
                }}>
                  <span style={{ color: S.orange, fontWeight: 700 }}>SELL RATIONALE: </span>
                  {c.sellReason}
                </div>

                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ ...labelStyle, fontSize: 9, marginRight: 4 }}>BUYER FIT:</span>
                  {c.buyerFit.map((team, i) => (
                    <span key={i} style={{
                      padding: '1px 6px', fontSize: 10, background: '#1e293b',
                      border: `1px solid ${S.border}`, borderRadius: 3, color: S.dim, fontFamily: S.mono,
                    }}>
                      {team}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Trade Chips ── */}
      {tab === 'chips' && (
        <div style={panelStyle({ padding: 14 })}>
          <div style={{ ...labelStyle, marginBottom: 10 }}>TRADE CHIP INVENTORY</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: S.mono }}>
            <thead>
              <tr>
                {['Asset', 'Pos', 'Type', 'Value', 'Notes'].map((h, i) => (
                  <th key={h} style={thStyle(i === 0 || i === 4 ? 'left' : 'center')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.tradeChips.map((chip, i) => {
                const valColor = chip.value === 'HIGH' ? S.green : chip.value === 'MEDIUM' ? S.accent : S.muted;
                return (
                  <tr key={i}>
                    <td style={tdStyle('left', S.text)}>
                      <span style={{ fontWeight: 600 }}>{chip.name}</span>
                    </td>
                    <td style={tdStyle()}>{chip.position}</td>
                    <td style={tdStyle()}>
                      <ChipTypeBadge type={chip.type} />
                    </td>
                    <td style={tdStyle('center', valColor)}>
                      <span style={{ fontWeight: 700 }}>{chip.value}</span>
                    </td>
                    <td style={tdStyle('left', S.dim)}>{chip.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Key Factors + Risk ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Key Factors */}
        <div style={panelStyle({ padding: 14 })}>
          <div style={{ ...labelStyle, marginBottom: 10 }}>KEY FACTORS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.keyFactors.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{
                  minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: S.accent + '22', color: S.accent, fontSize: 10, fontWeight: 700, borderRadius: 3,
                  fontFamily: S.mono,
                }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 11, color: S.dim, lineHeight: 1.5, fontFamily: S.mono }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Assessment */}
        <div style={panelStyle({ padding: 14, borderColor: S.orange + '44' })}>
          <div style={{ ...labelStyle, marginBottom: 10, color: S.orange }}>RISK ASSESSMENT</div>
          <div style={{
            fontSize: 12, color: S.dim, lineHeight: 1.7, fontFamily: S.mono,
          }}>
            {data.riskAssessment}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ ...labelStyle, fontSize: 9, marginBottom: 6 }}>SCHEDULE OUTLOOK</div>
            <div style={{ fontSize: 11, color: S.dim, fontFamily: S.mono }}>
              {data.snapshot.strengthOfSchedule}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
