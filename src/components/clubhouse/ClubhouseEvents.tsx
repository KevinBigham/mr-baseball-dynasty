import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  AUTO_EVENTS,
  CHOICE_EVENTS,
  SEVERITY_DISPLAY,
  type ClubhouseEvent,
  type ActiveClubhouseEvent,
  type ClubhouseChoice,
  type EventSeverity,
} from '../../engine/clubhouse/clubhouseEvents';

function SeverityBadge({ severity }: { severity: EventSeverity }) {
  const info = SEVERITY_DISPLAY[severity];
  return (
    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: info.color + '22', color: info.color }}>
      {info.label}
    </span>
  );
}

function ChoiceButton({ choice, onChoose, disabled }: { choice: ClubhouseChoice; onChoose: () => void; disabled: boolean }) {
  const net = choice.moraleEffect + choice.chemistryEffect + choice.reputationEffect;
  const color = net > 0 ? 'text-green-400' : net < 0 ? 'text-red-400' : 'text-gray-400';
  return (
    <button
      className={`bloomberg-border px-3 py-2 text-left transition-all hover:bg-gray-800/30 ${disabled ? 'opacity-50' : ''}`}
      onClick={onChoose}
      disabled={disabled}
    >
      <div className="text-orange-300 font-bold text-xs mb-0.5">{choice.label}</div>
      <div className="text-gray-500 text-[10px] mb-1">{choice.desc}</div>
      <div className="flex items-center gap-2 text-[10px]">
        {choice.moraleEffect !== 0 && (
          <span className={choice.moraleEffect > 0 ? 'text-green-400' : 'text-red-400'}>
            MOR {choice.moraleEffect > 0 ? '+' : ''}{choice.moraleEffect}
          </span>
        )}
        {choice.chemistryEffect !== 0 && (
          <span className={choice.chemistryEffect > 0 ? 'text-green-400' : 'text-red-400'}>
            CHEM {choice.chemistryEffect > 0 ? '+' : ''}{choice.chemistryEffect}
          </span>
        )}
        {choice.reputationEffect !== 0 && (
          <span className={choice.reputationEffect > 0 ? 'text-green-400' : 'text-red-400'}>
            REP {choice.reputationEffect > 0 ? '+' : ''}{choice.reputationEffect}
          </span>
        )}
        <span className={`ml-auto font-bold ${color}`}>
          NET {net > 0 ? '+' : ''}{net}
        </span>
      </div>
    </button>
  );
}

function EventCard({ active, onResolve }: { active: ActiveClubhouseEvent; onResolve: (choiceId: string) => void }) {
  return (
    <div className="bloomberg-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{active.event.icon}</span>
            <div>
              <div className="text-orange-300 font-bold text-sm">{active.event.label}</div>
              {active.playerName && (
                <div className="text-gray-600 text-[10px]">Involving: {active.playerName}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SeverityBadge severity={active.event.severity} />
            <span className="text-gray-700 text-[10px]">S{active.season} G{active.gameDay}</span>
          </div>
        </div>

        <div className="text-gray-400 text-xs mb-3">{active.event.desc}</div>

        {active.choices && !active.resolved && (
          <div className="grid grid-cols-3 gap-2">
            {active.choices.map(c => (
              <ChoiceButton key={c.id} choice={c} onChoose={() => onResolve(c.id)} disabled={active.resolved} />
            ))}
          </div>
        )}

        {active.resolved && active.chosenId && (
          <div className="bg-gray-800/50 rounded px-3 py-2 text-[10px]">
            <span className="text-gray-500">RESOLVED: </span>
            <span className="text-orange-400 font-bold">
              {active.choices?.find(c => c.id === active.chosenId)?.label ?? active.chosenId}
            </span>
          </div>
        )}

        {!active.choices && (
          <div className="text-[10px] text-gray-600 italic">
            Effect: {active.event.effect}
          </div>
        )}
      </div>
    </div>
  );
}

// Demo data
const DEMO_EVENTS: ActiveClubhouseEvent[] = [
  {
    event: CHOICE_EVENTS[0],
    season: 3,
    gameDay: 85,
    choices: CHOICE_EVENTS[0].choices,
    resolved: false,
  },
  {
    event: AUTO_EVENTS[0],
    season: 3,
    gameDay: 82,
    resolved: true,
  },
  {
    event: AUTO_EVENTS[3],
    season: 3,
    gameDay: 60,
    resolved: true,
  },
  {
    event: CHOICE_EVENTS[5],
    season: 3,
    gameDay: 45,
    playerName: 'Tommy Nakamura',
    choices: CHOICE_EVENTS[5].choices,
    resolved: true,
    chosenId: 'start',
  },
  {
    event: AUTO_EVENTS[6],
    season: 3,
    gameDay: 30,
    resolved: true,
  },
];

export default function ClubhouseEvents() {
  const { gameStarted } = useGameStore();
  const [events, setEvents] = useState<ActiveClubhouseEvent[]>(DEMO_EVENTS);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'crisis'>('all');

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const handleResolve = (eventIdx: number, choiceId: string) => {
    setEvents(prev => prev.map((e, i) =>
      i === eventIdx ? { ...e, resolved: true, chosenId: choiceId } : e
    ));
  };

  const filtered = filter === 'all' ? events : events.filter(e => e.event.severity === filter);
  const unresolved = events.filter(e => !e.resolved).length;
  const crises = events.filter(e => e.event.severity === 'crisis').length;
  const positive = events.filter(e => e.event.severity === 'positive').length;

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>CLUBHOUSE EVENTS</span>
        {unresolved > 0 && (
          <span className="text-red-400 text-[10px] animate-pulse">{unresolved} PENDING</span>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL EVENTS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{events.length}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">UNRESOLVED</div>
          <div className="text-red-400 font-bold text-xl tabular-nums">{unresolved}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CRISES</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{crises}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">POSITIVE</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{positive}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1">
        {(['all', 'positive', 'negative', 'crisis'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-2 py-0.5 text-xs font-bold rounded ${
              filter === f ? 'bg-orange-600 text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}>{f.toUpperCase()}</button>
        ))}
      </div>

      {/* Event cards */}
      <div className="space-y-3">
        {filtered.map((e, i) => (
          <EventCard key={i} active={e} onResolve={(choiceId) => handleResolve(events.indexOf(e), choiceId)} />
        ))}
        {filtered.length === 0 && (
          <div className="text-gray-600 text-xs text-center py-8">No events matching filter.</div>
        )}
      </div>

      {/* Guide */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">CLUBHOUSE EVENT GUIDE</div>
        <div className="p-3 grid grid-cols-4 gap-4 text-[10px] text-gray-500">
          {(Object.entries(SEVERITY_DISPLAY) as [EventSeverity, { color: string; label: string }][]).map(([sev, info]) => (
            <div key={sev}>
              <div className="font-bold mb-1" style={{ color: info.color }}>{info.label}</div>
              <div>{sev === 'positive' ? 'Good clubhouse vibes. Boosts morale and chemistry.' :
                    sev === 'neutral' ? 'Requires a decision. Outcome depends on your choice.' :
                    sev === 'negative' ? 'Warning signs. Address early to prevent escalation.' :
                    'Urgent situation. Ignoring will cause major damage.'}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
