import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

interface PlayerDTO {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  position: string;
  overallRating: number;
  displayRating: number;
  letterGrade: string;
  rosterStatus: string;
  teamId: string;
  stats: {
    pa: number;
    ab: number;
    hits: number;
    hr: number;
    rbi: number;
    bb: number;
    k: number;
    avg: string;
    ip: number;
    earnedRuns: number;
    strikeouts: number;
    walks: number;
    era: string;
  } | null;
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-accent-success/20 text-accent-success';
    case 'B': return 'bg-accent-info/20 text-accent-info';
    case 'C': return 'bg-accent-warning/20 text-accent-warning';
    case 'D': return 'bg-accent-danger/20 text-accent-danger';
    default:  return 'bg-dynasty-border text-dynasty-muted';
  }
}

const PITCHER_POSITIONS = new Set(['SP', 'RP', 'CL']);

export default function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { isInitialized, day, season } = useGameStore();
  const [player, setPlayer] = useState<PlayerDTO | null>(null);

  const fetchPlayer = useCallback(async () => {
    if (!isInitialized || !worker.isReady || !playerId) return;
    const data = await worker.getPlayer(playerId);
    setPlayer(data as PlayerDTO | null);
  }, [isInitialized, workerReady, playerId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPlayer();
  }, [fetchPlayer, day, season]);

  if (!player) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="font-heading text-dynasty-muted">Loading player...</div>
      </div>
    );
  }

  const isPitcher = PITCHER_POSITIONS.has(player.position);

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <Link
        to="/players"
        className="inline-flex items-center gap-1.5 font-heading text-sm text-dynasty-muted hover:text-accent-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Players
      </Link>

      {/* Player header */}
      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-dynasty-text">
              {player.firstName} {player.lastName}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <span className="rounded bg-dynasty-elevated px-2 py-0.5 font-data text-sm text-dynasty-muted">
                {player.position}
              </span>
              <span className="font-data text-sm text-dynasty-muted">
                Age {player.age}
              </span>
              <span className="font-data text-sm text-dynasty-muted">
                {player.teamId.toUpperCase()}
              </span>
              <span className="rounded bg-dynasty-elevated px-2 py-0.5 font-data text-xs uppercase text-accent-info">
                {player.rosterStatus}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-data text-4xl font-bold text-dynasty-text">
              {player.displayRating}
            </div>
            <span className={`mt-1 inline-block rounded px-3 py-0.5 font-data text-lg font-bold ${gradeColor(player.letterGrade)}`}>
              {player.letterGrade}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {player.stats && (
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
          <div className="border-b border-dynasty-border px-4 py-3">
            <h2 className="font-heading text-sm font-semibold text-dynasty-text">
              Season Stats
            </h2>
          </div>
          <div className="p-4">
            {isPitcher ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                <StatBlock label="ERA" value={player.stats.era} />
                <StatBlock label="K" value={String(player.stats.strikeouts)} />
                <StatBlock label="BB" value={String(player.stats.walks)} />
                <StatBlock label="H" value={String(player.stats.hits)} />
                <StatBlock label="ER" value={String(player.stats.earnedRuns)} />
                <StatBlock label="IP" value={String(Math.round(player.stats.ip / 3))} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
                <StatBlock label="AVG" value={player.stats.avg} />
                <StatBlock label="HR" value={String(player.stats.hr)} highlight />
                <StatBlock label="RBI" value={String(player.stats.rbi)} />
                <StatBlock label="H" value={String(player.stats.hits)} />
                <StatBlock label="BB" value={String(player.stats.bb)} />
                <StatBlock label="K" value={String(player.stats.k)} />
                <StatBlock label="PA" value={String(player.stats.pa)} />
              </div>
            )}
          </div>
        </div>
      )}

      {!player.stats && (
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8 text-center">
          <p className="font-heading text-sm text-dynasty-muted">
            No stats yet. Sim games to see this player's performance.
          </p>
        </div>
      )}
    </div>
  );
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className="font-heading text-xs uppercase text-dynasty-muted">{label}</div>
      <div className={`mt-1 font-data text-2xl font-bold ${highlight ? 'text-accent-primary' : 'text-dynasty-text'}`}>
        {value}
      </div>
    </div>
  );
}
