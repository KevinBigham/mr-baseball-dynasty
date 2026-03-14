# MFD v97 — 30-TEAM EXPANSION BLUEPRINT
## "The Big League Update"

**Purpose:** Expand Mr. Football Dynasty from 20 teams to 30 teams with full conference/division structure. This document is the implementation guide for Codex.

---

## 1. NEW LEAGUE STRUCTURE

### 2 Conferences × 3 Divisions × 5 Teams = 30 Teams

```
EAST CONFERENCE (EC) 🏛️                    WEST CONFERENCE (WC) 🌄
├── EC North 🧊                             ├── WC North ❄️
│   ├── Buffalo Lake Effect Maniacs         │   ├── Minneapolis Tundra Berserkers
│   ├── New York Concrete Gargoyles         │   ├── Seattle Sasquatch
│   ├── Boston Harbor Wolves         ★ NEW  │   ├── Portland Drizzle Phantoms
│   ├── Detroit Rust Belt Mothmen           │   ├── Denver Mile High Yetis
│   └── Pittsburgh Iron Furnace      ★ NEW  │   └── Salt Lake Summit Rams        ★ NEW
│                                            │
├── EC Central ⭐                            ├── WC Central ⛰️
│   ├── Chicago Deep Dish Destroyers        │   ├── Kansas City Smokestack Hogs
│   ├── Baltimore Harbor Doom               │   ├── Dallas Lone Star Scorpions
│   ├── Nashville Honky Tonk Comets         │   ├── Houston Space Cowboys
│   ├── Philadelphia Liberty Brawlers ★ NEW │   ├── San Antonio Prickly Boiz
│   └── Charlotte Buzz Saws          ★ NEW  │   └── Oklahoma City Prairie Twister ★ NEW
│                                            │
└── EC South ☀️                              └── WC South 🌵
    ├── Miami Neon Flamingos                    ├── Las Vegas Sin City Grim Reapers
    ├── Atlanta Muscle Hawks                    ├── Phoenix Cactus Jacks
    ├── Jacksonville Swamp Demons               ├── San Francisco Fog Krakens
    ├── Tampa Bay Gulf Barracudas  ★ NEW       ├── Los Angeles Sunset Tremors    ★ NEW
    └── New Orleans Bayou Voodoo   ★ NEW       └── San Diego Pacific Sharks      ★ NEW
```

### 10 New Teams — TD[] Entries

```javascript
// Add these 10 entries to the TD[] array (after line 10453):
{id:"brawl",  city:"Philadelphia",    name:"Liberty Brawlers",    abbr:"PHI", icon:"🥊", c1:"#004C54"},
{id:"furnace",city:"Pittsburgh",      name:"Iron Furnace",        abbr:"PIT", icon:"⚙️", c1:"#FFB612"},
{id:"buzz",   city:"Charlotte",       name:"Buzz Saws",           abbr:"CLT", icon:"🐝", c1:"#1D428A"},
{id:"voodoo", city:"New Orleans",     name:"Bayou Voodoo",        abbr:"NO",  icon:"🎭", c1:"#6B2D8B"},
{id:"cuda",   city:"Tampa Bay",       name:"Gulf Barracudas",     abbr:"TB",  icon:"🐟", c1:"#00A4BD"},
{id:"wolves", city:"Boston",          name:"Harbor Wolves",       abbr:"BOS", icon:"🐺", c1:"#1C2841"},
{id:"tremor", city:"Los Angeles",     name:"Sunset Tremors",      abbr:"LA",  icon:"🌋", c1:"#FF4500"},
{id:"rams97", city:"Salt Lake City",  name:"Summit Rams",         abbr:"SLC", icon:"🐏", c1:"#4A6741"},
{id:"twist",  city:"Oklahoma City",   name:"Prairie Twister",     abbr:"OKC", icon:"🌪️", c1:"#CC5500"},
{id:"shark",  city:"San Diego",       name:"Pacific Sharks",      abbr:"SD",  icon:"🦈", c1:"#005B5C"}
```

### League Structure Constant

```javascript
// NEW: Add after TD[] definition
var LEAGUE_STRUCTURE = {
  conferences: [
    {id: "EC", name: "East Conference", icon: "🏛️"},
    {id: "WC", name: "West Conference", icon: "🌄"}
  ],
  divisions: [
    // East Conference
    {id: "ECN", name: "North", conf: "EC", icon: "🧊",
     teams: ["yeti","crown","wolves","moth","furnace"]},
    {id: "ECC", name: "Central", conf: "EC", icon: "⭐",
     teams: ["titan","doom","comet","brawl","buzz"]},
    {id: "ECS", name: "South", conf: "EC", icon: "☀️",
     teams: ["volts","hawks","gator","cuda","voodoo"]},
    // West Conference
    {id: "WCN", name: "North", conf: "WC", icon: "❄️",
     teams: ["frost","surge","ghost","sent","rams97"]},
    {id: "WCC", name: "Central", conf: "WC", icon: "⛰️",
     teams: ["bbq","storm","apex","cactus","twist"]},
    {id: "WCS", name: "South", conf: "WC", icon: "🌵",
     teams: ["reap","blaze","kraken","tremor","shark"]}
  ]
};

// Helper functions
function getTeamConf(teamId) {
  for (var i = 0; i < LEAGUE_STRUCTURE.divisions.length; i++) {
    var d = LEAGUE_STRUCTURE.divisions[i];
    if (d.teams.indexOf(teamId) >= 0) return d.conf;
  }
  return null;
}
function getTeamDiv(teamId) {
  for (var i = 0; i < LEAGUE_STRUCTURE.divisions.length; i++) {
    var d = LEAGUE_STRUCTURE.divisions[i];
    if (d.teams.indexOf(teamId) >= 0) return d;
  }
  return null;
}
function getTeamDivId(teamId) {
  var d = getTeamDiv(teamId);
  return d ? d.id : null;
}
function getConfTeams(confId, teams) {
  var divs = LEAGUE_STRUCTURE.divisions.filter(function(d) { return d.conf === confId; });
  var ids = [];
  divs.forEach(function(d) { ids = ids.concat(d.teams); });
  return teams.filter(function(t) { return ids.indexOf(t.id) >= 0; });
}
function getDivTeams(divId, teams) {
  var d = LEAGUE_STRUCTURE.divisions.find(function(x) { return x.id === divId; });
  if (!d) return [];
  return teams.filter(function(t) { return d.teams.indexOf(t.id) >= 0; });
}
```

---

## 2. SCHEDULE GENERATION — COMPLETE REWRITE

### Current System (line 12451)
- Round-robin of all teams → pick 18 weeks → assign byes
- Every team can play every other team

### New System: Conference-Weighted Schedule
Each team plays **17 games** in an **18-week season** (1 bye week).

| Category | Games | How |
|----------|-------|-----|
| Division rivals | 8 | Play each of 4 division rivals 2× (home & away) |
| Conference non-division | 5 | Play 5 of the 10 remaining conference teams (rotate yearly) |
| Cross-conference | 4 | Play 4 teams from the other conference (rotate yearly) |
| **TOTAL** | **17** | 1 bye week |

```javascript
function genSchedule97(teams, year) {
  var sched = [];
  var teamIds = teams.map(function(t) { return t.id; });

  // 1. DIVISION GAMES (8 per team) — home & away vs each division rival
  LEAGUE_STRUCTURE.divisions.forEach(function(div) {
    for (var i = 0; i < div.teams.length; i++) {
      for (var j = i + 1; j < div.teams.length; j++) {
        sched.push({home: div.teams[i], away: div.teams[j], isDivision: true});
        sched.push({home: div.teams[j], away: div.teams[i], isDivision: true});
      }
    }
  });

  // 2. CONFERENCE NON-DIVISION (5 per team)
  // For each team, pick 5 of the 10 non-division conference teams
  // Rotate based on year so matchups vary season to season
  LEAGUE_STRUCTURE.conferences.forEach(function(conf) {
    var confDivs = LEAGUE_STRUCTURE.divisions.filter(function(d) { return d.conf === conf.id; });
    confDivs.forEach(function(myDiv) {
      var otherDivs = confDivs.filter(function(d) { return d.id !== myDiv.id; });
      var otherTeams = [];
      otherDivs.forEach(function(d) { otherTeams = otherTeams.concat(d.teams); });
      // Each team in myDiv plays 5 of 10 non-div conf opponents
      myDiv.teams.forEach(function(tid, tIdx) {
        // Use year + team index to rotate which 5 opponents
        var seed = (year || 2026) + tIdx;
        var shuffled = otherTeams.slice().sort(function(a, b) {
          return hashPair(tid, a, seed) - hashPair(tid, b, seed);
        });
        var opponents = shuffled.slice(0, 5);
        opponents.forEach(function(opp, oi) {
          // Alternate home/away
          if (oi % 2 === 0) sched.push({home: tid, away: opp, isConf: true});
          else sched.push({home: opp, away: tid, isConf: true});
        });
      });
    });
  });
  // Deduplicate conference games (each pair should appear once)
  // ... dedup logic needed here ...

  // 3. CROSS-CONFERENCE (4 per team)
  // Pair each division with one from the other conference (rotate yearly)
  // Each team plays all 5 from the paired division, minus 1 = 4 games
  // OR: pair individual teams across conferences
  // Simpler: each team plays 4 random cross-conf opponents, rotating yearly
  var ecTeams = []; var wcTeams = [];
  LEAGUE_STRUCTURE.divisions.forEach(function(d) {
    if (d.conf === "EC") ecTeams = ecTeams.concat(d.teams);
    else wcTeams = wcTeams.concat(d.teams);
  });
  ecTeams.forEach(function(eid, ei) {
    var seed2 = (year || 2026) * 31 + ei;
    var shuffledWC = wcTeams.slice().sort(function(a, b) {
      return hashPair(eid, a, seed2) - hashPair(eid, b, seed2);
    });
    var crossOpps = shuffledWC.slice(0, 4);
    crossOpps.forEach(function(wid, wi) {
      if (wi % 2 === 0) sched.push({home: eid, away: wid, isCross: true});
      else sched.push({home: wid, away: eid, isCross: true});
    });
  });
  // ... dedup cross-conference games ...

  // 4. ASSIGN TO WEEKS
  // Distribute ~15 games per week across 18 weeks
  // Each team plays 17 games, gets 1 bye
  // Use graph-coloring or greedy assignment
  var weekified = assignToWeeks97(sched, teamIds, 18);

  return weekified;
}

// Helper: deterministic hash for opponent rotation
function hashPair(a, b, seed) {
  var s = a + b + seed;
  var h = 0;
  for (var i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
  return h;
}
```

> **NOTE FOR CODEX:** The schedule algorithm is the hardest part of this expansion. The deduplication and week-assignment logic needs careful implementation. A greedy algorithm that assigns games to weeks while ensuring no team plays twice in the same week is the recommended approach. Each week should have ~15 games (some weeks 14 due to byes). Target: every team gets exactly 1 bye, spread across weeks 5-14.

---

## 3. PLAYOFF SYSTEM — COMPLETE REWRITE

### Current System (line 17891-17913)
- Top 8 teams by record → 3 rounds (QF/SF/CHAMP)
- No conference seeding

### New System: 12-Team Conference Playoffs

```
12 TEAMS: 6 per conference

SEEDING (per conference):
  #1 seed: Best division winner (by record)     → BYE
  #2 seed: 2nd-best division winner              → BYE
  #3 seed: 3rd-best division winner
  #4 seed: Best non-division-winner (wild card)
  #5 seed: 2nd-best wild card
  #6 seed: 3rd-best wild card

BRACKET (per conference):
  Wild Card Round (4 games):
    Game A: #3 vs #6 (higher seed hosts)
    Game B: #4 vs #5 (higher seed hosts)

  Divisional Round (4 games):
    Game C: #1 vs lowest surviving seed
    Game D: #2 vs highest surviving seed

  Conference Championship (2 games):
    Game E: Winner C vs Winner D

  SUPER BOWL (1 game):
    EC Champion vs WC Champion
```

### Bracket Data Structure
```javascript
var bracket97 = {
  round: "WC",  // WC → DIV → CONF → SB → DONE
  year: season.year,
  ec: {
    seeds: [...],  // 6 EC playoff teams
    wildCard: [
      {home: seed3, away: seed6, result: null, winner: null},
      {home: seed4, away: seed5, result: null, winner: null}
    ],
    divisional: [
      {home: seed1, away: null, result: null, winner: null},  // vs lowest survivor
      {home: seed2, away: null, result: null, winner: null}   // vs highest survivor
    ],
    confChamp: {home: null, away: null, result: null, winner: null}
  },
  wc: {
    seeds: [...],  // 6 WC playoff teams
    wildCard: [...],  // same structure
    divisional: [...],
    confChamp: {...}
  },
  superBowl: {home: null, away: null, result: null, winner: null}
};
```

### Seeding Function
```javascript
function seedPlayoffs97(teams) {
  var result = {ec: [], wc: []};

  ["EC", "WC"].forEach(function(confId) {
    var confTeams = getConfTeams(confId, teams);
    var confDivs = LEAGUE_STRUCTURE.divisions.filter(function(d) { return d.conf === confId; });

    // Find division winners
    var divWinners = [];
    confDivs.forEach(function(div) {
      var divTs = getDivTeams(div.id, teams);
      divTs.sort(function(a, b) { return b.wins - a.wins || (b.pf - b.pa) - (a.pf - a.pa); });
      divWinners.push(divTs[0]);
    });
    // Sort division winners by record
    divWinners.sort(function(a, b) { return b.wins - a.wins || (b.pf - b.pa) - (a.pf - a.pa); });

    // Wild cards: best 3 non-division-winners
    var divWinnerIds = divWinners.map(function(t) { return t.id; });
    var wildCards = confTeams
      .filter(function(t) { return divWinnerIds.indexOf(t.id) < 0; })
      .sort(function(a, b) { return b.wins - a.wins || (b.pf - b.pa) - (a.pf - a.pa); })
      .slice(0, 3);

    result[confId === "EC" ? "ec" : "wc"] = divWinners.concat(wildCards);
  });

  return result;
}
```

### Playoff Round Flow (replaces simPlayoffRound)
```
Round "WC" (Wild Card):
  - Sim 4 games (2 per conference): #3v#6, #4v#5
  - Advance to "DIV"

Round "DIV" (Divisional):
  - Slot survivors against bye teams
  - #1 vs lowest remaining seed, #2 vs highest remaining seed
  - Sim 4 games (2 per conference)
  - Advance to "CONF"

Round "CONF" (Conference Championship):
  - Sim 2 games (1 per conference)
  - Advance to "SB"

Round "SB" (Super Bowl):
  - Sim 1 game: EC champ vs WC champ
  - Advance to "DONE"
```

**Total playoff games: 11** (was 7)

---

## 4. DIVISION STANDINGS — COMPLETE REWRITE

### Current System (line 5614)
- `DIV_STANDINGS.getDivisions()` — assigns teams to 5 divisions via `i % 5`
- Returns flat array of 5 divisions

### New System
```javascript
var DIV_STANDINGS = {
  getDivisions: function(teams) {
    return LEAGUE_STRUCTURE.divisions.map(function(div) {
      var divTeams = teams.filter(function(t) {
        return div.teams.indexOf(t.id) >= 0;
      });
      divTeams.sort(function(a, b) {
        if ((a.wins || 0) !== (b.wins || 0)) return (b.wins || 0) - (a.wins || 0);
        return ((b.pf || 0) - (b.pa || 0)) - ((a.pf || 0) - (a.pa || 0));
      });
      var leader = divTeams[0];
      divTeams.forEach(function(t, i) {
        t._gamesBack76 = i === 0 ? 0 : ((leader.wins || 0) - (t.wins || 0));
        t._divRank76 = i + 1;
      });
      return {
        id: div.id, name: div.name, conf: div.conf, icon: div.icon,
        teams: divTeams
      };
    });
  },
  getConferences: function(teams) {
    var divs = this.getDivisions(teams);
    return LEAGUE_STRUCTURE.conferences.map(function(conf) {
      return {
        id: conf.id, name: conf.name, icon: conf.icon,
        divisions: divs.filter(function(d) { return d.conf === conf.id; })
      };
    });
  },
  getUserDiv: function(divs, myId) {
    for (var i = 0; i < divs.length; i++) {
      for (var j = 0; j < divs[i].teams.length; j++) {
        if (divs[i].teams[j].id === myId) return divs[i];
      }
    }
    return null;
  }
};
```

### Standings UI Rendering (Hub Home + Standings Tab)
- Hub Home: Show user's division (unchanged behavior, now with conf label)
- Standings Tab: Show full conference → division hierarchy
  - EC header, then 3 divisions
  - WC header, then 3 divisions
  - Playoff picture sidebar (who's in, who's out, wild card race)

---

## 5. PLAYER POOL SCALING — 50% INCREASE

### Pool Sizes: 20 teams → 30 teams

| Pool | Current | New (×1.5) | Where |
|------|---------|------------|-------|
| Draft class | 300 | **450** | `genDraftClass(300)` → `genDraftClass(450)` |
| Initial free agents | 60 | **90** | `genFreeAgents(60)` → `genFreeAgents(90)` |
| Offseason FA restock | 30 | **45** | `genFreeAgents(30)` → `genFreeAgents(45)` |
| Expansion pool - QB | 60 | **90** | genExpansionPool posSlots |
| Expansion pool - RB | 80 | **120** | genExpansionPool posSlots |
| Expansion pool - WR | 140 | **210** | genExpansionPool posSlots |
| Expansion pool - TE | 70 | **105** | genExpansionPool posSlots |
| Expansion pool - OL | 200 | **300** | genExpansionPool posSlots |
| Expansion pool - DL | 160 | **240** | genExpansionPool posSlots |
| Expansion pool - LB | 140 | **210** | genExpansionPool posSlots |
| Expansion pool - CB | 120 | **180** | genExpansionPool posSlots |
| Expansion pool - S | 80 | **120** | genExpansionPool posSlots |
| Expansion pool - K | 25 | **38** | genExpansionPool posSlots |
| Expansion pool - P | 25 | **38** | genExpansionPool posSlots |
| **Expansion total** | **~1,100** | **~1,651** | |

### Code Locations to Change

```
Line 12645:  var total=n||300;          → var total=n||450;
Line 15196:  QB:60 → 90, RB:80 → 120, WR:140 → 210, TE:70 → 105
Line 15197:  OL:200 → 300, DL:160 → 240, LB:140 → 210, CB:120 → 180
Line 15198:  S:80 → 120, K:25 → 38, P:25 → 38
Line 15427:  genFreeAgents(60) → genFreeAgents(90)
Line 15427:  genDraftClass(300) → genDraftClass(450)
Line 15752:  genFreeAgents(60) → genFreeAgents(90)
Line 15752:  genDraftClass(300) → genDraftClass(450)
Line 18602:  genDraftClass(300) → genDraftClass(450)
Line 19608:  genFreeAgents(30) → genFreeAgents(45)
Line 19699:  genDraftClass(300,...) → genDraftClass(450,...)
Line 22485:  genDraftClass(300) → genDraftClass(450)
```

### SLOT_SALARY Expansion
Current: 48 entries (picks 1-48). Need: 210 entries (30 teams × 7 rounds).

```javascript
// Replace SLOT_SALARY (line 12501) with expanded version:
var SLOT_SALARY = (function() {
  var s = [0]; // index 0 unused
  // Round 1 (picks 1-30): 14.0 → 2.5
  for (var i = 1; i <= 30; i++) s.push(Math.round((14.0 - (i - 1) * 0.39) * 10) / 10);
  // Round 2 (picks 31-60): 2.4 → 1.2
  for (var i = 1; i <= 30; i++) s.push(Math.round((2.4 - (i - 1) * 0.041) * 10) / 10);
  // Round 3 (picks 61-90): 1.1 → 0.7
  for (var i = 1; i <= 30; i++) s.push(Math.round(Math.max(0.5, 1.1 - (i - 1) * 0.014) * 10) / 10);
  // Rounds 4-7 (picks 91-210): 0.5 minimum
  for (var i = 91; i <= 210; i++) s.push(0.5);
  return s;
})();
```

---

## 6. PRESET ROSTERS FOR NEW TEAMS

Each new team needs ~15-17 named preset players. Here are the 10 new rosters:

```javascript
// ADD to PRESET_ROSTERS (after line ~10910):

brawl:[// Philadelphia — Bruising defense, physical OL, ground-and-pound
  ["Rocco Vega","DL",93,26,"ss"],["Tommy Brink","OL",92,28,"ss"],["Jax Ferarro","LB",91,25,"ss"],
  ["Cade Prescott","QB",85,27,"s"],["Dante Morales","RB",88,24,"s"],["Kai Whitaker","CB",86,23,"s"],
  ["Owen Steele","OL",87,30],["Marco Rossi","S",83,25,"s"],["Zane Hawkins","WR",82,24],
  ["Troy Castellano","DL",84,27],["Niko Sandoval","TE",80,26],["Ellis Crawford","LB",81,28],
  ["Ry Dalton","WR",78,22],["Brock Tanner","K",79,29],["Vince Palazzo","CB",77,24]
],
furnace:[// Pittsburgh — Elite safety, strong run game, gritty defense
  ["Beau Hendricks","S",94,25,"ss"],["Darnell Grimes","RB",90,26,"ss"],["Colton Briggs","DL",89,27,"s"],
  ["Shane Mercer","QB",84,28,"s"],["Wade Ironside","OL",88,29,"s"],["Tyson Caldwell","LB",87,24,"s"],
  ["Rex Donovan","WR",83,25],["Emmett Hale","TE",82,27],["Clay Warwick","OL",85,30],
  ["Jace Booker","CB",81,23],["Silas Odom","DL",80,26],["Brady Flynn","WR",79,24],
  ["Nolan Ash","K",78,27],["Kurt Pittman","S",77,25],["Roman Slate","LB",76,28]
],
buzz:[// Charlotte — Dynamic young QB, explosive receiver, ascending
  ["Jaylen Storm","QB",88,23,"ss"],["Dex Calloway","WR",91,24,"ss"],["Keyon Ballard","CB",86,22,"s"],
  ["Trevon Oakes","RB",84,25,"s"],["Garrison Cole","OL",87,27,"s"],["Malik Durant","DL",83,24,"s"],
  ["Zaire Foster","TE",81,23],["Preston Ward","LB",82,26],["Avery Kidd","S",80,24],
  ["Nash Goodwin","WR",79,22],["Dorian Pierce","OL",84,28],["Caleb Raines","DL",78,25],
  ["Ty Morrow","K",77,26],["Jett Langston","LB",76,23],["Quinn Mays","CB",75,24]
],
voodoo:[// New Orleans — Elite TE, creative offense, voodoo defense
  ["Remy Devereaux","TE",95,27,"ss"],["Armand Baptiste","QB",87,26,"s"],["Thibault Landry","DL",90,25,"ss"],
  ["Lucien Broussard","CB",88,24,"ss"],["Beau Thibodeaux","LB",85,28,"s"],["Marcel Hebert","RB",83,25,"s"],
  ["Dante Guidry","WR",84,23],["Pierre Mouton","OL",86,29],["Roux Fontenot","S",81,24],
  ["Gaston Arceneaux","WR",80,27],["Felix Boudreaux","OL",82,26],["Clovis Duval","DL",79,25],
  ["Hugo Treme","K",78,28],["Rene Castille","WR",77,22],["Noel Breaux","CB",76,23]
],
cuda:[// Tampa Bay — Speed everywhere, elite pass rush, young core
  ["Cruz Delgado","DL",93,24,"ss"],["Blaze Santiago","WR",90,23,"ss"],["Reef Nakamura","QB",86,25,"s"],
  ["Jet Cordero","RB",85,23,"s"],["Kai Pescador","CB",87,22,"ss"],["Storm Rivera","S",83,24,"s"],
  ["Finn Galveston","OL",84,27],["Rio Castano","TE",81,25],["Ace Marquez","LB",82,26],
  ["Diego Torres","WR",80,24],["Mateo Reyes","OL",83,28],["Nico Aguilar","DL",79,23],
  ["Cruz Benitez","K",77,26],["Tomas Fuentes","LB",78,25],["Andres Salazar","CB",76,24]
],
wolves:[// Boston — Cerebral QB, elite coverage, physical secondary
  ["Beckett O'Brien","QB",91,27,"ss"],["Ronan Murphy","CB",93,25,"ss"],["Declan Walsh","S",89,26,"ss"],
  ["Finn McCarthy","OL",87,29,"s"],["Liam Gallagher","DL",85,25,"s"],["Connor Doyle","LB",86,24,"s"],
  ["Aiden Burke","WR",84,23],["Seamus Quinn","TE",82,27],["Kieran Lynch","RB",81,24],
  ["Padraig Kelly","WR",80,26],["Niall Brennan","OL",83,28],["Eamon Reilly","DL",79,24],
  ["Owen Flanagan","K",78,27],["Callum Hayes","LB",77,25],["Rory Sullivan","WR",76,22]
],
tremor:[// Los Angeles — Flashy offense, star WR, celebrity vibes
  ["Phoenix Carter","QB",88,25,"s"],["Marquise Hollywood","WR",94,24,"ss"],["Zion Banks","RB",87,23,"ss"],
  ["Jalen Bridges","CB",86,25,"s"],["Koa Nakamura","DL",89,26,"ss"],["Sterling Cross","OL",85,28,"s"],
  ["Asher Gold","WR",83,22],["Maddox Lane","TE",81,26],["Blaze Cannon","LB",82,24],
  ["Cairo Redd","S",80,23],["Rome Valentino","OL",84,27],["Kai Westbrook","DL",78,25],
  ["Neo Starling","K",79,26],["Jett Malibu","WR",77,24],["Dax Rodeo","CB",76,23]
],
rams97:[// Salt Lake City — Dominant OL, ground game, altitude advantage
  ["Jensen Clark","OL",95,27,"ss"],["Brigham Stone","RB",90,26,"ss"],["Dalton Ryder","QB",85,28,"s"],
  ["Summit Young","DL",88,25,"s"],["Canyon Tate","LB",87,24,"ss"],["Aspen Greer","CB",84,23,"s"],
  ["Ridge Bonner","TE",83,26],["Flint Murdock","OL",86,29],["Colt Jennings","S",81,24],
  ["Sage Whitfield","WR",82,25],["Boulder Nash","DL",80,27],["River Kemp","WR",79,22],
  ["Peak Leavitt","K",78,27],["Timber Hale","OL",84,30],["Alpine Vest","LB",76,23]
],
twist:[// Oklahoma City — Explosive playmakers, boom-or-bust, high variance
  ["Tornado Jones","QB",87,24,"s"],["Thunder Banks","WR",92,23,"ss"],["Cyclone Davis","DL",88,25,"ss"],
  ["Prairie Williams","RB",85,22,"s"],["Dusty Rhodes","LB",86,27,"s"],["Flint Harper","CB",84,24,"s"],
  ["Gust Coleman","OL",83,28],["Storm Hendrix","TE",81,25],["Blaze Roper","S",80,23],
  ["Hail Beckett","WR",79,24],["Ridge Tucker","OL",82,27],["Bolt Graves","DL",78,26],
  ["Wind Walker","K",77,25],["Dust Chandler","LB",76,24],["Twain Garrett","CB",75,23]
],
shark:[// San Diego — Balanced roster, elite corner, beach mentality
  ["Cove Masterson","QB",86,26,"s"],["Pacific Wells","CB",93,24,"ss"],["Reef Thompson","WR",89,25,"ss"],
  ["Tide Alderman","DL",87,27,"s"],["Current Brooks","RB",85,24,"s"],["Bay Henderson","OL",88,28,"ss"],
  ["Anchor Young","TE",83,25],["Shore Mitchell","LB",82,26],["Wave Jackson","S",84,23,"s"],
  ["Marina Diaz","WR",80,22],["Shell Porter","OL",81,29],["Coral Stevens","DL",79,25],
  ["Fin Whitley","K",78,27],["Kelp Murray","WR",77,24],["Dune Foster","CB",76,23]
]
```

---

## 7. TEXT STRING UPDATES

Find & replace these hardcoded references:

| Line | Current | New |
|------|---------|-----|
| 13874 | `"OUTSMART 19 AI GMs"` | `"OUTSMART 29 AI GMs"` |
| 19774 | `"Outsmart 19 AI GMs"` | `"Outsmart 29 AI GMs"` |
| 20011 | `"All 20 teams arrive"` | `"All 30 teams arrive"` |
| 20024 | `"How will 20 teams"` | `"How will 30 teams"` |
| 20724 | `"all 20 teams"` | `"all 30 teams"` |
| 34309 | `"all 20 teams build"` | `"all 30 teams build"` |
| 34324 | `"all 20 teams"` | `"all 30 teams"` |
| 5616 | `teams.length<20` | `teams.length<30` |

---

## 8. OTHER SYSTEMS NEEDING UPDATES

### 8A. Draft Order Setup Screen (line 20711+)
- Currently shows 20 teams with move buttons
- Update to show 30 teams (may need scrolling or compact layout)
- Consider grouping by conference in the draft order UI

### 8B. Team Selection Screen (line 19993+)
- `TD.map()` renders team picker — automatically works with 30 teams
- But may need layout adjustment (currently probably 4×5 grid → maybe 5×6 or 6×5)
- Add conference/division label to each team card

### 8C. Power Rankings (line 4389+)
- `powerRankings.slice(0,20)` — change to `.slice(0,30)`
- Already dynamic otherwise

### 8D. BuildBracketTree (line 9453)
- Currently builds `{wildcard, divisional, confChamp, superBowl}` from flat playoff games
- Needs rewrite to support new 4-round, 2-conference bracket
- **New structure:** `{ec: {wildCard, divisional, confChamp}, wc: {wildCard, divisional, confChamp}, superBowl}`

### 8E. PlayoffBracketDisplay Component (line ~13051)
- Needs visual redesign: show EC bracket on left, WC bracket on right, SB in center
- Currently renders single linear bracket

### 8F. Season Archive (line 11242)
- `standings: teams.map(...)` — add conference/division to each entry
- Archive bracket format needs update for new structure

### 8G. initPlayoffs Message
- Line 17913: `"8 teams enter"` → `"12 teams enter"`

### 8H. Save Validation (line 14330)
- `teams.length<16` → `teams.length<24` (or `<28`)
- `teams.length>40` → `teams.length>35`

### 8I. Owner Goals (line 10278)
- `"win_division"` check — `ctx.divRank===1` — already works if divRank is set correctly

### 8J. Rivalry System
- Division rivals should have higher base rivalry heat
- Consider auto-seeding rivalries for division opponents

### 8K. MFSN Weekly Report (line 12371)
- `powerRanks.slice(0,12)` — may want to increase to `.slice(0,15)` for 30-team league

---

## 9. SAVE VERSION & MIGRATION

```javascript
var SAVE_VERSION = 97; // Bump from 95

// Migration handler (in loadGame):
if (d.saveVersion < 97) {
  // Add conf/div data to existing teams
  d.teams.forEach(function(t) {
    t.conf = getTeamConf(t.id);
    t.divId = getTeamDivId(t.id);
  });
  // Old 20-team saves: teams stay the same, just get conf/div tags
  // League still works with 20 teams if LEAGUE_STRUCTURE handles missing teams gracefully
  // BUT: schedule won't be conference-weighted for old saves
  addN("⚙️ v97 Migration: Added conference/division structure!", "gold");
}
```

> **CRITICAL DECISION:** Old 20-team saves can't easily become 30-team saves mid-season. Options:
> 1. **New games only** — 30 teams only for new games. Old saves play out with 20 teams.
> 2. **Offseason expansion** — Trigger expansion draft when old save hits offseason.
> 3. **Force migration** — Add 10 AI teams with generated rosters during load.
>
> **Recommendation:** Option 1 (simplest, safest). Old saves work as-is. New games get full 30-team experience.

---

## 10. IMPLEMENTATION ORDER (RECOMMENDED)

This is a large change. Recommended implementation order for Codex:

### Phase 1: Foundation (non-breaking)
1. Add 10 new team entries to `TD[]`
2. Add `LEAGUE_STRUCTURE` constant + helper functions
3. Add 10 new `PRESET_ROSTERS` entries
4. Update all text strings ("20" → "30", "19 AI" → "29 AI")
5. Expand `SLOT_SALARY` array

### Phase 2: Player Pools (simple scaling)
6. Change all `genDraftClass(300)` → `genDraftClass(450)`
7. Change all `genFreeAgents(60)` → `genFreeAgents(90)`, `(30)` → `(45)`
8. Scale `genExpansionPool` posSlots by 1.5×

### Phase 3: Schedule (hardest piece)
9. Rewrite `genSchedule()` → `genSchedule97()` with conference-weighted matchups
10. Implement week assignment algorithm with bye distribution
11. Test: verify every team gets exactly 17 games + 1 bye

### Phase 4: Standings & Divisions
12. Rewrite `DIV_STANDINGS` to use `LEAGUE_STRUCTURE`
13. Update Hub Home division display to show conference label
14. Update Standings tab for full conference → division hierarchy

### Phase 5: Playoffs (2nd hardest)
15. Rewrite `initPlayoffs()` → `initPlayoffs97()` with conference seeding
16. Rewrite `simPlayoffRound()` for 4-round, 2-conference bracket
17. Update `PlayoffBracketDisplay` component
18. Update `archiveSeason` bracket format
19. Update `buildBracketTree`

### Phase 6: UI Polish
20. Team selection screen layout for 30 teams
21. Draft order setup for 30 teams
22. Power rankings `.slice(0,30)`
23. Save validation bounds

### Phase 7: Testing
24. Smoke test: new game → team selection → see 30 teams
25. Smoke test: inaugural draft → 30 teams draft from expanded pool
26. Smoke test: sim full season → verify 17 games + 1 bye per team
27. Smoke test: verify playoff seeding → 6 per conference → 12 total
28. Smoke test: sim all playoff rounds → Super Bowl → champion crowned
29. Smoke test: offseason → draft with 450 prospects → FA with 90 agents
30. Smoke test: old 20-team save loads without crash

---

## 11. RISKS & EDGE CASES

| Risk | Mitigation |
|------|------------|
| Schedule algorithm creates duplicate games | Dedup after generation, validate each team has exactly 17 games |
| Bye weeks clustered (all byes in week 5) | Spread byes across weeks 5-14, max 3 byes per week |
| 30-team draft takes too long | Snake draft auto-picks for AI are fast; maybe add "Sim to My Pick" button |
| UI too cramped with 30 teams | Consider collapsible conference sections in standings |
| Old saves crash on new playoff code | Guard with `if (teams.length >= 30)` for new playoff format, else fall back to old 8-team |
| Cross-conference scheduling imbalance | Verify each EC team plays exactly 4 WC teams and vice versa |
| Division standings wrong after load | Recalculate `_divRank76` from `LEAGUE_STRUCTURE` on every render |
| Performance with 50% more players | Monitor — genExpansionPool with ~1650 players should still be fast |

---

## 12. GEOGRAPHIC MAP REFERENCE

```
                    BOS 🐺
              BUF 🌨️  NYG 🗽
        DET 🦇   PIT ⚙️   PHI 🥊
  MIN 🪓  CHI 🍕         BAL ⚓
         KC 🐗    NSH ☄️  CLT 🐝
  DEN 🏔️  OKC 🌪️
SLC 🐏              ATL 🦅
         DAL 🦂            JAX 🐊
SEA 🦶    SA 🤙   HOU 🤠
POR 👻                  NO 🎭
         PHX 🌵         TB 🐟
  LV 💀                MIA 🦩
SF 🦑    LA 🌋
         SD 🦈
```

---

*Document version: v97-blueprint-v1*
*Created: 2026-02-24*
*For: Codex implementation partner*
*Game: Mr. Football Dynasty by Kevin Bigham*
