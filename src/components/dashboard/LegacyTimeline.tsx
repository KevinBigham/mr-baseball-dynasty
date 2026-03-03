/**
 * LegacyTimeline.tsx — Franchise history timeline with era detection
 *
 * Adapted from Mr. Football Dynasty v98's dynasty timeline system.
 * Groups consecutive winning seasons into "eras" and displays franchise arc.
 */

import { useState } from 'react';
import { useLeagueStore, type SeasonSummary } from '../../store/leagueStore';

// ─── Era detection ────────────────────────────────────────────────────────────

interface FranchiseEra {
  start:    number;
  end:      number;
  seasons:  SeasonSummary[];
  label:    string;
  emoji:    string;
  color:    string;
  avgWins:  number;
  titles:   number;
  playoffs: number;
}

function detectEras(history: SeasonSummary[]): FranchiseEra[] {
  if (history.length === 0) return [];

  const sorted = [...history].sort((a, b) => a.season - b.season);
  const eras: FranchiseEra[] = [];
  let currentGroup: SeasonSummary[] = [];

  for (const season of sorted) {
    const isDominant = season.wins >= 88;
    const isStruggling = season.wins < 72;

    if (currentGroup.length === 0) {
      currentGroup.push(season);
    } else {
      const prevWasDominant = currentGroup[currentGroup.length - 1].wins >= 88;
      const prevWasStruggling = currentGroup[currentGroup.length - 1].wins < 72;

      // Continue same era if same tier
      if ((isDominant && prevWasDominant) || (isStruggling && prevWasStruggling) ||
          (!isDominant && !isStruggling && !prevWasDominant && !prevWasStruggling)) {
        currentGroup.push(season);
      } else {
        if (currentGroup.length >= 1) eras.push(buildEra(currentGroup));
        currentGroup = [season];
      }
    }
  }

  if (currentGroup.length >= 1) eras.push(buildEra(currentGroup));

  return eras.reverse(); // Most recent first
}

function buildEra(seasons: SeasonSummary[]): FranchiseEra {
  const avgWins = seasons.reduce((s, x) => s + x.wins, 0) / seasons.length;
  const titles  = seasons.filter(s => s.playoffResult === 'Champion').length;
  const playoffs = seasons.filter(s => s.playoffResult !== null).length;

  let label: string, emoji: string, color: string;

  if (titles >= 2) {
    label = 'THE DYNASTY'; emoji = '👑'; color = '#fbbf24';
  } else if (titles === 1) {
    label = 'CHAMPIONSHIP RUN'; emoji = '🏆'; color = '#f97316';
  } else if (avgWins >= 88) {
    label = 'CONTENTION ERA'; emoji = '🔥'; color = '#fb923c';
  } else if (avgWins >= 78) {
    label = 'COMPETITIVE ERA'; emoji = '💪'; color = '#4ade80';
  } else if (avgWins >= 70) {
    label = 'TRANSITION PERIOD'; emoji = '🔄'; color = '#94a3b8';
  } else {
    label = 'REBUILD ERA'; emoji = '🏗️'; color = '#6b7280';
  }

  return {
    start:   seasons[0].season,
    end:     seasons[seasons.length - 1].season,
    seasons,
    label,
    emoji,
    color,
    avgWins: Math.round(avgWins * 10) / 10,
    titles,
    playoffs,
  };
}

// ─── Season row ───────────────────────────────────────────────────────────────

function SeasonRow({ s, isLast }: { s: SeasonSummary; isLast: boolean }) {
  const playoff = s.playoffResult;
  const isChamp = playoff === 'Champion';

  const playoffColor = playoff === 'Champion' ? '#fbbf24'
    : playoff === 'WS'  ? '#f97316'
    : playoff === 'CS'  ? '#fb923c'
    : playoff === 'DS'  ? '#94a3b8'
    : playoff === 'WC'  ? '#6b7280'
    : '#374151';

  const playoffLabel: Record<string, string> = {
    Champion: '🏆 WS CHAMPS',
    WS:       '🥈 WS LOSS',
    CS:       'LCS',
    DS:       'LDS',
    WC:       'WC',
  };

  return (
    <div className={`flex items-center gap-3 py-1.5 text-xs ${!isLast ? 'border-b border-gray-800' : ''}`}>
      {/* Season */}
      <div className="text-gray-500 w-12 shrink-0 tabular-nums font-mono">{s.season}</div>

      {/* W-L */}
      <div
        className="font-bold tabular-nums w-16 shrink-0"
        style={{ color: s.wins >= 88 ? '#4ade80' : s.wins >= 78 ? '#fbbf24' : s.wins >= 70 ? '#94a3b8' : '#ef4444' }}
      >
        {s.wins}–{s.losses}
      </div>

      {/* Playoff result */}
      <div className="w-24 shrink-0">
        {playoff ? (
          <span
            className="font-bold px-1.5 py-0.5 rounded text-xs"
            style={{
              color:      isChamp ? '#000' : playoffColor,
              background: isChamp ? '#fbbf24' : `${playoffColor}22`,
              border:     `1px solid ${playoffColor}44`,
            }}
          >
            {playoffLabel[playoff] ?? playoff}
          </span>
        ) : (
          <span className="text-gray-700">—</span>
        )}
      </div>

      {/* Key moment */}
      <div className="text-gray-500 truncate flex-1">{s.keyMoment}</div>
    </div>
  );
}

// ─── Era card ─────────────────────────────────────────────────────────────────

function EraCard({ era }: { era: FranchiseEra }) {
  const [expanded, setExpanded] = useState(era.seasons.length <= 3);
  const span = era.start === era.end ? `${era.start}` : `${era.start}–${era.end}`;

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${era.color}33` }}
    >
      {/* Era header */}
      <div
        className="px-4 py-3 flex items-center justify-between cursor-pointer"
        style={{ background: `${era.color}0d` }}
        onClick={() => setExpanded(e => !e)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v); } }}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{era.emoji}</span>
          <div>
            <div className="font-black text-sm" style={{ color: era.color }}>
              {era.label}
            </div>
            <div className="text-gray-500 text-xs">{span}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <div className="text-gray-500">AVG WINS</div>
            <div className="font-bold tabular-nums" style={{ color: era.color }}>{era.avgWins}</div>
          </div>
          {era.playoffs > 0 && (
            <div className="text-right">
              <div className="text-gray-500">PLAYOFFS</div>
              <div className="font-bold tabular-nums text-orange-400">{era.playoffs}</div>
            </div>
          )}
          {era.titles > 0 && (
            <div className="text-right">
              <div className="text-gray-500">🏆</div>
              <div className="font-black tabular-nums text-yellow-400">{era.titles}</div>
            </div>
          )}
          <span className="text-gray-500">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Season rows */}
      {expanded && (
        <div className="px-4 py-2">
          {[...era.seasons].reverse().map((s, i) => (
            <SeasonRow key={s.season} s={s} isLast={i === era.seasons.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Overall franchise stats ──────────────────────────────────────────────────

function FranchiseStats({ history }: { history: SeasonSummary[] }) {
  if (history.length === 0) return null;

  const titles    = history.filter(s => s.playoffResult === 'Champion').length;
  const playoffs  = history.filter(s => s.playoffResult !== null).length;
  const totalWins = history.reduce((s, x) => s + x.wins, 0);
  const bestSeason = [...history].sort((a, b) => b.wins - a.wins)[0];
  const pct = totalWins / (history.length * 162);

  return (
    <div className="grid grid-cols-4 gap-2">
      {[
        { label: 'SEASONS',      value: history.length,              color: '#94a3b8' },
        { label: 'WIN PCT',      value: pct.toFixed(3),              color: pct >= 0.5 ? '#4ade80' : '#ef4444' },
        { label: 'PLAYOFFS',     value: playoffs,                    color: '#f97316' },
        { label: 'WS TITLES',    value: titles,                      color: titles > 0 ? '#fbbf24' : '#374151' },
      ].map(s => (
        <div key={s.label} className="bloomberg-border bg-gray-900 px-3 py-2 text-center">
          <div className="text-gray-500 text-xs">{s.label}</div>
          <div className="font-black text-base tabular-nums" style={{ color: s.color }}>{s.value}</div>
        </div>
      ))}
      {bestSeason && (
        <div className="col-span-4 bloomberg-border bg-gray-900 px-3 py-2 flex items-center justify-between">
          <div className="text-gray-500 text-xs">BEST SEASON</div>
          <div className="text-green-400 font-bold text-xs">
            {bestSeason.season} · {bestSeason.wins}–{bestSeason.losses}
            {bestSeason.playoffResult === 'Champion' && ' 🏆'}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function LegacyTimeline() {
  const history = useLeagueStore(s => s.franchiseHistory);

  if (history.length === 0) return null;

  const eras = detectEras(history);

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>FRANCHISE LEGACY</span>
        <span className="text-gray-500 text-xs normal-case font-normal">
          {history.length} season{history.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">
        <FranchiseStats history={history} />
        <div className="space-y-2">
          {eras.map((era, i) => <EraCard key={`${era.start}-${era.end}-${i}`} era={era} />)}
        </div>
      </div>
    </div>
  );
}
