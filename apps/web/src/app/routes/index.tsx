import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/app/layout/AppLayout';

// Lazy-loaded route components
const DashboardPage = lazy(
  () => import('@/features/dashboard/routes/DashboardPage')
);
const RosterPage = lazy(
  () => import('@/features/roster/routes/RosterPage')
);
const PlayersPage = lazy(
  () => import('@/features/players/routes/PlayersPage')
);
const ScoutingPage = lazy(
  () => import('@/features/scouting/routes/ScoutingPage')
);
const DraftPage = lazy(
  () => import('@/features/draft/routes/DraftPage')
);
const TradePage = lazy(
  () => import('@/features/trade/routes/TradePage')
);
const StandingsPage = lazy(
  () => import('@/features/league/routes/StandingsPage')
);
const LeadersPage = lazy(
  () => import('@/features/league/routes/LeadersPage')
);
const HistoryPage = lazy(
  () => import('@/features/history/routes/HistoryPage')
);
const SettingsPage = lazy(
  () => import('@/features/settings/routes/SettingsPage')
);

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center">
        <div className="mb-3 font-brand text-2xl text-accent-primary">
          MBD
        </div>
        <div className="font-data text-sm text-dynasty-muted">Loading...</div>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="roster" element={<RosterPage />} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="scouting" element={<ScoutingPage />} />
          <Route path="draft" element={<DraftPage />} />
          <Route path="trade" element={<TradePage />} />
          <Route path="league">
            <Route path="standings" element={<StandingsPage />} />
            <Route path="leaders" element={<LeadersPage />} />
            <Route index element={<Navigate to="standings" replace />} />
          </Route>
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
