import { Search } from 'lucide-react';

export default function ScoutingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Scouting
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Deploy your scouting staff to evaluate amateur and professional
          talent. Uncover hidden gems before the draft.
        </p>
      </div>

      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <Search className="h-12 w-12 text-dynasty-muted" />
          <h2 className="font-heading text-lg font-semibold text-dynasty-text">
            Scouting Reports
          </h2>
          <p className="max-w-md font-heading text-sm text-dynasty-muted">
            Assign scouts to regions and leagues. Scouting reports will reveal
            player tool grades, makeup assessments, and projection models as
            your staff evaluates talent.
          </p>
        </div>
      </div>
    </div>
  );
}
