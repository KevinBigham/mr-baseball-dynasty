import * as React from 'react';
import { cn } from '../lib/utils';

interface Stat {
  label: string;
  value: string | number;
}

interface StatLineProps extends React.HTMLAttributes<HTMLDivElement> {
  stats: Stat[];
}

const StatLine = React.forwardRef<HTMLDivElement, StatLineProps>(
  ({ stats, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', className)}
        {...props}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-baseline gap-1.5">
            <span className="text-xs text-dynasty-textSecondary">
              {stat.label}
            </span>
            <span className="font-mono text-sm font-medium text-dynasty-text text-right">
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    );
  },
);

StatLine.displayName = 'StatLine';

export { StatLine };
export type { StatLineProps, Stat };
