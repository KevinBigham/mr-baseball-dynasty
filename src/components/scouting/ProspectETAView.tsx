/**
 * ProspectETAView – Prospect ETA tracker dashboard
 *
 * Bloomberg-terminal style view showing prospect arrival estimates,
 * confidence badges, milestone checklists, readiness bars,
 * top tools, and concerns.
 */
import { useState, useMemo } from 'react';
import {
  ProspectETAProfile,
  CONFIDENCE_DISPLAY,
  getReadinessColor,
  getMilestoneProgress,
  generateDemoProspectETA,
} from '../../engine/scouting/prospectETA';

type SortKey = 'eta' | 'readyPct' | 'age' | 'name' | 'level';
type SortDir = 'asc' | 'desc';

const LEVEL_SORT: Record<string, number> = {
  'MLB': 7, 'AAA': 6, 'AA': 5, 'A+': 4, 'A': 3, 'Rk': 2, 'DSL': 1, 'Intl': 0,
};

export default function ProspectETAView() {
  const prospects = useMemo(() => generateDemoProspectETA(), []);
  const [sortKey, setSortKey] = useState<SortKey>('eta');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = useMemo(() => {
    const arr = [...prospects];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'eta': cmp = a.eta - b.eta; break;
        case 'readyPct': cmp = a.readyPct - b.readyPct; break;
        case 'age': cmp = a.age - b.age; break;
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'level': cmp = (LEVEL_SORT[a.currentLevel] ?? 0) - (LEVEL_SORT[b.currentLevel] ?? 0); break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return arr;
  }, [prospects, sortKey, sortDir]);

  const selected = selectedId !== null ? prospects.find(p => p.prospectId === selectedId) : null;

  const arrow = (key: SortKey) => sortKey === key ? (sortDir === 'asc' ? ' ^' : ' v') : '';

  // Summary stats
  const highConfCount = prospects.filter(p => p.confidence === 'high').length;
  const nearTermCount = prospects.filter(p => p.eta <= 2026).length;
  const avgReady = Math.round(prospects.reduce((s, p) => s + p.readyPct, 0) / prospects.length);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      {/* ── Header ── */}
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        PROSPECT ETA TRACKER — ARRIVAL PROJECTIONS
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Prospects', value: prospects.length },
          { label: 'Near-Term (2026)', value: nearTermCount, color: '#22c55e' },
          { label: 'High Confidence', value: highConfCount, color: '#22c55e' },
          { label: 'Avg Readiness', value: `${avgReady}%`, color: getReadinessColor(avgReady) },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* ── Prospect List ── */}
        <div style={{ flex: '1 1 700px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 680 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th
                  style={{ textAlign: 'left', padding: 6, cursor: 'pointer' }}
                  onClick={() => handleSort('name')}
                >
                  Prospect{arrow('name')}
                </th>
                <th
                  style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }}
                  onClick={() => handleSort('age')}
                >
                  Age{arrow('age')}
                </th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th
                  style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }}
                  onClick={() => handleSort('level')}
                >
                  Level{arrow('level')}
                </th>
                <th
                  style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }}
                  onClick={() => handleSort('eta')}
                >
                  ETA{arrow('eta')}
                </th>
                <th style={{ textAlign: 'center', padding: 6 }}>Range</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Conf</th>
                <th
                  style={{ textAlign: 'center', padding: 6, cursor: 'pointer' }}
                  onClick={() => handleSort('readyPct')}
                >
                  Ready%{arrow('readyPct')}
                </th>
                <th style={{ textAlign: 'left', padding: 6 }}>Top Tool</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Concern</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => {
                const conf = CONFIDENCE_DISPLAY[p.confidence];
                const isSelected = selectedId === p.prospectId;
                return (
                  <tr
                    key={p.prospectId}
                    onClick={() => setSelectedId(isSelected ? null : p.prospectId)}
                    style={{
                      borderBottom: '1px solid #222',
                      cursor: 'pointer',
                      background: isSelected ? '#1a1a3e' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{p.age}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#f59e0b' }}>{p.position}</td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <span style={{
                        background: '#1a1a2e',
                        color: '#ccc',
                        padding: '2px 6px',
                        fontSize: 10,
                        fontWeight: 700,
                        border: '1px solid #333',
                      }}>
                        {p.currentLevel}
                      </span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', fontWeight: 700, color: p.eta <= 2026 ? '#22c55e' : '#ccc' }}>
                      {p.eta}
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888', fontSize: 11 }}>
                      [{p.etaRange[0]}-{p.etaRange[1]}]
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <span style={{
                        background: p.confidence === 'high' ? '#14532d' : p.confidence === 'medium' ? '#78350f' : '#7f1d1d',
                        color: conf.color,
                        padding: '2px 6px',
                        fontSize: 9,
                        fontWeight: 700,
                      }}>
                        {conf.label}
                      </span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                        <div style={{ background: '#111', height: 8, width: 50, position: 'relative' }}>
                          <div style={{
                            position: 'absolute', top: 0, left: 0,
                            height: '100%',
                            width: `${p.readyPct}%`,
                            background: getReadinessColor(p.readyPct),
                          }} />
                        </div>
                        <span style={{ fontSize: 10, color: getReadinessColor(p.readyPct), fontWeight: 700 }}>
                          {p.readyPct}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: 6, fontSize: 11, color: '#3b82f6' }}>{p.topTool}</td>
                    <td style={{ padding: 6, fontSize: 11, color: '#f97316' }}>{p.biggestConcern}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Milestone Detail Panel ── */}
        <div style={{ flex: '0 0 320px' }}>
          {selected ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selected.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                  {selected.position} · {selected.currentLevel} · Age {selected.age}
                </span>
              </div>

              {/* ETA + Confidence */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#22c55e', fontSize: 22, fontWeight: 700 }}>{selected.eta}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>ETA</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#888', fontSize: 14, fontWeight: 600 }}>
                    [{selected.etaRange[0]}-{selected.etaRange[1]}]
                  </div>
                  <div style={{ color: '#666', fontSize: 9 }}>RANGE</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    color: CONFIDENCE_DISPLAY[selected.confidence].color,
                    fontSize: 14,
                    fontWeight: 700,
                  }}>
                    {CONFIDENCE_DISPLAY[selected.confidence].label}
                  </div>
                  <div style={{ color: '#666', fontSize: 9 }}>CONFIDENCE</div>
                </div>
              </div>

              {/* Readiness bar */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                  <span style={{ color: '#888' }}>MLB READINESS</span>
                  <span style={{ color: getReadinessColor(selected.readyPct), fontWeight: 700 }}>
                    {selected.readyPct}%
                  </span>
                </div>
                <div style={{ background: '#111', height: 12, width: '100%', position: 'relative' }}>
                  <div style={{
                    position: 'absolute', top: 0, left: 0,
                    height: '100%',
                    width: `${selected.readyPct}%`,
                    background: getReadinessColor(selected.readyPct),
                  }} />
                </div>
              </div>

              {/* Top Tool & Concern */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#666', fontSize: 9, marginBottom: 2 }}>TOP TOOL</div>
                  <div style={{ color: '#3b82f6', fontSize: 12, fontWeight: 600 }}>{selected.topTool}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#666', fontSize: 9, marginBottom: 2 }}>CONCERN</div>
                  <div style={{ color: '#f97316', fontSize: 12, fontWeight: 600 }}>{selected.biggestConcern}</div>
                </div>
              </div>

              {/* Milestone Checklist */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>
                DEVELOPMENT MILESTONES ({getMilestoneProgress(selected.milestones)}% complete)
              </div>
              <div>
                {selected.milestones.map((m, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0',
                      borderBottom: '1px solid #1a1a2e',
                    }}
                  >
                    <span style={{
                      width: 16,
                      height: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      background: m.achieved ? '#14532d' : '#1a1a2e',
                      color: m.achieved ? '#22c55e' : '#555',
                      border: `1px solid ${m.achieved ? '#22c55e' : '#333'}`,
                      flexShrink: 0,
                    }}>
                      {m.achieved ? 'X' : ' '}
                    </span>
                    <span style={{
                      flex: 1,
                      fontSize: 11,
                      color: m.achieved ? '#ccc' : '#666',
                      textDecoration: m.achieved ? 'none' : 'none',
                    }}>
                      {m.milestone}
                    </span>
                    {m.achievedDate && (
                      <span style={{ color: '#555', fontSize: 9 }}>{m.achievedDate}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a prospect to view milestones
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
