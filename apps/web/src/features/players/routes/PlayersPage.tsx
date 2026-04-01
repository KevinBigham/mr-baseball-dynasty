import { User } from 'lucide-react';

export default function PlayersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Players
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Browse all players across the league. View detailed stats, development
          trajectories, and player profiles.
        </p>
      </div>

      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <User className="h-12 w-12 text-dynasty-muted" />
          <h2 className="font-heading text-lg font-semibold text-dynasty-text">
            Player Database
          </h2>
          <p className="max-w-md font-heading text-sm text-dynasty-muted">
            Search and filter the full player database. Each player card will
            show ratings, stats, contract status, and development potential.
            Powered by the simulation engine.
          </p>
        </div>
      </div>
    </div>
  );
}
