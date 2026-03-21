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
  /** Background class (default 'bg-[#1E2A4A]') */
  bgColor?: string;
  /** Additional className for outer container */
  className?: string;
  /** Accessible label */
  label?: string;
}

export default function AnimatedBar({
  value,
  color = 'bg-orange-500',
  height = 'h-1.5',
  bgColor = 'bg-[#1E2A4A]',
  className = '',
  label,
}: Props) {
  const reduceMotion = usePreferencesStore(s => s.reduceMotion);
  const systemReduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const shouldAnimate = !reduceMotion && !systemReduceMotion;
  const clamped = Math.max(0, Math.min(100, value));

  // Determine if color is a Tailwind class or CSS value
  const isClass = color.startsWith('bg-');

  return (
    <div
      className={`w-full ${height} ${bgColor} rounded overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={`h-full rounded ${shouldAnimate ? 'transition-all duration-500 ease-out' : ''} ${isClass ? color : ''}`}
        style={{
          width: `${clamped}%`,
          ...(isClass ? {} : { backgroundColor: color }),
        }}
      />
    </div>
  );
}
