import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

interface PlayerDTO {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  teamId: string;
  displayRating: number;
  stats: {
    avg: string;
    hr: number;
    rbi: number;
    hits: number;
    k: number;
    bb: number;
    era: string;
    strikeouts: number;
    walks: number;
  } | null;
}

type StatCategory = 'hr' | 'rbi' | 'avg' | 'hits' | 'k' | 'era';

const BATTING_CATS: { key: StatCategory; label: string }[] = [
  { key: 'hr', label: 'Home Runs' },
  { key: 'rbi', label: 'RBI' },
  { key: 'avg', label: 'Batting Avg' },
  { key: 'hits', label: 'Hits' },
];

const PITCHING_CATS: { key: StatCategory; label: string }[] = [
  { key: 'era', label: 'ERA' },
  { key: 'k', label: 'Strikeouts' },
];

function getStatValue(player: PlayerDTO, cat: StatCategory): string {
  if (!player.stats) return '-';
  switch (cat) {
    case 'hr': return String(player.stats.hr);
    case 'rbi': return String(player.stats.rbi);
    case 'avg': return player.stats.avg;
    case 'hits': return String(player.stats.hits);
    case 'k': return String(player.stats.strikeouts);
    case 'era': return player.stats.era;
  }
}

export default function LeadersPage() {
  const worker = useWorker();
  const { day, season, phase, isInitialized } = useGameStore();
  const [activeCat, setActiveCat] = useState<StatCategory>('hr');
  const [leaders, setLeaders] = useState<PlayerDTO[]>([]);

  const fetchLeaders = useCallback(async () => {
    if (!isInitialized || !worker.isReady) return;
    const data = await worker.getLeagueLeaders(activeCat, 20);
    setLeaders(data as PlayerDTO[]);
  }, [isInitialized, worker, activeCat]);

  useEffect(() => {
    fetchLeaders();
  }, [fetchLeaders, day, season, phase]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-dynasty-text">Stat Leaders</h1>
        <p className="font-data text-sm text-dynasty-muted">Season {season}</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <span className="font-heading text-xs uppercase text-dynasty-muted self-center mr-2">Batting:</span>
        {BATTING_CATS.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCat(cat.key)}
            className={`rounded-md px-3 py-1.5 font-heading text-xs font-semibold transition-colors ${
              activeCat === cat.key
                ? 'bg-accent-primary text-white'
                : 'bg-dynasty-surface text-dynasty-muted hover:text-dynasty-text'
            }`}
          >
            {cat.label}
          </button>
        ))}
        <span className="font-heading text-xs uppercase text-dynasty-muted self-center ml-4 mr-2">Pitching:</span>
        {PITCHING_CATS.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCat(cat.key)}
            className={`rounded-md px-3 py-1.5 font-heading text-xs font-semibold transition-colors ${
              activeCat === cat.key
                ? 'bg-accent-primary text-white'
                : 'bg-dynasty-surface text-dynasty-muted hover:text-dynasty-text'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Leaders table */}
      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                <th className="w-12 px-4 py-2 text-left font-heading">#</th>
                <th className="px-2 py-2 text-left font-heading">Player</th>
                <th className="px-2 py-2 text-left font-heading">POS</th>
                <th className="px-2 py-2 text-left font-heading">TEAM</th>
                <th className="px-2 py-2 text-right font-data">OVR</th>
                <th className="px-2 py-2 text-right font-data font-bold">
                  {BATTING_CATS.find(c => c.key === activeCat)?.label ??
                   PITCHING_CATS.find(c => c.key === activeCat)?.label ?? activeCat.toUpperCase()}
                </th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((player, idx) => (
                <tr key={player.id} className="border-b border-dynasty-border/50 text-sm hover:bg-dynasty-elevated">
                  <td className="px-4 py-2 font-data text-dynasty-muted">{idx + 1}</td>
                  <td className="px-2 py-2">
                    <Link
                      to={`/players/${player.id}`}
                      className="font-heading font-medium text-dynasty-text hover:text-accent-primary"
                    >
                      {player.firstName} {player.lastName}
                    </Link>
                  </td>
                  <td className="px-2 py-2 font-data text-dynasty-muted">{player.position}</td>
                  <td className="px-2 py-2 font-data text-dynasty-muted">{player.teamId.toUpperCase()}</td>
                  <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.displayRating}</td>
                  <td className="px-2 py-2 text-right font-data text-lg font-bold text-accent-primary">
                    {getStatValue(player, activeCat)}
                  </td>
                </tr>
              ))}
              {leaders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-heading text-sm text-dynasty-muted">
                    Sim games to see leaders
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
