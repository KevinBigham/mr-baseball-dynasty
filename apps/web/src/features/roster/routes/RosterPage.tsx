import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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

interface TeamChemistry {
  score: number;
  tier: string;
  trend: string;
  summary: string;
  reasons: string[];
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

function chemistryTone(tier: string): string {
  switch (tier) {
    case 'electric': return 'text-accent-success';
    case 'connected': return 'text-accent-info';
    case 'steady': return 'text-dynasty-text';
    case 'tense': return 'text-accent-warning';
    default: return 'text-accent-danger';
  }
}

const PITCHER_POSITIONS = new Set(['SP', 'RP', 'CL']);

export default function RosterPage() {
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { day, season, phase, userTeamId, isInitialized } = useGameStore();
  const [mlbRoster, setMlbRoster] = useState<PlayerDTO[]>([]);
  const [minors, setMinors] = useState<Record<string, PlayerDTO[]>>({});
  const [chemistry, setChemistry] = useState<TeamChemistry | null>(null);
  const [activeTab, setActiveTab] = useState<'mlb' | 'minors'>('mlb');

  const fetchRoster = useCallback(async () => {
    if (!isInitialized || !workerReady) return;
    const [data, chemistryData] = await Promise.all([
      worker.getFullRoster(userTeamId),
      worker.getTeamChemistry(userTeamId),
    ]);
    if (data) {
      setMlbRoster(data.mlb as PlayerDTO[]);
      setMinors(data.minors as Record<string, PlayerDTO[]>);
    }
    setChemistry((chemistryData ?? null) as TeamChemistry | null);
  }, [isInitialized, workerReady, userTeamId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster, day, season, phase]);

  const hitters = mlbRoster.filter((player) => !PITCHER_POSITIONS.has(player.position));
  const pitchers = mlbRoster.filter((player) => PITCHER_POSITIONS.has(player.position));

  const minorLevels = [
    { key: 'AAA', label: 'AAA' },
    { key: 'AA', label: 'AA' },
    { key: 'A_PLUS', label: 'A+' },
    { key: 'A', label: 'A' },
    { key: 'ROOKIE', label: 'Rookie' },
    { key: 'INTERNATIONAL', label: 'International' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-dynasty-text">Roster</h1>
        <p className="font-data text-sm text-dynasty-muted">
          {mlbRoster.length} players on 26-man roster
        </p>
      </div>

      {chemistry && (
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="font-heading text-xs uppercase text-dynasty-muted">Clubhouse chemistry</div>
              <div className="mt-1 flex items-end gap-3">
                <div className={`font-data text-4xl font-bold ${chemistryTone(chemistry.tier)}`}>
                  {chemistry.score}
                </div>
                <div className="pb-1 font-heading text-sm text-dynasty-muted">
                  {chemistry.tier.toUpperCase()} | {chemistry.trend.toUpperCase()}
                </div>
              </div>
              <div className="mt-2 font-heading text-sm text-dynasty-text">
                {chemistry.summary}
              </div>
            </div>
            <div className="grid gap-2 text-sm">
              {chemistry.reasons.map((reason) => (
                <div key={reason} className="rounded border border-dynasty-border bg-dynasty-elevated px-3 py-2 font-heading text-dynasty-muted">
                  {reason}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('mlb')}
          className={`rounded-md px-4 py-2 font-heading text-sm font-semibold transition-colors ${
            activeTab === 'mlb'
              ? 'bg-accent-primary text-white'
              : 'bg-dynasty-surface text-dynasty-muted hover:text-dynasty-text'
          }`}
        >
          MLB Roster ({mlbRoster.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('minors')}
          className={`rounded-md px-4 py-2 font-heading text-sm font-semibold transition-colors ${
            activeTab === 'minors'
              ? 'bg-accent-primary text-white'
              : 'bg-dynasty-surface text-dynasty-muted hover:text-dynasty-text'
          }`}
        >
          Minor Leagues
        </button>
      </div>

      {activeTab === 'mlb' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
            <div className="border-b border-dynasty-border px-4 py-3">
              <h2 className="font-heading text-sm font-semibold text-dynasty-text">
                Position Players ({hitters.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                    <th className="px-4 py-2 text-left font-heading">Player</th>
                    <th className="px-2 py-2 text-left font-heading">POS</th>
                    <th className="px-2 py-2 text-right font-data">OVR</th>
                    <th className="px-2 py-2 text-center font-heading">GRD</th>
                    <th className="px-2 py-2 text-right font-data">AGE</th>
                    <th className="px-2 py-2 text-right font-data">PA</th>
                    <th className="px-2 py-2 text-right font-data">AVG</th>
                    <th className="px-2 py-2 text-right font-data">HR</th>
                    <th className="px-2 py-2 text-right font-data">RBI</th>
                    <th className="px-2 py-2 text-right font-data">BB</th>
                    <th className="px-2 py-2 text-right font-data">K</th>
                  </tr>
                </thead>
                <tbody>
                  {hitters.map((player) => (
                    <tr key={player.id} className="border-b border-dynasty-border/50 text-sm hover:bg-dynasty-elevated">
                      <td className="px-4 py-2">
                        <Link
                          to={`/players/${player.id}`}
                          className="font-heading font-medium text-dynasty-text hover:text-accent-primary"
                        >
                          {player.firstName} {player.lastName}
                        </Link>
                      </td>
                      <td className="px-2 py-2 font-data text-dynasty-muted">{player.position}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.displayRating}</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`inline-block w-6 rounded text-center font-data text-xs font-bold ${gradeColor(player.letterGrade)}`}>
                          {player.letterGrade}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.age}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.stats?.pa ?? '-'}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.stats?.avg ?? '-'}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.stats?.hr ?? '-'}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.stats?.rbi ?? '-'}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.stats?.bb ?? '-'}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.stats?.k ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
            <div className="border-b border-dynasty-border px-4 py-3">
              <h2 className="font-heading text-sm font-semibold text-dynasty-text">
                Pitchers ({pitchers.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                    <th className="px-4 py-2 text-left font-heading">Player</th>
                    <th className="px-2 py-2 text-left font-heading">POS</th>
                    <th className="px-2 py-2 text-right font-data">OVR</th>
                    <th className="px-2 py-2 text-center font-heading">GRD</th>
                    <th className="px-2 py-2 text-right font-data">AGE</th>
                    <th className="px-2 py-2 text-right font-data">ERA</th>
                    <th className="px-2 py-2 text-right font-data">K</th>
                    <th className="px-2 py-2 text-right font-data">BB</th>
                    <th className="px-2 py-2 text-right font-data">H</th>
                  </tr>
                </thead>
                <tbody>
                  {pitchers.map((player) => (
                    <tr key={player.id} className="border-b border-dynasty-border/50 text-sm hover:bg-dynasty-elevated">
                      <td className="px-4 py-2">
                        <Link
                          to={`/players/${player.id}`}
                          className="font-heading font-medium text-dynasty-text hover:text-accent-primary"
                        >
                          {player.firstName} {player.lastName}
                        </Link>
                      </td>
                      <td className="px-2 py-2 font-data text-dynasty-muted">{player.position}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.displayRating}</td>
                      <td className="px-2 py-2 text-center">
                        <span className={`inline-block w-6 rounded text-center font-data text-xs font-bold ${gradeColor(player.letterGrade)}`}>
                          {player.letterGrade}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.age}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.stats?.era ?? '-'}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.stats?.strikeouts ?? '-'}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.stats?.walks ?? '-'}</td>
                      <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.stats?.hits ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'minors' && (
        <div className="space-y-6">
          {minorLevels.map((level) => {
            const players = minors[level.key] ?? [];
            return (
              <div key={level.key} className="rounded-lg border border-dynasty-border bg-dynasty-surface">
                <div className="border-b border-dynasty-border px-4 py-3">
                  <h2 className="font-heading text-sm font-semibold text-dynasty-text">
                    {level.label} ({players.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                        <th className="px-4 py-2 text-left font-heading">Player</th>
                        <th className="px-2 py-2 text-left font-heading">POS</th>
                        <th className="px-2 py-2 text-right font-data">OVR</th>
                        <th className="px-2 py-2 text-center font-heading">GRD</th>
                        <th className="px-2 py-2 text-right font-data">AGE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.slice(0, 10).map((player) => (
                        <tr key={player.id} className="border-b border-dynasty-border/50 text-sm hover:bg-dynasty-elevated">
                          <td className="px-4 py-2 font-heading font-medium text-dynasty-text">
                            {player.firstName} {player.lastName}
                          </td>
                          <td className="px-2 py-2 font-data text-dynasty-muted">{player.position}</td>
                          <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.displayRating}</td>
                          <td className="px-2 py-2 text-center">
                            <span className={`inline-block w-6 rounded text-center font-data text-xs font-bold ${gradeColor(player.letterGrade)}`}>
                              {player.letterGrade}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.age}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
