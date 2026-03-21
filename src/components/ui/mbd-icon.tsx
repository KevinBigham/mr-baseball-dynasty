import { ICON_MAP, type IconName } from '../../constants/icons';
import { cn } from '../../lib/utils';

interface MbdIconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_PX = { sm: 14, md: 18, lg: 24 } as const;

/** Renders a Lucide SVG icon by game icon name. Replaces the legacy PNG GameIcon. */
export default function MbdIcon({ name, size = 'md', className }: MbdIconProps) {
  const Icon = ICON_MAP[name];
  const px = SIZE_PX[size];

  return (
    <Icon
      width={px}
      height={px}
      className={cn('inline-block shrink-0', className)}
      aria-hidden="true"
    />
  );
}
