import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { Footer } from '@/components/layout/Footer';
import { SkipToContent } from '@/components/common/SkipToContent';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface DashboardLayoutProps {
  allowedRole?: UserRole;
}

export function DashboardLayout({ allowedRole }: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background text-text-primary">
      <SkipToContent />
      <Navbar />
      <div className="flex flex-1 items-start">
        {user && <Sidebar role={allowedRole ?? user.role} />}
        <MobileSidebar role={allowedRole ?? user?.role} />
        <div className="flex flex-1 flex-col min-w-0">
          <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}

