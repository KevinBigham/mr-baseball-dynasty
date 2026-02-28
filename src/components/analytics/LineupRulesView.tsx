/**
 * LineupRulesView – Lineup Construction Rules Dashboard
 *
 * Bloomberg-terminal style analysis of lineup construction
 * against sabermetric principles, with swap recommendations
 * and theory comparisons.
 */
import { useState, useMemo } from 'react';
import {
  generateDemoLineupRules,
  gradeColor,
  type LineupRulesData,
  type LineupAssignment,
  type SwapRecommendation,
  type TheoryComparison,
} from '../../engine/analytics/lineupConstructionRules';

const PANEL: React.CSSProperties = {
  background: '#111827',
  border: '1px solid #374151',
  borderRadius: 4,
  padding: 14,
};

const HEADER: React.CSSProperties = {
  background: '#030712',
  borderBottom: '1px solid #374151',
  padding: '8px 20px',
  fontFamily: 'monospace',
  fontSize: 13,
  fontWeight: 700,
  color: '#f59e0b',
  letterSpacing: 1.5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ ...PANEL, textAlign: 'center', minWidth: 100, flex: '1 1 0' }}>
      <div style={{ color: '#6b7280', fontSize: 10, fontFamily: 'monospace', marginBottom: 4 }}>{label}</div>
      <div style={{ color: color ?? '#f59e0b', fontSize: 22, fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function SlotRow({ assignment, isOptimal, onClick, isSelected }: {
  assignment: LineupAssignment;
  isOptimal: boolean;
  onClick: () => void;
  isSelected: boolean;
}) {
  const gc = gradeColor(assignment.fitGrade);
  const p = assignment.player;
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid #1f2937',
        cursor: 'pointer',
        background: isSelected ? '#1e293b' : 'transparent',
        fontFamily: 'monospace',
        fontSize: 12,
        transition: 'background 0.15s',
      }}
    >
      <td style={{ padding: '6px 10px', fontWeight: 700, color: '#f59e0b', width: 30, textAlign: 'center' }}>
        {assignment.slot}
      </td>
      <td style={{ padding: '6px 8px' }}>
        <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{p.name}</span>
        <span style={{ color: '#6b7280', marginLeft: 8, fontSize: 10 }}>{p.pos} ({p.hand})</span>
      </td>
      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#d1d5db' }}>{p.obp.toFixed(3)}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#d1d5db' }}>{p.slg.toFixed(3)}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#d1d5db' }}>{p.wOBA.toFixed(3)}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#d1d5db' }}>{p.iso.toFixed(3)}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#d1d5db' }}>{p.wRCPlus}</td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center',
        }}>
          <div style={{ width: 50, height: 6, background: '#030712', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${assignment.fitScore}%`,
              height: '100%',
              background: gc,
              borderRadius: 3,
            }} />
          </div>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>{assignment.fitScore}</span>
        </div>
      </td>
      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
        <span style={{
          color: gc,
          fontWeight: 700,
          fontSize: 12,
          padding: '2px 6px',
          background: gc + '18',
          borderRadius: 3,
        }}>
          {assignment.fitGrade}
        </span>
      </td>
    </tr>
  );
}

function SwapCard({ swap }: { swap: SwapRecommendation }) {
  const priorityColor = swap.priority === 'high' ? '#ef4444' : swap.priority === 'medium' ? '#f59e0b' : '#3b82f6';
  return (
    <div style={{ ...PANEL, marginBottom: 8, padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#e5e7eb' }}>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>#{swap.fromSlot}</span>
          <span style={{ color: '#6b7280', margin: '0 6px' }}>{swap.playerA}</span>
          <span style={{ color: '#9ca3af' }}>&harr;</span>
          <span style={{ color: '#6b7280', margin: '0 6px' }}>{swap.playerB}</span>
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>#{swap.toSlot}</span>
        </div>
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'monospace',
          color: priorityColor,
          padding: '2px 8px',
          border: `1px solid ${priorityColor}`,
          borderRadius: 3,
          textTransform: 'uppercase',
        }}>
          {swap.priority}
        </span>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
        {swap.reason}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
        +{swap.expectedGain.toFixed(1)} runs/season
      </div>
    </div>
  );
}

function TheoryPanel({ theory }: { theory: TheoryComparison }) {
  const scoreColor = theory.score >= 75 ? '#22c55e' : theory.score >= 55 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ ...PANEL, flex: '1 1 220px', minWidth: 220 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>
          {theory.theoryName}
        </div>
        <div style={{
          fontFamily: 'monospace',
          fontSize: 18,
          fontWeight: 700,
          color: scoreColor,
        }}>
          {theory.score}
        </div>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af', marginBottom: 8, lineHeight: 1.4 }}>
        {theory.description}
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6b7280', marginBottom: 6 }}>
        Proponent: {theory.proponent}
      </div>
      <div style={{ borderTop: '1px solid #374151', paddingTop: 6 }}>
        {theory.keyDifferences.map((diff, i) => (
          <div key={i} style={{ fontFamily: 'monospace', fontSize: 10, color: '#d1d5db', marginBottom: 3, paddingLeft: 8, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 0, color: '#f59e0b' }}>-</span>
            {diff}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LineupRulesView() {
  const data = useMemo<LineupRulesData>(() => generateDemoLineupRules(), []);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [tab, setTab] = useState<'current' | 'optimal'>('current');

  const lineup = tab === 'current' ? data.currentLineup : data.optimalLineup;
  const selected = selectedSlot !== null ? lineup.find(a => a.slot === selectedSlot) ?? null : null;

  return (
    <div style={{ padding: 18, fontFamily: 'monospace', color: '#e5e7eb', background: '#030712', minHeight: '100vh' }}>
      {/* Header */}
      <div style={HEADER}>
        <span>LINEUP CONSTRUCTION RULES</span>
        <span style={{ color: '#6b7280', fontSize: 10, fontWeight: 400 }}>SABERMETRIC LINEUP ANALYSIS</span>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <StatBox label="LINEUP SCORE" value={data.score} color={gradeColor(data.grade)} />
        <StatBox label="GRADE" value={data.grade} color={gradeColor(data.grade)} />
        <StatBox label="RUNS VS OPTIMAL" value={`-${data.runsVsOptimal}`} color="#ef4444" />
        <StatBox label="L / R / S" value={`${data.lrBalance.left}/${data.lrBalance.right}/${data.lrBalance.switch}`} color="#3b82f6" />
        <StatBox
          label="MAX CONSEC SAME HAND"
          value={data.consecutiveSameHand}
          color={data.consecutiveSameHand <= 2 ? '#22c55e' : '#ef4444'}
        />
      </div>

      {/* Tab Toggle */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 14 }}>
        {(['current', 'optimal'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setSelectedSlot(null); }}
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 700,
              padding: '6px 20px',
              border: '1px solid #374151',
              background: tab === t ? '#1e293b' : '#030712',
              color: tab === t ? '#f59e0b' : '#6b7280',
              cursor: 'pointer',
              borderBottom: tab === t ? '2px solid #f59e0b' : '1px solid #374151',
              letterSpacing: 1,
            }}
          >
            {t === 'current' ? 'CURRENT LINEUP' : 'OPTIMAL LINEUP'}
          </button>
        ))}
      </div>

      {/* Lineup Table + Detail */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        {/* Table */}
        <div style={{ flex: '1 1 620px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #374151', color: '#6b7280', fontFamily: 'monospace', fontSize: 10 }}>
                <th style={{ padding: '6px 10px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '6px 8px', textAlign: 'left' }}>PLAYER</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>OBP</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>SLG</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>wOBA</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>ISO</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>wRC+</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>FIT</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>GRADE</th>
              </tr>
            </thead>
            <tbody>
              {lineup.map(a => (
                <SlotRow
                  key={a.slot}
                  assignment={a}
                  isOptimal={tab === 'optimal'}
                  onClick={() => setSelectedSlot(a.slot)}
                  isSelected={selectedSlot === a.slot}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Slot Detail */}
        <div style={{ flex: '1 1 300px', minWidth: 280 }}>
          {selected ? (
            <div style={PANEL}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                #{selected.slot} {selected.player.name}
                <span style={{ color: '#6b7280', fontWeight: 400, marginLeft: 8, fontSize: 11 }}>
                  {selected.player.pos} ({selected.player.hand})
                </span>
              </div>

              {/* Rule for this slot */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 4 }}>
                  SLOT RULE: {data.rules[selected.slot - 1]?.slotName.toUpperCase()}
                </div>
                <div style={{ color: '#9ca3af', fontSize: 11, lineHeight: 1.4, marginBottom: 4 }}>
                  {data.rules[selected.slot - 1]?.description}
                </div>
                <div style={{ color: '#3b82f6', fontSize: 10 }}>
                  Ideal: {data.rules[selected.slot - 1]?.idealProfile}
                </div>
              </div>

              {/* Fit Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div>
                  <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 2 }}>FIT SCORE</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: gradeColor(selected.fitGrade) }}>
                    {selected.fitScore}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 2 }}>GRADE</div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: gradeColor(selected.fitGrade),
                    padding: '2px 10px',
                    background: gradeColor(selected.fitGrade) + '18',
                    borderRadius: 4,
                    display: 'inline-block',
                  }}>
                    {selected.fitGrade}
                  </div>
                </div>
              </div>

              {/* Player Stats */}
              <div style={{ color: '#6b7280', fontSize: 10, marginBottom: 6 }}>PLAYER STATS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                {[
                  { label: 'AVG', value: selected.player.avg.toFixed(3) },
                  { label: 'OBP', value: selected.player.obp.toFixed(3) },
                  { label: 'SLG', value: selected.player.slg.toFixed(3) },
                  { label: 'wOBA', value: selected.player.wOBA.toFixed(3) },
                  { label: 'wRC+', value: selected.player.wRCPlus },
                  { label: 'SPD', value: selected.player.speed },
                  { label: 'POW', value: selected.player.power },
                  { label: 'CON', value: selected.player.contact },
                  { label: 'EYE', value: selected.player.eye },
                  { label: 'K%', value: selected.player.kPct.toFixed(1) + '%' },
                  { label: 'BB%', value: selected.player.bbPct.toFixed(1) + '%' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', minWidth: 42 }}>
                    <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: 12 }}>{s.value}</div>
                    <div style={{ color: '#4b5563', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Strengths */}
              {selected.strengths.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ color: '#22c55e', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>STRENGTHS</div>
                  {selected.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>+ {s}</div>
                  ))}
                </div>
              )}

              {/* Violations */}
              {selected.violations.length > 0 && (
                <div>
                  <div style={{ color: '#ef4444', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>VIOLATIONS</div>
                  {selected.violations.map((v, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>! {v}</div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...PANEL, textAlign: 'center', color: '#4b5563', padding: 40 }}>
              Select a lineup slot to view detailed analysis
            </div>
          )}
        </div>
      </div>

      {/* Swap Recommendations */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 10 }}>
          SWAP RECOMMENDATIONS
        </div>
        {data.swapRecommendations.map((swap, i) => (
          <SwapCard key={i} swap={swap} />
        ))}
      </div>

      {/* Theory Comparisons */}
      <div>
        <div style={{ color: '#f59e0b', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1, marginBottom: 10 }}>
          THEORY COMPARISON
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {data.theoryComparisons.map((theory, i) => (
            <TheoryPanel key={i} theory={theory} />
          ))}
        </div>
      </div>
    </div>
  );
}
