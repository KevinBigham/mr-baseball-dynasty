import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  RUMOR_TYPE_DISPLAY,
  PHASE_DISPLAY,
  generateDemoRumors,
  generateDemoDeadlineStatus,
  getCredibilityLabel,
  type TradeRumor,
  type RumorType,
} from '../../engine/trade/tradeRumors';

function RumorCard({ rumor }: { rumor: TradeRumor }) {
  const typeInfo = RUMOR_TYPE_DISPLAY[rumor.type];
  const credInfo = getCredibilityLabel(rumor.credibility);

  return (
    <div className={`bloomberg-border ${rumor.hot ? 'border-orange-800/50' : ''} hover:bg-gray-800/20 transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {rumor.hot && <span className="text-orange-400 animate-pulse text-xs font-bold">HOT</span>}
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
              style={{ backgroundColor: typeInfo.color + '22', color: typeInfo.color }}>
              {typeInfo.emoji} {typeInfo.label}
            </span>
          </div>
          <span className="text-gray-600 text-[10px]">{rumor.hoursAgo}h ago</span>
        </div>

        <div className="text-orange-300 font-bold text-sm mb-1">{rumor.headline}</div>

        <div className="flex items-center gap-2 text-[10px] mb-2">
          <span className="text-gray-400">{rumor.playerName}</span>
          <span className="text-gray-700">{rumor.playerPos}</span>
          <span className="text-gray-600">({rumor.currentTeam})</span>
        </div>

        <div className="text-gray-500 text-[10px] mb-2">{rumor.details}</div>

        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-gray-600">Interested:</span>
          {rumor.interestedTeams.map(t => (
            <span key={t} className="px-1 py-0.5 bg-gray-800 text-gray-300 rounded font-bold">{t}</span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2 text-[10px]">
          <span className="text-gray-600">Source: <span className="text-gray-400">{rumor.source}</span></span>
          <span className="font-bold" style={{ color: credInfo.color }}>{credInfo.label} ({rumor.credibility}%)</span>
        </div>
      </div>
    </div>
  );
}

export default function TradeRumorBoard() {
  const { gameStarted } = useGameStore();
  const [rumors] = useState(() => generateDemoRumors());
  const [deadline] = useState(() => generateDemoDeadlineStatus());
  const [filter, setFilter] = useState<'all' | RumorType>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const phaseInfo = PHASE_DISPLAY[deadline.phase];
  const filtered = filter === 'all' ? rumors : rumors.filter(r => r.type === filter);

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>TRADE RUMOR BOARD</span>
        <span className="font-bold text-[10px]" style={{ color: phaseInfo.color }}>
          {phaseInfo.emoji} {phaseInfo.label} — {deadline.hoursUntil}h TO DEADLINE
        </span>
      </div>

      {/* Deadline banner */}
      <div className="bloomberg-border px-4 py-3" style={{ borderColor: phaseInfo.color + '44' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold" style={{ color: phaseInfo.color }}>TRADE DEADLINE COUNTDOWN</div>
            <div className="text-gray-500 text-[10px]">{deadline.daysUntil} days, {deadline.hoursUntil} hours remaining</div>
          </div>
          <div className="flex items-center gap-4 text-center">
            <div>
              <div className="text-orange-400 font-bold text-xl tabular-nums">{deadline.activeRumors}</div>
              <div className="text-gray-600 text-[10px]">ACTIVE</div>
            </div>
            <div>
              <div className="text-green-400 font-bold text-xl tabular-nums">{deadline.dealsCompleted}</div>
              <div className="text-gray-600 text-[10px]">COMPLETED</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-2 py-0.5 text-xs font-bold rounded ${filter === 'all' ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>ALL</button>
        {(['trade_talk', 'bidding_war', 'asking_price', 'deal_close', 'deal_dead', 'surprise_name'] as RumorType[]).map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === t ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{RUMOR_TYPE_DISPLAY[t].emoji} {RUMOR_TYPE_DISPLAY[t].label.toUpperCase()}</button>
        ))}
      </div>

      {/* Rumors */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.sort((a, b) => a.hoursAgo - b.hoursAgo).map(r => (
          <RumorCard key={r.id} rumor={r} />
        ))}
      </div>
    </div>
  );
}
