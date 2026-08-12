import { Link } from 'react-router-dom';
import { APP_NAME, REGULATORY_DISCLAIMER, ROUTES } from '@/lib/constants';

const footerLinks = [
  { label: 'Privacy Policy', href: ROUTES.privacy },
  { label: 'Terms of Service', href: ROUTES.terms },
  { label: 'Safety', href: ROUTES.safety },
  { label: 'Regulatory Disclaimer', href: ROUTES.regulatory },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-xl">
            <Link to={ROUTES.home} className="text-lg font-semibold text-text-primary">
              {APP_NAME}
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              {REGULATORY_DISCLAIMER}
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-sm text-text-secondary transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-sm text-text-secondary">
            &copy; {year} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
