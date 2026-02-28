/**
 * prospectReportCard.ts – Detailed Prospect Scouting Report Cards
 *
 * Full scouting reports for individual prospects with 20-80 scale tool grades,
 * written narrative summaries from assigned scouts, risk/reward assessments,
 * ETA projections, ceiling/floor WAR projections, and MLB player comparables.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high' | 'extreme';
export type RewardLevel = 'elite' | 'above_average' | 'average' | 'below_average';

export interface ToolGrade {
  tool: string;
  present: number;   // 20-80 scale
  future: number;    // 20-80 scale
  trending: 'up' | 'flat' | 'down';
  scoutNote: string; // brief note on the tool
}

export interface MLBComparable {
  name: string;
  similarity: number; // 0-100
  note: string;
}

export interface ProspectReportCard {
  id: string;
  name: string;
  position: string;
  team: string;
  age: number;
  bats: 'R' | 'L' | 'S';
  throws: 'R' | 'L';
  height: string;
  weight: number;
  level: string;
  draftInfo: string;
  signBonus: number;          // $M

  // Tool grades
  tools: ToolGrade[];
  overallFV: number;          // 20-80 future value

  // Scout narrative
  scoutName: string;
  scoutDate: string;
  narrative: string;          // multi-sentence written report

  // Risk / Reward
  risk: RiskLevel;
  reward: RewardLevel;
  riskFactors: string[];
  upside: string;

  // Projections
  eta: string;               // e.g. 'Mid 2026'
  ceilingWAR: number;        // best case seasonal WAR
  floorWAR: number;          // worst case seasonal WAR
  projectedRole: string;     // e.g. 'Everyday CF', 'Frontline SP'

  // Comparables
  comparables: MLBComparable[];

  // Season stats line
  seasonStats: string;
}

// ── Display Helpers ────────────────────────────────────────────────────────

export const RISK_DISPLAY: Record<RiskLevel, { label: string; color: string }> = {
  low:     { label: 'Low Risk',     color: '#22c55e' },
  medium:  { label: 'Medium Risk',  color: '#f59e0b' },
  high:    { label: 'High Risk',    color: '#f97316' },
  extreme: { label: 'Extreme Risk', color: '#ef4444' },
};

export const REWARD_DISPLAY: Record<RewardLevel, { label: string; color: string }> = {
  elite:         { label: 'Elite',         color: '#3b82f6' },
  above_average: { label: 'Above Avg',    color: '#22c55e' },
  average:       { label: 'Average',       color: '#f59e0b' },
  below_average: { label: 'Below Avg',    color: '#ef4444' },
};

export function gradeColor(grade: number): string {
  if (grade >= 70) return '#22c55e';
  if (grade >= 60) return '#4ade80';
  if (grade >= 50) return '#f59e0b';
  if (grade >= 40) return '#f97316';
  return '#ef4444';
}

export function gradeLabel(grade: number): string {
  if (grade >= 80) return 'Elite';
  if (grade >= 70) return 'Plus-Plus';
  if (grade >= 60) return 'Plus';
  if (grade >= 55) return 'Above Avg';
  if (grade >= 50) return 'Average';
  if (grade >= 45) return 'Fringe Avg';
  if (grade >= 40) return 'Below Avg';
  if (grade >= 30) return 'Well Below';
  return 'Poor';
}

// ── Summary ────────────────────────────────────────────────────────────────

export interface ReportCardSummary {
  totalReports: number;
  avgFV: number;
  highestCeiling: { name: string; war: number };
  safestFloor: { name: string; war: number };
  closestETA: string;
}

export function getReportCardSummary(cards: ProspectReportCard[]): ReportCardSummary {
  const avgFV = Math.round(cards.reduce((s, c) => s + c.overallFV, 0) / cards.length);
  const byCeiling = [...cards].sort((a, b) => b.ceilingWAR - a.ceilingWAR);
  const byFloor = [...cards].sort((a, b) => b.floorWAR - a.floorWAR);

  return {
    totalReports: cards.length,
    avgFV,
    highestCeiling: { name: byCeiling[0].name, war: byCeiling[0].ceilingWAR },
    safestFloor: { name: byFloor[0].name, war: byFloor[0].floorWAR },
    closestETA: cards.reduce((closest, c) => c.eta < closest ? c.eta : closest, cards[0].eta),
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoProspectReportCards(): ProspectReportCard[] {
  return [
    {
      id: 'prc-1',
      name: 'Jackson Holliday',
      position: 'SS',
      team: 'BAL',
      age: 21,
      bats: 'L',
      throws: 'R',
      height: '6-1',
      weight: 185,
      level: 'AAA',
      draftInfo: '1st Round, 2022 (#1 overall)',
      signBonus: 8.19,
      tools: [
        { tool: 'Hit', present: 60, future: 70, trending: 'up', scoutNote: 'Advanced bat-to-ball skills, elite plate discipline. Effortless bat speed from the left side with natural loft.' },
        { tool: 'Power', present: 50, future: 60, trending: 'up', scoutNote: 'Growing into above-average game power. 20-25 HR ceiling as he fills out physically.' },
        { tool: 'Speed', present: 55, future: 50, trending: 'flat', scoutNote: 'Above-average runner now, will slow a tick. Smart baserunner, 15-20 SB range.' },
        { tool: 'Arm', present: 55, future: 55, trending: 'flat', scoutNote: 'Solid-average arm strength, plenty for shortstop. Quick release and accurate throws.' },
        { tool: 'Field', present: 55, future: 60, trending: 'up', scoutNote: 'Smooth actions, good range. May move to 2B or 3B long-term but can stay at SS.' },
      ],
      overallFV: 70,
      scoutName: 'Tom Randall',
      scoutDate: '2025-08-14',
      narrative: 'Holliday is the total package at shortstop. His left-handed swing generates consistent hard contact to all fields with growing pull-side power. The hit tool is advanced beyond his years -- he rarely chases and works counts like a veteran. Defensively, he has the hands and instincts to stay at short, though a move to second base would unlock even more offensive value. He dominated the upper minors and is ready for everyday big-league at-bats. The bat plays at any position, and the floor is an All-Star caliber player.',
      risk: 'low',
      reward: 'elite',
      riskFactors: ['Long-term defensive position uncertain', 'Needs to add strength for peak power projection'],
      upside: 'Perennial All-Star, .300 hitter with 25+ HR and Gold Glove upside',
      eta: 'Early 2026',
      ceilingWAR: 7.5,
      floorWAR: 3.0,
      projectedRole: 'Everyday SS / Franchise cornerstone',
      comparables: [
        { name: 'Carlos Correa', similarity: 82, note: 'Left-handed version with better contact skills' },
        { name: 'Corey Seager', similarity: 78, note: 'Similar bat profile, more speed' },
        { name: 'Robin Yount', similarity: 70, note: 'Athletic SS who could move positions' },
      ],
      seasonStats: '.313/.401/.502, 18 HR, 22 SB, 74 RBI in 118 G (AAA)',
    },
    {
      id: 'prc-2',
      name: 'Roki Sasaki',
      position: 'SP',
      team: 'LAD',
      age: 23,
      bats: 'R',
      throws: 'R',
      height: '6-4',
      weight: 185,
      level: 'MLB',
      draftInfo: 'Posted from NPB (Chiba Lotte Marines)',
      signBonus: 6.5,
      tools: [
        { tool: 'Fastball', present: 80, future: 80, trending: 'flat', scoutNote: 'Elite velocity, sits 98-101 with late ride and carry. Touches 103 when needed. Devastating pitch.' },
        { tool: 'Splitter', present: 70, future: 80, trending: 'up', scoutNote: 'Arguably the best splitter in baseball. Sharp, late tumble at 89-92 MPH with huge whiff rate.' },
        { tool: 'Slider', present: 55, future: 65, trending: 'up', scoutNote: 'Developing slider with hard bite. Flashes plus, becoming more consistent.' },
        { tool: 'Command', present: 50, future: 60, trending: 'up', scoutNote: 'Average command now, improving. Can paint corners when locked in, occasional wildness.' },
        { tool: 'Stamina', present: 45, future: 55, trending: 'up', scoutNote: 'Workload managed carefully due to injury history. Building toward 160+ IP.' },
      ],
      overallFV: 70,
      scoutName: 'Mike Ichikawa',
      scoutDate: '2025-09-02',
      narrative: 'Sasaki possesses the single most electric arm in professional baseball. The fastball-splitter combination is virtually unhittable when he commands both pitches, generating whiff rates that rank among the best in recorded history. The concern has always been durability -- he missed significant time in NPB with shoulder issues and the Dodgers will manage his innings carefully. If healthy, the ceiling is a perennial Cy Young contender. The slider is becoming a legitimate third offering, giving him a weapon against lefties. The stuff is 80-grade; the risk is entirely about the body holding up.',
      risk: 'high',
      reward: 'elite',
      riskFactors: ['Significant shoulder injury history in NPB', 'Innings workload still being built up', 'Adjustment to MLB hitters and 162-game grind'],
      upside: 'Cy Young caliber front-line starter, 250+ K seasons',
      eta: 'Now (MLB)',
      ceilingWAR: 8.0,
      floorWAR: 0.5,
      projectedRole: 'Frontline SP / Potential Ace',
      comparables: [
        { name: 'Yu Darvish', similarity: 85, note: 'Japanese ace with elite stuff transitioning to MLB' },
        { name: 'Pedro Martinez', similarity: 68, note: 'Slim build, overpowering stuff, durability questions' },
        { name: 'Shohei Ohtani (pitching)', similarity: 75, note: 'Similar velocity and splitter devastation' },
      ],
      seasonStats: '3.12 ERA, 162 K, 42 BB in 121.1 IP, 11.4 K/9',
    },
    {
      id: 'prc-3',
      name: 'Marcelo Mayer',
      position: 'SS',
      team: 'BOS',
      age: 22,
      bats: 'L',
      throws: 'R',
      height: '6-3',
      weight: 188,
      level: 'AAA',
      draftInfo: '1st Round, 2021 (#4 overall)',
      signBonus: 6.66,
      tools: [
        { tool: 'Hit', present: 55, future: 65, trending: 'up', scoutNote: 'Beautiful left-handed swing with natural barrel accuracy. Improving approach, learning to use whole field.' },
        { tool: 'Power', present: 50, future: 60, trending: 'up', scoutNote: 'Plus raw power from the left side, starting to translate in games. 25+ HR ceiling.' },
        { tool: 'Speed', present: 50, future: 45, trending: 'down', scoutNote: 'Average runner who will slow as he fills out. Not a base-stealing threat.' },
        { tool: 'Arm', present: 60, future: 60, trending: 'flat', scoutNote: 'Strong arm, can make all throws from deep in the hole. Asset at shortstop.' },
        { tool: 'Field', present: 55, future: 60, trending: 'up', scoutNote: 'Good hands and actions. Range is solid, body may push him to 3B eventually.' },
      ],
      overallFV: 65,
      scoutName: 'Sarah Greenfield',
      scoutDate: '2025-07-28',
      narrative: 'Mayer has the prettiest left-handed swing in the minor leagues. The bat path is natural, the hands are quick, and the barrel control is advanced for his age. After a slow start at AA, he has crushed AAA pitching and looks ready for the big leagues. The power has taken a step forward -- he is driving the ball out of the park to all fields with more consistency. Defensively, the body is getting bigger and there is some concern about long-term range at SS, but the arm and hands give him a chance to stick. Even if he moves to 3B, the bat profiles as an impact middle-of-the-order force.',
      risk: 'medium',
      reward: 'elite',
      riskFactors: ['Defensive home uncertain long-term', 'Struggled initially at AA level', 'Power still developing in games'],
      upside: 'All-Star shortstop or elite-hitting third baseman, .280+ with 25 HR',
      eta: 'Mid 2026',
      ceilingWAR: 6.5,
      floorWAR: 2.0,
      projectedRole: 'Everyday SS/3B, middle-of-the-order bat',
      comparables: [
        { name: 'Corey Seager', similarity: 80, note: 'Big-framed SS with plus bat, may move to 3B' },
        { name: 'Trea Turner', similarity: 72, note: 'Similar swing mechanics, less speed' },
        { name: 'Alex Bregman', similarity: 65, note: 'If he moves to third base full-time' },
      ],
      seasonStats: '.291/.372/.488, 16 HR, 8 SB, 62 RBI in 104 G (AA/AAA)',
    },
    {
      id: 'prc-4',
      name: 'Ethan Salas',
      position: 'C',
      team: 'SD',
      age: 19,
      bats: 'R',
      throws: 'R',
      height: '6-0',
      weight: 190,
      level: 'A+',
      draftInfo: 'IFA 2022 (Venezuela)',
      signBonus: 5.6,
      tools: [
        { tool: 'Hit', present: 55, future: 65, trending: 'up', scoutNote: 'Advanced feel for the barrel at a young age. Short, compact swing with natural bat-to-ball skills.' },
        { tool: 'Power', present: 45, future: 60, trending: 'up', scoutNote: 'Raw power is plus and growing. Already showing pull-side authority, will add more as body matures.' },
        { tool: 'Speed', present: 40, future: 30, trending: 'down', scoutNote: 'Below-average runner who will slow further. Not a factor on the bases.' },
        { tool: 'Arm', present: 60, future: 65, trending: 'up', scoutNote: 'Plus arm with strong pop times. Already throwing out 35%+ of runners at A-ball.' },
        { tool: 'Field', present: 50, future: 55, trending: 'up', scoutNote: 'Mature receiving skills for his age. Blocking and framing are ahead of schedule.' },
      ],
      overallFV: 65,
      scoutName: 'Carlos Mendez',
      scoutDate: '2025-08-20',
      narrative: 'Salas is one of the most exciting teenage catchers the game has seen in years. His bat is remarkably advanced for a 19-year-old at any position, let alone behind the plate. He controls the strike zone, uses the whole field, and is already starting to drive the ball with authority. The defensive tools are equally impressive -- strong arm, quiet receiving, and a natural leader behind the plate who controls the running game. The body is thick and strong, built to handle the rigors of catching. The development curve here is steep and the ETA is far out, but the ceiling is a franchise catcher who hits in the heart of the order.',
      risk: 'high',
      reward: 'elite',
      riskFactors: ['Very young, long development runway', 'Catching workload and wear-and-tear', 'Two full levels from MLB', 'Power still projection'],
      upside: 'Franchise catcher, .280 with 25+ HR, elite defense',
      eta: 'Late 2027',
      ceilingWAR: 7.0,
      floorWAR: 1.0,
      projectedRole: 'Starting catcher / franchise cornerstone',
      comparables: [
        { name: 'Salvador Perez', similarity: 78, note: 'Right-handed power-hitting catcher with strong arm' },
        { name: 'Adley Rutschman', similarity: 72, note: 'Complete package behind the plate' },
        { name: 'Ivan Rodriguez', similarity: 60, note: 'Upside comp -- elite arm and bat' },
      ],
      seasonStats: '.278/.358/.441, 12 HR, 2 SB, 48 RBI in 96 G (A+)',
    },
    {
      id: 'prc-5',
      name: 'Max Clark',
      position: 'CF',
      team: 'DET',
      age: 20,
      bats: 'L',
      throws: 'L',
      height: '6-1',
      weight: 190,
      level: 'A+',
      draftInfo: '1st Round, 2023 (#3 overall)',
      signBonus: 6.5,
      tools: [
        { tool: 'Hit', present: 50, future: 60, trending: 'up', scoutNote: 'Developing approach, has shown ability to make adjustments. Bat speed is plus and bat-to-ball is improving.' },
        { tool: 'Power', present: 40, future: 55, trending: 'up', scoutNote: 'Gap power now, projecting average-to-plus game power as he matures physically.' },
        { tool: 'Speed', present: 70, future: 65, trending: 'flat', scoutNote: 'Elite speed, 70 grade runner. Game-changing on the bases and in center field.' },
        { tool: 'Arm', present: 50, future: 50, trending: 'flat', scoutNote: 'Average arm, fine for center field. Accurate but not a weapon.' },
        { tool: 'Field', present: 65, future: 70, trending: 'up', scoutNote: 'Premium center fielder. Ridiculous range, great routes, highlight-reel plays routine.' },
      ],
      overallFV: 60,
      scoutName: 'Dan Whitfield',
      scoutDate: '2025-07-15',
      narrative: 'Clark is the best defensive outfield prospect in the minors. His speed plays up in center field where he covers enormous ground and makes difficult catches look routine. The bat is the question -- the swing has some length and he can get caught expanding the zone, but the raw bat speed and athleticism give him a high ceiling offensively. If the hit tool develops to even fringe-plus, the combination of defense and speed makes him an All-Star caliber center fielder. He will steal 30+ bases at the big-league level and save runs in the field. The floor is a starting CF who impacts the game with his legs and glove.',
      risk: 'medium',
      reward: 'above_average',
      riskFactors: ['Hit tool still developing', 'Power projection is uncertain', 'Swing has length, may struggle vs advanced pitching'],
      upside: 'All-Star CF, .275 with 15 HR, 40 SB, Gold Glove defense',
      eta: 'Mid 2027',
      ceilingWAR: 6.0,
      floorWAR: 1.5,
      projectedRole: 'Everyday CF, top of lineup',
      comparables: [
        { name: 'Andrew McCutchen', similarity: 75, note: 'Athletic CF with developing power' },
        { name: 'Lorenzo Cain', similarity: 70, note: 'Elite defensive CF, solid offensive profile' },
        { name: 'Kenny Lofton', similarity: 65, note: 'Speed-first CF with offensive upside' },
      ],
      seasonStats: '.267/.345/.398, 8 HR, 34 SB, 42 RBI in 108 G (A+)',
    },
    {
      id: 'prc-6',
      name: 'Sebastian Walcott',
      position: 'SS',
      team: 'TEX',
      age: 19,
      bats: 'R',
      throws: 'R',
      height: '6-2',
      weight: 195,
      level: 'A',
      draftInfo: '1st Round, 2023 (#28 overall)',
      signBonus: 4.75,
      tools: [
        { tool: 'Hit', present: 45, future: 55, trending: 'up', scoutNote: 'Raw approach but plus bat speed. Expanding swing decisions, needs refinement at upper levels.' },
        { tool: 'Power', present: 55, future: 65, trending: 'up', scoutNote: 'Already showing plus raw power at 19. Ball explodes off the bat. 30+ HR potential.' },
        { tool: 'Speed', present: 60, future: 55, trending: 'flat', scoutNote: 'Plus runner with athleticism. Will slow slightly but remains above average.' },
        { tool: 'Arm', present: 65, future: 65, trending: 'flat', scoutNote: 'Plus arm, strong throws from deep in the hole. Could play anywhere on the infield.' },
        { tool: 'Field', present: 50, future: 55, trending: 'up', scoutNote: 'Athletic actions but raw. May outgrow SS but body works at 3B or RF.' },
      ],
      overallFV: 60,
      scoutName: 'Tom Randall',
      scoutDate: '2025-06-22',
      narrative: 'Walcott has the most exciting combination of raw power and speed in the lower minors. The physicality is already impressive at 19 and there is more projection remaining. He generates massive bat speed from the right side and when he connects, the ball travels -- he has hit several 450+ foot home runs in A-ball. The challenge is channeling the tools into consistent production. The swing-and-miss is real, and he will need to tighten his approach to reach his ceiling. Defensively, the body may outgrow shortstop, but the arm and athleticism fit anywhere. If the hit tool comes around, this is a middle-of-the-order impact bat.',
      risk: 'high',
      reward: 'elite',
      riskFactors: ['Significant swing-and-miss concerns', 'Very young, long development path', 'May not stick at shortstop', 'Approach needs major refinement'],
      upside: '30 HR, 20 SB middle-of-the-order threat with positional flexibility',
      eta: 'Late 2027',
      ceilingWAR: 6.5,
      floorWAR: 0.5,
      projectedRole: 'Middle-of-the-order bat, SS/3B/RF',
      comparables: [
        { name: 'Manny Machado', similarity: 68, note: 'Power-speed SS who moved to 3B' },
        { name: 'Carlos Correa', similarity: 65, note: 'Big SS with plus power and arm' },
        { name: 'Alex Rodriguez', similarity: 55, note: 'Upside comp only -- elite power from SS' },
      ],
      seasonStats: '.254/.321/.472, 18 HR, 22 SB, 55 RBI in 102 G (A)',
    },
    {
      id: 'prc-7',
      name: 'Chase Burns',
      position: 'SP',
      team: 'CIN',
      age: 22,
      bats: 'R',
      throws: 'R',
      height: '6-4',
      weight: 220,
      level: 'AA',
      draftInfo: '1st Round, 2024 (#2 overall)',
      signBonus: 9.26,
      tools: [
        { tool: 'Fastball', present: 70, future: 75, trending: 'up', scoutNote: 'Power fastball sits 96-99, touches 101. Elite spin rate generates swing-and-miss up in zone.' },
        { tool: 'Slider', present: 65, future: 70, trending: 'up', scoutNote: 'Wipeout slider at 86-89. Sharp two-plane break, swing-and-miss pitch already.' },
        { tool: 'Changeup', present: 45, future: 55, trending: 'up', scoutNote: 'Developing change with good fade. Lags behind other pitches but has shown improvement.' },
        { tool: 'Command', present: 50, future: 60, trending: 'up', scoutNote: 'Average command now, but improving feel. Can locate fastball when ahead in counts.' },
        { tool: 'Stamina', present: 55, future: 60, trending: 'up', scoutNote: 'Durable build, handled college workload well. Projects to 180+ IP.' },
      ],
      overallFV: 65,
      scoutName: 'Sarah Greenfield',
      scoutDate: '2025-09-10',
      narrative: 'Burns has one of the most electric fastball-slider combinations in the minors. The heater sits in the high 90s with elite spin that generates whiffs up in the zone, and the slider is already a swing-and-miss weapon against both lefties and righties. He dominated his first full pro season and is moving aggressively through the system. The changeup is the key to his ceiling -- if it becomes a reliable third pitch, he is a frontline starter. Even without it, the two-pitch mix plays in a high-leverage relief role. The body is built to log innings and the competitive makeup is outstanding. Fast mover who could contribute at the MLB level by mid-2026.',
      risk: 'medium',
      reward: 'elite',
      riskFactors: ['Changeup is still below average', 'Relies heavily on two pitches', 'Has not faced upper-level hitters yet'],
      upside: 'Frontline starter, 200+ K with sub-3.00 ERA',
      eta: 'Mid 2026',
      ceilingWAR: 6.0,
      floorWAR: 1.5,
      projectedRole: 'Frontline SP or high-leverage RP',
      comparables: [
        { name: 'Hunter Greene', similarity: 80, note: 'Power righty with electric stuff' },
        { name: 'Max Scherzer', similarity: 60, note: 'Upside comp -- competitive fire and stuff' },
        { name: 'Dylan Cease', similarity: 72, note: 'High-K stuff with command development path' },
      ],
      seasonStats: '2.78 ERA, 178 K, 52 BB in 139 IP, 11.5 K/9 (A+/AA)',
    },
    {
      id: 'prc-8',
      name: 'Travis Bazzana',
      position: '2B',
      team: 'CLE',
      age: 22,
      bats: 'L',
      throws: 'R',
      height: '6-0',
      weight: 195,
      level: 'AA',
      draftInfo: '1st Round, 2024 (#1 overall)',
      signBonus: 9.78,
      tools: [
        { tool: 'Hit', present: 65, future: 70, trending: 'up', scoutNote: 'Best pure hitter in 2024 draft class. Elite contact rates with mature plate discipline beyond his years.' },
        { tool: 'Power', present: 50, future: 55, trending: 'up', scoutNote: 'Average game power with plus raw. Drives ball to gaps, 15-20 HR range in MLB.' },
        { tool: 'Speed', present: 55, future: 50, trending: 'flat', scoutNote: 'Above-average runner, savvy on the bases. 10-15 SB range at peak.' },
        { tool: 'Arm', present: 50, future: 50, trending: 'flat', scoutNote: 'Average arm, fine for second base. Quick transfer helps on double play turns.' },
        { tool: 'Field', present: 55, future: 60, trending: 'up', scoutNote: 'Solid second baseman with good instincts. Smooth hands, ranges well to both sides.' },
      ],
      overallFV: 60,
      scoutName: 'Dan Whitfield',
      scoutDate: '2025-08-30',
      narrative: 'Bazzana is the most polished college bat to come out of the draft in years. The hit tool is the calling card -- he makes consistent, quality contact with an advanced understanding of the strike zone that belies his amateur pedigree. Australian-born, he honed his skills at Oregon State where he won the Golden Spikes Award. The approach translates immediately: he works counts, takes walks, and rarely chases. The power is more gap-to-gap than over the fence, but there is enough juice to keep pitchers honest. Defensively he is a solid fit at second base with the hands and range to be above average. His floor is very high -- this is a .290+ hitter who gets on base at an elite clip.',
      risk: 'low',
      reward: 'above_average',
      riskFactors: ['Power ceiling is modest', 'Ceiling is limited by position (2B)', 'Lacks premium athleticism'],
      upside: 'Perennial batting title contender, .300 with elite OBP',
      eta: 'Early 2026',
      ceilingWAR: 5.5,
      floorWAR: 2.5,
      projectedRole: 'Everyday 2B, top-of-lineup hitter',
      comparables: [
        { name: 'Jose Altuve', similarity: 70, note: 'Undersized 2B with elite contact skills' },
        { name: 'DJ LeMahieu', similarity: 75, note: 'High-contact, low-K approach at second base' },
        { name: 'Dustin Pedroia', similarity: 72, note: 'Gritty 2B with batting skills and solid defense' },
      ],
      seasonStats: '.308/.412/.468, 14 HR, 12 SB, 58 RBI in 112 G (A+/AA)',
    },
  ];
}
