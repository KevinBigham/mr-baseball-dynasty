/**
 * AnimatedNumber — displays a number that ticks up/down with Motion springs.
 * Respects prefers-reduced-motion and the reduceMotion preference.
 */

import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion, useReducedMotion } from 'motion/react';
import { usePreferencesStore } from '../../store/preferencesStore';

interface Props {
  value: number;
  /** Number of decimal places (default 0) */
  decimals?: number;
  /** Additional className */
  className?: string;
  /** Prefix (e.g. "$") */
  prefix?: string;
  /** Suffix (e.g. "%") */
  suffix?: string;
}

export default function AnimatedNumber({ value, decimals = 0, className = '', prefix = '', suffix = '' }: Props) {
  const reduceMotion = usePreferencesStore(s => s.reduceMotion);
  const systemReduceMotion = useReducedMotion();
  const shouldAnimate = !reduceMotion && !systemReduceMotion;

  const motionValue = useMotionValue(value);
  const spring = useSpring(motionValue, {
    stiffness: 100,
    damping: 20,
    mass: 0.5,
  });
  const display = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    if (shouldAnimate) {
      motionValue.set(value);
    } else {
      // Jump instantly
      motionValue.jump(value);
    }
  }, [value, motionValue, shouldAnimate]);

  return (
    <motion.span className={`tabular-nums ${className}`}>
      {display}
    </motion.span>
  );
}
