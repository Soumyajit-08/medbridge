import { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SplashScreen } from '@/components/common/SplashScreen';
import { ToastContainer } from '@/components/feedback/Toast';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthInit } from '@/hooks/useAuth';
import { PublicLayout } from '@/layouts/PublicLayout';
import { DonorLayout } from '@/layouts/DonorLayout';
import { RecipientLayout } from '@/layouts/RecipientLayout';
import { AdminLayout } from '@/layouts/AdminLayout';

// Public pages
import { LandingPage } from '@/pages/public/LandingPage';
import { AboutPage } from '@/pages/public/AboutPage';
import { HowItWorksPage } from '@/pages/public/HowItWorksPage';
import { SafetyPage } from '@/pages/public/SafetyPage';
import { PrivacyPage } from '@/pages/public/PrivacyPage';
import { TermsPage } from '@/pages/public/TermsPage';
import { RegulatoryDisclaimerPage } from '@/pages/public/RegulatoryDisclaimerPage';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Donor pages
import { DonorDashboardPage } from '@/pages/donor/DonorDashboardPage';
import { CreateListingPage } from '@/pages/donor/CreateListingPage';
import { MyListingsPage } from '@/pages/donor/MyListingsPage';
import { ListingDetailsPage as DonorListingDetailsPage } from '@/pages/donor/ListingDetailsPage';
import { ClaimRequestsPage } from '@/pages/donor/ClaimRequestsPage';
import { DonationHistoryPage } from '@/pages/donor/DonationHistoryPage';
import { DonorProfilePage } from '@/pages/donor/DonorProfilePage';
import { DonorNotificationsPage } from '@/pages/donor/DonorNotificationsPage';

// Recipient pages
import { RecipientDashboardPage } from '@/pages/recipient/RecipientDashboardPage';
import { BrowseMedicinesPage } from '@/pages/recipient/BrowseMedicinesPage';
import { MedicineDetailsPage } from '@/pages/recipient/MedicineDetailsPage';
import { MyClaimsPage } from '@/pages/recipient/MyClaimsPage';
import { MyNeedsPage } from '@/pages/recipient/MyNeedsPage';
import { CreateNeedPage } from '@/pages/recipient/CreateNeedPage';
import { VerificationPage } from '@/pages/recipient/VerificationPage';
import { RecipientProfilePage } from '@/pages/recipient/RecipientProfilePage';
import { RecipientNotificationsPage } from '@/pages/recipient/RecipientNotificationsPage';

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { VerificationQueuePage } from '@/pages/admin/VerificationQueuePage';
import { VerificationDetailsPage } from '@/pages/admin/VerificationDetailsPage';
import { ReportsPage } from '@/pages/admin/ReportsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { ListingsPage as AdminListingsPage } from '@/pages/admin/ListingsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { AdminProfilePage } from '@/pages/admin/AdminProfilePage';

// Error pages
import { UnauthorizedPage } from '@/pages/errors/UnauthorizedPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { useAuthStore } from '@/store/authStore';
import { getDashboardPath } from '@/utils/roleHelpers';
import { Navigate } from 'react-router-dom';

function ForbiddenRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }
  return <Navigate to="/" replace />;
}

function AppRoutes() {
  useAuthInit();

  return (
    <Suspense fallback={<LoadingSpinner className="min-h-screen" />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="safety" element={<SafetyPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="regulatory-disclaimer" element={<RegulatoryDisclaimerPage />} />
        </Route>

        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        <Route path="401" element={<UnauthorizedPage />} />
        <Route path="403" element={<ForbiddenRedirect />} />

        <Route element={<ProtectedRoute />}>
          <Route path="donor" element={<DonorLayout />}>
            <Route index element={<DonorDashboardPage />} />
            <Route path="listings" element={<MyListingsPage />} />
            <Route path="listings/new" element={<CreateListingPage />} />
            <Route path="listings/:id" element={<DonorListingDetailsPage />} />
            <Route path="claims" element={<ClaimRequestsPage />} />
            <Route path="history" element={<DonationHistoryPage />} />
            <Route path="profile" element={<DonorProfilePage />} />
            <Route path="notifications" element={<DonorNotificationsPage />} />
          </Route>

          <Route path="recipient" element={<RecipientLayout />}>
            <Route index element={<RecipientDashboardPage />} />
            <Route path="medicines" element={<BrowseMedicinesPage />} />
            <Route path="medicines/:id" element={<MedicineDetailsPage />} />
            <Route path="claims" element={<MyClaimsPage />} />
            <Route path="needs" element={<MyNeedsPage />} />
            <Route path="needs/new" element={<CreateNeedPage />} />
            <Route path="verification" element={<VerificationPage />} />
            <Route path="profile" element={<RecipientProfilePage />} />
            <Route path="notifications" element={<RecipientNotificationsPage />} />
          </Route>

          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="verifications" element={<VerificationQueuePage />} />
            <Route path="verifications/:id" element={<VerificationDetailsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="listings" element={<AdminListingsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <SplashScreen />
            <AppRoutes />
            <ToastContainer />
          </BrowserRouter>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}
