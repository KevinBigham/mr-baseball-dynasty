import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  generateOffseasonEvents,
  resolveEvent,
  getOffseasonSummary,
  type OffseasonEvent,
  type OffseasonChoice,
} from '../../engine/offseason/offseasonEvents';

function ChoiceCard({ choice, idx, onChoose, disabled }: {
  choice: OffseasonChoice; idx: number; onChoose: () => void; disabled: boolean;
}) {
  return (
    <button
      className={`bloomberg-border px-3 py-2 text-left transition-all hover:bg-gray-800/30 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onChoose}
      disabled={disabled}
    >
      <div className="text-orange-300 font-bold text-xs">{choice.label}</div>
      <div className="text-gray-500 text-[10px]">{choice.desc}</div>
    </button>
  );
}

function EventCard({ event, onResolve }: { event: OffseasonEvent; onResolve: (idx: number) => void }) {
  return (
    <div className="bloomberg-border">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{event.icon}</span>
          <div className="flex-1">
            <div className="text-orange-300 font-bold text-sm">{event.label}</div>
            {event.resolved && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-900/30 text-green-400 ml-2">
                RESOLVED
              </span>
            )}
          </div>
        </div>

        <div className="text-gray-400 text-xs mb-3">{event.headline}</div>

        {!event.resolved ? (
          <div className="grid grid-cols-2 gap-2">
            {event.choices.map((c, i) => (
              <ChoiceCard key={i} choice={c} idx={i} onChoose={() => onResolve(i)} disabled={event.resolved} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded px-3 py-2 text-[10px]">
            <span className="text-gray-500">CHOICE: </span>
            <span className="text-orange-400 font-bold">
              {event.chosenIdx !== undefined ? event.choices[event.chosenIdx].label : '—'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OffseasonEventsView() {
  const { gameStarted } = useGameStore();
  const [events, setEvents] = useState<OffseasonEvent[]>(() => generateOffseasonEvents(4));

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const summary = getOffseasonSummary(events);

  const handleResolve = (eventIdx: number, choiceIdx: number) => {
    setEvents(prev => prev.map((e, i) =>
      i === eventIdx ? resolveEvent(e, choiceIdx) : e
    ));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>OFFSEASON EVENTS</span>
        {summary.pending > 0 && (
          <span className="text-orange-400 text-[10px]">{summary.pending} PENDING DECISIONS</span>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">TOTAL EVENTS</div>
          <div className="text-orange-400 font-bold text-xl tabular-nums">{summary.total}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">RESOLVED</div>
          <div className="text-green-400 font-bold text-xl tabular-nums">{summary.resolved}</div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">PENDING</div>
          <div className="text-yellow-400 font-bold text-xl tabular-nums">{summary.pending}</div>
        </div>
      </div>

      {/* Event cards */}
      <div className="grid grid-cols-2 gap-3">
        {events.map((e, i) => (
          <EventCard key={e.id} event={e} onResolve={(choiceIdx) => handleResolve(i, choiceIdx)} />
        ))}
      </div>

      {/* Info */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">OFFSEASON EVENTS GUIDE</div>
        <div className="p-3 grid grid-cols-3 gap-4 text-[10px] text-gray-500">
          <div>
            <div className="text-orange-300 font-bold mb-1">EVENTS</div>
            <div>4 random events are generated each offseason from a pool of 8 templates.</div>
          </div>
          <div>
            <div className="text-orange-300 font-bold mb-1">CHOICES</div>
            <div>Each event presents two options. Your decisions have real consequences for roster and budget.</div>
          </div>
          <div>
            <div className="text-orange-300 font-bold mb-1">IMPACT</div>
            <div>Events can affect draft picks, free agents, roster spots, owner patience, and team morale.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
