import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Heart,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { APP_NAME, ROUTES, SAFETY_CHECKLIST_ITEMS } from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/utils/roleHelpers';
import { cn } from '@/utils/cn';

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<'donors' | 'recipients' | 'admins'>('donors');
  const { user, isAuthenticated } = useAuth();

  const donateHref = !isAuthenticated
    ? ROUTES.register
    : user?.role === 'DONOR'
    ? ROUTES.donor.createListing
    : user?.role === 'RECIPIENT'
    ? ROUTES.recipient.createNeed
    : ROUTES.admin.dashboard;

  const browseHref = !isAuthenticated
    ? ROUTES.login
    : user?.role === 'RECIPIENT'
    ? ROUTES.recipient.medicines
    : user?.role === 'DONOR'
    ? ROUTES.donor.listings
    : ROUTES.admin.listings;

  const getStartedHref = !isAuthenticated
    ? ROUTES.register
    : user
    ? getDashboardPath(user.role)
    : ROUTES.home;

  const donateBtnText = !isAuthenticated
    ? 'Start Donating Surplus'
    : user?.role === 'DONOR'
    ? 'Create Surplus Listing'
    : user?.role === 'RECIPIENT'
    ? 'Post Medicine Need'
    : 'Admin Dashboard';

  const browseBtnText = !isAuthenticated
    ? 'Browse Surplus Stock'
    : user?.role === 'DONOR'
    ? 'My Surplus Listings'
    : user?.role === 'RECIPIENT'
    ? 'Browse Surplus Stock'
    : 'Manage All Listings';

  return (
    <>
      <Helmet>
        <title>{APP_NAME} — Digital Surplus Medicine Redistribution & Verification Platform</title>
        <meta
          name="description"
          content="MedBridge connects verified healthcare organizations with surplus medicine donors to prevent waste, ensure traceability, and expand community access."
        />
      </Helmet>

      {/* Hero Section with Netflix-style collage wallpaper overlay */}
      <section className="relative overflow-hidden bg-[#070D1E] border-b border-slate-800/80 pt-20 pb-28 lg:pt-32 lg:pb-36 text-center text-white">
        {/* Netflix Collage Background Image */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none">
          <img
            src="/hero-bg.jpg"
            alt="Surplus Medicines Collage"
            className="w-full h-full object-cover object-center opacity-60 filter brightness-90 contrast-110"
          />
          {/* Netflix-style cinematic dark gradient & vignette */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#070D1E]/80 via-[#070D1E]/40 to-[#070D1E]/95" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(7,13,30,0.85)_100%)]" />
          {/* Bottom fade into the dark hero background */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#070D1E] to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/20 px-4 py-1.5 text-xs sm:text-sm font-semibold text-blue-300 shadow-lg backdrop-blur-md">
              <span className="flex size-2 rounded-full bg-blue-400 animate-pulse" />
              <Sparkles className="size-3.5 text-blue-300" aria-hidden="true" />
              Next-Gen Medicine Surplus Exchange
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.15] drop-shadow-md">
              Give Surplus Medicines a{' '}
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200 bg-clip-text text-transparent">
                Second Chance.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg leading-relaxed text-slate-200 max-w-2xl mx-auto drop-shadow-xs">
              MedBridge connects licensed donors with verified clinics and healthcare NGOs.
              Eliminate pharmaceutical waste, accelerate relief, and guarantee strict safety
              verification with complete batch audit traceability.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={donateHref} className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto shadow-xl hover:shadow-blue-500/25 bg-blue-600 hover:bg-blue-500 text-white border-0 transition-all group">
                  {donateBtnText}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Button>
              </Link>

              <Link to={browseHref} className="w-full sm:w-auto">
                <Button
                  variant="white-outline"
                  size="lg"
                  className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/25 shadow-md group"
                >
                  <Search className="size-4 text-sky-300 transition-transform group-hover:scale-110" aria-hidden="true" />
                  {browseBtnText}
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 pt-8 border-t border-white/15 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-200">
              <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-md">
                <ShieldCheck className="size-4 text-sky-400" />
                <span className="font-medium text-white">Verified Organizations Only</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-md">
                <CheckCircle2 className="size-4 text-blue-400" />
                <span className="font-medium text-white">Strict 9-Point Safety Check</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900/70 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow-md">
                <Clock className="size-4 text-amber-400" />
                <span className="font-medium text-white">Real-Time Expiry Matching</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Live Impact Counters Bar */}
      <section className="border-b border-border bg-surface py-10 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { value: '15,400+', label: 'Medicines Rescued', icon: Package, color: 'text-primary' },
              { value: '450+', label: 'Verified Clinics & NGOs', icon: Building2, color: 'text-secondary' },
              { value: '< 24 Hours', label: 'Average Claim Match', icon: Clock, color: 'text-accent' },
              { value: '100%', label: 'Traceable Audit Trail', icon: ShieldCheck, color: 'text-primary-dark' },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                {...fadeInUp}
                className="flex flex-col items-center text-center p-5 rounded-2xl border border-border/70 bg-surface shadow-xs card-hover-effect group"
              >
                <div className={`mb-2 flex size-11 items-center justify-center rounded-xl bg-background shadow-xs transition-transform duration-300 group-hover:scale-110 ${stat.color}`}>
                  <stat.icon className="size-5" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs sm:text-sm font-medium text-text-secondary">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Problem vs Solution Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-text-primary">
              Transforming Surplus Waste into Community Health
            </h2>
            <p className="mt-4 text-base sm:text-lg text-text-secondary">
              Millions of viable medication doses are incinerated annually while community clinics face critical shortages. MedBridge solves this with structured compliance.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: 'The Waste Crisis',
                desc: 'Unopened, in-date medicines in pharmacies and households are discarded due to a lack of safe redistribution channels.',
                badge: 'The Challenge',
                badgeColor: 'bg-critical/10 text-critical border-critical/20',
              },
              {
                icon: ShieldCheck,
                title: 'Verified Matching',
                desc: 'Only accredited medical professionals and verified NGO clinics can request surplus, ensuring legitimate end-use.',
                badge: 'The Solution',
                badgeColor: 'bg-primary/10 text-primary border-primary/20',
              },
              {
                icon: TrendingUp,
                title: 'Complete Traceability',
                desc: 'Every single handoff is logged with batch identifiers, manufacturer information, and timestamped custody logs.',
                badge: 'The Impact',
                badgeColor: 'bg-secondary/10 text-secondary border-secondary/20',
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                {...fadeInUp}
                className="rounded-2xl border border-border bg-surface p-7 shadow-xs card-hover-effect flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <card.icon className="size-6" aria-hidden="true" />
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-text-primary group-hover:text-primary transition-colors">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Step How It Works Workflow */}
      <section className="border-y border-border bg-surface py-20 sm:py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-primary">
              <Sparkles className="size-3.5" />
              Simple & Compliant
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-text-primary">
              How the Transfer Process Works
            </h2>
            <p className="mt-4 text-base text-text-secondary">
              From listing to verified clinic delivery in 4 secure, accountable steps.
            </p>
          </motion.div>

          <div className="mt-16 relative">
            {/* Connecting line between cards on desktop */}
            <div className="hidden lg:block absolute top-1/2 left-16 right-16 h-0.5 -translate-y-16 bg-gradient-to-r from-blue-500/20 via-sky-500/40 to-emerald-500/20 border-t-2 border-dashed border-slate-300 dark:border-slate-700/80 -z-0 pointer-events-none" />

            <motion.div
              variants={{
                initial: {},
                whileInView: {
                  transition: {
                    staggerChildren: 0.15,
                    delayChildren: 0.1,
                  },
                },
              }}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: '-60px' }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10"
            >
              {[
                {
                  step: '01',
                  title: 'Donor Lists Medicine',
                  desc: 'Donors upload surplus batches, verify sealed packaging condition, and confirm proper storage history.',
                  icon: Package,
                  accent: 'from-blue-600 to-indigo-600',
                  ringColor: 'group-hover:ring-blue-500/40',
                  glowColor: 'from-blue-500/10',
                },
                {
                  step: '02',
                  title: 'Automated Screening',
                  desc: 'Our engine computes shelf-life urgency, filters restricted classes, and matches nearby clinic needs.',
                  icon: Sparkles,
                  accent: 'from-sky-500 to-blue-600',
                  ringColor: 'group-hover:ring-sky-500/40',
                  glowColor: 'from-sky-500/10',
                },
                {
                  step: '03',
                  title: 'Authorized Claim',
                  desc: 'Verified clinics review inventory specifications and submit authorized claim requests.',
                  icon: Building2,
                  accent: 'from-indigo-600 to-purple-600',
                  ringColor: 'group-hover:ring-indigo-500/40',
                  glowColor: 'from-indigo-500/10',
                },
                {
                  step: '04',
                  title: 'Audited Transfer',
                  desc: 'Direct handover is executed with physical verification, real-time status updates, and audit logging.',
                  icon: ShieldCheck,
                  accent: 'from-emerald-600 to-teal-600',
                  ringColor: 'group-hover:ring-emerald-500/40',
                  glowColor: 'from-emerald-500/10',
                },
              ].map((item) => (
                <motion.div
                  key={item.step}
                  variants={{
                    initial: { opacity: 0, y: 35, scale: 0.95 },
                    whileInView: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 100,
                        damping: 14,
                      },
                    },
                  }}
                  whileHover={{
                    y: -10,
                    scale: 1.02,
                    transition: { duration: 0.25, ease: 'easeOut' },
                  }}
                  className="relative flex flex-col items-center text-center p-7 rounded-2xl border-2 border-slate-200 dark:border-blue-500/35 bg-white dark:bg-[#0E172F] shadow-md hover:shadow-2xl hover:border-blue-600 dark:hover:border-blue-400 transition-all duration-300 group cursor-default overflow-hidden"
                >
                  {/* Card glow background on hover */}
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-b via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl',
                      item.glowColor,
                    )}
                  />

                  {/* Step Badge with Icon */}
                  <div className="relative mb-5">
                    <motion.div
                      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
                      transition={{ duration: 0.4 }}
                      className={cn(
                        'flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-extrabold text-white shadow-lg transition-all duration-300 group-hover:shadow-xl group-hover:ring-4',
                        item.accent,
                        item.ringColor,
                      )}
                    >
                      <span className="tracking-tight">{item.step}</span>
                    </motion.div>
                    <div className="absolute -bottom-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-slate-900 text-white shadow-md border border-white/20">
                      <item.icon className="size-3 text-sky-300" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary dark:group-hover:text-blue-400 transition-colors duration-200">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {item.desc}
                  </p>

                  {/* Expanding accent indicator on hover */}
                  <div className="mt-6 w-8 h-1 rounded-full bg-slate-200 dark:bg-slate-700 group-hover:w-16 group-hover:bg-primary transition-all duration-300" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive Feature Tabs Section */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Tailored Portals</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-text-primary">
              Built for Every Stakeholder
            </h2>
            <p className="mt-4 text-base text-text-secondary">
              Dedicated interfaces tailored for donors, health organizations, and platform auditors.
            </p>
          </motion.div>

          {/* Tab Selector */}
          <div className="mt-10 flex justify-center px-2">
            <div className="inline-flex max-w-full overflow-x-auto rounded-xl border border-border bg-surface p-1.5 shadow-xs scrollbar-none">
              {(['donors', 'recipients', 'admins'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3.5 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap capitalize ${
                    activeTab === tab
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab === 'donors' ? 'For Donors' : tab === 'recipients' ? 'For Recipient Clinics' : 'For Administrators'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Panels */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-10 rounded-2xl border border-border bg-surface p-8 sm:p-12 shadow-sm"
          >
            {activeTab === 'donors' && (
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                    Donor Features
                  </span>
                  <h3 className="mt-3 text-2xl font-bold text-text-primary">
                    Effortless Listing with Instant Impact Visibility
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Whether you are an individual household, a licensed retail pharmacy, or a distributor, MedBridge makes donating straightforward, safe, and transparent.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      'Fast autocomplete with national drug catalogue integration',
                      'Automated expiry urgency calculation & alerts',
                      'Real-time tracking of claim requests from verified clinics',
                      'Permanent deletion controls & complete transfer history',
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="size-4 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link to={!isAuthenticated ? ROUTES.register : user?.role === 'DONOR' ? ROUTES.donor.createListing : user?.role ? getDashboardPath(user.role) : ROUTES.home}>
                      <Button size="md">
                        {!isAuthenticated || user?.role === 'DONOR' ? 'Create Surplus Listing' : 'Donor Portal'}
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold text-text-primary">Donor Activity Center</span>
                    <span className="text-xs font-medium text-secondary">● Active Stream</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-surface p-3 border border-border/80">
                      <div>
                        <p className="text-xs font-bold text-text-primary">Amoxicillin 250mg</p>
                        <p className="text-[11px] text-text-secondary">Claimed by St. Jude Community Clinic</p>
                      </div>
                      <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] font-bold text-secondary">
                        Delivered
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-surface p-3 border border-border/80">
                      <div>
                        <p className="text-xs font-bold text-text-primary">Paracetamol 500mg</p>
                        <p className="text-[11px] text-text-secondary">Claim pending review</p>
                      </div>
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-bold text-accent">
                        Pending
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'recipients' && (
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <span className="inline-block rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
                    Clinic & NGO Hub
                  </span>
                  <h3 className="mt-3 text-2xl font-bold text-text-primary">
                    Access Verified Stock & Post Immediate Needs
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Accredited clinics, charitable dispensaries, and mobile health missions can search available surplus or submit wishlists for donor matching.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      'Search by generic drug name, manufacturer, and dosage',
                      'Location-based proximity & distance sorting',
                      'Post urgent medicine need requests visible to nearby donors',
                      'Fast-track verified recipient credentialing',
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="size-4 text-secondary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link to={!isAuthenticated ? ROUTES.login : user?.role === 'RECIPIENT' ? ROUTES.recipient.medicines : user?.role === 'DONOR' ? ROUTES.donor.listings : ROUTES.admin.listings}>
                      <Button size="md" variant="secondary">
                        {!isAuthenticated || user?.role === 'RECIPIENT' ? 'Browse Available Stock' : 'View Listings'}
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold text-text-primary">Clinic Needs Dashboard</span>
                    <span className="text-xs font-medium text-primary">● Live Inventory</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-surface p-3 border border-border/80">
                      <div>
                        <p className="text-xs font-bold text-text-primary">Oral Rehydration Salts</p>
                        <p className="text-[11px] text-text-secondary">Urgency: Critical · 300 packs needed</p>
                      </div>
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
                        Matched (2 Donors)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'admins' && (
              <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                <div>
                  <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-bold text-accent">
                    Compliance & Oversight
                  </span>
                  <h3 className="mt-3 text-2xl font-bold text-text-primary">
                    Total Transparency & Verification Workflow
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                    Robust compliance tooling ensures zero counterfeits, strict NGO validation, and complete auditable trail for regulatory compliance.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {[
                      'Recipient license verification queue with document approval',
                      'Listing content moderation and user dispute reports',
                      'Immutable audit log recording every create, edit, claim, and deletion',
                      'Platform-wide impact analytics and waste prevention metrics',
                    ].map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm text-text-secondary">
                        <CheckCircle2 className="size-4 text-accent shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link to={!isAuthenticated ? ROUTES.login : user?.role === 'ADMIN' ? ROUTES.admin.dashboard : user?.role ? getDashboardPath(user.role) : ROUTES.home}>
                      <Button size="md" variant="outline">
                        {!isAuthenticated || user?.role === 'ADMIN' ? 'Admin Portal' : 'My Dashboard'}
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background p-6 shadow-xs">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <span className="text-xs font-bold text-text-primary">Audit & Verification Log</span>
                    <span className="text-xs font-medium text-secondary">● 100% Traceable</span>
                  </div>
                  <div className="mt-4 space-y-2 text-xs font-mono text-text-secondary">
                    <p className="p-2 rounded bg-surface border border-border">
                      [AUDIT] VERIFICATION_APPROVED - City Hope NGO (ID: #NGO-412)
                    </p>
                    <p className="p-2 rounded bg-surface border border-border">
                      [AUDIT] LISTING_COMPLETED - 100x Paracetamol 500mg (Batch: #PCM-088)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Safety Checklist Spotlight */}
      <section className="border-t border-border bg-surface py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            <motion.div {...fadeInUp} className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3.5 py-1 text-xs font-bold text-secondary">
                <ShieldCheck className="size-4" />
                Zero-Compromise Safety Standards
              </div>
              <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-text-primary">
                The MedBridge 9-Point Safety Checklist
              </h2>
              <p className="mt-4 text-base leading-relaxed text-text-secondary">
                Every donated listing must strictly satisfy all safety checkpoints before being visible in the public matching catalogue.
              </p>
              <div className="mt-8">
                <Link to={ROUTES.safety}>
                  <Button variant="outline" size="md">
                    Read Complete Safety Protocols
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div {...fadeInUp} className="lg:col-span-6 grid gap-3 sm:grid-cols-2">
              {SAFETY_CHECKLIST_ITEMS.map((item, index) => (
                <div
                  key={item.key}
                  className="flex items-start gap-3 rounded-xl border border-border bg-background p-3.5 shadow-xs card-hover-effect group cursor-default"
                >
                  <div className="flex size-6 items-center justify-center rounded-full bg-secondary/15 text-secondary shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">Point {index + 1}</span>
                    <p className="text-xs text-text-secondary leading-snug mt-0.5">{item.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Community Testimonials */}
      <section className="py-20 sm:py-24 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeInUp} className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Community Voice</span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-text-primary">
              Trusted by Donors & Healthcare Workers
            </h2>
          </motion.div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                quote: 'MedBridge allowed our hospital pharmacy to safely reroute excess unexpired antibiotics to free community clinics within 48 hours.',
                name: 'Dr. Anita Verma',
                role: 'Chief Pharmacist, Apex Health Care',
              },
              {
                quote: 'As an emergency mobile clinic, getting verified took less than 24 hours. We received critical pediatric supplies that saved patient lives.',
                name: 'Marcus Thorne',
                role: 'Director, Hope Relief Outreach',
              },
              {
                quote: 'The batch traceability and automatic expiration alerts give us complete peace of mind that nothing expired ever enters distribution.',
                name: 'Sarah Chen',
                role: 'Compliance Officer, MedAid Foundation',
              },
            ].map((testi) => (
              <motion.div
                key={testi.name}
                {...fadeInUp}
                className="rounded-2xl border border-border bg-surface p-7 shadow-xs card-hover-effect flex flex-col justify-between group"
              >
                <p className="text-sm italic leading-relaxed text-text-secondary group-hover:text-text-primary transition-colors">"{testi.quote}"</p>
                <div className="mt-6 pt-4 border-t border-border/80">
                  <p className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{testi.name}</p>
                  <p className="text-xs text-text-secondary">{testi.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Energy Call to Action Banner */}
      <section className="py-16 sm:py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.94 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            whileHover={{
              y: -8,
              scale: 1.012,
              transition: { duration: 0.35, ease: 'easeOut' },
            }}
            className={cn(
              'relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 sm:p-16 text-white shadow-2xl border-2 border-white/25 hover:border-white/50 text-center group cursor-pointer select-none',
              'transition-all duration-300 ease-out transform-gpu',
              'hover:shadow-[0_25px_60px_-12px_rgba(37,99,235,0.6)] active:scale-[0.995]',
              // Shimmer Light Sweep on Hover
              'before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-transform before:duration-1000 before:pointer-events-none before:z-20',
            )}
          >
            {/* Animated Aurora Gradient Orbs */}
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                opacity: [0.35, 0.65, 0.35],
                x: [0, 25, 0],
                y: [0, -25, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-0 right-0 -mt-20 -mr-20 size-80 rounded-full bg-cyan-400/35 blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
                x: [0, -30, 0],
                y: [0, 30, 0],
              }}
              transition={{
                duration: 9,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
              className="absolute bottom-0 left-0 -mb-20 -ml-20 size-80 rounded-full bg-indigo-300/35 blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{
                scale: [0.9, 1.2, 0.9],
                opacity: [0.15, 0.35, 0.15],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 rounded-full bg-white/10 blur-3xl pointer-events-none"
            />

            {/* Floating ambient decorative icons */}
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden md:flex absolute top-8 left-12 size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-sky-200 pointer-events-none shadow-lg"
            >
              <Package className="size-6" />
            </motion.div>

            <motion.div
              animate={{ y: [0, 14, 0], rotate: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              className="hidden md:flex absolute bottom-8 right-12 size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-cyan-200 pointer-events-none shadow-lg"
            >
              <ShieldCheck className="size-6" />
            </motion.div>

            <div className="relative z-10 mx-auto max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-4 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-md backdrop-blur-md">
                <motion.span
                  animate={{ scale: [1, 1.35, 1, 1.35, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex"
                >
                  <Heart className="size-3.5 text-rose-300" fill="currentColor" />
                </motion.span>
                Join the Movement Against Medicine Waste
              </span>

              <h2 className="mt-5 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-md">
                Ready to make an immediate impact?
              </h2>

              <p className="mt-4 text-base sm:text-lg leading-relaxed text-white/90 drop-shadow-xs">
                Register in minutes as a donor or healthcare provider. Start donating surplus medicines or claiming essentials today.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to={getStartedHref} className="w-full sm:w-auto">
                  <Button
                    variant="white"
                    size="lg"
                    className="w-full sm:w-auto shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group/btn"
                  >
                    {isAuthenticated ? 'Go to Dashboard' : 'Create Free Account'}
                    <ArrowRight className="size-4 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </Link>
                <Link to={ROUTES.howItWorks} className="w-full sm:w-auto">
                  <Button
                    variant="white-outline"
                    size="lg"
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border-white/25 shadow-md hover:scale-105 transition-all duration-300"
                  >
                    Learn How It Works
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
