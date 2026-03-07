/**
 * Engine Bridge — Main thread interface to the Web Worker
 *
 * Creates the worker, wraps it with Comlink, and provides
 * a typed API for React components to call.
 */

import * as Comlink from 'comlink';
import type {
  WorkerAPI,
  DeterminismProbeReport,
  DraftBoardListing,
  DraftPickResponse,
  DiagnosticsSnapshot,
  FeatureReadinessReport,
  IntegrityAuditReport,
  IntakeAuditReport,
  LatencyBudgetReport,
  PlayableReadinessReport,
  SoakSimulationMode,
  SoakSimulationReport,
  SmokeFlowReport,
} from './worker.ts';
import type { IntakePack } from '../features/catalog.ts';
import type { ActivityIntelQuery, ActivityIntelResponse } from '../components/roster/activityIntel.ts';

let engine: Comlink.Remote<WorkerAPI> | null = null;

export interface RuntimeGuardFailure {
  ok: false;
  reason: string;
  code: string;
}

export interface RuntimeGuardSuccess<T> {
  ok: true;
  data: T;
}

export type RuntimeGuardResult<T> = RuntimeGuardSuccess<T> | RuntimeGuardFailure;

export function getEngine(): Comlink.Remote<WorkerAPI> {
  if (!engine) {
    const worker = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' },
    );
    engine = Comlink.wrap<WorkerAPI>(worker);
  }
  return engine;
}

export async function guardedWorkerCall<T>(
  code: string,
  call: () => Promise<T>,
): Promise<RuntimeGuardResult<T>> {
  try {
    const data = await call();
    return { ok: true, data };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { ok: false, reason, code };
  }
}

export async function getLeagueActivityIntel(query: ActivityIntelQuery): Promise<ActivityIntelResponse> {
  return getEngine().getLeagueActivityIntel(query);
}

export async function getLeagueActivityIntelSafe(
  query: ActivityIntelQuery,
): Promise<RuntimeGuardResult<ActivityIntelResponse>> {
  return guardedWorkerCall('activity-intel-failed', () => getEngine().getLeagueActivityIntel(query));
}

export function __setEngineForTests(mock: Comlink.Remote<WorkerAPI> | null): void {
  engine = mock;
}

export type SimulateCurrentSeasonResult = Awaited<ReturnType<WorkerAPI['simulateCurrentSeason']>>;
export type AdvanceSeasonResult = Awaited<ReturnType<WorkerAPI['advanceSeason']>>;
export type SaveGameToSlotResult = Awaited<ReturnType<WorkerAPI['saveGameToSlot']>>;
export type LoadGameFromSlotResult = Awaited<ReturnType<WorkerAPI['loadGameFromSlot']>>;
export type ImportSaveDataResult = Awaited<ReturnType<WorkerAPI['importSaveData']>>;
export type SubmitRosterTransactionResult = Awaited<ReturnType<WorkerAPI['submitRosterTransaction']>>;
export type ExecuteTradePackageResult = Awaited<ReturnType<WorkerAPI['executeTradePackage']>>;
export type SubmitFreeAgentOfferResult = Awaited<ReturnType<WorkerAPI['submitFreeAgentOffer']>>;

export async function simulateCurrentSeason(): Promise<SimulateCurrentSeasonResult> {
  return getEngine().simulateCurrentSeason();
}

export async function simulateCurrentSeasonSafe(): Promise<RuntimeGuardResult<SimulateCurrentSeasonResult>> {
  return guardedWorkerCall('simulate-current-season-failed', () => getEngine().simulateCurrentSeason());
}

export async function advanceSeason(): Promise<AdvanceSeasonResult> {
  return getEngine().advanceSeason();
}

export async function advanceSeasonSafe(): Promise<RuntimeGuardResult<AdvanceSeasonResult>> {
  return guardedWorkerCall('advance-season-failed', () => getEngine().advanceSeason());
}

export async function saveGameToSlot(slotId?: string, label?: string): Promise<SaveGameToSlotResult> {
  return getEngine().saveGameToSlot(slotId, label);
}

export async function saveGameToSlotSafe(
  slotId?: string,
  label?: string,
): Promise<RuntimeGuardResult<SaveGameToSlotResult>> {
  return guardedWorkerCall('save-game-to-slot-failed', () => getEngine().saveGameToSlot(slotId, label));
}

export async function loadGameFromSlot(slotId: string): Promise<LoadGameFromSlotResult> {
  return getEngine().loadGameFromSlot(slotId);
}

export async function loadGameFromSlotSafe(slotId: string): Promise<RuntimeGuardResult<LoadGameFromSlotResult>> {
  return guardedWorkerCall('load-game-from-slot-failed', () => getEngine().loadGameFromSlot(slotId));
}

export async function importSaveData(json: string, slotId?: string): Promise<ImportSaveDataResult> {
  return getEngine().importSaveData(json, slotId);
}

export async function importSaveDataSafe(
  json: string,
  slotId?: string,
): Promise<RuntimeGuardResult<ImportSaveDataResult>> {
  return guardedWorkerCall('import-save-data-failed', () => getEngine().importSaveData(json, slotId));
}

export async function submitRosterTransaction(
  ...args: Parameters<WorkerAPI['submitRosterTransaction']>
): Promise<SubmitRosterTransactionResult> {
  return getEngine().submitRosterTransaction(...args);
}

export async function submitRosterTransactionSafe(
  ...args: Parameters<WorkerAPI['submitRosterTransaction']>
): Promise<RuntimeGuardResult<SubmitRosterTransactionResult>> {
  return guardedWorkerCall('submit-roster-transaction-failed', () => getEngine().submitRosterTransaction(...args));
}

export async function executeTradePackage(
  ...args: Parameters<WorkerAPI['executeTradePackage']>
): Promise<ExecuteTradePackageResult> {
  return getEngine().executeTradePackage(...args);
}

export async function executeTradePackageSafe(
  ...args: Parameters<WorkerAPI['executeTradePackage']>
): Promise<RuntimeGuardResult<ExecuteTradePackageResult>> {
  return guardedWorkerCall('execute-trade-package-failed', () => getEngine().executeTradePackage(...args));
}

export async function submitFreeAgentOffer(
  ...args: Parameters<WorkerAPI['submitFreeAgentOffer']>
): Promise<SubmitFreeAgentOfferResult> {
  return getEngine().submitFreeAgentOffer(...args);
}

export async function submitFreeAgentOfferSafe(
  ...args: Parameters<WorkerAPI['submitFreeAgentOffer']>
): Promise<RuntimeGuardResult<SubmitFreeAgentOfferResult>> {
  return guardedWorkerCall('submit-free-agent-offer-failed', () => getEngine().submitFreeAgentOffer(...args));
}

export async function runIntegrityAudit(): Promise<IntegrityAuditReport> {
  return getEngine().runIntegrityAudit();
}

export async function runIntegrityAuditSafe(): Promise<RuntimeGuardResult<IntegrityAuditReport>> {
  return guardedWorkerCall('integrity-audit-failed', () => getEngine().runIntegrityAudit());
}

export async function getPlayableReadinessReport(): Promise<PlayableReadinessReport> {
  return getEngine().getPlayableReadinessReport();
}

export async function getPlayableReadinessReportSafe(): Promise<RuntimeGuardResult<PlayableReadinessReport>> {
  return guardedWorkerCall('playable-readiness-failed', () => getEngine().getPlayableReadinessReport());
}

export async function getFeatureReadiness(featureId: string): Promise<FeatureReadinessReport> {
  return getEngine().getFeatureReadiness(featureId);
}

export async function getFeatureReadinessSafe(featureId: string): Promise<RuntimeGuardResult<FeatureReadinessReport>> {
  return guardedWorkerCall('feature-readiness-failed', () => getEngine().getFeatureReadiness(featureId));
}

export async function getDiagnosticsSnapshot(): Promise<DiagnosticsSnapshot> {
  return getEngine().getDiagnosticsSnapshot();
}

export async function getDiagnosticsSnapshotSafe(): Promise<RuntimeGuardResult<DiagnosticsSnapshot>> {
  return guardedWorkerCall('diagnostics-snapshot-failed', () => getEngine().getDiagnosticsSnapshot());
}

export async function getSmokeFlowReport(): Promise<SmokeFlowReport> {
  return getEngine().getSmokeFlowReport();
}

export async function getSmokeFlowReportSafe(): Promise<RuntimeGuardResult<SmokeFlowReport>> {
  return guardedWorkerCall('smoke-flow-failed', () => getEngine().getSmokeFlowReport());
}

export async function runDeterminismProbe(seed: number, seasons: number): Promise<DeterminismProbeReport> {
  return getEngine().runDeterminismProbe(seed, seasons);
}

export async function runDeterminismProbeSafe(
  seed: number,
  seasons: number,
): Promise<RuntimeGuardResult<DeterminismProbeReport>> {
  return guardedWorkerCall('determinism-probe-failed', () => getEngine().runDeterminismProbe(seed, seasons));
}

export async function getIntakeAuditReport(packId: IntakePack): Promise<IntakeAuditReport> {
  return getEngine().getIntakeAuditReport(packId);
}

export async function getIntakeAuditReportSafe(packId: IntakePack): Promise<RuntimeGuardResult<IntakeAuditReport>> {
  return guardedWorkerCall('intake-audit-failed', () => getEngine().getIntakeAuditReport(packId));
}

export async function runSoakSimulation(
  seed: number,
  seasons: number,
  mode: SoakSimulationMode,
): Promise<SoakSimulationReport> {
  return getEngine().runSoakSimulation(seed, seasons, mode);
}

export async function runSoakSimulationSafe(
  seed: number,
  seasons: number,
  mode: SoakSimulationMode,
): Promise<RuntimeGuardResult<SoakSimulationReport>> {
  return guardedWorkerCall('soak-simulation-failed', () => getEngine().runSoakSimulation(seed, seasons, mode));
}

export async function getLatencyBudgetReport(): Promise<LatencyBudgetReport> {
  return getEngine().getLatencyBudgetReport();
}

export async function getLatencyBudgetReportSafe(): Promise<RuntimeGuardResult<LatencyBudgetReport>> {
  return guardedWorkerCall('latency-budget-failed', () => getEngine().getLatencyBudgetReport());
}

export async function getDraftBoard(userTeamId = 1): Promise<DraftBoardListing> {
  return getEngine().getDraftBoard(userTeamId);
}

export async function getDraftBoardSafe(userTeamId = 1): Promise<RuntimeGuardResult<DraftBoardListing>> {
  return guardedWorkerCall('draft-board-failed', () => getEngine().getDraftBoard(userTeamId));
}

export async function makeDraftPick(playerId: number): Promise<DraftPickResponse> {
  return getEngine().makeDraftPick(playerId);
}

export async function makeDraftPickSafe(playerId: number): Promise<RuntimeGuardResult<DraftPickResponse>> {
  return guardedWorkerCall('make-draft-pick-failed', () => getEngine().makeDraftPick(playerId));
}
