/**
 * OffseasonDashboard — free agency, trade center, offseason summary
 */

import { useGameStore } from '../../store/gameStore';
import FreeAgencyPanel from '../offseason/FreeAgencyPanel';
import TradeCenter from '../offseason/TradeCenter';
import OffseasonSummary, { type UserTransaction } from '../offseason/OffseasonSummary';
import type { AISigningRecord } from '../../engine/freeAgency';

interface Props {
  showSummary: boolean;
  offseasonTxLog: UserTransaction[];
  aiSigningDetails: AISigningRecord[];
  onAdvance: () => void;
  onFinish: () => void;
  onTransaction: (tx: UserTransaction) => void;
}

export default function OffseasonDashboard({
  showSummary, offseasonTxLog, aiSigningDetails,
  onAdvance, onFinish, onTransaction,
}: Props) {
  const { season } = useGameStore();

  if (showSummary) {
    return (
      <OffseasonSummary
        userTransactions={offseasonTxLog}
        aiSignings={aiSigningDetails}
        onContinue={onFinish}
        season={season}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bloomberg-border bg-gray-900 px-4 py-2">
        <div className="text-orange-500 font-bold text-xs tracking-widest">
          OFFSEASON — {season - 1} → {season}
        </div>
        <div className="text-gray-500 text-xs">Sign free agents, make trades, and manage your roster before next season.</div>
      </div>
      <FreeAgencyPanel onDone={onAdvance} onTransaction={onTransaction} />
      <TradeCenter onTransaction={onTransaction} />
    </div>
  );
}
