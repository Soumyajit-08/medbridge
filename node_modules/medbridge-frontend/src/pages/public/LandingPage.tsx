import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  Package,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { APP_NAME, REGULATORY_DISCLAIMER, ROUTES, SAFETY_CHECKLIST_ITEMS } from '@/lib/constants';
import { Button } from '@/components/common/Button';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.5 },
};

export function LandingPage() {
  return (
    <>
      <Helmet>
        <title>{APP_NAME} — Give Surplus Medicines a Second Chance</title>
        <meta
          name="description"
          content="MedBridge connects verified healthcare organizations with surplus medicine donors to reduce waste and improve access."
        />
      </Helmet>

      {/* Hero */}
      <section className="gradient-hero border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="size-4" aria-hidden="true" />
              Surplus medicine coordination platform
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
              Give Surplus Medicines a Second Chance.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-text-secondary">
              MedBridge helps donors share unopened, in-date medicines with verified healthcare
              organizations — reducing waste while improving community access through structured
              safety checks and traceability.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to={ROUTES.register}>
                <Button size="lg" className="min-w-[180px]">
                  Get started
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </Link>
              <Link to={ROUTES.howItWorks}>
                <Button variant="outline" size="lg" className="min-w-[180px]">
                  How it works
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-text-primary">The problem we address</h2>
            <p className="mt-4 text-lg text-text-secondary">
              Perfectly usable medicines are discarded every day — while clinics and NGOs struggle
              to source essential supplies. MedBridge bridges that gap with verification,
              eligibility screening, and expiry-aware matching.
            </p>
          </motion.div>
          <motion.div
            {...fadeUp}
            className="mt-12 grid gap-6 sm:grid-cols-3"
          >
            {[
              {
                icon: Package,
                title: 'Surplus waste',
                text: 'Households, pharmacies, and organizations discard unopened medicines that could still help patients.',
              },
              {
                icon: Heart,
                title: 'Unmet need',
                text: 'Verified clinics and NGOs face shortages while surplus stock sits unused nearby.',
              },
              {
                icon: Shield,
                title: 'Safety gaps',
                text: 'Informal sharing lacks traceability, verification, and structured safety checks.',
              },
            ].map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]"
              >
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{text}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center">
            <h2 className="text-3xl font-bold text-text-primary">How MedBridge works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
              A structured workflow from listing to verified transfer.
            </p>
          </motion.div>
          <motion.ol
            {...fadeUp}
            className="mt-12 grid gap-8 md:grid-cols-4"
          >
            {[
              'Donors list surplus medicines with safety checklist confirmation',
              'Recipients browse matches after organization verification',
              'Claims are reviewed and confirmed by donors',
              'Transfers are tracked with expiry alerts and audit logs',
            ].map((step, index) => (
              <li key={step} className="relative text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm leading-relaxed text-text-secondary">{step}</p>
              </li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* Safety */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <motion.div {...fadeUp}>
              <h2 className="text-3xl font-bold text-text-primary">Built with safety first</h2>
              <p className="mt-4 text-text-secondary">
                Every listing passes a configurable safety checklist. Recipients must complete
                organization verification before claiming medicines.
              </p>
              <Link to={ROUTES.safety} className="mt-6 inline-block">
                <Button variant="outline">Learn about safety</Button>
              </Link>
            </motion.div>
            <motion.ul {...fadeUp} className="grid gap-2 sm:grid-cols-2">
              {SAFETY_CHECKLIST_ITEMS.slice(0, 6).map((item) => (
                <li
                  key={item.key}
                  className="flex items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-secondary"
                >
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
                  {item.label}
                </li>
              ))}
            </motion.ul>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-border bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center">
            <h2 className="text-3xl font-bold text-text-primary">Benefits for everyone</h2>
          </motion.div>
          <motion.div {...fadeUp} className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'For donors',
                items: ['Reduce medicine waste', 'Simple listing workflow', 'Full transfer history'],
              },
              {
                title: 'For recipients',
                items: ['Browse verified listings', 'Match by urgency & location', 'Track claim status'],
              },
              {
                title: 'For administrators',
                items: ['Verification queue', 'Impact analytics', 'Audit trail & reports'],
              },
            ].map((group) => (
              <div
                key={group.title}
                className="rounded-[var(--radius-card)] border border-border bg-background p-6"
              >
                <h3 className="text-lg font-semibold text-text-primary">{group.title}</h3>
                <ul className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-text-secondary">
                      <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Impact preview */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            {...fadeUp}
            className="rounded-[var(--radius-card)] gradient-primary p-8 text-white sm:p-12"
          >
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                { value: '150+', label: 'Units redirected from waste' },
                { value: '48h', label: 'Average completion time' },
                { value: '85%', label: 'Waste prevention rate' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-4xl font-bold">{stat.value}</p>
                  <p className="mt-2 text-sm text-white/80">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-t border-border bg-surface py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <Users className="mx-auto size-10 text-primary" aria-hidden="true" />
            <h2 className="mt-4 text-3xl font-bold text-text-primary">Trusted coordination</h2>
            <p className="mt-4 text-text-secondary">
              Organization verification, eligibility screening, expiry tracking, and comprehensive
              audit logs ensure every transfer is traceable and accountable.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="border-t border-border py-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm leading-relaxed text-text-secondary">{REGULATORY_DISCLAIMER}</p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-background py-16">
        <motion.div
          {...fadeUp}
          className="mx-auto max-w-2xl px-4 text-center sm:px-6"
        >
          <h2 className="text-3xl font-bold text-text-primary">Ready to make an impact?</h2>
          <p className="mt-4 text-text-secondary">
            Join as a donor or verified recipient organization today.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={ROUTES.register}>
              <Button size="lg">Create free account</Button>
            </Link>
            <Link to={ROUTES.about}>
              <Button variant="ghost" size="lg">
                Learn more about {APP_NAME}
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
