import { History } from 'lucide-react';

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Franchise History
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Review your franchise legacy. Past seasons, championship runs, retired
          numbers, and Hall of Fame inductees.
        </p>
      </div>

      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <History className="h-12 w-12 text-dynasty-muted" />
          <h2 className="font-heading text-lg font-semibold text-dynasty-text">
            Franchise Timeline
          </h2>
          <p className="max-w-md font-heading text-sm text-dynasty-muted">
            Your franchise timeline will chronicle every season with win-loss
            records, playoff results, award winners, and notable transactions.
            Build a dynasty worth remembering.
          </p>
        </div>
      </div>
    </div>
  );
}
