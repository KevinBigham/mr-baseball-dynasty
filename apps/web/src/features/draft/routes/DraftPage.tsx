import { FileText } from 'lucide-react';

export default function DraftPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Draft Room
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Build your franchise through the amateur draft. Evaluate prospects,
          set your draft board, and make your selections.
        </p>
      </div>

      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <FileText className="h-12 w-12 text-dynasty-muted" />
          <h2 className="font-heading text-lg font-semibold text-dynasty-text">
            Amateur Draft
          </h2>
          <p className="max-w-md font-heading text-sm text-dynasty-muted">
            The draft board will display ranked prospects with scouting grades,
            signability estimates, and positional needs. Live draft mode will
            simulate other teams' picks in real time.
          </p>
        </div>
      </div>
    </div>
  );
}
