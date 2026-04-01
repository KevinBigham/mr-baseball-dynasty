import { useEffect, useState, useCallback } from 'react';
import { Search, Eye, Shield, Target, Users, FileText, ClipboardList } from 'lucide-react';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Scout {
  id: string;
  name: string;
  quality: number;
  specialty: string;
  bias: string;
}

interface ScoutReport {
  playerId: string;
  playerName: string;
  position: string;
  age: number;
  teamName: string;
  isPitcher: boolean;
  grades: Record<string, number>;
  confidence: number;
  overall: number;
  ceiling: number;
  floor: number;
  notes: string;
  scoutName: string;
  date: string;
  reliability: number;
}

interface PlayerDTO {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  position: string;
  overallRating: number;
  teamId: string;
}

/* ------------------------------------------------------------------ */
/*  GradeBar                                                          */
/* ------------------------------------------------------------------ */

function ScoutGradeBar({ label, grade, confidence }: { label: string; grade: number; confidence: number }) {
  const pct = ((grade - 20) / 60) * 100;
  const color = grade >= 60 ? 'bg-accent-success' : grade >= 50 ? 'bg-accent-info' : grade >= 40 ? 'bg-accent-warning' : 'bg-accent-danger';
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-right font-heading text-xs text-dynasty-muted">{label}</span>
      <div className="relative h-4 flex-1 rounded bg-dynasty-elevated">
        <div className={`h-full rounded ${color}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <span className="w-8 text-right font-data text-sm text-dynasty-text">{grade}</span>
      <span className="w-14 text-right font-data text-xs text-dynasty-muted">[&plusmn;{confidence}]</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Quality bar for scouts                                            */
/* ------------------------------------------------------------------ */

function QualityBar({ value }: { value: number }) {
  const color = value >= 70 ? 'bg-accent-success' : value >= 50 ? 'bg-accent-info' : value >= 30 ? 'bg-accent-warning' : 'bg-accent-danger';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded bg-dynasty-elevated">
        <div className={`h-full rounded ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-data text-xs text-dynasty-muted">{value}</span>
    </div>
  );
}

const PITCHER_POS = new Set(['SP', 'RP', 'CL']);
const HITTER_ATTRS = ['Contact', 'Power', 'Eye', 'Speed', 'Defense', 'Durability'];
const PITCHER_ATTRS = ['Stuff', 'Control', 'Stamina', 'Velocity', 'Movement'];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function ScoutingPage() {
  const worker = useWorker();
  const workerReady = worker.isReady;
  const { userTeamId, isInitialized } = useGameStore();

  const [scouts, setScouts] = useState<Scout[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlayerDTO[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDTO | null>(null);
  const [scoutReport, setScoutReport] = useState<ScoutReport | null>(null);
  const [recentReports, setRecentReports] = useState<ScoutReport[]>([]);
  const [loading, setLoading] = useState(false);

  /* Fetch scouting staff */
  useEffect(() => {
    if (!isInitialized || !worker.isReady) return;
    (async () => {
      try {
        const staff = await (worker as any).getScoutingStaff();
        if (Array.isArray(staff)) setScouts(staff);
      } catch { /* method not yet wired */ }
    })();
  }, [isInitialized, workerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Search players */
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !worker.isReady) return;
    try {
      const results = await worker.searchPlayers(searchQuery.trim(), 10);
      setSearchResults(results as PlayerDTO[]);
    } catch { setSearchResults([]); }
  }, [searchQuery, workerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Scout a player */
  const handleScout = useCallback(async (player: PlayerDTO) => {
    setSelectedPlayer(player);
    setScoutReport(null);
    setLoading(true);
    try {
      const report = await (worker as any).scoutPlayerReport(player.id);
      if (report) {
        setScoutReport(report);
        setRecentReports(prev => [report, ...prev].slice(0, 20));
      }
    } catch { /* method not yet wired */ }
    setLoading(false);
  }, [workerReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const attrs = scoutReport?.isPitcher ? PITCHER_ATTRS : HITTER_ATTRS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">Scouting</h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Deploy scouts to evaluate talent. Uncover hidden gems before the draft.
        </p>
      </div>

      {/* Scouting Staff */}
      <section className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-accent-primary" />
          <h2 className="font-heading text-sm font-semibold text-dynasty-textBright">Your Scouting Department</h2>
        </div>
        {scouts.length === 0 ? (
          <p className="py-4 text-center font-heading text-xs text-dynasty-muted">
            Scouting staff data unavailable. Start a game to populate your department.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {scouts.map(s => (
              <div key={s.id} className="rounded border border-dynasty-border bg-dynasty-elevated p-3">
                <p className="font-heading text-sm font-semibold text-dynasty-text">{s.name}</p>
                <QualityBar value={s.quality} />
                <div className="mt-1 flex gap-3 font-data text-[10px] text-dynasty-muted">
                  <span>{s.specialty}</span>
                  <span className="text-accent-warning">{s.bias}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Scout a Player */}
      <section className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4 text-accent-info" />
          <h2 className="font-heading text-sm font-semibold text-dynasty-textBright">Scout a Player</h2>
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-4 w-4 text-dynasty-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search player by name..."
              className="w-full rounded border border-dynasty-border bg-dynasty-elevated py-1.5 pl-9 pr-3 font-heading text-sm text-dynasty-text placeholder-dynasty-muted outline-none focus:border-accent-primary"
            />
          </div>
          <button onClick={handleSearch} className="rounded bg-accent-primary px-4 py-1.5 font-heading text-xs font-semibold text-black hover:opacity-90">
            Search
          </button>
        </div>

        {/* Results dropdown */}
        {searchResults.length > 0 && (
          <div className="mt-2 max-h-48 overflow-y-auto rounded border border-dynasty-border bg-dynasty-elevated">
            {searchResults.map(p => (
              <button
                key={p.id}
                onClick={() => { handleScout(p); setSearchResults([]); }}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-dynasty-surface"
              >
                <span className="font-heading text-sm text-dynasty-text">
                  {p.firstName} {p.lastName}
                </span>
                <span className="font-data text-xs text-dynasty-muted">{p.position} / Age {p.age}</span>
              </button>
            ))}
          </div>
        )}

        {/* Report */}
        {loading && (
          <div className="mt-4 flex items-center gap-2 py-6 text-center">
            <Target className="mx-auto h-5 w-5 animate-spin text-accent-primary" />
          </div>
        )}

        {scoutReport && !loading && (
          <div className="mt-4 space-y-4 rounded border border-dynasty-border bg-dynasty-elevated p-4">
            {/* Player header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-base font-bold text-dynasty-textBright">{scoutReport.playerName}</h3>
                <p className="font-data text-xs text-dynasty-muted">
                  {scoutReport.position} &middot; Age {scoutReport.age} &middot; {scoutReport.teamName}
                </p>
              </div>
              <div className="text-right">
                <p className="font-data text-3xl font-bold text-accent-primary">{scoutReport.overall}</p>
                <p className="font-heading text-[10px] text-dynasty-muted">Overall Grade</p>
              </div>
            </div>

            {/* Grade bars */}
            <div className="space-y-2">
              {attrs.map(attr => (
                <ScoutGradeBar
                  key={attr}
                  label={attr}
                  grade={scoutReport.grades[attr.toLowerCase()] ?? 50}
                  confidence={scoutReport.confidence}
                />
              ))}
            </div>

            {/* Projections */}
            <div className="flex gap-6 border-t border-dynasty-border pt-3">
              <div>
                <p className="font-heading text-[10px] text-dynasty-muted">Ceiling</p>
                <p className="font-data text-lg font-bold text-accent-success">{scoutReport.ceiling}</p>
              </div>
              <div>
                <p className="font-heading text-[10px] text-dynasty-muted">Floor</p>
                <p className="font-data text-lg font-bold text-accent-danger">{scoutReport.floor}</p>
              </div>
              <div>
                <p className="font-heading text-[10px] text-dynasty-muted">Reliability</p>
                <div className="mt-0.5 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Shield key={i} className={`h-3 w-3 ${i <= scoutReport.reliability ? 'text-accent-info' : 'text-dynasty-border'}`} />
                  ))}
                </div>
              </div>
            </div>

            {/* Notes */}
            {scoutReport.notes && (
              <div className="border-t border-dynasty-border pt-3">
                <div className="flex items-center gap-1 mb-1">
                  <FileText className="h-3 w-3 text-dynasty-muted" />
                  <p className="font-heading text-[10px] text-dynasty-muted">Scout Notes ({scoutReport.scoutName})</p>
                </div>
                <p className="font-heading text-xs italic text-dynasty-text">{scoutReport.notes}</p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Recent Reports */}
      <section className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-accent-warning" />
          <h2 className="font-heading text-sm font-semibold text-dynasty-textBright">Recent Reports</h2>
        </div>
        {recentReports.length === 0 ? (
          <p className="py-4 text-center font-heading text-xs text-dynasty-muted">
            No reports yet. Search for a player above to generate a scouting report.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-dynasty-border text-dynasty-muted">
                  <th className="py-2 pr-4 font-heading text-[10px] font-semibold uppercase">Name</th>
                  <th className="py-2 pr-4 font-heading text-[10px] font-semibold uppercase">POS</th>
                  <th className="py-2 pr-4 text-right font-heading text-[10px] font-semibold uppercase">Overall</th>
                  <th className="py-2 pr-4 text-right font-heading text-[10px] font-semibold uppercase">Confidence</th>
                  <th className="py-2 pr-4 font-heading text-[10px] font-semibold uppercase">Scout</th>
                  <th className="py-2 font-heading text-[10px] font-semibold uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((r, i) => (
                  <tr key={`${r.playerId}-${i}`} className="border-b border-dynasty-border/50 hover:bg-dynasty-elevated/50">
                    <td className="py-2 pr-4 font-heading text-sm text-dynasty-text">{r.playerName}</td>
                    <td className="py-2 pr-4 font-data text-xs text-dynasty-muted">{r.position}</td>
                    <td className="py-2 pr-4 text-right font-data text-sm text-dynasty-textBright">{r.overall}</td>
                    <td className="py-2 pr-4 text-right font-data text-xs text-dynasty-muted">&plusmn;{r.confidence}</td>
                    <td className="py-2 pr-4 font-heading text-xs text-dynasty-muted">{r.scoutName}</td>
                    <td className="py-2 font-data text-xs text-dynasty-muted">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
