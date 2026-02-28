/**
 * DeadlineWarRoomView – Trade Deadline War Room dashboard
 *
 * Bloomberg-terminal style deadline command center with needs,
 * targets, assets, and deal probability tracking.
 */
import { useState, useMemo } from 'react';
import {
  TradeTarget,
  DEAL_PROB_DISPLAY,
  NEED_LEVEL_DISPLAY,
  getWarRoomSummary,
  generateDemoWarRoom,
} from '../../engine/trade/deadlineWarRoom';

export default function DeadlineWarRoomView() {
  const data = useMemo(() => generateDemoWarRoom(), []);
  const summary = useMemo(() => getWarRoomSummary(data), [data]);
  const [selectedTarget, setSelectedTarget] = useState<TradeTarget | null>(null);

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div className="bloomberg-header" style={{ marginBottom: 14 }}>
        TRADE DEADLINE WAR ROOM — {data.teamName.toUpperCase()}
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 18, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { label: 'Days Left', value: summary.daysLeft, color: summary.daysLeft <= 7 ? '#ef4444' : '#f59e0b' },
          { label: 'Stance', value: summary.stance, color: data.buyerOrSeller === 'buyer' ? '#22c55e' : '#ef4444' },
          { label: 'Record', value: data.currentRecord },
          { label: 'Playoff %', value: summary.playoffOdds, color: '#22c55e' },
          { label: 'Critical', value: summary.criticalNeeds, color: '#ef4444' },
          { label: 'Budget', value: summary.budget },
        ].map(s => (
          <div key={s.label} className="bloomberg-border" style={{ padding: '8px 14px', minWidth: 100, textAlign: 'center' }}>
            <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>{s.label}</div>
            <div style={{ color: s.color ?? '#f59e0b', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Needs */}
      <div style={{ color: '#888', fontSize: 10, marginBottom: 6, fontWeight: 700 }}>ROSTER NEEDS</div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {data.needs.map(n => {
          const nd = NEED_LEVEL_DISPLAY[n.needLevel];
          return (
            <div key={n.position} className="bloomberg-border" style={{ padding: 10, minWidth: 160 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>{n.position}</span>
                <span style={{ color: nd.color, fontWeight: 700, fontSize: 10 }}>{nd.label}</span>
              </div>
              <div style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>Current: {n.currentStarter} ({n.currentWAR} WAR)</div>
              <div style={{ color: '#aaa', fontSize: 10 }}>Target: {n.upgradeTarget} WAR</div>
              <div style={{ color: '#666', fontSize: 9, marginTop: 4 }}>
                Targets: {n.topTargets.join(', ')}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Targets Table */}
        <div style={{ flex: '1 1 440px' }}>
          <div style={{ color: '#888', fontSize: 10, marginBottom: 6, fontWeight: 700 }}>TRADE TARGETS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#888' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Target</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Pos</th>
                <th style={{ textAlign: 'center', padding: 6 }}>WAR</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Ctrl</th>
                <th style={{ textAlign: 'center', padding: 6 }}>Prob</th>
              </tr>
            </thead>
            <tbody>
              {data.targets.map(t => {
                const pd = DEAL_PROB_DISPLAY[t.dealProb];
                return (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTarget(t)}
                    style={{ borderBottom: '1px solid #222', cursor: 'pointer', background: selectedTarget?.id === t.id ? '#1a1a3e' : 'transparent' }}
                  >
                    <td style={{ padding: 6, fontWeight: 600 }}>
                      {t.name} <span style={{ color: '#666', fontSize: 10 }}>{t.team}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: 'center', color: '#888' }}>{t.position}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: t.war >= 3 ? '#22c55e' : '#ccc', fontWeight: 700 }}>{t.war.toFixed(1)}</td>
                    <td style={{ padding: 6, textAlign: 'center', color: t.controlYears >= 3 ? '#22c55e' : '#888' }}>{t.controlYears}yr</td>
                    <td style={{ padding: 6, textAlign: 'center', color: pd.color, fontWeight: 700, fontSize: 10 }}>{pd.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Assets */}
          <div style={{ color: '#888', fontSize: 10, marginBottom: 6, marginTop: 16, fontWeight: 700 }}>TRADABLE ASSETS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333', color: '#666' }}>
                <th style={{ textAlign: 'left', padding: 4 }}>Asset</th>
                <th style={{ textAlign: 'center', padding: 4 }}>Type</th>
                <th style={{ textAlign: 'center', padding: 4 }}>Value</th>
                <th style={{ textAlign: 'center', padding: 4 }}>Ready?</th>
              </tr>
            </thead>
            <tbody>
              {data.assets.map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                  <td style={{ padding: 4, fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: 4, textAlign: 'center', color: '#888', fontSize: 10 }}>{a.type}</td>
                  <td style={{ padding: 4, textAlign: 'center', color: a.value >= 70 ? '#22c55e' : a.value >= 50 ? '#f59e0b' : '#888', fontWeight: 700 }}>{a.value}</td>
                  <td style={{ padding: 4, textAlign: 'center', color: a.mlbReady ? '#22c55e' : '#666', fontSize: 10 }}>{a.mlbReady ? 'YES' : 'NO'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Target Detail Panel */}
        <div style={{ flex: '1 1 380px' }}>
          {selectedTarget ? (
            <div className="bloomberg-border" style={{ padding: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                {selectedTarget.name}
                <span style={{ color: '#888', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>{selectedTarget.team} · {selectedTarget.position}</span>
              </div>
              <div style={{ color: DEAL_PROB_DISPLAY[selectedTarget.dealProb].color, fontWeight: 700, marginBottom: 12 }}>
                {DEAL_PROB_DISPLAY[selectedTarget.dealProb].label} · #{selectedTarget.costRank} Cost Rank
              </div>

              <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
                {[
                  { label: 'WAR', value: selectedTarget.war.toFixed(1), color: '#22c55e' },
                  { label: 'Age', value: selectedTarget.age.toString() },
                  { label: 'Salary', value: `$${selectedTarget.salary}M` },
                  { label: 'Control', value: `${selectedTarget.controlYears}yr`, color: selectedTarget.controlYears >= 3 ? '#22c55e' : '#888' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ color: s.color ?? '#ccc', fontWeight: 700, fontSize: 16 }}>{s.value}</div>
                    <div style={{ color: '#666', fontSize: 9 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>COMPETING BIDDERS</div>
              <div style={{ marginBottom: 12 }}>
                {selectedTarget.competingBidders.map((b, i) => (
                  <span key={i} style={{ display: 'inline-block', padding: '2px 8px', margin: 2, background: '#1a1a2e', border: '1px solid #333', color: '#f97316', fontSize: 10, fontWeight: 700 }}>
                    {b}
                  </span>
                ))}
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>ESTIMATED COST</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#ef4444', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                {selectedTarget.estimatedCost}
              </div>

              <div style={{ color: '#888', fontSize: 10, marginBottom: 4 }}>SCOUTING REPORT</div>
              <div style={{ padding: 6, background: '#111', border: '1px solid #333', color: '#eee', fontSize: 12 }}>
                {selectedTarget.notes}
              </div>
            </div>
          ) : (
            <div className="bloomberg-border" style={{ padding: 30, textAlign: 'center', color: '#555' }}>
              Select a target to view deal analysis
            </div>
          )}
        </div>
      </div>

      {/* War Room Notes */}
      <div style={{ marginTop: 14, padding: 8, background: '#111', border: '1px solid #333', color: '#aaa', fontSize: 11 }}>
        {data.notes}
      </div>
    </div>
  );
}
