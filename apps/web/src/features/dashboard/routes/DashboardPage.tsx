import { Briefcase, TrendingUp, Users, Calendar } from 'lucide-react';
import { useGameStore } from '@/shared/hooks/useGameStore';

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-dynasty-muted">
        {icon}
        <span className="font-heading text-xs font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="font-data text-2xl font-bold text-dynasty-textBright">
        {value}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { season, day, phase, teamName } = useGameStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Front Office
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Welcome to Mr. Baseball Dynasty. Manage your franchise, build a
          contender, and write history.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Season"
          value={`Season ${season}`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Day"
          value={`Day ${day} / 162`}
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Team"
          value={teamName}
        />
        <StatCard
          icon={<Briefcase className="h-4 w-4" />}
          label="Phase"
          value={phase.charAt(0).toUpperCase() + phase.slice(1)}
        />
      </div>

      {/* Action items placeholder */}
      <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
        <h2 className="mb-4 font-heading text-lg font-semibold text-dynasty-textBright">
          Action Items
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-md border border-dynasty-border bg-dynasty-base p-3">
            <div className="h-2 w-2 rounded-full bg-accent-warning" />
            <span className="font-heading text-sm text-dynasty-text">
              Set your starting lineup before Opening Day
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-dynasty-border bg-dynasty-base p-3">
            <div className="h-2 w-2 rounded-full bg-accent-info" />
            <span className="font-heading text-sm text-dynasty-text">
              Review available free agents
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-dynasty-border bg-dynasty-base p-3">
            <div className="h-2 w-2 rounded-full bg-accent-success" />
            <span className="font-heading text-sm text-dynasty-text">
              Scout top draft prospects
            </span>
          </div>
        </div>
      </div>

      {/* Quick overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
          <h2 className="mb-3 font-heading text-lg font-semibold text-dynasty-textBright">
            Recent Results
          </h2>
          <p className="font-heading text-sm text-dynasty-muted">
            Game results will appear here once the season begins. Use the
            simulation controls below to advance through the schedule.
          </p>
        </div>
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
          <h2 className="mb-3 font-heading text-lg font-semibold text-dynasty-textBright">
            Upcoming Schedule
          </h2>
          <p className="font-heading text-sm text-dynasty-muted">
            Your upcoming series and matchups will be listed here. Sim forward
            to generate the schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
