import { Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, Sparkles } from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/utils/roleHelpers';

export function RegisterPage() {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return (
    <>
      <Helmet>
        <title>Register — {APP_NAME}</title>
        <meta name="description" content={`Create a ${APP_NAME} donor or recipient account.`} />
      </Helmet>

      <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center overflow-hidden px-3 py-6 sm:px-4 sm:py-12">
        {/* Background Image & Ambient Medical Lighting */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="/auth-bg.jpg"
            alt="MedBridge Clinical Pharmacy Background"
            className="w-full h-full object-cover object-center scale-105 filter brightness-90 contrast-105"
          />
          {/* Subtle cinematic gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#070D1E]/90 via-[#0B132B]/75 to-[#070D1E]/80 backdrop-blur-[1.5px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(7,13,30,0.7)_100%)]" />
        </div>

        {/* Ambient Glow behind Card */}
        <div className="absolute w-[450px] h-[550px] bg-primary/20 blur-[100px] rounded-full pointer-events-none -z-0" />

        {/* Auth Card with Framer Motion Animation */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-[#131E3A] p-5 sm:p-8 md:p-10 shadow-2xl card-hover-effect overflow-hidden text-slate-900 dark:text-white"
        >
          {/* Top Gradient Shimmer Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          {/* Top Header Bar with Proper Alignment */}
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <Link
              to={ROUTES.home}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors group"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1 text-primary" aria-hidden="true" />
              <span>Back to home</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 shadow-2xs">
              <Sparkles className="size-3 text-primary animate-pulse" />
              <span>Join The Network</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400 shadow-2xs border border-blue-100 dark:border-blue-800 shrink-0">
              <UserPlus className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create account</h1>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Join as a donor or verified recipient organization
              </p>
            </div>
          </div>

          <div className="mt-7 text-slate-900 dark:text-white">
            <RegisterForm />
          </div>
        </motion.div>
      </div>
    </>
  );
}


