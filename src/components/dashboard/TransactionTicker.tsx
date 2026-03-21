/**
 * TransactionTicker.tsx — Bloomberg-style scrolling transaction feed.
 * Shows league-wide transactions: trades, signings, call-ups, DFA, waivers.
 */

import { usePreferencesStore } from '../../store/preferencesStore';
import type { TransactionTick } from '../../engine/warRoom';

const TYPE_ICONS: Record<string, string> = {
  trade: '🤝',
  signing: '✍️',
  callup: '📞',
  dfa: '📋',
  waiver: '📢',
};

const TYPE_COLORS: Record<string, string> = {
  trade: '#fbbf24',
  signing: '#4ade80',
  callup: '#60a5fa',
  dfa: '#f97316',
  waiver: '#94a3b8',
};

interface Props {
  ticks: TransactionTick[];
}

export default function TransactionTicker({ ticks }: Props) {
  const reduceMotion = usePreferencesStore(s => s.reduceMotion);

  if (ticks.length === 0) return null;

  return (
    <>
      {!reduceMotion && (
        <style>{`
          @keyframes ticker-scroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .ticker-scroll {
            animation: ticker-scroll 30s linear infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .ticker-scroll { animation: none; }
          }
        `}</style>
      )}
      <div
        className="border-t border-[#1E2A4A] overflow-hidden"
        style={{ backgroundColor: '#0D1628', height: '28px' }}
        role="marquee"
        aria-label="Transaction ticker"
      >
        <div className={`flex items-center gap-6 h-full whitespace-nowrap ${reduceMotion ? 'overflow-x-auto' : 'ticker-scroll'}`}>
          {ticks.map(tick => (
            <span key={tick.id} className="inline-flex items-center gap-1.5 shrink-0">
              <span className="text-[10px]">{TYPE_ICONS[tick.type] ?? '📰'}</span>
              <span
                className="text-[10px] font-bold"
                style={{ color: TYPE_COLORS[tick.type] ?? '#94a3b8' }}
              >
                {tick.headline}
              </span>
            </span>
          ))}
          {/* Repeat for continuous scroll */}
          {!reduceMotion && ticks.map(tick => (
            <span key={`r-${tick.id}`} className="inline-flex items-center gap-1.5 shrink-0">
              <span className="text-[10px]">{TYPE_ICONS[tick.type] ?? '📰'}</span>
              <span
                className="text-[10px] font-bold"
                style={{ color: TYPE_COLORS[tick.type] ?? '#94a3b8' }}
              >
                {tick.headline}
              </span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
