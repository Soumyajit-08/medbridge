import { Helmet } from 'react-helmet-async';
import { APP_NAME } from '@/lib/constants';

export function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — {APP_NAME}</title>
        <meta name="description" content={`${APP_NAME} privacy policy and data handling practices.`} />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary">Privacy Policy</h1>
        <p className="mt-4 text-sm text-text-secondary">Last updated: August 2026</p>

        <section className="mt-10 space-y-4 text-sm leading-relaxed text-text-secondary">
          <p>
            {APP_NAME} collects account information (name, email, phone, organization details)
            necessary to operate the platform. Listing and claim data is stored to support
            traceability, verification, and audit requirements.
          </p>
          <p>
            We do not sell personal data. Access is restricted to authenticated users and
            platform administrators. Audit logs record significant actions for security and
            compliance purposes.
          </p>
          <p>
            This is a portfolio/demo application. Do not enter real patient health information or
            production credentials.
          </p>
        </section>
      </div>
    </>
  );
}
