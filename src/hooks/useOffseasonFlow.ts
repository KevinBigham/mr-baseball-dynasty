/**
 * useOffseasonFlow — extracts offseason callbacks and state from Dashboard.
 */

import { useState, useCallback } from 'react';
import { getEngine } from '../engine/engineClient';
import { useGameStore } from '../store/gameStore';
import { saveGame } from '../db/schema';
import { getTeamName } from '../data/teamOptions';
import type { AISigningRecord } from '../engine/freeAgency';
import type { UserTransaction } from '../components/offseason/OffseasonSummary';

export function useOffseasonFlow(onClearSim: () => void) {
  const { season, userTeamId, setGamePhase } = useGameStore();

  const [offseasonTxLog,       setOffseasonTxLog]       = useState<UserTransaction[]>([]);
  const [showOffseasonSummary, setShowOffseasonSummary] = useState(false);
  const [aiSigningDetails,     setAiSigningDetails]     = useState<AISigningRecord[]>([]);

  const enterOffseason = useCallback(async () => {
    const engine = getEngine();
    await engine.startOffseason();
    setGamePhase('offseason');
  }, [setGamePhase]);

  const advanceOffseason = useCallback(async () => {
    const engine = getEngine();
    const result = await engine.finishOffseason();
    setAiSigningDetails(result.signingDetails);
    setShowOffseasonSummary(true);
  }, []);

  const finishOffseason = useCallback(async () => {
    setGamePhase('preseason');
    onClearSim();
    setShowOffseasonSummary(false);
    setOffseasonTxLog([]);
    setAiSigningDetails([]);

    // Auto-save after offseason
    try {
      const engine = getEngine();
      const state = await engine.getFullState();
      if (state) {
        const teamName = getTeamName(userTeamId);
        await saveGame(state, `${teamName} — S${season}`, teamName);
      }
    } catch { /* non-fatal */ }
  }, [setGamePhase, userTeamId, season, onClearSim]);

  const logOffseasonTx = useCallback((tx: UserTransaction) => {
    setOffseasonTxLog(prev => [...prev, tx]);
  }, []);

  return {
    offseasonTxLog, showOffseasonSummary, aiSigningDetails,
    enterOffseason, advanceOffseason, finishOffseason, logOffseasonTx,
  };
}
