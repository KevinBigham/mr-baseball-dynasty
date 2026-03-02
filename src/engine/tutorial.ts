// ─── Tutorial Step Definitions ───────────────────────────────────────────────

export interface TutorialStep {
  id: string;
  title: string;
  message: string;
  phase: 'draft' | 'preseason' | 'simulating' | 'postseason' | 'offseason' | 'any';
  highlight?: string; // CSS selector to highlight
  position: 'top' | 'bottom' | 'center';
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Mr. Baseball Dynasty',
    message: 'You are the General Manager of a professional baseball team. Build your roster, manage finances, and lead your franchise to a championship dynasty.',
    phase: 'any',
    position: 'center',
  },
  {
    id: 'draft_intro',
    title: 'The Draft',
    message: 'This is your draft board. Players are ranked by scouting grades (20-80 scale). Higher grades mean better players. Click a prospect to select them, then click DRAFT to add them to your team.',
    phase: 'draft',
    position: 'top',
  },
  {
    id: 'draft_scouting',
    title: 'Scouting Grades',
    message: 'OVR shows current ability and POT shows future potential. Your scouting staff quality affects how accurate these grades are — better scouts mean less noise in the evaluations.',
    phase: 'draft',
    position: 'top',
  },
  {
    id: 'preseason_roster',
    title: 'Roster Management',
    message: 'Your 26-man active roster is the core of your team. Use promotions and demotions to shuttle players between MLB and the minors. Players need option years to be sent down.',
    phase: 'preseason',
    position: 'top',
  },
  {
    id: 'season_sim',
    title: 'Season Simulation',
    message: 'Click "Simulate Season" to play through a full 162-game schedule. Your roster, coaching, and player development all affect the outcome.',
    phase: 'preseason',
    position: 'center',
  },
  {
    id: 'offseason_flow',
    title: 'The Offseason',
    message: 'After each season, you will go through: Arbitration (salary hearings) → Amateur Draft (new prospects) → Free Agency (sign veterans) → Trading (make deals). Each phase shapes your roster for next year.',
    phase: 'offseason',
    position: 'top',
  },
  {
    id: 'finances_cbt',
    title: 'Financial Management',
    message: 'Stay under the $237M luxury tax threshold to avoid penalties. Going over triggers escalating tax rates (20%, 42%, 50%) and can cost you draft pick positions.',
    phase: 'offseason',
    position: 'top',
  },
  {
    id: 'trading_tips',
    title: 'Trading',
    message: 'Use "Shop a Player" to see what teams will offer for your guys. "Find a Trade" lets you search for specific positions. AI teams make smart decisions based on whether they are contending or rebuilding.',
    phase: 'offseason',
    position: 'top',
  },
  {
    id: 'development',
    title: 'Player Development',
    message: 'Young players develop during the offseason. Coaching staff and work ethic affect growth rates. Keep an eye on your minor league pipeline — today\'s prospects are tomorrow\'s stars.',
    phase: 'postseason',
    position: 'center',
  },
  {
    id: 'depth_chart',
    title: 'Depth Chart & Lineup',
    message: 'Switch to the Depth Chart view on the Roster tab to see your team\'s position breakdown. Click EDIT to set your batting order (1-9) and starting rotation (SP1-SP5). Click two players to swap their positions.',
    phase: 'preseason',
    position: 'top',
  },
  {
    id: 'il_management',
    title: 'Injured List',
    message: 'Players can get hurt during the season. When a player is placed on the 10-day or 60-day IL, you\'ll need to promote a replacement from the minors. Monitor the IL tab on your Roster page to track recovery timelines.',
    phase: 'simulating',
    position: 'top',
  },
  {
    id: 'trade_deadline',
    title: 'Trade Deadline Strategy',
    message: 'The July 31 trade deadline is a key inflection point. Contending teams should acquire rentals for a playoff push. Rebuilding teams should sell expiring contracts for prospects. Check the standings to decide your strategy.',
    phase: 'simulating',
    position: 'center',
  },
  {
    id: 'arbitration_intro',
    title: 'Salary Arbitration',
    message: 'Players with 3-6 years of service time are eligible for arbitration. Their salary is determined by comparable players. You can offer extensions to lock up key players before they hit free agency — but watch your budget.',
    phase: 'offseason',
    position: 'top',
  },
  {
    id: 'waiver_wire',
    title: 'Waiver Wire',
    message: 'Teams can DFA (designate for assignment) players they no longer need. Check the waiver wire for bargain pickups — sometimes other teams release solid players who can fill a gap on your roster.',
    phase: 'offseason',
    position: 'top',
  },
  {
    id: 'rule5_draft',
    title: 'Rule 5 Draft',
    message: 'Players not on the 40-man roster after a certain number of minor league seasons are eligible for the Rule 5 draft. Protect your top prospects by adding them to the 40-man, or risk losing them to another team.',
    phase: 'offseason',
    position: 'top',
  },
  {
    id: 'owner_patience',
    title: 'Owner Expectations',
    message: 'Your owner has expectations for team performance. Consistent losing will erode their patience. If it drops too low, you\'ll be fired. Balance short-term competitiveness with long-term rebuilding — keep the owner happy while building for the future.',
    phase: 'any',
    position: 'center',
  },
];

// ─── Tutorial State Management ──────────────────────────────────────────────

/**
 * Get the next tutorial step that should be shown based on current phase.
 * Returns null if no more steps or tutorial is disabled.
 */
export function getNextTutorialStep(
  completedSteps: Set<string>,
  currentPhase: string,
): TutorialStep | null {
  for (const step of TUTORIAL_STEPS) {
    if (completedSteps.has(step.id)) continue;
    if (step.phase === 'any' || step.phase === currentPhase) {
      return step;
    }
  }
  return null;
}

/**
 * Check if the tutorial should auto-start based on difficulty.
 */
export function shouldAutoStartTutorial(_difficulty: string, seasonsManaged: number): boolean {
  if (seasonsManaged > 0) return false; // Only show for first season
  return true; // Show tutorial for all difficulties on first season
}
