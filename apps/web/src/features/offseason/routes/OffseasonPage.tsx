import { useEffect, useState, useCallback } from 'react';
import {
  Calendar, ChevronRight, Check, SkipForward,
  Award, UserMinus, DollarSign, FileText, Tent,
} from 'lucide-react';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

const PHASE_CONFIG: Record<string, { label: string; icon: typeof Calendar; description: string }> = {
  season_review: {
    label: 'Season Review',
    icon: Award,
    description: 'Review your season performance, awards, and franchise standings.',
  },
  arbitration: {
    label: 'Arbitration',
    icon: DollarSign,
    description: 'Negotiate salaries with arbitration-eligible players.',
  },
  tender_nontender: {
    label: 'Tender / Non-Tender',
    icon: UserMinus,
    description: 'Decide which players to tender contracts and which to non-tender.',
  },
  free_agency: {
    label: 'Free Agency',
    icon: FileText,
    description: 'Sign free agents to fill roster gaps and improve your team.',
  },
  draft: {
    label: 'Amateur Draft',
    icon: FileText,
    description: 'Select prospects to build the future of your franchise.',
  },
  spring_training: {
    label: 'Spring Training',
    icon: Tent,
    description: 'Finalize your roster and prepare for the upcoming season.',
  },
};

const ALL_PHASES = [
  'season_review', 'arbitration', 'tender_nontender',
  'free_agency', 'draft', 'spring_training',
];

interface OffseasonData {
  currentPhase: string;
  phaseDay: number;
  totalDay: number;
  completed: boolean;
  phaseResults: {
    arbitrationResolved: unknown[];
    tenderedPlayers: string[];
    nonTenderedPlayers: string[];
    freeAgentSignings: unknown[];
    draftPicks: unknown[];
    retiredPlayers: string[];
  };
}

export default function OffseasonPage() {
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { phase, season, isInitialized } = useGameStore();
  const [offseason, setOffseason] = useState<OffseasonData | null>(null);
  const [advancing, setAdvancing] = useState(false);

  const fetchOffseason = useCallback(async () => {
    if (!isInitialized || !worker.isReady) return;
    try {
      const api = worker as Record<string, unknown>;
      if (typeof api.getOffseasonState === 'function') {
        const data = await (api.getOffseasonState as () => Promise<OffseasonData | null>)();
        if (data) setOffseason(data);
      }
    } catch {
      // Not available yet
    }
  }, [isInitialized, workerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchOffseason(); }, [fetchOffseason, phase]);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      const api = worker as Record<string, unknown>;
      if (typeof api.advanceOffseason === 'function') {
        const data = await (api.advanceOffseason as () => Promise<OffseasonData | null>)();
        if (data) setOffseason(data);
      }
    } catch {
      // Not available yet
    }
    setAdvancing(false);
  };

  const handleSkip = async () => {
    setAdvancing(true);
    try {
      const api = worker as Record<string, unknown>;
      if (typeof api.skipOffseasonPhase === 'function') {
        const data = await (api.skipOffseasonPhase as () => Promise<OffseasonData | null>)();
        if (data) setOffseason(data);
      }
    } catch {
      // Not available yet
    }
    setAdvancing(false);
  };

  // Not in offseason
  if (phase !== 'offseason') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
            Offseason
          </h1>
          <p className="mt-1 font-heading text-sm text-dynasty-muted">
            The offseason begins after the playoffs conclude.
          </p>
        </div>
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8">
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <Calendar className="h-12 w-12 text-dynasty-muted" />
            <h2 className="font-heading text-lg font-semibold text-dynasty-text">
              Season In Progress
            </h2>
            <p className="max-w-md font-heading text-sm text-dynasty-muted">
              The offseason wizard will guide you through arbitration, free agency,
              the amateur draft, and roster decisions after the season ends.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentPhaseConfig = offseason
    ? PHASE_CONFIG[offseason.currentPhase] ?? PHASE_CONFIG.season_review!
    : PHASE_CONFIG.season_review!;

  const currentPhaseIdx = offseason
    ? ALL_PHASES.indexOf(offseason.currentPhase)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Offseason — Season {season}
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Navigate through each phase to prepare for the next season.
        </p>
      </div>

      {/* Phase Progress Bar */}
      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
        <div className="flex items-center gap-1">
          {ALL_PHASES.map((p, idx) => {
            const config = PHASE_CONFIG[p]!;
            const Icon = config.icon;
            const isActive = idx === currentPhaseIdx;
            const isDone = idx < currentPhaseIdx;
            return (
              <div key={p} className="flex flex-1 items-center">
                <div className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-accent-primary' : isDone ? 'text-accent-success' : 'text-dynasty-muted'
                }`}>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isActive ? 'border-accent-primary bg-accent-primary/20' :
                    isDone ? 'border-accent-success bg-accent-success/20' :
                    'border-dynasty-border bg-dynasty-elevated'
                  }`}>
                    {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className="hidden text-center font-heading text-[10px] sm:block">
                    {config.label}
                  </span>
                </div>
                {idx < ALL_PHASES.length - 1 && (
                  <div className={`mx-1 h-0.5 flex-1 ${
                    idx < currentPhaseIdx ? 'bg-accent-success' : 'bg-dynasty-border'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Phase Card */}
      <div className="rounded-lg border-2 border-accent-primary/50 bg-dynasty-surface p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <currentPhaseConfig.icon className="h-5 w-5 text-accent-primary" />
              <h2 className="font-heading text-lg font-semibold text-dynasty-textBright">
                {currentPhaseConfig.label}
              </h2>
              {offseason && (
                <span className="font-data text-xs text-dynasty-muted">
                  Day {offseason.phaseDay}
                </span>
              )}
            </div>
            <p className="mt-2 max-w-lg font-heading text-sm text-dynasty-muted">
              {currentPhaseConfig.description}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="flex items-center gap-1 rounded bg-accent-primary px-4 py-2 font-heading text-sm font-semibold text-white transition-colors hover:bg-accent-primary/80 disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
              Advance Day
            </button>
            <button
              onClick={handleSkip}
              disabled={advancing}
              className="flex items-center gap-1 rounded border border-dynasty-border bg-dynasty-elevated px-3 py-2 font-heading text-sm text-dynasty-muted transition-colors hover:text-dynasty-text disabled:opacity-50"
            >
              <SkipForward className="h-4 w-4" />
              Skip Phase
            </button>
          </div>
        </div>
      </div>

      {/* Phase Results Summary */}
      {offseason && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <ResultCard
            label="Arbitrations"
            value={offseason.phaseResults.arbitrationResolved.length}
            icon={DollarSign}
          />
          <ResultCard
            label="Tendered"
            value={offseason.phaseResults.tenderedPlayers.length}
            icon={Check}
          />
          <ResultCard
            label="Non-Tendered"
            value={offseason.phaseResults.nonTenderedPlayers.length}
            icon={UserMinus}
          />
          <ResultCard
            label="FA Signings"
            value={offseason.phaseResults.freeAgentSignings.length}
            icon={FileText}
          />
          <ResultCard
            label="Draft Picks"
            value={offseason.phaseResults.draftPicks.length}
            icon={Award}
          />
          <ResultCard
            label="Retirements"
            value={offseason.phaseResults.retiredPlayers.length}
            icon={Calendar}
          />
        </div>
      )}
    </div>
  );
}

function ResultCard({ label, value, icon: Icon }: {
  label: string;
  value: number;
  icon: typeof Calendar;
}) {
  return (
    <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-3">
      <div className="flex items-center gap-1.5 text-dynasty-muted">
        <Icon className="h-3.5 w-3.5" />
        <span className="font-heading text-xs">{label}</span>
      </div>
      <div className="mt-1 font-data text-2xl font-bold text-dynasty-text">{value}</div>
    </div>
  );
}
