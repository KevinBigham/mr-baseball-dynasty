import { useState, useRef, useEffect } from 'react';
import { useUIStore, type NavTab } from '../../store/uiStore';
import { useGameStore } from '../../store/gameStore';
import { getEngine } from '../../engine/engineClient';
import Dashboard from '../dashboard/Dashboard';
import StandingsView from '../dashboard/StandingsTable';
import RosterView from '../roster/RosterView';
import Leaderboards from '../stats/Leaderboards';
import PlayerProfile from '../stats/PlayerProfile';
import TradeCenter from '../trade/TradeCenter';
import FreeAgentMarket from '../offseason/FreeAgentMarket';
import LineupEditor from '../lineup/LineupEditor';
import DraftRoom from '../draft/DraftRoom';
import ProspectRankingsView from '../prospects/ProspectRankings';
import FinanceDashboard from '../finance/FinanceDashboard';
import InjuryTransactions from '../history/InjuryTransactions';
import AdvancedStats from '../analytics/AdvancedStats';
import CoachingStaffView from '../coaching/CoachingStaffView';
import PlayerComparison from '../stats/PlayerComparison';
import ParkComparisonView from '../stats/ParkComparisonView';
import PowerRankings from '../analytics/PowerRankings';
import TeamComparison from '../analytics/TeamComparison';
import HallOfFame from '../history/HallOfFame';
import DepthChart from '../roster/DepthChart';
import Scoreboard from '../game/Scoreboard';
import AwardRaces from '../analytics/AwardRaces';
import FranchiseOverview from '../dashboard/FranchiseOverview';
import FortyManRoster from '../roster/FortyManRoster';
import TradeDeadlineRecap from '../trade/TradeDeadlineRecap';
import WaiverWire from '../roster/WaiverWire';
import ExtensionCenter from '../contracts/ExtensionCenter';
import OwnerDashboard from '../owner/OwnerDashboard';
import IntlProspects from '../prospects/IntlProspects';
import SimHub from '../game/SimHub';
import Rule5Protection from '../roster/Rule5Protection';
import TeamChemistry from '../analytics/TeamChemistry';
import LeagueSalaries from '../finance/LeagueSalaries';
import SeasonRecap from '../dashboard/SeasonRecap';
import RosterComparison from '../analytics/RosterComparison';
import TeamSchedule from '../game/TeamSchedule';
import FarmPipeline from '../prospects/FarmPipeline';
import TradeFinder from '../trade/TradeFinder';
import DevelopmentTracker from '../prospects/DevelopmentTracker';
import PlayoffPicture from '../dashboard/PlayoffPicture';
import SeasonTimeline from '../history/SeasonTimeline';
import PayrollPlanner from '../finance/PayrollPlanner';
import PitchingStaff from '../roster/PitchingStaff';
import NewsFeed from '../dashboard/NewsFeed';
import TripleCrownTracker from '../analytics/TripleCrownTracker';
import TeamSnapshot from '../analytics/TeamSnapshot';
import ProspectScoutingBoard from '../prospects/ProspectScoutingBoard';
import OffseasonHub from '../offseason/OffseasonHub';
import MilestoneTracker from '../history/MilestoneTracker';
import AwardsGallery from '../analytics/AwardsGallery';
import DynastyDashboard from '../analytics/DynastyDashboard';
import PostGameReport from '../analytics/PostGameReport';
import GMStrategyPanel from '../strategy/GMStrategyPanel';
import CoachSkillTree from '../coaching/CoachSkillTree';
import BreakoutTracker from '../prospects/BreakoutTracker';
import OpponentScouting from '../scouting/OpponentScouting';
import StoryArcViewer from '../narrative/StoryArcViewer';
import SpringTraining from '../offseason/SpringTraining';
import RingOfHonor from '../history/RingOfHonor';
import SeriesChallenges from '../game/SeriesChallenges';
import ClubhouseEvents from '../clubhouse/ClubhouseEvents';
import MentorHub from '../player/MentorHub';
import GMReputationView from '../management/GMReputationView';
import HoldoutCenter from '../contracts/HoldoutCenter';
import OffseasonEventsView from '../offseason/OffseasonEventsView';
import FranchiseLegacyView from '../history/FranchiseLegacyView';
import PressRoom from '../media/PressRoom';
import SeasonGoalsView from '../goals/SeasonGoalsView';
import SalaryBreakdown from '../finance/SalaryBreakdown';
import PitchRepertoireView from '../pitching/PitchRepertoireView';
import TradeBlockManager from '../trade/TradeBlockManager';
import DraftScoutBoardView from '../scouting/DraftScoutBoardView';
import PlatoonMatchupsView from '../analytics/PlatoonMatchupsView';
import AllTimeRecordsView from '../history/AllTimeRecordsView';
import CoachCarouselView from '../coaching/CoachCarouselView';
import AwardPredictions from '../analytics/AwardPredictions';
import FanEngagementView from '../team/FanEngagementView';
import InjuryTrackerView from '../medical/InjuryTrackerView';
import PlayerArchetypesView from '../player/PlayerArchetypesView';
import GrudgeRevengeView from '../narrative/GrudgeRevengeView';
import OwnerPersonalityView from '../management/OwnerPersonalityView';
import HeadlineTickerView from '../narrative/HeadlineTickerView';
import IncentiveTracker from '../contracts/IncentiveTracker';
import BracketView from '../playoffs/BracketView';
import BullpenView from '../pitching/BullpenView';
import StadiumUpgradesView from '../stadium/StadiumUpgradesView';
import ScoutNetworkView from '../scouting/ScoutNetworkView';
import UmpireView from '../game/UmpireView';
import WeatherView from '../game/WeatherView';
import RivalryView from '../team/RivalryView';
import MinorLeagueView from '../minors/MinorLeagueView';
import ChemistryMatrixView from '../clubhouse/ChemistryMatrixView';
import ArbitrationView from '../contracts/ArbitrationView';
import TradeRumorBoard from '../trade/TradeRumorBoard';
import RetirementWatchView from '../player/RetirementWatchView';
import ProspectGraduationView from '../prospects/ProspectGraduationView';
import WinExpectancyView from '../game/WinExpectancyView';
import StaffPoachingView from '../management/StaffPoachingView';
import MediaPersonaView from '../narrative/MediaPersonaView';
import FilmStudyView from '../game/FilmStudyView';
import CompPicksView from '../draft/CompPicksView';
import QualifyingOfferView from '../contracts/QualifyingOfferView';
import UnlocksView from '../progression/UnlocksView';
import ManagerLegacyView from '../management/ManagerLegacyView';
import BattingPracticeView from '../game/BattingPracticeView';
import SeptemberCallupsView from '../roster/SeptemberCallupsView';
import ServiceTimeView from '../player/ServiceTimeView';
import HotColdStreaksView from '../player/HotColdStreaksView';
import WARBreakdownView from '../analytics/WARBreakdownView';
import PitchCountView from '../pitching/PitchCountView';
import DoubleHeaderView from '../game/DoubleHeaderView';
import CatcherFramingView from '../analytics/CatcherFramingView';
import DefensiveShiftsView from '../analytics/DefensiveShiftsView';
import TradeCalculatorView from '../trade/TradeCalculatorView';
import PinchHitView from '../strategy/PinchHitView';
import LineupOptimizerView from '../analytics/LineupOptimizerView';
import PlayerConditioningView from '../player/PlayerConditioningView';
import StolenBaseAnalyticsView from '../analytics/StolenBaseAnalyticsView';
import BullpenUsageView from '../pitching/BullpenUsageView';
import PlatoonAdvantageView from '../analytics/PlatoonAdvantageView';
import BatProfileView from '../analytics/BatProfileView';
import ClutchIndexView from '../analytics/ClutchIndexView';
import PitchTunnelingView from '../pitching/PitchTunnelingView';
import RunDifferentialView from '../analytics/RunDifferentialView';
import RosterCrunchView from '../roster/RosterCrunchView';
import RotationPlannerView from '../pitching/RotationPlannerView';
import SprayChartView from '../analytics/SprayChartView';
import CareerProgressionView from '../player/CareerProgressionView';
import PitchMixView from '../pitching/PitchMixView';
import DefensiveMetricsView from '../analytics/DefensiveMetricsView';
import ContractProjectionsView from '../contracts/ContractProjectionsView';
import TeamMomentumView from '../analytics/TeamMomentumView';
import ScoutingReportsView from '../scouting/ScoutingReportsView';
import DeadlineCountdownView from '../trade/DeadlineCountdownView';
import PlateDisciplineView from '../analytics/PlateDisciplineView';
import PitchCommandView from '../pitching/PitchCommandView';
import ProspectPipelineView from '../scouting/ProspectPipelineView';
import PayrollFlexibilityView from '../finance/PayrollFlexibilityView';
import MatchupExplorerView from '../analytics/MatchupExplorerView';
import DraftCapitalView from '../draft/DraftCapitalView';
import ChemistryDynamicsView from '../clubhouse/ChemistryDynamicsView';
import PitchSequenceView from '../pitching/PitchSequenceView';
import InjuryRiskView from '../medical/InjuryRiskView';
import MarketValueView from '../trade/MarketValueView';
import SituationalHittingView from '../analytics/SituationalHittingView';
import RelieverRolesView from '../pitching/RelieverRolesView';
import DevelopmentPathView from '../prospects/DevelopmentPathView';
import PitchArsenalView from '../pitching/PitchArsenalView';
import WaiverClaimsView from '../roster/WaiverClaimsView';
import GameScoreView from '../analytics/GameScoreView';
import WinProbabilityView from '../analytics/WinProbabilityView';
import ArbProjectionsView from '../contracts/ArbProjectionsView';
import DefPositioningView from '../analytics/DefPositioningView';
import BaserunningIQView from '../analytics/BaserunningIQView';
import OptionChainView from '../contracts/OptionChainView';
import ContactQualityView from '../analytics/ContactQualityView';
import BullpenFatigueView from '../pitching/BullpenFatigueView';
import TradeLeverageView from '../trade/TradeLeverageView';
import PitchDesignLabView from '../pitching/PitchDesignLabView';
import DefAlignmentView from '../analytics/DefAlignmentView';
import LuxuryTaxView from '../finance/LuxuryTaxView';
import ZoneHeatmapView from '../analytics/ZoneHeatmapView';
import ProspectGradesView from '../scouting/ProspectGradesView';
import RevenueSharingView from '../finance/RevenueSharingView';
import TunnelMatrixView from '../pitching/TunnelMatrixView';
import PlatoonSplitsView from '../analytics/PlatoonSplitsView';
import FATrackerView from '../offseason/FATrackerView';
import DefRunsSavedView from '../analytics/DefRunsSavedView';
import PitchValueMatrixView from '../pitching/PitchValueMatrixView';
import RosterConstructionView from '../analytics/RosterConstructionView';
import GameLeverageView from '../analytics/GameLeverageView';
import CatcherGameCallingView from '../analytics/CatcherGameCallingView';
import SalaryDumpView from '../finance/SalaryDumpView';
import GBFBTendenciesView from '../analytics/GBFBTendenciesView';
import PitchReleaseView from '../pitching/PitchReleaseView';
import IntlScoutingBoardView from '../scouting/IntlScoutingBoardView';
import ClutchPitchingView from '../pitching/ClutchPitchingView';
import MiLBAffiliatesView from '../minors/MiLBAffiliatesView';
import BuyoutCalculatorView from '../contracts/BuyoutCalculatorView';
import PitcherWorkloadView from '../pitching/PitcherWorkloadView';
import RunExpectancyView from '../analytics/RunExpectancyView';
import FrontOfficeView from '../management/FrontOfficeView';
import PIVIndexView from '../pitching/PIVIndexView';
import SprayDirectionView from '../analytics/SprayDirectionView';
import GMTradeHistoryView from '../management/GMTradeHistoryView';
import PitchVelocityView from '../pitching/PitchVelocityView';
import PlatoonOptView from '../analytics/PlatoonOptView';
import DraftClassScoutingView from '../scouting/DraftClassScoutingView';
import TunnelEffectivenessView from '../pitching/TunnelEffectivenessView';
import AgingCurvesView from '../analytics/AgingCurvesView';
import BullpenLeverageView from '../pitching/BullpenLeverageView';
import PowerRankHistoryView from '../analytics/PowerRankHistoryView';
import ArsenalHeatmapView from '../pitching/ArsenalHeatmapView';
import TeamDepthScoreView from '../analytics/TeamDepthScoreView';
import SalaryCapSimView from '../finance/SalaryCapSimView';
import ExpectedBAView from '../analytics/ExpectedBAView';
import DeadlineWarRoomView from '../trade/DeadlineWarRoomView';
import ProspectCompMatrixView from '../scouting/ProspectCompMatrixView';
import PitchGradingView from '../pitching/PitchGradingView';
import DefensiveWARView from '../analytics/DefensiveWARView';
import IntlScoutingBudgetView from '../scouting/IntlScoutingBudgetView';
import SwingDecisionView from '../analytics/SwingDecisionView';
import FrontOfficeBudgetView from '../management/FrontOfficeBudgetView';
import CareerMilestonesView from '../history/CareerMilestonesView';
import PitchingMatchupView from '../pitching/PitchingMatchupView';
import FranchiseValueView from '../finance/FranchiseValueView';
import MiLBStandingsView from '../minors/MiLBStandingsView';
import PlatoonMatrixView from '../analytics/PlatoonMatrixView';
import ProspectReportView from '../scouting/ProspectReportView';
import StadiumRevenueView from '../finance/StadiumRevenueView';
import SpinRateView from '../pitching/SpinRateView';
import DraftBoardView from '../draft/DraftBoardView';
import PlayerCompView from '../analytics/PlayerCompView';
import PitchLocationView from '../pitching/PitchLocationView';
import TeamPayrollHistoryView from '../finance/TeamPayrollHistoryView';
import ProspectETAView from '../scouting/ProspectETAView';
import BatterEyeView from '../analytics/BatterEyeView';
import CoachingTreeView from '../management/CoachingTreeView';
import TransactionLogView from '../history/TransactionLogView';
import PitchEffectivenessView from '../pitching/PitchEffectivenessView';
import RevenueProjectionsView from '../finance/RevenueProjectionsView';
import HOFMonitorView from '../history/HOFMonitorView';
import TunnelAnalysisView from '../pitching/TunnelAnalysisView';
import ChemistryIndexView from '../analytics/ChemistryIndexView';
import ProspectTradeValueView from '../trade/ProspectTradeValueView';
import ArsenalCompView from '../pitching/ArsenalCompView';
import SalaryComplianceView from '../finance/SalaryComplianceView';
import DynastyRankView from '../analytics/DynastyRankView';
import RelieverLevIndexView from '../pitching/RelieverLevIndexView';
import ArbProjectorView from '../contracts/ArbProjectorView';
import AwardPredictorView from '../analytics/AwardPredictorView';
import PitchMovementView from '../pitching/PitchMovementView';
import CapSpaceView from '../finance/CapSpaceView';
import FranchiseRecordsView from '../history/FranchiseRecordsView';
import CountLeverageView from '../analytics/CountLeverageView';
import CoachRatingsView from '../management/CoachRatingsView';
import MatchupHistoryView from '../history/MatchupHistoryView';
import BattingApproachView from '../analytics/BattingApproachView';
import PipelineValueView from '../minors/PipelineValueView';
import SeasonPaceView from '../analytics/SeasonPaceView';
import StarterGameLogView from '../pitching/StarterGameLogView';
import TradePackageView from '../trade/TradePackageView';
import ParkFactorView from '../analytics/ParkFactorView';
import ExitVeloView from '../analytics/ExitVeloView';
import ScoutBudgetView from '../management/ScoutBudgetView';
import PostseasonHistoryView from '../history/PostseasonHistoryView';
import BvPHistoryView from '../analytics/BvPHistoryView';
import DraftClassStrengthView from '../draft/DraftClassStrengthView';
import TeamRecordBreakdownView from '../analytics/TeamRecordBreakdownView';
import SBSuccessModelView from '../analytics/SBSuccessModelView';
import PlatoonOptEngineView from '../analytics/PlatoonOptEngineView';
import BuyoutAnalyzerView from '../contracts/BuyoutAnalyzerView';
import PitchUsageCountView from '../pitching/PitchUsageCountView';
import FOReputationView from '../management/FOReputationView';
import DefPositionMatrixView from '../analytics/DefPositionMatrixView';
import GamePaceView from '../analytics/GamePaceView';
import ExtensionCalcView from '../contracts/ExtensionCalcView';
import PitchLocationHeatmapView from '../pitching/PitchLocationHeatmapView';
import UmpireZoneView from '../analytics/UmpireZoneView';
import ProspectDevTimelineView from '../scouting/ProspectDevTimelineView';
import DeadlineValueView from '../trade/DeadlineValueView';
import StaffWorkloadCalendarView from '../pitching/StaffWorkloadCalendarView';
import TradeChipRankingView from '../trade/TradeChipRankingView';
import ClutchPerformanceView from '../analytics/ClutchPerformanceView';
import PitchTunnelMatrixView from '../pitching/PitchTunnelMatrixView';
import MiLBAwardTrackerView from '../minors/MiLBAwardTrackerView';
import WeatherImpactView from '../analytics/WeatherImpactView';
import DraftPickValueView from '../draft/DraftPickValueView';
import FranchiseHealthView from '../finance/FranchiseHealthView';
import FatigueRestView from '../analytics/FatigueRestView';
import ScoutTripPlannerView from '../scouting/ScoutTripPlannerView';
import BullpenMatchupMatrixView from '../pitching/BullpenMatchupMatrixView';
import HistoricalSeasonCompView from '../history/HistoricalSeasonCompView';
import PitcherStaminaView from '../pitching/PitcherStaminaView';
import FABiddingWarView from '../offseason/FABiddingWarView';
import DefensiveRangeView from '../analytics/DefensiveRangeView';
import PowerRankTrendView from '../analytics/PowerRankTrendView';
import InjuryRecoveryView from '../medical/InjuryRecoveryView';
import PayrollDistributionView from '../finance/PayrollDistributionView';

// ─── Navigation group definitions ───────────────────────────────────────────

interface NavGroup {
  label: string;
  items: Array<{ id: NavTab; label: string }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'GAME',
    items: [
      { id: 'dashboard', label: 'HOME' },
      { id: 'simhub', label: 'SIM HUB' },
      { id: 'scoreboard', label: 'SCOREBOARD' },
      { id: 'postgame', label: 'POST-GAME REPORT' },
      { id: 'schedule', label: 'SCHEDULE' },
      { id: 'standings', label: 'STANDINGS' },
      { id: 'playoffpicture', label: 'PLAYOFF PICTURE' },
      { id: 'bracket', label: 'PLAYOFF BRACKET' },
      { id: 'challenges', label: 'SERIES CHALLENGES' },
      { id: 'pressroom', label: 'PRESS ROOM' },
      { id: 'seasongoals', label: 'SEASON GOALS' },
      { id: 'grudges', label: 'GRUDGE & REVENGE' },
      { id: 'headlines', label: 'STAT HEADLINES' },
      { id: 'umpires', label: 'UMPIRE INTEL' },
      { id: 'weather', label: 'WEATHER' },
      { id: 'rivalries', label: 'RIVALRIES' },
      { id: 'winexpectancy', label: 'WIN EXPECTANCY' },
      { id: 'mediapersona', label: 'MEDIA PERSONA' },
      { id: 'filmstudy', label: 'FILM STUDY' },
      { id: 'pregame', label: 'PRE-GAME PREP' },
      { id: 'doubleheader', label: 'DOUBLEHEADERS' },
      { id: 'pinchhit', label: 'PINCH HIT/RUN' },
      { id: 'sbanalytics', label: 'STOLEN BASE' },
      { id: 'momentum', label: 'MOMENTUM' },
      { id: 'winprob', label: 'WIN PROBABILITY' },
      { id: 'baseruniq', label: 'BASERUNNING IQ' },
    ],
  },
  {
    label: 'TEAM',
    items: [
      { id: 'roster', label: 'ROSTER' },
      { id: 'depth', label: 'DEPTH CHART' },
      { id: 'pitching', label: 'PITCHING STAFF' },
      { id: 'fortyman', label: '40-MAN ROSTER' },
      { id: 'lineup', label: 'LINEUP' },
      { id: 'clubhouse', label: 'CLUBHOUSE' },
      { id: 'mentors', label: 'MENTOR HUB' },
      { id: 'repertoire', label: 'PITCH REPERTOIRE' },
      { id: 'fanengagement', label: 'FAN ENGAGEMENT' },
      { id: 'injuries', label: 'INJURY TRACKER' },
      { id: 'archetypes', label: 'ARCHETYPES' },
      { id: 'bullpen', label: 'BULLPEN MGMT' },
      { id: 'chemmatrix', label: 'CHEMISTRY MATRIX' },
      { id: 'septcallups', label: 'SEPT CALL-UPS' },
      { id: 'streaks', label: 'HOT/COLD STREAKS' },
      { id: 'pitchcount', label: 'PITCH COUNT' },
      { id: 'conditioning', label: 'CONDITIONING' },
      { id: 'bullpenusage', label: 'BULLPEN USAGE' },
      { id: 'tunneling', label: 'PITCH TUNNELING' },
      { id: 'rostercrunch', label: 'ROSTER CRUNCH' },
      { id: 'rotationplan', label: 'ROTATION PLAN' },
      { id: 'careerprog', label: 'CAREER CURVES' },
      { id: 'pitchmix', label: 'PITCH MIX' },
      { id: 'pitchcommand', label: 'PITCH COMMAND' },
      { id: 'chemdynamics', label: 'CHEM DYNAMICS' },
      { id: 'pitchsequence', label: 'PITCH SEQUENCE' },
      { id: 'injuryrisk', label: 'INJURY RISK' },
      { id: 'relieverroles', label: 'RELIEVER ROLES' },
      { id: 'pitcharsenal', label: 'PITCH ARSENAL' },
      { id: 'bpfatigue', label: 'BP FATIGUE' },
      { id: 'pitchdesign', label: 'PITCH DESIGN' },
      { id: 'tunnelmatrix', label: 'TUNNEL MATRIX' },
      { id: 'pitchvalues', label: 'PITCH VALUES' },
      { id: 'pitchrelease', label: 'RELEASE POINT' },
      { id: 'clutchpitching', label: 'CLUTCH PITCHING' },
      { id: 'pitcherworkload', label: 'WORKLOAD MONITOR' },
      { id: 'pivindex', label: 'PIV INDEX' },
      { id: 'velobands', label: 'VELO BANDS' },
      { id: 'tunneleffectiveness', label: 'TUNNEL EFF' },
      { id: 'bpleverageroles', label: 'BP LEVERAGE' },
      { id: 'arsenalheatmap', label: 'ARSENAL HEATMAP' },
      { id: 'pitchgrading', label: 'PITCH GRADING' },
      { id: 'pitchmatchup', label: 'PITCH MATCHUP' },
      { id: 'spinrate', label: 'SPIN RATE' },
      { id: 'pitchlocation', label: 'PITCH LOCATION' },
      { id: 'pitcheffcount', label: 'PITCH EFF/COUNT' },
      { id: 'tunnelanalysis', label: 'TUNNEL ANALYSIS' },
      { id: 'arsenalcomp', label: 'ARSENAL COMP' },
      { id: 'rlevindex', label: 'RELIEVER LEV' },
      { id: 'pitchmovement', label: 'PITCH MOVEMENT' },
      { id: 'startergamelog', label: 'STARTER GAME LOG' },
      { id: 'pitchusagecount', label: 'PITCH BY COUNT' },
      { id: 'pitchlocalheatmap', label: 'PITCH LOC HEATMAP' },
      { id: 'staffworkload', label: 'STAFF WORKLOAD' },
      { id: 'pitchtunnelmatrix', label: 'TUNNEL MATRIX+' },
      { id: 'bpmatchup', label: 'BP MATCHUP' },
      { id: 'pitcherstamina', label: 'STAMINA TRACKER' },
    ],
  },
  {
    label: 'MOVES',
    items: [
      { id: 'offseason', label: 'OFFSEASON HUB' },
      { id: 'trades', label: 'TRADE CENTER' },
      { id: 'tradeblock', label: 'TRADE BLOCK' },
      { id: 'tradefinder', label: 'TRADE FINDER' },
      { id: 'deadline', label: 'DEADLINE RECAP' },
      { id: 'freeagents', label: 'FA MARKET' },
      { id: 'waivers', label: 'WAIVER WIRE' },
      { id: 'extensions', label: 'EXTENSIONS' },
      { id: 'draft', label: 'DRAFT' },
      { id: 'rule5', label: 'RULE 5' },
      { id: 'springtraining', label: 'SPRING TRAINING' },
      { id: 'holdouts', label: 'HOLDOUTS' },
      { id: 'incentives', label: 'INCENTIVES' },
      { id: 'arbitration', label: 'ARBITRATION' },
      { id: 'offseasonevents', label: 'OFFSEASON EVENTS' },
      { id: 'traderumors', label: 'TRADE RUMORS' },
      { id: 'comppicks', label: 'COMP PICKS' },
      { id: 'qualifyingoffer', label: 'QUALIFYING OFFER' },
      { id: 'tradecalc', label: 'TRADE CALCULATOR' },
      { id: 'deadlinecountdown', label: 'DEADLINE COUNTDOWN' },
      { id: 'marketvalue', label: 'MARKET VALUE' },
      { id: 'waiverclaims', label: 'WAIVER CLAIMS' },
      { id: 'arbprojections', label: 'ARB PROJECTIONS' },
      { id: 'optionchain', label: 'OPTION CHAIN' },
      { id: 'tradeleverage', label: 'TRADE LEVERAGE' },
      { id: 'fatracker', label: 'FA TRACKER' },
      { id: 'buyoutcalc', label: 'BUYOUT CALC' },
      { id: 'deadlinewarroom', label: 'WAR ROOM' },
      { id: 'draftboard', label: 'DRAFT BOARD' },
      { id: 'prospectvalue', label: 'PROSPECT VALUE' },
      { id: 'arbprojector', label: 'ARB PROJECTOR' },
      { id: 'tradepackage', label: 'TRADE PACKAGES' },
      { id: 'draftclassstrength', label: 'DRAFT CLASS' },
      { id: 'buyoutanalyzer', label: 'BUYOUT ANALYZER' },
      { id: 'extensioncalc', label: 'EXTENSION CALC' },
      { id: 'deadlinevalue', label: 'DEADLINE VALUE' },
      { id: 'tradechiprankig', label: 'TRADE CHIP RANK' },
      { id: 'draftpickvalue', label: 'DRAFT PICK VALUE' },
      { id: 'fabiddingwar', label: 'FA BIDDING WAR' },
    ],
  },
  {
    label: 'STATS',
    items: [
      { id: 'stats', label: 'LEADERBOARDS' },
      { id: 'analytics', label: 'ADVANCED STATS' },
      { id: 'awards', label: 'AWARD RACES' },
      { id: 'triplecrown', label: 'TRIPLE CROWN' },
      { id: 'rankings', label: 'POWER RANKINGS' },
      { id: 'compare', label: 'PLAYER COMPARE' },
      { id: 'teamcompare', label: 'TEAM COMPARE' },
      { id: 'teamsnapshot', label: 'TEAM SNAPSHOT' },
      { id: 'rostercompare', label: 'ROSTER COMPARE' },
      { id: 'chemistry', label: 'CHEMISTRY' },
      { id: 'dynasty', label: 'DYNASTY ANALYTICS' },
      { id: 'platoons', label: 'PLATOON SPLITS' },
      { id: 'awardpredictions', label: 'AWARD PREDICTIONS' },
      { id: 'parks', label: 'BALLPARKS' },
      { id: 'warbreakdown', label: 'WAR BREAKDOWN' },
      { id: 'catcherframing', label: 'CATCHER FRAMING' },
      { id: 'defshifts', label: 'DEF POSITIONING' },
      { id: 'lineupopt', label: 'LINEUP OPTIMIZER' },
      { id: 'platoonadv', label: 'PLATOON MATRIX' },
      { id: 'batprofile', label: 'BATTED BALL' },
      { id: 'clutchindex', label: 'CLUTCH INDEX' },
      { id: 'rundiff', label: 'RUN DIFFERENTIAL' },
      { id: 'spraychart', label: 'SPRAY CHARTS' },
      { id: 'defmetrics', label: 'DEF METRICS' },
      { id: 'platediscipline', label: 'PLATE DISCIPLINE' },
      { id: 'matchupexplorer', label: 'MATCHUP EXPLORER' },
      { id: 'situational', label: 'SITUATIONAL' },
      { id: 'gamescore', label: 'GAME SCORE' },
      { id: 'defpositioning', label: 'DEF POSITIONING' },
      { id: 'contactquality', label: 'CONTACT QUALITY' },
      { id: 'defalignment', label: 'DEF ALIGNMENT' },
      { id: 'zoneheatmap', label: 'ZONE HEATMAP' },
      { id: 'platoonsplits', label: 'PLATOON SPLITS+' },
      { id: 'defruns', label: 'DEF RUNS SAVED' },
      { id: 'rosterconstruction', label: 'ROSTER BUILD' },
      { id: 'gameleverage', label: 'GAME LEVERAGE' },
      { id: 'catchercalling', label: 'CATCHER CALLING' },
      { id: 'gbfb', label: 'GB/FB TENDENCY' },
      { id: 'runexpectancy', label: 'RUN EXPECTANCY' },
      { id: 'spraydirection', label: 'SPRAY DIRECTION' },
      { id: 'platoonopt', label: 'PLATOON OPT' },
      { id: 'agingcurves', label: 'AGING CURVES' },
      { id: 'rankhistory', label: 'RANK HISTORY' },
      { id: 'teamdepth', label: 'TEAM DEPTH' },
      { id: 'expectedba', label: 'EXPECTED BA' },
      { id: 'defwar', label: 'DEF WAR' },
      { id: 'swingdecision', label: 'SWING DECISION' },
      { id: 'platoonmatrix', label: 'PLATOON MATRIX' },
      { id: 'playercomp', label: 'PLAYER COMP' },
      { id: 'battereye', label: 'BATTER EYE' },
      { id: 'chemindex', label: 'CHEMISTRY INDEX' },
      { id: 'dynastyrank', label: 'DYNASTY RANK' },
      { id: 'awardpredictor', label: 'AWARD PREDICT' },
      { id: 'countleverage', label: 'COUNT LEVERAGE' },
      { id: 'battingapproach', label: 'BATTING APPROACH' },
      { id: 'seasonpace', label: 'SEASON PACE' },
      { id: 'parkfactors', label: 'PARK FACTORS' },
      { id: 'exitvelo', label: 'EXIT VELOCITY' },
      { id: 'bvphistory', label: 'BvP HISTORY' },
      { id: 'recordbreakdown', label: 'RECORD SPLITS' },
      { id: 'sbsuccessmodel', label: 'SB SUCCESS' },
      { id: 'platoonoptengine', label: 'PLATOON ENGINE' },
      { id: 'defposmatrix', label: 'DEF MATRIX' },
      { id: 'gamepace', label: 'GAME PACE' },
      { id: 'umpirezone', label: 'UMPIRE ZONES' },
      { id: 'clutchperformance', label: 'CLUTCH INDEX+' },
      { id: 'weatherimpact', label: 'WEATHER IMPACT' },
      { id: 'fatiguerest', label: 'FATIGUE & REST' },
      { id: 'defensiverange', label: 'DEF RANGE CHART' },
      { id: 'powerranktrend', label: 'RANK TREND' },
    ],
  },
  {
    label: 'ORG',
    items: [
      { id: 'finance', label: 'FINANCE' },
      { id: 'payroll', label: 'PAYROLL PLANNER' },
      { id: 'salaries', label: 'LEAGUE SALARIES' },
      { id: 'frontoffice', label: 'COACHING STAFF' },
      { id: 'carousel', label: 'COACH CAROUSEL' },
      { id: 'skilltree', label: 'SKILL TREE' },
      { id: 'gmstrategy', label: 'GM STRATEGY' },
      { id: 'prospects', label: 'PROSPECTS' },
      { id: 'scoutingboard', label: 'SCOUTING BOARD' },
      { id: 'draftscout', label: 'DRAFT INTEL' },
      { id: 'pipeline', label: 'FARM PIPELINE' },
      { id: 'devtracker', label: 'DEVELOPMENT' },
      { id: 'breakouts', label: 'BREAKOUT WATCH' },
      { id: 'scouting', label: 'OPPONENT INTEL' },
      { id: 'intl', label: 'INTL SIGNING' },
      { id: 'owner', label: 'OWNER & GOALS' },
      { id: 'gmrep', label: 'GM REPUTATION' },
      { id: 'ownerpersonality', label: 'OWNER PERSONALITY' },
      { id: 'scoutnetwork', label: 'SCOUT NETWORK' },
      { id: 'minors', label: 'MINOR LEAGUES' },
      { id: 'stadium', label: 'STADIUM UPGRADES' },
      { id: 'salarybreakdown', label: 'SALARY BREAKDOWN' },
      { id: 'prospectgrad', label: 'PROSPECT GRAD' },
      { id: 'staffpoaching', label: 'STAFF POACHING' },
      { id: 'unlocks', label: 'UNLOCKS' },
      { id: 'servicetime', label: 'SERVICE TIME' },
      { id: 'contractproj', label: 'CONTRACT PROJ' },
      { id: 'scoutreports', label: 'SCOUTING REPORTS' },
      { id: 'prospectpipeline', label: 'PROSPECT PIPELINE' },
      { id: 'payrollflex', label: 'PAYROLL FLEX' },
      { id: 'draftcapital', label: 'DRAFT CAPITAL' },
      { id: 'devpath', label: 'DEV PATHS' },
      { id: 'luxurytax', label: 'LUXURY TAX' },
      { id: 'prospectgrades', label: 'PROSPECT GRADES' },
      { id: 'revsharing', label: 'REVENUE SHARING' },
      { id: 'salarydump', label: 'SALARY DUMP' },
      { id: 'intlscoutboard', label: 'INTL SCOUT BOARD' },
      { id: 'milbaffiliates', label: 'MILB AFFILIATES' },
      { id: 'frontoffice2', label: 'FRONT OFFICE' },
      { id: 'gmtradehistory', label: 'GM TRADE LOG' },
      { id: 'draftclassscouting', label: 'DRAFT REPORTS' },
      { id: 'salarycapsim', label: 'SALARY CAP SIM' },
      { id: 'prospectcomp', label: 'PROSPECT COMP' },
      { id: 'intlbudget', label: 'INTL BUDGET' },
      { id: 'fobudget', label: 'FO BUDGET' },
      { id: 'franchisevalue', label: 'FRANCHISE VALUE' },
      { id: 'milbstandings', label: 'MILB STANDINGS' },
      { id: 'prospectreport', label: 'SCOUT REPORTS' },
      { id: 'stadiumrevenue', label: 'STADIUM REVENUE' },
      { id: 'payrollhistory', label: 'PAYROLL HISTORY' },
      { id: 'prospecteta', label: 'PROSPECT ETA' },
      { id: 'coachingtree', label: 'COACHING TREE' },
      { id: 'revprojections', label: 'REVENUE PROJ' },
      { id: 'salcompliance', label: 'CBT COMPLIANCE' },
      { id: 'capspace', label: 'CAP SPACE' },
      { id: 'coachratings', label: 'COACH RATINGS' },
      { id: 'pipelinevalue', label: 'PIPELINE VALUE' },
      { id: 'scoutbudget', label: 'SCOUT BUDGET' },
      { id: 'foreputation', label: 'FO REPUTATION' },
      { id: 'prospectdevtimeline', label: 'PROSPECT DEV' },
      { id: 'milbawardtracker', label: 'MILB AWARDS' },
      { id: 'scouttrip', label: 'SCOUT TRIPS' },
      { id: 'franchisehealth', label: 'FINANCIAL HEALTH' },
      { id: 'payrolldist', label: 'PAYROLL DIST' },
    ],
  },
  {
    label: 'HISTORY',
    items: [
      { id: 'franchise', label: 'FRANCHISE' },
      { id: 'recap', label: 'SEASON RECAP' },
      { id: 'timeline', label: 'TIMELINE' },
      { id: 'newsfeed', label: 'NEWS FEED' },
      { id: 'storyarcs', label: 'STORY ARCS' },
      { id: 'awardsgallery', label: 'AWARDS GALLERY' },
      { id: 'milestones', label: 'MILESTONES' },
      { id: 'history', label: 'TRANSACTIONS' },
      { id: 'records', label: 'RECORDS & HOF' },
      { id: 'ringofhonor', label: 'RING OF HONOR' },
      { id: 'legacy', label: 'LEGACY SCORE' },
      { id: 'alltimerecords', label: 'ALL-TIME RECORDS' },
      { id: 'retirement', label: 'RETIREMENT WATCH' },
      { id: 'mgrlegacy', label: 'MANAGER LEGACY' },
      { id: 'careermilestones', label: 'CAREER MILESTONES' },
      { id: 'txnlog', label: 'TRANSACTION LOG' },
      { id: 'hofmonitor', label: 'HOF MONITOR' },
      { id: 'franchrecords', label: 'FRANCHISE REC' },
      { id: 'matchuphistory', label: 'MATCHUP HISTORY' },
      { id: 'postseasonhistory', label: 'POSTSEASON' },
      { id: 'historicalseasoncomp', label: 'SEASON COMP' },
      { id: 'injuryrecovery', label: 'INJURY RECOVERY' },
    ],
  },
];

// ─── Dropdown component ─────────────────────────────────────────────────────

function NavDropdown({
  group,
  activeTab,
  setActiveTab,
  openGroup,
  setOpenGroup,
}: {
  group: NavGroup;
  activeTab: NavTab;
  setActiveTab: (t: NavTab) => void;
  openGroup: string | null;
  setOpenGroup: (g: string | null) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isGroupActive = group.items.some(i => i.id === activeTab);
  const isOpen = openGroup === group.label;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        if (isOpen) setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, setOpenGroup]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpenGroup(isOpen ? null : group.label)}
        className={[
          'px-3 py-2 text-xs font-bold tracking-wider uppercase transition-colors whitespace-nowrap flex items-center gap-1',
          isGroupActive
            ? 'bg-orange-900/40 text-orange-400 border-b-2 border-b-orange-500'
            : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900',
        ].join(' ')}
      >
        {group.label}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 min-w-[11rem] bg-gray-900 border border-gray-700 shadow-xl shadow-black/50">
          {group.items.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setOpenGroup(null);
              }}
              className={[
                'block w-full text-left px-3 py-1.5 text-xs font-bold tracking-wider transition-colors',
                activeTab === item.id
                  ? 'bg-orange-900/40 text-orange-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800',
              ].join(' ')}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Player search ──────────────────────────────────────────────────────────

function PlayerSearch({ onSelect }: { onSelect: (id: number) => void }) {
  const { gameStarted } = useGameStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ playerId: number; name: string; position: string; teamAbbr: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!gameStarted || query.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await getEngine().searchPlayers(query);
        setResults(res);
        setShowResults(true);
      } catch {
        setResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, gameStarted]);

  if (!gameStarted) return null;

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        placeholder="Search players..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowResults(true)}
        className="bg-gray-900 border border-gray-700 text-gray-300 text-xs px-2 py-1 w-40 rounded focus:outline-none focus:border-orange-500 placeholder-gray-600"
      />
      {showResults && results.length > 0 && (
        <div className="absolute top-full right-0 z-50 min-w-[14rem] bg-gray-900 border border-gray-700 shadow-xl shadow-black/50 max-h-48 overflow-y-auto mt-0.5">
          {results.map(r => (
            <button
              key={r.playerId}
              onClick={() => {
                onSelect(r.playerId);
                setShowResults(false);
                setQuery('');
              }}
              className="block w-full text-left px-3 py-1.5 text-xs hover:bg-gray-800 transition-colors"
            >
              <span className="text-orange-300 font-bold">{r.name}</span>
              <span className="text-gray-600 ml-2">{r.position}</span>
              <span className="text-gray-700 ml-1">{r.teamAbbr}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Shell ─────────────────────────────────────────────────────────────

export default function Shell() {
  const { activeTab, setActiveTab, setSelectedPlayer } = useUIStore();
  const { season, isSimulating, simProgress } = useGameStore();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const handlePlayerSearch = (id: number) => {
    setSelectedPlayer(id);
    setActiveTab('profile');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <Dashboard />;
      case 'scoreboard':   return <Scoreboard />;
      case 'standings':    return <StandingsView />;
      case 'roster':       return <RosterView />;
      case 'trades':       return <TradeCenter />;
      case 'freeagents':   return <FreeAgentMarket />;
      case 'lineup':       return <LineupEditor />;
      case 'draft':        return <DraftRoom />;
      case 'prospects':    return <ProspectRankingsView />;
      case 'finance':      return <FinanceDashboard />;
      case 'analytics':    return <AdvancedStats />;
      case 'frontoffice':  return <CoachingStaffView />;
      case 'history':      return <InjuryTransactions />;
      case 'stats':        return <Leaderboards />;
      case 'compare':      return <PlayerComparison allPlayers={[]} />;
      case 'rankings':     return <PowerRankings />;
      case 'awards':       return <AwardRaces />;
      case 'teamcompare':  return <TeamComparison />;
      case 'franchise':    return <FranchiseOverview />;
      case 'records':      return <HallOfFame />;
      case 'depth':        return <DepthChart />;
      case 'fortyman':     return <FortyManRoster />;
      case 'deadline':     return <TradeDeadlineRecap />;
      case 'waivers':      return <WaiverWire />;
      case 'extensions':   return <ExtensionCenter />;
      case 'owner':        return <OwnerDashboard />;
      case 'intl':         return <IntlProspects />;
      case 'simhub':       return <SimHub />;
      case 'rule5':        return <Rule5Protection />;
      case 'chemistry':    return <TeamChemistry />;
      case 'salaries':     return <LeagueSalaries />;
      case 'recap':        return <SeasonRecap />;
      case 'rostercompare': return <RosterComparison />;
      case 'schedule':     return <TeamSchedule />;
      case 'pipeline':     return <FarmPipeline />;
      case 'tradefinder':  return <TradeFinder />;
      case 'devtracker':   return <DevelopmentTracker />;
      case 'playoffpicture': return <PlayoffPicture />;
      case 'timeline':     return <SeasonTimeline />;
      case 'payroll':      return <PayrollPlanner />;
      case 'pitching':     return <PitchingStaff />;
      case 'newsfeed':     return <NewsFeed />;
      case 'triplecrown':  return <TripleCrownTracker />;
      case 'teamsnapshot':  return <TeamSnapshot />;
      case 'scoutingboard': return <ProspectScoutingBoard />;
      case 'offseason':    return <OffseasonHub />;
      case 'milestones':   return <MilestoneTracker />;
      case 'awardsgallery': return <AwardsGallery />;
      case 'dynasty':      return <DynastyDashboard />;
      case 'postgame':     return <PostGameReport report={null} />;
      case 'gmstrategy':   return <GMStrategyPanel />;
      case 'skilltree':    return <CoachSkillTree />;
      case 'breakouts':    return <BreakoutTracker />;
      case 'scouting':     return <OpponentScouting />;
      case 'storyarcs':    return <StoryArcViewer />;
      case 'springtraining': return <SpringTraining />;
      case 'ringofhonor':  return <RingOfHonor />;
      case 'challenges':   return <SeriesChallenges />;
      case 'clubhouse':    return <ClubhouseEvents />;
      case 'mentors':      return <MentorHub />;
      case 'gmrep':        return <GMReputationView />;
      case 'holdouts':     return <HoldoutCenter />;
      case 'offseasonevents': return <OffseasonEventsView />;
      case 'legacy':       return <FranchiseLegacyView />;
      case 'pressroom':    return <PressRoom />;
      case 'seasongoals':  return <SeasonGoalsView />;
      case 'salarybreakdown': return <SalaryBreakdown />;
      case 'repertoire':  return <PitchRepertoireView />;
      case 'tradeblock':  return <TradeBlockManager />;
      case 'draftscout':  return <DraftScoutBoardView />;
      case 'platoons':   return <PlatoonMatchupsView />;
      case 'alltimerecords': return <AllTimeRecordsView />;
      case 'carousel':   return <CoachCarouselView />;
      case 'awardpredictions': return <AwardPredictions />;
      case 'fanengagement': return <FanEngagementView />;
      case 'injuries':   return <InjuryTrackerView />;
      case 'archetypes': return <PlayerArchetypesView />;
      case 'grudges':    return <GrudgeRevengeView />;
      case 'ownerpersonality': return <OwnerPersonalityView />;
      case 'headlines': return <HeadlineTickerView />;
      case 'incentives': return <IncentiveTracker />;
      case 'bracket':  return <BracketView />;
      case 'bullpen':  return <BullpenView />;
      case 'stadium':  return <StadiumUpgradesView />;
      case 'scoutnetwork': return <ScoutNetworkView />;
      case 'umpires':  return <UmpireView />;
      case 'weather':  return <WeatherView />;
      case 'rivalries': return <RivalryView />;
      case 'minors':    return <MinorLeagueView />;
      case 'chemmatrix': return <ChemistryMatrixView />;
      case 'arbitration': return <ArbitrationView />;
      case 'traderumors': return <TradeRumorBoard />;
      case 'retirement': return <RetirementWatchView />;
      case 'prospectgrad': return <ProspectGraduationView />;
      case 'winexpectancy': return <WinExpectancyView />;
      case 'staffpoaching': return <StaffPoachingView />;
      case 'mediapersona': return <MediaPersonaView />;
      case 'filmstudy': return <FilmStudyView />;
      case 'comppicks': return <CompPicksView />;
      case 'qualifyingoffer': return <QualifyingOfferView />;
      case 'unlocks': return <UnlocksView />;
      case 'mgrlegacy': return <ManagerLegacyView />;
      case 'pregame': return <BattingPracticeView />;
      case 'septcallups': return <SeptemberCallupsView />;
      case 'servicetime': return <ServiceTimeView />;
      case 'streaks': return <HotColdStreaksView />;
      case 'warbreakdown': return <WARBreakdownView />;
      case 'pitchcount': return <PitchCountView />;
      case 'doubleheader': return <DoubleHeaderView />;
      case 'catcherframing': return <CatcherFramingView />;
      case 'defshifts': return <DefensiveShiftsView />;
      case 'tradecalc': return <TradeCalculatorView />;
      case 'pinchhit': return <PinchHitView />;
      case 'lineupopt': return <LineupOptimizerView />;
      case 'conditioning': return <PlayerConditioningView />;
      case 'sbanalytics': return <StolenBaseAnalyticsView />;
      case 'bullpenusage': return <BullpenUsageView />;
      case 'platoonadv': return <PlatoonAdvantageView />;
      case 'batprofile': return <BatProfileView />;
      case 'clutchindex': return <ClutchIndexView />;
      case 'tunneling': return <PitchTunnelingView />;
      case 'rundiff': return <RunDifferentialView />;
      case 'rostercrunch': return <RosterCrunchView />;
      case 'rotationplan': return <RotationPlannerView />;
      case 'spraychart': return <SprayChartView />;
      case 'careerprog': return <CareerProgressionView />;
      case 'pitchmix': return <PitchMixView />;
      case 'defmetrics': return <DefensiveMetricsView />;
      case 'contractproj': return <ContractProjectionsView />;
      case 'momentum': return <TeamMomentumView />;
      case 'scoutreports': return <ScoutingReportsView />;
      case 'deadlinecountdown': return <DeadlineCountdownView />;
      case 'platediscipline': return <PlateDisciplineView />;
      case 'pitchcommand': return <PitchCommandView />;
      case 'prospectpipeline': return <ProspectPipelineView />;
      case 'payrollflex': return <PayrollFlexibilityView />;
      case 'matchupexplorer': return <MatchupExplorerView />;
      case 'draftcapital': return <DraftCapitalView />;
      case 'chemdynamics': return <ChemistryDynamicsView />;
      case 'pitchsequence': return <PitchSequenceView />;
      case 'injuryrisk': return <InjuryRiskView />;
      case 'marketvalue': return <MarketValueView />;
      case 'situational': return <SituationalHittingView />;
      case 'relieverroles': return <RelieverRolesView />;
      case 'devpath': return <DevelopmentPathView />;
      case 'pitcharsenal': return <PitchArsenalView />;
      case 'waiverclaims': return <WaiverClaimsView />;
      case 'gamescore': return <GameScoreView />;
      case 'winprob': return <WinProbabilityView />;
      case 'arbprojections': return <ArbProjectionsView />;
      case 'defpositioning': return <DefPositioningView />;
      case 'baseruniq': return <BaserunningIQView />;
      case 'optionchain': return <OptionChainView />;
      case 'contactquality': return <ContactQualityView />;
      case 'bpfatigue': return <BullpenFatigueView />;
      case 'tradeleverage': return <TradeLeverageView />;
      case 'pitchdesign': return <PitchDesignLabView />;
      case 'defalignment': return <DefAlignmentView />;
      case 'luxurytax': return <LuxuryTaxView />;
      case 'zoneheatmap': return <ZoneHeatmapView />;
      case 'prospectgrades': return <ProspectGradesView />;
      case 'revsharing': return <RevenueSharingView />;
      case 'tunnelmatrix': return <TunnelMatrixView />;
      case 'platoonsplits': return <PlatoonSplitsView />;
      case 'fatracker': return <FATrackerView />;
      case 'defruns': return <DefRunsSavedView />;
      case 'pitchvalues': return <PitchValueMatrixView />;
      case 'rosterconstruction': return <RosterConstructionView />;
      case 'gameleverage': return <GameLeverageView />;
      case 'catchercalling': return <CatcherGameCallingView />;
      case 'salarydump': return <SalaryDumpView />;
      case 'gbfb': return <GBFBTendenciesView />;
      case 'pitchrelease': return <PitchReleaseView />;
      case 'intlscoutboard': return <IntlScoutingBoardView />;
      case 'clutchpitching': return <ClutchPitchingView />;
      case 'milbaffiliates': return <MiLBAffiliatesView />;
      case 'buyoutcalc': return <BuyoutCalculatorView />;
      case 'pitcherworkload': return <PitcherWorkloadView />;
      case 'runexpectancy': return <RunExpectancyView />;
      case 'frontoffice2': return <FrontOfficeView />;
      case 'pivindex': return <PIVIndexView />;
      case 'spraydirection': return <SprayDirectionView />;
      case 'gmtradehistory': return <GMTradeHistoryView />;
      case 'velobands': return <PitchVelocityView />;
      case 'platoonopt': return <PlatoonOptView />;
      case 'draftclassscouting': return <DraftClassScoutingView />;
      case 'tunneleffectiveness': return <TunnelEffectivenessView />;
      case 'agingcurves': return <AgingCurvesView />;
      case 'bpleverageroles': return <BullpenLeverageView />;
      case 'rankhistory': return <PowerRankHistoryView />;
      case 'arsenalheatmap': return <ArsenalHeatmapView />;
      case 'teamdepth': return <TeamDepthScoreView />;
      case 'salarycapsim': return <SalaryCapSimView />;
      case 'expectedba': return <ExpectedBAView />;
      case 'deadlinewarroom': return <DeadlineWarRoomView />;
      case 'prospectcomp': return <ProspectCompMatrixView />;
      case 'pitchgrading': return <PitchGradingView />;
      case 'defwar': return <DefensiveWARView />;
      case 'intlbudget': return <IntlScoutingBudgetView />;
      case 'swingdecision': return <SwingDecisionView />;
      case 'fobudget': return <FrontOfficeBudgetView />;
      case 'careermilestones': return <CareerMilestonesView />;
      case 'pitchmatchup': return <PitchingMatchupView />;
      case 'franchisevalue': return <FranchiseValueView />;
      case 'milbstandings': return <MiLBStandingsView />;
      case 'platoonmatrix': return <PlatoonMatrixView />;
      case 'prospectreport': return <ProspectReportView />;
      case 'stadiumrevenue': return <StadiumRevenueView />;
      case 'spinrate': return <SpinRateView />;
      case 'draftboard': return <DraftBoardView />;
      case 'playercomp': return <PlayerCompView />;
      case 'pitchlocation': return <PitchLocationView />;
      case 'payrollhistory': return <TeamPayrollHistoryView />;
      case 'prospecteta': return <ProspectETAView />;
      case 'battereye': return <BatterEyeView />;
      case 'coachingtree': return <CoachingTreeView />;
      case 'txnlog': return <TransactionLogView />;
      case 'pitcheffcount': return <PitchEffectivenessView />;
      case 'revprojections': return <RevenueProjectionsView />;
      case 'hofmonitor': return <HOFMonitorView />;
      case 'tunnelanalysis': return <TunnelAnalysisView />;
      case 'chemindex': return <ChemistryIndexView />;
      case 'prospectvalue': return <ProspectTradeValueView />;
      case 'arsenalcomp': return <ArsenalCompView />;
      case 'salcompliance': return <SalaryComplianceView />;
      case 'dynastyrank': return <DynastyRankView />;
      case 'rlevindex': return <RelieverLevIndexView />;
      case 'arbprojector': return <ArbProjectorView />;
      case 'awardpredictor': return <AwardPredictorView />;
      case 'pitchmovement': return <PitchMovementView />;
      case 'capspace': return <CapSpaceView />;
      case 'franchrecords': return <FranchiseRecordsView />;
      case 'countleverage': return <CountLeverageView />;
      case 'coachratings': return <CoachRatingsView />;
      case 'matchuphistory': return <MatchupHistoryView />;
      case 'battingapproach': return <BattingApproachView />;
      case 'pipelinevalue': return <PipelineValueView />;
      case 'seasonpace': return <SeasonPaceView />;
      case 'startergamelog': return <StarterGameLogView />;
      case 'tradepackage': return <TradePackageView />;
      case 'parkfactors': return <ParkFactorView />;
      case 'exitvelo': return <ExitVeloView />;
      case 'scoutbudget': return <ScoutBudgetView />;
      case 'postseasonhistory': return <PostseasonHistoryView />;
      case 'bvphistory': return <BvPHistoryView />;
      case 'draftclassstrength': return <DraftClassStrengthView />;
      case 'recordbreakdown': return <TeamRecordBreakdownView />;
      case 'sbsuccessmodel': return <SBSuccessModelView />;
      case 'platoonoptengine': return <PlatoonOptEngineView />;
      case 'buyoutanalyzer': return <BuyoutAnalyzerView />;
      case 'pitchusagecount': return <PitchUsageCountView />;
      case 'foreputation': return <FOReputationView />;
      case 'defposmatrix': return <DefPositionMatrixView />;
      case 'gamepace': return <GamePaceView />;
      case 'extensioncalc': return <ExtensionCalcView />;
      case 'pitchlocalheatmap': return <PitchLocationHeatmapView />;
      case 'umpirezone': return <UmpireZoneView />;
      case 'prospectdevtimeline': return <ProspectDevTimelineView />;
      case 'deadlinevalue': return <DeadlineValueView />;
      case 'staffworkload': return <StaffWorkloadCalendarView />;
      case 'tradechiprankig': return <TradeChipRankingView />;
      case 'clutchperformance': return <ClutchPerformanceView />;
      case 'pitchtunnelmatrix': return <PitchTunnelMatrixView />;
      case 'milbawardtracker': return <MiLBAwardTrackerView />;
      case 'weatherimpact': return <WeatherImpactView />;
      case 'draftpickvalue': return <DraftPickValueView />;
      case 'franchisehealth': return <FranchiseHealthView />;
      case 'fatiguerest': return <FatigueRestView />;
      case 'scouttrip': return <ScoutTripPlannerView />;
      case 'bpmatchup': return <BullpenMatchupMatrixView />;
      case 'historicalseasoncomp': return <HistoricalSeasonCompView />;
      case 'pitcherstamina': return <PitcherStaminaView />;
      case 'fabiddingwar': return <FABiddingWarView />;
      case 'defensiverange': return <DefensiveRangeView />;
      case 'powerranktrend': return <PowerRankTrendView />;
      case 'injuryrecovery': return <InjuryRecoveryView />;
      case 'payrolldist': return <PayrollDistributionView />;
      case 'parks':        return <div className="p-4"><ParkComparisonView /></div>;
      case 'profile':      return <PlayerProfile />;
      default:             return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      {/* ── Header bar ──────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-4 py-2 bg-black border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-orange-500 font-bold text-sm tracking-widest cursor-pointer"
            onClick={() => setActiveTab('dashboard')}>
            MR. BASEBALL DYNASTY
          </span>
          <span className="text-gray-600 text-xs">SEASON {season}</span>
        </div>
        <div className="flex items-center gap-3">
          {isSimulating && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-1.5 bg-gray-800 rounded overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-200"
                  style={{ width: `${Math.round(simProgress * 100)}%` }}
                />
              </div>
              <span className="text-orange-400 text-xs animate-pulse">SIMULATING</span>
            </div>
          )}
          <PlayerSearch onSelect={handlePlayerSearch} />
        </div>
      </header>

      {/* ── Nav bar with grouped dropdowns ──────────────────────────── */}
      <nav className="flex items-center border-b border-gray-800 bg-gray-950 shrink-0">
        {NAV_GROUPS.map(group => (
          <NavDropdown
            key={group.label}
            group={group}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openGroup={openGroup}
            setOpenGroup={setOpenGroup}
          />
        ))}
        {/* Player tab — always visible when active */}
        {activeTab === 'profile' && (
          <button
            className="px-3 py-2 text-xs font-bold tracking-wider uppercase bg-orange-900/40 text-orange-400 border-b-2 border-b-orange-500 whitespace-nowrap ml-auto"
          >
            PLAYER
          </button>
        )}
      </nav>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}
