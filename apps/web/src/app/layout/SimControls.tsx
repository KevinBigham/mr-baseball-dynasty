import { Play, FastForward, SkipForward, Zap } from 'lucide-react';
import { useGameStore } from '@/shared/hooks/useGameStore';

interface SimControlsProps {
  onSimDay: () => void;
  onSimWeek: () => void;
  onSimMonth: () => void;
  onSimInstant: () => void;
}

interface SimButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  shortLabel: string;
}

function SimButton({ onClick, disabled, icon, label, shortLabel }: SimButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="focus-ring flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-md bg-accent-primary px-4 py-2 font-heading text-sm font-semibold text-white transition-colors hover:bg-accent-primaryHover disabled:cursor-not-allowed disabled:opacity-40"
      aria-label={label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
    </button>
  );
}

export function SimControls({
  onSimDay,
  onSimWeek,
  onSimMonth,
  onSimInstant,
}: SimControlsProps) {
  const { isSimulating, day, season, phase } = useGameStore();

  return (
    <footer className="border-t border-dynasty-border bg-dynasty-surface px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Status display */}
        <div className="hidden min-w-[140px] md:block">
          <div className="font-data text-xs text-dynasty-muted">
            Season {season} | Day {day}/162
          </div>
          <div className="font-data text-xs uppercase text-accent-info">
            {phase}
          </div>
        </div>

        {/* Sim buttons */}
        <div className="flex flex-1 gap-2">
          <SimButton
            onClick={onSimDay}
            disabled={isSimulating}
            icon={<Play className="h-4 w-4" />}
            label="Sim Day"
            shortLabel="Day"
          />
          <SimButton
            onClick={onSimWeek}
            disabled={isSimulating}
            icon={<FastForward className="h-4 w-4" />}
            label="Sim Week"
            shortLabel="Week"
          />
          <SimButton
            onClick={onSimMonth}
            disabled={isSimulating}
            icon={<SkipForward className="h-4 w-4" />}
            label="Sim Month"
            shortLabel="Month"
          />
          <SimButton
            onClick={onSimInstant}
            disabled={isSimulating}
            icon={<Zap className="h-4 w-4" />}
            label="Instant"
            shortLabel="All"
          />
        </div>
      </div>
    </footer>
  );
}
