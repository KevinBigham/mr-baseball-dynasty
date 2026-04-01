import { Settings, Command } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGameStore } from '@/shared/hooks/useGameStore';

interface TopBarProps {
  onOpenCommandPalette: () => void;
}

export function TopBar({ onOpenCommandPalette }: TopBarProps) {
  const { season, day, phase, teamName } = useGameStore();

  return (
    <header className="flex h-12 items-center justify-between border-b border-dynasty-border bg-dynasty-surface px-4">
      {/* Left: Brand + Season context */}
      <div className="flex items-center gap-4">
        <span className="font-brand text-2xl tracking-wide text-accent-primary">
          MBD
        </span>
        <div className="hidden items-center gap-2 text-sm sm:flex">
          <span className="font-heading font-medium text-dynasty-text">
            Season {season}
          </span>
          <span className="text-dynasty-muted">|</span>
          <span className="font-heading text-dynasty-muted">{teamName}</span>
          <span className="text-dynasty-muted">|</span>
          <span className="font-data text-dynasty-muted">
            Day {day}
          </span>
          <span className="rounded bg-dynasty-elevated px-1.5 py-0.5 font-data text-xs uppercase text-accent-info">
            {phase}
          </span>
        </div>
      </div>

      {/* Right: Command palette trigger + Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenCommandPalette}
          className="focus-ring flex items-center gap-1.5 rounded-md border border-dynasty-border px-2.5 py-1.5 text-xs text-dynasty-muted transition-colors hover:border-dynasty-muted hover:text-dynasty-text"
          aria-label="Open command palette"
        >
          <Command className="h-3.5 w-3.5" />
          <span className="hidden font-data sm:inline">K</span>
        </button>
        <Link
          to="/settings"
          className="focus-ring rounded-md p-1.5 text-dynasty-muted transition-colors hover:text-dynasty-text"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
