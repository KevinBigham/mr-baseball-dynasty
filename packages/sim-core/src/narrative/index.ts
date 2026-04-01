/**
 * @module narrative
 * Barrel export for the narrative subsystem.
 */

export {
  // Functions
  generateNews,
  generateNewsId,
  checkMilestones,
  generateStandingsNews,
  getUnreadNews,
  markAsRead,
  deduplicateNews,
  generateSeasonRecap,
} from './newsFeed.js';

export type {
  // Types
  NewsPriority,
  NewsCategory,
  NewsItem,
  MomentType,
  Moment,
  GameEvent,
} from './newsFeed.js';
