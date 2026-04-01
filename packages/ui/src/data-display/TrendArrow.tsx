import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../lib/utils';

type TrendDirection = 'up' | 'down' | 'flat';

interface TrendArrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  direction: TrendDirection;
  value?: number;
}

const directionConfig: Record<
  TrendDirection,
  { icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; colorClass: string }
> = {
  up: { icon: TrendingUp, colorClass: 'text-accent-success' },
  down: { icon: TrendingDown, colorClass: 'text-accent-danger' },
  flat: { icon: Minus, colorClass: 'text-dynasty-textSecondary' },
};

const TrendArrow = React.forwardRef<HTMLSpanElement, TrendArrowProps>(
  ({ direction, value, className, ...props }, ref) => {
    const config = directionConfig[direction];
    const Icon = config.icon;

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-0.5 text-xs font-medium',
          config.colorClass,
          className,
        )}
        {...props}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {value !== undefined && (
          <span className="font-mono">{value}</span>
        )}
      </span>
    );
  },
);

TrendArrow.displayName = 'TrendArrow';

export { TrendArrow };
export type { TrendArrowProps, TrendDirection };
