import { TrendingUp } from 'lucide-react';

export default function LeadersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Stat Leaders
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          League-wide statistical leaders for batting, pitching, and fielding.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-primary" />
            <h2 className="font-heading text-lg font-semibold text-dynasty-textBright">
              Batting Leaders
            </h2>
          </div>
          <p className="font-heading text-sm text-dynasty-muted">
            AVG, HR, RBI, OPS, WAR, and stolen base leaders. Filterable by
            position and qualifying plate appearances.
          </p>
        </div>

        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-info" />
            <h2 className="font-heading text-lg font-semibold text-dynasty-textBright">
              Pitching Leaders
            </h2>
          </div>
          <p className="font-heading text-sm text-dynasty-muted">
            ERA, WHIP, K/9, wins, saves, and FIP leaders. Split by starters and
            relievers with qualifying innings thresholds.
          </p>
        </div>
      </div>
    </div>
  );
}
