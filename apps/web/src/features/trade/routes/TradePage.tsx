import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeftRight, ArrowRight, Check, X, RotateCcw,
  ChevronDown, AlertTriangle, Scale,
} from 'lucide-react';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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
  stats: Record<string, unknown> | null;
}

interface TradeResult {
  status: 'accepted' | 'rejected' | 'counter';
  message: string;
  counterOffer?: { offering: string[]; requesting: string[] };
}

/* ------------------------------------------------------------------ */
/*  Static team list (fallback until worker exposes getTeams)          */
/* ------------------------------------------------------------------ */

const ALL_TEAMS = [
  { id: 'bal', name: 'Orioles', abbr: 'BAL' }, { id: 'bos', name: 'Red Sox', abbr: 'BOS' },
  { id: 'nyy', name: 'Yankees', abbr: 'NYY' }, { id: 'tb', name: 'Rays', abbr: 'TBR' },
  { id: 'tor', name: 'Blue Jays', abbr: 'TOR' }, { id: 'cws', name: 'White Sox', abbr: 'CWS' },
  { id: 'cle', name: 'Guardians', abbr: 'CLE' }, { id: 'det', name: 'Tigers', abbr: 'DET' },
  { id: 'kc', name: 'Royals', abbr: 'KCR' }, { id: 'min', name: 'Twins', abbr: 'MIN' },
  { id: 'hou', name: 'Astros', abbr: 'HOU' }, { id: 'laa', name: 'Angels', abbr: 'LAA' },
  { id: 'oak', name: 'Athletics', abbr: 'OAK' }, { id: 'sea', name: 'Mariners', abbr: 'SEA' },
  { id: 'tex', name: 'Rangers', abbr: 'TEX' }, { id: 'atl', name: 'Braves', abbr: 'ATL' },
  { id: 'mia', name: 'Marlins', abbr: 'MIA' }, { id: 'nym', name: 'Mets', abbr: 'NYM' },
  { id: 'phi', name: 'Phillies', abbr: 'PHI' }, { id: 'wsh', name: 'Nationals', abbr: 'WSH' },
  { id: 'chc', name: 'Cubs', abbr: 'CHC' }, { id: 'cin', name: 'Reds', abbr: 'CIN' },
  { id: 'mil', name: 'Brewers', abbr: 'MIL' }, { id: 'pit', name: 'Pirates', abbr: 'PIT' },
  { id: 'stl', name: 'Cardinals', abbr: 'STL' }, { id: 'ari', name: 'Diamondbacks', abbr: 'ARI' },
  { id: 'col', name: 'Rockies', abbr: 'COL' }, { id: 'lad', name: 'Dodgers', abbr: 'LAD' },
  { id: 'sd', name: 'Padres', abbr: 'SDP' }, { id: 'sf', name: 'Giants', abbr: 'SFG' },
  { id: 'mtl', name: 'Expos', abbr: 'MTL' }, { id: 'por', name: 'Evergreens', abbr: 'POR' },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-accent-success/20 text-accent-success';
    case 'B': return 'bg-accent-info/20 text-accent-info';
    case 'C': return 'bg-accent-warning/20 text-accent-warning';
    case 'D': return 'bg-accent-danger/20 text-accent-danger';
    default:  return 'bg-dynasty-border text-dynasty-muted';
  }
}

function chipGradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-accent-success';
    case 'B': return 'text-accent-info';
    case 'C': return 'text-accent-warning';
    case 'D': return 'text-accent-danger';
    default:  return 'text-dynasty-muted';
  }
}

/** Rough trade-value heuristic (used when worker method unavailable). */
function estimateValue(p: PlayerDTO): number {
  const ageFactor = Math.max(0, 1 - (p.age - 24) * 0.04);
  return p.overallRating * (0.6 + ageFactor * 0.4);
}

function fairnessRatio(offerVal: number, requestVal: number): number {
  const total = offerVal + requestVal;
  if (total === 0) return 0.5;
  return offerVal / total;
}

function fairnessLabel(ratio: number): { text: string; color: string } {
  if (ratio < 0.3) return { text: 'Heavily favors you', color: 'text-accent-danger' };
  if (ratio < 0.45) return { text: 'Slightly favors you', color: 'text-accent-warning' };
  if (ratio <= 0.55) return { text: 'Fair trade', color: 'text-accent-success' };
  if (ratio <= 0.7) return { text: 'Slightly favors them', color: 'text-accent-warning' };
  return { text: 'Heavily favors them', color: 'text-accent-danger' };
}

/* ------------------------------------------------------------------ */
/*  Roster table row                                                   */
/* ------------------------------------------------------------------ */

function PlayerRow({ player, selected, onClick }: {
  player: PlayerDTO; selected: boolean; onClick: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={`cursor-pointer border-b border-dynasty-border/50 text-sm transition-colors ${
        selected ? 'bg-accent-primary/15' : 'hover:bg-dynasty-elevated'
      }`}
    >
      <td className="px-3 py-1.5 font-heading font-medium text-dynasty-text">
        {player.firstName} {player.lastName}
      </td>
      <td className="px-2 py-1.5 font-data text-dynasty-muted">{player.position}</td>
      <td className="px-2 py-1.5 text-right font-data text-dynasty-text">{player.displayRating}</td>
      <td className="px-2 py-1.5 text-center">
        <span className={`inline-block w-6 rounded text-center font-data text-xs font-bold ${gradeColor(player.letterGrade)}`}>
          {player.letterGrade}
        </span>
      </td>
      <td className="px-2 py-1.5 text-right font-data text-dynasty-muted">{player.age}</td>
    </tr>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function TradePage() {
  const worker = useWorker();
  const { userTeamId, isInitialized, day, season, phase } = useGameStore();

  const [selectedTeam, setSelectedTeam] = useState('');
  const [yourRoster, setYourRoster] = useState<PlayerDTO[]>([]);
  const [targetRoster, setTargetRoster] = useState<PlayerDTO[]>([]);
  const [offering, setOffering] = useState<string[]>([]);
  const [requesting, setRequesting] = useState<string[]>([]);
  const [tradeResult, setTradeResult] = useState<TradeResult | null>(null);
  const [proposing, setProposing] = useState(false);

  const otherTeams = ALL_TEAMS.filter(t => t.id !== userTeamId);

  const workerReady = worker.isReady;

  /* ---- fetch user roster ---- */
  const fetchUser = useCallback(async () => {
    if (!isInitialized || !workerReady) return;
    try {
      const data = await worker.getTeamRoster(userTeamId);
      if (data) setYourRoster(data as PlayerDTO[]);
    } catch { /* worker method may not exist yet */ }
  }, [isInitialized, workerReady, userTeamId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchUser(); }, [fetchUser, day, season, phase]);

  /* ---- fetch target roster ---- */
  useEffect(() => {
    if (!selectedTeam || !isInitialized || !workerReady) {
      setTargetRoster([]);
      return;
    }
    (async () => {
      try {
        const data = await worker.getTeamRoster(selectedTeam);
        if (data) setTargetRoster(data as PlayerDTO[]);
      } catch { /* defensive */ }
    })();
  }, [selectedTeam, isInitialized, workerReady, day, season, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- toggle helpers ---- */
  const toggleOffer = (id: string) => {
    setTradeResult(null);
    setOffering(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleRequest = (id: string) => {
    setTradeResult(null);
    setRequesting(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const clearTrade = () => {
    setOffering([]);
    setRequesting([]);
    setTradeResult(null);
  };

  /* ---- trade value calculation ---- */
  const playerById = (id: string) =>
    yourRoster.find(p => p.id === id) ?? targetRoster.find(p => p.id === id);

  const offerTotal = offering.reduce((s, id) => s + estimateValue(playerById(id)!), 0);
  const requestTotal = requesting.reduce((s, id) => s + estimateValue(playerById(id)!), 0);
  const ratio = fairnessRatio(offerTotal, requestTotal);
  const fairness = fairnessLabel(ratio);

  /* ---- propose trade ---- */
  const proposeTrade = async () => {
    if (offering.length === 0 || requesting.length === 0) return;
    setProposing(true);
    try {
      const result = await (worker as any).proposeTrade({
        fromTeam: userTeamId, toTeam: selectedTeam,
        offering, requesting,
      });
      setTradeResult(result as TradeResult);
    } catch {
      // Fallback: simulate acceptance based on fairness
      if (ratio >= 0.4 && ratio <= 0.6) {
        setTradeResult({ status: 'accepted', message: 'Trade accepted.' });
      } else if (ratio < 0.4) {
        setTradeResult({ status: 'rejected', message: 'The other GM feels this trade is too one-sided.' });
      } else {
        setTradeResult({ status: 'rejected', message: 'Your front office advises against this deal.' });
      }
    } finally {
      setProposing(false);
    }
  };

  const hasPackage = offering.length > 0 || requesting.length > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">Trade Center</h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Build trade packages and negotiate with other front offices.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* LEFT: Your Assets */}
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
          <div className="border-b border-dynasty-border px-4 py-3">
            <h2 className="font-heading text-sm font-semibold text-dynasty-text">Your Assets</h2>
            <p className="font-data text-xs text-dynasty-muted">{yourRoster.length} players</p>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-dynasty-surface">
                <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                  <th className="px-3 py-2 text-left font-heading">Player</th>
                  <th className="px-2 py-2 text-left font-heading">POS</th>
                  <th className="px-2 py-2 text-right font-data">OVR</th>
                  <th className="px-2 py-2 text-center font-heading">GRD</th>
                  <th className="px-2 py-2 text-right font-data">AGE</th>
                </tr>
              </thead>
              <tbody>
                {yourRoster.map(p => (
                  <PlayerRow
                    key={p.id} player={p}
                    selected={offering.includes(p.id)}
                    onClick={() => toggleOffer(p.id)}
                  />
                ))}
                {yourRoster.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center font-heading text-sm text-dynasty-muted">
                    Start a new game to see your roster
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Target Team */}
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
          <div className="border-b border-dynasty-border px-4 py-3">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-sm font-semibold text-dynasty-text">Target Team</h2>
              <div className="relative flex-1">
                <select
                  value={selectedTeam}
                  onChange={e => { setSelectedTeam(e.target.value); setRequesting([]); setTradeResult(null); }}
                  className="w-full appearance-none rounded border border-dynasty-border bg-dynasty-elevated px-3 py-1.5 pr-8 font-heading text-sm text-dynasty-text focus:border-accent-primary focus:outline-none"
                >
                  <option value="">Select a team...</option>
                  {otherTeams.map(t => (
                    <option key={t.id} value={t.id}>{t.abbr} - {t.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-dynasty-muted" />
              </div>
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-dynasty-surface">
                <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
                  <th className="px-3 py-2 text-left font-heading">Player</th>
                  <th className="px-2 py-2 text-left font-heading">POS</th>
                  <th className="px-2 py-2 text-right font-data">OVR</th>
                  <th className="px-2 py-2 text-center font-heading">GRD</th>
                  <th className="px-2 py-2 text-right font-data">AGE</th>
                </tr>
              </thead>
              <tbody>
                {targetRoster.map(p => (
                  <PlayerRow
                    key={p.id} player={p}
                    selected={requesting.includes(p.id)}
                    onClick={() => toggleRequest(p.id)}
                  />
                ))}
                {!selectedTeam && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center font-heading text-sm text-dynasty-muted">
                    Select a team above to view their roster
                  </td></tr>
                )}
                {selectedTeam && targetRoster.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center font-heading text-sm text-dynasty-muted">
                    Loading roster...
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Trade Evaluation Bar */}
      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
        <div className="mb-3 flex items-center gap-2">
          <Scale className="h-4 w-4 text-dynasty-muted" />
          <h3 className="font-heading text-sm font-semibold text-dynasty-text">Trade Package</h3>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          {/* Offering */}
          <div>
            <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-wider text-accent-primary">
              Offering
            </p>
            <div className="flex flex-wrap gap-1.5">
              {offering.length === 0 && (
                <span className="font-heading text-xs text-dynasty-muted">Click players from Your Assets</span>
              )}
              {offering.map(id => {
                const p = playerById(id);
                if (!p) return null;
                return (
                  <button
                    key={id}
                    onClick={() => toggleOffer(id)}
                    className="flex items-center gap-1 rounded border border-dynasty-border bg-dynasty-elevated px-2 py-1 font-data text-xs text-dynasty-text hover:border-accent-danger"
                  >
                    <span>{p.firstName[0]}. {p.lastName}</span>
                    <span className={chipGradeColor(p.letterGrade)}>({p.position}, {p.displayRating})</span>
                    <X className="h-3 w-3 text-dynasty-muted" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Arrow */}
          <div className="hidden items-center md:flex">
            <ArrowLeftRight className="h-5 w-5 text-dynasty-muted" />
          </div>

          {/* Requesting */}
          <div>
            <p className="mb-2 font-heading text-xs font-semibold uppercase tracking-wider text-accent-info">
              Requesting
            </p>
            <div className="flex flex-wrap gap-1.5">
              {requesting.length === 0 && (
                <span className="font-heading text-xs text-dynasty-muted">Click players from Target Team</span>
              )}
              {requesting.map(id => {
                const p = playerById(id);
                if (!p) return null;
                return (
                  <button
                    key={id}
                    onClick={() => toggleRequest(id)}
                    className="flex items-center gap-1 rounded border border-dynasty-border bg-dynasty-elevated px-2 py-1 font-data text-xs text-dynasty-text hover:border-accent-danger"
                  >
                    <span>{p.firstName[0]}. {p.lastName}</span>
                    <span className={chipGradeColor(p.letterGrade)}>({p.position}, {p.displayRating})</span>
                    <X className="h-3 w-3 text-dynasty-muted" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Fairness bar */}
        {hasPackage && (
          <div className="mt-4 space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-dynasty-border">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.round(ratio * 100)}%`,
                  background: ratio >= 0.4 && ratio <= 0.6
                    ? 'rgb(34 197 94)' : ratio >= 0.3 && ratio <= 0.7
                    ? 'rgb(245 158 11)' : 'rgb(244 63 94)',
                }}
              />
            </div>
            <div className="flex items-center justify-between font-data text-xs">
              <span className="text-dynasty-muted">Favors you</span>
              <span className={fairness.color}>{fairness.text}</span>
              <span className="text-dynasty-muted">Favors them</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={proposeTrade}
            disabled={offering.length === 0 || requesting.length === 0 || proposing}
            className="flex items-center gap-2 rounded-md bg-accent-primary px-4 py-2 font-heading text-sm font-semibold text-white transition-colors hover:bg-accent-primary/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowRight className="h-4 w-4" />
            {proposing ? 'Proposing...' : 'Propose Trade'}
          </button>
          {hasPackage && (
            <button
              onClick={clearTrade}
              className="flex items-center gap-2 rounded-md border border-dynasty-border px-4 py-2 font-heading text-sm text-dynasty-muted transition-colors hover:text-dynasty-text"
            >
              <RotateCcw className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Trade Response */}
      {tradeResult && (
        <div className={`rounded-lg border p-4 ${
          tradeResult.status === 'accepted'
            ? 'border-accent-success/40 bg-accent-success/10'
            : tradeResult.status === 'counter'
            ? 'border-accent-warning/40 bg-accent-warning/10'
            : 'border-accent-danger/40 bg-accent-danger/10'
        }`}>
          <div className="flex items-center gap-2">
            {tradeResult.status === 'accepted' && <Check className="h-5 w-5 text-accent-success" />}
            {tradeResult.status === 'rejected' && <X className="h-5 w-5 text-accent-danger" />}
            {tradeResult.status === 'counter' && <AlertTriangle className="h-5 w-5 text-accent-warning" />}
            <h3 className="font-heading text-sm font-semibold text-dynasty-text">
              {tradeResult.status === 'accepted' ? 'Trade Accepted' :
               tradeResult.status === 'counter' ? 'Counter-Offer' : 'Trade Rejected'}
            </h3>
          </div>
          <p className="mt-1 font-heading text-sm text-dynasty-muted">{tradeResult.message}</p>

          {tradeResult.status === 'counter' && tradeResult.counterOffer && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="flex items-center gap-1 rounded-md bg-accent-success px-3 py-1.5 font-heading text-xs font-semibold text-white hover:bg-accent-success/80">
                <Check className="h-3.5 w-3.5" /> Accept Counter
              </button>
              <button className="flex items-center gap-1 rounded-md border border-dynasty-border px-3 py-1.5 font-heading text-xs text-dynasty-muted hover:text-dynasty-text">
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
