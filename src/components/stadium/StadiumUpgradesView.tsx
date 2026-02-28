import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  CATEGORY_DISPLAY,
  UPGRADES,
  initStadium,
  installUpgrade,
  getStadiumLevel,
  type StadiumState,
  type StadiumUpgrade,
  type UpgradeCategory,
} from '../../engine/stadium/stadiumUpgrades';

function UpgradeCard({ upgrade, installed, onInstall }: { upgrade: StadiumUpgrade; installed: boolean; onInstall: () => void }) {
  const catInfo = CATEGORY_DISPLAY[upgrade.category];
  return (
    <div className={`bloomberg-border ${installed ? 'opacity-50' : 'hover:bg-gray-800/20'} transition-colors`}>
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <span>{upgrade.emoji}</span>
            <span className="text-orange-300 font-bold text-xs">{upgrade.label}</span>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
            style={{ backgroundColor: catInfo.color + '22', color: catInfo.color }}>
            {catInfo.emoji} {catInfo.label}
          </span>
        </div>
        <div className="text-gray-500 text-[10px] mb-2">{upgrade.desc}</div>
        <div className="flex items-center gap-3 text-[10px] mb-2">
          <span className="text-red-400">${upgrade.cost}M</span>
          {upgrade.revenueBoost > 0 && <span className="text-green-400">+${upgrade.revenueBoost}M/yr</span>}
          {upgrade.fanBoost > 0 && <span className="text-blue-400">+{upgrade.fanBoost} FAN</span>}
          <span className="text-gray-600">T{upgrade.tier}</span>
        </div>
        <button onClick={onInstall} disabled={installed}
          className={`w-full text-[10px] font-bold py-1 rounded ${
            installed ? 'bg-gray-800 text-gray-600' : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
          }`}>
          {installed ? 'INSTALLED' : 'INSTALL'}
        </button>
      </div>
    </div>
  );
}

export default function StadiumUpgradesView() {
  const { gameStarted } = useGameStore();
  const [stadium, setStadium] = useState<StadiumState>(() => initStadium());
  const [filter, setFilter] = useState<'all' | UpgradeCategory>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const levelInfo = getStadiumLevel(stadium);
  const filtered = filter === 'all' ? UPGRADES : UPGRADES.filter(u => u.category === filter);

  const handleInstall = (upgrade: StadiumUpgrade) => {
    setStadium(prev => installUpgrade(prev, upgrade));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>STADIUM UPGRADES</span>
        <span className="text-[10px] font-bold" style={{ color: levelInfo.color }}>
          {stadium.name} — LVL {stadium.level} ({levelInfo.label})
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">LEVEL</div>
          <div className="font-bold text-xl" style={{ color: levelInfo.color }}>{stadium.level}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">INSTALLED</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{stadium.installedUpgrades.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">INVESTED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">${stadium.totalInvested}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">REV BOOST</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">+${stadium.totalRevenueBoost}M</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">FAN BOOST</div>
          <div className="text-blue-400 font-bold text-xl tabular-nums">+{stadium.totalFanBoost}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        <button onClick={() => setFilter('all')}
          className={`px-2 py-0.5 text-xs font-bold rounded ${filter === 'all' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>ALL</button>
        {(['seating', 'concessions', 'technology', 'entertainment', 'facilities'] as UpgradeCategory[]).map(c => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === c ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{CATEGORY_DISPLAY[c].label.toUpperCase()}</button>
        ))}
      </div>

      {/* Upgrade cards */}
      <div className="grid grid-cols-3 gap-2">
        {filtered.map(u => (
          <UpgradeCard key={u.id} upgrade={u} installed={stadium.installedUpgrades.includes(u.id)} onInstall={() => handleInstall(u)} />
        ))}
      </div>
    </div>
  );
}
