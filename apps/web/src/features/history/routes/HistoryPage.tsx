import { useEffect, useState, useCallback } from 'react';
import { History, Award, Flame } from 'lucide-react';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

interface AwardRaceEntry {
  playerId: string;
  teamId: string;
  score: number;
  summary: string;
}

interface AwardRaces {
  mvp: AwardRaceEntry[];
  cyYoung: AwardRaceEntry[];
  roy: AwardRaceEntry[];
}

interface AwardHistoryEntry {
  season: number;
  award: string;
  playerId: string;
  teamId: string;
  summary: string;
}

interface SeasonHistoryEntry {
  season: number;
  championTeamId: string | null;
  summary: string;
  awards: AwardHistoryEntry[];
  keyMoments: string[];
}

interface Rivalry {
  id: string;
  teamA: string;
  teamB: string;
  intensity: number;
  summary: string;
  reasons: string[];
}

function intensityTone(intensity: number): string {
  if (intensity >= 75) return 'text-accent-danger';
  if (intensity >= 55) return 'text-accent-warning';
  if (intensity >= 35) return 'text-accent-info';
  return 'text-dynasty-muted';
}

export default function HistoryPage() {
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { isInitialized, userTeamId, day, season, phase } = useGameStore();
  const [awardRaces, setAwardRaces] = useState<AwardRaces | null>(null);
  const [awardHistory, setAwardHistory] = useState<AwardHistoryEntry[]>([]);
  const [seasonHistory, setSeasonHistory] = useState<SeasonHistoryEntry[]>([]);
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);

  const fetchHistory = useCallback(async () => {
    if (!isInitialized || !workerReady) return;
    try {
      const [races, awards, seasons, rivalriesData] = await Promise.all([
        worker.getAwardRaces(),
        worker.getAwardHistory(),
        worker.getSeasonHistory(),
        worker.getRivalries(userTeamId),
      ]);
      setAwardRaces((races ?? null) as AwardRaces | null);
      setAwardHistory((awards ?? []) as AwardHistoryEntry[]);
      setSeasonHistory((seasons ?? []) as SeasonHistoryEntry[]);
      setRivalries((rivalriesData ?? []) as Rivalry[]);
    } catch (err) {
      console.error('Failed to fetch history data:', err);
    }
  }, [isInitialized, workerReady, userTeamId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, day, season, phase]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Franchise History
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Award races, season recaps, and the grudges your franchise is building.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-accent-primary" />
            <h2 className="font-heading text-sm font-semibold text-dynasty-textBright">Current Award Watch</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <AwardRaceCard title="MVP" entries={awardRaces?.mvp ?? []} />
            <AwardRaceCard title="Cy Young" entries={awardRaces?.cyYoung ?? []} />
            <AwardRaceCard title="Rookie of the Year" entries={awardRaces?.roy ?? []} />
          </div>
        </section>

        <section className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-4 w-4 text-accent-warning" />
            <h2 className="font-heading text-sm font-semibold text-dynasty-textBright">Rivalry Watch</h2>
          </div>
          <div className="space-y-3">
            {rivalries.length > 0 ? rivalries.map((rivalry) => (
              <div key={rivalry.id} className="rounded border border-dynasty-border bg-dynasty-elevated p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-heading text-sm text-dynasty-text">
                    {rivalry.teamA.toUpperCase()} vs {rivalry.teamB.toUpperCase()}
                  </div>
                  <div className={`font-data text-sm ${intensityTone(rivalry.intensity)}`}>
                    {rivalry.intensity}
                  </div>
                </div>
                <div className="mt-1 font-heading text-xs text-dynasty-muted">
                  {rivalry.summary}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rivalry.reasons.map((reason) => (
                    <span key={reason} className="rounded border border-dynasty-border px-2 py-1 font-heading text-[10px] uppercase text-dynasty-muted">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            )) : (
              <div className="rounded border border-dynasty-border bg-dynasty-elevated p-4 font-heading text-sm text-dynasty-muted">
                Rivalries will appear once the standings tighten or postseason history starts to repeat.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <Award className="h-4 w-4 text-accent-info" />
            <h2 className="font-heading text-sm font-semibold text-dynasty-textBright">Award Ledger</h2>
          </div>
          <div className="space-y-3">
            {awardHistory.length > 0 ? awardHistory.map((entry) => (
              <div key={`${entry.season}-${entry.award}-${entry.playerId}`} className="rounded border border-dynasty-border bg-dynasty-elevated p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-heading text-sm text-dynasty-text">
                    Season {entry.season} {entry.award.replace('_', ' ')}
                  </div>
                  <div className="font-data text-xs uppercase text-dynasty-muted">
                    {entry.teamId.toUpperCase()}
                  </div>
                </div>
                <div className="mt-1 font-heading text-xs text-dynasty-muted">
                  {entry.summary}
                </div>
              </div>
            )) : (
              <div className="rounded border border-dynasty-border bg-dynasty-elevated p-4 font-heading text-sm text-dynasty-muted">
                No awards recorded yet. Complete a season to start building the ledger.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-accent-success" />
            <h2 className="font-heading text-sm font-semibold text-dynasty-textBright">Season Timeline</h2>
          </div>
          <div className="space-y-4">
            {seasonHistory.length > 0 ? seasonHistory.map((entry) => (
              <div key={entry.season} className="rounded border border-dynasty-border bg-dynasty-elevated p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-heading text-base text-dynasty-text">
                    Season {entry.season}
                  </div>
                  <div className="font-data text-xs uppercase text-dynasty-muted">
                    {entry.championTeamId ? `${entry.championTeamId.toUpperCase()} won it all` : 'Champion pending'}
                  </div>
                </div>
                <div className="mt-2 font-heading text-sm text-dynasty-text">
                  {entry.summary}
                </div>
                {entry.awards.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.awards.map((award) => (
                      <span key={`${entry.season}-${award.award}-${award.playerId}`} className="rounded border border-dynasty-border px-2 py-1 font-heading text-[10px] uppercase text-dynasty-muted">
                        {award.award.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
                {entry.keyMoments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {entry.keyMoments.map((moment) => (
                      <div key={moment} className="font-heading text-xs text-dynasty-muted">
                        {moment}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )) : (
              <div className="rounded border border-dynasty-border bg-dynasty-elevated p-8">
                <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                  <History className="h-12 w-12 text-dynasty-muted" />
                  <h2 className="font-heading text-lg font-semibold text-dynasty-text">
                    No completed seasons yet
                  </h2>
                  <p className="max-w-md font-heading text-sm text-dynasty-muted">
                    The timeline will fill in once a season reaches October and the story closes with a champion.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AwardRaceCard({ title, entries }: { title: string; entries: AwardRaceEntry[] }) {
  return (
    <div className="rounded border border-dynasty-border bg-dynasty-elevated p-3">
      <div className="font-heading text-xs uppercase text-dynasty-muted">{title}</div>
      <div className="mt-3 space-y-3">
        {entries.length > 0 ? entries.slice(0, 3).map((entry, index) => (
          <div key={`${title}-${entry.playerId}`} className="border-b border-dynasty-border/50 pb-3 last:border-b-0 last:pb-0">
            <div className="flex items-center justify-between gap-3">
              <div className="font-data text-xs text-dynasty-muted">#{index + 1}</div>
              <div className="font-data text-xs uppercase text-dynasty-muted">{entry.teamId}</div>
            </div>
            <div className="mt-1 font-heading text-sm text-dynasty-text">{entry.playerId}</div>
            <div className="mt-1 font-heading text-xs text-dynasty-muted">{entry.summary}</div>
          </div>
        )) : (
          <div className="font-heading text-sm text-dynasty-muted">
            No race data yet.
          </div>
        )}
      </div>
    </div>
  );
}
