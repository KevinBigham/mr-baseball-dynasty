import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  BALANCE_DISPLAY,
  generateDemoTrade,
  generateDemoAssets,
  analyzeTrade,
  type TradeAsset,
  type TradePackage,
} from '../../engine/trade/tradeCalculator';

function AssetCard({ asset, selected, onToggle }: { asset: TradeAsset; selected: boolean; onToggle: () => void }) {
  const ovrColor = asset.overall >= 80 ? '#22c55e' : asset.overall >= 70 ? '#eab308' : '#94a3b8';

  return (
    <button onClick={onToggle}
      className={`bloomberg-border text-left px-3 py-2 transition-colors w-full ${selected ? 'border-orange-600/50 bg-orange-900/10' : 'hover:bg-gray-800/20'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border"
            style={{ borderColor: ovrColor, color: ovrColor, backgroundColor: ovrColor + '11' }}>
            {asset.overall}
          </div>
          <div>
            <div className="text-orange-300 font-bold text-xs">{asset.name}</div>
            <div className="text-gray-600 text-[9px]">
              {asset.pos} | Age {asset.age} | ${asset.salary}M x {asset.yearsRemaining}yr
              {asset.isProspect && <span className="text-purple-400 ml-1">PROSPECT</span>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold tabular-nums" style={{ color: ovrColor }}>{asset.tradeValue}</div>
          <div className="text-gray-600 text-[9px]">TV</div>
        </div>
      </div>
    </button>
  );
}

export default function TradeCalculatorView() {
  const { gameStarted } = useGameStore();
  const [assets] = useState(() => generateDemoAssets());
  const [selectedSending, setSelectedSending] = useState<number[]>([]);
  const [selectedReceiving, setSelectedReceiving] = useState<number[]>([]);

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const toggleSending = (id: number) => {
    setSelectedSending(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleReceiving = (id: number) => {
    setSelectedReceiving(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const sending = assets.yourPlayers.filter(p => selectedSending.includes(p.id));
  const receiving = assets.theirPlayers.filter(p => selectedReceiving.includes(p.id));
  const tradeResult: TradePackage | null = sending.length > 0 && receiving.length > 0
    ? analyzeTrade(sending, receiving)
    : null;

  const balanceInfo = tradeResult ? BALANCE_DISPLAY[tradeResult.balance] : null;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TRADE VALUE CALCULATOR</span>
        <span className="text-gray-600 text-[10px]">SELECT PLAYERS TO EVALUATE</span>
      </div>

      {/* Trade balance display */}
      {tradeResult && balanceInfo && (
        <div className="bloomberg-border px-4 py-3" style={{ borderColor: balanceInfo.color + '44' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-sm" style={{ color: balanceInfo.color }}>
              {balanceInfo.emoji} {balanceInfo.label}
            </span>
            <span className="text-[10px] tabular-nums">
              <span className="text-red-400">Send {tradeResult.sendingValue}</span>
              <span className="text-gray-600 mx-2">vs</span>
              <span className="text-green-400">Receive {tradeResult.receivingValue}</span>
            </span>
          </div>
          <div className="text-gray-400 text-[10px]">{tradeResult.analysis}</div>

          {/* Balance bar */}
          <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden mt-2 relative">
            <div className="absolute left-1/2 top-0 w-px h-full bg-gray-600" />
            {tradeResult.balanceDiff >= 0 ? (
              <div className="h-full rounded-full absolute bg-green-600"
                style={{ left: '50%', width: `${Math.min(50, Math.abs(tradeResult.balanceDiff))}%` }} />
            ) : (
              <div className="h-full rounded-full absolute bg-red-600"
                style={{ right: '50%', width: `${Math.min(50, Math.abs(tradeResult.balanceDiff))}%` }} />
            )}
          </div>
        </div>
      )}

      {/* Two columns: Your players vs Their players */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-red-400 text-[10px] font-bold mb-2">YOUR PLAYERS (SENDING)</div>
          <div className="space-y-1">
            {assets.yourPlayers.map(p => (
              <AssetCard key={p.id} asset={p} selected={selectedSending.includes(p.id)} onToggle={() => toggleSending(p.id)} />
            ))}
          </div>
        </div>
        <div>
          <div className="text-green-400 text-[10px] font-bold mb-2">THEIR PLAYERS (RECEIVING)</div>
          <div className="space-y-1">
            {assets.theirPlayers.map(p => (
              <AssetCard key={p.id} asset={p} selected={selectedReceiving.includes(p.id)} onToggle={() => toggleReceiving(p.id)} />
            ))}
          </div>
        </div>
      </div>

      {!tradeResult && (
        <div className="text-center text-gray-600 text-xs py-4">
          Select at least one player from each side to evaluate the trade
        </div>
      )}
    </div>
  );
}
