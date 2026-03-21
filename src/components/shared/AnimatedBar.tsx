/**
 * AnimatedBar — a progress bar that smoothly animates when its value changes.
 * Respects prefers-reduced-motion and the reduceMotion preference.
 */

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
  const systemReduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const shouldAnimate = !reduceMotion && !systemReduceMotion;
  const clamped = Math.max(0, Math.min(100, value));

  // Determine if color is a Tailwind class or CSS value
  const isClass = color.startsWith('bg-');

  // Map height prop to mbd-progress size class
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
      <div
        className={`mbd-progress-bar ${shouldAnimate ? '' : 'transition-none'} ${isClass ? color : ''}`}
        style={{
          width: `${clamped}%`,
          ...(isClass ? {} : { backgroundColor: color }),
        }}
      />
    </div>
  );
}
