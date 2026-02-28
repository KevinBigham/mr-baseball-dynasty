import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import {
  MEDIA_TAGS,
  PRESS_CONFERENCES,
  initMediaProfile,
  addPressResponse,
  type MediaTag,
  type MediaProfile,
  type PressConference,
  type PressResponse,
} from '../../engine/media/mediaPersona';

function PersonaBadge({ profile }: { profile: MediaProfile }) {
  if (!profile.persona) return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-800 text-gray-500">
      NO PERSONA YET
    </span>
  );
  return (
    <span className="px-2 py-0.5 text-[10px] font-bold rounded"
      style={{ backgroundColor: profile.persona.color + '22', color: profile.persona.color }}>
      {profile.persona.icon} {profile.persona.label}
    </span>
  );
}

function CredibilityMeter({ value }: { value: number }) {
  const color = value >= 70 ? '#22c55e' : value >= 45 ? '#eab308' : '#ef4444';
  return (
    <div>
      <div className="flex items-center justify-between text-[10px] mb-0.5">
        <span className="text-gray-600">CREDIBILITY</span>
        <span className="font-bold" style={{ color }}>{value}</span>
      </div>
      <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function ResponseButton({ response, onChoose }: { response: PressResponse; onChoose: () => void }) {
  const tagInfo = MEDIA_TAGS[response.tag];
  return (
    <button
      className="bloomberg-border px-3 py-2.5 text-left transition-all hover:bg-gray-800/30 w-full"
      onClick={onChoose}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{tagInfo.icon}</span>
        <span className="text-orange-300 font-bold text-xs">{response.label}</span>
        <span className="px-1 py-0.5 text-[9px] font-bold rounded"
          style={{ backgroundColor: tagInfo.color + '22', color: tagInfo.color }}>
          {tagInfo.label}
        </span>
      </div>
      <div className="text-gray-400 text-[10px] italic">{response.desc}</div>
    </button>
  );
}

function ConferenceCard({ conference, onRespond, answered }: {
  conference: PressConference;
  onRespond: (response: PressResponse) => void;
  answered: boolean;
}) {
  return (
    <div className="bloomberg-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-orange-300 font-bold text-sm">{conference.situation}</div>
          {answered && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-green-900/30 text-green-400">
              ANSWERED
            </span>
          )}
        </div>
        <div className="text-gray-400 text-xs mb-3">{conference.headline}</div>

        {!answered && (
          <div className="space-y-2">
            {conference.responses.map(r => (
              <ResponseButton key={r.id} response={r} onChoose={() => onRespond(r)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PressRoom() {
  const { gameStarted } = useGameStore();
  const [profile, setProfile] = useState<MediaProfile>(() => {
    // Seed with some history for demo
    let p = initMediaProfile();
    p = addPressResponse(p, 'accountability', 3);
    p = addPressResponse(p, 'stoic', -2);
    p = addPressResponse(p, 'accountability', 5);
    p = addPressResponse(p, 'players_coach', 1);
    return p;
  });
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());

  if (!gameStarted) return <div className="p-4 text-gray-500 text-xs">Start a game first.</div>;

  const handleRespond = (confId: string, response: PressResponse) => {
    // Simulate a random run margin
    const margin = Math.floor(Math.random() * 15) - 5;
    setProfile(prev => addPressResponse(prev, response.tag, margin));
    setAnsweredIds(prev => new Set([...prev, confId]));
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bloomberg-header -mx-4 -mt-4 px-8 py-2 mb-4 flex items-center justify-between">
        <span>PRESS ROOM</span>
        <PersonaBadge profile={profile} />
      </div>

      {/* Profile overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bloomberg-border px-4 py-3">
          <div className="text-gray-500 text-[10px] mb-1">MEDIA PERSONA</div>
          {profile.persona ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{profile.persona.icon}</span>
              <div>
                <div className="font-bold text-sm" style={{ color: profile.persona.color }}>{profile.persona.label}</div>
                <div className="text-gray-500 text-[10px]">{profile.persona.desc}</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-600 text-xs">Answer 3+ pressers to develop a persona</div>
          )}
        </div>
        <div className="bloomberg-border px-4 py-3">
          <CredibilityMeter value={profile.credibility} />
          <div className="text-gray-600 text-[10px] mt-1">
            {profile.credibility >= 70 ? 'High trust with media and players' :
             profile.credibility >= 45 ? 'Neutral media standing' :
             'Media and players are skeptical'}
          </div>
        </div>
        <div className="bloomberg-border px-4 py-3">
          <div className="text-gray-500 text-[10px] mb-1">FAN SENTIMENT</div>
          <div className={`text-2xl font-bold tabular-nums ${
            profile.fanSentiment >= 70 ? 'text-green-400' :
            profile.fanSentiment >= 45 ? 'text-yellow-400' : 'text-red-400'
          }`}>{profile.fanSentiment}</div>
          <div className="text-gray-600 text-[10px]">
            {profile.fanSentiment >= 70 ? 'The fans love you' :
             profile.fanSentiment >= 45 ? 'Fans are lukewarm' :
             'Boo birds are out'}
          </div>
        </div>
      </div>

      {/* Press conferences */}
      <div className="grid grid-cols-2 gap-3">
        {PRESS_CONFERENCES.map(conf => (
          <ConferenceCard
            key={conf.id}
            conference={conf}
            onRespond={(r) => handleRespond(conf.id, r)}
            answered={answeredIds.has(conf.id)}
          />
        ))}
      </div>

      {/* Tag history */}
      <div className="bloomberg-border">
        <div className="bloomberg-header">TAG HISTORY ({profile.tagHistory.length})</div>
        <div className="px-4 py-2 flex items-center gap-1 flex-wrap">
          {profile.tagHistory.map((tag, i) => {
            const info = MEDIA_TAGS[tag];
            return (
              <span key={i} className="px-1.5 py-0.5 text-[10px] font-bold rounded"
                style={{ backgroundColor: info.color + '22', color: info.color }}>
                {info.icon} {info.label}
              </span>
            );
          })}
          {profile.tagHistory.length === 0 && (
            <span className="text-gray-600 text-xs">No press conferences yet.</span>
          )}
        </div>
      </div>

      {/* Guide */}
      <div className="bloomberg-border">
        <div className="bloomberg-header text-gray-500">MEDIA PERSONAS</div>
        <div className="p-3 grid grid-cols-3 gap-3 text-[10px]">
          {(Object.entries(MEDIA_TAGS) as [MediaTag, typeof MEDIA_TAGS[MediaTag]][]).map(([, info]) => (
            <div key={info.label} className="flex items-start gap-1.5">
              <span>{info.icon}</span>
              <div>
                <div className="font-bold" style={{ color: info.color }}>{info.label}</div>
                <div className="text-gray-600">{info.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
