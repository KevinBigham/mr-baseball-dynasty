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
export function shouldAutoStartTutorial(difficulty: string, seasonsManaged: number): boolean {
  if (seasonsManaged > 0) return false; // Only show for first season
  return difficulty === 'rookie';
}
