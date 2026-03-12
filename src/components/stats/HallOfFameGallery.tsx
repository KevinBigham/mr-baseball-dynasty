import { useEffect, useState } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HallOfFameInductee {
  playerId: number;
  name: string;
  position: string;
  inductionSeason: number;
  retiredSeason: number;
  isPitcher: boolean;
  votePct: number;
  ballotYear: number;
  careerStats: {
    seasons: number;
    g: number;
    pa?: number;
    hr?: number;
    h?: number;
    avg?: number;
    ops?: number;
    rbi?: number;
    w?: number;
    l?: number;
    sv?: number;
    era?: number;
    k?: number;
    outs?: number;
    war?: number;
  };
}

interface HallOfFameCandidate {
  playerId: number;
  name: string;
  position: string;
  retiredSeason: number;
  eligibleSeason: number;
  yearsOnBallot: number;
  isPitcher: boolean;
  hofScore: number;
  careerStats: Record<string, number>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtAvg(v: number | undefined): string {
  if (v == null) return '---';
  return v.toFixed(3);
}

function fmtEra(v: number | undefined): string {
  if (v == null) return '---';
  return v.toFixed(2);
}

function fmtOps(v: number | undefined): string {
  if (v == null) return '---';
  return v.toFixed(3);
}

function fmtPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

function fmtWar(v: number | undefined): string {
  if (v == null) return '---';
  return v.toFixed(1);
}

// ─── Inductee Card ───────────────────────────────────────────────────────────

function InducteeCard({ inductee }: { inductee: HallOfFameInductee }) {
  const isFirstBallot = inductee.ballotYear === 1;
  const s = inductee.careerStats;

  return (
    <div
      className={[
        'bloomberg-border bg-gray-900 relative overflow-hidden',
        isFirstBallot ? 'border-yellow-500' : '',
      ].join(' ')}
    >
      {/* Gold shimmer accent for first-ballot */}
      {isFirstBallot && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-yellow-700 via-yellow-400 to-yellow-700" />
      )}

      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-gray-200 font-bold text-sm truncate">
                {inductee.name}
              </span>
              {isFirstBallot && (
                <span className="shrink-0 text-[10px] font-black tracking-widest bg-yellow-900/40 text-yellow-400 border border-yellow-700 px-1.5 py-0.5">
                  FIRST BALLOT
                </span>
              )}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              {inductee.position} &middot; Inducted Season {inductee.inductionSeason}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className={`text-lg font-black tabular-nums ${
              inductee.votePct >= 95 ? 'text-yellow-400' : 'text-orange-400'
            }`}>
              {fmtPct(inductee.votePct)}
            </div>
            <div className="text-gray-500 text-[10px]">VOTE</div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gray-800 mb-2" />

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
          {inductee.isPitcher ? (
            <>
              <StatCell label="W-L" value={`${s.w ?? 0}-${s.l ?? 0}`} />
              <StatCell label="ERA" value={fmtEra(s.era)} highlight={s.era != null && s.era < 3.50} />
              <StatCell label="K" value={String(s.k ?? 0)} highlight={(s.k ?? 0) >= 2000} />
              {s.sv != null && s.sv > 0 && (
                <StatCell label="SV" value={String(s.sv)} />
              )}
            </>
          ) : (
            <>
              <StatCell label="HR" value={String(s.hr ?? 0)} highlight={(s.hr ?? 0) >= 400} />
              <StatCell label="AVG" value={fmtAvg(s.avg)} highlight={s.avg != null && s.avg >= 0.300} />
              <StatCell label="OPS" value={fmtOps(s.ops)} highlight={s.ops != null && s.ops >= 0.900} />
            </>
          )}
        </div>

        {/* Career footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/60">
          <span className="text-gray-500 text-[10px] tracking-wider">
            {s.seasons} SEASON{s.seasons !== 1 ? 'S' : ''} &middot; {s.g} G
          </span>
          <span className="text-orange-400 text-xs font-bold tabular-nums">
            {fmtWar(s.war)} WAR
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Cell ───────────────────────────────────────────────────────────────

function StatCell({ label, value, highlight }: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-gray-500 text-[10px] tracking-wider">{label}</div>
      <div className={`text-sm font-bold tabular-nums ${
        highlight ? 'text-yellow-400' : 'text-gray-300'
      }`}>
        {value}
      </div>
    </div>
  );
}

// ─── Candidate Row ───────────────────────────────────────────────────────────

function CandidateRow({ candidate }: { candidate: HallOfFameCandidate }) {
  const score = Math.min(candidate.hofScore, 100);
  const barColor = score >= 75 ? '#fbbf24' : score >= 50 ? '#f97316' : '#6b7280';
  const s = candidate.careerStats;

  const statLine = candidate.isPitcher
    ? `${s.w ?? 0}-${s.l ?? 0} · ${(s.era ?? 0).toFixed(2)} ERA · ${s.k ?? 0} K`
    : `${s.hr ?? 0} HR · ${(s.avg ?? 0).toFixed(3)} AVG · ${(s.ops ?? 0).toFixed(3)} OPS`;

  return (
    <div className="flex items-center gap-3 py-2 px-4 border-b border-gray-800/40 hover:bg-gray-800/30 transition-colors">
      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-gray-200 text-xs font-bold truncate">{candidate.name}</span>
          <span className="text-gray-500 text-[10px]">{candidate.position}</span>
        </div>
        <div className="text-gray-500 text-[10px] mt-0.5">{statLine}</div>
      </div>

      {/* Years on ballot */}
      <div className="text-right shrink-0 mr-2">
        <div className="text-gray-500 text-[10px] tracking-wider">BALLOT YR</div>
        <div className="text-gray-300 text-xs font-bold tabular-nums">
          {candidate.yearsOnBallot}/10
        </div>
      </div>

      {/* HOF Score bar */}
      <div className="w-28 shrink-0">
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-gray-500 text-[10px]">HOF SCORE</span>
          <span
            className="text-[10px] font-bold tabular-nums"
            style={{ color: barColor }}
          >
            {score.toFixed(0)}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${score}%`, background: barColor }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HallOfFameGallery() {
  const { gameStarted } = useGameStore();
  const [inductees, setInductees] = useState<HallOfFameInductee[]>([]);
  const [candidates, setCandidates] = useState<HallOfFameCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);

    Promise.all([
      getEngine().getHallOfFame(),
      getEngine().getHOFCandidates(),
    ])
      .then(([hof, cands]) => {
        setInductees(hof as unknown as HallOfFameInductee[]);
        setCandidates(cands as unknown as HallOfFameCandidate[]);
      })
      .finally(() => setLoading(false));
  }, [gameStarted]);

  // Sort inductees: most recent induction first
  const sortedInductees = [...inductees].sort(
    (a, b) => b.inductionSeason - a.inductionSeason,
  );

  // Sort candidates: highest HOF score first
  const sortedCandidates = [...candidates].sort(
    (a, b) => b.hofScore - a.hofScore,
  );

  return (
    <div className="p-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4">HALL OF FAME</div>

      {!gameStarted && (
        <div className="text-gray-500 text-xs">Start a game first.</div>
      )}

      {loading && (
        <div className="text-orange-400 text-xs animate-pulse">Loading...</div>
      )}

      {!loading && gameStarted && inductees.length === 0 && candidates.length === 0 && (
        <div className="bloomberg-border bg-gray-900 px-6 py-12 text-center">
          <div className="text-gray-500 text-sm mb-2">
            No players have been inducted into the Hall of Fame yet.
          </div>
          <div className="text-gray-500 text-xs">
            Play more seasons to see legends emerge.
          </div>
        </div>
      )}

      {/* ── HALL OF FAME GALLERY ────────────────────────────────────────────── */}

      {!loading && sortedInductees.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-yellow-900/40" />
            <span className="text-yellow-400 text-xs font-bold tracking-[0.2em]">
              ENSHRINED LEGENDS
            </span>
            <div className="h-px flex-1 bg-yellow-900/40" />
          </div>

          {/* Summary strip */}
          <div className="flex items-center gap-4 mb-3">
            <div className="bloomberg-border bg-gray-900 px-4 py-2">
              <span className="text-gray-500 text-[10px] tracking-wider">TOTAL INDUCTEES</span>
              <div className="text-yellow-400 text-xl font-black tabular-nums">
                {sortedInductees.length}
              </div>
            </div>
            <div className="bloomberg-border bg-gray-900 px-4 py-2">
              <span className="text-gray-500 text-[10px] tracking-wider">FIRST BALLOT</span>
              <div className="text-orange-400 text-xl font-black tabular-nums">
                {sortedInductees.filter(i => i.ballotYear === 1).length}
              </div>
            </div>
            <div className="bloomberg-border bg-gray-900 px-4 py-2">
              <span className="text-gray-500 text-[10px] tracking-wider">AVG VOTE %</span>
              <div className="text-gray-300 text-xl font-black tabular-nums">
                {sortedInductees.length > 0
                  ? (
                      sortedInductees.reduce((sum, i) => sum + i.votePct, 0) /
                      sortedInductees.length
                    ).toFixed(1)
                  : '---'}
              </div>
            </div>
          </div>

          {/* Inductee card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedInductees.map(inductee => (
              <InducteeCard key={inductee.playerId} inductee={inductee} />
            ))}
          </div>
        </div>
      )}

      {/* ── ON THE BALLOT ───────────────────────────────────────────────────── */}

      {!loading && sortedCandidates.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-gray-800" />
            <span className="text-orange-500 text-xs font-bold tracking-[0.2em]">
              ON THE BALLOT
            </span>
            <div className="h-px flex-1 bg-gray-800" />
          </div>

          <div className="bloomberg-border bg-gray-950 overflow-hidden">
            {/* Table header */}
            <div className="flex items-center gap-3 px-4 py-1.5 border-b border-gray-800 text-gray-500 text-[10px] tracking-wider">
              <span className="flex-1">CANDIDATE</span>
              <span className="w-16 text-right">BALLOT</span>
              <span className="w-28 text-right">HOF SCORE</span>
            </div>

            {/* Candidate rows */}
            {sortedCandidates.map(candidate => (
              <CandidateRow key={candidate.playerId} candidate={candidate} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
