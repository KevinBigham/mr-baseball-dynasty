/**
 * briefing.ts — Types for the Front Office Briefing cadence system.
 * Prop-driven types consumed by home/briefing components.
 * Never mutates game state directly.
 */

// ─── Top-line Dials ──────────────────────────────────────────────────────────

export interface BriefingDial {
  id: string;
  label: string;
  value: number;        // 0–100
  status: string;       // e.g. "PLEASED", "HOT SEAT"
  color: string;        // hex color for status
  desc: string;         // one-liner explanation
}

// ─── Story Threads ───────────────────────────────────────────────────────────

export type StoryThreadType = 'urgent' | 'mystery' | 'long_arc';

export interface StoryThread {
  type: StoryThreadType;
  title: string;
  body: string;
  icon: string;
  color: string;
  actionLabel?: string;
  actionTab?: string;    // NavTab destination
}

// ─── Action Queue ────────────────────────────────────────────────────────────

export type ActionPriority = 'critical' | 'high' | 'medium' | 'low';

export type ActionCategory =
  | 'roster_illegality'
  | 'il_rehab'
  | 'prospect_pressure'
  | 'trade_market'
  | 'owner_warning'
  | 'contract_arb'
  | 'deadline'
  | 'general';

export interface ActionQueueTask {
  id: string;
  category: ActionCategory;
  priority: ActionPriority;
  title: string;
  subtitle: string;
  icon: string;
  actionLabel: string;
  actionTab?: string;
  deadline?: string;     // e.g. "Before next sim", "Jul 31"
}

// ─── Digest ──────────────────────────────────────────────────────────────────

export interface DigestEntry {
  icon: string;
  label: string;
  detail: string;
  color?: string;
}

export interface DigestBlock {
  section: string;
  entries: DigestEntry[];
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export interface CoachStep {
  id: string;
  title: string;
  body: string;
  actionLabel: string;
  actionTab?: string;
  completed: boolean;
}
