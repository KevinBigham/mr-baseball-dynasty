import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  MEDIA_TAG_DISPLAY,
  PRESS_RESPONSE_DISPLAY,
  generateDemoHistory,
  generateDemoPersona,
  type PressConferenceEvent,
  type MediaTag,
} from '../../engine/narrative/mediaPersona';

function PresserCard({ event }: { event: PressConferenceEvent }) {
  const tagInfo = MEDIA_TAG_DISPLAY[event.tag];
  const resultColor = event.result === 'W' ? '#22c55e' : '#ef4444';
  const credColor = event.credDelta > 0 ? '#22c55e' : event.credDelta < 0 ? '#ef4444' : '#6b7280';

  return (
    <div className="bloomberg-border hover:bg-gray-800/20 transition-colors">
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs" style={{ color: resultColor }}>{event.result}</span>
            <span className="text-gray-400 text-[10px]">vs {event.opponent}</span>
            <span className="text-gray-600 text-[10px]">{event.score}</span>
          </div>
          <span className="text-gray-700 text-[10px]">{event.date}</span>
        </div>
        <div className="text-gray-500 text-[10px] italic mb-1">
          {PRESS_RESPONSE_DISPLAY[event.response].desc}
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className="px-1 py-0.5 rounded font-bold"
            style={{ backgroundColor: tagInfo.color + '22', color: tagInfo.color }}>
            {tagInfo.emoji} {tagInfo.label}
          </span>
          <span className="font-bold" style={{ color: credColor }}>
            {event.credDelta > 0 ? '+' : ''}{event.credDelta} CRED
          </span>
        </div>
      </div>
    </div>
  );
}

function TagBar({ tag, count, max }: { tag: MediaTag; count: number; max: number }) {
  const info = MEDIA_TAG_DISPLAY[tag];
  const pct = max > 0 ? (count / max) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="w-24 text-gray-400">{info.emoji} {info.label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: info.color }} />
      </div>
      <span className="w-6 text-right tabular-nums font-bold" style={{ color: info.color }}>{count}</span>
    </div>
  );
}

export default function MediaPersonaView() {
  const { gameStarted } = useGameStore();
  const [history] = useState<PressConferenceEvent[]>(() => generateDemoHistory());
  const [persona] = useState(() => generateDemoPersona());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const dominantInfo = persona.dominantTag ? MEDIA_TAG_DISPLAY[persona.dominantTag] : null;
  const maxTag = Math.max(...Object.values(persona.tagCounts));

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>MANAGER MEDIA PERSONA</span>
        {dominantInfo && (
          <span className="text-[10px] font-bold" style={{ color: dominantInfo.color }}>
            {dominantInfo.emoji} {dominantInfo.label.toUpperCase()}
          </span>
        )}
      </div>

      {/* Persona card */}
      {dominantInfo && (
        <div className="bloomberg-border px-4 py-3" style={{ borderColor: dominantInfo.color + '44' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{dominantInfo.emoji}</span>
            <div>
              <div className="font-bold text-sm" style={{ color: dominantInfo.color }}>{dominantInfo.label}</div>
              <div className="text-gray-500 text-[10px]">{dominantInfo.desc}</div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CREDIBILITY</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: persona.credibility >= 60 ? '#22c55e' : persona.credibility >= 40 ? '#eab308' : '#ef4444' }}>
            {persona.credibility}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">FAN TRUST</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: persona.fanTrust >= 60 ? '#22c55e' : persona.fanTrust >= 40 ? '#eab308' : '#ef4444' }}>
            {persona.fanTrust}
          </div>
        </div>
        <div className="bloomberg-border px-3 py-2 text-center">
          <div className="text-gray-500 text-[10px]">CLUBHOUSE</div>
          <div className="font-bold text-xl tabular-nums" style={{ color: persona.lockerRoomMorale >= 60 ? '#22c55e' : persona.lockerRoomMorale >= 40 ? '#eab308' : '#ef4444' }}>
            {persona.lockerRoomMorale}
          </div>
        </div>
      </div>

      {/* Tag distribution */}
      <div className="bloomberg-border px-4 py-3">
        <div className="text-gray-600 text-[10px] font-bold mb-2">TAG DISTRIBUTION</div>
        <div className="space-y-1.5">
          {(Object.keys(MEDIA_TAG_DISPLAY) as MediaTag[]).map(tag => (
            <TagBar key={tag} tag={tag} count={persona.tagCounts[tag]} max={maxTag} />
          ))}
        </div>
      </div>

      {/* Press conference history */}
      <div>
        <div className="text-gray-600 text-[10px] font-bold mb-2">PRESS CONFERENCE HISTORY</div>
        <div className="grid grid-cols-2 gap-2">
          {history.map(e => (
            <PresserCard key={e.id} event={e} />
          ))}
        </div>
      </div>
    </div>
  );
}
