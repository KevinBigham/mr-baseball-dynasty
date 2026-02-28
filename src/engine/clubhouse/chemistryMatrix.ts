// ─── Clubhouse Chemistry Matrix ───────────────────────────────────────────
// Player-to-player relationships, cliques, and team cohesion tracking.

export type RelationshipType = 'best_friends' | 'friends' | 'neutral' | 'tension' | 'rivals';

export interface PlayerRelationship {
  playerA: { id: number; name: string };
  playerB: { id: number; name: string };
  type: RelationshipType;
  strength: number;    // 0-100
  reason: string;
}

export interface Clique {
  name: string;
  emoji: string;
  members: { id: number; name: string }[];
  chemistry: number;   // 0-100
  influence: number;   // 0-100 (how much this clique affects team)
}

export interface TeamCohesion {
  overall: number;     // 0-100
  positiveRelationships: number;
  negativeRelationships: number;
  cliques: number;
  lonerCount: number;
}

export const RELATIONSHIP_DISPLAY: Record<RelationshipType, { label: string; color: string; emoji: string }> = {
  best_friends: { label: 'Best Friends', color: '#22c55e', emoji: '💚' },
  friends:      { label: 'Friends', color: '#a3e635', emoji: '🤝' },
  neutral:      { label: 'Neutral', color: '#94a3b8', emoji: '😐' },
  tension:      { label: 'Tension', color: '#f97316', emoji: '😤' },
  rivals:       { label: 'Rivals', color: '#ef4444', emoji: '⚡' },
};

export function getCohesionLabel(cohesion: number): { label: string; color: string } {
  if (cohesion >= 80) return { label: 'Brotherhood', color: '#22c55e' };
  if (cohesion >= 60) return { label: 'United', color: '#a3e635' };
  if (cohesion >= 40) return { label: 'Average', color: '#eab308' };
  if (cohesion >= 20) return { label: 'Fractured', color: '#f97316' };
  return { label: 'Toxic', color: '#ef4444' };
}

export function getCohesionEffect(cohesion: number): { ovrBonus: number; moraleBonus: number } {
  if (cohesion >= 80) return { ovrBonus: 3, moraleBonus: 5 };
  if (cohesion >= 60) return { ovrBonus: 1, moraleBonus: 2 };
  if (cohesion >= 40) return { ovrBonus: 0, moraleBonus: 0 };
  if (cohesion >= 20) return { ovrBonus: -1, moraleBonus: -3 };
  return { ovrBonus: -3, moraleBonus: -5 };
}

export function calculateCohesion(relationships: PlayerRelationship[], cliques: Clique[]): TeamCohesion {
  const positive = relationships.filter(r => r.type === 'best_friends' || r.type === 'friends').length;
  const negative = relationships.filter(r => r.type === 'tension' || r.type === 'rivals').length;
  const total = relationships.length || 1;
  const relScore = ((positive - negative * 1.5) / total + 1) * 50;
  const cliqueAvg = cliques.length > 0
    ? cliques.reduce((s, c) => s + c.chemistry, 0) / cliques.length
    : 50;
  const overall = Math.max(0, Math.min(100, Math.round(relScore * 0.6 + cliqueAvg * 0.4)));

  const allIds = new Set(relationships.flatMap(r => [r.playerA.id, r.playerB.id]));
  const cliqueIds = new Set(cliques.flatMap(c => c.members.map(m => m.id)));
  const lonerCount = [...allIds].filter(id => !cliqueIds.has(id)).length;

  return { overall, positiveRelationships: positive, negativeRelationships: negative, cliques: cliques.length, lonerCount };
}

// ─── Demo data ────────────────────────────────────────────────────────────

export function generateDemoRelationships(): PlayerRelationship[] {
  return [
    { playerA: { id: 1, name: 'Marcus Bell' }, playerB: { id: 2, name: 'Carlos Reyes' }, type: 'best_friends', strength: 92, reason: 'Came up through minors together' },
    { playerA: { id: 1, name: 'Marcus Bell' }, playerB: { id: 3, name: "James O'Brien" }, type: 'friends', strength: 68, reason: 'Regular workout partners' },
    { playerA: { id: 2, name: 'Carlos Reyes' }, playerB: { id: 4, name: 'Derek Tanaka' }, type: 'friends', strength: 72, reason: 'Share same agent, similar contracts' },
    { playerA: { id: 3, name: "James O'Brien" }, playerB: { id: 5, name: 'Ryan Mitchell' }, type: 'tension', strength: 55, reason: "Disagreement over clubhouse music" },
    { playerA: { id: 4, name: 'Derek Tanaka' }, playerB: { id: 6, name: 'Mike Torres' }, type: 'neutral', strength: 40, reason: 'Cordial but distant' },
    { playerA: { id: 5, name: 'Ryan Mitchell' }, playerB: { id: 7, name: 'Sam Johnson' }, type: 'rivals', strength: 85, reason: 'Competing for starting CF job' },
    { playerA: { id: 1, name: 'Marcus Bell' }, playerB: { id: 8, name: 'Tony Garcia' }, type: 'friends', strength: 75, reason: 'Veteran mentoring young hitter' },
    { playerA: { id: 6, name: 'Mike Torres' }, playerB: { id: 7, name: 'Sam Johnson' }, type: 'friends', strength: 65, reason: 'Both from Miami area' },
    { playerA: { id: 3, name: "James O'Brien" }, playerB: { id: 9, name: 'Chris Park' }, type: 'best_friends', strength: 88, reason: 'SP-catcher battery mates for 4 seasons' },
    { playerA: { id: 8, name: 'Tony Garcia' }, playerB: { id: 5, name: 'Ryan Mitchell' }, type: 'tension', strength: 48, reason: 'Garcia took his spot in the lineup' },
  ];
}

export function generateDemoCliques(): Clique[] {
  return [
    { name: 'Latin Connection', emoji: '🌎', members: [{ id: 2, name: 'Carlos Reyes' }, { id: 4, name: 'Derek Tanaka' }, { id: 8, name: 'Tony Garcia' }], chemistry: 82, influence: 65 },
    { name: 'Rotation Club', emoji: '⚾', members: [{ id: 3, name: "James O'Brien" }, { id: 9, name: 'Chris Park' }], chemistry: 90, influence: 55 },
    { name: 'Veteran Core', emoji: '🎖️', members: [{ id: 1, name: 'Marcus Bell' }, { id: 2, name: 'Carlos Reyes' }, { id: 3, name: "James O'Brien" }], chemistry: 78, influence: 80 },
  ];
}
