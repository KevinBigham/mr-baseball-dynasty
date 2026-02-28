import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  PROMOTIONS,
  initFanMetrics,
  applyPromotion,
  getFanSummary,
  type FanMetrics,
  type FanPromotion,
} from '../../engine/team/fanEngagement';

function MetricCard({ label, value, unit, color }: { label: string; value: number | string; unit?: string; color: string }) {
  return (
    <div className="bloomberg-border px-3 py-2 text-center">
      <div className="text-gray-500 text-[10px]">{label}</div>
      <div className="font-bold text-xl tabular-nums" style={{ color }}>
        {value}{unit && <span className="text-xs text-gray-600">{unit}</span>}
      </div>
    </div>
  );
}

function PromoCard({ promo, onRun, ran }: { promo: FanPromotion; onRun: () => void; ran: boolean }) {
  return (
    <div className={`bloomberg-border ${ran ? 'opacity-50' : 'hover:bg-gray-800/20'} transition-colors`}>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span>{promo.icon}</span>
            <span className="text-orange-300 font-bold text-xs">{promo.label}</span>
          </div>
          <span className="text-gray-600 text-[10px]">${promo.cost}M</span>
        </div>
        <div className="text-gray-500 text-[10px] mb-2">{promo.desc}</div>
        <div className="flex items-center gap-2 text-[10px] mb-2">
          {promo.attendanceBoost > 0 && <span className="text-green-400">+{promo.attendanceBoost}% ATT</span>}
          {promo.merchBoost > 0 && <span className="text-yellow-400">+{promo.merchBoost} MERCH</span>}
          {promo.socialBoost > 0 && <span className="text-blue-400">+{promo.socialBoost} SOCIAL</span>}
        </div>
        <button onClick={onRun} disabled={ran}
          className={`w-full text-[10px] font-bold py-1 rounded ${ran ? 'bg-gray-800 text-gray-600' : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'}`}>
          {ran ? 'COMPLETED' : 'RUN PROMOTION'}
        </button>
      </div>
    </div>
  );
}

export default function FanEngagementView() {
  const { gameStarted } = useGameStore();
  const [metrics, setMetrics] = useState<FanMetrics>(() => initFanMetrics());
  const [ranPromos, setRanPromos] = useState<Set<string>>(new Set());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const { tier, tierColor } = getFanSummary(metrics);

  const handlePromo = (promo: FanPromotion) => {
    setMetrics(prev => applyPromotion(prev, promo));
    setRanPromos(prev => new Set([...prev, promo.id]));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>FAN ENGAGEMENT</span>
        <span className="text-[10px] font-bold" style={{ color: tierColor }}>{tier.toUpperCase()}</span>
      </div>

      {/* Big satisfaction */}
      <div className="bloomberg-border px-6 py-4 text-center">
        <div className="text-gray-500 text-[10px] mb-1">FAN SATISFACTION</div>
        <div className="text-5xl font-bold tabular-nums mb-1" style={{ color: tierColor }}>{metrics.satisfaction}</div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden max-w-xs mx-auto">
          <div className="h-full rounded-full transition-all" style={{ width: `${metrics.satisfaction}%`, backgroundColor: tierColor }} />
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="AVG ATTENDANCE" value={metrics.attendance.toLocaleString()} color="#f97316" />
        <MetricCard label="CAPACITY" value={`${metrics.attendancePct}%`} color={metrics.attendancePct >= 80 ? '#22c55e' : '#eab308'} />
        <MetricCard label="MERCH SALES" value={`$${metrics.merchSales}M`} color="#a855f7" />
        <MetricCard label="SOCIAL" value={`${metrics.socialFollowers}K`} color="#3b82f6" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        <MetricCard label="SEASON TICKETS" value={`${metrics.seasonTickets}K`} color="#22c55e" />
        <MetricCard label="TV RATINGS" value={metrics.tvRatings.toFixed(1)} color="#eab308" />
        <MetricCard label="MARKET RANK" value={`#${metrics.marketRank}`} color="#94a3b8" />
        <MetricCard label="REVENUE" value={`$${Math.round(metrics.attendance * 81 * 45 / 1e6)}M`} unit="/yr" color="#22c55e" />
      </div>

      {/* Promotions */}
      <div>
        <div className="text-gray-500 text-[10px] font-bold mb-2 px-1">PROMOTIONS ({ranPromos.size}/{PROMOTIONS.length} USED)</div>
        <div className="grid grid-cols-4 gap-2">
          {PROMOTIONS.map(p => (
            <PromoCard key={p.id} promo={p} onRun={() => handlePromo(p)} ran={ranPromos.has(p.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
