import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { PaddocksPage } from './pages/PaddocksPage';
import { LivestockPage } from './pages/LivestockPage';
import { CropsPage } from './pages/CropsPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { FinancePage } from './pages/FinancePage';
import { InventoryPage } from './pages/InventoryPage';
import { WeatherPage } from './pages/WeatherPage';
import { TasksPage } from './pages/TasksPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CompliancePage } from './pages/CompliancePage';
import { AuthPage } from './pages/auth/AuthPage';
import { CreateFarmPage } from './pages/onboarding/CreateFarmPage';
import { useAuthStore } from './store/authStore';
import { useDataStore } from './store/dataStore';
import { useAppStore } from './store/appStore';
import { supabase } from './lib/supabase';
import { Wheat, Loader2 } from 'lucide-react';

export default function App() {
  const { session, authLoading, setSession } = useAuthStore();
  const { dataLoading, farms, loadFromSupabase, clearData, subscribeToRealtime } = useDataStore();
  const { demoMode } = useAppStore();
  const unsubRef = useRef<(() => void) | null>(null);

  // ── Bootstrap auth (skipped in demo mode) ─────────────────────────────────
  useEffect(() => {
    if (demoMode) return; // demo doesn't need Supabase auth

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        clearData();
        if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  // ── Load data when session changes ────────────────────────────────────────
  useEffect(() => {
    if (demoMode || !session?.user) return;

    loadFromSupabase(session.user.id).then(() => {
      const farmIds = useDataStore.getState().farms.map((f) => f.id);
      if (farmIds.length === 0) return;
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = subscribeToRealtime(farmIds);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, demoMode]);

  // ── Demo mode: go straight to main app ───────────────────────────────────
  if (demoMode && farms.length > 0) {
    return (
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/"            element={<DashboardPage />} />
            <Route path="/paddocks"    element={<PaddocksPage />} />
            <Route path="/livestock"   element={<LivestockPage />} />
            <Route path="/crops"       element={<CropsPage />} />
            <Route path="/equipment"   element={<EquipmentPage />} />
            <Route path="/finance"     element={<FinancePage />} />
            <Route path="/inventory"   element={<InventoryPage />} />
            <Route path="/weather"     element={<WeatherPage />} />
            <Route path="/tasks"       element={<TasksPage />} />
            <Route path="/reports"     element={<ReportsPage />} />
            <Route path="/compliance"  element={<CompliancePage />} />
            <Route path="/settings"    element={<SettingsPage />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

  // ── Loading screen ────────────────────────────────────────────────────────
  if (!demoMode && (authLoading || (session && dataLoading))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-farm-900 to-farm-800">
        <div className="w-16 h-16 rounded-2xl bg-farm-500 flex items-center justify-center shadow-lg">
          <Wheat className="w-8 h-8 text-white" />
        </div>
        <Loader2 className="w-6 h-6 text-farm-300 animate-spin" />
        <p className="text-farm-300 text-sm">Loading FarmMap…</p>
      </div>
    );
  }

  // ── Not authenticated → show login ────────────────────────────────────────
  if (!demoMode && !session) return <AuthPage />;

  // ── Authenticated but no farms yet → onboarding ───────────────────────────
  if (farms.length === 0) {
    return (
      <BrowserRouter>
        <CreateFarmPage />
      </BrowserRouter>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/"            element={<DashboardPage />} />
          <Route path="/paddocks"    element={<PaddocksPage />} />
          <Route path="/livestock"   element={<LivestockPage />} />
          <Route path="/crops"       element={<CropsPage />} />
          <Route path="/equipment"   element={<EquipmentPage />} />
          <Route path="/finance"     element={<FinancePage />} />
          <Route path="/inventory"   element={<InventoryPage />} />
          <Route path="/weather"     element={<WeatherPage />} />
          <Route path="/tasks"       element={<TasksPage />} />
          <Route path="/reports"     element={<ReportsPage />} />
          <Route path="/compliance"  element={<CompliancePage />} />
          <Route path="/settings"    element={<SettingsPage />} />
          <Route path="/new-farm"    element={<CreateFarmPage />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
