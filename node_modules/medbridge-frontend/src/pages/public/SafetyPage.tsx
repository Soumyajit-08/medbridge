import { Helmet } from 'react-helmet-async';
import { CheckCircle2 } from 'lucide-react';
import {
  APP_NAME,
  ELIGIBILITY_MESSAGE,
  REGULATORY_DISCLAIMER,
  SAFETY_CHECKLIST_ITEMS,
} from '@/lib/constants';

export function SafetyPage() {
  return (
    <>
      <Helmet>
        <title>Safety — {APP_NAME}</title>
        <meta
          name="description"
          content="MedBridge safety standards, eligibility screening, and verification requirements."
        />
      </Helmet>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary">Safety & eligibility</h1>
        <p className="mt-4 text-lg text-text-secondary">
          Every listing on {APP_NAME} must pass a configurable safety checklist and preliminary
          eligibility screening before it becomes visible to verified recipients.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-text-primary">Safety checklist</h2>
        <ul className="mt-4 space-y-2">
          {SAFETY_CHECKLIST_ITEMS.map((item) => (
            <li
              key={item.key}
              className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text-secondary"
            >
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
              {item.label}
            </li>
          ))}
        </ul>

        <h2 className="mt-10 text-xl font-semibold text-text-primary">Eligibility screening</h2>
        <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-text-secondary">
          {ELIGIBILITY_MESSAGE}
        </p>

        <h2 className="mt-10 text-xl font-semibold text-text-primary">Recipient verification</h2>
        <p className="mt-3 leading-relaxed text-text-secondary">
          All recipient organizations must submit registration documents and pass administrator
          review before they can claim medicines on the platform.
        </p>

        <h2 className="mt-10 text-xl font-semibold text-text-primary">Regulatory disclaimer</h2>
        <p className="mt-3 rounded-lg border border-border bg-background px-4 py-3 text-sm leading-relaxed text-text-secondary">
          {REGULATORY_DISCLAIMER}
        </p>
      </div>
    </>
  );
}
