import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateDemoMatchupHistory,
  winPctColor,
  streakColor,
  runDiffColor,
  formatRunDiff,
  type MatchupHistoryData,
  type TeamMatchupData,
  type MatchupSeason,
} from '../../engine/history/historicalMatchups';

// ── Season Row ──────────────────────────────────────────────────────────────

function SeasonRow({ season }: { season: MatchupSeason }) {
  const total = season.wins + season.losses;
  const pct = total > 0 ? (season.wins / total) : 0;
  const pctColor = winPctColor(season.wins, season.losses);
  const diffColor = runDiffColor(season.runDiff);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '60px 80px 80px 70px 90px 90px',
      gap: '8px',
      padding: '6px 12px',
      borderBottom: '1px solid #111827',
      fontSize: '11px',
      fontFamily: 'monospace',
      alignItems: 'center',
    }}>
      <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>S{season.season}</span>
      <span style={{
        color: pctColor,
        fontWeight: 'bold',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {season.wins}-{season.losses}
        <span style={{ color: '#4b5563', fontWeight: 'normal', marginLeft: '4px' }}>
          ({(pct * 100).toFixed(0)}%)
        </span>
      </span>
      <span style={{
        color: diffColor,
        fontWeight: 'bold',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {formatRunDiff(season.runDiff)}
      </span>
      <span style={{ color: '#d1d5db', fontVariantNumeric: 'tabular-nums' }}>
        {season.homeRecord}
      </span>
      <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
        {season.awayRecord}
      </span>
      {/* Visual bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{
          flex: 1,
          height: '6px',
          backgroundColor: '#1f2937',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct * 100}%`,
            height: '100%',
            backgroundColor: pctColor,
            borderRadius: '2px',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Matchup Detail ──────────────────────────────────────────────────────────

function MatchupDetail({ matchup }: { matchup: TeamMatchupData }) {
  const totalGames = matchup.allTimeWins + matchup.allTimeLosses;
  const pct = totalGames > 0 ? (matchup.allTimeWins / totalGames) : 0;
  const pctColor = winPctColor(matchup.allTimeWins, matchup.allTimeLosses);
  const sColor = streakColor(matchup.streakType);

  return (
    <div style={{ fontFamily: 'monospace' }}>
      {/* All-time record header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <div style={{
          border: '1px solid #1f2937',
          padding: '10px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>ALL-TIME RECORD</div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: pctColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {matchup.allTimeWins}-{matchup.allTimeLosses}
          </div>
          <div style={{ fontSize: '10px', color: '#4b5563' }}>
            ({(pct * 100).toFixed(1)}%)
          </div>
        </div>

        <div style={{
          border: '1px solid #1f2937',
          padding: '10px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>CURRENT STREAK</div>
          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: sColor,
            fontVariantNumeric: 'tabular-nums',
          }}>
            {matchup.streakType}{matchup.currentStreak}
          </div>
          <div style={{ fontSize: '10px', color: '#4b5563' }}>
            {matchup.streakType === 'W' ? 'consecutive wins' : 'consecutive losses'}
          </div>
        </div>

        <div style={{
          border: '1px solid #1f2937',
          padding: '10px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>DOMINANT PITCHER</div>
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#22c55e',
            marginTop: '4px',
          }}>
            {matchup.dominantPitcher}
          </div>
          <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '2px' }}>
            best record vs opponent
          </div>
        </div>

        <div style={{
          border: '1px solid #1f2937',
          padding: '10px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>NEMESIS</div>
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#ef4444',
            marginTop: '4px',
          }}>
            {matchup.nemesis}
          </div>
          <div style={{ fontSize: '9px', color: '#4b5563', marginTop: '2px' }}>
            toughest opposing hitter
          </div>
        </div>
      </div>

      {/* Season-by-season table */}
      <div style={{
        border: '1px solid #1f2937',
        backgroundColor: '#030712',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 80px 80px 70px 90px 90px',
          gap: '8px',
          padding: '6px 12px',
          borderBottom: '1px solid #1f2937',
          fontSize: '9px',
          fontWeight: 'bold',
          color: '#6b7280',
          letterSpacing: '0.05em',
        }}>
          <span>SEASON</span>
          <span>RECORD</span>
          <span>RUN DIFF</span>
          <span>HOME</span>
          <span>AWAY</span>
          <span>WIN %</span>
        </div>

        {/* Season rows */}
        {matchup.seasons.map(s => (
          <SeasonRow key={s.season} season={s} />
        ))}

        {/* Totals row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '60px 80px 80px 70px 90px 90px',
          gap: '8px',
          padding: '6px 12px',
          borderTop: '1px solid #374151',
          fontSize: '11px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          alignItems: 'center',
        }}>
          <span style={{ color: '#f59e0b' }}>TOTAL</span>
          <span style={{ color: pctColor, fontVariantNumeric: 'tabular-nums' }}>
            {matchup.allTimeWins}-{matchup.allTimeLosses}
          </span>
          <span style={{
            color: runDiffColor(matchup.seasons.reduce((s, ss) => s + ss.runDiff, 0)),
            fontVariantNumeric: 'tabular-nums',
          }}>
            {formatRunDiff(matchup.seasons.reduce((s, ss) => s + ss.runDiff, 0))}
          </span>
          <span style={{ color: '#6b7280' }}>--</span>
          <span style={{ color: '#6b7280' }}>--</span>
          <span style={{ color: '#6b7280' }}>--</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function MatchupHistoryView() {
  const { gameStarted } = useGameStore();
  const [data] = useState<MatchupHistoryData>(() => generateDemoMatchupHistory());
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!gameStarted) {
    return (
      <div style={{ padding: '16px', color: '#6b7280', fontSize: '12px', fontFamily: 'monospace' }}>
        Start a game first.
      </div>
    );
  }

  const current = data.matchups[selectedIdx];

  // Overall stats across all matchups
  const totalW = data.matchups.reduce((s, m) => s + m.allTimeWins, 0);
  const totalL = data.matchups.reduce((s, m) => s + m.allTimeLosses, 0);
  const bestMatchup = [...data.matchups].sort((a, b) => {
    const aPct = a.allTimeWins / (a.allTimeWins + a.allTimeLosses);
    const bPct = b.allTimeWins / (b.allTimeWins + b.allTimeLosses);
    return bPct - aPct;
  })[0];
  const worstMatchup = [...data.matchups].sort((a, b) => {
    const aPct = a.allTimeWins / (a.allTimeWins + a.allTimeLosses);
    const bPct = b.allTimeWins / (b.allTimeWins + b.allTimeLosses);
    return aPct - bPct;
  })[0];

  return (
    <div style={{ padding: '16px', fontFamily: 'monospace' }}>
      {/* Header */}
      <div style={{
        margin: '-16px -16px 16px -16px',
        padding: '8px 32px',
        backgroundColor: '#111827',
        borderBottom: '1px solid #f59e0b',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#f59e0b',
        letterSpacing: '0.1em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span>HISTORICAL MATCHUPS</span>
        <span style={{ color: '#6b7280', fontSize: '10px', fontWeight: 'normal', letterSpacing: '0' }}>
          {data.teamName.toUpperCase()} HEAD-TO-HEAD
        </span>
      </div>

      {/* Summary stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '12px',
      }}>
        <div style={{
          border: '1px solid #1f2937',
          padding: '8px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>ALL OPPONENTS</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: winPctColor(totalW, totalL),
            fontVariantNumeric: 'tabular-nums',
          }}>
            {totalW}-{totalL}
          </div>
        </div>
        <div style={{
          border: '1px solid #1f2937',
          padding: '8px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>MATCHUPS</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: '#f59e0b',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {data.matchups.length}
          </div>
        </div>
        <div style={{
          border: '1px solid #1f2937',
          padding: '8px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>BEST MATCHUP</div>
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#22c55e',
            marginTop: '2px',
          }}>
            {bestMatchup.opponentAbbr}
          </div>
          <div style={{ fontSize: '9px', color: '#4b5563' }}>
            {bestMatchup.allTimeWins}-{bestMatchup.allTimeLosses}
          </div>
        </div>
        <div style={{
          border: '1px solid #1f2937',
          padding: '8px 14px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>WORST MATCHUP</div>
          <div style={{
            fontSize: '13px',
            fontWeight: 'bold',
            color: '#ef4444',
            marginTop: '2px',
          }}>
            {worstMatchup.opponentAbbr}
          </div>
          <div style={{ fontSize: '9px', color: '#4b5563' }}>
            {worstMatchup.allTimeWins}-{worstMatchup.allTimeLosses}
          </div>
        </div>
      </div>

      {/* Opponent selector */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        marginBottom: '12px',
      }}>
        {data.matchups.map((m, idx) => {
          const mPct = m.allTimeWins / (m.allTimeWins + m.allTimeLosses);
          const mColor = mPct >= 0.5 ? '#22c55e' : '#ef4444';

          return (
            <button
              key={m.opponentId}
              onClick={() => setSelectedIdx(idx)}
              style={{
                padding: '6px 12px',
                fontSize: '10px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                borderRadius: '3px',
                border: idx === selectedIdx ? '1px solid #f59e0b' : '1px solid #1f2937',
                cursor: 'pointer',
                backgroundColor: idx === selectedIdx ? '#f59e0b22' : '#1f2937',
                color: idx === selectedIdx ? '#f59e0b' : '#9ca3af',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span>{m.opponentAbbr}</span>
              <span style={{
                fontSize: '9px',
                color: idx === selectedIdx ? mColor : '#4b5563',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {m.allTimeWins}-{m.allTimeLosses}
              </span>
              {m.currentStreak >= 3 && (
                <span style={{
                  fontSize: '8px',
                  fontWeight: 'bold',
                  color: streakColor(m.streakType),
                }}>
                  {m.streakType}{m.currentStreak}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected matchup header */}
      <div style={{
        padding: '8px 12px',
        marginBottom: '12px',
        border: '1px solid #1f2937',
        backgroundColor: '#0a0f1a',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>{data.teamName}</span>
          <span style={{ color: '#6b7280' }}> vs </span>
          <span style={{ color: '#d1d5db', fontWeight: 'bold' }}>{current.opponentName}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            padding: '2px 8px',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '3px',
            backgroundColor: streakColor(current.streakType) + '22',
            color: streakColor(current.streakType),
          }}>
            {current.streakType === 'W' ? 'WIN' : 'LOSS'} STREAK: {current.currentStreak}
          </span>
        </div>
      </div>

      {/* Matchup detail */}
      <MatchupDetail matchup={current} />
    </div>
  );
}
