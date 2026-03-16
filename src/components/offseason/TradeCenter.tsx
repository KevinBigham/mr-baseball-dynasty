import { useState, useEffect, useCallback, useMemo } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import type { TradeProposal, TradePlayerInfo } from '../../engine/trading';
import { formatSalary } from '../../utils/format';
import ConfirmModal from '../layout/ConfirmModal';
import { useSort, compareSortValues } from '../../hooks/useSort';
import { SortPills } from '../shared/SortHeader';
import CoachTip from '../shared/CoachTip';

// ─── Client-side trade value estimator (mirrors engine evaluatePlayer) ───────
// Used because getTeamPlayers() returns raw Player objects without tradeValue.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawPlayerToTradeInfo(p: any): TradePlayerInfo {
  const rd = p.rosterData ?? {};
  const overall: number = p.overall ?? 0;
  const potential: number = p.potential ?? 0;
  const age: number = p.age ?? 25;
  const salary: number = rd.salary ?? p.salary ?? 0;
  const contractYearsRemaining: number = rd.contractYearsRemaining ?? p.contractYearsRemaining ?? 1;

  // Estimate trade value (same formula as engine/trading.ts evaluatePlayer)
  let value = (overall / 550) * 60;
  const potentialGap = potential - overall;
  if (potentialGap > 0) value += (potentialGap / 550) * 20;
  if (age <= 26) value *= 1.1;
  else if (age <= 29) value *= 1.0;
  else if (age <= 32) value *= 0.85;
  else if (age <= 35) value *= 0.65;
  else value *= 0.4;
  if (salary < 1_000_000 && contractYearsRemaining >= 3) value *= 1.2;
  else if (salary > 25_000_000) value *= 0.7;
  else if (salary > 15_000_000) value *= 0.85;
  if ((rd.rosterStatus ?? '') === 'MLB_ACTIVE') value *= 1.05;
  const tradeValue = Math.round(Math.max(0, Math.min(100, value)));

  const isPitcher = p.isPitcher ?? ['SP', 'RP', 'CL'].includes(p.position);
  return {
    playerId: p.playerId,
    name: p.name,
    position: p.position,
    age,
    overall,
    potential,
    salary,
    contractYearsRemaining,
    tradeValue,
    isPitcher,
    stats: p.stats ?? {},
  };
}

// ─── Sort keys for trade player lists ────────────────────────────────────────
type TradeSortKey = 'overall' | 'position' | 'age' | 'salary' | 'tradeValue';

const TRADE_SORT_PILLS: { key: TradeSortKey; label: string }[] = [
  { key: 'overall', label: 'OVR' },
  { key: 'position', label: 'POS' },
  { key: 'age', label: 'AGE' },
  { key: 'salary', label: 'SAL' },
  { key: 'tradeValue', label: 'TV' },
];

function getTradeSortValue(p: TradePlayerInfo, key: TradeSortKey): string | number {
  switch (key) {
    case 'overall': return p.overall;
    case 'position': return p.position;
    case 'age': return p.age;
    case 'salary': return p.salary;
    case 'tradeValue': return p.tradeValue;
    default: return 0;
  }
}

// ─── Trade Offer Card ─────────────────────────────────────────────────────────

function TradeOfferCard({
  offer,
  onAccept,
  onDecline,
}: {
  offer: TradeProposal;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>{offer.partnerTeamAbbr} — TRADE OFFER</span>
        <span className={`font-normal text-xs ${
          offer.fairness >= 0 ? 'text-green-400' : 'text-red-400'
        }`}>
          {offer.fairness >= 10 ? 'GREAT DEAL' : offer.fairness >= 0 ? 'FAIR' : 'OVERPAY'}
        </span>
      </div>

      <div className="p-4 grid grid-cols-2 gap-4">
        {/* They offer */}
        <div>
          <div className="text-green-500 text-xs font-bold tracking-widest mb-2">YOU RECEIVE</div>
          {offer.offered.map(p => (
            <PlayerChip key={p.playerId} player={p} color="green" />
          ))}
        </div>

        {/* They want */}
        <div>
          <div className="text-red-500 text-xs font-bold tracking-widest mb-2">YOU SEND</div>
          {offer.requested.map(p => (
            <PlayerChip key={p.playerId} player={p} color="red" />
          ))}
        </div>
      </div>

      <div className="px-4 pb-4 flex gap-3">
        <button
          onClick={onAccept}
          className="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold text-xs py-2 uppercase tracking-widest"
        >
          ACCEPT
        </button>
        <button
          onClick={onDecline}
          className="flex-1 border border-gray-600 hover:border-gray-400 text-gray-400 font-bold text-xs py-2 uppercase tracking-widest"
        >
          DECLINE
        </button>
      </div>
    </div>
  );
}

// ─── Enhanced Player chip ────────────────────────────────────────────────────

function PlayerChip({ player, color, selected, onClick }: {
  player: TradePlayerInfo;
  color: 'green' | 'red' | 'orange';
  selected?: boolean;
  onClick?: () => void;
}) {
  const colorMap = {
    green: 'border-green-800 bg-green-950/30',
    red: 'border-red-800 bg-red-950/30',
    orange: selected ? 'border-orange-500 bg-orange-900/30' : 'border-gray-700 bg-gray-800/30 hover:border-orange-600',
  };

  // Format stat line (stats may be pre-formatted strings from getPlayerStatLine)
  const fmtN = (v: unknown, d: number) => typeof v === 'number' ? v.toFixed(d) : String(v ?? '');
  const statLine = player.isPitcher
    ? [
        player.stats.era != null ? `${fmtN(player.stats.era, 2)} ERA` : null,
        player.stats.k9 != null ? `${fmtN(player.stats.k9, 1)} K/9` : null,
      ].filter(Boolean).join(' · ')
    : [
        player.stats.avg != null ? (typeof player.stats.avg === 'number' ? `.${(player.stats.avg * 1000).toFixed(0).padStart(3, '0')}` : player.stats.avg) : null,
        player.stats.hr != null ? `${player.stats.hr} HR` : null,
        player.stats.ops != null ? `${fmtN(player.stats.ops, 3)} OPS` : null,
      ].filter(Boolean).join(' · ');

  return (
    <div
      className={`border ${colorMap[color]} p-2 mb-1.5 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-200 text-xs font-bold">{player.name}</span>
        <span className="text-orange-400 text-xs font-bold tabular-nums">{player.overall} OVR</span>
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-gray-500 text-xs">{player.position} · Age {player.age}</span>
        <span className="text-gray-500 text-xs">{formatSalary(player.salary)} · TV: {player.tradeValue}</span>
      </div>
      {/* Contract + stats row */}
      <div className="flex items-center justify-between mt-0.5">
        <span className={`text-xs ${player.contractYearsRemaining <= 1 ? 'text-red-400' : 'text-gray-500'}`}>
          {player.contractYearsRemaining}yr left
        </span>
        {statLine && (
          <span className="text-gray-500 text-[10px] tabular-nums">{statLine}</span>
        )}
      </div>
    </div>
  );
}

// ─── Team Needs Display ──────────────────────────────────────────────────────

function TeamNeedsBar({ teamId }: { teamId: number }) {
  const [needs, setNeeds] = useState<Array<{ position: string; severity: string }>>([]);
  const [strengths, setStrengths] = useState<string[]>([]);

  useEffect(() => {
    if (teamId === 0) return;
    (async () => {
      const engine = getEngine();
      const result = await engine.getTeamNeeds(teamId);
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      setNeeds(result?.needs ?? []);
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      setStrengths(result?.strengths ?? []);
    })();
  }, [teamId]);

  if (teamId === 0 || (!needs?.length && !strengths?.length)) return null;

  const severityColor: Record<string, string> = {
    critical: 'text-red-400 border-red-800 bg-red-950/30',
    moderate: 'text-yellow-400 border-yellow-800 bg-yellow-950/30',
    mild: 'text-blue-400 border-blue-800 bg-blue-950/30',
  };

  return (
    <div className="px-4 py-2 border-b border-gray-800">
      <div className="flex items-center gap-3 flex-wrap">
        {needs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[10px] uppercase">Needs:</span>
            {needs.map(n => (
              <span key={n.position} className={`text-[10px] font-bold px-1.5 py-0.5 border ${severityColor[n.severity]}`}>
                {n.position}
              </span>
            ))}
          </div>
        )}
        {strengths.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500 text-[10px] uppercase">Strengths:</span>
            {strengths.map(s => (
              <span key={s} className="text-[10px] font-bold px-1.5 py-0.5 border border-green-800 bg-green-950/30 text-green-400">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Propose Trade Panel ────────────────────────────────────────────────────

function ProposeTrade({ teams }: { teams: Array<{ teamId: number; name: string; abbreviation: string }> }) {
  const { userTeamId } = useGameStore();
  const [targetTeamId, setTargetTeamId] = useState<number>(0);
  const [myPlayers, setMyPlayers] = useState<TradePlayerInfo[]>([]);
  const [theirPlayers, setTheirPlayers] = useState<TradePlayerInfo[]>([]);
  const [selectedMine, setSelectedMine] = useState<Set<number>>(new Set());
  const [selectedTheirs, setSelectedTheirs] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [pendingPropose, setPendingPropose] = useState(false);
  const { sort: mySendSort, toggle: toggleMySendSort } = useSort<TradeSortKey>('overall');
  const { sort: theirSort, toggle: toggleTheirSort } = useSort<TradeSortKey>('overall');

  // Load user's players
  useEffect(() => {
    (async () => {
      const engine = getEngine();
      const players = await engine.getTeamPlayers(userTeamId);
      setMyPlayers((players as unknown[]).map(rawPlayerToTradeInfo));
    })();
  }, [userTeamId]);

  // Load target team's players
  useEffect(() => {
    if (targetTeamId === 0) {
      setTheirPlayers([]);
      return;
    }
    (async () => {
      const engine = getEngine();
      const players = await engine.getTeamPlayers(targetTeamId);
      setTheirPlayers((players as unknown[]).map(rawPlayerToTradeInfo));
    })();
  }, [targetTeamId]);

  const sortedMyPlayers = useMemo(() => {
    return [...myPlayers].sort((a, b) =>
      compareSortValues(getTradeSortValue(a, mySendSort.key), getTradeSortValue(b, mySendSort.key), mySendSort.dir)
    );
  }, [myPlayers, mySendSort]);

  const sortedTheirPlayers = useMemo(() => {
    return [...theirPlayers].sort((a, b) =>
      compareSortValues(getTradeSortValue(a, theirSort.key), getTradeSortValue(b, theirSort.key), theirSort.dir)
    );
  }, [theirPlayers, theirSort]);

  const toggleMine = (id: number) => {
    setSelectedMine(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const toggleTheirs = (id: number) => {
    setSelectedTheirs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      return next;
    });
  };

  const executePropose = useCallback(async () => {
    if (selectedMine.size === 0 || selectedTheirs.size === 0 || targetTeamId === 0) return;
    setPendingPropose(false);
    setLoading(true);
    try {
      const engine = getEngine();
      const result = await engine.proposeTrade(
        targetTeamId,
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        [...selectedMine],
        [...selectedTheirs],
      );
      if (result.ok) {
        useUIStore.getState().addToast('Trade accepted!', 'success');
        setSelectedMine(new Set());
        setSelectedTheirs(new Set());
        // Refresh player lists
        const [mine, theirs] = await Promise.all([
          engine.getTeamPlayers(userTeamId),
          engine.getTeamPlayers(targetTeamId),
        ]);
        setMyPlayers((mine as unknown[]).map(rawPlayerToTradeInfo));
        setTheirPlayers((theirs as unknown[]).map(rawPlayerToTradeInfo));
      } else {
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        useUIStore.getState().addToast(result.error ?? 'Trade rejected.', 'error');
      }
    } catch {
      useUIStore.getState().addToast('Trade failed.', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMine, selectedTheirs, targetTeamId, userTeamId]);

  const handlePropose = useCallback(() => {
    if (selectedMine.size === 0 || selectedTheirs.size === 0 || targetTeamId === 0) return;
    setPendingPropose(true);
  }, [selectedMine, selectedTheirs, targetTeamId]);

  const myValue = myPlayers.filter(p => selectedMine.has(p.playerId)).reduce((s, p) => s + p.tradeValue, 0);
  const theirValue = theirPlayers.filter(p => selectedTheirs.has(p.playerId)).reduce((s, p) => s + p.tradeValue, 0);

  const otherTeams = teams.filter(t => t.teamId !== userTeamId);

  return (
    <div className="bloomberg-border bg-gray-900">
      {pendingPropose && (
        <ConfirmModal
          title="CONFIRM TRADE"
          message={`Send ${selectedMine.size} player${selectedMine.size > 1 ? 's' : ''} to receive ${selectedTheirs.size} player${selectedTheirs.size > 1 ? 's' : ''}?`}
          onConfirm={executePropose}
          onCancel={() => setPendingPropose(false)}
        />
      )}

      <div className="bloomberg-header px-4">PROPOSE TRADE</div>

      {/* Target team selector */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">TRADE WITH:</span>
          <select
            value={targetTeamId}
            onChange={e => {
              setTargetTeamId(Number(e.target.value));
              setSelectedTheirs(new Set());
            }}
            className="bg-gray-800 text-gray-300 text-xs border border-gray-700 px-2 py-1 flex-1"
          >
            <option value={0}>Select a team...</option>
            {otherTeams.map(t => (
              <option key={t.teamId} value={t.teamId}>{t.abbreviation} — {t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Team needs analysis */}
      <TeamNeedsBar teamId={targetTeamId} />

      {/* Trade builder */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {/* Your players */}
        <div>
          <div className="text-red-500 text-xs font-bold tracking-widest mb-1">
            YOU SEND ({selectedMine.size}/3) — TV: {myValue}
          </div>
          <div className="mb-1.5">
            <SortPills keys={TRADE_SORT_PILLS} currentSort={mySendSort} onSort={toggleMySendSort} compact />
          </div>
          <div className="max-h-[250px] overflow-y-auto space-y-0.5">
            {sortedMyPlayers.map(p => (
              <PlayerChip
                key={p.playerId}
                player={p}
                color="orange"
                selected={selectedMine.has(p.playerId)}
                onClick={() => toggleMine(p.playerId)}
              />
            ))}
          </div>
        </div>

        {/* Their players */}
        <div>
          <div className="text-green-500 text-xs font-bold tracking-widest mb-1">
            YOU RECEIVE ({selectedTheirs.size}/3) — TV: {theirValue}
          </div>
          <div className="mb-1.5">
            <SortPills keys={TRADE_SORT_PILLS} currentSort={theirSort} onSort={toggleTheirSort} compact />
          </div>
          <div className="max-h-[250px] overflow-y-auto space-y-0.5">
            {targetTeamId === 0 ? (
              <div className="text-gray-500 text-xs py-4 text-center">Select a team to see their players</div>
            ) : theirPlayers.length === 0 ? (
              <div className="text-gray-500 text-xs py-4 text-center">Loading...</div>
            ) : sortedTheirPlayers.map(p => (
              <PlayerChip
                key={p.playerId}
                player={p}
                color="orange"
                selected={selectedTheirs.has(p.playerId)}
                onClick={() => toggleTheirs(p.playerId)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trade value meter */}
      {(selectedMine.size > 0 || selectedTheirs.size > 0) && (
        <div className="px-4 pb-2">
          <div className="bloomberg-border bg-gray-950 p-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-red-400">Sending: {myValue} TV</span>
              <span className="text-green-400">Receiving: {theirValue} TV</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded overflow-hidden">
              <div
                className={`h-full transition-all ${theirValue >= myValue * 0.85 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, (myValue + theirValue) > 0 ? (theirValue / (myValue + theirValue)) * 100 : 50)}%` }}
              />
            </div>
            <div className="text-center text-xs mt-1">
              {theirValue >= myValue * 0.85 ? (
                <span className="text-green-400">Likely accepted</span>
              ) : (
                <span className="text-red-400">Likely rejected — add more value</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="px-4 pb-4">
        <button
          onClick={handlePropose}
          disabled={selectedMine.size === 0 || selectedTheirs.size === 0 || targetTeamId === 0 || loading}
          className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-xs py-3 uppercase tracking-widest transition-colors"
        >
          {loading ? 'PROCESSING...' : 'PROPOSE TRADE'}
        </button>
      </div>
    </div>
  );
}

// ─── Trade History Panel ────────────────────────────────────────────────────

function TradeHistoryPanel() {
  const { tradeHistory } = useLeagueStore();

  if (tradeHistory.length === 0) return null;

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4">TRADE HISTORY</div>
      <div className="p-4 space-y-2">
        {tradeHistory.map((t, i) => (
          <div key={i} className="border border-gray-800 bg-gray-950/50 p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-orange-400 text-xs font-bold">{t.partnerTeamAbbr}</span>
              <span className="text-gray-500 text-[10px]">
                Season {t.season} · {t.type === 'incoming' ? 'ACCEPTED' : 'PROPOSED'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-red-500 text-[10px] font-bold">SENT: </span>
                <span className="text-gray-400">{t.sent.join(', ')}</span>
              </div>
              <div>
                <span className="text-green-500 text-[10px] font-bold">RECEIVED: </span>
                <span className="text-gray-400">{t.received.join(', ')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shop Player Tab ────────────────────────────────────────────────────────

function ShopPlayerTab({ onAcceptTrade }: {
  onAcceptTrade: (offer: TradeProposal) => Promise<void>;
}) {
  const { userTeamId } = useGameStore();
  const [roster, setRoster] = useState<TradePlayerInfo[]>([]);
  const [shopResults, setShopResults] = useState<TradeProposal[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<TradePlayerInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const { sort: shopSort, toggle: toggleShopSort } = useSort<TradeSortKey>('overall');

  useEffect(() => {
    (async () => {
      const engine = getEngine();
      const players = await engine.getTeamPlayers(userTeamId);
      setRoster((players as unknown[]).map(rawPlayerToTradeInfo));
    })();
  }, [userTeamId]);

  const sortedRoster = useMemo(() => {
    return [...roster].sort((a, b) =>
      compareSortValues(getTradeSortValue(a, shopSort.key), getTradeSortValue(b, shopSort.key), shopSort.dir)
    );
  }, [roster, shopSort]);

  const handleShop = useCallback(async (player: TradePlayerInfo) => {
    setSelectedPlayer(player);
    setLoading(true);
    const engine = getEngine();
    const results = await engine.shopPlayer(player.playerId);
    setShopResults(results);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-3">
      <div className="bloomberg-border bg-gray-900 p-4">
        <div className="text-gray-400 text-xs font-bold tracking-widest mb-2">
          SELECT A PLAYER TO SHOP
        </div>
        <div className="mb-2">
          <SortPills keys={TRADE_SORT_PILLS} currentSort={shopSort} onSort={toggleShopSort} />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {sortedRoster.map(p => (
            <div
              key={p.playerId}
              onClick={() => handleShop(p)}
              className={`cursor-pointer px-2 py-1.5 flex items-center justify-between hover:bg-gray-800 transition-colors ${
                selectedPlayer?.playerId === p.playerId ? 'bg-orange-900/20 border-l-2 border-orange-500' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-orange-400 text-xs font-bold tabular-nums w-6">{p.overall}</span>
                <span className="text-gray-200 text-xs font-bold">{p.name}</span>
                <span className="text-gray-500 text-xs">{p.position}</span>
              </div>
              <span className="text-gray-500 text-xs">{formatSalary(p.salary)} · TV: {p.tradeValue}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-orange-400 text-xs animate-pulse p-4 text-center">
          Shopping {selectedPlayer?.name}...
        </div>
      )}

      {!loading && selectedPlayer && shopResults.length === 0 && (
        <div className="bloomberg-border bg-gray-900 p-4 text-center text-gray-500 text-xs">
          No teams interested in {selectedPlayer.name} right now.
        </div>
      )}

      {!loading && shopResults.length > 0 && (
        <div className="space-y-3">
          <div className="text-gray-400 text-xs font-bold tracking-widest">
            {shopResults.length} TEAM{shopResults.length !== 1 ? 'S' : ''} INTERESTED IN {selectedPlayer?.name.toUpperCase()}
          </div>
          {shopResults.map(offer => (
            <div key={offer.tradeId} className="bloomberg-border bg-gray-900">
              <div className="bloomberg-header px-4 flex items-center justify-between">
                <span>{offer.partnerTeamAbbr} — OFFER</span>
                <div className="flex items-center gap-2">
                  {offer.aiAccepts && (
                    <span className="text-green-400 text-[10px] font-bold px-1.5 py-0.5 bg-green-900/30 border border-green-800">
                      EXECUTABLE
                    </span>
                  )}
                  {offer.reason && (
                    <span className="text-gray-500 text-[10px] font-normal">{offer.reason}</span>
                  )}
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-green-500 text-xs font-bold tracking-widest mb-2">YOU RECEIVE</div>
                  {offer.offered.map(p => (
                    <PlayerChip key={p.playerId} player={p} color="green" />
                  ))}
                </div>
                <div>
                  <div className="text-red-500 text-xs font-bold tracking-widest mb-2">YOU SEND</div>
                  {offer.requested.map(p => (
                    <PlayerChip key={p.playerId} player={p} color="red" />
                  ))}
                </div>
              </div>
              {offer.aiAccepts && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => onAcceptTrade(offer)}
                    className="w-full bg-green-700 hover:bg-green-600 text-white font-bold text-xs py-2 uppercase tracking-widest"
                  >
                    ACCEPT TRADE
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Find Trade Tab ─────────────────────────────────────────────────────────

const POSITIONS = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'SP', 'RP', 'CL'];

function FindTradeTab({ onAcceptTrade }: {
  onAcceptTrade: (offer: TradeProposal) => Promise<void>;
}) {
  const [position, setPosition] = useState<string>('');
  const [results, setResults] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (pos: string) => {
    setPosition(pos);
    setLoading(true);
    const engine = getEngine();
    // @ts-expect-error Sprint 04 stub — contract alignment pending
    const trades = await engine.findTradesForNeed(pos);
    setResults(trades);
    setLoading(false);
  }, []);

  return (
    <div className="space-y-3">
      <div className="bloomberg-border bg-gray-900 p-4">
        <div className="text-gray-400 text-xs font-bold tracking-widest mb-3">
          SELECT A POSITION NEED
        </div>
        <div className="flex flex-wrap gap-1.5">
          {POSITIONS.map(pos => (
            <button
              key={pos}
              onClick={() => handleSearch(pos)}
              className={`px-3 py-1.5 text-xs font-bold tracking-widest border transition-colors ${
                position === pos
                  ? 'border-orange-500 bg-orange-900/30 text-orange-400'
                  : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-orange-600'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-orange-400 text-xs animate-pulse p-4 text-center">
          Searching for {position} trades...
        </div>
      )}

      {!loading && position && results.length === 0 && (
        <div className="bloomberg-border bg-gray-900 p-4 text-center text-gray-500 text-xs">
          No trade partners available for {position} right now.
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <div className="text-gray-400 text-xs font-bold tracking-widest">
            {results.length} TRADE{results.length !== 1 ? 'S' : ''} AVAILABLE FOR {position}
          </div>
          {results.map(offer => (
            <div key={offer.tradeId} className="bloomberg-border bg-gray-900">
              <div className="bloomberg-header px-4 flex items-center justify-between">
                <span>{offer.partnerTeamAbbr}</span>
                <div className="flex items-center gap-2">
                  {offer.aiAccepts && (
                    <span className="text-green-400 text-[10px] font-bold px-1.5 py-0.5 bg-green-900/30 border border-green-800">
                      EXECUTABLE
                    </span>
                  )}
                  <span className={`text-xs font-normal ${offer.fairness >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {offer.fairness >= 10 ? 'GREAT DEAL' : offer.fairness >= 0 ? 'FAIR' : 'OVERPAY'}
                  </span>
                </div>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-green-500 text-xs font-bold tracking-widest mb-2">YOU RECEIVE</div>
                  {offer.offered.map(p => (
                    <PlayerChip key={p.playerId} player={p} color="green" />
                  ))}
                </div>
                <div>
                  <div className="text-red-500 text-xs font-bold tracking-widest mb-2">YOU SEND</div>
                  {offer.requested.map(p => (
                    <PlayerChip key={p.playerId} player={p} color="red" />
                  ))}
                </div>
              </div>
              {offer.aiAccepts && (
                <div className="px-4 pb-4">
                  <button
                    onClick={() => onAcceptTrade(offer)}
                    className="w-full bg-green-700 hover:bg-green-600 text-white font-bold text-xs py-2 uppercase tracking-widest"
                  >
                    ACCEPT TRADE
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Trade Center ──────────────────────────────────────────────────────

type TradeTab = 'offers' | 'shop' | 'find' | 'propose';

const TAB_LABELS: Record<TradeTab, string> = {
  offers: 'INCOMING',
  shop: 'SHOP PLAYER',
  find: 'FIND TRADE',
  propose: 'PROPOSE',
};

export default function TradeCenter({ onTransaction, onDone }: {
  onTransaction?: (tx: { type: 'signing' | 'trade'; description: string }) => void;
  onDone?: () => void;
} = {}) {
  const { season, userTeamId } = useGameStore();
  const { addTradeRecord } = useLeagueStore();
  const [activeTab, setActiveTab] = useState<TradeTab>('offers');
  const [offers, setOffers] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Array<{ teamId: number; name: string; abbreviation: string }>>([]);
  const [pendingAccept, setPendingAccept] = useState<TradeProposal | null>(null);
  const [refreshesLeft, setRefreshesLeft] = useState(3);

  // Load team list for team selector — uses getTeams() which always has data (unlike getStandings which is empty in preseason)
  useEffect(() => {
    (async () => {
      const engine = getEngine() as { getTeams?: () => Promise<unknown[]> };
      if (typeof engine.getTeams !== 'function') return;

      try {
        const allTeams = await engine.getTeams();
        setTeams(
          (allTeams as any[]).map((t) => ({
            teamId: t.teamId,
            name: t.name,
            abbreviation: t.abbreviation ?? t.name?.slice(0, 3).toUpperCase() ?? '',
          }))
        );
      } catch {
        useUIStore.getState().addToast('Could not load league team list', 'error');
      }
    })();
  }, []);

  // Load incoming trade offers — separate so it can't block team loading
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const engine = getEngine();
        const tradeOffers = await engine.getTradeOffers(userTeamId);
        setOffers(tradeOffers);
      } catch {
        // getTradeOffers may not be implemented yet; silently continue
        setOffers([]);
      }
      setLoading(false);
    })();
  }, [userTeamId]);

  const handleRefreshOffers = useCallback(async () => {
    if (refreshesLeft <= 0) return;
    const engine = getEngine();
    // @ts-expect-error Sprint 04 stub — contract alignment pending
    const newOffers = await engine.getTradeOffers();
    setOffers(newOffers);
    setRefreshesLeft(prev => prev - 1);
    useUIStore.getState().addToast(`${newOffers.length} new offer${newOffers.length !== 1 ? 's' : ''} received`, 'info');
  }, [refreshesLeft]);

  const executeAcceptOffer = useCallback(async (offer: TradeProposal) => {
    setPendingAccept(null);
    const engine = getEngine();
    const result = await engine.acceptTradeOffer(
      offer.partnerTeamId,
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      offer.requested.map(p => p.playerId),
      offer.offered.map(p => p.playerId),
    );
    if (result.ok) {
      useUIStore.getState().addToast(`Trade completed with ${offer.partnerTeamAbbr}!`, 'success');
      onTransaction?.({
        type: 'trade',
        description: `Sent ${offer.requested.map(p => p.name).join(', ')} to ${offer.partnerTeamAbbr} for ${offer.offered.map(p => p.name).join(', ')}`,
      });
      addTradeRecord({
        season,
        partnerTeamAbbr: offer.partnerTeamAbbr,
        sent: offer.requested.map(p => p.name),
        received: offer.offered.map(p => p.name),
        type: 'incoming',
      });
      setOffers(prev => prev.filter(o => o.tradeId !== offer.tradeId));
    } else {
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      useUIStore.getState().addToast(result.error ?? 'Trade failed.', 'error');
    }
  }, [onTransaction, addTradeRecord, season]);

  const handleAcceptOffer = useCallback(async (offer: TradeProposal) => {
    setPendingAccept(offer);
  }, []);

  const handleDecline = useCallback((tradeId: number) => {
    setOffers(prev => prev.filter(o => o.tradeId !== tradeId));
  }, []);

  if (loading) {
    return <div className="text-orange-400 text-xs animate-pulse p-4">Loading trade center...</div>;
  }

  return (
    <div className="space-y-4">
      <CoachTip section="trades" />
      {pendingAccept && (
        <ConfirmModal
          title="ACCEPT TRADE"
          message={`Accept trade with ${pendingAccept.partnerTeamAbbr}? You send ${pendingAccept.requested.map(p => p.name).join(', ')} and receive ${pendingAccept.offered.map(p => p.name).join(', ')}.`}
          onConfirm={() => executeAcceptOffer(pendingAccept)}
          onCancel={() => setPendingAccept(null)}
        />
      )}

      {/* Header + Tabs */}
      <div className="bloomberg-border bg-gray-900">
        <div className="px-4 py-2">
          <div className="text-orange-500 font-bold text-xs tracking-widest">
            TRADE CENTER — {season - 1} OFFSEASON
          </div>
        </div>
        <div className="flex border-t border-gray-800">
          {(Object.entries(TAB_LABELS) as [TradeTab, string][]).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-[10px] font-bold tracking-widest transition-colors ${
                activeTab === tab
                  ? 'text-orange-400 border-b-2 border-orange-500 bg-gray-800/50'
                  : 'text-gray-500 hover:text-gray-300 border-b-2 border-transparent'
              }`}
            >
              {label}
              {tab === 'offers' && offers.length > 0 && (
                <span className="ml-1 text-orange-600">({offers.length})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'offers' && (
        <>
          {offers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-gray-400 text-xs font-bold tracking-widest">INCOMING TRADE OFFERS</div>
                <button
                  onClick={handleRefreshOffers}
                  disabled={refreshesLeft <= 0}
                  className="text-orange-600 hover:text-orange-400 disabled:text-gray-500 text-xs font-bold transition-colors"
                >
                  REFRESH ({refreshesLeft})
                </button>
              </div>
              {offers.map(offer => (
                <TradeOfferCard
                  key={offer.tradeId}
                  offer={offer}
                  onAccept={() => handleAcceptOffer(offer)}
                  onDecline={() => handleDecline(offer.tradeId)}
                />
              ))}
            </div>
          )}

          {offers.length === 0 && (
            <div className="bloomberg-border bg-gray-900 px-4 py-6 text-center">
              <div className="text-gray-500 text-xs mb-2">No incoming trade offers at this time.</div>
              {refreshesLeft > 0 && (
                <button
                  onClick={handleRefreshOffers}
                  className="text-orange-600 hover:text-orange-400 text-xs font-bold transition-colors"
                >
                  CHECK FOR NEW OFFERS ({refreshesLeft} left)
                </button>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'shop' && (
        <ShopPlayerTab onAcceptTrade={handleAcceptOffer} />
      )}

      {activeTab === 'find' && (
        <FindTradeTab onAcceptTrade={handleAcceptOffer} />
      )}

      {activeTab === 'propose' && (
        <ProposeTrade teams={teams} />
      )}

      {/* Trade History (always visible) */}
      <TradeHistoryPanel />

      {/* Advance button (when in offseason phase flow) */}
      {onDone && (
        <div className="bloomberg-border bg-gray-900 px-4 py-3 text-center">
          <button
            onClick={onDone}
            className="bg-orange-600 hover:bg-orange-500 text-black font-bold px-6 py-2 text-xs tracking-widest"
          >
            ADVANCE TO OFFSEASON SUMMARY →
          </button>
        </div>
      )}
    </div>
  );
}
