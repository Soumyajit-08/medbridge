import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  FileSearch,
  Package,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/utils/roleHelpers';
import { cn } from '@/utils/cn';

const workflowSteps = [
  {
    step: '01',
    title: 'Donors List Surplus Medicines',
    icon: Package,
    badge: 'Donor Portal',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    description:
      'Licensed pharmacies, healthcare clinics, and households submit unexpired surplus inventory. Details include batch number, expiry date, storage conditions, and photographic verification.',
  },
  {
    step: '02',
    title: 'Recipient Verification & Accreditation',
    icon: Building2,
    badge: 'Security & Compliance',
    badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
    description:
      'Recipient organizations (NGOs, charitable dispensaries, rural clinics) upload government healthcare registration and compliance licenses for administrative vetting before claiming stock.',
  },
  {
    step: '03',
    title: 'Intelligent Matching & Claims Review',
    icon: FileSearch,
    badge: 'Matching Engine',
    badgeColor: 'bg-accent/10 text-accent border-accent/20',
    description:
      'Our engine matches urgent clinic needs with active listings by proximity and shelf-life urgency. Donors review and confirm claims with one click.',
  },
  {
    step: '04',
    title: 'Secure Handover & Audit Trail',
    icon: Truck,
    badge: 'Full Traceability',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
    description:
      'Medicines are transferred with physical verification upon receipt. Status transitions are immutably logged for regulatory reporting and impact tracking.',
  },
];

export function HowItWorksPage() {
  const { user, isAuthenticated } = useAuth();

  const primaryHref = !isAuthenticated
    ? ROUTES.register
    : user
    ? getDashboardPath(user.role)
    : ROUTES.home;

  const browseHref = !isAuthenticated
    ? ROUTES.login
    : user?.role === 'RECIPIENT'
    ? ROUTES.recipient.medicines
    : user?.role === 'DONOR'
    ? ROUTES.donor.listings
    : ROUTES.admin.listings;

  const browseBtnText = !isAuthenticated
    ? 'Browse Catalogue'
    : user?.role === 'DONOR'
    ? 'My Surplus Listings'
    : user?.role === 'RECIPIENT'
    ? 'Browse Catalogue'
    : 'Manage All Listings';

  return (
    <>
      <Helmet>
        <title>How It Works — {APP_NAME}</title>
        <meta
          name="description"
          content="Understand the complete MedBridge medicine redistribution workflow from donor listing to verified clinic delivery."
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
            Step-By-Step Workflow
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
            How{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200 bg-clip-text text-transparent">
              MedBridge Works
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto drop-shadow-xs">
            A safe, transparent, and regulatory-aware redistribution pipeline designed for healthcare speed and accountability.
          </p>
        </motion.div>
      </section>

      {/* Steps Section */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-12">
        <motion.div
          variants={{
            initial: {},
            whileInView: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
          initial="initial"
          whileInView="whileInView"
          viewport={{ once: true, margin: '-60px' }}
          className="grid gap-8 md:grid-cols-2"
        >
          {workflowSteps.map((item) => (
            <motion.div
              key={item.step}
              variants={{
                initial: { opacity: 0, y: 30 },
                whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
              }}
              whileHover={{
                y: -8,
                scale: 1.015,
                transition: { duration: 0.25, ease: 'easeOut' },
              }}
              className="rounded-2xl border-2 border-slate-200 dark:border-blue-500/35 bg-surface p-7 shadow-xs hover:shadow-xl hover:border-primary dark:hover:border-blue-400 transition-all duration-300 flex flex-col justify-between group cursor-default"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                    <item.icon className="size-6" />
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-primary uppercase tracking-wider">Step {item.step}</span>
                </div>
                <h2 className="mt-1 text-xl font-bold text-text-primary group-hover:text-primary transition-colors">{item.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Safety Banner */}
        <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-secondary/15 text-secondary shrink-0">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Strict Quality & Expiry Screening</h3>
              <p className="mt-1 text-sm text-text-secondary max-w-xl">
                Every listing must pass our mandatory 9-point verification check. Damaged packaging or expired batches are strictly blocked by the system.
              </p>
            </div>
          </div>
          <Link to={ROUTES.safety} className="shrink-0">
            <Button variant="outline" size="sm">
              View Safety Checklist
            </Button>
          </Link>
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ y: -6, scale: 1.01, transition: { duration: 0.3 } }}
          className={cn(
            'relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 sm:p-12 text-white text-center shadow-2xl border-2 border-white/25 hover:border-white/50 group cursor-pointer select-none',
            'transition-all duration-300 ease-out transform-gpu',
            'hover:shadow-[0_25px_60px_-12px_rgba(37,99,235,0.6)] active:scale-[0.995]',
            // Shimmer Light Sweep on Hover
            'before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-transform before:duration-1000 before:pointer-events-none before:z-20',
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
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight drop-shadow-md">Ready to Participate?</h2>
            <p className="mt-3 text-sm sm:text-base text-white/90 max-w-xl mx-auto drop-shadow-xs">
              Create an account in less than 2 minutes to start sharing or requesting medicine surplus.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link to={primaryHref}>
                <Button variant="white" size="lg" className="hover:scale-105 shadow-xl transition-all duration-300 group">
                  {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to={browseHref}>
                <Button variant="white-outline" size="lg" className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/25 shadow-md hover:scale-105 transition-all duration-300">
                  {browseBtnText}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
