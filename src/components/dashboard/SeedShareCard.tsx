/**
 * SeedShareCard.tsx — Seed sharing for async multiplayer.
 * Same seed = same universe. Challenge friends to beat your record.
 */

import { useState, useCallback } from 'react';

interface Props {
  seed: number;
  season: number;
  wins: number;
  losses: number;
  teamName: string;
}

export default function SeedShareCard({ seed, season, wins, losses, teamName }: Props) {
  const [copied, setCopied] = useState(false);

  const shareText = `MBD Challenge: Can you beat ${wins}-${losses} with ${teamName}? Seed: ${seed} | Season ${season}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareText;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText]);

  return (
    <div className="bloomberg-border bg-[#0F1930]">
      <div className="bloomberg-header px-4 flex items-center justify-between">
        <span>CHALLENGE A FRIEND</span>
        <span className="text-gray-500 font-normal text-[10px]">Same Seed = Same Universe</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <div className="text-center">
          <div className="text-[9px] text-gray-500 tracking-widest mb-1">YOUR SEED</div>
          <div className="text-2xl font-black text-orange-400 tabular-nums tracking-wider">
            {seed}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {teamName} · {wins}-{losses} · Season {season}
          </div>
        </div>
        <div className="text-center">
          <button
            onClick={handleCopy}
            className={`text-xs px-4 py-2 font-bold uppercase tracking-widest transition-all rounded ${
              copied
                ? 'bg-green-700 text-green-200'
                : 'bg-orange-600 hover:bg-orange-500 text-black'
            }`}
          >
            {copied ? 'COPIED!' : 'COPY CHALLENGE'}
          </button>
        </div>
        <div className="text-[8px] text-gray-500 text-center">
          Friends enter this seed → get the same league, same draft class, same events
        </div>
      </div>
    </div>
  );
}
