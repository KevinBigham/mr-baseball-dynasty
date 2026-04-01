import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, Users, Star, ChevronDown, Clock, Check, Zap,
} from 'lucide-react';
import { useWorker } from '@/shared/hooks/useWorker';
import { useGameStore } from '@/shared/hooks/useGameStore';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  grade: number;
  age: number;
  type: 'College' | 'HS';
}

interface DraftPick {
  round: number;
  pick: number;
  teamAbbr: string;
  prospect: Prospect;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function gradeColor(grade: number): string {
  if (grade >= 60) return 'text-accent-success';
  if (grade >= 50) return 'text-accent-info';
  if (grade >= 40) return 'text-accent-warning';
  return 'text-dynasty-muted';
}

function gradeBg(grade: number): string {
  if (grade >= 60) return 'bg-accent-success/20 text-accent-success';
  if (grade >= 50) return 'bg-accent-info/20 text-accent-info';
  if (grade >= 40) return 'bg-accent-warning/20 text-accent-warning';
  return 'bg-dynasty-border text-dynasty-muted';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProspectsTable({
  prospects, selectedId, onSelect,
}: {
  prospects: Prospect[];
  selectedId: string | null;
  onSelect: (p: Prospect) => void;
}) {
  const [sortKey, setSortKey] = useState<'grade' | 'position'>('grade');
  const sorted = [...prospects].sort((a, b) =>
    sortKey === 'grade' ? b.grade - a.grade : a.position.localeCompare(b.position),
  );

  return (
    <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
      <div className="flex items-center justify-between border-b border-dynasty-border px-4 py-3">
        <h2 className="font-heading text-sm font-semibold text-dynasty-text">
          Available Prospects
        </h2>
        <button
          onClick={() => setSortKey(k => (k === 'grade' ? 'position' : 'grade'))}
          className="flex items-center gap-1 font-heading text-xs text-accent-info hover:text-accent-primary"
        >
          Sort: {sortKey === 'grade' ? 'Grade' : 'POS'} <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-dynasty-surface">
            <tr className="border-b border-dynasty-border text-xs text-dynasty-muted">
              <th className="px-3 py-2 text-left font-heading">#</th>
              <th className="px-2 py-2 text-left font-heading">Name</th>
              <th className="px-2 py-2 text-left font-heading">POS</th>
              <th className="px-2 py-2 text-right font-data">Grade</th>
              <th className="px-2 py-2 text-right font-data">Age</th>
              <th className="px-2 py-2 text-left font-heading">Type</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, idx) => (
              <tr
                key={p.id}
                onClick={() => onSelect(p)}
                className={`cursor-pointer border-b border-dynasty-border/50 text-sm hover:bg-dynasty-elevated ${
                  selectedId === p.id ? 'bg-accent-primary/10' : ''
                }`}
              >
                <td className="px-3 py-2 font-data text-dynasty-muted">{idx + 1}</td>
                <td className="px-2 py-2 font-heading font-medium text-dynasty-text">
                  {p.firstName} {p.lastName}
                </td>
                <td className="px-2 py-2 font-data text-dynasty-muted">{p.position}</td>
                <td className={`px-2 py-2 text-right font-data font-bold ${gradeColor(p.grade)}`}>
                  {p.grade}
                </td>
                <td className="px-2 py-2 text-right font-data text-dynasty-muted">{p.age}</td>
                <td className="px-2 py-2 font-data text-dynasty-muted">{p.type}</td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-heading text-sm text-dynasty-muted">
                  No prospects available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SelectedCard({
  prospect, userOnClock, isDrafting, onDraft,
}: {
  prospect: Prospect | null;
  userOnClock: boolean;
  isDrafting: boolean;
  onDraft: () => void;
}) {
  if (!prospect) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dynasty-border bg-dynasty-surface p-6 text-center">
        <Users className="mb-3 h-10 w-10 text-dynasty-muted" />
        <p className="font-heading text-sm text-dynasty-muted">
          Select a prospect from the board
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-heading text-lg font-semibold text-dynasty-textBright">
            {prospect.firstName} {prospect.lastName}
          </p>
          <p className="font-data text-sm text-dynasty-muted">
            {prospect.position} | {prospect.type} | Age {prospect.age}
          </p>
        </div>
        <div className={`rounded px-3 py-1 text-center ${gradeBg(prospect.grade)}`}>
          <span className="font-data text-2xl font-bold">{prospect.grade}</span>
        </div>
      </div>
      <button
        onClick={onDraft}
        disabled={!userOnClock || isDrafting}
        className={`w-full rounded-md px-4 py-2 font-heading text-sm font-semibold transition-colors ${
          userOnClock && !isDrafting
            ? 'bg-accent-primary text-white hover:bg-accent-primary/80'
            : 'cursor-not-allowed bg-dynasty-border text-dynasty-muted'
        }`}
      >
        {isDrafting ? (
          <span className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 animate-spin" /> Drafting...
          </span>
        ) : userOnClock ? (
          `Draft ${prospect.lastName}`
        ) : (
          'Waiting for your pick'
        )}
      </button>
    </div>
  );
}

function DraftLog({ picks, userTeamId }: { picks: DraftPick[]; userTeamId: string }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [picks.length]);

  return (
    <div className="rounded-lg border border-dynasty-border bg-dynasty-surface">
      <div className="flex items-center gap-2 border-b border-dynasty-border px-4 py-3">
        <FileText className="h-4 w-4 text-dynasty-muted" />
        <h2 className="font-heading text-sm font-semibold text-dynasty-text">Draft Log</h2>
      </div>
      <div className="max-h-[60vh] overflow-y-auto px-2 py-2">
        {picks.length === 0 && (
          <p className="px-2 py-6 text-center font-heading text-sm text-dynasty-muted">
            No picks yet
          </p>
        )}
        {picks.map((pk, idx) => {
          const isUser = pk.teamAbbr.toLowerCase() === userTeamId.toLowerCase();
          return (
            <div
              key={idx}
              className={`mb-1 rounded px-3 py-2 font-data text-xs ${
                isUser
                  ? 'border-l-2 border-accent-primary bg-accent-primary/10 text-dynasty-textBright'
                  : 'text-dynasty-text hover:bg-dynasty-elevated'
              }`}
            >
              <span className="text-dynasty-muted">
                R{pk.round} P{pk.pick}
              </span>
              {' -- '}
              <span className="font-semibold">{pk.teamAbbr}</span>:{' '}
              {pk.prospect.firstName} {pk.prospect.lastName}{' '}
              <span className="text-dynasty-muted">
                ({pk.prospect.position}, {pk.prospect.grade})
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function DraftPage() {
  const worker = useWorker();
  const api = worker as any; // Temporary until worker API is extended
  const { phase, season, isInitialized, userTeamId } = useGameStore();

  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [draftLog, setDraftLog] = useState<DraftPick[]>([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [userOnClock, setUserOnClock] = useState(false);
  const [draftStarted, setDraftStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Attempt to load draft class
  const loadDraftClass = useCallback(async () => {
    if (!isInitialized || !worker.isReady) return;
    try {
      const data = await api.getDraftClass();
      if (Array.isArray(data) && data.length > 0) {
        setProspects(data);
      }
    } catch {
      // Worker method not available yet — that's OK
    }
  }, [isInitialized, worker.isReady, api]);

  useEffect(() => {
    loadDraftClass();
  }, [loadDraftClass, phase, season]);

  const handleStartDraft = async () => {
    try {
      setError(null);
      await api.startDraft();
      setDraftStarted(true);
      setUserOnClock(true);
      await loadDraftClass();
    } catch {
      setError('Draft system not available yet. Check back during the offseason phase.');
    }
  };

  const handleDraftPick = async () => {
    if (!selectedProspect || isDrafting) return;
    setIsDrafting(true);
    try {
      const result = await api.makeDraftPick(selectedProspect.id);
      if (result) {
        setDraftLog(prev => [...prev, result as DraftPick]);
        setProspects(prev => prev.filter(p => p.id !== selectedProspect.id));
        setSelectedProspect(null);
      }
    } catch {
      setError('Failed to make pick. Draft system may not be ready.');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSimRemaining = async () => {
    try {
      setError(null);
      setUserOnClock(false);
      const results = await api.simulateRemainingDraft();
      if (Array.isArray(results)) {
        setDraftLog(prev => [...prev, ...results]);
        setProspects([]);
      }
    } catch {
      setError('Auto-draft not available yet.');
    }
  };

  // -----------------------------------------------------------------------
  // Pre-Draft state
  // -----------------------------------------------------------------------
  const showPreDraft = phase !== 'offseason' || (prospects.length === 0 && !draftStarted);

  if (showPreDraft && !draftStarted) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
            Draft Room
          </h1>
          <p className="mt-1 font-heading text-sm text-dynasty-muted">
            Season {season} Amateur Draft
          </p>
        </div>

        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-8">
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
            <FileText className="h-12 w-12 text-dynasty-muted" />
            <h2 className="font-heading text-lg font-semibold text-dynasty-text">
              {phase === 'offseason'
                ? 'Draft Class Loading...'
                : 'Draft Available During Offseason'}
            </h2>
            <p className="max-w-md font-heading text-sm text-dynasty-muted">
              {phase === 'offseason'
                ? 'The amateur draft class is being scouted. Start the draft when you are ready.'
                : `The current phase is ${phase.toUpperCase()}. Advance through the season to reach the offseason, where the amateur draft takes place.`}
            </p>
            {phase === 'offseason' && (
              <button
                onClick={handleStartDraft}
                className="mt-4 rounded-md bg-accent-primary px-6 py-2 font-heading text-sm font-semibold text-white transition-colors hover:bg-accent-primary/80"
              >
                Start Draft
              </button>
            )}
            {error && (
              <p className="mt-2 font-data text-xs text-accent-danger">{error}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Draft Board
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
            Draft Room
          </h1>
          <p className="mt-1 font-heading text-sm text-dynasty-muted">
            Season {season} Amateur Draft
            {userOnClock && (
              <span className="ml-3 inline-flex items-center gap-1 rounded bg-accent-primary/20 px-2 py-0.5 font-data text-xs text-accent-primary">
                <Star className="h-3 w-3" /> You are on the clock
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSimRemaining}
            className="flex items-center gap-1 rounded-md border border-dynasty-border bg-dynasty-elevated px-3 py-1.5 font-heading text-xs text-dynasty-text transition-colors hover:border-accent-info hover:text-accent-info"
          >
            <Zap className="h-3 w-3" /> Auto-Draft Remaining
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded border border-accent-danger/30 bg-accent-danger/10 px-4 py-2 font-data text-xs text-accent-danger">
          {error}
        </div>
      )}

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left — Prospects */}
        <div className="lg:col-span-5">
          <ProspectsTable
            prospects={prospects}
            selectedId={selectedProspect?.id ?? null}
            onSelect={setSelectedProspect}
          />
        </div>

        {/* Center — Your Pick */}
        <div className="lg:col-span-3">
          <SelectedCard
            prospect={selectedProspect}
            userOnClock={userOnClock}
            isDrafting={isDrafting}
            onDraft={handleDraftPick}
          />
          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-dynasty-border bg-dynasty-surface px-3 py-2 text-center">
              <div className="font-data text-xl font-bold text-dynasty-textBright">
                {prospects.length}
              </div>
              <div className="font-heading text-[10px] uppercase text-dynasty-muted">Available</div>
            </div>
            <div className="rounded-lg border border-dynasty-border bg-dynasty-surface px-3 py-2 text-center">
              <div className="font-data text-xl font-bold text-accent-primary">
                {draftLog.filter(p => p.teamAbbr.toLowerCase() === userTeamId.toLowerCase()).length}
              </div>
              <div className="font-heading text-[10px] uppercase text-dynasty-muted">Your Picks</div>
            </div>
          </div>
        </div>

        {/* Right — Draft Log */}
        <div className="lg:col-span-4">
          <DraftLog picks={draftLog} userTeamId={userTeamId} />
        </div>
      </div>

      {/* Completed banner */}
      {draftStarted && prospects.length === 0 && draftLog.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-accent-success/30 bg-accent-success/10 px-4 py-3">
          <Check className="h-5 w-5 text-accent-success" />
          <p className="font-heading text-sm text-accent-success">
            Draft complete. {draftLog.length} total selections made.
          </p>
        </div>
      )}
    </div>
  );
}
