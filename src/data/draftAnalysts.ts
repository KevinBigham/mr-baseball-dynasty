/**
 * Draft Analyst Commentary System
 * 4 personas with distinct voices react to each draft pick.
 * Ported from MFD's DRAFT_ANALYST_993 concept.
 */

export interface DraftAnalyst {
  id: string;
  name: string;
  title: string;
  style: string;
  emoji: string;
  reactions: {
    steal: string[];
    value: string[];
    reach: string[];
    bust: string[];
    solid: string[];
  };
}

export const ANALYSTS: DraftAnalyst[] = [
  {
    id: 'scout',
    name: 'Buck Harmon',
    title: 'Senior Scout',
    style: 'Old-school evaluator, trusts his eyes over numbers',
    emoji: '🔍',
    reactions: {
      steal: [
        "I've been pounding the table for {name} since the Cape Cod League. Absolute steal at #{pick}.",
        "That's a five-tool talent falling right into their lap. {name} was my top sleeper.",
        "I saw {name} hit three opposite-field doubles in Instructional League. This kid's the real deal.",
        "My scouts had {name} two rounds higher. Somebody in that front office is grinning ear to ear.",
        "You can't teach the kind of bat speed {name} has. Gift pick at #{pick}.",
      ],
      value: [
        "{name} is a solid pick right where he should go. No complaints from me.",
        "Good, honest baseball player. {name} will contribute sooner than people think.",
        "Right pick, right spot. {name} fits the mold of what they need.",
        "Clean swing, solid glove. {name} at #{pick} is textbook drafting.",
      ],
      reach: [
        "I like {name}, but not here. That's a round 3 talent going in round {round}.",
        "Whoa. My board had {name} way lower. Somebody's betting on the ceiling hard.",
        "That's a reach. {name} has tools but the hit tool isn't there yet.",
        "I'd have waited. {name} would've been available later. Aggressive pick.",
      ],
      bust: [
        "I don't see it. {name} struggles with anything above 92 mph. Risky bet.",
        "Yikes. {name} in the top rounds? My scouting report says otherwise.",
        "The swing mechanics worry me. {name} has a long way to go.",
      ],
      solid: [
        "{name} is exactly what you'd expect at #{pick}. Fair pick.",
        "No fireworks, but {name} is a safe, dependable selection.",
        "Solid floor with {name}. Won't wow you, won't embarrass you.",
      ],
    },
  },
  {
    id: 'stats',
    name: 'Maya Chen',
    title: 'Analytics Director',
    style: 'Numbers-driven, loves projections and WAR models',
    emoji: '📊',
    reactions: {
      steal: [
        "Our model had {name} projected as a top-{expected} pick. Getting them at #{pick} is a +{surplus} surplus value play.",
        "{name}'s percentile exit velo and chase rate put them in elite company. Outstanding value.",
        "The data is screaming here. {name} at #{pick} is the highest-value pick so far in this draft.",
        "By every metric we track, {name} is a discount at #{pick}. Smart front office.",
        "Statistical comps put {name} alongside some serious names. This is model-approved.",
      ],
      value: [
        "{name} slots in right at our projected range. Fair value, good process.",
        "Expected outcome. {name} profiles as a league-average contributor quickly, which has value.",
        "The numbers support this pick. {name}'s zone contact rate is above the 75th percentile.",
        "Solid underlying metrics for {name}. No complaints from the analytics desk.",
      ],
      reach: [
        "Our model had {name} ranked {surplus} spots lower. That's concerning surplus value loss.",
        "The peripherals don't support {name} at #{pick}. BABIP-dependent profile.",
        "I need to see a bigger sample. {name}'s minor league numbers are small-sample noise.",
        "Hard to justify {name} here when the expected value was much lower.",
      ],
      bust: [
        "{name}'s strikeout rate in college was in the bottom quartile. The data doesn't lie.",
        "Red flag: {name}'s exit velocity is below the 30th percentile. In round {round}? Yikes.",
        "The model gives {name} a sub-1.0 projected WAR. That's a tough sell.",
      ],
      solid: [
        "Neutral EV pick. {name} at #{pick} is right at our expected value line.",
        "Market-rate selection. {name} is league average in projected surplus.",
        "The model says this is fine. Not thrilling, not alarming. {name} is replacement-plus.",
      ],
    },
  },
  {
    id: 'hottake',
    name: 'Vinny Russo',
    title: 'Radio Host',
    style: 'Loud, emotional, loves to stir the pot',
    emoji: '🎙️',
    reactions: {
      steal: [
        "ABSOLUTE ROBBERY! {name} at #{pick}?! Are the other teams sleeping?!",
        "I'm calling it now — {name} is going to be a STAR. This draft just got interesting!",
        "STEAL OF THE DRAFT! Write it down, screenshot it, {name} is going to make teams regret passing!",
        "Are you KIDDING me?! {name} falls to #{pick}?! Christmas came early!",
        "The rest of the league just got fleeced. {name} is a game-changer!",
      ],
      value: [
        "Yeah, {name} at #{pick}, that's fine. Nothing to get worked up about.",
        "Safe pick. Boring pick. But you know what? Boring wins championships. {name} is fine.",
        "{name}'s a good player. Not gonna blow anyone away, but they'll be solid.",
      ],
      reach: [
        "WHAT?! {name} at #{pick}?! I could've drafted better with my EYES CLOSED!",
        "I'm sorry but that's a TERRIBLE pick. {name} in round {round}? The fans won't like this one.",
        "This is the kind of pick that gets GMs fired! {name} would've been there in round {nextRound}!",
        "Oh no. Oh NO. {name} at #{pick} is going to haunt this franchise.",
      ],
      bust: [
        "DISASTER pick. {name} can't hit, can't field, can't run. What are we doing here?!",
        "I've seen high school kids with better swings than {name}. This is a BUST waiting to happen!",
        "Mark my words — {name} will be out of baseball in 3 years. BUST ALERT!",
      ],
      solid: [
        "Meh. {name} at #{pick}. It's fine. Not exciting, but it's fine. Moving on.",
        "I don't hate it, I don't love it. {name} is... fine.",
        "{name}. Okay. Sure. Next pick please.",
      ],
    },
  },
  {
    id: 'frontoffice',
    name: 'Rachel Torres',
    title: 'Former Assistant GM',
    style: 'Organizational fit, development pipeline focus',
    emoji: '🏢',
    reactions: {
      steal: [
        "{name} fills a massive organizational need and they got him at a discount. Smart drafting.",
        "This is how you build a pipeline. {name} at #{pick} gives them depth where they need it most.",
        "If I'm in that front office, I'm thrilled. {name} was undervalued by the market.",
        "Great organizational pick. {name} has the makeup and the talent to move fast.",
        "{name} addresses their biggest system weakness at a premium value. A+ process.",
      ],
      value: [
        "{name} makes sense for this organization. They needed {pos} depth, and this delivers.",
        "Process-driven pick. {name} fits their development philosophy at the right price.",
        "This is what good front offices do — take the best player available that also fills a need. {name} checks both boxes.",
        "Solid organizational fit. {name} slots into their system nicely.",
      ],
      reach: [
        "I understand the need for {pos}, but {name} at #{pick} feels like a panic pick.",
        "You can't draft for need this aggressively. {name} was available later; they left value on the board.",
        "I've seen front offices get fired for reach picks like this. {name} is a project, not a #{pick} pick.",
        "The development timeline on {name} doesn't match the window. Questionable fit.",
      ],
      bust: [
        "Major red flag. {name}'s makeup concerns were well-documented. Risky investment.",
        "This could set the organization back years. {name} at #{pick} ignores better options on the board.",
        "I wouldn't have touched {name} before round {nextRound}. The org just overpaid for a lottery ticket.",
      ],
      solid: [
        "{name} is a safe organizational pick. Won't move the needle, but won't set you back either.",
        "Depth pick. {name} provides system value even if they don't become a star.",
        "Every organization needs players like {name}. Solid citizen, solid player.",
      ],
    },
  },
];

export type ReactionType = 'steal' | 'value' | 'reach' | 'bust' | 'solid';

/**
 * Classify a pick as steal/value/reach/bust based on scoutedOvr and pick position
 */
export function classifyPick(
  scoutedOvr: number,
  pickNumber: number,
  _round: number,
  totalPicks: number,
): ReactionType {
  // Expected pick position based on OVR rank
  // Higher OVR → should go earlier
  // Scale: OVR 80 = pick 1, OVR 20 = last pick
  const expectedPick = Math.max(1, Math.round(totalPicks * (1 - (scoutedOvr - 20) / 60)));
  const surplus = expectedPick - pickNumber; // positive = got earlier than expected = steal

  if (surplus >= 15) return 'steal';
  if (surplus >= 5) return 'value';
  if (surplus <= -15) return 'bust';
  if (surplus <= -8) return 'reach';
  return 'solid';
}

/**
 * Get a formatted reaction from a random analyst
 */
export function getAnalystReaction(
  pickNumber: number,
  round: number,
  playerName: string,
  position: string,
  scoutedOvr: number,
  totalPicks: number,
): { analyst: DraftAnalyst; reaction: string; type: ReactionType } {
  const type = classifyPick(scoutedOvr, pickNumber, round, totalPicks);

  // Pick a random analyst
  const analyst = ANALYSTS[pickNumber % ANALYSTS.length];
  const pool = analyst.reactions[type];
  const template = pool[pickNumber % pool.length];

  // Expected pick for interpolation
  const expectedPick = Math.max(1, Math.round(totalPicks * (1 - (scoutedOvr - 20) / 60)));
  const surplus = Math.abs(expectedPick - pickNumber);

  const reaction = template
    .replace(/\{name\}/g, playerName)
    .replace(/\{pick\}/g, String(pickNumber))
    .replace(/\{round\}/g, String(round))
    .replace(/\{pos\}/g, position)
    .replace(/\{expected\}/g, String(expectedPick))
    .replace(/\{surplus\}/g, String(surplus))
    .replace(/\{nextRound\}/g, String(round + 1));

  return { analyst, reaction, type };
}
