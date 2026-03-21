/**
 * Confetti.tsx — Lightweight CSS-based confetti particle effect.
 * No external libraries. Pure CSS animations with randomized delays/positions.
 * Respects prefers-reduced-motion.
 */

import { useMemo } from 'react';
import { usePreferencesStore } from '../../store/preferencesStore';

const COLORS = ['#fbbf24', '#f97316', '#22c55e', '#3b82f6', '#ef4444', '#a855f7', '#ec4899'];
const PARTICLE_COUNT = 60;

interface Particle {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  size: number;
  rotation: number;
}

export default function Confetti() {
  const reduceMotion = usePreferencesStore(s => s.reduceMotion);
  const systemReduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const particles = useMemo<Particle[]>(() => {
    // Use a simple seeded approach for consistent-looking confetti
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      left: `${(i * 1.67) % 100}%`,
      delay: `${(i * 0.05) % 2}s`,
      duration: `${1.5 + (i % 5) * 0.3}s`,
      color: COLORS[i % COLORS.length],
      size: 6 + (i % 4) * 2,
      rotation: (i * 37) % 360,
    }));
  }, []);

  if (reduceMotion || systemReduceMotion) {
    // Show a simple golden border glow instead
    return (
      <div className="fixed inset-0 pointer-events-none z-50"
        style={{ boxShadow: 'inset 0 0 80px rgba(251, 191, 36, 0.15)' }}
      />
    );
  }

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes confetti-sway {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(15px); }
          75% { transform: translateX(-15px); }
        }
        .confetti-particle {
          position: fixed;
          top: -10px;
          z-index: 60;
          pointer-events: none;
          animation: confetti-fall var(--duration) ease-in forwards,
                     confetti-sway 1s ease-in-out infinite;
          animation-delay: var(--delay);
        }
        @media (prefers-reduced-motion: reduce) {
          .confetti-particle { animation: none !important; display: none; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            '--delay': p.delay,
            '--duration': p.duration,
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: '2px',
            transform: `rotate(${p.rotation}deg)`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}
