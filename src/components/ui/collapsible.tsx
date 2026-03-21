import * as React from 'react';
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

const Collapsible = CollapsiblePrimitive.Root;
const CollapsibleTrigger = CollapsiblePrimitive.Trigger;
const CollapsibleContent = CollapsiblePrimitive.Content;

/** A styled collapsible panel matching the Bloomberg aesthetic. */
function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  className,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badge?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={className}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold uppercase tracking-wider text-orange-400 hover:text-orange-300 transition-colors cursor-pointer select-none group">
        <span className="flex items-center gap-2">
          {title}
          {badge}
        </span>
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-gray-500 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 overflow-hidden">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  CollapsibleSection,
};
