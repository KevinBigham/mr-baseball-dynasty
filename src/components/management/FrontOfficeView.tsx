/**
 * FrontOfficeView – Front office hierarchy dashboard
 *
 * Bloomberg-terminal style org chart with staff ratings, roles,
 * specialties, budgets, and organizational strengths/weaknesses.
 */
import { useState, useMemo } from 'react';
import {
  StaffMember,
  ROLE_DISPLAY,
  getFrontOfficeSummary,
  generateDemoFrontOffice,
} from '../../engine/management/frontOfficeHierarchy';

export default function FrontOfficeView() {
  const data = useMemo(() => generateDemoFrontOffice(), []);
  const summary = useMemo(() => getFrontOfficeSummary(data), [data]);
  const [selected, setSelected] = useState<StaffMember | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        FRONT OFFICE HIERARCHY — {data.teamName.toUpperCase()}
      </div>

      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Staff', value: summary.totalStaff },
          { label: 'Org Rating', value: summary.orgRating, color: '#22c55e' },
          { label: 'Avg Rating', value: summary.avgRating },
          { label: 'Total Budget', value: `$${summary.totalBudget}M` },
          { label: 'Top Rated', value: summary.topRated },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 110, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 18, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 440px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Name</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Role</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Rating</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Yrs</th>
              </tr>
            </thead>
            <tbody>
              {data.staff.map(m => {
                const rd = ROLE_DISPLAY[m.role];
                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelected(m)}
                    style={{
                      borderBottom: '1px solid #222', cursor: 'pointer',
                      background: selected?.id === m.id ? '#1a1a3e' : 'transparent',
                      paddingLeft: rd.level * 12,
                    }}
                  >
                    <td style={{ padding: 6, paddingLeft: 6 + rd.level * 12, fontWeight: 600 }}>{m.name}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: rd.color, fontSize: 10, fontWeight: 600 }}>{rd.label}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: m.rating >= 85 ? '#22c55e' : m.rating >= 70 ? '#ccc' : '#f97316', fontWeight: 700 }}>{m.rating}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{m.yearsInOrg}</td>
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
                <span style={{ color: ROLE_DISPLAY[selected.role].color, fontWeight: 400, marginLeft: 8, fontSize: 11 }}>{selected.title}</span>
              </div>

              <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: selected.rating >= 85 ? '#22c55e' : '#ccc', fontWeight: 700, fontSize: 22 }}>{selected.rating}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Rating</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 22 }}>{selected.age}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Age</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 22 }}>{selected.yearsInOrg}</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Years</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 11, flexWrap: 'wrap' }}>
                <span><span style={{ color: '#666' }}>Specialty:</span> <span style={{ color: '#f59e0b' }}>{selected.specialty}</span></span>
                {selected.salary > 0 && <span><span style={{ color: '#666' }}>Salary:</span> ${selected.salary}K</span>}
                <span><span style={{ color: '#666' }}>Contract:</span> {selected.contractYears}yr</span>
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>PROFILE</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12, marginBottom: 14 }}>
                {selected.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              {/* Org Overview */}
              <div style={{ color: '#888', fontSize: 10, marginBottom: 6 }}>ORGANIZATIONAL OVERVIEW</div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>${data.scoutingBudget}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Scouting Budget</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#3b82f6', fontWeight: 700 }}>${data.analyticsBudget}M</div>
                  <div style={{ color: '#666', fontSize: 9 }}>Analytics Budget</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#22c55e', fontSize: 10, marginBottom: 4 }}>STRENGTHS</div>
                  {data.strengths.map(s => (
                    <div key={s} style={{ fontSize: 11, color: '#ccc', marginBottom: 2 }}>+ {s}</div>
                  ))}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#ef4444', fontSize: 10, marginBottom: 4 }}>WEAKNESSES</div>
                  {data.weaknesses.map(w => (
                    <div key={w} style={{ fontSize: 11, color: '#ccc', marginBottom: 2 }}>- {w}</div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'center', color: '#555', fontSize: 11, marginTop: 10 }}>
                Select a staff member to view profile
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
