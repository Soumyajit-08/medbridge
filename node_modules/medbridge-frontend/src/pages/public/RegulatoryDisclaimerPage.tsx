import { Helmet } from 'react-helmet-async';
import { APP_NAME, REGULATORY_DISCLAIMER } from '@/lib/constants';

export function RegulatoryDisclaimerPage() {
  return (
    <>
      <Helmet>
        <title>Regulatory Disclaimer — {APP_NAME}</title>
        <meta
          name="description"
          content="Important regulatory disclaimer for the MedBridge platform."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary">Regulatory Disclaimer</h1>
        <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
          <p className="text-sm leading-relaxed text-text-secondary">{REGULATORY_DISCLAIMER}</p>
        </div>

        <section className="mt-10 space-y-4 text-sm leading-relaxed text-text-secondary">
          <p>
            MedBridge performs preliminary eligibility screening only. It does not replace
            pharmaceutical, medical, or regulatory authority review required in your jurisdiction.
          </p>
          <p>
            Users must independently confirm that any proposed transfer complies with local laws,
            licensing requirements, and professional standards before completing a donation.
          </p>
        </section>
      </div>
    </>
  );
}
