import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-accent-primary/15 text-accent-primary border border-accent-primary/25',
        success:
          'bg-accent-success/15 text-accent-success border border-accent-success/25',
        warning:
          'bg-accent-warning/15 text-accent-warning border border-accent-warning/25',
        danger:
          'bg-accent-danger/15 text-accent-danger border border-accent-danger/25',
        info: 'bg-accent-info/15 text-accent-info border border-accent-info/25',
        outline:
          'border border-dynasty-border text-dynasty-textSecondary bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  },
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
export type { BadgeProps };
