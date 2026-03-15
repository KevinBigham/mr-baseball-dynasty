import { useState } from 'react';
import { GAME_ICONS, type IconName } from '../../constants/icons';

interface GameIconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_PX = { sm: 14, md: 18, lg: 24 } as const;
const SIZE_TEXT = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' } as const;

export default function GameIcon({ name, size = 'md', className = '' }: GameIconProps) {
  const [failed, setFailed] = useState(false);
  const icon = GAME_ICONS[name];
  const px = SIZE_PX[size];

  if (failed) {
    return (
      <span
        className={`inline-flex items-center justify-center font-bold text-gray-400 ${SIZE_TEXT[size]} ${className}`}
        style={{ width: px, height: px }}
        aria-hidden="true"
      >
        {icon.fallback}
      </span>
    );
  }

  return (
    <img
      src={icon.path}
      alt=""
      width={px}
      height={px}
      className={`inline-block ${className}`}
      onError={() => setFailed(true)}
      aria-hidden="true"
    />
  );
}
