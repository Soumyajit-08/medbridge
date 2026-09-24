import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/utils/roleHelpers';

export function ForgotPasswordPage() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return (
    <>
      <Helmet>
        <title>Forgot Password — {APP_NAME}</title>
        <meta name="description" content={`Reset your ${APP_NAME} account password.`} />
      </Helmet>

      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden px-4 py-12">
        {/* Background Image & Ambient Medical Lighting */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="/auth-bg.jpg"
            alt="MedBridge Clinical Pharmacy Background"
            className="w-full h-full object-cover object-center scale-105 filter brightness-90 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#070D1E]/90 via-[#0B132B]/75 to-[#070D1E]/80 backdrop-blur-[1.5px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(7,13,30,0.7)_100%)]" />
        </div>

        {/* Ambient Glow behind Card */}
        <div className="absolute w-[450px] h-[550px] bg-accent/20 blur-[100px] rounded-full pointer-events-none -z-0" />

        {/* Auth Card with Framer Motion Animation */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#131E3A] p-8 sm:p-10 shadow-2xl card-hover-effect overflow-hidden text-slate-900 dark:text-white"
        >
          {/* Top Gradient Shimmer Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />

          {/* Top Header Bar with Proper Alignment */}
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <Link
              to={ROUTES.home}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors group"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1 text-primary" aria-hidden="true" />
              <span>Back to home</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 shadow-2xs">
              <KeyRound className="size-3 text-amber-600 dark:text-amber-400 animate-pulse" />
              <span>Recovery</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shadow-2xs border border-amber-100 dark:border-amber-800 shrink-0">
              <KeyRound className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Forgot password</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">Enter your email to receive recovery instructions</p>
            </div>
          </div>

          <div className="mt-7 text-slate-900 dark:text-white">
            <ForgotPasswordForm />
          </div>
        </motion.div>
      </div>
    </>
  );
}


