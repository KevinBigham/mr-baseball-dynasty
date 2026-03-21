/**
 * GradeBar — Horizontal 20-80 scale scouting gauge with Motion animation.
 * Maps to existing grade-20 through grade-80 CSS color classes.
 */

import { motion, useReducedMotion } from 'motion/react';
import { gradeHeatBg } from '../../utils/gradeColor';

interface GradeBarProps {
  label: string;
  grade: number;
  projected?: number;
  /** Show numeric value */
  showValue?: boolean;
  /** Compact mode */
  compact?: boolean;
}

export default function GradeBar({
  label,
  grade,
  projected,
  showValue = true,
  compact = false,
}: GradeBarProps) {
  const reduce = useReducedMotion();
  // Normalize 20-80 scale to 0-100%
  const pct = Math.max(0, Math.min(100, ((grade - 20) / 60) * 100));
  const projPct = projected ? Math.max(0, Math.min(100, ((projected - 20) / 60) * 100)) : undefined;
  const color = gradeHeatBg(grade);
  const h = compact ? 'h-1.5' : 'h-2.5';

  return (
    <div className={`flex items-center gap-2 ${compact ? 'gap-1.5' : 'gap-2'}`}>
      {/* Label */}
      <span className={`text-gray-500 font-bold tracking-wider shrink-0 ${compact ? 'text-[8px] w-8' : 'text-[9px] w-10'}`}>
        {label}
      </span>

      {/* Bar */}
      <div className={`flex-1 ${h} bg-gray-800 rounded-full overflow-hidden relative`}>
        {/* Projected ceiling (background ghost bar) */}
        {projPct !== undefined && (
          <div
            className="absolute inset-y-0 left-0 rounded-full opacity-20"
            style={{ width: `${projPct}%`, backgroundColor: color }}
          />
        )}
        {/* Current grade fill */}
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={reduce ? { width: `${pct}%` } : { width: '0%' }}
          animate={{ width: `${pct}%` }}
          transition={reduce ? { duration: 0 } : {
            type: 'spring',
            stiffness: 80,
            damping: 15,
            delay: 0.1,
          }}
        />
      </div>

      {/* Value */}
      {showValue && (
        <span
          className={`font-bold tabular-nums shrink-0 ${compact ? 'text-[9px] w-5' : 'text-[10px] w-6'}`}
          style={{ color }}
        >
          {grade}
        </span>
      )}
    </div>
  );
}
