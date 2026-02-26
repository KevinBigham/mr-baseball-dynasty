/**
 * FranchisePanel.tsx — Live franchise status (Owner Patience + Team Morale + Breakout Watch + News Feed)
 *
 * Four panels stolen from Mr. Football Dynasty v98 and adapted for baseball:
 *   1. Owner Patience bar  — win-now / patient-builder / penny-pincher archetypes
 *   2. Team Morale gauge   — clubhouse chemistry pulse
 *   3. Breakout Watch      — 3 prospect spotlights with OVR progress
 *   4. News Feed           — rolling narrative headlines from the season
 */

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useLeagueStore } from '../../store/leagueStore';
import {
  getOwnerStatus, getArchetypeInfo, getMoraleStatus,
  type BreakoutCandidate, type NewsItem,
} from '../../engine/narrative';

// ─── Owner Patience Panel ─────────────────────────────────────────────────────

function OwnerPatiencePanel() {
  const { ownerArchetype, ownerPatience, difficulty } = useGameStore();
  const status    = getOwnerStatus(ownerPatience);
  const archetype = getArchetypeInfo(ownerArchetype);
  const pct       = ownerPatience / 100;

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4">OWNER MANDATE</div>
      <div className="px-4 py-3 space-y-3">

        {/* Archetype badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{archetype.emoji}</span>
            <div>
              <div className="font-bold text-xs" style={{ color: archetype.color }}>
                {archetype.label.toUpperCase()}
              </div>
              <div className="text-gray-600 text-xs">{archetype.mandate}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-lg tabular-nums" style={{ color: status.color }}>
              {ownerPatience}
            </div>
            <div className="text-gray-600 text-xs">/ 100</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold tracking-widest" style={{ color: status.color }}>
              {status.emoji} {status.label}
            </span>
            <span className="text-gray-600 text-xs capitalize">{difficulty} mode</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-gray-800">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.round(pct * 100)}%`, background: status.barColor }}
            />
          </div>
          <div className="text-gray-500 text-xs leading-snug">{status.desc}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Team Morale Panel ────────────────────────────────────────────────────────

function MoralePanel() {
  const { teamMorale } = useGameStore();
  const status = getMoraleStatus(teamMorale);
  const pct    = teamMorale / 100;

  // 5-pip indicator
  const pips = Array.from({ length: 5 }, (_, i) => {
    const threshold = (i + 1) * 20;
    return teamMorale >= threshold;
  });

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4">CLUBHOUSE MORALE</div>
      <div className="px-4 py-3 space-y-3">

        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-xs tracking-widest" style={{ color: status.color }}>
              {status.emoji} {status.label}
            </div>
            <div className="text-gray-600 text-xs mt-0.5">Team chemistry & confidence</div>
          </div>
          <div className="font-black text-2xl tabular-nums" style={{ color: status.color }}>
            {teamMorale}
          </div>
        </div>

        {/* Pips */}
        <div className="flex gap-1.5">
          {pips.map((filled, i) => (
            <div
              key={i}
              className="flex-1 h-3 rounded-sm transition-all duration-500"
              style={{
                background: filled ? status.color : 'rgba(255,255,255,0.06)',
                opacity: filled ? 1 : 0.4,
              }}
            />
          ))}
        </div>

        {/* Bar */}
        <div className="h-1.5 rounded-full overflow-hidden bg-gray-800">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.round(pct * 100)}%`, background: status.color }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Breakout Watch Panel ─────────────────────────────────────────────────────

function OVRDelta({ current, target, hit }: { current: number; target: number; hit: boolean | null }) {
  if (hit === null) {
    const pct = Math.min(1, current / target);
    return (
      <div className="text-right min-w-[72px]">
        <div className="text-xs text-gray-500 mb-0.5">OVR → TGT</div>
        <div className="font-black text-sm tabular-nums text-orange-400">
          {current} → {target}
        </div>
        <div className="h-1 bg-gray-800 rounded mt-1 overflow-hidden">
          <div className="h-full bg-orange-500 rounded" style={{ width: `${Math.round(pct * 100)}%` }} />
        </div>
      </div>
    );
  }
  if (hit) {
    return (
      <div className="text-right min-w-[72px]">
        <div className="text-xs text-green-500 font-bold">✓ HIT</div>
        <div className="font-black text-sm tabular-nums text-green-400">{current} OVR</div>
      </div>
    );
  }
  return (
    <div className="text-right min-w-[72px]">
      <div className="text-xs text-red-500 font-bold">✗ BUST</div>
      <div className="font-black text-sm tabular-nums text-red-400">{current} OVR</div>
    </div>
  );
}

function BreakoutCard({ c }: { c: BreakoutCandidate }) {
  const potColor = c.potential >= 80 ? '#4ade80' : c.potential >= 65 ? '#fbbf24' : '#94a3b8';
  const levelColor = c.level === 'MLB' ? '#f97316' : c.level === 'AAA' ? '#fbbf24' : '#94a3b8';

  return (
    <div
      className="rounded-lg p-3 flex items-center gap-3"
      style={{
        background: c.hit === true
          ? 'rgba(74,222,128,0.06)'
          : c.hit === false
            ? 'rgba(239,68,68,0.06)'
            : 'rgba(249,115,22,0.05)',
        border: c.hit === true
          ? '1px solid rgba(74,222,128,0.25)'
          : c.hit === false
            ? '1px solid rgba(239,68,68,0.25)'
            : '1px solid rgba(249,115,22,0.2)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-sm text-gray-200 truncate">{c.name}</span>
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded"
            style={{ background: `${levelColor}22`, color: levelColor, border: `1px solid ${levelColor}44` }}
          >
            {c.level}
          </span>
        </div>
        <div className="text-gray-500 text-xs">
          {c.position} · Age {c.age}
          <span className="ml-2 font-bold" style={{ color: potColor }}>
            POT {c.potential}
          </span>
        </div>
      </div>
      <OVRDelta current={c.ovr} target={c.targetOvr} hit={c.hit} />
    </div>
  );
}

function BreakoutWatchPanel() {
  const { breakoutWatch } = useGameStore();
  if (breakoutWatch.length === 0) return null;

  const hits  = breakoutWatch.filter(c => c.hit === true).length;
  const busts = breakoutWatch.filter(c => c.hit === false).length;
  const open  = breakoutWatch.filter(c => c.hit === null).length;

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>BREAKOUT WATCH</span>
        <div className="flex gap-3 text-xs normal-case font-normal">
          {open  > 0 && <span className="text-orange-400 font-mono">{open} watching</span>}
          {hits  > 0 && <span className="text-green-400 font-mono">✓ {hits} hit</span>}
          {busts > 0 && <span className="text-red-400 font-mono">✗ {busts} bust</span>}
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        {breakoutWatch.map(c => (
          <BreakoutCard key={c.playerId} c={c} />
        ))}
        <div className="text-gray-700 text-xs text-center pt-1">
          Young players selected by upside gap · Resolved at season end
        </div>
      </div>
    </div>
  );
}

// ─── News Feed Panel ──────────────────────────────────────────────────────────

const TYPE_STYLES: Record<string, { border: string; bg: string }> = {
  award:       { border: 'rgba(251,191,36,0.4)',  bg: 'rgba(251,191,36,0.05)' },
  division:    { border: 'rgba(249,115,22,0.4)',  bg: 'rgba(249,115,22,0.05)' },
  development: { border: 'rgba(74,222,128,0.3)',  bg: 'rgba(74,222,128,0.04)' },
  retirement:  { border: 'rgba(148,163,184,0.3)', bg: 'rgba(148,163,184,0.04)' },
  league:      { border: 'rgba(96,165,250,0.3)',  bg: 'rgba(96,165,250,0.04)' },
  rumor:       { border: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.04)' },
  milestone:   { border: 'rgba(251,191,36,0.4)',  bg: 'rgba(251,191,36,0.05)' },
};

function NewsCard({ item, isUserTeam }: { item: NewsItem; isUserTeam?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const style = TYPE_STYLES[item.type] ?? TYPE_STYLES.league;

  return (
    <div
      className="rounded p-2.5 cursor-pointer transition-all duration-150 hover:opacity-90"
      style={{
        background:  style.bg,
        border:      `1px solid ${isUserTeam ? 'rgba(249,115,22,0.5)' : style.border}`,
        borderLeft:  `3px solid ${isUserTeam ? '#f97316' : style.border}`,
      }}
      onClick={() => setExpanded(e => !e)}
    >
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-xs text-gray-200 leading-snug">
            {item.headline}
            {isUserTeam && (
              <span className="ml-1.5 text-orange-400 font-black">★</span>
            )}
          </div>
          {expanded && (
            <div className="text-gray-400 text-xs mt-1.5 leading-relaxed">{item.body}</div>
          )}
          <div className="text-gray-700 text-xs mt-0.5">{expanded ? '▲ collapse' : '▼ read more'}</div>
        </div>
        <div className="text-gray-700 text-xs shrink-0 tabular-nums">{item.season}</div>
      </div>
    </div>
  );
}

function NewsFeedPanel() {
  const { newsItems } = useLeagueStore();
  const { userTeamId } = useGameStore();
  const [showAll, setShowAll]     = useState(false);

  if (newsItems.length === 0) return null;

  const TEAM_ABBRS: Record<number, string> = {
    1:'ADM',2:'COL',3:'LOB',4:'STM',5:'HAM',6:'WLV',7:'CRU',8:'FOX',9:'MIN',10:'MON',
    11:'GUL',12:'RAT',13:'COU',14:'LUM',15:'ANG',16:'MET',17:'BRA',18:'TID',19:'PAT',20:'HUR',
    21:'CUB',22:'RED',23:'CIN',24:'AST',25:'BRW',26:'DOD',27:'GNT',28:'PAD',29:'ROC',30:'DIA',
  };
  const userAbbr = TEAM_ABBRS[userTeamId] ?? '';

  const displayed = showAll ? newsItems : newsItems.slice(0, 6);

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>LEAGUE DISPATCH</span>
        <span className="text-gray-600 text-xs normal-case font-normal">{newsItems.length} items</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        {displayed.map(item => (
          <NewsCard
            key={item.id}
            item={item}
            isUserTeam={item.isUserTeam || item.headline.includes(userAbbr)}
          />
        ))}
        {newsItems.length > 6 && (
          <button
            onClick={() => setShowAll(s => !s)}
            className="w-full py-1.5 text-xs text-gray-500 hover:text-orange-400 transition-colors font-bold tracking-widest uppercase"
          >
            {showAll ? '▲ SHOW LESS' : `▼ SHOW ALL ${newsItems.length} STORIES`}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Combined export ──────────────────────────────────────────────────────────

export { OwnerPatiencePanel, MoralePanel, BreakoutWatchPanel, NewsFeedPanel };
