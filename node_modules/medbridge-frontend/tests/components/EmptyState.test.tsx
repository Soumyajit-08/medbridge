import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from '@/components/common/EmptyState';
import { Package } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        icon={Package}
        title="No listings"
        description="You have not created any listings yet."
      />,
    );
    expect(screen.getByText('No listings')).toBeInTheDocument();
    expect(screen.getByText('You have not created any listings yet.')).toBeInTheDocument();
  });
});
