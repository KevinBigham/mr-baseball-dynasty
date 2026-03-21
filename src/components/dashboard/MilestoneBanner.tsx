/**
 * MilestoneBanner.tsx — Full-screen overlay banner for franchise milestones.
 * Displays briefly, auto-dismisses, and logs to Season Moments.
 * Used for: division clinch, playoff clinch, player milestones, no-hitters, first callups.
 */

import { useEffect, useState } from 'react';
import { useSound } from '../../hooks/useSound';
import { usePreferencesStore } from '../../store/preferencesStore';

export interface MilestoneBannerData {
  id: string;
  icon: string;
  headline: string;
  subtext: string;
  accentColor: string;  // e.g., '#fbbf24' for gold
  category: 'clinch' | 'player' | 'team' | 'special';
}

interface Props {
  banner: MilestoneBannerData;
  onDismiss: () => void;
}

export default function MilestoneBanner({ banner, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const { play } = useSound();
  const reduceMotion = usePreferencesStore(s => s.reduceMotion);

  useEffect(() => {
    // Entrance
    void play('playChime');
    const showTimer = setTimeout(() => setVisible(true), 50);

    // Auto-dismiss after 4 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => { clearTimeout(showTimer); clearTimeout(dismissTimer); };
  }, [play, onDismiss]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {/* Semi-transparent backdrop */}
      <div
        className="absolute inset-0 bg-black transition-opacity duration-300"
        style={{ opacity: visible ? 0.5 : 0 }}
      />

      {/* Banner card */}
      <div
        className={`relative z-10 text-center max-w-md mx-auto px-8 py-6 rounded-lg pointer-events-auto cursor-pointer ${
          reduceMotion ? '' : 'transition-all duration-300'
        }`}
        style={{
          background: `linear-gradient(135deg, #0F1930 0%, ${banner.accentColor}15 100%)`,
          border: `2px solid ${banner.accentColor}60`,
          boxShadow: visible ? `0 0 40px ${banner.accentColor}25` : 'none',
          transform: visible ? 'scale(1)' : 'scale(0.9)',
          opacity: visible ? 1 : 0,
        }}
        onClick={() => { setVisible(false); setTimeout(onDismiss, 100); }}
      >
        <div className="text-4xl mb-2">{banner.icon}</div>
        <div
          className="text-lg font-black tracking-wider"
          style={{ color: banner.accentColor, fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {banner.headline}
        </div>
        <div className="text-gray-400 text-xs mt-2">{banner.subtext}</div>
        <div className="text-gray-500 text-[9px] mt-3 tracking-wider">TAP TO DISMISS</div>
      </div>
    </div>
  );
}
