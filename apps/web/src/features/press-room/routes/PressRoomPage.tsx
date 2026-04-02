import { useCallback, useEffect, useState } from 'react';
import { Newspaper, Radio, ShieldAlert } from 'lucide-react';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';
import type { PressRoomEntry } from '@/shared/types/pressRoom';

function priorityTone(priority: number): string {
  if (priority <= 1) return 'border-accent-danger/50 text-accent-danger';
  if (priority === 2) return 'border-accent-warning/50 text-accent-warning';
  if (priority === 3) return 'border-accent-info/50 text-accent-info';
  return 'border-dynasty-border text-dynasty-muted';
}

function sourceTone(source: PressRoomEntry['source']): string {
  return source === 'briefing'
    ? 'border-accent-info/40 bg-accent-info/10 text-accent-info'
    : 'border-accent-warning/40 bg-accent-warning/10 text-accent-warning';
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ');
}

export default function PressRoomPage() {
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { isInitialized, day, season, phase } = useGameStore();
  const [feed, setFeed] = useState<PressRoomEntry[]>([]);

  const fetchFeed = useCallback(async () => {
    if (!isInitialized || !workerReady) return;
    try {
      const nextFeed = await worker.getPressRoomFeed(100);
      setFeed((nextFeed ?? []) as PressRoomEntry[]);
    } catch (err) {
      console.error('Failed to fetch press room feed:', err);
    }
  }, [isInitialized, workerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed, day, season, phase]);

  const briefingCount = feed.filter((entry) => entry.source === 'briefing').length;
  const newsCount = feed.length - briefingCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Press Room
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          A read-only archive of front-office signals and league headlines.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="flex items-center gap-2 font-heading text-xs uppercase text-dynasty-muted">
            <Newspaper className="h-4 w-4" />
            Archive Size
          </div>
          <div className="mt-2 font-data text-3xl text-dynasty-textBright">{feed.length}</div>
          <div className="mt-1 font-heading text-xs text-dynasty-muted">
            unified items available
          </div>
        </div>
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="flex items-center gap-2 font-heading text-xs uppercase text-dynasty-muted">
            <ShieldAlert className="h-4 w-4" />
            Briefing Desk
          </div>
          <div className="mt-2 font-data text-3xl text-accent-info">{briefingCount}</div>
          <div className="mt-1 font-heading text-xs text-dynasty-muted">
            front-office items
          </div>
        </div>
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="flex items-center gap-2 font-heading text-xs uppercase text-dynasty-muted">
            <Radio className="h-4 w-4" />
            News Wire
          </div>
          <div className="mt-2 font-data text-3xl text-accent-warning">{newsCount}</div>
          <div className="mt-1 font-heading text-xs text-dynasty-muted">
            archived headlines
          </div>
        </div>
      </div>

      <section className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-3 border-b border-dynasty-border pb-3">
          <div>
            <h2 className="font-heading text-sm font-semibold text-dynasty-textBright">
              Unified Feed
            </h2>
            <p className="mt-1 font-heading text-xs text-dynasty-muted">
              Sorted by recency first, then urgency.
            </p>
          </div>
          <div className="font-data text-xs uppercase tracking-wide text-dynasty-muted">
            newest 100
          </div>
        </div>

        <div className="space-y-4">
          {feed.length > 0 ? feed.map((entry) => (
            <article
              key={`${entry.source}-${entry.id}`}
              className="rounded-lg border border-dynasty-border bg-[radial-gradient(circle_at_top,rgba(181,166,114,0.08),transparent_48%),linear-gradient(180deg,rgba(20,24,28,0.98),rgba(13,16,19,0.98))] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded border px-2 py-1 font-heading text-[10px] uppercase tracking-wide ${sourceTone(entry.source)}`}>
                  {entry.source}
                </span>
                <span className="rounded border border-dynasty-border px-2 py-1 font-heading text-[10px] uppercase tracking-wide text-dynasty-muted">
                  {formatCategory(entry.category)}
                </span>
                <span className={`rounded border px-2 py-1 font-data text-[10px] uppercase tracking-wide ${priorityTone(entry.priority)}`}>
                  Priority {entry.priority}
                </span>
                <span className="ml-auto font-data text-[11px] uppercase text-dynasty-muted">
                  {entry.timestamp}
                </span>
              </div>
              <h3 className="mt-3 font-heading text-lg text-dynasty-textBright">
                {entry.headline}
              </h3>
              <p className="mt-2 max-w-3xl font-heading text-sm leading-6 text-dynasty-text">
                {entry.body}
              </p>
            </article>
          )) : (
            <div className="rounded border border-dynasty-border bg-dynasty-elevated p-8 text-center">
              <div className="font-heading text-lg text-dynasty-text">The room is quiet.</div>
              <p className="mt-2 font-heading text-sm text-dynasty-muted">
                Sim ahead to generate headlines and front-office pressure notes.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
