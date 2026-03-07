/**
 * GlossaryInlineTip.tsx — Inline tooltip for baseball/game terms.
 * Hover or tap to see a brief definition. Uses existing statGlossary data.
 */

import { useState } from 'react';

interface Props {
  term: string;
  definition: string;
  children?: React.ReactNode;
}

export default function GlossaryInlineTip({ term, definition, children }: Props) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        className="border-b border-dotted border-gray-600 text-gray-300 hover:text-orange-400 transition-colors cursor-help"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(s => !s)}
        aria-label={`${term}: ${definition}`}
        type="button"
      >
        {children ?? term}
      </button>
      {show && (
        <span
          className="absolute z-40 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-gray-800 border border-gray-700 text-[10px] text-gray-300 leading-snug whitespace-normal w-48 shadow-lg"
          role="tooltip"
        >
          <span className="text-orange-400 font-bold uppercase tracking-wider">{term}</span>
          <br />
          {definition}
        </span>
      )}
    </span>
  );
}
