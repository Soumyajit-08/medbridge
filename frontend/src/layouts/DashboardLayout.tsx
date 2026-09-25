import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { SkipToContent } from '@/components/common/SkipToContent';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface DashboardLayoutProps {
  allowedRole?: UserRole;
}

export function DashboardLayout({ allowedRole }: DashboardLayoutProps) {
  const { user } = useAuth();
  const activeRole = allowedRole ?? user?.role;

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <SkipToContent />
      <Navbar />
      <div className="flex flex-1 items-start">
        {user && <Sidebar role={activeRole} />}
        <MobileSidebar role={activeRole} />
        <div className="flex flex-1 flex-col min-w-0 pb-18 lg:pb-0">
          <main id="main-content" className="flex-1 p-3.5 sm:p-6 lg:p-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
      {user && <BottomNav role={activeRole} />}
    </div>
  );
}


