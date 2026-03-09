/**
 * useInSeasonFlow — Orchestrates month-by-month (chunked) season play.
 *
 * Progresses through 5 simulation segments with pause points for
 * roster management, All-Star Break, Trade Deadline, and September callups.
 *
 * Also supports granular simulation: sim 1 day, 1 week, or 1 month.
 */

import { useState, useCallback } from 'react';
import * as Comlink from 'comlink';
import { getEngine } from '../engine/engineClient';
import { useGameStore } from '../store/gameStore';
import { useLeagueStore } from '../store/leagueStore';
import { autoSave } from '../utils/autoSave';
import type { ChunkResult, PartialSeasonResult, SimRangeResult } from '../engine/sim/incrementalSimulator';
import type { SeasonResult } from '../types/league';
import type { StandingsRow } from '../types/league';

export type InSeasonEvent = 'roster_pause' | 'allstar' | 'deadline' | 'callups' | 'complete';

export interface InSeasonFlowState {
  // Current state
  currentSegment: number;          // -1 = not started, 0-4 = segment just completed
  chunkResult: ChunkResult | null; // Result from last simulated chunk
  partialResult: PartialSeasonResult | null;
  fullResult: SeasonResult | null; // Only set when season is finalized
  pendingEvent: InSeasonEvent | null;
  error: string | null;
  divisionStandings: StandingsRow[] | null;

  // Granular sim state
  currentDate: string | null;      // ISO date of next unplayed game
  lastRangeRecord: { wins: number; losses: number } | null;

  // Actions
  startSeason: () => Promise<void>;
  simNextChunk: () => Promise<void>;
  simAllRemaining: () => Promise<void>;
  continueAfterEvent: () => void;   // Dismiss event overlay, ready for next chunk
  getUserOverallRecord: () => { wins: number; losses: number };

  // Granular sim actions
  simDay: () => Promise<void>;
  simWeek: () => Promise<void>;
  simMonth: () => Promise<void>;
}

export function useInSeasonFlow(): InSeasonFlowState {
  const {
    userTeamId, season,
    setSimulating, setSimProgress,
    setGamePhase, setCurrentSegment: storeSetSegment,
    setInSeasonPaused, setSegmentUserRecord,
    setCurrentSeasonDate, setGamesCompleted, setTotalGames,
  } = useGameStore();

  const { setStandings } = useLeagueStore();

  const [currentSegment, setCurrentSegment] = useState(-1);
  const [chunkResult, setChunkResult] = useState<ChunkResult | null>(null);
  const [partialResult, setPartialResult] = useState<PartialSeasonResult | null>(null);
  const [fullResult, setFullResult] = useState<SeasonResult | null>(null);
  const [pendingEvent, setPendingEvent] = useState<InSeasonEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [divisionStandings, setDivisionStandings] = useState<StandingsRow[] | null>(null);
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [lastRangeRecord, setLastRangeRecord] = useState<{ wins: number; losses: number } | null>(null);

  /** Fetch standings from the engine and update stores */
  const refreshStandings = useCallback(async () => {
    try {
      const engine = getEngine();
      const standingsData = await engine.getStandings();
      setStandings(standingsData as any);
      setDivisionStandings((standingsData as any).standings ?? null);
    } catch { /* non-fatal */ }
  }, [setStandings]);

  /** Fetch current schedule info and update stores */
  const refreshScheduleInfo = useCallback(async () => {
    try {
      const engine = getEngine();
      const info = await engine.getCurrentScheduleInfo();
      setCurrentDate(info.currentDate);
      setCurrentSeasonDate(info.currentDate);
      setGamesCompleted(info.gamesCompleted);
      setTotalGames(info.totalGames);
    } catch { /* non-fatal */ }
  }, [setCurrentSeasonDate, setGamesCompleted, setTotalGames]);

  /** Start a new interactive season */
  const startSeason = useCallback(async () => {
    setError(null);
    setSimulating(true);
    setSimProgress(0);

    try {
      const engine = getEngine();
      const info = await engine.startInSeason();

      setGamePhase('in_season');
      setCurrentSegment(-1);
      storeSetSegment(-1);
      setInSeasonPaused(false);
      setChunkResult(null);
      setPartialResult(null);
      setFullResult(null);
      setPendingEvent(null);
      setLastRangeRecord(null);
      setTotalGames(info.totalGames);
      setGamesCompleted(0);

      // Fetch the starting date
      await refreshScheduleInfo();

      // Immediately sim the first chunk (April-May)
      setSimulating(false);
      await _doSimNextChunk();
    } catch (e) {
      setError(String(e));
      setSimulating(false);
    }
  }, [setSimulating, setSimProgress, setGamePhase, storeSetSegment, setInSeasonPaused, setTotalGames, setGamesCompleted, refreshScheduleInfo]);

  /** Internal: sim one chunk and process the result */
  const _doSimNextChunk = useCallback(async () => {
    setError(null);
    setSimulating(true);
    setSimProgress(0);

    try {
      const engine = getEngine();
      const result: any = await (engine as any).simNextChunk(
        Comlink.proxy((pct: number) => setSimProgress(pct)),
      );

      setChunkResult(result as any);
      setPartialResult(result.partialResult);
      setCurrentSegment(result.segment);
      storeSetSegment(result.segment);
      setSegmentUserRecord(result.userRecord);

      // Refresh standings and schedule info
      await refreshStandings();
      await refreshScheduleInfo();

      // Auto-save at each pause point
      autoSave(season, userTeamId);

      if (result.isSeasonComplete) {
        // Season is done — finalize
        const finalResult = await engine.finalizeSeason();
        setFullResult(finalResult as any);
        setPendingEvent('complete');
      } else {
        // Set the pending event based on chunk result
        setPendingEvent(result.event);
      }

      setInSeasonPaused(true);
      setSimProgress(1);
    } catch (e) {
      setError(String(e));
    } finally {
      setSimulating(false);
    }
  }, [setSimulating, setSimProgress, storeSetSegment, setInSeasonPaused, setSegmentUserRecord, refreshStandings, refreshScheduleInfo, season, userTeamId]);

  /** Sim the next chunk (called from UI button) */
  const simNextChunk = useCallback(async () => {
    await _doSimNextChunk();
  }, [_doSimNextChunk]);

  /** Fast-forward: sim all remaining chunks + finalize */
  const simAllRemaining = useCallback(async () => {
    setError(null);
    setSimulating(true);
    setSimProgress(0);

    try {
      const engine = getEngine();
      const finalResult: any = await (engine as any).simRemainingChunks(
        Comlink.proxy((pct: number) => setSimProgress(pct)),
      );

      setFullResult(finalResult as any);
      setCurrentSegment(4);
      storeSetSegment(4);
      setPendingEvent('complete');
      setInSeasonPaused(true);

      await refreshStandings();
      await refreshScheduleInfo();

      // Auto-save after fast sim completes
      autoSave(season, userTeamId);
    } catch (e) {
      setError(String(e));
    } finally {
      setSimulating(false);
      setSimProgress(1);
    }
  }, [setSimulating, setSimProgress, storeSetSegment, setInSeasonPaused, refreshStandings, refreshScheduleInfo, season, userTeamId]);

  // ── Granular simulation ───────────────────────────────────────────────────────

  /** Internal: sim a range of games by mode */
  const _doSimRange = useCallback(async (mode: 'day' | 'week' | 'month') => {
    setError(null);
    setSimulating(true);
    setSimProgress(0);

    try {
      const engine = getEngine();
      const result: any = await (engine as any).simRange(
        mode,
        Comlink.proxy((pct: number) => setSimProgress(pct)),
      );

      setPartialResult(result.partialResult);
      setLastRangeRecord(result.userRecord);
      setSegmentUserRecord(result.userRecord);

      // Update segment in store if a boundary was crossed
      if (result.crossedSegment !== null) {
        setCurrentSegment(result.crossedSegment);
        storeSetSegment(result.crossedSegment);
      }

      // Refresh standings and schedule info
      await refreshStandings();
      await refreshScheduleInfo();

      // Handle events
      if (result.isSeasonComplete) {
        const finalResult = await engine.finalizeSeason();
        setFullResult(finalResult as any);
        setPendingEvent('complete');
        setInSeasonPaused(true);
      } else if (result.crossedEvent) {
        setPendingEvent(result.crossedEvent as InSeasonEvent);
        setInSeasonPaused(true);
      }
      // If no event was crossed, don't set pendingEvent — user keeps simming

      setSimProgress(1);
    } catch (e) {
      setError(String(e));
    } finally {
      setSimulating(false);
    }
  }, [setSimulating, setSimProgress, storeSetSegment, setInSeasonPaused, setSegmentUserRecord, refreshStandings, refreshScheduleInfo]);

  const simDay = useCallback(() => _doSimRange('day'), [_doSimRange]);
  const simWeek = useCallback(() => _doSimRange('week'), [_doSimRange]);
  const simMonth = useCallback(() => _doSimRange('month'), [_doSimRange]);

  /** Dismiss event overlay and prepare for next action */
  const continueAfterEvent = useCallback(() => {
    setPendingEvent(null);
    // If the season is complete, transition to postseason
    if (fullResult) {
      setGamePhase('postseason');
    }
  }, [fullResult, setGamePhase]);

  /** Get the user's overall record from the partial result */
  const getUserOverallRecord = useCallback((): { wins: number; losses: number } => {
    if (!partialResult) return { wins: 0, losses: 0 };
    const ts = partialResult.teamSeasons.find(t => t.teamId === userTeamId);
    return { wins: ts?.record.wins ?? 0, losses: ts?.record.losses ?? 0 };
  }, [partialResult, userTeamId]);

  return {
    currentSegment,
    chunkResult,
    partialResult,
    fullResult,
    pendingEvent,
    error,
    divisionStandings,
    currentDate,
    lastRangeRecord,
    startSeason,
    simNextChunk,
    simAllRemaining,
    continueAfterEvent,
    getUserOverallRecord,
    simDay,
    simWeek,
    simMonth,
  };
}
