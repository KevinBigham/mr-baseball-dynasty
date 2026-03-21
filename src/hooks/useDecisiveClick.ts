/**
 * useDecisiveClick — multi-sensory feedback for major decisions.
 * Combines: brief pause → sound effect → visual flash → state settle.
 * Used for trades, draft picks, signings, and other "big moment" actions.
 */

import { useCallback, useState } from 'react';
import { useSound, type SoundName } from './useSound';
import { usePreferencesStore } from '../store/preferencesStore';

interface DecisiveClickResult {
  /** Whether the decisive feedback animation is active */
  isDeciding: boolean;
  /** CSS class to apply to the target element during the feedback */
  feedbackClass: string;
  /** Wrap an action with decisive click feedback */
  withFeedback: (action: () => void, sound?: SoundName) => void;
}

export function useDecisiveClick(): DecisiveClickResult {
  const [isDeciding, setIsDeciding] = useState(false);
  const { play } = useSound();
  const reduceMotion = usePreferencesStore(s => s.reduceMotion);

  const withFeedback = useCallback((action: () => void, sound: SoundName = 'playStamp') => {
    if (reduceMotion) {
      // Skip animation, just do it
      void play(sound);
      action();
      return;
    }

    setIsDeciding(true);

    // Brief 100ms pause before reveal
    setTimeout(() => {
      void play(sound);
      action();

      // Hold the feedback state for 300ms for visual settle
      setTimeout(() => {
        setIsDeciding(false);
      }, 300);
    }, 100);
  }, [play, reduceMotion]);

  const feedbackClass = isDeciding
    ? 'mbd-decisive-flash'
    : '';

  return { isDeciding, feedbackClass, withFeedback };
}
