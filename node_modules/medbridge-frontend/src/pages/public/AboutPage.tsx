import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Heart, Package, ShieldCheck, Sparkles, Award, ArrowRight } from 'lucide-react';
import { APP_NAME, REGULATORY_DISCLAIMER, ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/utils/roleHelpers';
import { cn } from '@/utils/cn';

export function AboutPage() {
  const { user, isAuthenticated } = useAuth();

  const getStartedHref = !isAuthenticated
    ? ROUTES.register
    : user
    ? getDashboardPath(user.role)
    : ROUTES.home;

  return (
    <>
      <Helmet>
        <title>About Us — {APP_NAME}</title>
        <meta
          name="description"
          content={`Learn about ${APP_NAME}, our mission to prevent pharmaceutical waste, and our verified redistribution infrastructure.`}
        />
      </Helmet>

      {/* Hero Header with Netflix-style collage wallpaper overlay */}
      <section className="relative overflow-hidden bg-[#070D1E] border-b border-slate-800/80 py-16 sm:py-24 text-center text-white">
        {/* Netflix Collage Background Image */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="/hero-bg.jpg"
            alt="Surplus Medicines Collage"
            className="w-full h-full object-cover object-center opacity-55 filter brightness-90 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#070D1E]/80 via-[#070D1E]/40 to-[#070D1E]/95" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,13,30,0.85)_100%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#070D1E] to-transparent" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-1.5 text-xs font-semibold text-blue-300 shadow-lg backdrop-blur-md">
            <Sparkles className="size-3.5 text-blue-300" />
            Our Vision & Purpose
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
            Bridging the Gap in{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200 bg-clip-text text-transparent">
              Healthcare Access
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto drop-shadow-xs">
            {APP_NAME} is a digital surplus medicine coordination platform designed to save lives, eliminate preventable pharmaceutical incineration, and empower verified healthcare providers.
          </p>
        </motion.div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
        {/* Three Core Pillars */}
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="rounded-2xl border-2 border-slate-200 dark:border-blue-500/35 bg-surface p-7 shadow-xs card-hover-effect">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <Package className="size-6" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Waste Elimination</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Redirecting unopened, unexpired batches before they cross disposal thresholds, reducing hazardous landfill burden.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 dark:border-blue-500/35 bg-surface p-7 shadow-xs card-hover-effect">
            <div className="flex size-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary mb-4">
              <ShieldCheck className="size-6" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Strict Verification</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Only accredited hospitals, verified non-profit clinics, and mobile health missions receive medicine allocation.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 dark:border-blue-500/35 bg-surface p-7 shadow-xs card-hover-effect">
            <div className="flex size-12 items-center justify-center rounded-xl bg-critical/10 text-critical mb-4">
              <Heart className="size-6" />
            </div>
            <h2 className="text-lg font-bold text-text-primary">Direct Community Impact</h2>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Providing free and low-cost essential medications to underserved patients facing chronic supply shortages.
            </p>
          </div>
        </div>

        {/* What We Are Section */}
        <div className="rounded-2xl border-2 border-slate-200 dark:border-blue-500/35 bg-surface p-8 sm:p-10 shadow-xs">
          <h2 className="text-2xl font-bold text-text-primary">What We Are — And What We Are Not</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 text-sm">
            <div className="rounded-xl bg-primary/5 p-5 border border-primary/15">
              <h3 className="font-bold text-primary flex items-center gap-2 mb-2">
                <ShieldCheck className="size-4" /> What MedBridge Is:
              </h3>
              <ul className="space-y-2 text-text-secondary leading-relaxed">
                <li>• A coordination and batch traceability infrastructure.</li>
                <li>• An audit trail platform for verified medicine handovers.</li>
                <li>• An expiry-aware algorithmic matching engine.</li>
                <li>• A partner to licensed healthcare NGOs and pharmacies.</li>
              </ul>
            </div>

            <div className="rounded-xl bg-background p-5 border border-border">
              <h3 className="font-bold text-text-primary flex items-center gap-2 mb-2">
                <Award className="size-4 text-text-secondary" /> Regulatory Scope:
              </h3>
              <p className="text-text-secondary text-xs leading-relaxed">
                {REGULATORY_DISCLAIMER}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.3 } }}
          className={cn(
            'relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 sm:p-12 text-white text-center shadow-2xl border-2 border-white/25 hover:border-white/50 group cursor-pointer select-none',
            'transition-all duration-300 ease-out transform-gpu',
            'hover:shadow-[0_25px_60px_-12px_rgba(37,99,235,0.55)] active:scale-[0.995]',
            // Button-style shimmer light sweep on hover across the whole card
            'before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-1000 before:pointer-events-none before:z-20',
          )}
        >
          {/* Animated Aurora Orbs */}
          <motion.div
            animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-0 right-0 -mt-16 -mr-16 size-72 rounded-full bg-cyan-400/35 blur-3xl pointer-events-none"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.25, 0.55, 0.25] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-0 left-0 -mb-16 -ml-16 size-72 rounded-full bg-indigo-300/35 blur-3xl pointer-events-none"
          />

          <div className="relative z-10">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">Join Our Healthcare Network</h2>
            <p className="mt-3 text-sm sm:text-base text-white/90 max-w-xl mx-auto drop-shadow-xs">
              Whether you have surplus medicine to donate or represent a clinic in need of stock, we are ready to assist.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Link to={getStartedHref}>
                <Button variant="white" size="lg" className="hover:scale-105 shadow-xl transition-all duration-300 group">
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started Today'}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
