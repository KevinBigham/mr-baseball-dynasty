/**
 * useOffseasonFlow — Phase-aware offseason state machine.
 *
 * Progresses through 7 phases:
 *   arbitration → waivers → annual_draft → rule5 → free_agency → trading → summary
 */

import { useState, useCallback } from 'react';
import { getEngine } from '../engine/engineClient';
import { useGameStore } from '../store/gameStore';
import { saveGame } from '../db/schema';
import { getTeamName } from '../data/teamOptions';
import type { AISigningRecord } from '../engine/freeAgency';
import type { UserTransaction } from '../components/offseason/OffseasonSummary';
import type { ArbitrationCase } from '../engine/finances';
import type { WaiverClaim } from '../engine/waivers';
import type { Rule5Selection } from '../engine/draft/rule5Draft';
import {
  type OffseasonPhase,
  OFFSEASON_PHASE_ORDER,
} from '../types/offseason';

export interface OffseasonFlowState {
  currentPhase: OffseasonPhase;
  arbitrationCases: ArbitrationCase[];
  waiverClaims: WaiverClaim[];
  draftedCount: number;
  rule5Selections: Rule5Selection[];
  aiSigningDetails: AISigningRecord[];
  offseasonTxLog: UserTransaction[];
  enterOffseason: () => Promise<void>;
  advanceToNextPhase: () => Promise<void>;
  setDraftedCount: (n: number) => void;
  finishOffseason: () => Promise<void>;
  logOffseasonTx: (tx: UserTransaction) => void;
}

export function useOffseasonFlow(onClearSim: () => void): OffseasonFlowState {
  const { season, userTeamId, setGamePhase } = useGameStore();

  const [currentPhase, setCurrentPhase] = useState<OffseasonPhase>('arbitration');
  const [arbitrationCases, setArbitrationCases] = useState<ArbitrationCase[]>([]);
  const [waiverClaims, setWaiverClaims] = useState<WaiverClaim[]>([]);
  const [draftedCount, setDraftedCount] = useState(0);
  const [rule5Selections, setRule5Selections] = useState<Rule5Selection[]>([]);
  const [aiSigningDetails, setAiSigningDetails] = useState<AISigningRecord[]>([]);
  const [offseasonTxLog, setOffseasonTxLog] = useState<UserTransaction[]>([]);

  /** Start offseason: call engine, fetch arb cases, enter first phase */
  const enterOffseason = useCallback(async () => {
    const engine = getEngine();
    await engine.startOffseason();
    const cases = await engine.getArbitrationCases();
    setArbitrationCases(cases);
    setCurrentPhase('arbitration');
    setGamePhase('offseason');
  }, [setGamePhase]);

  /** Advance to the next offseason phase, running side-effects on transition */
  const advanceToNextPhase = useCallback(async () => {
    const engine = getEngine();
    const idx = OFFSEASON_PHASE_ORDER.indexOf(currentPhase);
    const nextPhase = OFFSEASON_PHASE_ORDER[idx + 1];

    if (!nextPhase) return; // already at summary

    // Side-effects when leaving a phase
    if (currentPhase === 'arbitration') {
      // Arb cases already resolved individually via resolveArbitrationCase()
    }

    if (currentPhase === 'waivers') {
      // Waivers are processed when entering the phase; nothing to do leaving
    }

    // Side-effects when entering a phase
    if (nextPhase === 'waivers') {
      const claims = await engine.processWaivers();
      setWaiverClaims(claims);
    }

    if (nextPhase === 'rule5') {
      // Rule 5 panel handles fetching eligible + conducting draft itself
    }

    if (nextPhase === 'summary') {
      // Finalize: AI signings
      const result = await engine.finishOffseason();
      setAiSigningDetails(result.signingDetails);
    }

    setCurrentPhase(nextPhase);
  }, [currentPhase]);

  /** Leave summary → preseason, auto-save */
  const finishOffseason = useCallback(async () => {
    setGamePhase('preseason');
    onClearSim();

    // Reset all phase state
    setCurrentPhase('arbitration');
    setArbitrationCases([]);
    setWaiverClaims([]);
    setDraftedCount(0);
    setRule5Selections([]);
    setAiSigningDetails([]);
    setOffseasonTxLog([]);

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
    currentPhase,
    arbitrationCases,
    waiverClaims,
    draftedCount,
    rule5Selections,
    aiSigningDetails,
    offseasonTxLog,
    enterOffseason,
    advanceToNextPhase,
    setDraftedCount,
    finishOffseason,
    logOffseasonTx,
  };
}
