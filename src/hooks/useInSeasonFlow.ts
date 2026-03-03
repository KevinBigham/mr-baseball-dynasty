/**
 * useInSeasonFlow — Orchestrates month-by-month (chunked) season play.
 *
 * Progresses through 5 simulation segments with pause points for
 * roster management, All-Star Break, Trade Deadline, and September callups.
 */

import { useState, useCallback } from 'react';
import * as Comlink from 'comlink';
import { getEngine } from '../engine/engineClient';
import { useGameStore } from '../store/gameStore';
import { useLeagueStore } from '../store/leagueStore';
import type { ChunkResult, PartialSeasonResult } from '../engine/sim/incrementalSimulator';
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

  // Actions
  startSeason: () => Promise<void>;
  simNextChunk: () => Promise<void>;
  simAllRemaining: () => Promise<void>;
  continueAfterEvent: () => void;   // Dismiss event overlay, ready for next chunk
  getUserOverallRecord: () => { wins: number; losses: number };
}

export function useInSeasonFlow(): InSeasonFlowState {
  const {
    userTeamId,
    setSimulating, setSimProgress,
    setGamePhase, setCurrentSegment: storeSetSegment,
    setInSeasonPaused, setSegmentUserRecord,
  } = useGameStore();

  const { setStandings } = useLeagueStore();

  const [currentSegment, setCurrentSegment] = useState(-1);
  const [chunkResult, setChunkResult] = useState<ChunkResult | null>(null);
  const [partialResult, setPartialResult] = useState<PartialSeasonResult | null>(null);
  const [fullResult, setFullResult] = useState<SeasonResult | null>(null);
  const [pendingEvent, setPendingEvent] = useState<InSeasonEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [divisionStandings, setDivisionStandings] = useState<StandingsRow[] | null>(null);

  /** Fetch standings from the engine and update stores */
  const refreshStandings = useCallback(async () => {
    try {
      const engine = getEngine();
      const standingsData = await engine.getStandings();
      setStandings(standingsData);
      setDivisionStandings(standingsData.standings ?? null);
    } catch { /* non-fatal */ }
  }, [setStandings]);

  /** Start a new interactive season */
  const startSeason = useCallback(async () => {
    setError(null);
    setSimulating(true);
    setSimProgress(0);

    try {
      const engine = getEngine();
      await engine.startInSeason();

      setGamePhase('in_season');
      setCurrentSegment(-1);
      storeSetSegment(-1);
      setInSeasonPaused(false);
      setChunkResult(null);
      setPartialResult(null);
      setFullResult(null);
      setPendingEvent(null);

      // Immediately sim the first chunk (April-May)
      setSimulating(false);
      await _doSimNextChunk();
    } catch (e) {
      setError(String(e));
      setSimulating(false);
    }
  }, [setSimulating, setSimProgress, setGamePhase, storeSetSegment, setInSeasonPaused]);

  /** Internal: sim one chunk and process the result */
  const _doSimNextChunk = useCallback(async () => {
    setError(null);
    setSimulating(true);
    setSimProgress(0);

    try {
      const engine = getEngine();
      const result = await engine.simNextChunk(
        Comlink.proxy((pct: number) => setSimProgress(pct)),
      );

      setChunkResult(result);
      setPartialResult(result.partialResult);
      setCurrentSegment(result.segment);
      storeSetSegment(result.segment);
      setSegmentUserRecord(result.userRecord);

      // Refresh standings
      await refreshStandings();

      if (result.isSeasonComplete) {
        // Season is done — finalize
        const finalResult = await engine.finalizeSeason();
        setFullResult(finalResult);
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
  }, [setSimulating, setSimProgress, storeSetSegment, setInSeasonPaused, setSegmentUserRecord, refreshStandings]);

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
      const finalResult = await engine.simRemainingChunks(
        Comlink.proxy((pct: number) => setSimProgress(pct)),
      );

      setFullResult(finalResult);
      setCurrentSegment(4);
      storeSetSegment(4);
      setPendingEvent('complete');
      setInSeasonPaused(true);

      await refreshStandings();
    } catch (e) {
      setError(String(e));
    } finally {
      setSimulating(false);
      setSimProgress(1);
    }
  }, [setSimulating, setSimProgress, storeSetSegment, setInSeasonPaused, refreshStandings]);

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
    startSeason,
    simNextChunk,
    simAllRemaining,
    continueAfterEvent,
    getUserOverallRecord,
  };
}
