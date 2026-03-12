/**
 * InSeasonDashboard — Main UI during interactive (chunked) season play.
 * Shows season progress, monthly recap, division standings, and action buttons.
 * Includes granular sim controls: sim 1 day, 1 week, 1 month.
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import SeasonProgressBar from './SeasonProgressBar';
import MonthRecap from './MonthRecap';
import PennantRace from './PennantRace';
import MidSeasonFAPanel from './MidSeasonFAPanel';
import type { InSeasonFlowState } from '../../hooks/useInSeasonFlow';

const NEXT_SEGMENT_LABELS = ['SIM JUNE', 'SIM JULY', 'SIM AUGUST', 'SIM SEPTEMBER', 'FINALIZE'];

/** Format ISO date string to display format: "Apr 15, 2026" */
function formatSeasonDate(iso: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parts = iso.split('-');
  const month = months[Number(parts[1]) - 1] ?? '';
  const day = Number(parts[2]);
  return `${month} ${day}, ${parts[0]}`;
}

interface Props {
  flow: InSeasonFlowState;
}

export default function InSeasonDashboard({ flow }: Props) {
  const { userTeamId, isSimulating, simProgress, season, gamesCompleted, totalGames } = useGameStore();
  const { setActiveTab } = useUIStore();
  const [showFAPanel, setShowFAPanel] = useState(false);

  const {
    currentSegment, chunkResult, partialResult, pendingEvent,
    simNextChunk, simAllRemaining, continueAfterEvent,
    getUserOverallRecord, error,
    currentDate, lastRangeRecord,
    simDay, simWeek, simMonth,
  } = flow;

  const overallRecord = getUserOverallRecord();
  const nextSegmentLabel = currentSegment >= 0 && currentSegment < 4
    ? NEXT_SEGMENT_LABELS[currentSegment]
    : currentSegment >= 4
    ? 'SEASON COMPLETE'
    : 'SIM APRIL–MAY';

  return (
    <div className="space-y-4">
      {/* Season Progress Bar */}
      <SeasonProgressBar
        completedSegment={currentSegment}
        isSimulating={isSimulating}
        gamesCompleted={gamesCompleted}
        totalGames={totalGames}
      />

      {/* Sim Progress Indicator */}
      {isSimulating && (
        <div className="bloomberg-border bg-gray-900 px-4 py-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-orange-400 text-xs font-bold tracking-widest animate-pulse">
              SIMULATING...
            </span>
            <span className="text-gray-500 text-xs tabular-nums">
              {Math.round(simProgress * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${Math.round(simProgress * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bloomberg-border bg-red-950 px-4 py-2 text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Monthly Recap (after at least one chunk or range sim is done) */}
      {!isSimulating && partialResult && (chunkResult || lastRangeRecord) && (
        <MonthRecap
          segment={currentSegment}
          partialResult={partialResult}
          userTeamId={userTeamId}
          chunkRecord={chunkResult?.userRecord ?? lastRangeRecord ?? { wins: 0, losses: 0 }}
          divisionStandings={flow.divisionStandings}
        />
      )}

      {/* Pennant Race (after at least one chunk) */}
      {!isSimulating && currentSegment >= 0 && !pendingEvent && (
        <PennantRace />
      )}

      {/* Event overlays */}
      {!isSimulating && pendingEvent === 'allstar' && (
        <div className="bloomberg-border bg-gray-900">
          <div className="bloomberg-header px-4 flex items-center justify-between">
            <span>ALL-STAR BREAK</span>
            <span className="text-yellow-500 font-normal text-xs">Mid-Season Event</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-center">
              <div className="text-orange-400 text-sm font-bold tracking-wider">
                MR. BASEBALL MIDSUMMER CLASSIC
              </div>
              <div className="text-gray-500 text-xs mt-1">
                The first half is in the books. Your team is {overallRecord.wins}–{overallRecord.losses}.
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Use this break to make roster adjustments before the second half.
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setActiveTab('roster')}
                className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-4 py-2 uppercase tracking-wider transition-colors"
              >
                ROSTER MOVES
              </button>
              <button
                onClick={() => { continueAfterEvent(); simNextChunk(); }}
                className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs px-6 py-2 uppercase tracking-widest transition-colors"
              >
                CONTINUE TO SECOND HALF
              </button>
            </div>
          </div>
        </div>
      )}

      {!isSimulating && pendingEvent === 'deadline' && (
        <div className="bloomberg-border bg-gray-900">
          <div className="bloomberg-header px-4 flex items-center justify-between">
            <span>TRADE DEADLINE</span>
            <span className="text-red-500 font-normal text-xs">Deadline Approaching</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-center">
              <div className="text-orange-400 text-sm font-bold tracking-wider">
                JULY 31 — TRADE DEADLINE
              </div>
              <div className="text-gray-500 text-xs mt-1">
                {overallRecord.wins > overallRecord.losses
                  ? 'You\'re in the hunt. Time to make a move to bolster the roster.'
                  : 'The season hasn\'t gone as planned. Consider selling for the future.'}
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setActiveTab('roster')}
                className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-4 py-2 uppercase tracking-wider transition-colors"
              >
                ROSTER MOVES
              </button>
              <button
                onClick={() => { continueAfterEvent(); simNextChunk(); }}
                className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs px-6 py-2 uppercase tracking-widest transition-colors"
              >
                CONTINUE TO AUGUST
              </button>
            </div>
          </div>
        </div>
      )}

      {!isSimulating && pendingEvent === 'callups' && (
        <div className="bloomberg-border bg-gray-900">
          <div className="bloomberg-header px-4 flex items-center justify-between">
            <span>SEPTEMBER</span>
            <span className="text-blue-500 font-normal text-xs">Stretch Run</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-center">
              <div className="text-orange-400 text-sm font-bold tracking-wider">
                SEPTEMBER STRETCH RUN
              </div>
              <div className="text-gray-500 text-xs mt-1">
                The pennant race is heating up. Review your roster and call up reinforcements.
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setActiveTab('roster')}
                className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-4 py-2 uppercase tracking-wider transition-colors"
              >
                ROSTER MOVES
              </button>
              <button
                onClick={() => { continueAfterEvent(); simNextChunk(); }}
                className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs px-6 py-2 uppercase tracking-widest transition-colors"
              >
                SIM SEPTEMBER
              </button>
            </div>
          </div>
        </div>
      )}

      {!isSimulating && pendingEvent === 'complete' && (
        <div className="bloomberg-border bg-gray-900">
          <div className="bloomberg-header px-4 flex items-center justify-between">
            <span>SEASON COMPLETE</span>
            <span className="text-green-500 font-normal text-xs">Final Results</span>
          </div>
          <div className="p-4 space-y-3">
            <div className="text-center">
              <div className="text-orange-400 text-sm font-bold tracking-wider">
                {season} REGULAR SEASON — FINAL
              </div>
              <div className="text-gray-200 text-lg font-bold tabular-nums mt-2">
                {overallRecord.wins}–{overallRecord.losses}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                The regular season is complete. Time for playoffs and the offseason.
              </div>
            </div>
            <div className="flex justify-center">
              <button
                onClick={continueAfterEvent}
                className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs px-8 py-3 uppercase tracking-widest transition-colors"
              >
                CONTINUE TO POSTSEASON
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Granular Sim Controls + Segment Buttons (shown when not simulating, no pending event) */}
      {!isSimulating && !pendingEvent && (
        <div className="bloomberg-border bg-gray-900">
          <div className="bloomberg-header px-4 flex items-center justify-between">
            <span>SIMULATION</span>
            <span className="text-gray-500 font-normal text-xs tabular-nums">
              {currentDate ? formatSeasonDate(currentDate) : `Season ${season}`}
              {totalGames > 0 && ` | Game ${gamesCompleted} of ${totalGames}`}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {/* Record display */}
            {partialResult && (
              <div className="text-center">
                <span className="text-gray-200 text-sm font-bold tabular-nums">
                  {overallRecord.wins}–{overallRecord.losses}
                </span>
              </div>
            )}

            {/* Granular controls */}
            <div className="flex gap-2 justify-center flex-wrap">
              <button
                onClick={simDay}
                className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs px-3 py-2 sm:px-5 uppercase tracking-widest transition-colors"
              >
                SIM 1 DAY
              </button>
              <button
                onClick={simWeek}
                className="border border-orange-600 hover:border-orange-400 text-orange-500 hover:text-orange-300 font-bold text-xs px-3 py-2 sm:px-5 uppercase tracking-widest transition-colors"
              >
                SIM 1 WEEK
              </button>
              <button
                onClick={simMonth}
                className="border border-orange-600 hover:border-orange-400 text-orange-500 hover:text-orange-300 font-bold text-xs px-3 py-2 sm:px-5 uppercase tracking-widest transition-colors"
              >
                SIM 1 MONTH
              </button>
            </div>

            {/* Segment + fast-forward controls */}
            <div className="flex gap-2 justify-center flex-wrap pt-1 border-t border-gray-800">
              <button
                onClick={() => setActiveTab('roster')}
                className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-3 py-2 sm:px-4 uppercase tracking-wider transition-colors"
              >
                ROSTER MOVES
              </button>
              <button
                onClick={() => setShowFAPanel(true)}
                className="border border-gray-700 hover:border-green-500 text-gray-400 hover:text-green-400 text-xs px-3 py-2 sm:px-4 uppercase tracking-wider transition-colors"
              >
                FREE AGENTS
              </button>
              <button
                onClick={() => { useUIStore.getState().setRosterViewMode('depth'); setActiveTab('roster'); }}
                className="border border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-400 text-xs px-3 py-2 sm:px-4 uppercase tracking-wider transition-colors"
              >
                EDIT LINEUP
              </button>
              <button
                onClick={simNextChunk}
                className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-3 py-2 sm:px-4 uppercase tracking-wider transition-colors"
              >
                {nextSegmentLabel}
              </button>
              <button
                onClick={simAllRemaining}
                className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-3 py-2 sm:px-4 uppercase tracking-wider transition-colors"
              >
                FAST SIM ALL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons (shown when paused at roster_pause from segment sim) */}
      {!isSimulating && pendingEvent === 'roster_pause' && (
        <div className="bloomberg-border bg-gray-900 px-4 py-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-gray-500 text-xs">
              Make roster moves or continue to the next month.
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setActiveTab('roster')}
                className="border border-gray-700 hover:border-orange-500 text-gray-400 hover:text-orange-400 text-xs px-3 py-2 sm:px-4 uppercase tracking-wider transition-colors"
              >
                ROSTER MOVES
              </button>
              <button
                onClick={() => { useUIStore.getState().setRosterViewMode('depth'); setActiveTab('roster'); }}
                className="border border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-400 text-xs px-3 py-2 sm:px-4 uppercase tracking-wider transition-colors"
              >
                EDIT LINEUP
              </button>
              <button
                onClick={() => { continueAfterEvent(); simNextChunk(); }}
                className="bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs px-4 py-2 sm:px-6 uppercase tracking-widest transition-colors"
              >
                {nextSegmentLabel}
              </button>
              <button
                onClick={() => { continueAfterEvent(); simAllRemaining(); }}
                className="border border-orange-800 hover:border-orange-500 text-orange-700 hover:text-orange-400 text-xs px-4 py-2 uppercase tracking-wider transition-colors"
              >
                FAST SIM ALL
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Mid-Season Free Agent Panel */}
      {showFAPanel && <MidSeasonFAPanel onClose={() => setShowFAPanel(false)} />}
    </div>
  );
}
