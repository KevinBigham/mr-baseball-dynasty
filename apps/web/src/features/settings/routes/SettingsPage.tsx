import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-brand text-4xl tracking-wide text-dynasty-textBright">
          Settings
        </h1>
        <p className="mt-1 font-heading text-sm text-dynasty-muted">
          Configure game preferences, simulation speed, display options, and
          manage save data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
          <h2 className="mb-3 font-heading text-lg font-semibold text-dynasty-textBright">
            Game Settings
          </h2>
          <p className="font-heading text-sm text-dynasty-muted">
            Simulation speed, auto-save frequency, difficulty level, and league
            rules configuration.
          </p>
        </div>

        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
          <h2 className="mb-3 font-heading text-lg font-semibold text-dynasty-textBright">
            Display
          </h2>
          <p className="font-heading text-sm text-dynasty-muted">
            Information density, stat display preferences, and notification
            settings.
          </p>
        </div>

        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
          <h2 className="mb-3 font-heading text-lg font-semibold text-dynasty-textBright">
            Save Management
          </h2>
          <p className="font-heading text-sm text-dynasty-muted">
            Export and import save files, manage save slots, and clear local
            data.
          </p>
        </div>

        <div className="rounded-lg border border-dynasty-border bg-dynasty-surface p-6">
          <h2 className="mb-3 font-heading text-lg font-semibold text-dynasty-textBright">
            About
          </h2>
          <div className="space-y-1">
            <p className="font-heading text-sm text-dynasty-muted">
              Mr. Baseball Dynasty v0.0.1
            </p>
            <p className="font-data text-xs text-dynasty-muted">
              Built with TypeScript, React, Vite, and Web Workers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
