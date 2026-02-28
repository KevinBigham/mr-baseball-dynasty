// ─── Retirement Watch ─────────────────────────────────────────────────────
// Veteran retirement predictions, farewell tours, and legacy assessment.

export interface RetirementCandidate {
  id: number;
  name: string;
  pos: string;
  age: number;
  seasons: number;
  overall: number;
  retirementOdds: number;  // 0-100
  careerHighlights: string[];
  hallOfFameChance: number; // 0-100
  farewellTour: boolean;
  lastSeasonStats: Record<string, number | string>;
  legacy: LegacyTier;
}

export type LegacyTier = 'first_ballot' | 'hall_of_fame' | 'borderline' | 'respected' | 'journeyman';

export const LEGACY_DISPLAY: Record<LegacyTier, { label: string; color: string; emoji: string }> = {
  first_ballot: { label: 'First Ballot HOF', color: '#f59e0b', emoji: '🏛️' },
  hall_of_fame: { label: 'Hall of Fame', color: '#22c55e', emoji: '🏆' },
  borderline:   { label: 'Borderline HOF', color: '#3b82f6', emoji: '🤔' },
  respected:    { label: 'Respected Vet', color: '#94a3b8', emoji: '🎖️' },
  journeyman:   { label: 'Journeyman', color: '#6b7280', emoji: '⚾' },
};

export function getRetirementOdds(age: number, overall: number, seasons: number): number {
  let odds = 0;
  if (age >= 40) odds += 60;
  else if (age >= 38) odds += 35;
  else if (age >= 36) odds += 15;
  else if (age >= 34) odds += 5;

  if (overall < 55) odds += 25;
  else if (overall < 65) odds += 10;

  if (seasons >= 20) odds += 20;
  else if (seasons >= 18) odds += 10;

  return Math.min(99, odds);
}

export function getLegacyTier(hallOfFameChance: number): LegacyTier {
  if (hallOfFameChance >= 90) return 'first_ballot';
  if (hallOfFameChance >= 65) return 'hall_of_fame';
  if (hallOfFameChance >= 40) return 'borderline';
  if (hallOfFameChance >= 15) return 'respected';
  return 'journeyman';
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoRetirementCandidates(): RetirementCandidate[] {
  return [
    {
      id: 301, name: 'Justin Verlander', pos: 'SP', age: 42, seasons: 20, overall: 62,
      retirementOdds: 88, hallOfFameChance: 98, farewellTour: true,
      careerHighlights: ['3× Cy Young', '2× World Series Champion', 'MVP Award', '3,300+ Strikeouts'],
      lastSeasonStats: { W: 8, ERA: '4.22', SO: 112, IP: '145.0' },
      legacy: 'first_ballot',
    },
    {
      id: 302, name: 'Miguel Cabrera', pos: 'DH', age: 41, seasons: 22, overall: 55,
      retirementOdds: 95, hallOfFameChance: 99, farewellTour: true,
      careerHighlights: ['Triple Crown (2012)', '2× MVP', '4× Batting Champion', '500+ HR, 3,000+ Hits'],
      lastSeasonStats: { AVG: '.248', HR: 8, RBI: 42 },
      legacy: 'first_ballot',
    },
    {
      id: 303, name: 'Zack Greinke', pos: 'SP', age: 41, seasons: 21, overall: 58,
      retirementOdds: 82, hallOfFameChance: 72, farewellTour: false,
      careerHighlights: ['Cy Young Award', '6× All-Star', '200+ Career Wins', '2,800+ Strikeouts'],
      lastSeasonStats: { W: 6, ERA: '4.85', SO: 88, IP: '128.0' },
      legacy: 'hall_of_fame',
    },
    {
      id: 304, name: 'Joey Votto', pos: '1B', age: 40, seasons: 18, overall: 52,
      retirementOdds: 75, hallOfFameChance: 45, farewellTour: false,
      careerHighlights: ['MVP (2010)', '6× All-Star', '.300+ Career AVG', 'Led NL in OBP 7 times'],
      lastSeasonStats: { AVG: '.235', HR: 12, RBI: 38 },
      legacy: 'borderline',
    },
    {
      id: 305, name: 'Brandon Belt', pos: '1B', age: 37, seasons: 14, overall: 60,
      retirementOdds: 35, hallOfFameChance: 8, farewellTour: false,
      careerHighlights: ['3× World Series Champion', 'Career .262 AVG', '170+ HR'],
      lastSeasonStats: { AVG: '.255', HR: 14, RBI: 52 },
      legacy: 'respected',
    },
    {
      id: 306, name: 'Adam Wainwright', pos: 'SP', age: 43, seasons: 19, overall: 48,
      retirementOdds: 98, hallOfFameChance: 38, farewellTour: true,
      careerHighlights: ['3× All-Star', '200+ Career Wins', 'Cardinals Legend', 'Gold Glove Award'],
      lastSeasonStats: { W: 3, ERA: '5.65', SO: 55, IP: '85.0' },
      legacy: 'borderline',
    },
  ];
}
