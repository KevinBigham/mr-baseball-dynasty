export type PressRoomSource = 'briefing' | 'news';

export interface PressRoomEntry {
  id: string;
  source: PressRoomSource;
  category: string;
  priority: number;
  headline: string;
  body: string;
  timestamp: string;
  relatedTeamIds: string[];
  relatedPlayerIds: string[];
}
