/**
 * AwardPredictorView – Season Award Predictor dashboard
 *
 * Bloomberg-terminal style view with award type selector,
 * candidate rankings with probability bars, key stats,
 * and trend indicators.
 */
import { useMemo, useState } from 'react';
import {
  AWARD_TYPE_DISPLAY,
  TREND_DISPLAY,
  generateDemoAwardPredictions,
  type AwardType,
  type AwardPrediction,
  type AwardCandidate,
} from '../../engine/analytics/seasonAwardPredictor';

export default function AwardPredictorView() {
  const predictions = useMemo(() => generateDemoAwardPredictions(), []);
  const [selectedAward, setSelectedAward] = useState<AwardType>('mvp');
  const [selectedLeague, setSelectedLeague] = useState<'AL' | 'NL'>('AL');

  // Get available leagues for this award type
  const availableLeagues = useMemo(() => {
    const leagues = predictions
      .filter(p => p.award === selectedAward)
      .map(p => p.league);
    return [...new Set(leagues)];
  }, [predictions, selectedAward]);

  // Auto-switch league if not available
  const league = availableLeagues.includes(selectedLeague)
    ? selectedLeague
    : availableLeagues[0] ?? 'AL';

  const currentPrediction = predictions.find(
    p => p.award === selectedAward && p.league === league
  );

  const awardTypes: AwardType[] = ['mvp', 'cy_young', 'roy', 'gold_glove', 'silver_slugger', 'reliever_of_year'];

  return (
    <div style={{ padding: 18, color: '#e0e0e0', fontFamily: 'monospace', fontSize: 13 }}>
      <div style={{
        fontSize: 14, fontWeight: 700, color: '#f59e0b', letterSpacing: 1,
        borderBottom: '1px solid #f59e0b', paddingBottom: 6, marginBottom: 14,
      }}>
        SEASON AWARD PREDICTOR — PROBABILITY ENGINE
      </div>

      {/* ── Award Type Selector ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {awardTypes.map(aw => {
          const d = AWARD_TYPE_DISPLAY[aw];
          const active = selectedAward === aw;
          return (
            <button
              key={aw}
              onClick={() => setSelectedAward(aw)}
              style={{
                background: active ? d.color : '#111827',
                color: active ? '#000' : '#888',
                border: `1px solid ${active ? d.color : '#333'}`,
                padding: '5px 12px', cursor: 'pointer',
                fontFamily: 'monospace', fontSize: 11, fontWeight: active ? 700 : 400,
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      {/* ── League Toggle ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {availableLeagues.map(lg => (
          <button
            key={lg}
            onClick={() => setSelectedLeague(lg)}
            style={{
              background: league === lg ? '#f59e0b' : '#111827',
              color: league === lg ? '#000' : '#888',
              border: `1px solid ${league === lg ? '#f59e0b' : '#333'}`,
              padding: '4px 16px', cursor: 'pointer',
              fontFamily: 'monospace', fontSize: 12, fontWeight: league === lg ? 700 : 400,
            }}
          >
            {lg}
          </button>
        ))}
      </div>

      {/* ── Candidate Rankings ── */}
      {currentPrediction ? (
        <div style={{ border: '1px solid #333', padding: 12, background: '#111827' }}>
          <div style={{
            color: AWARD_TYPE_DISPLAY[selectedAward].color, fontWeight: 700, marginBottom: 10,
            fontSize: 13,
          }}>
            {league} {AWARD_TYPE_DISPLAY[selectedAward].label} — CANDIDATE RANKINGS
          </div>

          {currentPrediction.candidates.map((c: AwardCandidate, i: number) => {
            const trend = TREND_DISPLAY[c.trend];
            const isLeader = i === 0;
            return (
              <div
                key={c.playerId}
                style={{
                  borderBottom: '1px solid #222', padding: '10px 0',
                  background: isLeader ? '#0a1628' : 'transparent',
                  paddingLeft: isLeader ? 8 : 0,
                  paddingRight: 8,
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                  {/* Rank */}
                  <div style={{
                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isLeader ? '#f59e0b' : '#1e293b',
                    color: isLeader ? '#000' : '#888',
                    fontWeight: 700, fontSize: 12, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  {/* Name/Team/Pos */}
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, color: isLeader ? '#f59e0b' : '#e0e0e0', fontSize: 13 }}>
                      {c.name}
                    </span>
                    <span style={{ color: '#555', marginLeft: 8, fontSize: 11 }}>
                      {c.team} / {c.position}
                    </span>
                  </div>
                  {/* Trend */}
                  <div style={{ color: trend.color, fontWeight: 600, fontSize: 12, minWidth: 60, textAlign: 'right' }}>
                    {trend.symbol} {trend.label}
                  </div>
                  {/* Probability */}
                  <div style={{
                    color: '#f59e0b', fontWeight: 700, fontSize: 16, minWidth: 50, textAlign: 'right',
                  }}>
                    {c.probability}%
                  </div>
                </div>

                {/* Probability bar */}
                <div style={{ marginBottom: 6, marginLeft: 36 }}>
                  <div style={{ background: '#1e293b', height: 16, width: '100%', position: 'relative' }}>
                    <div style={{
                      background: AWARD_TYPE_DISPLAY[selectedAward].color,
                      height: '100%', width: `${c.probability}%`,
                      opacity: 0.8,
                      transition: 'width 0.3s',
                    }} />
                    <span style={{
                      position: 'absolute', left: `${Math.min(c.probability, 90)}%`,
                      top: 1, fontSize: 10, color: '#fff', fontWeight: 600, marginLeft: 4,
                    }}>
                      {c.probability}%
                    </span>
                  </div>
                </div>

                {/* Key stats row */}
                <div style={{ display: 'flex', gap: 12, marginLeft: 36, flexWrap: 'wrap' }}>
                  {c.keyStats.map(s => (
                    <div key={s.label} style={{
                      display: 'flex', gap: 4, alignItems: 'baseline',
                    }}>
                      <span style={{ color: '#555', fontSize: 10 }}>{s.label}:</span>
                      <span style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 12 }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Summary Footer */}
          <div style={{
            marginTop: 12, paddingTop: 10, borderTop: '1px solid #333',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ color: '#555', fontSize: 11 }}>
              {currentPrediction.candidates.length} candidates tracked
            </div>
            {currentPrediction.candidates.length >= 2 && (() => {
              const sorted = [...currentPrediction.candidates].sort((a, b) => b.probability - a.probability);
              const gap = sorted[0].probability - sorted[1].probability;
              const isClose = gap < 10;
              return (
                <div style={{
                  color: isClose ? '#ef4444' : '#22c55e',
                  fontWeight: 700, fontSize: 12,
                }}>
                  {isClose ? 'TIGHT RACE' : 'CLEAR LEADER'} (gap: {gap}pts)
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div style={{
          border: '1px solid #333', padding: 24, background: '#111827',
          textAlign: 'center', color: '#555',
        }}>
          No prediction data available for {league} {AWARD_TYPE_DISPLAY[selectedAward].label}
        </div>
      )}
    </div>
  );
}
