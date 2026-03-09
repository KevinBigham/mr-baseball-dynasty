/**
 * IntlSigningPanel — International Free Agent Signing Period.
 *
 * User scouts and signs 16-17 year old international prospects from a
 * generated class, competing with AI teams for talent.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { formatSalary } from '../../utils/format';
import type { IntlProspect } from '../../engine/internationalSigning';
import type { UserTransaction } from './OffseasonSummary';
import ConfirmModal from '../layout/ConfirmModal';

interface Props {
  onComplete: () => void;
  onTransaction: (tx: UserTransaction) => void;
}

type SortMode = 'pot' | 'ovr' | 'bonus' | 'age';
type PosFilter = 'ALL' | 'IF' | 'OF' | 'P';

const IF_POS = new Set(['C', '1B', '2B', '3B', 'SS', 'DH']);
const OF_POS = new Set(['LF', 'CF', 'RF']);

function potColor(pot: number): string {
  if (pot >= 65) return '#4ade80';
  if (pot >= 55) return '#fbbf24';
  if (pot >= 45) return '#f97316';
  return '#94a3b8';
}

function countryFlag(country: string): string {
  const flags: Record<string, string> = {
    'Dominican Republic': 'DR',
    'Venezuela': 'VZ',
    'Cuba': 'CU',
    'Mexico': 'MX',
    'Colombia': 'CO',
    'Panama': 'PA',
    'Japan': 'JP',
    'South Korea': 'KR',
    'Taiwan': 'TW',
    'Curacao': 'CW',
    'Puerto Rico': 'PR',
    'Nicaragua': 'NI',
    'Brazil': 'BR',
    'Bahamas': 'BS',
  };
  return flags[country] ?? country.slice(0, 2).toUpperCase();
}

function ProspectRow({
  prospect,
  onSign,
  canAfford,
  busy,
}: {
  prospect: IntlProspect;
  onSign: (p: IntlProspect) => void;
  canAfford: boolean;
  busy: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-800/50 transition-colors"
      style={{
        background: prospect.scoutedPotential >= 60
          ? 'rgba(249,115,22,0.04)'
          : 'transparent',
        borderLeft: prospect.scoutedPotential >= 65
          ? '2px solid #f97316'
          : '2px solid transparent',
      }}
    >
      {/* Name + Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm text-gray-200 truncate">{prospect.name}</span>
          <span className="text-gray-500 text-xs font-bold">{prospect.position}</span>
          <span className="text-gray-700 text-[10px] px-1 py-0.5 rounded bg-gray-800/50">
            {countryFlag(prospect.country)}
          </span>
        </div>
        <div className="text-gray-500 text-xs">
          Age {prospect.age} · {prospect.country}
        </div>
      </div>

      {/* Scouting Grades */}
      <div className="text-center w-16">
        <div className="text-gray-500 text-[10px]">OVR</div>
        <div className="font-bold text-sm text-orange-400 tabular-nums">{prospect.scoutedOverall}</div>
      </div>
      <div className="text-center w-16">
        <div className="text-gray-500 text-[10px]">POT</div>
        <div className="font-bold text-sm tabular-nums" style={{ color: potColor(prospect.scoutedPotential) }}>
          {prospect.scoutedPotential}
        </div>
      </div>

      {/* Bonus + Sign button */}
      <div className="text-right w-32 shrink-0">
        <div className="text-gray-400 text-xs font-bold tabular-nums mb-1">
          {formatSalary(prospect.signingBonus)}
        </div>
        <button
          onClick={() => onSign(prospect)}
          disabled={busy || !canAfford}
          className={`text-xs px-3 py-1 rounded transition-colors ${
            canAfford
              ? 'bloomberg-btn'
              : 'text-gray-500 border border-gray-700 cursor-not-allowed'
          }`}
        >
          SIGN
        </button>
      </div>
    </div>
  );
}

export default function IntlSigningPanel({ onComplete, onTransaction }: Props) {
  const { season } = useGameStore();
  const [prospects, setProspects] = useState<IntlProspect[]>([]);
  const [bonusPool, setBonusPool] = useState(0);
  const [bonusUsed, setBonusUsed] = useState(0);
  const [signed, setSigned] = useState<IntlProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('pot');
  const [posFilter, setPosFilter] = useState<PosFilter>('ALL');
  const [confirmProspect, setConfirmProspect] = useState<IntlProspect | null>(null);
  const [aiSigningSummary, setAiSigningSummary] = useState<Array<{
    prospectName: string;
    teamAbbr: string;
    bonus: number;
  }>>([]);
  const [showingSummary, setShowingSummary] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const engine = getEngine();
      const result = await engine.startIntlSigning();
      if (!cancelled) {
        setProspects(result.prospects);
        setBonusPool(result.bonusPool);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSign = useCallback(async (prospect: IntlProspect) => {
    setConfirmProspect(null);
    setBusy(true);
    const engine = getEngine();
    // @ts-expect-error Sprint 04 stub — contract alignment pending
    const result = await engine.signIntlProspect(prospect.playerId, prospect.signingBonus);
    if (result.ok) {
      setSigned(prev => [...prev, prospect]);
      setBonusUsed(prev => prev + prospect.signingBonus);
      setProspects(prev => prev.filter(p => p.playerId !== prospect.playerId));
      onTransaction({
        type: 'signing',
        description: `INTL: ${prospect.name} (${prospect.position}, ${prospect.country}) — ${formatSalary(prospect.signingBonus)}`,
      });
    }
    setBusy(false);
  }, [onTransaction]);

  const handleFinish = useCallback(async () => {
    setBusy(true);
    const engine = getEngine();
    const result = await engine.finishIntlSigning();
    // @ts-expect-error Sprint 04 stub — contract alignment pending
    setAiSigningSummary(result.aiSignings.slice(0, 10));
    setShowingSummary(true);
    setBusy(false);
  }, []);

  const remaining = bonusPool - bonusUsed;

  const filteredProspects = useMemo(() => {
    let list = [...prospects];

    // Position filter
    if (posFilter === 'IF') list = list.filter(p => IF_POS.has(p.position));
    else if (posFilter === 'OF') list = list.filter(p => OF_POS.has(p.position));
    else if (posFilter === 'P') list = list.filter(p => p.isPitcher);

    // Sort
    list.sort((a, b) => {
      switch (sortMode) {
        case 'pot': return b.scoutedPotential - a.scoutedPotential;
        case 'ovr': return b.scoutedOverall - a.scoutedOverall;
        case 'bonus': return a.signingBonus - b.signingBonus;
        case 'age': return a.age - b.age;
        default: return 0;
      }
    });

    return list;
  }, [prospects, sortMode, posFilter]);

  if (loading) {
    return (
      <div className="bloomberg-border bg-gray-900 p-6 text-center">
        <div className="text-gray-500 text-xs animate-pulse">Scouting international prospects...</div>
      </div>
    );
  }

  // Summary screen after AI signings
  if (showingSummary) {
    return (
      <div className="bloomberg-border bg-gray-900">
        <div className="bloomberg-header px-4 text-center">
          INTERNATIONAL SIGNING PERIOD COMPLETE
        </div>
        <div className="p-4 space-y-4">
          {signed.length > 0 && (
            <div>
              <div className="text-orange-500 text-xs font-bold tracking-widest mb-2">YOUR SIGNINGS ({signed.length})</div>
              <div className="space-y-1">
                {signed.map(s => (
                  <div key={s.playerId} className="flex justify-between text-xs">
                    <span className="text-gray-300">{s.name} ({s.position}, {s.country})</span>
                    <span className="text-orange-400 tabular-nums">{formatSalary(s.signingBonus)}</span>
                  </div>
                ))}
              </div>
              <div className="text-gray-500 text-xs mt-1">
                Total spent: {formatSalary(bonusUsed)} / {formatSalary(bonusPool)}
              </div>
            </div>
          )}

          {aiSigningSummary.length > 0 && (
            <div>
              <div className="text-gray-400 text-xs font-bold tracking-widest mb-2">NOTABLE AI SIGNINGS</div>
              <div className="space-y-1">
                {aiSigningSummary.map((s, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-gray-400">{s.prospectName}</span>
                    <span className="text-gray-500">{s.teamAbbr} — {formatSalary(s.bonus)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-2">
            <button onClick={onComplete} className="bloomberg-btn text-xs px-6 py-2">
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="bloomberg-border bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-orange-500 text-xs font-bold tracking-widest">
              INTERNATIONAL SIGNING PERIOD — {season}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              Sign amateur international talent. {prospects.length} prospects available.
            </div>
          </div>
          <button
            onClick={handleFinish}
            disabled={busy}
            className="bloomberg-btn text-xs px-4 py-1.5"
          >
            {signed.length > 0 ? 'FINISH' : 'SKIP'}
          </button>
        </div>
      </div>

      {/* Budget bar */}
      <div className="bloomberg-border bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-gray-500 text-xs">BONUS POOL</span>
          <span className="text-orange-400 text-sm font-bold tabular-nums">
            {formatSalary(remaining)} remaining
          </span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${(1 - bonusUsed / bonusPool) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-gray-500 text-[10px] mt-1">
          <span>{signed.length} signed</span>
          <span>{formatSalary(bonusUsed)} / {formatSalary(bonusPool)}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bloomberg-border bg-gray-900 px-4 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(['ALL', 'IF', 'OF', 'P'] as PosFilter[]).map(g => (
            <button
              key={g}
              onClick={() => setPosFilter(g)}
              className={[
                'text-xs px-2 py-0.5 rounded transition-colors',
                posFilter === g
                  ? 'bg-orange-900/40 text-orange-400'
                  : 'text-gray-500 hover:text-gray-400',
              ].join(' ')}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-gray-500 text-xs">SORT:</span>
          {([
            { key: 'pot', label: 'POT' },
            { key: 'ovr', label: 'OVR' },
            { key: 'bonus', label: 'COST' },
            { key: 'age', label: 'AGE' },
          ] as { key: SortMode; label: string }[]).map(s => (
            <button
              key={s.key}
              onClick={() => setSortMode(s.key)}
              className={[
                'text-xs px-2 py-0.5 rounded transition-colors',
                sortMode === s.key
                  ? 'bg-orange-900/40 text-orange-400 font-bold'
                  : 'text-gray-500 hover:text-gray-400',
              ].join(' ')}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prospect list */}
      <div className="bloomberg-border bg-gray-900">
        <div className="bloomberg-header px-4 flex items-center justify-between">
          <span>AVAILABLE PROSPECTS</span>
          <span className="text-gray-500 font-normal text-xs">{filteredProspects.length} shown</span>
        </div>
        <div className="divide-y divide-gray-800/50">
          {filteredProspects.map(p => (
            <ProspectRow
              key={p.playerId}
              prospect={p}
              onSign={() => setConfirmProspect(p)}
              canAfford={remaining >= p.signingBonus}
              busy={busy}
            />
          ))}
          {filteredProspects.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">
              No prospects match your filters.
            </div>
          )}
        </div>
      </div>

      {/* Confirm modal */}
      {confirmProspect && (
        <ConfirmModal
          title={`Sign ${confirmProspect.name}?`}
          message={`${confirmProspect.position} · Age ${confirmProspect.age} · ${confirmProspect.country}\nScouted: OVR ${confirmProspect.scoutedOverall} / POT ${confirmProspect.scoutedPotential}\nBonus: ${formatSalary(confirmProspect.signingBonus)}`}
          confirmLabel="SIGN"
          onConfirm={() => handleSign(confirmProspect)}
          onCancel={() => setConfirmProspect(null)}
        />
      )}
    </div>
  );
}
