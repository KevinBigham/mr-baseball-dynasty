import type {
  FORoleDefinition, FOTraitDefinition, FOStaffMember,
  FORoleId, FOTraitId, StartModeOption,
} from '../types/frontOffice';
import type { RandomGenerator } from 'pure-rand';

// ─── Role definitions ──────────────────────────────────────────────────────────

export const FO_ROLES: FORoleDefinition[] = [
  {
    id:          'gm',
    icon:        '👔',
    title:       'General Manager',
    desc:        'Runs trade negotiations, free agency bidding, and contract extensions. The higher the OVR, the better the deals you get.',
    affects:     ['trades', 'freeAgency', 'contracts', 'waivers'],
    salaryRange: [3, 12],
    tier:        'core',
    color:       '#a78bfa',
  },
  {
    id:          'scout_dir',
    icon:        '🔍',
    title:       'Scouting Director',
    desc:        'Sharpens your draft intel — tighter prospect OVR estimates, fewer busts, better pre-draft rankings.',
    affects:     ['drafting', 'prospectEval', 'evaluation'],
    salaryRange: [1.5, 6],
    tier:        'core',
    color:       '#22d3ee',
  },
  {
    id:          'analytics',
    icon:        '📊',
    title:       'Analytics Director',
    desc:        'Turns Statcast data into actionable edges. Improves player projections, platoon splits accuracy, and lineup optimization.',
    affects:     ['evaluation', 'gameplan', 'prospectEval'],
    salaryRange: [1, 4],
    tier:        'core',
    color:       '#4ade80',
  },
  {
    id:          'manager',
    icon:        '⚾',
    title:       'Field Manager',
    desc:        'Runs the dugout. Better managers excel at bullpen sequencing, lineup construction, and keeping the clubhouse focused.',
    affects:     ['gameplan', 'bullpenMgmt', 'lineup', 'chemistry'],
    salaryRange: [2, 8],
    tier:        'specialist',
    color:       '#fbbf24',
  },
  {
    id:          'pitching_coach',
    icon:        '🎯',
    title:       'Pitching Coach',
    desc:        'Unlocks hidden pitcher potential. Young arms develop faster. Veterans extend their peak years.',
    affects:     ['pitcherDev', 'bullpenMgmt', 'injuries'],
    salaryRange: [0.5, 3],
    tier:        'specialist',
    color:       '#f97316',
  },
  {
    id:          'hitting_coach',
    icon:        '🏏',
    title:       'Hitting Coach',
    desc:        'Refines approach and mechanics. Hitters see more walks, make better contact, and max their power production.',
    affects:     ['hitterDev', 'lineup', 'evaluation'],
    salaryRange: [0.5, 3],
    tier:        'specialist',
    color:       '#ec4899',
  },
  {
    id:          'trainer',
    icon:        '🏥',
    title:       'Medical Director',
    desc:        'Reduces injury frequency and cuts recovery time. Veterans stay on the field longer.',
    affects:     ['injuries', 'recovery', 'durability'],
    salaryRange: [0.8, 3],
    tier:        'specialist',
    color:       '#6ee7b7',
  },
  {
    id:          'intl_scout',
    icon:        '🌎',
    title:       'International Scouting Dir.',
    desc:        'Finds gems in the international market. Better intel on INTL signings — narrower OVR error bands, cheaper deals.',
    affects:     ['intlSigning', 'prospectEval', 'drafting'],
    salaryRange: [1, 4],
    tier:        'specialist',
    color:       '#818cf8',
  },
];

// ─── Trait definitions ─────────────────────────────────────────────────────────

export const FO_TRAITS: Record<FOTraitId, FOTraitDefinition> = {
  analytical:        { id: 'analytical',        icon: '📈', label: 'Analytical',        desc: 'Data-first decisions — finds edges AI GMs miss' },
  old_school:        { id: 'old_school',         icon: '📼', label: 'Old School',         desc: 'Trusts the eye test — great at reading makeup and character' },
  moneyball:         { id: 'moneyball',          icon: '💰', label: 'Moneyball',          desc: 'Finds undervalued talent — squeezes premium value from limited budget' },
  developer:         { id: 'developer',          icon: '🌱', label: 'Developer',          desc: 'Player development whisperer — prospects bloom faster under this hire' },
  negotiator:        { id: 'negotiator',         icon: '📝', label: 'Negotiator',         desc: 'Gets deals done — squeezes value in every contract and extension' },
  talent_scout:      { id: 'talent_scout',       icon: '🔭', label: 'Talent Scout',       desc: 'Eye for raw tools — spots diamonds in the rough at every level' },
  analytics_guru:    { id: 'analytics_guru',     icon: '🔢', label: 'Analytics Guru',     desc: 'Sabermetrics master — WAR projections and lineup optimization' },
  clubhouse_guy:     { id: 'clubhouse_guy',      icon: '🤝', label: 'Clubhouse Guy',      desc: 'Players love this person — boosts team chemistry and retention' },
  grinder:           { id: 'grinder',            icon: '⚙️', label: 'Grinder',            desc: 'Outworks everyone — thorough prep and relentless attention to detail' },
  visionary:         { id: 'visionary',          icon: '🏛️', label: 'Visionary',          desc: 'Builds dynasties — long-term farm system architecture' },
  tactician:         { id: 'tactician',          icon: '🧠', label: 'Tactician',          desc: 'In-game genius — bullpen sequencing and matchup exploitation' },
  medic:             { id: 'medic',              icon: '💊', label: 'Medic',              desc: 'Injury prevention specialist — keeps veterans on the field' },
  recruiter:         { id: 'recruiter',          icon: '🌐', label: 'Recruiter',          desc: 'International scouting ace — finds global talent before rivals do' },
  competitor:        { id: 'competitor',         icon: '🔥', label: 'Competitor',         desc: 'Win-now mentality — maximizes the current competitive window' },
  pitcher_whisperer: { id: 'pitcher_whisperer',  icon: '🎯', label: 'Pitcher Whisperer',  desc: 'Arms thrive under this coach — command and stuff both improve' },
};

// ─── Name pools for staff generation ─────────────────────────────────────────

const STAFF_FIRST_NAMES = [
  'Bill','Bobby','Buck','Carl','Casey','Charlie','Chris','Dave','Don','Doug',
  'Ed','Frank','Gary','George','Greg','Jack','Jake','James','Jeff','Jim',
  'Joe','John','Kevin','Larry','Lou','Mark','Mike','Pat','Paul','Pete',
  'Phil','Rich','Rick','Rob','Rod','Ron','Russ','Ryan','Sam','Scott',
  'Stan','Steve','Terry','Tim','Todd','Tom','Vince','Wally','Will','Zack',
];

const STAFF_LAST_NAMES = [
  'Adams','Anderson','Baker','Bell','Brown','Carter','Clark','Cole','Collins','Cook',
  'Cooper','Cox','Davis','Duncan','Ellis','Evans','Fisher','Foster','Fox','Garcia',
  'Graham','Grant','Gray','Green','Hall','Harris','Hayes','Hill','Howard','Hughes',
  'Jackson','Johnson','Jones','Kelly','King','Lee','Lewis','Long','Martin','Martinez',
  'Miller','Mitchell','Moore','Morgan','Morris','Murphy','Nelson','Parker','Perry','Peters',
  'Phillips','Porter','Price','Reed','Rivera','Roberts','Robinson','Rogers','Ross','Russell',
  'Scott','Smith','Stewart','Sullivan','Taylor','Thomas','Thompson','Turner','Walker','Ward',
  'Watson','White','Williams','Wilson','Wood','Wright','Young','Torres','Ramirez','Lopez',
];

// Backstory templates per role
const BACKSTORIES: Record<FORoleId, string[]> = {
  gm: [
    'Spent 12 years as a player agent before moving to the front office.',
    'Former assistant GM who built two playoff rosters before striking out on his own.',
    'Harvard Law grad who took a detour into baseball and never looked back.',
    'Rose from intern to front office over 15 years with one organization.',
    'Player turned executive — played 8 seasons in the majors at SS.',
  ],
  scout_dir: [
    'Has scouted 14 countries and seen three of his picks become All-Stars.',
    'Spent 20 seasons as a cross-checker before landing this director role.',
    'Former college coach who developed an eye for projectable tools.',
    'Known for finding elite arms in the Dominican Republic and Venezuela.',
    'Built two top-5 farm systems using a data-blended scouting approach.',
  ],
  analytics: [
    'PhD in statistics from MIT. Built Statcast models before Statcast existed.',
    'Former engineer at a tech company who fell in love with baseball data.',
    'Designed projection systems used by four other teams before going in-house.',
    'Specializes in pitch design and spin efficiency analysis.',
    'Young gun who built a Elo-style team rating system as a college thesis.',
  ],
  manager: [
    'Managed in the minors for 10 years before getting his first MLB shot.',
    'Former MLB catcher who called games at an elite level.',
    'Known for creative lineup construction and aggressive baserunning.',
    'Calm under pressure — teams he manages rarely fall apart in September.',
    'Veteran skipper who has led three different franchises to the playoffs.',
  ],
  pitching_coach: [
    'Former big-league starter who threw 12 seasons before moving to coaching.',
    'Specializes in spin efficiency and grip adjustments for breaking balls.',
    'Built an approach around pitch tunneling and deception.',
    'Worked with pitchers from 16 countries in his international development career.',
    'Known for rebuilding careers — has brought three arms back from the brink.',
  ],
  hitting_coach: [
    'Spent 10 seasons hitting .280+ in the majors before retiring.',
    'Revolutionized launch angle work before it became mainstream.',
    'Former gold glove outfielder who now focuses entirely on approach and plate discipline.',
    'Developed two batting champions using video-based mechanical feedback.',
    'Believes in a patient approach — every hitter he coaches sees walk rate improve.',
  ],
  trainer: [
    '20 years of experience reducing soft tissue injuries in contact sports.',
    'Worked with the US Olympic team before moving to pro baseball.',
    'Built a load management system adopted by several MLB clubs.',
    'Former physical therapist who specializes in pitching arm health.',
    'Known for his unconventional recovery protocols that keep veterans healthy.',
  ],
  intl_scout: [
    'Has signed 11 players who went on to MLB careers from the Dominican Republic.',
    'Fluent in Spanish, Portuguese, and Japanese — has scouted on six continents.',
    'Former INTL signing himself — brings firsthand experience to evaluation.',
    'Built relationships with buscones across the Caribbean over 15 years.',
    'Was first to find several top international prospects before they were known.',
  ],
};

// ─── Staff generation ──────────────────────────────────────────────────────────

// Deterministic helpers that use the seeded PRNG when provided, Math.random as fallback
function _nextFloat(gen?: RandomGenerator): [number, RandomGenerator | undefined] {
  if (gen) {
    const [raw, next] = gen.next();
    return [((Number(raw) >>> 0) / 0xffffffff), next];
  }
  return [Math.random(), undefined];
}

function generateId(gen?: RandomGenerator): [string, RandomGenerator | undefined] {
  let f: number;
  let next: RandomGenerator | undefined;
  [f, next] = _nextFloat(gen);
  return [f.toString(36).slice(2, 10) || '00000000', next];
}

function pickRandom<T>(arr: T[], gen?: RandomGenerator): [T, RandomGenerator | undefined] {
  let f: number;
  let next: RandomGenerator | undefined;
  [f, next] = _nextFloat(gen);
  return [arr[Math.floor(f * arr.length)], next];
}

function generateStaffOVR(salaryRange: [number, number], targetSalary: number, gen?: RandomGenerator): [number, RandomGenerator | undefined] {
  const [min, max] = salaryRange;
  const range = max - min;
  const salaryCentered = (targetSalary - min) / range;
  const ovr = Math.round(40 + salaryCentered * 55);
  let f: number;
  let next: RandomGenerator | undefined;
  [f, next] = _nextFloat(gen);
  return [Math.max(40, Math.min(95, ovr + Math.round((f - 0.5) * 10))), next];
}

function generateSalary(salaryRange: [number, number], gen?: RandomGenerator): [number, RandomGenerator | undefined] {
  const [min, max] = salaryRange;
  let f: number;
  let next: RandomGenerator | undefined;
  [f, next] = _nextFloat(gen);
  const raw = min + f * (max - min);
  return [Math.round(raw * 10) / 10, next];
}

/** Generate N candidate staff members for a given role.
 *  Pass an optional seeded PRNG for deterministic output. */
export function generateFOCandidates(roleId: FORoleId, count = 4, gen?: RandomGenerator): FOStaffMember[] {
  const role = FO_ROLES.find(r => r.id === roleId);
  if (!role) return [];

  const traitIds = Object.keys(FO_TRAITS) as FOTraitId[];
  const candidates: FOStaffMember[] = [];

  // Generate salaries
  const salaries: number[] = [];
  for (let j = 0; j < count; j++) {
    let s: number;
    [s, gen] = generateSalary(role.salaryRange, gen);
    salaries.push(s);
  }
  salaries.sort((a, b) => b - a);

  for (let i = 0; i < count; i++) {
    const salary = salaries[i];
    let ovr: number;
    [ovr, gen] = generateStaffOVR(role.salaryRange, salary, gen);
    let traitId: FOTraitId;
    [traitId, gen] = pickRandom(traitIds, gen);
    let backstory: string;
    [backstory, gen] = pickRandom(BACKSTORIES[roleId], gen);
    let firstName: string;
    [firstName, gen] = pickRandom(STAFF_FIRST_NAMES, gen);
    let lastName: string;
    [lastName, gen] = pickRandom(STAFF_LAST_NAMES, gen);
    let id: string;
    [id, gen] = generateId(gen);
    let yearsFloat: number;
    [yearsFloat, gen] = _nextFloat(gen);
    const yearsLeft = Math.floor(yearsFloat * 4) + 1;

    candidates.push({
      id,
      roleId:    role.id,
      name:      `${firstName} ${lastName}`,
      ovr,
      salary,
      yearsLeft,
      traitId,
      backstory,
      icon:      role.icon,
      title:     role.title,
      color:     role.color,
      tier:      role.tier,
    });
  }

  return candidates;
}

// ─── Start-mode options ────────────────────────────────────────────────────────

export const START_MODES: StartModeOption[] = [
  {
    id:          'instant',
    icon:        '⚡',
    label:       'Instant Start',
    sub:         'Pre-Built Rosters — Jump to Opening Day',
    desc:        'All 30 teams arrive with fully constructed rosters. Stars, prospects, depth — ready to play. Skip the draft and get straight to managing your franchise.',
    time:        '⏱ Instant',
    diff:        '—',
    recommended: true,
    available:   true,
  },
  {
    id:          'snake10',
    icon:        '⭐',
    label:       'Franchise Cornerstones',
    sub:         'Snake Draft — 10 Picks + Auto Fill',
    desc:        'Hand-pick your franchise anchor — your ace, your cleanup hitter, your cornerstone SS. AI builds the supporting cast around your vision.',
    time:        '⏱ ~5 min',
    diff:        '⚾',
    recommended: false,
    available:   true,
  },
  {
    id:          'snake25',
    icon:        '🐍',
    label:       'Build the Lineup',
    sub:         'Snake Draft — 25 Picks + Auto Fill',
    desc:        'Pick your starting lineup and rotation. AI fills depth chart with smart picks. You set the identity of your team.',
    time:        '⏱ ~10 min',
    diff:        '⚾⚾',
    recommended: false,
    available:   true,
  },
  {
    id:          'auction',
    icon:        '💰',
    label:       'Auction Draft',
    sub:         '$200M Budget — Bid on Every Player',
    desc:        'Nominate players, bid against 29 ruthless AI GMs. Budget allocation is the game within the game.',
    time:        '⏱ ~20 min',
    diff:        '🧠🧠🧠',
    recommended: false,
    available:   false, // Phase 2
  },
  {
    id:          'snake26',
    icon:        '🐍',
    label:       'Full Roster Control',
    sub:         'Snake Draft — All 26 Active Roster Spots',
    desc:        'Draft every single player on your active roster. Total control. Every pick counts.',
    time:        '⏱ ~25 min',
    diff:        '⚾⚾⚾',
    recommended: false,
    available:   true,
  },
];

// ─── Budget by difficulty ──────────────────────────────────────────────────────
export const FO_BUDGET: Record<string, number> = {
  rookie: 30,  // $30M — generous
  normal: 15,  // $15M — balanced
  hard:   10,  // $10M — tight
};

// ─── Candidate count per role by difficulty ──────────────────────────────────
export const FO_CANDIDATES_PER_ROLE: Record<string, number> = {
  rookie: 8,   // More options to choose from
  normal: 6,   // Balanced selection
  hard:   6,   // Same as normal
};

// ─── Injury risk multiplier (based on coaching staff quality) ─────────────────
/**
 * Returns an injury risk multiplier based on a team's coaching staff quality.
 * Lower pitching/hitting coach quality → higher injury risk.
 */
export function getInjuryRiskMultiplier(coaching: { hittingCoachQuality: number; pitchingCoachQuality: number }): number {
  const avgQuality = (coaching.hittingCoachQuality + coaching.pitchingCoachQuality) / 2;
  // Quality ranges 0.3–0.7, map to multiplier 1.3–0.85
  return 1.3 - avgQuality * 0.65;
}
