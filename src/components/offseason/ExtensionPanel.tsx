/**
 * ExtensionPanel — Offer contract extensions to players before they hit free agency.
 *
 * Shows eligible players (on user's team with 1-2 contract years left),
 * lets user offer extensions, handles acceptance/rejection/counter-offers.
 */

import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { formatSalary, formatOVR } from '../../utils/format';
import type { UserTransaction } from './OffseasonSummary';
import type { RosterPlayer } from '../../types/league';

interface Props {
  onComplete: () => void;
  onTransaction: (tx: UserTransaction) => void;
}

interface ExtensionCandidate {
  playerId: number;
  name: string;
  position: string;
  age: number;
  overall: number;
  potential: number;
  isPitcher: boolean;
  salary: number;
  contractYearsRemaining: number;
  serviceTimeDays: number;
  stats: RosterPlayer['stats'];
}

type NegotiationStatus = 'idle' | 'offered' | 'accepted' | 'rejected' | 'counter';

interface NegotiationState {
  status: NegotiationStatus;
  offerYears: number;
  offerSalary: number;  // annual in dollars
  counterYears?: number;
  counterSalary?: number;
}

function ovrColor(ovr: number): string {
  const g = formatOVR(ovr);
  if (g >= 70) return 'text-green-400';
  if (g >= 55) return 'text-yellow-400';
  if (g >= 40) return 'text-orange-400';
  return 'text-red-400';
}

function serviceYears(days: number): number {
  return Math.floor(days / 172);
}

function suggestedSalary(ovr: number, age: number, currentSalary: number): number {
  // Market rate based on OVR
  let base: number;
  if (ovr >= 450) base = 30_000_000;
  else if (ovr >= 400) base = 18_000_000;
  else if (ovr >= 350) base = 10_000_000;
  else if (ovr >= 300) base = 5_000_000;
  else base = 2_000_000;

  // Age discount
  if (age >= 33) base = Math.round(base * 0.75);
  if (age >= 35) base = Math.round(base * 0.55);

  // Never suggest less than current salary
  return Math.max(currentSalary, Math.round(base / 100_000) * 100_000);
}

function suggestedYears(ovr: number, age: number): number {
  if (age >= 35) return 1;
  if (age >= 33) return 2;
  if (ovr >= 450) return 5;
  if (ovr >= 400) return 4;
  if (ovr >= 350) return 3;
  return 2;
}

// ─── Extension Card ──────────────────────────────────────────────────────────

function ExtensionCard({
  candidate,
  onOffer,
  negotiation,
  onAcceptCounter,
  busy,
}: {
  candidate: ExtensionCandidate;
  onOffer: (playerId: number, years: number, salary: number) => void;
  negotiation: NegotiationState;
  onAcceptCounter: (playerId: number) => void;
  busy: boolean;
}) {
  const c = candidate;
  const defaultYears = suggestedYears(c.overall, c.age);
  const defaultSalary = suggestedSalary(c.overall, c.age, c.salary);

  const [years, setYears] = useState(defaultYears);
  const [salaryM, setSalaryM] = useState(defaultSalary / 1_000_000);
  const svcYears = serviceYears(c.serviceTimeDays);

  const statusLabel = c.contractYearsRemaining === 1 ? 'FINAL YEAR' : `${c.contractYearsRemaining} YR LEFT`;
  const statusColor = c.contractYearsRemaining === 1 ? '#ef4444' : '#f97316';

  const statLine = c.isPitcher
    ? `${c.stats.w ?? 0}-${c.stats.l ?? 0}, ${c.stats.era?.toFixed(2) ?? '—'} ERA`
    : `.${((c.stats.avg ?? 0) * 1000).toFixed(0).padStart(3, '0')} / ${c.stats.hr ?? 0} HR / ${c.stats.rbi ?? 0} RBI`;

  return (
    <div className="bloomberg-border bg-gray-900 p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-sm text-gray-200">{c.name}</span>
            <span className={`text-xs font-bold ${ovrColor(c.overall)}`}>
              {formatOVR(c.overall)}
            </span>
            <span className="text-gray-500 text-xs">{c.position}</span>
          </div>
          <div className="text-gray-500 text-xs">
            Age {c.age} · {svcYears} yr service · {formatSalary(c.salary)}/yr
          </div>
          <div className="text-gray-400 text-xs mt-0.5">{statLine}</div>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded"
          style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}
        >
          {statusLabel}
        </span>
      </div>

      {negotiation.status === 'accepted' && (
        <div className="bg-green-950 border border-green-800 rounded p-3 text-center">
          <div className="text-green-400 text-sm font-bold">EXTENSION AGREED</div>
          <div className="text-green-500 text-xs mt-1">
            {negotiation.offerYears} yr / {formatSalary(negotiation.offerSalary)}/yr
          </div>
        </div>
      )}

      {negotiation.status === 'counter' && (
        <div className="bg-yellow-950 border border-yellow-800 rounded p-3">
          <div className="text-yellow-400 text-xs font-bold mb-1">COUNTER-OFFER</div>
          <div className="text-yellow-500 text-xs mb-2">
            Player wants {negotiation.counterYears} yr / {formatSalary(negotiation.counterSalary ?? 0)}/yr
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onAcceptCounter(c.playerId)}
              disabled={busy}
              className="bloomberg-btn text-xs px-3 py-1 flex-1"
            >
              ACCEPT COUNTER
            </button>
            <button
              disabled
              className="text-xs px-3 py-1 text-gray-500 border border-gray-700 rounded flex-1"
            >
              DECLINED
            </button>
          </div>
        </div>
      )}

      {negotiation.status === 'rejected' && !negotiation.counterYears && (
        <div className="bg-red-950 border border-red-800 rounded p-3 text-center">
          <div className="text-red-400 text-xs font-bold">EXTENSION DECLINED</div>
          <div className="text-red-500 text-xs mt-1">Player wants to test free agency.</div>
        </div>
      )}

      {(negotiation.status === 'idle') && (
        <div className="border border-gray-800 rounded p-3 space-y-3">
          <div className="flex items-center gap-4">
            <label className="text-gray-500 text-xs w-16">YEARS</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6].map(y => (
                <button
                  key={y}
                  onClick={() => setYears(y)}
                  className={`text-xs px-2.5 py-1 rounded transition-colors ${
                    years === y
                      ? 'bg-orange-900/40 text-orange-400 font-bold'
                      : 'text-gray-500 hover:text-gray-400 border border-gray-700'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-gray-500 text-xs w-16">$/YR</label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min={0.5}
                max={50}
                step={0.5}
                value={salaryM}
                onChange={e => setSalaryM(Number(e.target.value))}
                className="flex-1 accent-orange-500"
              />
              <span className="text-orange-400 text-sm font-bold tabular-nums w-16 text-right">
                ${salaryM.toFixed(1)}M
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs">
              Total: {formatSalary(years * salaryM * 1_000_000)}
            </span>
            <button
              onClick={() => onOffer(c.playerId, years, salaryM * 1_000_000)}
              disabled={busy}
              className="bloomberg-btn text-xs px-4 py-1.5"
            >
              OFFER EXTENSION
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ExtensionPanel({ onComplete, onTransaction }: Props) {
  const { userTeamId } = useGameStore();
  const [candidates, setCandidates] = useState<ExtensionCandidate[]>([]);
  const [negotiations, setNegotiations] = useState<Map<number, NegotiationState>>(new Map());
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load extension-eligible players
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const engine = getEngine();
      const roster = await engine.getFullRoster(userTeamId);
      const allPlayers = [
        ...roster.active,
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        ...roster.aaa,
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        ...roster.aa,
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        ...roster.aPlus,
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        ...roster.aMinus,
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        ...roster.rookie,
      ];

      // Eligible: players with 1-2 contract years left and < 6 yr service (not yet FA eligible)
      const eligible = allPlayers
        .filter(p =>
          p.contractYearsRemaining >= 1 &&
          p.contractYearsRemaining <= 2 &&
          Math.floor(p.serviceTimeDays / 172) < 6
        )
        .sort((a, b) => b.overall - a.overall)
        .slice(0, 15);

      if (!cancelled) {
        setCandidates(eligible.map(p => ({
          playerId: p.playerId,
          name: p.name,
          position: p.position,
          age: p.age,
          overall: p.overall,
          potential: p.potential,
          isPitcher: p.isPitcher,
          salary: p.salary,
          contractYearsRemaining: p.contractYearsRemaining,
          serviceTimeDays: p.serviceTimeDays,
          stats: p.stats,
        })));
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userTeamId]);

  const handleOffer = useCallback(async (playerId: number, years: number, salary: number) => {
    setBusy(true);
    const engine = getEngine();
    const result = await engine.offerExtension(playerId, years, salary);

    const neg: NegotiationState = {
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      status: result.accepted ? 'accepted' : result.counterYears ? 'counter' : 'rejected',
      offerYears: years,
      offerSalary: salary,
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      counterYears: result.counterYears,
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      counterSalary: result.counterSalary,
    };

    setNegotiations(prev => new Map(prev).set(playerId, neg));

    // @ts-expect-error Sprint 04 stub — contract alignment pending
    if (result.accepted) {
      const c = candidates.find(c => c.playerId === playerId);
      if (c) {
        onTransaction({
          type: 'signing',
          description: `Extension: ${c.name} (${c.position}) — ${years} yr / ${formatSalary(salary)}/yr`,
        });
      }
    }

    setBusy(false);
  }, [candidates, onTransaction]);

  const handleAcceptCounter = useCallback(async (playerId: number) => {
    const neg = negotiations.get(playerId);
    if (!neg || !neg.counterYears || !neg.counterSalary) return;

    setBusy(true);
    const engine = getEngine();
    // @ts-expect-error Sprint 04 stub — contract alignment pending
    const result = await engine.acceptCounterOffer(playerId, neg.counterYears, neg.counterSalary);

    if (result.ok) {
      setNegotiations(prev => {
        const next = new Map(prev);
        next.set(playerId, {
          ...neg,
          status: 'accepted',
          offerYears: neg.counterYears!,
          offerSalary: neg.counterSalary!,
        });
        return next;
      });

      const c = candidates.find(c => c.playerId === playerId);
      if (c) {
        onTransaction({
          type: 'signing',
          description: `Extension (counter): ${c.name} (${c.position}) — ${neg.counterYears} yr / ${formatSalary(neg.counterSalary)}/yr`,
        });
      }
    }
    setBusy(false);
  }, [negotiations, candidates, onTransaction]);

  if (loading) {
    return (
      <div className="bloomberg-border bg-gray-900 p-6 text-center">
        <div className="text-gray-500 text-xs animate-pulse">Loading extension candidates...</div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div className="bloomberg-border bg-gray-900 p-6 text-center">
        <div className="text-gray-400 text-sm mb-4">
          No extension-eligible players on your roster.
        </div>
        <div className="text-gray-500 text-xs mb-4">
          Players with 1-2 contract years remaining and under 6 years of service time can be extended.
        </div>
        <button onClick={onComplete} className="bloomberg-btn text-xs px-6 py-2">
          CONTINUE
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="bloomberg-border bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-orange-500 text-xs font-bold tracking-widest">CONTRACT EXTENSIONS</div>
            <div className="text-gray-500 text-xs mt-0.5">
              Lock up key players before they reach free agency. {candidates.length} eligible.
            </div>
          </div>
          <button
            onClick={onComplete}
            className="bloomberg-btn text-xs px-4 py-1.5"
          >
            {negotiations.size > 0 ? 'DONE' : 'SKIP'}
          </button>
        </div>
      </div>

      {candidates.map(c => (
        <ExtensionCard
          key={c.playerId}
          candidate={c}
          onOffer={handleOffer}
          negotiation={negotiations.get(c.playerId) ?? { status: 'idle', offerYears: 0, offerSalary: 0 }}
          onAcceptCounter={handleAcceptCounter}
          busy={busy}
        />
      ))}
    </div>
  );
}
