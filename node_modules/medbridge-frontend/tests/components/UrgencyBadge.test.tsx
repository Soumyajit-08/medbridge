import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UrgencyBadge } from '@/components/urgency/UrgencyBadge';

describe('UrgencyBadge', () => {
  it('renders urgency label', () => {
    render(<UrgencyBadge urgency="HIGH" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders critical urgency', () => {
    render(<UrgencyBadge urgency="CRITICAL" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });
});
