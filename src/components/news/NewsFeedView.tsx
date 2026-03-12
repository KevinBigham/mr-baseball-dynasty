/**
 * NewsFeedView — Full news feed, accessible from Home.
 * Shows all news items from the league store.
 */

import { useLeagueStore } from '../../store/leagueStore';

export default function NewsFeedView() {
  const { newsItems } = useLeagueStore();
  const items = newsItems ?? [];

  return (
    <div className="p-4">
      <div className="bloomberg-border" style={{ backgroundColor: '#0F1930' }}>
        <div className="bloomberg-header">NEWS FEED</div>
        {items.length === 0 ? (
          <div className="p-8 text-center" style={{ color: '#64748B' }}>
            <div className="text-2xl mb-2">📰</div>
            <div className="text-xs">No news yet. Start simming to generate headlines.</div>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1E2A4A30' }}>
            {items.map((item: any, i: number) => (
              <div key={item.id ?? i} className="px-4 py-3 flex items-start gap-3">
                <span className="text-sm shrink-0 mt-0.5">
                  {item.category === 'trade' ? '↔️' : item.category === 'injury' ? '🚑' : item.category === 'award' ? '🏆' : item.category === 'record' ? '📈' : item.category === 'milestone' ? '🏅' : '📰'}
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-bold" style={{ color: '#E2E8F0' }}>{item.headline}</div>
                  {item.body && <div className="text-[10px] mt-0.5" style={{ color: '#A7B3C7' }}>{item.body}</div>}
                  {item.date && <div className="text-[9px] mt-1" style={{ color: '#64748B' }}>{item.date}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
