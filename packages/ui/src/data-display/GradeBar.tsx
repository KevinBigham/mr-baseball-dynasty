import * as React from 'react';
import { cn } from '../lib/utils';

interface GradeBarProps extends React.HTMLAttributes<HTMLDivElement> {
  grade: number;
  label?: string;
  showValue?: boolean;
}

function getGradeColor(grade: number): string {
  if (grade <= 30) return 'bg-accent-danger';
  if (grade <= 45) return 'bg-accent-warning';
  if (grade <= 50) return 'bg-dynasty-text';
  if (grade <= 65) return 'bg-accent-success';
  return 'bg-green-400';
}

function getGradeTextColor(grade: number): string {
  if (grade <= 30) return 'text-accent-danger';
  if (grade <= 45) return 'text-accent-warning';
  if (grade <= 50) return 'text-dynasty-text';
  if (grade <= 65) return 'text-accent-success';
  return 'text-green-400';
}

const GradeBar = React.forwardRef<HTMLDivElement, GradeBarProps>(
  ({ grade, label, showValue = true, className, ...props }, ref) => {
    const clampedGrade = Math.max(20, Math.min(80, grade));
    // Map 20-80 to 0-100%
    const fillPercent = ((clampedGrade - 20) / 60) * 100;

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        {label && (
          <span className="text-xs text-dynasty-textSecondary w-16 shrink-0">
            {label}
          </span>
        )}
        <div className="relative h-2 flex-1 rounded-full bg-dynasty-base overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', getGradeColor(clampedGrade))}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        {showValue && (
          <span
            className={cn(
              'font-mono text-xs font-semibold w-6 text-right shrink-0',
              getGradeTextColor(clampedGrade),
            )}
          >
            {clampedGrade}
          </span>
        )}
      </div>
    );
  },
);

GradeBar.displayName = 'GradeBar';

export { GradeBar };
export type { GradeBarProps };
