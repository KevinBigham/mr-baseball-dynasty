/**
 * MFSNPanel.tsx — MFSN Pre-Season Predictions + Post-Season Resolution
 *
 * Shows two views:
 *   PRE-SEASON: Analyst win total projections for all 30 teams, with
 *               playoff odds, WS odds, and analyst quotes. User team highlighted.
 *   POST-SEASON: Same panel with actual win totals overlaid + HIT/MISS badges.
 */

import { useState } from 'react';
import { type TeamPrediction, type MFSNReport, gradeReportAccuracy } from '../../engine/predictions';

// ─── Single team row ──────────────────────────────────────────────────────────

function PredRow({
  pred,
  rank,
  isUser,
  resolved,
}: {
  pred:     TeamPrediction;
  rank:     number;
  isUser:   boolean;
  resolved: boolean;
}) {
  const [showQuote, setShowQuote] = useState(false);

  const delta = pred.actualWins != null ? pred.actualWins - pred.predictedWins : null;

  const hitColor = pred.hit === true  ? '#4ade80'
                 : pred.hit === false ? '#ef4444'
                 : '#6b7280';

  return (
    <div
      className="flex items-center gap-2 py-1.5 text-xs border-b border-gray-800 last:border-0 cursor-pointer transition-colors"
      style={{ background: isUser ? 'rgba(249,115,22,0.04)' : undefined }}
      onClick={() => setShowQuote(s => !s)}
    >
      {/* Rank */}
      <div className="w-5 shrink-0 text-gray-700 tabular-nums text-right">{rank}</div>

      {/* Abbr */}
      <div
        className="font-black w-10 shrink-0 tabular-nums"
        style={{ color: isUser ? '#f97316' : '#d1d5db' }}
      >
        {pred.teamAbbr}
        {isUser && <span className="text-orange-700 ml-0.5">★</span>}
      </div>

      {/* Predicted wins */}
      <div className="w-10 shrink-0 font-mono tabular-nums font-bold text-gray-300">
        {pred.predictedWins}
      </div>

      {/* Playoff odds bar */}
      <div className="flex-1 min-w-0">
        <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pred.playoffOdds}%`,
              background: pred.playoffOdds >= 70 ? '#4ade80'
                        : pred.playoffOdds >= 40 ? '#fbbf24'
                        : '#6b7280',
            }}
          />
        </div>
      </div>

      {/* Playoff % */}
      <div className="w-10 shrink-0 text-right tabular-nums text-gray-500">
        {pred.playoffOdds}%
      </div>

      {/* Post-season result */}
      {resolved && pred.actualWins != null ? (
        <div className="w-20 shrink-0 flex items-center justify-end gap-1">
          <span className="tabular-nums font-mono text-gray-300">{pred.actualWins}W</span>
          {delta !== null && (
            <span className="tabular-nums font-mono" style={{ color: delta >= 0 ? '#4ade80' : '#ef4444' }}>
              ({delta >= 0 ? '+' : ''}{delta})
            </span>
          )}
          {pred.hit !== null && (
            <span className="font-black" style={{ color: hitColor }}>
              {pred.hit ? '✓' : '✗'}
            </span>
          )}
        </div>
      ) : (
        <div className="w-20 shrink-0 text-right text-gray-700">
          WS {pred.wsOdds}%
        </div>
      )}

      {/* Expand quote */}
      {showQuote && (
        <div
          className="absolute left-0 right-0 mt-8 px-4 py-2 text-gray-400 text-xs italic border-t border-gray-800"
          style={{ background: '#0a0a0f' }}
        >
          <span className="text-gray-600 not-italic">{pred.analystName}: </span>
          "{pred.analystQuote}"
        </div>
      )}
    </div>
  );
}

// ─── League section ───────────────────────────────────────────────────────────

function LeagueSection({
  league,
  predictions,
  userTeamId,
  resolved,
  startRank,
}: {
  league:      string;
  predictions: TeamPrediction[];
  userTeamId:  number;
  resolved:    boolean;
  startRank:   number;
}) {
  if (predictions.length === 0) return null;

  return (
    <div>
      <div className="text-gray-600 text-xs uppercase tracking-widest px-1 mb-1">{league}</div>
      {predictions.map((pred, i) => (
        <PredRow
          key={pred.teamId}
          pred={pred}
          rank={startRank + i}
          isUser={pred.teamId === userTeamId}
          resolved={resolved}
        />
      ))}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function MFSNPanel({
  report,
  userTeamId,
}: {
  report:     MFSNReport;
  userTeamId: number;
}) {
  const [league,   setLeague]   = useState<'ALL' | 'AL' | 'NL'>('ALL');
  const [showAll,  setShowAll]  = useState(false);

  const accuracy = gradeReportAccuracy(report);

  // Sorted by predicted wins descending (already sorted in generation)
  const filtered = league === 'ALL'
    ? report.predictions
    : report.predictions.filter(p => p.league === league);

  const displayed = showAll ? filtered : filtered.slice(0, 10);

  const alPreds = report.predictions.filter(p => p.league === 'AL');
  const nlPreds = report.predictions.filter(p => p.league === 'NL');

  const userPred = report.predictions.find(p => p.teamId === userTeamId);
  const userRank = report.predictions.findIndex(p => p.teamId === userTeamId) + 1;

  return (
    <div className="bloomberg-border bg-gray-900">
      {/* Header */}
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>
          📺 MFSN — {report.resolved ? 'PREDICTION RESULTS' : `${report.season} SEASON PREVIEW`}
        </span>
        {report.resolved && (
          <span className="normal-case font-normal text-xs" style={{ color: accuracy.color }}>
            {accuracy.label} · {accuracy.pct}% accuracy
          </span>
        )}
      </div>

      {/* User team callout */}
      {userPred && (
        <div
          className="mx-4 mt-3 px-3 py-2 rounded-lg flex items-center gap-3"
          style={{ background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.20)' }}
        >
          <div className="text-orange-500 font-black text-sm">{userPred.teamAbbr}</div>
          <div className="flex-1 text-xs">
            <span className="text-gray-400">MFSN projects </span>
            <span className="text-orange-400 font-bold">{userPred.predictedWins} wins</span>
            <span className="text-gray-400"> · #{userRank} overall · {userPred.playoffOdds}% playoff</span>
            {report.resolved && userPred.actualWins != null && (
              <span
                className="ml-2 font-bold"
                style={{ color: userPred.hit ? '#4ade80' : '#ef4444' }}
              >
                → {userPred.actualWins}W actual {userPred.hit ? '✓ HIT' : '✗ MISS'}
              </span>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-gray-600 text-xs">WS ODDS</div>
            <div className="text-orange-400 font-bold tabular-nums">{userPred.wsOdds}%</div>
          </div>
        </div>
      )}

      {/* Quote for user team */}
      {userPred && (
        <div className="mx-4 mt-1.5 mb-1 text-gray-600 text-xs italic">
          <span className="text-gray-700 not-italic">{userPred.analystName}: </span>
          "{userPred.analystQuote}"
        </div>
      )}

      {/* League filter */}
      <div className="px-4 pt-2 flex gap-2">
        {(['ALL', 'AL', 'NL'] as const).map(l => (
          <button
            key={l}
            onClick={() => setLeague(l)}
            className="text-xs px-3 py-1 uppercase tracking-wider transition-colors"
            style={{
              background:  league === l ? '#f97316' : 'transparent',
              color:       league === l ? '#000' : '#6b7280',
              borderRadius: 4,
              border: `1px solid ${league === l ? '#f97316' : '#374151'}`,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-2 px-4 pt-2 pb-1 text-xs text-gray-700 uppercase tracking-wider border-b border-gray-800">
        <div className="w-5 shrink-0 text-right">#</div>
        <div className="w-10 shrink-0">TM</div>
        <div className="w-10 shrink-0">PRED</div>
        <div className="flex-1">PLAYOFF ODDS</div>
        <div className="w-10 shrink-0 text-right">PO%</div>
        <div className="w-20 shrink-0 text-right">{report.resolved ? 'ACTUAL' : 'WS%'}</div>
      </div>

      {/* Team rows — split by league if viewing ALL */}
      <div className="px-4 py-1">
        {league === 'ALL' ? (
          <div className="space-y-3">
            <LeagueSection
              league="American League"
              predictions={alPreds}
              userTeamId={userTeamId}
              resolved={report.resolved}
              startRank={1}
            />
            <LeagueSection
              league="National League"
              predictions={nlPreds}
              userTeamId={userTeamId}
              resolved={report.resolved}
              startRank={alPreds.length + 1}
            />
          </div>
        ) : (
          <>
            {displayed.map((pred, i) => (
              <PredRow
                key={pred.teamId}
                pred={pred}
                rank={i + 1}
                isUser={pred.teamId === userTeamId}
                resolved={report.resolved}
              />
            ))}
            {filtered.length > 10 && (
              <button
                onClick={() => setShowAll(s => !s)}
                className="mt-2 text-gray-700 hover:text-orange-500 text-xs uppercase tracking-wider transition-colors w-full text-center"
              >
                {showAll ? '▲ Show Less' : `▼ Show All ${filtered.length}`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Resolution summary */}
      {report.resolved && (
        <div className="px-4 py-2 border-t border-gray-800 flex gap-4 text-xs text-gray-500">
          <span>
            <span className="text-green-400 font-bold">
              {report.predictions.filter(p => p.hit === true).length}
            </span>{' '}
            hits (±5W)
          </span>
          <span>
            <span className="text-red-400 font-bold">
              {report.predictions.filter(p => p.hit === false).length}
            </span>{' '}
            misses
          </span>
          <span style={{ color: accuracy.color }} className="ml-auto font-bold">
            MFSN: {accuracy.label}
          </span>
        </div>
      )}
    </div>
  );
}
