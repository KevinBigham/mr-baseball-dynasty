import { useState, useEffect } from 'react';
import { getEngine } from '../../engine/engineClient';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import type { DeadlineDeal } from '../../engine/trade/tradeDeadline';
import type { TradeRecord } from '../../engine/trade/tradeEngine';

function OvrBadge({ ovr }: { ovr: number }) {
  const color = ovr >= 75 ? 'text-green-400' : ovr >= 60 ? 'text-orange-400' : ovr >= 45 ? 'text-gray-400' : 'text-red-400';
  return <span className={`tabular-nums font-bold ${color}`}>{ovr}</span>;
}

function DealCard({ deal, onClickPlayer }: { deal: DeadlineDeal; onClickPlayer: (id: number) => void }) {
  return (
    <div className="bloomberg-border">
      <div className="bloomberg-header text-xs">{deal.headline}</div>
      <div className="grid grid-cols-2 gap-0 divide-x divide-gray-800">
        {/* Buyer gets */}
        <div className="p-2">
          <div className="text-green-500 text-[10px] font-bold mb-1">
            {deal.buyerTeamName} ACQUIRE
          </div>
          {deal.playersTobuyer.map(p => (
            <div key={p.playerId}
              className="flex items-center gap-2 py-0.5 text-xs cursor-pointer hover:bg-gray-800/50"
              onClick={() => onClickPlayer(p.playerId)}>
              <span className="text-orange-300 font-bold">{p.name}</span>
              <span className="text-gray-600">{p.position}</span>
              <OvrBadge ovr={p.overall} />
            </div>
          ))}
        </div>
        {/* Seller gets */}
        <div className="p-2">
          <div className="text-blue-500 text-[10px] font-bold mb-1">
            {deal.sellerTeamName} ACQUIRE
          </div>
          {deal.playersToSeller.map(p => (
            <div key={p.playerId}
              className="flex items-center gap-2 py-0.5 text-xs cursor-pointer hover:bg-gray-800/50"
              onClick={() => onClickPlayer(p.playerId)}>
              <span className="text-orange-300 font-bold">{p.name}</span>
              <span className="text-gray-600">{p.position}</span>
              <OvrBadge ovr={p.overall} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TradeDeadlineRecap() {
  const { gameStarted } = useGameStore();
  const { setActiveTab, setSelectedPlayer } = useUIStore();
  const [deadlineDeals, setDeadlineDeals] = useState<DeadlineDeal[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameStarted) return;
    setLoading(true);
    Promise.all([
      getEngine().getDeadlineDeals(),
      getEngine().getTradeHistory(),
    ]).then(([dd, th]) => {
      setDeadlineDeals(dd);
      setTradeHistory(th);
    }).finally(() => setLoading(false));
  }, [gameStarted]);

  const goToPlayer = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;
  if (loading) return <div className="p-4 text-orange-400 text-xs animate-pulse">Loading trade data...</div>;

  const userTrades = tradeHistory;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TRADE CENTER</span>
        <span className="text-gray-500 text-xs">
          {deadlineDeals.length} deadline deals / {userTrades.length} user trades
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">DEADLINE DEALS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{deadlineDeals.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">YOUR TRADES</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{userTrades.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL PLAYERS MOVED</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">
            {deadlineDeals.reduce((s, d) => s + d.playersTobuyer.length + d.playersToSeller.length, 0) +
             userTrades.reduce((s, t) => s + t.team1Players.length + t.team2Players.length, 0)}
          </div>
        </div>
      </div>

      {/* Deadline Deals */}
      {deadlineDeals.length > 0 && (
        <div>
          <div className="text-orange-400 text-xs font-bold mb-2 tracking-wider">TRADE DEADLINE DEALS</div>
          <div className="grid grid-cols-2 gap-3">
            {deadlineDeals.map((deal, i) => (
              <DealCard key={i} deal={deal} onClickPlayer={goToPlayer} />
            ))}
          </div>
        </div>
      )}

      {/* User Trade History */}
      {userTrades.length > 0 && (
        <div className="bloomberg-border">
          <div className="bloomberg-header">YOUR TRADE HISTORY</div>
          <div className="max-h-[24rem] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="text-gray-600 text-xs border-b border-gray-800 sticky top-0 bg-gray-950">
                  <th className="px-2 py-1">SEASON</th>
                  <th className="px-2 py-1 text-left">YOU SENT</th>
                  <th className="px-2 py-1 text-left">YOU RECEIVED</th>
                </tr>
              </thead>
              <tbody>
                {userTrades.map((t, i) => (
                  <tr key={i} className="text-xs hover:bg-gray-800/50">
                    <td className="px-2 py-1 tabular-nums text-gray-500 text-center">{t.season}</td>
                    <td className="px-2 py-1 text-red-400">{t.team1PlayerNames.join(', ')}</td>
                    <td className="px-2 py-1 text-green-400">{t.team2PlayerNames.join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deadlineDeals.length === 0 && userTrades.length === 0 && (
        <div className="text-gray-600 text-xs text-center py-8">
          No trades have occurred yet. Simulate some games to see deadline deals.
        </div>
      )}
    </div>
  );
}
