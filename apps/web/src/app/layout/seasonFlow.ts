export type SeasonFlowStatus =
  | 'preseason'
  | 'regular'
  | 'regular_season_complete'
  | 'playoff_preview'
  | 'playoffs_complete'
  | 'offseason'
  | 'offseason_complete';

export type SeasonFlowAction =
  | 'proceed_to_playoffs'
  | 'sim_playoffs'
  | 'watch_playoffs'
  | 'skip_to_offseason'
  | 'proceed_to_offseason'
  | 'start_next_season'
  | null;

export interface SeasonFlowStanding {
  teamId: string;
  teamName: string;
  abbreviation: string;
  wins: number;
  losses: number;
  division: string;
}

export interface SeasonFlowPreviewTeam {
  teamId: string | null;
  teamName: string;
  abbreviation: string;
  seed: number | null;
  placeholder: string | null;
}

export interface SeasonFlowPreviewSeries {
  id: string;
  round: string;
  bestOf: number;
  home: SeasonFlowPreviewTeam;
  away: SeasonFlowPreviewTeam;
}

export interface SeasonFlowChampionSummary {
  championTeamId: string | null;
  championTeamName: string;
  runnerUpTeamName: string;
  seriesRecord: string;
}

export interface SeasonFlowSeasonSummary {
  record: string;
  divisionFinish: string;
  playoffStatus: string;
  teamLeaders: string[];
  awardFavorites: string[];
}

export interface SeasonFlowOffseasonSummary {
  nextSeason: number;
  moves: string[];
}

export interface SeasonFlowState {
  status: SeasonFlowStatus;
  season: number;
  phaseLabel: string;
  detailLabel: string;
  progress: number;
  canUseRegularSimControls: boolean;
  action: SeasonFlowAction;
  actionLabel: string | null;
  secondaryAction: Extract<SeasonFlowAction, 'watch_playoffs' | 'skip_to_offseason'>;
  secondaryActionLabel: string | null;
  daysUntilTradeDeadline: number | null;
  standingsSnapshot: SeasonFlowStanding[];
  playoffPreview: SeasonFlowPreviewSeries[];
  seasonSummary: SeasonFlowSeasonSummary | null;
  championSummary: SeasonFlowChampionSummary | null;
  offseasonSummary: SeasonFlowOffseasonSummary | null;
}
