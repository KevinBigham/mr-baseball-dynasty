/**
 * AnimatedNumber — displays a number that ticks up/down when it changes.
 * Respects prefers-reduced-motion and the reduceMotion preference.
 */

import { useEffect, useRef, useState } from 'react';
import { usePreferencesStore } from '../../store/preferencesStore';

interface Props {
  value: number;
  /** Number of decimal places (default 0) */
  decimals?: number;
  /** Animation duration in ms (default 250) */
  duration?: number;
  /** Additional className */
  className?: string;
  /** Prefix (e.g. "$") */
  prefix?: string;
  /** Suffix (e.g. "%") */
  suffix?: string;
}

export default function AnimatedNumber({ value, decimals = 0, duration = 250, className = '', prefix = '', suffix = '' }: Props) {
  const reduceMotion = usePreferencesStore(s => s.reduceMotion);
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    // Check system preference too
    const systemReduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || systemReduceMotion || prevRef.current === value) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const from = prevRef.current;
    const to = value;
    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplay(to);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
    prevRef.current = value;

    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value, duration, reduceMotion]);

  return (
    <span className={`tabular-nums ${className}`}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}
