import { ArrowRight, CalendarRange, Flag, Trophy } from 'lucide-react';
import type { SeasonFlowState } from './seasonFlow';

interface SeasonFlowCardProps {
  flow: SeasonFlowState;
  actionBusy: boolean;
  onAction: () => void;
}

function SeriesTeamLabel({
  teamName,
  abbreviation,
  seed,
  placeholder,
}: {
  teamName: string;
  abbreviation: string;
  seed: number | null;
  placeholder: string | null;
}) {
  if (placeholder) {
    return (
      <span className="font-heading text-sm text-dynasty-muted">
        {placeholder}
      </span>
    );
  }

  return (
    <span className="font-heading text-sm text-dynasty-text">
      {seed != null ? `#${seed} ` : ''}{teamName} <span className="font-data text-dynasty-muted">({abbreviation})</span>
    </span>
  );
}

export function SeasonFlowCard({ flow, actionBusy, onAction }: SeasonFlowCardProps) {
  if (!flow.action || !flow.actionLabel) {
    return null;
  }

  return (
    <section className="mb-6 rounded-xl border border-dynasty-border bg-dynasty-surface p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 font-data text-[11px] uppercase tracking-[0.2em] text-accent-warning">
            {flow.status === 'regular_season_complete' && <Flag className="h-4 w-4" />}
            {flow.status === 'playoff_preview' && <CalendarRange className="h-4 w-4" />}
            {flow.status === 'playoffs_complete' && <Trophy className="h-4 w-4" />}
            {flow.status === 'offseason_complete' && <CalendarRange className="h-4 w-4" />}
            Ceremony
          </div>

          {flow.status === 'regular_season_complete' && (
            <>
              <h2 className="font-brand text-3xl text-dynasty-textBright">Regular Season Complete</h2>
              <p className="font-heading text-sm text-dynasty-muted">{flow.detailLabel}</p>
            </>
          )}

          {flow.status === 'playoff_preview' && (
            <>
              <h2 className="font-brand text-3xl text-dynasty-textBright">Playoff Bracket Set</h2>
              <p className="font-heading text-sm text-dynasty-muted">{flow.detailLabel}</p>
            </>
          )}

          {flow.status === 'playoffs_complete' && (
            <>
              <h2 className="font-brand text-3xl text-dynasty-textBright">
                {flow.championSummary?.championTeamName ?? 'The season'} are World Series Champions!
              </h2>
              <p className="font-heading text-sm text-dynasty-muted">
                {flow.championSummary
                  ? `${flow.championSummary.championTeamName} beat ${flow.championSummary.runnerUpTeamName} ${flow.championSummary.seriesRecord}.`
                  : flow.detailLabel}
              </p>
            </>
          )}

          {flow.status === 'offseason_complete' && (
            <>
              <h2 className="font-brand text-3xl text-dynasty-textBright">
                Welcome to Season {flow.offseasonSummary?.nextSeason ?? flow.season + 1}
              </h2>
              <p className="font-heading text-sm text-dynasty-muted">{flow.detailLabel}</p>
            </>
          )}
        </div>

        <button
          onClick={onAction}
          disabled={actionBusy}
          className="inline-flex items-center gap-2 rounded-md bg-accent-primary px-4 py-2 font-heading text-sm font-semibold text-white transition-colors hover:bg-accent-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowRight className="h-4 w-4" />
          {flow.actionLabel}
        </button>
      </div>

      {flow.status === 'regular_season_complete' && (
        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {flow.standingsSnapshot.map((entry) => (
            <div
              key={entry.teamId}
              className="rounded-lg border border-dynasty-border bg-dynasty-elevated px-3 py-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm text-dynasty-text">{entry.teamName}</span>
                <span className="font-data text-xs text-dynasty-muted">{entry.abbreviation}</span>
              </div>
              <div className="mt-1 font-data text-xs text-dynasty-muted">
                {entry.wins}-{entry.losses} · {entry.division}
              </div>
            </div>
          ))}
        </div>
      )}

      {flow.status === 'playoff_preview' && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {['Wild Card', 'Division Series', 'Championship Series', 'World Series'].map((round) => {
            const series = flow.playoffPreview.filter((entry) => entry.round === round);
            if (series.length === 0) return null;

            return (
              <div key={round} className="rounded-lg border border-dynasty-border bg-dynasty-elevated p-4">
                <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-accent-info">
                  {round}
                </h3>
                <div className="mt-3 space-y-3">
                  {series.map((entry) => (
                    <div key={entry.id} className="rounded border border-dynasty-border bg-dynasty-surface px-3 py-2">
                      <div className="font-data text-[11px] uppercase tracking-[0.18em] text-dynasty-muted">
                        Best of {entry.bestOf}
                      </div>
                      <div className="mt-2 space-y-1">
                        <SeriesTeamLabel {...entry.home} />
                        <SeriesTeamLabel {...entry.away} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {flow.status === 'offseason_complete' && (
        <div className="mt-5 rounded-lg border border-dynasty-border bg-dynasty-elevated p-4">
          <h3 className="font-heading text-sm font-semibold uppercase tracking-[0.18em] text-accent-success">
            Key Offseason Moves
          </h3>
          <div className="mt-3 space-y-2">
            {(flow.offseasonSummary?.moves.length ?? 0) > 0 ? (
              flow.offseasonSummary?.moves.map((move) => (
                <p key={move} className="font-data text-sm text-dynasty-text">
                  {move}
                </p>
              ))
            ) : (
              <p className="font-heading text-sm text-dynasty-muted">
                Spring Training opens after a quiet winter.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
