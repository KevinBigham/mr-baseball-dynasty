import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  ChevronRight,
  Activity,
  Users,
  Bell,
  Briefcase,
} from 'lucide-react';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

interface TeamStandings {
  teamId: string;
  teamName: string;
  abbreviation: string;
  wins: number;
  losses: number;
  pct: string;
  gamesBack: number;
  streak: string;
  runDifferential: number;
}

interface PlayerStat {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  age: number;
  displayRating: number;
  letterGrade: string;
  stats: {
    avg: string;
    hr: number;
    rbi: number;
    hits: number;
    era: string;
    strikeouts: number;
  } | null;
}

interface BriefingItem {
  id: string;
  priority: number;
  category: string;
  headline: string;
  body: string;
  timestamp: string;
}

interface NewsItem {
  id: string;
  priority: number;
  category: string;
  headline: string;
  body: string;
  timestamp: string;
}

interface TeamChemistry {
  score: number;
  tier: string;
  trend: string;
  summary: string;
  reasons: string[];
}

interface OwnerState {
  hotSeat: boolean;
  patience: number;
  confidence: number;
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

function priorityTone(priority: number): string {
  if (priority <= 1) return 'text-accent-danger';
  if (priority === 2) return 'text-accent-warning';
  if (priority === 3) return 'text-accent-info';
  return 'text-dynasty-muted';
}

function chemistryTone(tier: string | undefined): string {
  switch (tier) {
    case 'electric': return 'text-accent-success';
    case 'connected': return 'text-accent-info';
    case 'steady': return 'text-dynasty-text';
    case 'tense': return 'text-accent-warning';
    case 'fractured': return 'text-accent-danger';
    default: return 'text-dynasty-muted';
  }
}

export default function DashboardPage() {
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { season, day, phase, userTeamId, isInitialized } = useGameStore();
  const [userStandings, setUserStandings] = useState<TeamStandings | null>(null);
  const [divisionStandings, setDivisionStandings] = useState<TeamStandings[]>([]);
  const [roster, setRoster] = useState<PlayerStat[]>([]);
  const [leaders, setLeaders] = useState<PlayerStat[]>([]);
  const [briefing, setBriefing] = useState<BriefingItem[]>([]);
  const [unreadNews, setUnreadNews] = useState<NewsItem[]>([]);
  const [chemistry, setChemistry] = useState<TeamChemistry | null>(null);
  const [ownerState, setOwnerState] = useState<OwnerState | null>(null);

  const fetchData = useCallback(async () => {
    if (!isInitialized || !workerReady) return;

    try {
      const [
        standingsData,
        rosterData,
        hrLeaders,
        briefingData,
        newsData,
        chemistryData,
        ownerData,
      ] = await Promise.all([
        worker.getStandings(),
        worker.getTeamRoster(userTeamId),
        worker.getLeagueLeaders('hr', 5),
        worker.getBriefing(5),
        worker.getNews(5),
        worker.getTeamChemistry(userTeamId),
        worker.getOwnerState(userTeamId),
      ]);

      if (standingsData) {
        for (const teams of Object.values(standingsData.divisions)) {
          const typedTeams = teams as TeamStandings[];
          const userTeam = typedTeams.find((team) => team.teamId === userTeamId);
          if (userTeam) {
            setUserStandings(userTeam);
            setDivisionStandings(typedTeams);
            break;
          }
        }
      }

      setRoster(rosterData as PlayerStat[]);
      setLeaders(hrLeaders as PlayerStat[]);
      setBriefing((briefingData ?? []) as BriefingItem[]);
      setUnreadNews((newsData ?? []) as NewsItem[]);
      setChemistry((chemistryData ?? null) as TeamChemistry | null);
      setOwnerState((ownerData ?? null) as OwnerState | null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  }, [isInitialized, workerReady, userTeamId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData, day, season, phase]);

  const handleMarkNewsRead = useCallback(async (newsId: string) => {
    if (!workerReady) return;
    await worker.markNewsRead(newsId);
    await fetchData();
  }, [fetchData, workerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-dynasty-text">
          Front Office
        </h1>
        <p className="font-data text-sm text-dynasty-muted">
          Season {season} | Day {day} | {phase.toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="flex items-center gap-2 text-dynasty-muted">
            <Trophy className="h-4 w-4" />
            <span className="font-heading text-xs uppercase">Record</span>
          </div>
          {userStandings ? (
            <div className="mt-2">
              <div className="font-data text-3xl font-bold text-dynasty-text">
                {userStandings.wins}-{userStandings.losses}
              </div>
              <div className="mt-1 flex items-center gap-3 font-data text-sm">
                <span className="text-dynasty-muted">PCT {userStandings.pct}</span>
                <span className={userStandings.gamesBack > 0 ? 'text-accent-warning' : 'text-accent-success'}>
                  {userStandings.gamesBack > 0 ? `${userStandings.gamesBack} GB` : '1st'}
                </span>
                <span className={userStandings.streak.startsWith('W') ? 'text-accent-success' : 'text-accent-danger'}>
                  {userStandings.streak}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-2 font-data text-3xl text-dynasty-muted">0-0</div>
          )}
        </div>

        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="flex items-center gap-2 text-dynasty-muted">
            <Activity className="h-4 w-4" />
            <span className="font-heading text-xs uppercase">Run Differential</span>
          </div>
          <div className="mt-2">
            <div className={`font-data text-3xl font-bold ${
              (userStandings?.runDifferential ?? 0) >= 0 ? 'text-accent-success' : 'text-accent-danger'
            }`}>
              {(userStandings?.runDifferential ?? 0) >= 0 ? '+' : ''}{userStandings?.runDifferential ?? 0}
            </div>
            {chemistry && (
              <div className="mt-1 font-data text-sm text-dynasty-muted">
                Chemistry <span className={chemistryTone(chemistry.tier)}>{chemistry.tier.toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
          <div className="flex items-center gap-2 text-dynasty-muted">
            <Users className="h-4 w-4" />
            <span className="font-heading text-xs uppercase">Active Roster</span>
          </div>
          <div className="mt-2">
            <div className="font-data text-3xl font-bold text-dynasty-text">{roster.length}</div>
            <div className="mt-1 font-data text-sm text-dynasty-muted">
              {ownerState?.hotSeat ? 'Owner pressure elevated' : 'players on 26-man'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
          <div className="flex items-center justify-between border-b border-dynasty-border px-4 py-3">
            <h2 className="font-heading text-sm font-semibold text-dynasty-text">Front Office Briefing</h2>
            <div className="flex items-center gap-3 font-data text-xs">
              {chemistry && (
                <span className={chemistryTone(chemistry.tier)}>
                  Chemistry {chemistry.score}
                </span>
              )}
              {ownerState && (
                <span className={ownerState.hotSeat ? 'text-accent-danger' : 'text-dynasty-muted'}>
                  Patience {ownerState.patience}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-3 p-4">
            {briefing.length > 0 ? briefing.map((item) => (
              <div key={item.id} className="rounded border border-dynasty-border bg-dynasty-elevated p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-heading text-sm font-semibold text-dynasty-text">
                      {item.headline}
                    </div>
                    <div className="mt-1 font-heading text-xs text-dynasty-muted">
                      {item.body}
                    </div>
                  </div>
                  <div className={`font-data text-xs ${priorityTone(item.priority)}`}>
                    P{item.priority}
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded border border-dynasty-border bg-dynasty-elevated p-4 font-heading text-sm text-dynasty-muted">
                No new briefing items. Sim ahead or open the scouting and history tabs for more context.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
          <div className="flex items-center justify-between border-b border-dynasty-border px-4 py-3">
            <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-dynasty-text">
              <Bell className="h-4 w-4 text-accent-warning" />
              Unread Inbox
            </h2>
            <span className="font-data text-xs text-dynasty-muted">{unreadNews.length} unread</span>
          </div>
          <div className="space-y-3 p-4">
            {unreadNews.length > 0 ? unreadNews.map((item) => (
              <div key={item.id} className="rounded border border-dynasty-border bg-dynasty-elevated p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-heading text-sm font-semibold text-dynasty-text">
                      {item.headline}
                    </div>
                    <div className="mt-1 font-heading text-xs text-dynasty-muted">
                      {item.body}
                    </div>
                    <div className="mt-2 font-data text-[11px] uppercase text-dynasty-muted">
                      {item.category.replace('_', ' ')} | {item.timestamp}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { void handleMarkNewsRead(item.id); }}
                    className="rounded border border-dynasty-border px-2 py-1 font-heading text-[11px] uppercase text-dynasty-muted hover:text-accent-primary"
                  >
                    Read
                  </button>
                </div>
              </div>
            )) : (
              <div className="rounded border border-dynasty-border bg-dynasty-elevated p-4 font-heading text-sm text-dynasty-muted">
                Inbox is clear.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
          <div className="flex items-center justify-between border-b border-dynasty-border px-4 py-3">
            <h2 className="font-heading text-sm font-semibold text-dynasty-text">Division Standings</h2>
            <Link to="/standings" className="flex items-center gap-1 font-heading text-xs text-accent-info hover:text-accent-primary">
              Full standings <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                <th className="px-4 py-2 text-left font-heading">Team</th>
                <th className="px-2 py-2 text-right font-data">W</th>
                <th className="px-2 py-2 text-right font-data">L</th>
                <th className="px-2 py-2 text-right font-data">PCT</th>
                <th className="px-2 py-2 text-right font-data">GB</th>
                <th className="px-2 py-2 text-right font-data">STRK</th>
              </tr>
            </thead>
            <tbody>
              {divisionStandings.map((team) => (
                <tr key={team.teamId} className={`border-b border-dynasty-border/50 text-sm hover:bg-dynasty-elevated ${team.teamId === userTeamId ? 'bg-accent-primary/10' : ''}`}>
                  <td className="px-4 py-2 font-heading font-medium text-dynasty-text">{team.abbreviation}</td>
                  <td className="px-2 py-2 text-right font-data text-dynasty-text">{team.wins}</td>
                  <td className="px-2 py-2 text-right font-data text-dynasty-text">{team.losses}</td>
                  <td className="px-2 py-2 text-right font-data text-dynasty-muted">{team.pct}</td>
                  <td className="px-2 py-2 text-right font-data text-dynasty-muted">{team.gamesBack === 0 ? '-' : team.gamesBack.toFixed(1)}</td>
                  <td className={`px-2 py-2 text-right font-data ${team.streak.startsWith('W') ? 'text-accent-success' : 'text-accent-danger'}`}>{team.streak}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
          <div className="flex items-center justify-between border-b border-dynasty-border px-4 py-3">
            <h2 className="font-heading text-sm font-semibold text-dynasty-text">HR Leaders</h2>
            <Link to="/leaders" className="flex items-center gap-1 font-heading text-xs text-accent-info hover:text-accent-primary">
              All leaders <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                <th className="px-4 py-2 text-left font-heading">#</th>
                <th className="px-2 py-2 text-left font-heading">Player</th>
                <th className="px-2 py-2 text-left font-heading">POS</th>
                <th className="px-2 py-2 text-right font-data">HR</th>
                <th className="px-2 py-2 text-right font-data">RBI</th>
                <th className="px-2 py-2 text-right font-data">AVG</th>
              </tr>
            </thead>
            <tbody>
              {leaders.map((player, idx) => (
                <tr key={player.id} className="border-b border-dynasty-border/50 text-sm hover:bg-dynasty-elevated">
                  <td className="px-4 py-2 font-data text-dynasty-muted">{idx + 1}</td>
                  <td className="px-2 py-2 font-heading font-medium text-dynasty-text">
                    {player.firstName.charAt(0)}. {player.lastName}
                  </td>
                  <td className="px-2 py-2 font-data text-dynasty-muted">{player.position}</td>
                  <td className="px-2 py-2 text-right font-data font-bold text-accent-primary">{player.stats?.hr ?? 0}</td>
                  <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.stats?.rbi ?? 0}</td>
                  <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.stats?.avg ?? '.000'}</td>
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

      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
        <div className="flex items-center justify-between border-b border-dynasty-border px-4 py-3">
          <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-dynasty-text">
            <Briefcase className="h-4 w-4 text-accent-info" />
            Your Roster
          </h2>
          <Link to="/roster" className="flex items-center gap-1 font-heading text-xs text-accent-info hover:text-accent-primary">
            Full roster <ChevronRight className="h-3 w-3" />
          </Link>
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
                <th className="px-2 py-2 text-right font-data">AVG</th>
                <th className="px-2 py-2 text-right font-data">HR</th>
                <th className="px-2 py-2 text-right font-data">RBI</th>
              </tr>
            </thead>
            <tbody>
              {roster.slice(0, 15).map((player) => (
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
                  <td className="px-2 py-2 text-right font-data text-dynasty-muted">{player.stats?.avg ?? '-'}</td>
                  <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.stats?.hr ?? '-'}</td>
                  <td className="px-2 py-2 text-right font-data text-dynasty-text">{player.stats?.rbi ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
