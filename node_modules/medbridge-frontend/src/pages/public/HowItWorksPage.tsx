import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { Button } from '@/components/common/Button';

const steps = [
  {
    title: 'Donors create listings',
    description:
      'Households, pharmacies, and authorized organizations list surplus medicines with batch details, expiry dates, and a safety checklist.',
  },
  {
    title: 'Recipients get verified',
    description:
      'Healthcare organizations submit registration documents for admin review before they can browse and claim medicines.',
  },
  {
    title: 'Matching & claims',
    description:
      'Verified recipients browse active listings, submit claim requests, and donors confirm or reject each request.',
  },
  {
    title: 'Transfer & tracking',
    description:
      'Confirmed transfers are completed with full audit trails, expiry alerts, and impact analytics for administrators.',
  },
];

export function HowItWorksPage() {
  return (
    <>
      <Helmet>
        <title>How It Works — {APP_NAME}</title>
        <meta
          name="description"
          content="Understand the MedBridge workflow from donor listing to verified medicine transfer."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary">How it works</h1>
        <p className="mt-4 text-lg text-text-secondary">
          MedBridge follows a structured, safety-first process for every medicine transfer.
        </p>

        <ol className="mt-12 space-y-8">
          {steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-text-primary">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 rounded-[var(--radius-card)] border border-border bg-surface p-6 text-center">
          <p className="text-text-secondary">Ready to get started?</p>
          <Link to={ROUTES.register} className="mt-4 inline-block">
            <Button>Create your account</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
