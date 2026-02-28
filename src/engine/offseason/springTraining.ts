/**
 * Spring Training System — Mr. Baseball Dynasty
 *
 * Adapted from Mr. Football Dynasty's training-camp system.
 * Players gain or regress during spring training based on:
 *   - Work ethic
 *   - Coach development rating
 *   - Position match with chosen focus area
 *   - Age (young players benefit more from development focus)
 *
 * Five focus areas: Hitting, Pitching, Conditioning, Development, Chemistry
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SpringFocus = 'hitting' | 'pitching' | 'conditioning' | 'development' | 'chemistry';

export interface SpringTrainingResult {
  name:        string;
  position:    string;
  playerId:    number;
  change:      number;    // OVR change (-2 to +3)
  type:        'star' | 'improved' | 'neutral' | 'decline';
  detail:      string;
}

export interface SpringTrainingSummary {
  focus:        SpringFocus;
  improved:     number;
  declined:     number;
  unchanged:    number;
  bestGain:     SpringTrainingResult | null;
  worstLoss:    SpringTrainingResult | null;
  results:      SpringTrainingResult[];
}

export interface SpringTrainingRoster {
  playerId:     number;
  name:         string;
  position:     string;
  isPitcher:    boolean;
  age:          number;
  overall:      number;
  workEthic:    number;   // 1-10
}

// ─── Focus descriptions ───────────────────────────────────────────────────────

export const FOCUS_INFO: Record<SpringFocus, { label: string; icon: string; desc: string }> = {
  hitting:      { label: 'Hitting Focus', icon: '🏏', desc: 'Extra BP — hitters gain contact/power development boost' },
  pitching:     { label: 'Pitching Focus', icon: '⚾', desc: 'Bullpen sessions — pitchers develop command and stuff' },
  conditioning: { label: 'Conditioning', icon: '💪', desc: 'Full squad conditioning — boost morale and durability' },
  development:  { label: 'Player Development', icon: '🌱', desc: 'Individual development plans — young players benefit most' },
  chemistry:    { label: 'Team Chemistry', icon: '🤝', desc: 'Team-building activities — improve clubhouse chemistry' },
};

// ─── Run Spring Training ──────────────────────────────────────────────────────

export function runSpringTraining(
  roster: SpringTrainingRoster[],
  focus: SpringFocus,
  coachDevRating: number, // 30-80
  rand: () => number,
): SpringTrainingSummary {
  const results: SpringTrainingResult[] = [];

  for (const p of roster) {
    const workEthic = p.workEthic || 5;

    // Base gain from work ethic and coaching
    let baseGain = Math.round(
      (workEthic - 5) * 0.3 +
      (coachDevRating - 50) * 0.02 +
      (rand() * 2 - 0.5)
    );

    // Position match bonus
    const isHitter = !p.isPitcher;
    const posMatch =
      (focus === 'hitting' && isHitter) ||
      (focus === 'pitching' && p.isPitcher);
    if (posMatch) baseGain += 1;

    // Development focus: young players get extra boost
    if (focus === 'development' && p.age <= 25) baseGain += 1;

    // Conditioning: morale boost, no OVR change
    if (focus === 'conditioning') baseGain = 0;

    // Chemistry: team bonding, no OVR change
    if (focus === 'chemistry') baseGain = 0;

    // Low work ethic risk
    if (workEthic <= 3 && rand() < 0.3) {
      baseGain = Math.min(baseGain, -1);
    }

    // Clamp gains
    baseGain = Math.max(-2, Math.min(3, baseGain));

    // Categorize result
    let type: SpringTrainingResult['type'];
    let detail: string;
    if (baseGain >= 2) {
      type = 'star';
      detail = `Standout spring — ${p.name} is looking sharp (+${baseGain} OVR)`;
    } else if (baseGain > 0) {
      type = 'improved';
      detail = `Good camp for ${p.name} (+${baseGain} OVR)`;
    } else if (baseGain < 0) {
      type = 'decline';
      detail = `Rough spring for ${p.name} (${baseGain} OVR)`;
    } else {
      type = 'neutral';
      if (focus === 'conditioning') detail = `${p.name} is in peak shape — conditioning paid off`;
      else if (focus === 'chemistry') detail = `${p.name} bonded with teammates — chemistry boosted`;
      else detail = `Solid spring for ${p.name} — status quo`;
    }

    if (baseGain !== 0 || focus === 'conditioning' || focus === 'chemistry') {
      results.push({
        name: p.name,
        position: p.position,
        playerId: p.playerId,
        change: baseGain,
        type,
        detail,
      });
    }
  }

  // Sort: stars first, then improved, neutral, decline
  const order = { star: 0, improved: 1, neutral: 2, decline: 3 };
  results.sort((a, b) => order[a.type] - order[b.type]);

  const improved = results.filter(r => r.change > 0).length;
  const declined = results.filter(r => r.change < 0).length;
  const unchanged = results.filter(r => r.change === 0).length;

  return {
    focus,
    improved,
    declined,
    unchanged,
    bestGain: results.find(r => r.type === 'star') ?? null,
    worstLoss: results.find(r => r.type === 'decline') ?? null,
    results,
  };
}
