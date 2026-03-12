/** One-line explanations of advanced stats for column header tooltips. */
export const STAT_GLOSSARY: Record<string, string> = {
  // Hitting
  wRCPlus: 'Weighted Runs Created Plus — 100 is league average',
  wRC: 'Weighted Runs Created — total offensive value in runs',
  ISO: 'Isolated Power — SLG minus AVG, measures raw power',
  BABIP: 'Batting Average on Balls In Play — luck/skill on contact',
  OPS: 'On-Base Plus Slugging — combined plate discipline and power',
  OBP: 'On-Base Percentage — rate of reaching base',
  SLG: 'Slugging Percentage — total bases per at-bat',
  AVG: 'Batting Average — hits per at-bat',
  WAR: 'Wins Above Replacement — total value above a minor-leaguer',
  wOBA: 'Weighted On-Base Average — rate stat weighting each outcome',
  PA: 'Plate Appearances — total trips to the plate',
  HR: 'Home Runs',
  RBI: 'Runs Batted In',
  SB: 'Stolen Bases',
  BB: 'Walks (Bases on Balls)',
  K: 'Strikeouts',
  R: 'Runs Scored',
  H: 'Hits',

  // Pitching
  FIP: 'Fielding Independent Pitching — ERA estimator using K/BB/HR',
  xFIP: 'Expected FIP — normalizes HR/FB rate to league average',
  ERA: 'Earned Run Average — earned runs per 9 innings',
  WHIP: 'Walks + Hits per Inning Pitched',
  K9: 'Strikeouts per 9 innings',
  BB9: 'Walks per 9 innings',
  KBB: 'Strikeout-to-Walk ratio',
  IP: 'Innings Pitched',
  W: 'Wins',
  L: 'Losses',
  SV: 'Saves',
  ER: 'Earned Runs',

  // General
  OVR: 'Overall rating (20-80 scouting scale)',
  POT: 'Potential ceiling rating (20-80 scouting scale)',
  xW: 'Pythagorean Wins — expected wins from run differential',
  PCT: 'Winning Percentage',
  GB: 'Games Behind division leader',
  DIFF: 'Run Differential — runs scored minus runs allowed',
};
