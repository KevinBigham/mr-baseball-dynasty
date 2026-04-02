import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, BrainCircuit } from 'lucide-react';
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

interface PersonalityProfile {
  playerId: string;
  archetype: string;
  morale: {
    score: number;
    trend: string;
    summary: string;
    lastUpdated: string;
  };
  personality: {
    workEthic: number;
    mentalToughness: number;
    leadership: number;
    competitiveness: number;
  };
  summary: string;
}

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-accent-success/20 text-accent-success';
    case 'B': return 'bg-accent-info/20 text-accent-info';
    case 'C': return 'bg-accent-warning/20 text-accent-warning';
    case 'D': return 'bg-accent-danger/20 text-accent-danger';
    default: return 'bg-dynasty-border text-dynasty-muted';
  }
}

function moraleTone(score: number): string {
  if (score >= 70) return 'text-accent-success';
  if (score >= 55) return 'text-accent-info';
  if (score >= 40) return 'text-accent-warning';
  return 'text-accent-danger';
}

const PITCHER_POSITIONS = new Set(['SP', 'RP', 'CL']);

export default function PlayerProfilePage() {
  const { playerId } = useParams<{ playerId: string }>();
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { isInitialized, day, season } = useGameStore();
  const [player, setPlayer] = useState<PlayerDTO | null>(null);
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);

  const fetchPlayer = useCallback(async () => {
    if (!isInitialized || !workerReady || !playerId) return;

    const [playerData, profileData] = await Promise.all([
      worker.getPlayer(playerId),
      worker.getPersonalityProfile(playerId),
    ]);

    setPlayer(playerData as PlayerDTO | null);
    setProfile(profileData as PersonalityProfile | null);
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
      <Link
        to="/players"
        className="inline-flex items-center gap-1.5 font-heading text-sm text-dynasty-muted hover:text-accent-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Players
      </Link>

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

      {profile && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
            <div className="flex items-center justify-between border-b border-dynasty-border px-4 py-3">
              <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-dynasty-text">
                <BrainCircuit className="h-4 w-4 text-accent-info" />
                Personality Profile
              </h2>
              <span className="rounded bg-dynasty-elevated px-2 py-1 font-heading text-xs uppercase text-accent-primary">
                {profile.archetype.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-4 p-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <PersonalityStat label="Work Ethic" value={profile.personality.workEthic} />
                <PersonalityStat label="Toughness" value={profile.personality.mentalToughness} />
                <PersonalityStat label="Leadership" value={profile.personality.leadership} />
                <PersonalityStat label="Compete" value={profile.personality.competitiveness} />
              </div>
              <div className="rounded border border-dynasty-border bg-dynasty-elevated p-4">
                <div className="font-heading text-xs uppercase text-dynasty-muted">Read</div>
                <div className="mt-1 font-heading text-sm text-dynasty-text">
                  {profile.summary}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
            <div className="border-b border-dynasty-border px-4 py-3">
              <h2 className="font-heading text-sm font-semibold text-dynasty-text">
                Morale Snapshot
              </h2>
            </div>
            <div className="space-y-4 p-4">
              <div className="flex items-end justify-between">
                <div>
                  <div className="font-heading text-xs uppercase text-dynasty-muted">Current score</div>
                  <div className={`font-data text-4xl font-bold ${moraleTone(profile.morale.score)}`}>
                    {profile.morale.score}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-heading text-xs uppercase text-dynasty-muted">Trend</div>
                  <div className="font-data text-sm text-dynasty-text">
                    {profile.morale.trend.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="rounded border border-dynasty-border bg-dynasty-elevated p-4">
                <div className="font-heading text-xs uppercase text-dynasty-muted">Latest note</div>
                <div className="mt-1 font-heading text-sm text-dynasty-text">
                  {profile.morale.summary}
                </div>
                <div className="mt-2 font-data text-xs text-dynasty-muted">
                  Updated {profile.morale.lastUpdated}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {player.stats ? (
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
      ) : (
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8 text-center">
          <p className="font-heading text-sm text-dynasty-muted">
            No stats yet. Sim games to see this player&apos;s performance.
          </p>
        </div>
      )}
    </div>
  );
}

function PersonalityStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-dynasty-border bg-dynasty-elevated p-3 text-center">
      <div className="font-heading text-[10px] uppercase text-dynasty-muted">{label}</div>
      <div className="mt-1 font-data text-2xl font-bold text-dynasty-text">{value}</div>
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
