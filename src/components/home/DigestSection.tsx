/**
 * DigestSection.tsx — A single section block within the End-of-Day digest.
 * Renders a labeled section header and a list of entries.
 */

import type { DigestBlock } from '../../types/briefing';

interface Props {
  block: DigestBlock;
}

export default function DigestSection({ block }: Props) {
  return (
    <div>
      <div className="text-orange-500 text-[10px] font-bold tracking-widest uppercase mb-1.5">
        {block.section}
      </div>
      <div className="space-y-1">
        {block.entries.map((entry, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="shrink-0 w-4 text-center">{entry.icon}</span>
            <span className="text-gray-300 font-medium">{entry.label}</span>
            <span className="text-gray-500 mx-1">—</span>
            <span
              className="text-gray-400"
              style={entry.color ? { color: entry.color } : undefined}
            >
              {entry.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
