/**
 * @module draft
 * Barrel export for the draft system: prospect generation, AI selection, and full draft simulation.
 */

export type { DraftProspect, DraftClass } from './draftPool.js';
export { generateDraftClass, rankProspects, DRAFT_ROUNDS, NUM_TEAMS } from './draftPool.js';

export type { DraftPick, DraftResult } from './draftAI.js';
export {
  determineDraftOrder,
  aiSelectPick,
  evaluateTeamNeeds,
  simulateFullDraft,
} from './draftAI.js';
