// ─── Scouting Network ─────────────────────────────────────────────────────
// Scout assignments, regional coverage, and intelligence quality.

export type ScoutRegion = 'northeast' | 'southeast' | 'midwest' | 'southwest' | 'west' | 'latin_america' | 'asia' | 'amateur';

export interface Scout {
  id: number;
  name: string;
  specialty: ScoutRegion;
  overall: number;       // 40-99
  experience: number;    // years
  eyeForTalent: number;  // 1-10
  assignment: ScoutRegion | null;
  salary: number;        // $M
  reportsThisSeason: number;
  topFind: string | null;
}

export interface RegionCoverage {
  region: ScoutRegion;
  scoutsAssigned: number;
  intelLevel: number;    // 0-100
  prospectsFound: number;
  topProspectOvr: number;
}

export const REGION_DISPLAY: Record<ScoutRegion, { label: string; color: string; emoji: string; desc: string }> = {
  northeast:     { label: 'Northeast', color: '#3b82f6', emoji: '🏙️', desc: 'NY, NJ, PA, New England colleges & high schools' },
  southeast:     { label: 'Southeast', color: '#f97316', emoji: '🌴', desc: 'FL, GA, Carolinas — year-round baseball' },
  midwest:       { label: 'Midwest', color: '#eab308', emoji: '🌽', desc: 'IL, OH, MO — Big Ten & college power' },
  southwest:     { label: 'Southwest', color: '#ef4444', emoji: '🌵', desc: 'TX, AZ — high school hotbed' },
  west:          { label: 'West Coast', color: '#a855f7', emoji: '🌊', desc: 'CA, OR, WA — Pac-12 & elite HS' },
  latin_america: { label: 'Latin America', color: '#22c55e', emoji: '🌎', desc: 'DR, Venezuela, Cuba — international talent' },
  asia:          { label: 'Asia', color: '#ec4899', emoji: '🏯', desc: 'Japan, Korea, Taiwan — NPB & KBO stars' },
  amateur:       { label: 'Amateur Combines', color: '#94a3b8', emoji: '📋', desc: 'Showcases, combines, and draft workouts' },
};

export function getIntelLabel(level: number): { label: string; color: string } {
  if (level >= 80) return { label: 'Complete', color: '#22c55e' };
  if (level >= 60) return { label: 'Detailed', color: '#a3e635' };
  if (level >= 40) return { label: 'Basic', color: '#eab308' };
  if (level >= 20) return { label: 'Minimal', color: '#f97316' };
  return { label: 'Unknown', color: '#ef4444' };
}

export function assignScout(scout: Scout, region: ScoutRegion): Scout {
  return { ...scout, assignment: region };
}

export function unassignScout(scout: Scout): Scout {
  return { ...scout, assignment: null };
}

export function calculateCoverage(scouts: Scout[]): RegionCoverage[] {
  const regions: ScoutRegion[] = ['northeast', 'southeast', 'midwest', 'southwest', 'west', 'latin_america', 'asia', 'amateur'];
  return regions.map(region => {
    const assigned = scouts.filter(s => s.assignment === region);
    const scoutsAssigned = assigned.length;
    const intelLevel = Math.min(100, assigned.reduce((sum, s) => sum + s.overall * 0.4 + s.eyeForTalent * 4 + s.experience * 0.5, 0));
    const prospectsFound = Math.floor(intelLevel / 15);
    const topProspectOvr = scoutsAssigned > 0 ? Math.min(85, 50 + Math.floor(intelLevel / 4)) : 0;
    return { region, scoutsAssigned, intelLevel: Math.round(intelLevel), prospectsFound, topProspectOvr };
  });
}

export function getNetworkSummary(scouts: Scout[], coverage: RegionCoverage[]) {
  const totalScouts = scouts.length;
  const assigned = scouts.filter(s => s.assignment !== null).length;
  const avgOvr = totalScouts > 0 ? Math.round(scouts.reduce((s, sc) => s + sc.overall, 0) / totalScouts) : 0;
  const totalIntel = coverage.reduce((s, c) => s + c.intelLevel, 0);
  const maxIntel = coverage.length * 100;
  const coveragePct = maxIntel > 0 ? Math.round((totalIntel / maxIntel) * 100) : 0;
  const totalSalary = scouts.reduce((s, sc) => s + sc.salary, 0);
  return { totalScouts, assigned, unassigned: totalScouts - assigned, avgOvr, coveragePct, totalSalary };
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoScouts(): Scout[] {
  return [
    { id: 1, name: 'Ray Fontana', specialty: 'southeast', overall: 78, experience: 18, eyeForTalent: 8, assignment: 'southeast', salary: 0.4, reportsThisSeason: 24, topFind: 'Marcus Bell' },
    { id: 2, name: 'Carlos Mendoza', specialty: 'latin_america', overall: 82, experience: 22, eyeForTalent: 9, assignment: 'latin_america', salary: 0.5, reportsThisSeason: 31, topFind: 'Carlos Reyes' },
    { id: 3, name: 'Dave Hutchison', specialty: 'midwest', overall: 68, experience: 12, eyeForTalent: 6, assignment: 'midwest', salary: 0.3, reportsThisSeason: 18, topFind: null },
    { id: 4, name: 'Kenji Watanabe', specialty: 'asia', overall: 75, experience: 15, eyeForTalent: 8, assignment: 'asia', salary: 0.45, reportsThisSeason: 14, topFind: 'Shota Yamamoto' },
    { id: 5, name: 'Mike O\'Rourke', specialty: 'northeast', overall: 72, experience: 10, eyeForTalent: 7, assignment: 'northeast', salary: 0.35, reportsThisSeason: 20, topFind: null },
    { id: 6, name: 'Tommy Alvarez', specialty: 'southwest', overall: 70, experience: 8, eyeForTalent: 7, assignment: 'southwest', salary: 0.3, reportsThisSeason: 22, topFind: 'Jake Rodriguez' },
    { id: 7, name: 'Brett Palmer', specialty: 'west', overall: 65, experience: 5, eyeForTalent: 6, assignment: null, salary: 0.25, reportsThisSeason: 12, topFind: null },
    { id: 8, name: 'Jim Frazier', specialty: 'amateur', overall: 74, experience: 20, eyeForTalent: 8, assignment: 'amateur', salary: 0.4, reportsThisSeason: 28, topFind: 'Tyler Davis' },
  ];
}
