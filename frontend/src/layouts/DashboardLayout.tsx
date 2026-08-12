import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { SkipToContent } from '@/components/common/SkipToContent';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface DashboardLayoutProps {
  allowedRole?: UserRole;
}

export function DashboardLayout({ allowedRole }: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <SkipToContent />
      <Navbar />
      <div className="flex flex-1">
        {user && <Sidebar role={allowedRole ?? user.role} />}
        <MobileSidebar role={allowedRole ?? user?.role} />
        <main id="main-content" className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
