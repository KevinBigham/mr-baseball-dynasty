/**
 * MomentsPanel.tsx — Season Moments Gallery
 *
 * Displays categorized highlight moments accumulated across seasons.
 * Horizontal scrollable card deck sorted by recency + weight.
 */

import { useState } from 'react';
import { type SeasonMoment, getMomentMeta } from '../../engine/moments';

// ─── Single Moment Card ───────────────────────────────────────────────────────

function MomentCard({ moment }: { moment: SeasonMoment }) {
  const meta = getMomentMeta(moment.category);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="shrink-0 w-52 rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        background: `linear-gradient(135deg, #111116 60%, ${meta.color}12 100%)`,
        border: `1px solid ${moment.isUserTeam ? meta.color + '60' : meta.color + '25'}`,
        boxShadow: moment.isUserTeam ? `0 0 12px ${meta.color}20` : undefined,
      }}
      onClick={() => setExpanded(e => !e)}
    >
      {/* Category badge + season */}
      <div
        className="px-3 pt-2 pb-1 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${meta.color}20` }}
      >
        <div className="flex items-center gap-1">
          <span className="text-sm">{meta.icon}</span>
          <span
            className="text-xs font-bold tracking-wider"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
        </div>
        <div className="text-gray-700 text-xs tabular-nums">{moment.season}</div>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <div className="text-gray-200 text-xs font-bold leading-snug mb-1">
          {moment.headline}
        </div>
        {expanded && (
          <div className="text-gray-500 text-xs leading-relaxed mt-1.5">
            {moment.detail}
          </div>
        )}
        {!expanded && (
          <div className="text-gray-700 text-xs">tap for detail</div>
        )}
      </div>

      {/* Weight indicator (importance dots) */}
      <div className="px-3 pb-2 flex gap-0.5">
        {Array.from({ length: Math.min(5, Math.ceil(moment.weight / 2)) }).map((_, i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full"
            style={{ background: meta.color }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

type FilterCat = 'ALL' | 'dynasty' | 'breakout' | 'heartbreak' | 'record' | 'upset' | 'milestone';

const FILTER_LABELS: Record<FilterCat, string> = {
  ALL:       'ALL',
  dynasty:   '🏆',
  breakout:  '⚡',
  heartbreak:'💔',
  record:    '📈',
  upset:     '🎯',
  milestone: '⭐',
};

export default function MomentsPanel({ moments }: { moments: SeasonMoment[] }) {
  const [filter, setFilter] = useState<FilterCat>('ALL');

  if (moments.length === 0) return null;

  const filtered = filter === 'ALL'
    ? moments
    : moments.filter(m => m.category === filter);

  const sorted = [...filtered].sort((a, b) => b.season - a.season || b.weight - a.weight);

  return (
    <div className="bloomberg-border bg-gray-900">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>FRANCHISE MOMENTS</span>
        <span className="text-gray-600 text-xs normal-case font-normal">
          {moments.length} moment{moments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Category filters */}
      <div className="px-4 pt-2 flex gap-1.5 flex-wrap">
        {(Object.keys(FILTER_LABELS) as FilterCat[]).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="text-xs px-2.5 py-0.5 rounded-full transition-colors"
            style={{
              background: filter === cat ? '#f97316' : 'transparent',
              color:      filter === cat ? '#000' : '#6b7280',
              border:     `1px solid ${filter === cat ? '#f97316' : '#374151'}`,
            }}
          >
            {FILTER_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Scrollable horizontal card deck */}
      <div className="px-4 py-3">
        {sorted.length === 0 ? (
          <div className="text-gray-700 text-xs text-center py-4">
            No {filter} moments yet.
          </div>
        ) : (
          <div
            className="flex gap-3 overflow-x-auto pb-2"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}
          >
            {sorted.map(m => (
              <MomentCard key={m.id} moment={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
