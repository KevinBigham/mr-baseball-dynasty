import { useState, useEffect, useCallback } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import type { TradeProposal, TradePlayerInfo } from '../../engine/trading';

function formatSalary(s: number): string {
  if (s >= 1_000_000) return `$${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `$${(s / 1000).toFixed(0)}K`;
  return `$${s}`;
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

// ─── Player chip ──────────────────────────────────────────────────────────────

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
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load user's players
  useEffect(() => {
    (async () => {
      const engine = getEngine();
      const players = await engine.getTeamPlayers(userTeamId);
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
      setTheirPlayers(players);
    })();
  }, [targetTeamId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

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

  const handlePropose = useCallback(async () => {
    if (selectedMine.size === 0 || selectedTheirs.size === 0 || targetTeamId === 0) return;
    setLoading(true);
    try {
      const engine = getEngine();
      const result = await engine.proposeTrade(
        targetTeamId,
        [...selectedMine],
        [...selectedTheirs],
      );
      if (result.ok) {
        setToast('Trade accepted!');
        setSelectedMine(new Set());
        setSelectedTheirs(new Set());
        // Refresh player lists
        const [mine, theirs] = await Promise.all([
          engine.getTeamPlayers(userTeamId),
          engine.getTeamPlayers(targetTeamId),
        ]);
        setMyPlayers(mine);
        setTheirPlayers(theirs);
      } else {
        setToast(result.error ?? 'Trade rejected.');
      }
    } catch {
      setToast('Trade failed.');
    } finally {
      setLoading(false);
    }
  }, [selectedMine, selectedTheirs, targetTeamId, userTeamId]);

  const myValue = myPlayers.filter(p => selectedMine.has(p.playerId)).reduce((s, p) => s + p.tradeValue, 0);
  const theirValue = theirPlayers.filter(p => selectedTheirs.has(p.playerId)).reduce((s, p) => s + p.tradeValue, 0);

  const otherTeams = teams.filter(t => t.teamId !== userTeamId);

  return (
    <div className="bloomberg-border bg-gray-900">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 text-xs font-bold tracking-wider uppercase bg-green-900 text-green-300 border border-green-700">
          {toast}
        </div>
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
              <div className="text-gray-600 text-xs py-4 text-center">Select a team to see their players</div>
            ) : theirPlayers.length === 0 ? (
              <div className="text-gray-600 text-xs py-4 text-center">Loading...</div>
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

// ─── Main Trade Center ──────────────────────────────────────────────────────

export default function TradeCenter() {
  const { season } = useGameStore();
  const [offers, setOffers] = useState<TradeProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [teams, setTeams] = useState<Array<{ teamId: number; name: string; abbreviation: string }>>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const engine = getEngine();
      const [tradeOffers, standings] = await Promise.all([
        engine.getTradeOffers(),
        engine.getStandings(),
      ]);
      setOffers(tradeOffers);
      setTeams(
        (standings.standings ?? []).map(s => ({
          teamId: s.teamId,
          name: s.name,
          abbreviation: s.abbreviation,
        }))
      );
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const handleAccept = useCallback(async (offer: TradeProposal) => {
    const engine = getEngine();
    const result = await engine.acceptTradeOffer(
      offer.partnerTeamId,
      offer.requested.map(p => p.playerId),
      offer.offered.map(p => p.playerId),
    );
    if (result.ok) {
      setToast(`Trade completed with ${offer.partnerTeamAbbr}!`);
      setOffers(prev => prev.filter(o => o.tradeId !== offer.tradeId));
    } else {
      setToast(result.error ?? 'Trade failed.');
    }
  }, []);

  const handleDecline = useCallback((tradeId: number) => {
    setOffers(prev => prev.filter(o => o.tradeId !== tradeId));
  }, []);

  if (loading) {
    return <div className="text-orange-400 text-xs animate-pulse p-4">Loading trade center...</div>;
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 text-xs font-bold tracking-wider uppercase bg-green-900 text-green-300 border border-green-700">
          {toast}
        </div>
      )}

      <div className="bloomberg-border bg-gray-900 px-4 py-2">
        <div className="text-orange-500 font-bold text-xs tracking-widest">
          TRADE CENTER — {season - 1} OFFSEASON
        </div>
      </div>

      {/* Incoming Offers */}
      {offers.length > 0 && (
        <div className="space-y-3">
          <div className="text-gray-400 text-xs font-bold tracking-widest">INCOMING TRADE OFFERS</div>
          {offers.map(offer => (
            <TradeOfferCard
              key={offer.tradeId}
              offer={offer}
              onAccept={() => handleAccept(offer)}
              onDecline={() => handleDecline(offer.tradeId)}
            />
          ))}
        </div>
      )}

      {offers.length === 0 && (
        <div className="bloomberg-border bg-gray-900 px-4 py-6 text-center text-gray-500 text-xs">
          No incoming trade offers at this time.
        </div>
      )}

      {/* Propose Trade */}
      <ProposeTrade teams={teams} />
    </div>
  );
}
