import * as React from 'react';
import { cn } from '../lib/utils';

type StackDirection = 'horizontal' | 'vertical';
type StackAlign = 'start' | 'center' | 'end' | 'stretch';
type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
type StackGap = '0' | '1' | '2' | '3' | '4' | '6' | '8';

interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
}

const directionClasses: Record<StackDirection, string> = {
  horizontal: 'flex-row',
  vertical: 'flex-col',
};

const gapClasses: Record<StackGap, string> = {
  '0': 'gap-0',
  '1': 'gap-1',
  '2': 'gap-2',
  '3': 'gap-3',
  '4': 'gap-4',
  '6': 'gap-6',
  '8': 'gap-8',
};

const alignClasses: Record<StackAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};

const justifyClasses: Record<StackJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};

const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    {
      direction = 'vertical',
      gap = '2',
      align,
      justify,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex',
          directionClasses[direction],
          gapClasses[gap],
          align && alignClasses[align],
          justify && justifyClasses[justify],
          className,
        )}
        {...props}
      />
    );
  },
);

Stack.displayName = 'Stack';

export { Stack };
export type { StackProps, StackDirection, StackAlign, StackJustify, StackGap };
