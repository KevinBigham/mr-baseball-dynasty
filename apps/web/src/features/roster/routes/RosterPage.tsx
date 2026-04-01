import { Users } from 'lucide-react';

export default function RosterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          40-Man Roster
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Manage your active roster, designate players for assignment, and set
          your starting lineup.
        </p>
      </div>

      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Users className="h-12 w-12 text-dynasty-muted" />
          <h2 className="font-heading text-lg font-semibold text-dynasty-text">
            Roster Management
          </h2>
          <p className="max-w-md font-heading text-sm text-dynasty-muted">
            Your 40-man roster will be displayed here with sortable columns for
            position, batting average, ERA, WAR, and contract details. Start a
            new game to populate your roster.
          </p>
        </div>
      </div>
    </div>
  );
}
