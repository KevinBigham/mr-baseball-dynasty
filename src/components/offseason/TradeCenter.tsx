import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import { useUIStore } from '../../store/uiStore';
import type { TradeProposal, TradePlayerInfo } from '../../engine/trading';
import { formatSalary } from '../../utils/format';
import ConfirmModal from '../layout/ConfirmModal';

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

  // Format stat line
  const statLine = player.isPitcher
    ? [
        player.stats.era != null ? `${player.stats.era.toFixed(2)} ERA` : null,
        player.stats.k9 != null ? `${player.stats.k9.toFixed(1)} K/9` : null,
      ].filter(Boolean).join(' · ')
    : [
        player.stats.avg != null ? `.${(player.stats.avg * 1000).toFixed(0).padStart(3, '0')}` : null,
        player.stats.hr != null ? `${player.stats.hr} HR` : null,
        player.stats.ops != null ? `${player.stats.ops.toFixed(3)} OPS` : null,
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
      setNeeds(result.needs);
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      setStrengths(result.strengths);
    })();
  }, [teamId]);

  if (teamId === 0 || (needs.length === 0 && strengths.length === 0)) return null;

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

  // Load user's players
  useEffect(() => {
    (async () => {
      const engine = getEngine();
      const players = await engine.getTeamPlayers(userTeamId);
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      setMyPlayers(players);
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
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      setTheirPlayers(players);
    })();
  }, [targetTeamId]);

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
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        setMyPlayers(mine);
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        setTheirPlayers(theirs);
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
          <div className="text-red-500 text-xs font-bold tracking-widest mb-2">
            YOU SEND ({selectedMine.size}/3) — TV: {myValue}
          </div>
          <div className="max-h-[250px] overflow-y-auto space-y-0.5">
            {myPlayers.map(p => (
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
          <div className="text-green-500 text-xs font-bold tracking-widest mb-2">
            YOU RECEIVE ({selectedTheirs.size}/3) — TV: {theirValue}
          </div>
          <div className="max-h-[250px] overflow-y-auto space-y-0.5">
            {targetTeamId === 0 ? (
              <div className="text-gray-500 text-xs py-4 text-center">Select a team to see their players</div>
            ) : theirPlayers.length === 0 ? (
              <div className="text-gray-500 text-xs py-4 text-center">Loading...</div>
            ) : theirPlayers.map(p => (
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

  useEffect(() => {
    (async () => {
      const engine = getEngine();
      const players = await engine.getTeamPlayers(userTeamId);
      // @ts-expect-error Sprint 04 stub — contract alignment pending
      setRoster(players);
    })();
  }, [userTeamId]);

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
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {roster.map(p => (
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
  const { season } = useGameStore();
  const { addTradeRecord } = useLeagueStore();
  const [activeTab, setActiveTab] = useState<TradeTab>('offers');
  const [offers, setOffers] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Array<{ teamId: number; name: string; abbreviation: string }>>([]);
  const [pendingAccept, setPendingAccept] = useState<TradeProposal | null>(null);
  const [refreshesLeft, setRefreshesLeft] = useState(3);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const engine = getEngine();
      const [tradeOffers, standings] = await Promise.all([
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        engine.getTradeOffers(),
        engine.getStandings(),
      ]);
      setOffers(tradeOffers);
      setTeams(
        // @ts-expect-error Sprint 04 stub — contract alignment pending
        (standings.standings ?? []).map(s => ({
          teamId: s.teamId,
          name: s.name,
          abbreviation: s.abbreviation,
        }))
      );
      setLoading(false);
    })();
  }, []);

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
