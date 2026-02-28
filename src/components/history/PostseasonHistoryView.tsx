import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ROUND_DISPLAY,
  getResultColor,
  getRoundWeight,
  getPostseasonSummary,
  generateDemoPostseasonHistory,
  type PostseasonHistoryData,
  type PostseasonSeries,
  type PostseasonRound,
} from '../../engine/history/postseasonHistory';

/* ── Inline helpers ─────────────────────────────────────────────── */

function RoundBadge({ round }: { round: PostseasonRound }) {
  const info = ROUND_DISPLAY[round];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 6px',
        fontSize: 9,
        fontWeight: 700,
        borderRadius: 3,
        backgroundColor: info.color + '22',
        color: info.color,
        fontFamily: 'monospace',
      }}
    >
      {info.label}
    </span>
  );
}

function ResultBadge({ result }: { result: 'W' | 'L' }) {
  const color = getResultColor(result);
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 5px',
        fontSize: 9,
        fontWeight: 700,
        borderRadius: 3,
        backgroundColor: color + '22',
        color,
        fontFamily: 'monospace',
      }}
    >
      {result}
    </span>
  );
}

function SeriesRow({ series }: { series: PostseasonSeries }) {
  const roundInfo = ROUND_DISPLAY[series.round];
  const isWS = series.round === 'WS';
  const isChampion = isWS && series.result === 'W';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 50px 36px 150px 50px 100px 1fr',
        alignItems: 'center',
        padding: '8px 12px',
        borderBottom: '1px solid rgba(31,41,55,0.5)',
        fontSize: 11,
        fontFamily: 'monospace',
        backgroundColor: isChampion ? 'rgba(34,197,94,0.05)' : 'transparent',
      }}
    >
      {/* Season */}
      <span style={{ color: '#6b7280', fontWeight: 700 }}>S{series.season}</span>
      {/* Round badge */}
      <RoundBadge round={series.round} />
      {/* Result */}
      <ResultBadge result={series.result} />
      {/* Opponent */}
      <span style={{ color: '#d1d5db' }}>vs {series.opponent}</span>
      {/* Games */}
      <span style={{ color: '#9ca3af', textAlign: 'center' }}>
        {series.gamesWon}-{series.gamesLost}
      </span>
      {/* Series bar */}
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: series.gamesWon + series.gamesLost }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              backgroundColor: i < series.gamesWon ? '#22c55e' : '#ef4444',
              opacity: 0.7,
            }}
          />
        ))}
      </div>
      {/* MVP */}
      <div style={{ textAlign: 'right' }}>
        {series.mvp ? (
          <span style={{ fontSize: 10 }}>
            <span style={{ color: '#6b7280' }}>MVP: </span>
            <span style={{ color: '#fdba74', fontWeight: 700 }}>{series.mvp}</span>
          </span>
        ) : (
          <span style={{ color: '#374151', fontSize: 10 }}>--</span>
        )}
      </div>
    </div>
  );
}

function SeasonGroup({ season, seriesList }: { season: number; seriesList: PostseasonSeries[] }) {
  const deepest = seriesList.reduce((best, s) => getRoundWeight(s.round) > getRoundWeight(best.round) ? s : best);
  const deepestInfo = ROUND_DISPLAY[deepest.round];
  const won = deepest.result === 'W' && deepest.round === 'WS';

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '4px 12px',
          backgroundColor: '#0a0f1a',
          borderBottom: '1px solid #1f2937',
        }}
      >
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>
          SEASON {season}
        </span>
        <span style={{ color: '#4b5563', fontSize: 9 }}>|</span>
        <span style={{ color: deepestInfo.color, fontSize: 9, fontWeight: 700 }}>
          {won ? 'CHAMPIONS' : `Eliminated: ${deepestInfo.full}`}
        </span>
      </div>
      {seriesList
        .sort((a, b) => getRoundWeight(a.round) - getRoundWeight(b.round))
        .map((s, i) => (
          <SeriesRow key={`${s.season}-${s.round}-${i}`} series={s} />
        ))}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */

export default function PostseasonHistoryView() {
  const { gameStarted } = useGameStore();
  const [data] = useState<PostseasonHistoryData>(() => generateDemoPostseasonHistory());
  const [roundFilter, setRoundFilter] = useState<'all' | PostseasonRound>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getPostseasonSummary(data);

  // Group series by season
  const bySeason: Record<number, PostseasonSeries[]> = {};
  for (const s of data.series) {
    if (roundFilter !== 'all' && s.round !== roundFilter) continue;
    if (!bySeason[s.season]) bySeason[s.season] = [];
    bySeason[s.season].push(s);
  }
  const seasons = Object.keys(bySeason)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <div style={{ padding: 16, fontFamily: 'monospace', color: '#e5e7eb', backgroundColor: '#030712' }}>
      {/* Header */}
      <div
        style={{
          margin: '-16px -16px 16px -16px',
          padding: '8px 32px',
          backgroundColor: '#111827',
          borderBottom: '1px solid #f59e0b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>
          POSTSEASON HISTORY
        </span>
        <span style={{ color: '#4b5563', fontSize: 10 }}>{data.teamName.toUpperCase()}</span>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'APPEARANCES', value: `${data.appearances}`, color: '#f59e0b' },
          { label: 'TITLES', value: `${data.titles}`, color: '#22c55e' },
          { label: 'SERIES WON', value: `${summary.seriesWins}`, color: '#4ade80' },
          { label: 'SERIES LOST', value: `${summary.seriesLosses}`, color: '#ef4444' },
          { label: 'WIN PCT', value: `${summary.winPct}%`, color: '#f59e0b' },
          { label: 'WS RECORD', value: summary.worldSeriesRecord, color: '#22c55e' },
        ].map(card => (
          <div
            key={card.label}
            style={{
              border: '1px solid #1f2937',
              padding: '8px 10px',
              textAlign: 'center',
              backgroundColor: '#111827',
            }}
          >
            <div style={{ color: '#6b7280', fontSize: 9, fontWeight: 700, marginBottom: 2 }}>{card.label}</div>
            <div style={{ color: card.color, fontWeight: 700, fontSize: 18 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Best run highlight */}
      <div
        style={{
          border: '1px solid rgba(34,197,94,0.3)',
          padding: '10px 16px',
          backgroundColor: 'rgba(34,197,94,0.05)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 2 }}>BEST POSTSEASON RUN</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#22c55e' }}>Season {data.bestRun.season}</span>
            <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700 }}>{data.bestRun.result}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 2 }}>LAST APPEARANCE</div>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#f59e0b' }}>Season {data.lastAppearance}</span>
        </div>
      </div>

      {/* Appearance timeline */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: '#6b7280', fontWeight: 700, marginBottom: 8 }}>POSTSEASON TIMELINE</div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end' }}>
          {Array.from({ length: data.lastAppearance }).map((_, i) => {
            const szn = i + 1;
            const sznSeries = data.series.filter(s => s.season === szn);
            const appeared = sznSeries.length > 0;
            const deepest = appeared
              ? sznSeries.reduce((best, s) => getRoundWeight(s.round) > getRoundWeight(best.round) ? s : best)
              : null;
            const height = deepest ? getRoundWeight(deepest.round) * 16 : 4;
            const color = deepest
              ? deepest.round === 'WS' && deepest.result === 'W'
                ? '#22c55e'
                : ROUND_DISPLAY[deepest.round].color
              : '#374151';

            return (
              <div key={szn} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <div
                  style={{
                    width: 24,
                    height,
                    backgroundColor: color,
                    borderRadius: 2,
                    opacity: appeared ? 0.8 : 0.2,
                  }}
                  title={appeared ? `S${szn}: ${deepest ? ROUND_DISPLAY[deepest.round].full : ''}` : `S${szn}: Missed`}
                />
                <span style={{ fontSize: 8, color: appeared ? '#9ca3af' : '#374151' }}>S{szn}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Round filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {(['all', 'WC', 'DS', 'CS', 'WS'] as const).map(f => {
          const isActive = roundFilter === f;
          return (
            <button
              key={f}
              onClick={() => setRoundFilter(f)}
              style={{
                padding: '3px 8px',
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'monospace',
                borderRadius: 3,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: isActive ? '#f59e0b' : '#1f2937',
                color: isActive ? '#030712' : '#9ca3af',
              }}
            >
              {f === 'all' ? 'ALL' : f}
            </button>
          );
        })}
      </div>

      {/* Series by season */}
      <div style={{ border: '1px solid #1f2937', backgroundColor: '#111827' }}>
        {/* Column headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 50px 36px 150px 50px 100px 1fr',
            padding: '6px 12px',
            borderBottom: '1px solid #1f2937',
            fontSize: 9,
            fontWeight: 700,
            color: '#6b7280',
            backgroundColor: '#0a0f1a',
          }}
        >
          <span>SZN</span>
          <span>ROUND</span>
          <span>W/L</span>
          <span>OPPONENT</span>
          <span style={{ textAlign: 'center' }}>GAMES</span>
          <span>RESULT</span>
          <span style={{ textAlign: 'right' }}>MVP</span>
        </div>

        <div style={{ maxHeight: '28rem', overflowY: 'auto' }}>
          {seasons.map(szn => (
            <SeasonGroup key={szn} season={szn} seriesList={bySeason[szn]} />
          ))}
        </div>
      </div>

      {/* Most common opponent */}
      <div
        style={{
          marginTop: 12,
          padding: '6px 12px',
          border: '1px solid #1f2937',
          backgroundColor: '#111827',
          fontSize: 10,
          color: '#6b7280',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>
          Most common opponent: <span style={{ color: '#f59e0b', fontWeight: 700 }}>{summary.mostCommonOpponent}</span>
        </span>
        <span>
          Total series played: <span style={{ color: '#d1d5db', fontWeight: 700 }}>{summary.totalSeries}</span>
        </span>
      </div>
    </div>
  );
}
