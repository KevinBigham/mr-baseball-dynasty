import { INITIAL_TEAMS } from './teams';

/** Lightweight team lookup: id → "ABR — City Name (League Division)" */
export const TEAM_OPTIONS = INITIAL_TEAMS.map(t => ({
  id: t.teamId,
  label: `${t.abbreviation} — ${t.city} ${t.name} (${t.league} ${t.division})`,
  abbreviation: t.abbreviation,
  city: t.city,
  name: t.name,
}));

export function getTeamLabel(teamId: number): string {
  return TEAM_OPTIONS.find(t => t.id === teamId)?.label ?? '---';
}

export function getTeamName(teamId: number): string {
  const t = TEAM_OPTIONS.find(t => t.id === teamId);
  return t ? `${t.city} ${t.name}` : 'Dynasty';
}
