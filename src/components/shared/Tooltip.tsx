/**
 * Tooltip.tsx — Simple hover tooltip for abbreviations and scouting grades.
 * Accessible: uses aria-describedby pattern.
 */

import { useState, useRef, type ReactNode } from 'react';

interface Props {
  text: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export default function Tooltip({ text, children, position = 'top' }: Props) {
  const [visible, setVisible] = useState(false);
  const id = useRef(`tooltip-${Math.random().toString(36).slice(2, 8)}`);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? id.current : undefined}
    >
      {children}
      {visible && (
        <span
          id={id.current}
          role="tooltip"
          className={`absolute z-50 px-2 py-1 text-[10px] text-gray-200 bg-gray-800 border border-gray-700 rounded shadow-lg whitespace-nowrap pointer-events-none ${
            position === 'top' ? 'bottom-full mb-1 left-1/2 -translate-x-1/2' : 'top-full mt-1 left-1/2 -translate-x-1/2'
          }`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
