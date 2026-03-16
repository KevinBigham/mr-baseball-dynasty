AUTO_TASK_ID: AT-005
TITLE: Break up large UI components
DISCOVERY_SOURCE: code scan
DESCRIPTION: Three UI components exceed 700 lines — TradeCenter.tsx (967), PlayerProfile.tsx (916), RosterView.tsx (745). Large components are harder to review, test, and maintain.
RECOMMENDED_ACTION: Extract logical sections into sub-components. TradeCenter could split into TradeInbox, TradeProposal, TradeHistory. PlayerProfile could split into StatsSummary, CareerTimeline, ContractDetails.
FILES_INVOLVED: src/components/TradeCenter.tsx, src/components/PlayerProfile.tsx, src/components/roster/RosterView.tsx
ESTIMATED_COMPLEXITY: medium
STATUS: DISCOVERED
