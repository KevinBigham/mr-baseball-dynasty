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
