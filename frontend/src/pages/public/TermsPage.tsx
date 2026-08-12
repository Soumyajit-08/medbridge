import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/constants';

export function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — {APP_NAME}</title>
        <meta name="description" content={`${APP_NAME} terms of service and platform usage rules.`} />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary">Terms of Service</h1>
        <p className="mt-4 text-sm text-text-secondary">Last updated: August 2026</p>

        <section className="mt-10 space-y-4 text-sm leading-relaxed text-text-secondary">
          <p>
            By using {APP_NAME}, you agree to provide accurate information, comply with applicable
            laws, and use the platform only for lawful medicine-surplus coordination purposes.
          </p>
          <p>
            Donors confirm that listed medicines meet the platform safety checklist. Recipients
            must maintain valid organization verification. Administrators may suspend accounts that
            violate platform policies.
          </p>
          <p>
            {APP_NAME} is provided as a demonstration application without warranties. Users are
            responsible for independent professional and regulatory review of any medicine transfer.
          </p>
        </section>
      </div>
    </>
  );
}
