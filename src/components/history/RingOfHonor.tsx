import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { TIER_DISPLAY, type RingOfHonorEntry } from '../../engine/history/ringOfHonor';

function TierBadge({ tier }: { tier: RingOfHonorEntry['tier'] }) {
  const info = TIER_DISPLAY[tier];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '33', color: info.color }}>
      {info.icon} {info.label}
    </span>
  );
}

function HonorCard({ entry }: { entry: RingOfHonorEntry }) {
  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-orange-400 font-bold text-lg tabular-nums border border-gray-700">
              {entry.number}
            </div>
            <div>
              <div className="text-orange-300 font-bold text-sm">{entry.name}</div>
              <div className="text-gray-600 text-xs">{entry.position}</div>
            </div>
          </div>
          <TierBadge tier={entry.tier} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px] mb-2">
          <div>
            <div className="text-gray-600">PEAK OVR</div>
            <div className="text-orange-400 font-bold tabular-nums">{entry.peakOvr}</div>
          </div>
          <div>
            <div className="text-gray-600">INDUCTED</div>
            <div className="text-gray-300 tabular-nums">Season {entry.year}</div>
          </div>
          <div>
            <div className="text-gray-600">SEASONS</div>
            <div className="text-gray-300 tabular-nums">{entry.seasons}</div>
          </div>
        </div>
        <div className="text-gray-400 text-[10px] italic">"{entry.reason}"</div>
      </div>
    </div>
  );
}

// Demo data
const DEMO_RING: RingOfHonorEntry[] = [
  { name: 'Marcus Bell', position: 'SS', number: 2, year: 8, peakOvr: 82, seasons: 10, reason: 'Franchise legend — defined an era', tier: 'legend' },
  { name: 'James O\'Brien', position: 'SP', number: 34, year: 6, peakOvr: 78, seasons: 8, reason: 'Franchise legend — defined an era', tier: 'legend' },
  { name: 'Derek Anderson', position: 'C', number: 12, year: 5, peakOvr: 72, seasons: 7, reason: 'Star performer — fan favorite for years', tier: 'star' },
  { name: 'Tommy Nakamura', position: 'RF', number: 21, year: 4, peakOvr: 68, seasons: 6, reason: 'Beloved veteran — earned the respect of the clubhouse', tier: 'fan_favorite' },
];

export default function RingOfHonor() {
  const { gameStarted } = useGameStore();
  const [entries] = useState<RingOfHonorEntry[]>(DEMO_RING);
  const [filter, setFilter] = useState<'all' | 'legend' | 'star' | 'fan_favorite'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const filtered = filter === 'all' ? entries : entries.filter(e => e.tier === filter);

  const legends = entries.filter(e => e.tier === 'legend').length;
  const stars = entries.filter(e => e.tier === 'star').length;
  const favs = entries.filter(e => e.tier === 'fan_favorite').length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>RING OF HONOR</span>
        <span className="text-gray-600 text-[10px]">{entries.length} HONORED MEMBERS</span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{entries.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LEGENDS</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{legends}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">STARS</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">{stars}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">FAN FAVORITES</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{favs}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'legend', 'star', 'fan_favorite'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f === 'fan_favorite' ? 'FAN FAVORITES' : f.toUpperCase()}</button>
        ))}
      </div>

      {/* Honor cards */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((e, i) => <HonorCard key={i} entry={e} />)}
      </div>

      {/* Criteria */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">INDUCTION CRITERIA</div>
        <div className="p-3 grid grid-cols-3 gap-4 text-[10px] text-gray-500">
          <div>
            <div className="font-bold mb-1" style={{ color: TIER_DISPLAY.legend.color }}>
              {TIER_DISPLAY.legend.icon} FRANCHISE LEGEND
            </div>
            <div>Peak OVR 75+ — Defined an era. Number retired permanently.</div>
          </div>
          <div>
            <div className="font-bold mb-1" style={{ color: TIER_DISPLAY.star.color }}>
              {TIER_DISPLAY.star.icon} STAR
            </div>
            <div>Peak OVR 70-74 — Multi-year impact player. Honored in team history.</div>
          </div>
          <div>
            <div className="font-bold mb-1" style={{ color: TIER_DISPLAY.fan_favorite.color }}>
              {TIER_DISPLAY.fan_favorite.icon} FAN FAVORITE
            </div>
            <div>Peak OVR 65-69 — Beloved veteran. Earned the clubhouse's respect.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
