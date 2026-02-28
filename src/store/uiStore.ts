import { create } from 'zustand';

export type NavTab = 'dashboard' | 'standings' | 'roster' | 'stats' | 'profile' | 'trades' | 'freeagents' | 'lineup' | 'draft' | 'prospects' | 'finance' | 'history' | 'analytics' | 'frontoffice' | 'compare' | 'parks' | 'rankings' | 'records' | 'depth' | 'teamcompare' | 'scoreboard' | 'awards' | 'franchise' | 'fortyman' | 'deadline' | 'waivers' | 'extensions' | 'owner' | 'intl' | 'simhub' | 'rule5' | 'chemistry' | 'salaries' | 'recap' | 'rostercompare' | 'schedule' | 'pipeline' | 'tradefinder' | 'devtracker' | 'playoffpicture' | 'timeline' | 'payroll' | 'pitching' | 'newsfeed' | 'triplecrown' | 'teamsnapshot' | 'scoutingboard' | 'offseason' | 'milestones' | 'awardsgallery' | 'dynasty' | 'postgame' | 'gmstrategy' | 'skilltree' | 'breakouts' | 'scouting' | 'storyarcs' | 'springtraining' | 'ringofhonor' | 'challenges' | 'clubhouse' | 'mentors' | 'gmrep' | 'holdouts' | 'offseasonevents' | 'legacy' | 'pressroom' | 'seasongoals' | 'salarybreakdown' | 'repertoire' | 'tradeblock' | 'draftscout' | 'platoons' | 'alltimerecords' | 'carousel' | 'awardpredictions' | 'fanengagement' | 'injuries' | 'archetypes' | 'grudges' | 'ownerpersonality' | 'headlines' | 'incentives' | 'bracket' | 'bullpen' | 'stadium' | 'scoutnetwork' | 'umpires' | 'weather' | 'rivalries' | 'minors' | 'chemmatrix' | 'arbitration' | 'traderumors' | 'retirement' | 'prospectgrad' | 'winexpectancy' | 'staffpoaching' | 'mediapersona' | 'filmstudy' | 'comppicks' | 'qualifyingoffer' | 'unlocks' | 'mgrlegacy' | 'pregame' | 'septcallups' | 'servicetime' | 'streaks' | 'warbreakdown' | 'pitchcount' | 'doubleheader' | 'catcherframing' | 'defshifts' | 'tradecalc' | 'pinchhit' | 'lineupopt' | 'conditioning' | 'sbanalytics' | 'bullpenusage' | 'platoonadv' | 'batprofile' | 'clutchindex' | 'tunneling' | 'rundiff' | 'rostercrunch' | 'rotationplan' | 'spraychart' | 'careerprog' | 'pitchmix' | 'defmetrics' | 'contractproj' | 'momentum' | 'scoutreports' | 'deadlinecountdown' | 'platediscipline' | 'pitchcommand' | 'prospectpipeline' | 'payrollflex' | 'matchupexplorer' | 'draftcapital' | 'chemdynamics' | 'pitchsequence' | 'injuryrisk' | 'marketvalue' | 'situational' | 'relieverroles' | 'devpath' | 'pitcharsenal' | 'waiverclaims' | 'gamescore' | 'winprob' | 'arbprojections' | 'defpositioning' | 'baseruniq' | 'optionchain' | 'contactquality' | 'bpfatigue' | 'tradeleverage' | 'pitchdesign' | 'defalignment' | 'luxurytax' | 'zoneheatmap' | 'prospectgrades' | 'revsharing' | 'tunnelmatrix' | 'platoonsplits' | 'fatracker' | 'defruns' | 'pitchvalues' | 'rosterconstruction' | 'gameleverage' | 'catchercalling' | 'salarydump' | 'gbfb' | 'pitchrelease' | 'intlscoutboard' | 'clutchpitching' | 'milbaffiliates' | 'buyoutcalc' | 'pitcherworkload' | 'runexpectancy' | 'frontoffice2' | 'pivindex' | 'spraydirection' | 'gmtradehistory' | 'velobands' | 'platoonopt' | 'draftclassscouting' | 'tunneleffectiveness' | 'agingcurves' | 'bpleverageroles' | 'rankhistory' | 'arsenalheatmap' | 'teamdepth' | 'salarycapsim' | 'expectedba' | 'deadlinewarroom' | 'prospectcomp' | 'pitchgrading' | 'defwar' | 'intlbudget' | 'swingdecision' | 'fobudget' | 'careermilestones' | 'pitchmatchup' | 'franchisevalue' | 'milbstandings' | 'platoonmatrix' | 'prospectreport' | 'stadiumrevenue' | 'spinrate' | 'draftboard' | 'playercomp' | 'pitchlocation' | 'payrollhistory' | 'prospecteta' | 'battereye' | 'coachingtree' | 'txnlog' | 'pitcheffcount' | 'revprojections' | 'hofmonitor' | 'tunnelanalysis' | 'chemindex' | 'prospectvalue' | 'arsenalcomp' | 'salcompliance' | 'dynastyrank' | 'rlevindex' | 'arbprojector' | 'awardpredictor' | 'pitchmovement' | 'capspace' | 'franchrecords' | 'countleverage' | 'coachratings' | 'matchuphistory' | 'battingapproach' | 'pipelinevalue' | 'seasonpace' | 'startergamelog' | 'tradepackage' | 'parkfactors' | 'exitvelo' | 'scoutbudget' | 'postseasonhistory' | 'bvphistory' | 'draftclassstrength' | 'recordbreakdown'
| 'sbsuccessmodel' | 'platoonoptengine' | 'buyoutanalyzer'
| 'pitchusagecount' | 'foreputation' | 'defposmatrix'
| 'gamepace' | 'extensioncalc' | 'pitchlocalheatmap'
| 'umpirezone' | 'prospectdevtimeline' | 'deadlinevalue'
| 'staffworkload' | 'tradechiprankig' | 'clutchperformance'
| 'pitchtunnelmatrix' | 'milbawardtracker' | 'weatherimpact'
| 'draftpickvalue' | 'franchisehealth' | 'fatiguerest'
| 'scouttrip' | 'bpmatchup' | 'historicalseasoncomp'
| 'pitcherstamina' | 'fabiddingwar' | 'defensiverange'
| 'powerranktrend' | 'injuryrecovery' | 'payrolldist'
| 'prospectrptcard' | 'teamwinshares' | 'salarycapsim2'
| 'lineuprules' | 'relieverfatigue' | 'fanmorale'
| 'prospectgradimpact' | 'deadlinestrategy' | 'seasonsimforecast'
| 'walkrateleaders' | 'catcherpoptime' | 'rosterflex'
| 'pitchtunnelheatmap' | 'defoptimizer' | 'contractbuyout'
| 'agingprojections' | 'teamchemweb' | 'scoutreportv2'
| 'phdecision' | 'bpmatchupopt' | 'schedulestrength'
| 'battingorderimpact' | 'platoonadvtracker' | 'callupreadiness'
| 'pitchsequenceopt' | 'defreplacement' | 'revforecaster'
| 'streakpredictor' | 'deadlinetracker' | 'pitcherfatigue'
| 'pitcharsenalcomp' | 'winprobchart' | 'milbdevplan'
| 'sithittingsplits' | 'tradedeadlinesim' | 'prospectscoutdash'
| 'teammoraletracker' | 'contractneg' | 'advdefmetrics'
| 'injuryprediction' | 'bpusageopt' | 'farmsystemgrader'
| 'clutchperf2' | 'offseasonplan' | 'runneradvancement'
| 'pitchtipdetector' | 'salaryarbpredictor' | 'teamtrend';

interface UIStore {
  activeTab: NavTab;
  selectedTeamId: number | null;
  selectedPlayerId: number | null;
  leaderboardStat: string;
  modalOpen: string | null;
  setActiveTab: (t: NavTab) => void;
  setSelectedTeam: (id: number | null) => void;
  setSelectedPlayer: (id: number | null) => void;
  setLeaderboardStat: (s: string) => void;
  setModal: (name: string | null) => void;
}

export const useUIStore = create<UIStore>(set => ({
  activeTab: 'dashboard',
  selectedTeamId: null,
  selectedPlayerId: null,
  leaderboardStat: 'hr',
  modalOpen: null,
  setActiveTab: t => set({ activeTab: t }),
  setSelectedTeam: id => set({ selectedTeamId: id }),
  setSelectedPlayer: id => set({ selectedPlayerId: id }),
  setLeaderboardStat: s => set({ leaderboardStat: s }),
  setModal: name => set({ modalOpen: name }),
}));
