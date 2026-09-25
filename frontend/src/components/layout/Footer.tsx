import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUp,
  Building2,
  FileCheck2,
  HeartHandshake,
  Lock,
  Mail,
  PackageCheck,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';

export function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto border-t border-border/80 bg-gradient-to-b from-surface via-surface to-background text-text-primary">
      {/* Top Status & Trust Metric Bar */}
      <div className="border-b border-border/60 bg-background/40 backdrop-blur-xs py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs">
          {/* Live Operational Status */}
          <div className="flex items-center gap-2.5">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-text-primary">Platform Status:</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
              <Sparkles className="size-3" />
              Verified Medicine Exchange Active
            </span>
          </div>

          {/* Key Trust Badges */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-text-muted">
            <span className="inline-flex items-center gap-1.5 font-medium hover:text-text-primary transition-colors">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              100% Verified Healthcare Recipient Network
            </span>
            <span className="hidden md:inline text-border">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium hover:text-text-primary transition-colors">
              <PackageCheck className="size-4 text-emerald-500" aria-hidden="true" />
              Batch & Expiry Controlled
            </span>
            <span className="hidden md:inline text-border">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium hover:text-text-primary transition-colors">
              <FileCheck2 className="size-4 text-blue-400" aria-hidden="true" />
              Traceable Audit Log
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand, Mission & Direct Contact (Spans 4 cols on lg) */}
          <div className="space-y-5 lg:col-span-4">
            <Link to={ROUTES.home} className="inline-flex items-center gap-2.5 group">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white font-extrabold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                <Activity className="size-5 text-white" />
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-text-primary">
                  Med<span className="text-primary">Bridge</span>
                </span>
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" title="Platform Online" />
              </div>
            </Link>

            <p className="text-sm leading-relaxed text-text-muted max-w-sm">
              Connecting surplus, unexpired medicines from licensed donors and pharmacies with verified clinics and healthcare NGOs to save lives and eliminate pharmaceutical waste.
            </p>

            {/* Direct Contact Cards */}
            <div className="space-y-2 pt-1">
              <a
                href="mailto:support@medbridge.com"
                className="group flex items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-2.5 text-xs text-text-muted transition-all hover:border-primary/40 hover:bg-background hover:text-text-primary"
              >
                <div className="rounded-lg bg-primary/10 p-1.5 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <Mail className="size-3.5" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">support@medbridge.com</div>
                  <div className="text-[11px] text-text-muted">General & NGO Support Inquiries</div>
                </div>
              </a>

              <a
                href="tel:+918250597771"
                className="group flex items-center gap-3 rounded-xl border border-border/70 bg-background/50 p-2.5 text-xs text-text-muted transition-all hover:border-emerald-500/40 hover:bg-background hover:text-text-primary"
              >
                <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  <PhoneCall className="size-3.5" />
                </div>
                <div>
                  <div className="font-medium text-text-primary">+91 8250597771</div>
                  <div className="text-[11px] text-text-muted">Emergency Donation Coordination (24/7)</div>
                </div>
              </a>
            </div>
          </div>

          {/* Column 2: Platform & Features (Spans 3 cols on lg) */}
          <div className="space-y-4 lg:col-span-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-primary">
              <Search className="size-3.5 text-primary" />
              Platform & Features
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to={ROUTES.howItWorks}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-primary/60" />
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.safety}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-primary/60" />
                  Safety & Quality Checklist
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.about}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-primary/60" />
                  About Our Mission
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.donor.createListing}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-primary/60" />
                  Donate Surplus Medicine
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.recipient.medicines}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-primary/60" />
                  Browse Medicine Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Portals & Verification (Spans 2 cols on lg) */}
          <div className="space-y-4 lg:col-span-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-primary">
              <Building2 className="size-3.5 text-emerald-500" />
              User Portals
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to={ROUTES.donor.dashboard}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-emerald-500/60" />
                  Donor Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.recipient.dashboard}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-emerald-500/60" />
                  Recipient Portal
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.recipient.verification}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-emerald-500/60" />
                  NGO Verification
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.recipient.claims}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-emerald-500/60" />
                  Track Claims
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.recipient.needs}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-emerald-500/60" />
                  Post Medicine Need
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Governance & Legal (Spans 3 cols on lg) */}
          <div className="space-y-4 lg:col-span-3">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-primary">
              <Lock className="size-3.5 text-blue-400" />
              Governance & Legal
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to={ROUTES.regulatory}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-blue-400/60" />
                  Regulatory & Compliance Notice
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.privacy}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-blue-400/60" />
                  Privacy Policy & Data Security
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.terms}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-blue-400/60" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to={ROUTES.safety}
                  className="inline-flex items-center gap-2 text-text-muted hover:text-primary transition-colors"
                >
                  <span className="size-1 rounded-full bg-blue-400/60" />
                  Drug Quality Guidelines
                </Link>
              </li>
            </ul>

            {/* Verification Guarantee Pill */}
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-text-muted">
              <div className="flex items-center gap-1.5 font-semibold text-primary">
                <HeartHandshake className="size-4" /> Zero-Waste Healthcare
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-text-muted">
                Facilitating safe, non-commercial medicine donations exclusively between authenticated parties.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Compliance & Smooth Back-to-Top */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-xs text-text-muted text-center sm:text-left">
            <span>
              &copy; {year} <strong className="text-text-primary">{APP_NAME}</strong> Platform.
            </span>
            <span className="hidden sm:inline text-border">•</span>
            <span>All unexpired medicine transfers are strictly monitored and logged.</span>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="group inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2 text-xs font-semibold text-text-muted shadow-xs transition-all hover:border-primary/50 hover:bg-background hover:text-text-primary cursor-pointer"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <ArrowUp className="size-3.5 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
