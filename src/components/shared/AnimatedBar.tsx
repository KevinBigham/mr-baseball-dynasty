/**
 * AnimatedBar — a progress bar with Motion spring animation.
 * Respects prefers-reduced-motion and the reduceMotion preference.
 */

import { motion, useReducedMotion } from 'motion/react';
import { usePreferencesStore } from '../../store/preferencesStore';

interface Props {
  /** Progress value 0–100 */
  value: number;
  /** Bar color (CSS color or Tailwind bg class) */
  color?: string;
  /** Height class (default 'h-1.5') */
  height?: string;
  /** Additional className for outer container */
  className?: string;
  /** Accessible label */
  label?: string;
}

export default function AnimatedBar({
  value,
  color = 'bg-orange-500',
  height = 'h-1.5',
  className = '',
  label,
}: Props) {
  const reduceMotion = usePreferencesStore(s => s.reduceMotion);
  const systemReduceMotion = useReducedMotion();
  const shouldAnimate = !reduceMotion && !systemReduceMotion;
  const clamped = Math.max(0, Math.min(100, value));

  const isClass = color.startsWith('bg-');
  const sizeClass = height === 'h-1' ? 'mbd-progress-xs' : height === 'h-2' ? 'mbd-progress-md' : height === 'h-3' ? 'mbd-progress-lg' : 'mbd-progress-sm';

  return (
    <div
      className={`mbd-progress ${sizeClass} ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <motion.div
        className={`mbd-progress-bar ${isClass ? color : ''}`}
        style={isClass ? {} : { backgroundColor: color }}
        initial={false}
        animate={{ width: `${clamped}%` }}
        transition={shouldAnimate ? {
          type: 'spring',
          stiffness: 120,
          damping: 20,
          mass: 0.8,
        } : { duration: 0 }}
      />
    </div>
  );
}
