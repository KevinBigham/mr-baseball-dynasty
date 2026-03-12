/**
 * CoreEmptyState.tsx — Reusable empty-state component for core tabs.
 * Every empty state answers: what this area is for, why it matters, and what to do now.
 */

import type { NavTab } from '../../store/uiStore';

interface Props {
  icon: string;
  title: string;
  purpose: string;
  whyItMatters: string;
  actionLabel?: string;
  actionTab?: NavTab;
  onAction?: () => void;
}

export default function CoreEmptyState({
  icon,
  title,
  purpose,
  whyItMatters,
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="bloomberg-border bg-gray-900 p-6 max-w-lg mx-auto text-center">
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-orange-400 font-bold text-xs tracking-widest uppercase mb-2">
        {title}
      </div>
      <div className="text-gray-300 text-xs leading-relaxed mb-2">
        {purpose}
      </div>
      <div className="text-gray-500 text-[10px] leading-relaxed mb-4">
        {whyItMatters}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bloomberg-btn text-[10px]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ─── Preset empty states for common tabs ─────────────────────────────────────

export function RosterEmptyState({ onAction }: { onAction?: () => void }) {
  return (
    <CoreEmptyState
      icon="👥"
      title="ROSTER"
      purpose="Your 26-man roster, injured list, and minor league depth. Every player under your control."
      whyItMatters="The roster is the product. Every win and loss comes from the players on this page. Build it right."
      actionLabel="START A SEASON"
      onAction={onAction}
    />
  );
}

export function StandingsEmptyState() {
  return (
    <CoreEmptyState
      icon="📊"
      title="STANDINGS"
      purpose="League-wide standings, division races, and wild card positioning."
      whyItMatters="Context for every decision you make. Are you buying or selling? Standings tell you."
    />
  );
}

export function FinanceEmptyState() {
  return (
    <CoreEmptyState
      icon="💰"
      title="FINANCES"
      purpose="Payroll commitments, luxury tax status, and budget projections."
      whyItMatters="Money constrains ambition. Know your payroll before making any roster move."
    />
  );
}

export function HistoryEmptyState() {
  return (
    <CoreEmptyState
      icon="📜"
      title="FRANCHISE HISTORY"
      purpose="Season-by-season results, playoff runs, and franchise milestones."
      whyItMatters="Every decision leaves a mark. History reveals the arc of your dynasty."
    />
  );
}

export function LeaderboardEmptyState() {
  return (
    <CoreEmptyState
      icon="⚡"
      title="LEADERBOARDS"
      purpose="League-wide statistical leaders across batting, pitching, and fielding."
      whyItMatters="Know who the best players in the league are. Trade targets, award candidates, and rivals."
    />
  );
}
