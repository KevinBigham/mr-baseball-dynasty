/**
 * frontOfficeHierarchy.ts – Front office staff hierarchy
 *
 * Models the complete front office structure from Owner through GM,
 * AGM, scouts, analytics, and development staff with ratings and roles.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type StaffRole = 'owner' | 'president' | 'gm' | 'agm' | 'scouting_dir' | 'analytics_dir' | 'dev_dir' | 'scout' | 'analyst' | 'coach';

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  title: string;
  age: number;
  yearsInOrg: number;
  rating: number;         // 0-100
  specialty: string;
  salary: number;         // $K
  contractYears: number;
  reportsTo: string;      // id of supervisor
  notes: string;
}

export interface FrontOfficeData {
  teamName: string;
  abbr: string;
  staff: StaffMember[];
  orgRating: number;           // 0-100
  scoutingBudget: number;      // $M
  analyticsBudget: number;     // $M
  totalStaffCost: number;      // $M
  strengths: string[];
  weaknesses: string[];
}

export const ROLE_DISPLAY: Record<StaffRole, { label: string; color: string; level: number }> = {
  owner: { label: 'OWNER', color: '#f59e0b', level: 0 },
  president: { label: 'PRESIDENT', color: '#f59e0b', level: 1 },
  gm: { label: 'GM', color: '#22c55e', level: 2 },
  agm: { label: 'AGM', color: '#4ade80', level: 3 },
  scouting_dir: { label: 'SCOUTING DIR', color: '#a855f7', level: 3 },
  analytics_dir: { label: 'ANALYTICS DIR', color: '#3b82f6', level: 3 },
  dev_dir: { label: 'DEVELOPMENT DIR', color: '#f97316', level: 3 },
  scout: { label: 'SCOUT', color: '#a855f7', level: 4 },
  analyst: { label: 'ANALYST', color: '#3b82f6', level: 4 },
  coach: { label: 'COACH', color: '#f97316', level: 4 },
};

// ─── Summary ────────────────────────────────────────────────────────────────

export interface FrontOfficeSummary {
  totalStaff: number;
  orgRating: number;
  avgRating: number;
  totalBudget: number;
  topRated: string;
}

export function getFrontOfficeSummary(data: FrontOfficeData): FrontOfficeSummary {
  const avgR = data.staff.reduce((s, m) => s + m.rating, 0) / data.staff.length;
  const topRated = data.staff.reduce((a, b) => a.rating > b.rating ? a : b);

  return {
    totalStaff: data.staff.length,
    orgRating: data.orgRating,
    avgRating: Math.round(avgR),
    totalBudget: Math.round((data.scoutingBudget + data.analyticsBudget) * 10) / 10,
    topRated: topRated.name,
  };
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

export function generateDemoFrontOffice(): FrontOfficeData {
  const staff: StaffMember[] = [
    { id: 'fo-0', name: 'Steve Cohen', role: 'owner', title: 'Owner & Chairman', age: 68, yearsInOrg: 5, rating: 85, specialty: 'Financial Resources', salary: 0, contractYears: 99, reportsTo: '', notes: 'Deep-pocketed owner willing to spend. Impatient for results but provides resources.' },
    { id: 'fo-1', name: 'David Stearns', role: 'president', title: 'President of Baseball Ops', age: 39, yearsInOrg: 2, rating: 92, specialty: 'Roster Construction', salary: 3500, contractYears: 4, reportsTo: 'fo-0', notes: 'Analytics-driven executive. Excellent at identifying value and building depth.' },
    { id: 'fo-2', name: 'Mike Rodriguez', role: 'gm', title: 'General Manager', age: 42, yearsInOrg: 3, rating: 85, specialty: 'Trade Negotiations', salary: 2200, contractYears: 3, reportsTo: 'fo-1', notes: 'Strong negotiator with league-wide connections. Good at making deals under pressure.' },
    { id: 'fo-3', name: 'Sarah Chen', role: 'agm', title: 'Assistant GM - Analytics', age: 35, yearsInOrg: 2, rating: 88, specialty: 'Statistical Modeling', salary: 1200, contractYears: 3, reportsTo: 'fo-2', notes: 'Former MIT researcher. Built the team\'s projection system from scratch.' },
    { id: 'fo-4', name: 'Tommy Williams', role: 'agm', title: 'Assistant GM - Pro Scouting', age: 48, yearsInOrg: 6, rating: 80, specialty: 'Pro Player Evaluation', salary: 1100, contractYears: 2, reportsTo: 'fo-2', notes: 'Old-school scout with modern mindset. Great at identifying undervalued veterans.' },
    { id: 'fo-5', name: 'Ray Martinez', role: 'scouting_dir', title: 'Director of Amateur Scouting', age: 52, yearsInOrg: 8, rating: 82, specialty: 'Amateur Draft Evaluation', salary: 800, contractYears: 2, reportsTo: 'fo-2', notes: 'Deep network in high school and college ranks. Known for finding gems in later rounds.' },
    { id: 'fo-6', name: 'Priya Patel', role: 'analytics_dir', title: 'Director of R&D', age: 31, yearsInOrg: 3, rating: 90, specialty: 'Machine Learning / Biomechanics', salary: 900, contractYears: 3, reportsTo: 'fo-3', notes: 'Leading the biomechanics revolution. Built pitch design lab from ground up.' },
    { id: 'fo-7', name: 'Carlos Vega', role: 'dev_dir', title: 'Director of Player Development', age: 45, yearsInOrg: 4, rating: 84, specialty: 'MiLB Player Development', salary: 750, contractYears: 2, reportsTo: 'fo-2', notes: 'Restructured the entire minor league system. Emphasis on modern development techniques.' },
    { id: 'fo-8', name: 'Jim Patterson', role: 'scout', title: 'National Crosschecker', age: 58, yearsInOrg: 12, rating: 78, specialty: 'West Coast Area Scout', salary: 180, contractYears: 1, reportsTo: 'fo-5', notes: 'Veteran eyes. Has seen every top prospect in the west for 30 years.' },
    { id: 'fo-9', name: 'Alex Kim', role: 'analyst', title: 'Quantitative Analyst', age: 27, yearsInOrg: 2, rating: 86, specialty: 'Pitch Modeling', salary: 200, contractYears: 2, reportsTo: 'fo-6', notes: 'Specialized in pitch design and movement analysis. Key contributor to the lab.' },
    { id: 'fo-10', name: 'Marcus Brown', role: 'coach', title: 'MiLB Pitching Coordinator', age: 40, yearsInOrg: 3, rating: 82, specialty: 'Pitching Development', salary: 350, contractYears: 2, reportsTo: 'fo-7', notes: 'Former minor leaguer turned elite development coach. Works closely with analytics.' },
  ];

  return {
    teamName: 'New York Mets', abbr: 'NYM', staff,
    orgRating: 86, scoutingBudget: 8.5, analyticsBudget: 5.2, totalStaffCost: 11.2,
    strengths: ['Analytics integration', 'Financial resources', 'Player development restructuring', 'Biomechanics lab'],
    weaknesses: ['Scouting network still developing', 'Owner impatience', 'High staff turnover risk'],
  };
}
