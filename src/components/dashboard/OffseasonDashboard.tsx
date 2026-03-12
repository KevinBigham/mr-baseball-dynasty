/**
 * OffseasonDashboard — Phase-aware router for the 9-step offseason flow.
 *
 * Phases: arbitration → waivers → annual_draft → rule5 → intl_signing →
 *         free_agency → extensions → trading → summary
 */

import { useGameStore } from '../../store/gameStore';
import FreeAgencyPanel from '../offseason/FreeAgencyPanel';
import TradeCenter from '../offseason/TradeCenter';
import OffseasonSummary from '../offseason/OffseasonSummary';
import ArbitrationPanel from '../offseason/ArbitrationPanel';
import WaiversPanel from '../offseason/WaiversPanel';
import Rule5Panel from '../offseason/Rule5Panel';
import IntlSigningPanel from '../offseason/IntlSigningPanel';
import ExtensionPanel from '../offseason/ExtensionPanel';
import AnnualDraft from '../draft/AnnualDraft';
import { OFFSEASON_PHASE_ORDER, OFFSEASON_PHASE_LABELS, type OffseasonPhase } from '../../types/offseason';
import type { OffseasonFlowState } from '../../hooks/useOffseasonFlow';

interface Props {
  flow: OffseasonFlowState;
}

/** Progress bar showing the 9 offseason phases */
function PhaseProgressBar({ currentPhase }: { currentPhase: string }) {
  const currentIdx = OFFSEASON_PHASE_ORDER.indexOf(currentPhase as OffseasonPhase);

  return (
    <div className="bloomberg-border bg-gray-900 px-4 py-3">
      <div className="flex items-center justify-between gap-1">
        {OFFSEASON_PHASE_ORDER.map((phase, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={phase} className="flex items-center gap-1 flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-3 h-3 rounded-full border-2 transition-colors ${
                    isCompleted
                      ? 'bg-green-500 border-green-500'
                      : isCurrent
                        ? 'bg-orange-500 border-orange-500'
                        : 'bg-gray-800 border-gray-600'
                  }`}
                />
                <span
                  className={`text-[9px] mt-1 text-center leading-tight ${
                    isCurrent ? 'text-orange-400 font-bold' : isCompleted ? 'text-green-500' : 'text-gray-500'
                  }`}
                >
                  {OFFSEASON_PHASE_LABELS[phase]}
                </span>
              </div>
              {i < OFFSEASON_PHASE_ORDER.length - 1 && (
                <div className={`h-px flex-1 mb-3 ${isCompleted ? 'bg-green-700' : 'bg-gray-700'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OffseasonDashboard({ flow }: Props) {
  const { season, userTeamId } = useGameStore();

  return (
    <div className="space-y-4">
      {/* Phase header */}
      <div className="bloomberg-border bg-gray-900 px-4 py-2">
        <div className="text-orange-500 font-bold text-xs tracking-widest">
          OFFSEASON — {season - 1} → {season}
        </div>
        <div className="text-gray-500 text-xs">
          {OFFSEASON_PHASE_LABELS[flow.currentPhase]}
        </div>
      </div>

      {/* Progress bar */}
      <PhaseProgressBar currentPhase={flow.currentPhase} />

      {/* Phase content */}
      {flow.currentPhase === 'arbitration' && (
        <ArbitrationPanel
          cases={flow.arbitrationCases}
          onComplete={flow.advanceToNextPhase}
          onTransaction={flow.logOffseasonTx}
        />
      )}

      {flow.currentPhase === 'waivers' && (
        <WaiversPanel
          claims={flow.waiverClaims}
          onComplete={flow.advanceToNextPhase}
        />
      )}

      {flow.currentPhase === 'annual_draft' && (
        <AnnualDraft
          season={season}
          userTeamId={userTeamId}
          onComplete={(count) => {
            flow.setDraftedCount(count);
            flow.advanceToNextPhase();
          }}
        />
      )}

      {flow.currentPhase === 'rule5' && (
        <Rule5Panel
          onComplete={(selections) => {
            flow.advanceToNextPhase();
            void selections;
          }}
          onTransaction={flow.logOffseasonTx}
        />
      )}

      {flow.currentPhase === 'intl_signing' && (
        <IntlSigningPanel
          onComplete={flow.advanceToNextPhase}
          onTransaction={flow.logOffseasonTx}
        />
      )}

      {flow.currentPhase === 'free_agency' && (
        <FreeAgencyPanel
          onDone={flow.advanceToNextPhase}
          onTransaction={flow.logOffseasonTx}
        />
      )}

      {flow.currentPhase === 'extensions' && (
        <ExtensionPanel
          onComplete={flow.advanceToNextPhase}
          onTransaction={flow.logOffseasonTx}
        />
      )}

      {flow.currentPhase === 'trading' && (
        <TradeCenter
          onTransaction={flow.logOffseasonTx}
          onDone={flow.advanceToNextPhase}
        />
      )}

      {flow.currentPhase === 'summary' && (
        <OffseasonSummary
          userTransactions={flow.offseasonTxLog}
          aiSignings={flow.aiSigningDetails}
          arbitrationCases={flow.arbitrationCases}
          waiverClaims={flow.waiverClaims}
          draftedCount={flow.draftedCount}
          rule5Selections={flow.rule5Selections}
          onContinue={flow.finishOffseason}
          season={season}
        />
      )}
    </div>
  );
}
