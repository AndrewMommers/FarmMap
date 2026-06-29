import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { TractorModeOverlay } from './TractorModeOverlay';
import { useAppStore } from '../../store/appStore';
import { Toaster } from 'react-hot-toast';
import { cn } from '../../lib/utils';

export function AppLayout() {
  useAppStore();

  return (
    <div className="flex h-screen overflow-hidden bg-farm-50 dark:bg-gray-950">
      <Sidebar />
      <div className={cn(
        'flex flex-col flex-1 min-w-0 transition-all duration-300',
        // On lg+ the sidebar pushes content; on smaller screens the sidebar overlays
      )}>
        <Header />
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-6 bg-farm-50 dark:bg-gray-950">
          <div className="max-w-screen-2xl mx-auto px-4 py-6 text-gray-900 dark:text-gray-100">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav />
      <TractorModeOverlay />
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'text-sm font-medium',
          success: { iconTheme: { primary: '#16a34a', secondary: '#f0fdf4' } },
        }}
      />
    </div>
  );
}
