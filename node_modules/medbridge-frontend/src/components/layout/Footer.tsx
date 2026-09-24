import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowUp,
  CheckCircle,
  FileCheck,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { APP_NAME, ROUTES } from '@/lib/constants';

export function Footer() {
  const year = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="mt-auto border-t border-border bg-surface text-text-primary">
      {/* Top Banner: Emergency & Compliance Trust Bar */}
      <div className="border-b border-border/80 bg-background/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75"></span>
              <span className="relative inline-flex size-2.5 rounded-full bg-secondary"></span>
            </span>
            <span className="font-semibold text-text-primary">Platform Status:</span>
            <span className="text-secondary font-medium">Verified Medicine Exchange Active</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-text-secondary">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              100% Verified NGOs & Clinics
            </span>
            <span className="hidden sm:inline text-border">•</span>
            <span className="inline-flex items-center gap-1.5 font-medium">
              <FileCheck className="size-4 text-primary" aria-hidden="true" />
              Traceable Batch Audit Trail
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Columns */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Mission Column */}
          <div className="sm:col-span-2 lg:col-span-2 space-y-4">
            <Link to={ROUTES.home} className="inline-flex items-center gap-2.5 group">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white font-extrabold shadow-md group-hover:scale-105 transition-transform duration-200">
                <Activity className="size-5 text-white" />
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Med<span className="text-primary dark:text-blue-400">Bridge</span>
                </span>
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" title="Platform Operational" />
              </div>
            </Link>

            <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
              Connecting surplus, unexpired medicines from licensed donors with verified clinics and
              healthcare NGOs to save lives and eliminate pharmaceutical waste.
            </p>

            <div className="flex flex-col gap-2 pt-2 text-xs text-text-secondary">
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 text-primary" aria-hidden="true" />
                <span>support@medbridge.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-primary" aria-hidden="true" />
                <span>Emergency Helpdesk: +91 8250597771 </span>
              </div>
            </div>
          </div>

          {/* Column 2: Platform Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Platform
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={ROUTES.howItWorks} className="text-text-secondary hover:text-primary transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to={ROUTES.safety} className="text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5">
                  <CheckCircle className="size-3.5 text-secondary" />
                  Safety Checklist
                </Link>
              </li>
              <li>
                <Link to={ROUTES.about} className="text-text-secondary hover:text-primary transition-colors">
                  About Our Mission
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Governance & Legal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Governance & Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={ROUTES.regulatory} className="text-text-secondary hover:text-primary transition-colors">
                  Regulatory Notice
                </Link>
              </li>
              <li>
                <Link to={ROUTES.privacy} className="text-text-secondary hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to={ROUTES.terms} className="text-text-secondary hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back-to-Top */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-text-secondary">
            &copy; {year} {APP_NAME} Platform. Built with strict safety, traceability, and verified matching.
          </p>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:border-primary/40 hover:text-text-primary shadow-xs"
            aria-label="Back to top"
          >
            Back to top
            <ArrowUp className="size-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
