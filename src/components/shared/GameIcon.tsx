import type { IconName } from '../../constants/icons';
import MbdIcon from '../ui/mbd-icon';

interface GameIconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** @deprecated Use MbdIcon directly. This wrapper exists for backward compatibility. */
export default function GameIcon({ name, size = 'md', className = '' }: GameIconProps) {
  return <MbdIcon name={name} size={size} className={className} />;
}
