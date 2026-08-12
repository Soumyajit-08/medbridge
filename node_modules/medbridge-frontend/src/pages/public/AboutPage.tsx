import { Helmet } from 'react-helmet-async';
import { APP_NAME, REGULATORY_DISCLAIMER } from '@/lib/constants';

export function AboutPage() {
  return (
    <>
      <Helmet>
        <title>About — {APP_NAME}</title>
        <meta
          name="description"
          content={`Learn about ${APP_NAME}, a platform connecting surplus medicine donors with verified healthcare organizations.`}
        />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary">About {APP_NAME}</h1>
        <p className="mt-6 text-lg leading-relaxed text-text-secondary">
          {APP_NAME} is a medicine-surplus coordination platform designed to reduce pharmaceutical
          waste while improving access for verified healthcare organizations. We provide structured
          workflows for listing, verification, matching, claiming, and transfer tracking.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-text-primary">Our mission</h2>
        <p className="mt-3 leading-relaxed text-text-secondary">
          We believe surplus medicines deserve a second chance. By connecting responsible donors
          with verified recipients through safety-first technology, we aim to redirect usable stock
          away from landfills and toward patients who need it.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-text-primary">What we are — and are not</h2>
        <p className="mt-3 leading-relaxed text-text-secondary">{REGULATORY_DISCLAIMER}</p>
      </div>
    </>
  );
}
