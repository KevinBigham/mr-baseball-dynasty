/**
 * StoryboardPanel.tsx — Season Narrative Arc Display
 *
 * Pre-sim: shows the arc title + "going in" framing
 * Post-sim: reveals the resolution of this season's chapter
 */

import { useState } from 'react';
import type { SeasonArc } from '../../engine/storyboard';

export default function StoryboardPanel({
  arc,
  phase,
}: {
  arc:   SeasonArc;
  phase: 'pre' | 'post';
}) {
  const [showReasoning, setShowReasoning] = useState(false);
  return (
    <div
      className="bloomberg-border overflow-hidden relative"
      style={{
        background: `linear-gradient(135deg, #0a0a0f 70%, ${arc.color}10 100%)`,
        borderColor: `${arc.color}30`,
      }}
    >
      {/* Decorative corner accent */}
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-bl-full"
        style={{ background: arc.color }}
      />

      <div className="px-5 py-4 relative z-10">
        {/* Chapter label */}
        <div
          className="text-xs font-bold tracking-widest uppercase mb-1"
          style={{ color: `${arc.color}80` }}
        >
          {arc.chapterLabel}
        </div>

        {/* Arc title + icon */}
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xl">{arc.icon}</span>
          <div
            className="font-black text-lg tracking-widest"
            style={{ color: arc.color }}
          >
            {arc.title}
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-gray-400 text-xs mb-3">{arc.subtitle}</div>

        {/* Divider */}
        <div className="h-px mb-3" style={{ background: `${arc.color}20` }} />

        {/* Chapter description */}
        <div className="text-gray-300 text-xs leading-relaxed">
          {arc.chapterDesc}
        </div>

        {/* Why this arc — collapsible reasoning */}
        {arc.reasoning && arc.reasoning.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReasoning(r => !r)}
              className="text-gray-600 text-xs hover:text-gray-400 transition-colors"
            >
              {showReasoning ? '▲ HIDE' : '▼ WHY THIS ARC?'}
            </button>
            {showReasoning && (
              <div
                className="mt-1.5 px-3 py-2 rounded space-y-0.5"
                style={{ border: `1px dashed ${arc.color}25`, background: 'rgba(0,0,0,0.3)' }}
              >
                {arc.reasoning.map((r, i) => (
                  <div key={i} className="text-gray-500 text-xs leading-relaxed">
                    · {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post-sim resolution */}
        {phase === 'post' && arc.resolution && (
          <div
            className="mt-3 px-3 py-2 rounded-lg"
            style={{
              background: `${arc.color}10`,
              border: `1px solid ${arc.color}30`,
            }}
          >
            <div
              className="text-xs font-bold uppercase tracking-wider mb-0.5"
              style={{ color: arc.color }}
            >
              CHAPTER RESOLVED
            </div>
            <div className="text-gray-300 text-xs leading-relaxed italic">
              "{arc.resolution}"
            </div>
          </div>
        )}

        {/* Pre-sim CTA hint */}
        {phase === 'pre' && (
          <div className="text-gray-700 text-xs mt-2 italic">
            ↓ Sim the season to write this chapter…
          </div>
        )}
      </div>
    </div>
  );
}
