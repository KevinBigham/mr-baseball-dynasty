import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  ARCHETYPE_DISPLAY,
  generateDemoOwner,
  generateDemoEventHistory,
  getOwnerEvents,
  applyOwnerEvent,
  getMoodLabel,
  getFiringRisk,
  type OwnerProfile,
  type OwnerEvent,
  type OwnerEventResult,
} from '../../engine/management/ownerPersonality';

function MoodMeter({ mood }: { mood: number }) {
  const { label, color } = getMoodLabel(mood);
  return (
    <div className="bloomberg-border px-6 py-4 text-center">
      <div className="text-gray-500 text-[10px] mb-1">OWNER MOOD</div>
      <div className="text-5xl font-bold tabular-nums mb-1" style={{ color }}>{mood}</div>
      <div className="text-xs font-bold mb-2" style={{ color }}>{label.toUpperCase()}</div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden max-w-xs mx-auto">
        <div className="h-full rounded-full transition-all" style={{ width: `${mood}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function TagBadge({ tag }: { tag: OwnerEvent['tag'] }) {
  const cfg = {
    PRESSURE: { color: '#f97316' },
    PRAISE:   { color: '#22c55e' },
    WARNING:  { color: '#ef4444' },
    DEMAND:   { color: '#dc2626' },
  }[tag];

  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: cfg.color + '22', color: cfg.color }}>
      {tag}
    </span>
  );
}

function EventCard({ event, onTrigger, triggered }: { event: OwnerEvent; onTrigger: () => void; triggered: boolean }) {
  return (
    <div className={`bloomberg-border ${triggered ? 'opacity-50' : 'hover:bg-gray-800/20'} transition-colors`}>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{event.emoji}</span>
            <TagBadge tag={event.tag} />
          </div>
          <span className={`text-sm font-bold tabular-nums ${event.mood >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {event.mood > 0 ? '+' : ''}{event.mood} MOOD
          </span>
        </div>
        <div className="text-gray-300 text-xs mb-3">{event.msg}</div>
        <button onClick={onTrigger} disabled={triggered}
          className={`w-full text-[10px] font-bold py-1.5 rounded ${
            triggered ? 'bg-gray-800 text-gray-600' : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
          }`}>
          {triggered ? 'TRIGGERED' : 'SIMULATE EVENT'}
        </button>
      </div>
    </div>
  );
}

function HistoryRow({ event }: { event: OwnerEventResult }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-800/30 last:border-0 text-xs">
      <span>{event.emoji}</span>
      <TagBadge tag={event.tag} />
      <span className="text-gray-300 flex-1">{event.msg}</span>
      <span className={`font-bold tabular-nums ${event.mood >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {event.mood > 0 ? '+' : ''}{event.mood}
      </span>
      <span className="text-gray-600 tabular-nums w-12 text-right">Wk {event.week}</span>
    </div>
  );
}

export default function OwnerPersonalityView() {
  const { gameStarted } = useGameStore();
  const [owner, setOwner] = useState<OwnerProfile>(() => generateDemoOwner());
  const [history] = useState<OwnerEventResult[]>(() => generateDemoEventHistory());
  const [triggered, setTriggered] = useState<Set<number>>(new Set());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const archInfo = ARCHETYPE_DISPLAY[owner.archetype];
  const events = getOwnerEvents(owner);
  const firingRisk = getFiringRisk(owner.mood);

  const handleTrigger = (event: OwnerEvent, idx: number) => {
    setOwner(prev => applyOwnerEvent(prev, event));
    setTriggered(prev => new Set([...prev, idx]));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>OWNER PERSONALITY</span>
        <span className="text-gray-600 text-[10px]">{owner.name}</span>
      </div>

      {/* Owner info + mood */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{archInfo.icon}</span>
            <div>
              <div className="text-orange-300 font-bold text-sm">{owner.name}</div>
              <div className="text-gray-600 text-[10px]">Season {owner.tenureSeason} as Owner</div>
            </div>
          </div>
          <div className="px-2 py-1 rounded text-xs font-bold text-center"
            style={{ backgroundColor: archInfo.color + '22', color: archInfo.color }}>
            {archInfo.label.toUpperCase()}
          </div>
          <div className="text-gray-500 text-[10px] mt-2">{archInfo.desc}</div>
        </div>

        <MoodMeter mood={owner.mood} />

        <div className="bloomberg-border px-4 py-3 text-center">
          <div className="text-gray-500 text-[10px] mb-1">FIRING RISK</div>
          <div className="text-4xl font-bold tabular-nums mb-1" style={{ color: firingRisk.color }}>
            {firingRisk.pct}%
          </div>
          <div className="text-xs font-bold" style={{ color: firingRisk.color }}>{firingRisk.label.toUpperCase()}</div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-2 max-w-xs mx-auto">
            <div className="h-full rounded-full transition-all" style={{ width: `${firingRisk.pct}%`, backgroundColor: firingRisk.color }} />
          </div>
        </div>
      </div>

      {/* Event triggers */}
      <div>
        <div className="text-gray-500 text-[10px] font-bold mb-2 px-1">POSSIBLE EVENTS</div>
        <div className="grid grid-cols-2 gap-3">
          {events.map((e, i) => (
            <EventCard key={i} event={e} onTrigger={() => handleTrigger(e, i)} triggered={triggered.has(i)} />
          ))}
        </div>
      </div>

      {/* Event history */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">EVENT HISTORY ({history.length})</div>
        <div className="max-h-48 overflow-y-auto">
          {history.map((e, i) => <HistoryRow key={i} event={e} />)}
        </div>
      </div>
    </div>
  );
}
