/**
 * ArbProjectorView – Arbitration Salary Projector dashboard
 *
 * Bloomberg-terminal style view with sortable player list showing
 * current vs projected salary, range bars, comparable players,
 * and filing deadline countdowns.
 */
import { useMemo, useState } from 'react';
import {
  ARB_YEAR_DISPLAY,
  generateDemoArbProjections,
  getProjectedRaisePct,
  getDaysUntilDeadline,
  getTotalProjectedCost,
  sortByProjectedSalary,
  type ArbProjection,
} from '../../engine/contracts/arbitrationProjector';

type SortKey = 'name' | 'projectedSalary' | 'currentSalary' | 'arbYear' | 'age';

export default function ArbProjectorView() {
  const rawProjections = useMemo(() => generateDemoArbProjections(), []);
  const [sortKey, setSortKey] = useState<SortKey>('projectedSalary');
  const [sortDesc, setSortDesc] = useState(true);
  const [selectedId, setSelectedId] = useState<number>(rawProjections[0]?.playerId ?? 0);

  const projections = useMemo(() => {
    const list = [...rawProjections];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortKey === 'projectedSalary') cmp = a.projectedSalary - b.projectedSalary;
      else if (sortKey === 'currentSalary') cmp = a.currentSalary - b.currentSalary;
      else if (sortKey === 'arbYear') cmp = a.arbYear.localeCompare(b.arbYear);
      else if (sortKey === 'age') cmp = a.age - b.age;
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [rawProjections, sortKey, sortDesc]);

  const totalCost = getTotalProjectedCost(rawProjections);
  const selected = rawProjections.find(p => p.playerId === selectedId) ?? rawProjections[0];

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(!sortDesc);
    else { setSortKey(key); setSortDesc(true); }
  }

  const sortArrow = (key: SortKey) => sortKey === key ? (sortDesc ? ' ▼' : ' ▲') : '';

  // For range bar scaling
  const maxSalary = Math.max(...rawProjections.map(p => p.range[1]), 1);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{
        fontSize: 14, fontWeight: 700, color: '#f59e0b', letterSpacing: 1,
        borderBottom: '1px solid #f59e0b', paddingBottom: 6, marginBottom: 14,
      }}>
        ARBITRATION PROJECTOR — SALARY PROJECTION ENGINE
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Eligible Players', value: rawProjections.length },
          { label: 'Total Projected', value: `$${totalCost.toFixed(1)}M`, color: '#f59e0b' },
          { label: 'Avg Projected', value: `$${(totalCost / rawProjections.length).toFixed(1)}M` },
          { label: 'Max Projected', value: `$${Math.max(...rawProjections.map(p => p.projectedSalary)).toFixed(1)}M`, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{
            border: '1px solid #333', padding: '8px 14px', minWidth: 110, textAlign: 'center',
            background: '#111827',
          }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Player Table ── */}
      <div style={{ border: '1px solid #333', padding: 12, overflowX: 'auto', background: '#111827', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
              <th
                style={{ textAlign: 'left', padding: 6, cursor: 'pointer' }}
                onClick={() => handleSort('name')}
              >
                Player{sortArrow('name')}
              </th>
              <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
              <th
                style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }}
                onClick={() => handleSort('age')}
              >
                Age{sortArrow('age')}
              </th>
              <th
                style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }}
                onClick={() => handleSort('arbYear')}
              >
                Arb Yr{sortArrow('arbYear')}
              </th>
              <th
                style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }}
                onClick={() => handleSort('currentSalary')}
              >
                Current{sortArrow('currentSalary')}
              </th>
              <th
                style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }}
                onClick={() => handleSort('projectedSalary')}
              >
                Projected{sortArrow('projectedSalary')}
              </th>
              <th style={{ textAlign: 'center', padding: 6, minWidth: 160 }}>Range</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Raise%</th>
              <th style={{ textAlign: 'center', padding: 6 }}>Deadline</th>
            </tr>
          </thead>
          <tbody>
            {projections.map(p => {
              const arbD = ARB_YEAR_DISPLAY[p.arbYear];
              const raisePct = getProjectedRaisePct(p);
              const daysLeft = getDaysUntilDeadline(p.filingDeadline);
              const isSelected = p.playerId === selectedId;
              return (
                <tr
                  key={p.playerId}
                  onClick={() => setSelectedId(p.playerId)}
                  style={{
                    borderBottom: '1px solid #222', cursor: 'pointer',
                    background: isSelected ? '#1e293b' : 'transparent',
                  }}
                >
                  <td style={{ padding: 6, fontWeight: 600, color: isSelected ? '#f59e0b' : '#e0e0e0' }}>
                    {p.name}
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.position}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>{p.age}</td>
                  <td style={{ padding: 6, textAlign: 'center' }}>
                    <span style={{
                      background: arbD.color, color: '#000', padding: '1px 6px',
                      fontSize: 10, fontWeight: 700, borderRadius: 2,
                    }}>
                      {arbD.label}
                    </span>
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>
                    ${p.currentSalary.toFixed(1)}M
                  </td>
                  <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b', fontWeight: 700 }}>
                    ${p.projectedSalary.toFixed(1)}M
                  </td>
                  <td style={{ padding: 6 }}>
                    <RangeBar low={p.range[0]} high={p.range[1]} projected={p.projectedSalary} max={maxSalary} />
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center', fontWeight: 600,
                    color: raisePct > 100 ? '#ef4444' : raisePct > 50 ? '#f59e0b' : '#22c55e',
                  }}>
                    {raisePct > 0 ? '+' : ''}{raisePct}%
                  </td>
                  <td style={{
                    padding: 6, textAlign: 'center',
                    color: daysLeft <= 14 ? '#ef4444' : daysLeft <= 30 ? '#f59e0b' : '#888',
                    fontWeight: daysLeft <= 14 ? 700 : 400,
                  }}>
                    {daysLeft === 0 ? 'PASSED' : `${daysLeft}d`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Detail: Comparables & Stats ── */}
      {selected && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {/* Key Stats */}
          <div style={{ border: '1px solid #333', padding: 12, background: '#111827', flex: '1 1 240px' }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
              {selected.name} — KEY STATS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {selected.keyStats.map(s => (
                <div key={s.label} style={{ borderBottom: '1px solid #222', paddingBottom: 4 }}>
                  <div style={{ color: '#888', fontSize: 10 }}>{s.label}</div>
                  <div style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 14 }}>{s.value}</div>
                </div>
              ))}
              <div style={{ borderBottom: '1px solid #222', paddingBottom: 4 }}>
                <div style={{ color: '#888', fontSize: 10 }}>Service Time</div>
                <div style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 14 }}>{selected.serviceTime.toFixed(3)}</div>
              </div>
              <div style={{ borderBottom: '1px solid #222', paddingBottom: 4 }}>
                <div style={{ color: '#888', fontSize: 10 }}>Arb Year</div>
                <div style={{ color: ARB_YEAR_DISPLAY[selected.arbYear].color, fontWeight: 600, fontSize: 14 }}>
                  {ARB_YEAR_DISPLAY[selected.arbYear].label}
                </div>
              </div>
            </div>
            {/* Salary Comparison Bar */}
            <div style={{ marginTop: 14 }}>
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>CURRENT vs PROJECTED</div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#555', fontSize: 9, marginBottom: 1 }}>Current: ${selected.currentSalary.toFixed(1)}M</div>
                  <div style={{ background: '#1e293b', height: 14 }}>
                    <div style={{
                      background: '#3b82f6', height: '100%',
                      width: `${Math.min(100, (selected.currentSalary / Math.max(selected.projectedSalary, selected.currentSalary)) * 100)}%`,
                    }} />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#555', fontSize: 9, marginBottom: 1 }}>Projected: ${selected.projectedSalary.toFixed(1)}M</div>
                  <div style={{ background: '#1e293b', height: 14 }}>
                    <div style={{
                      background: '#f59e0b', height: '100%',
                      width: `${Math.min(100, (selected.projectedSalary / Math.max(selected.projectedSalary, selected.currentSalary)) * 100)}%`,
                    }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparable Players */}
          <div style={{ border: '1px solid #333', padding: 12, background: '#111827', flex: '1 1 340px' }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: 8, fontSize: 13 }}>
              COMPARABLE PLAYERS
            </div>
            {selected.comparables.length === 0 ? (
              <div style={{ color: '#555', fontStyle: 'italic' }}>No comparables available</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                    <th style={{ textAlign: 'left', padding: 4 }}>Player</th>
                    <th style={{ textAlign: 'center', padding: 4 }}>Salary</th>
                    <th style={{ textAlign: 'left', padding: 4 }}>Stats</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.comparables.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: 4, color: '#e0e0e0' }}>{c.name}</td>
                      <td style={{ padding: 4, textAlign: 'center', color: '#f59e0b', fontWeight: 600 }}>
                        ${c.salary.toFixed(1)}M
                      </td>
                      <td style={{ padding: 4, color: '#888', fontSize: 11 }}>{c.stats}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {/* Filing Deadline */}
            <div style={{ marginTop: 14, borderTop: '1px solid #333', paddingTop: 10 }}>
              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>FILING DEADLINE</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#e0e0e0' }}>{selected.filingDeadline}</span>
                {(() => {
                  const d = getDaysUntilDeadline(selected.filingDeadline);
                  return (
                    <span style={{
                      color: d === 0 ? '#ef4444' : d <= 14 ? '#ef4444' : d <= 30 ? '#f59e0b' : '#22c55e',
                      fontWeight: 700, fontSize: 14,
                    }}>
                      {d === 0 ? 'DEADLINE PASSED' : `${d} DAYS LEFT`}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Salary Range Bar ── */
function RangeBar({ low, high, projected, max }: { low: number; high: number; projected: number; max: number }) {
  const leftPct = (low / max) * 100;
  const widthPct = ((high - low) / max) * 100;
  const projPct = (projected / max) * 100;
  return (
    <div style={{ position: 'relative', height: 14, background: '#1e293b', width: '100%' }}>
      {/* Range band */}
      <div style={{
        position: 'absolute', left: `${leftPct}%`, width: `${widthPct}%`,
        height: '100%', background: '#374151', borderRadius: 1,
      }} />
      {/* Projected marker */}
      <div style={{
        position: 'absolute', left: `${projPct}%`, top: 0, bottom: 0,
        width: 2, background: '#f59e0b', transform: 'translateX(-1px)',
      }} />
      {/* Labels */}
      <span style={{ position: 'absolute', left: 2, top: 0, fontSize: 9, color: '#888', lineHeight: '14px' }}>
        ${low.toFixed(1)}
      </span>
      <span style={{ position: 'absolute', right: 2, top: 0, fontSize: 9, color: '#888', lineHeight: '14px' }}>
        ${high.toFixed(1)}
      </span>
    </div>
  );
}
