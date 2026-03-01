/**
 * AwardRacePanel.tsx — MVP / Cy Young / ROY race tracker
 *
 * Displays the top 5 candidates for each major award per league.
 * Uses scoring formulas from the engine's award computation.
 */

import { useState } from 'react';
import type { AwardCandidate } from '../../types/league';

interface AwardRaceData {
  mvp:     { al: AwardCandidate[]; nl: AwardCandidate[] };
  cyYoung: { al: AwardCandidate[]; nl: AwardCandidate[] };
  roy:     { al: AwardCandidate[]; nl: AwardCandidate[] };
}

// ─── Single candidate row ────────────────────────────────────────────────────

function CandidateRow({
  c, rank, isUser, maxScore,
}: {
  c: AwardCandidate; rank: number; isUser: boolean; maxScore: number;
}) {
  const barPct = maxScore > 0 ? (c.score / maxScore) * 100 : 0;
  const barColor = rank === 1 ? '#fbbf24' : rank <= 3 ? '#f97316' : '#6b7280';

  const statLine = c.isPitcher
    ? `${c.stats.era?.toFixed(2)} ERA · ${c.stats.w}-${c.stats.l} · ${c.stats.k9?.toFixed(1)} K/9`
    : `${c.stats.ops?.toFixed(3)} OPS · ${c.stats.hr} HR · ${c.stats.avg?.toFixed(3)} AVG`;

  return (
    <div
      className="flex items-center gap-2 py-1.5 text-xs"
      style={{
        background: isUser ? 'rgba(249,115,22,0.05)' : undefined,
        borderLeft: isUser ? '2px solid #f97316' : '2px solid transparent',
        paddingLeft: 8,
      }}
    >
      <span className="w-5 text-right font-bold tabular-nums" style={{ color: barColor }}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-gray-200 truncate">{c.name}</span>
          <span className="text-gray-600 shrink-0">{c.teamAbbr}</span>
          {rank === 1 && <span className="text-yellow-400 text-xs">★</span>}
        </div>
        <div className="text-gray-600 mt-0.5">{c.position} · Age {c.age} · {statLine}</div>
      </div>
      {/* Score bar */}
      <div className="w-24 shrink-0">
        <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.round(barPct)}%`, background: barColor }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Award section ───────────────────────────────────────────────────────────

function AwardSection({
  title, icon, candidates, userTeamId, defaultExpanded,
}: {
  title: string;
  icon: string;
  candidates: AwardCandidate[];
  userTeamId: number;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (candidates.length === 0) return null;

  const maxScore = candidates[0]?.score ?? 1;
  const leader = candidates[0];
  const displayed = expanded ? candidates : candidates.slice(0, 3);

  return (
    <div>
      <div
        className="flex items-center justify-between cursor-pointer py-1 hover:opacity-80"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="text-xs font-bold tracking-widest text-gray-400">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">{leader.name}</span>
          <span className="text-yellow-400 font-bold">{leader.teamAbbr}</span>
          <span className="text-gray-700">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>
      <div className="space-y-0.5">
        {displayed.map((c, i) => (
          <CandidateRow
            key={c.playerId}
            c={c}
            rank={i + 1}
            isUser={c.teamId === userTeamId}
            maxScore={maxScore}
          />
        ))}
      </div>
      {!expanded && candidates.length > 3 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-gray-700 text-xs hover:text-orange-400 transition-colors ml-8 mt-0.5"
        >
          +{candidates.length - 3} more
        </button>
      )}
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export default function AwardRacePanel({
  data, userTeamId, userLeague,
}: {
  data: AwardRaceData;
  userTeamId: number;
  userLeague: 'AL' | 'NL';
}) {
  const [league, setLeague] = useState<'AL' | 'NL'>(userLeague);

  const mvp     = league === 'AL' ? data.mvp.al     : data.mvp.nl;
  const cyYoung = league === 'AL' ? data.cyYoung.al  : data.cyYoung.nl;
  const roy     = league === 'AL' ? data.roy.al      : data.roy.nl;

  const hasAny = mvp.length > 0 || cyYoung.length > 0 || roy.length > 0;
  if (!hasAny) return null;

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>AWARD RACE</span>
        <div className="flex gap-1.5 normal-case font-normal">
          {(['AL', 'NL'] as const).map(l => (
            <button
              key={l}
              onClick={() => setLeague(l)}
              className="text-xs px-2.5 py-0.5 rounded transition-colors"
              style={{
                background: league === l ? '#f97316' : 'transparent',
                color: league === l ? '#000' : '#6b7280',
                border: `1px solid ${league === l ? '#f97316' : '#374151'}`,
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <AwardSection
          title="MOST VALUABLE PLAYER"
          icon="🏆"
          candidates={mvp}
          userTeamId={userTeamId}
          defaultExpanded
        />
        <div className="h-px bg-gray-800" />
        <AwardSection
          title="CY YOUNG AWARD"
          icon="⚾"
          candidates={cyYoung}
          userTeamId={userTeamId}
          defaultExpanded
        />
        {roy.length > 0 && (
          <>
            <div className="h-px bg-gray-800" />
            <AwardSection
              title="ROOKIE OF THE YEAR"
              icon="⭐"
              candidates={roy}
              userTeamId={userTeamId}
              defaultExpanded={false}
            />
          </>
        )}
      </div>
    </div>
  );
}
