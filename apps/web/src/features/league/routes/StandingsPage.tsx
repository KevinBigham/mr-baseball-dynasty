import { Trophy } from 'lucide-react';

export default function StandingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          League Standings
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Division standings, wild card races, and playoff picture across the
          league.
        </p>
      </div>

      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Trophy className="h-12 w-12 text-dynasty-muted" />
          <h2 className="font-heading text-lg font-semibold text-dynasty-text">
            Division Standings
          </h2>
          <p className="max-w-md font-heading text-sm text-dynasty-muted">
            Full league standings with W-L records, winning percentage, games
            back, run differential, and streak indicators. Updated after each
            simulated day.
          </p>
        </div>
      </div>
    </div>
  );
}
