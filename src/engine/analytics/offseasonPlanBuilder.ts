// Offseason Plan Builder — structured offseason to-do list and priority tracker

export interface OffseasonPriority {
  area: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'completed' | 'in-progress' | 'planned' | 'not-started';
  actions: string[];
  budget: number;          // millions allocated
  deadline: string;
  impact: string;
}

export interface OffseasonPlanData {
  teamName: string;
  totalBudget: number;
  budgetUsed: number;
  priorities: OffseasonPriority[];
  keyDates: { date: string; event: string }[];
  overallReadiness: number; // 0-100
}

export function getOffseasonPriorityColor(p: string): string {
  if (p === 'critical') return '#ef4444';
  if (p === 'high') return '#f59e0b';
  if (p === 'medium') return '#3b82f6';
  return '#6b7280';
}

export function generateDemoOffseasonPlan(): OffseasonPlanData {
  return {
    teamName: 'San Francisco Giants',
    totalBudget: 45.0,
    budgetUsed: 18.5,
    overallReadiness: 42,
    keyDates: [
      { date: 'Nov 1', event: 'Free agent filing deadline' },
      { date: 'Nov 15', event: 'QO deadline' },
      { date: 'Dec 4-7', event: 'Winter Meetings' },
      { date: 'Jan 15', event: 'Arbitration filing' },
      { date: 'Feb 15', event: 'Spring Training report' },
    ],
    priorities: [
      {
        area: 'Starting Pitching', priority: 'critical', status: 'in-progress', budget: 18.0, deadline: 'Dec 15',
        impact: 'Need #2/#3 starter — current rotation too thin for October',
        actions: ['Target Corbin Burnes (FA)', 'Explore trade for Bryan Woo', 'Re-sign Greg Thornton as depth'],
      },
      {
        area: 'Bullpen Upgrades', priority: 'high', status: 'planned', budget: 8.0, deadline: 'Jan 1',
        impact: 'Need setup man — Marcus Rivera may not return from fatigue',
        actions: ['Sign proven LHP reliever', 'Add high-leverage arm via trade', 'Promote Derek Liu from AAA'],
      },
      {
        area: 'Jaylen Torres Extension', priority: 'critical', status: 'in-progress', budget: 0, deadline: 'Spring Training',
        impact: 'Franchise cornerstone — must lock up before arbitration years',
        actions: ['Continue negotiations (currently at 8yr/$232M ask)', 'Prepare backup plan if talks stall', 'Set walk-away number at $240M'],
      },
      {
        area: 'Corner Outfield', priority: 'medium', status: 'not-started', budget: 6.0, deadline: 'Feb 1',
        impact: 'Victor Robles III declining defensively — need platoon or upgrade',
        actions: ['Explore FA market for RHB OF', 'Tyler Washington callup as option', 'Internal competition in spring'],
      },
      {
        area: 'Prospect Development', priority: 'high', status: 'planned', budget: 2.5, deadline: 'Ongoing',
        impact: 'Pipeline health is key to sustained contention',
        actions: ['Finalize Jordan Park development plan', 'Add instructor for AA pitchers', 'Evaluate Kai Nakamura for A+ promotion'],
      },
    ],
  };
}
