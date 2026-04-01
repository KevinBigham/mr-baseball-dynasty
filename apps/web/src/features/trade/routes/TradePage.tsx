import { ArrowLeftRight } from 'lucide-react';

export default function TradePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Trade Center
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Negotiate trades with other teams. Propose deals, evaluate trade
          value, and manage the trade deadline.
        </p>
      </div>

      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8">
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <ArrowLeftRight className="h-12 w-12 text-dynasty-muted" />
          <h2 className="font-heading text-lg font-semibold text-dynasty-text">
            Trade Negotiations
          </h2>
          <p className="max-w-md font-heading text-sm text-dynasty-muted">
            Build trade packages with a drag-and-drop interface. The trade
            evaluator will show surplus value for both sides, prospect rankings,
            and AI counterproposal logic.
          </p>
        </div>
      </div>
    </div>
  );
}
