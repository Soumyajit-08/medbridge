import { Outlet } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { SkipToContent } from '@/components/common/SkipToContent';

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <SkipToContent />
      <Navbar />
      <MobileSidebar />
      <main id="main-content" className="flex-1 min-w-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
