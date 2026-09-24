import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  PackageCheck,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  APP_NAME,
  ELIGIBILITY_MESSAGE,
  REGULATORY_DISCLAIMER,
  ROUTES,
  SAFETY_CHECKLIST_ITEMS,
} from '@/lib/constants';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardPath } from '@/utils/roleHelpers';

export function SafetyPage() {
  const { user, isAuthenticated } = useAuth();

  const donateHref = !isAuthenticated
    ? ROUTES.register
    : user?.role === 'DONOR'
    ? ROUTES.donor.createListing
    : user
    ? getDashboardPath(user.role)
    : ROUTES.home;

  return (
    <>
      <Helmet>
        <title>Safety & Eligibility Standards — {APP_NAME}</title>
        <meta
          name="description"
          content="MedBridge safety standards, 9-point checklist, eligibility screening, and recipient verification protocols."
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

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/20 px-4 py-1.5 text-xs font-semibold text-sky-300 shadow-lg backdrop-blur-md">
            <ShieldCheck className="size-3.5 text-sky-300" />
            Safety-First Platform
          </span>
          <h1 className="mt-4 text-3xl sm:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">
            Safety &{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-blue-200 bg-clip-text text-transparent">
              Eligibility Standards
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto drop-shadow-xs">
            Our uncompromising 9-point safety protocol ensures that only pristine, uncompromised, and verified pharmaceuticals are approved for redistribution.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 space-y-16">
        {/* The 9-Point Safety Checklist */}
        <div>
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">The 9 Mandatory Safety Criteria</h2>
              <p className="text-sm text-text-secondary mt-1">Every listing must satisfy 100% of these parameters.</p>
            </div>
            <span className="rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold text-secondary">
              9/9 Criteria Enforced
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SAFETY_CHECKLIST_ITEMS.map((item, index) => (
              <div
                key={item.key}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs card-hover-effect"
              >
                <div className="flex size-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary shrink-0 mt-0.5">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Point {index + 1}</span>
                  <p className="text-sm font-semibold text-text-primary mt-0.5">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Screening Guidelines Cards */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Eligibility Screening */}
          <div className="rounded-2xl border border-border bg-surface p-7 shadow-xs card-hover-effect">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
              <PackageCheck className="size-6" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Preliminary Eligibility Screening</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Medicines must be in original manufacturer blister packs, bottles, or sealed boxes with completely intact tamper-evident seals.
            </p>
            <div className="mt-4 rounded-xl bg-primary/5 p-3.5 border border-primary/15 text-xs text-primary font-medium">
              {ELIGIBILITY_MESSAGE}
            </div>
          </div>

          {/* Recipient Verification */}
          <div className="rounded-2xl border border-border bg-surface p-7 shadow-xs card-hover-effect">
            <div className="flex size-12 items-center justify-center rounded-xl bg-secondary/10 text-secondary mb-4">
              <FileCheck className="size-6" />
            </div>
            <h3 className="text-xl font-bold text-text-primary">Recipient Vetting & Accreditation</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Recipients cannot claim medicines anonymously. All receiving entities undergo identity, registration license, and medical accreditation verification.
            </p>
            <div className="mt-4 rounded-xl bg-background p-3.5 border border-border text-xs text-text-secondary">
              Verification required prior to claim authorization • Annual license renewal audited.
            </div>
          </div>
        </div>

        {/* Prohibited Items Warning */}
        <div className="rounded-2xl border border-critical/30 bg-critical/5 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex size-10 items-center justify-center rounded-xl bg-critical/15 text-critical shrink-0">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-critical">Strictly Prohibited For Donation</h3>
              <p className="mt-1 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Opened liquids, partially used blister strips, unsealed powders, expired medications, and narcotics/controlled schedule substances are strictly prohibited on MedBridge and will result in immediate donor account suspension.
              </p>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer Box */}
        <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
          <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center gap-2">
            <ShieldAlert className="size-4 text-accent" />
            Regulatory Disclaimer
          </h3>
          <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
            {REGULATORY_DISCLAIMER}
          </p>
        </div>

        {/* CTA */}
        <div className="rounded-2xl gradient-primary p-8 sm:p-10 text-white text-center shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-bold">Have Unopened In-Date Surplus?</h2>
          <p className="mt-2 text-sm sm:text-base text-white/90 max-w-xl mx-auto">
            Donate in compliance with verified safety guidelines today.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link to={donateHref}>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold">
                Start Safe Donation
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
