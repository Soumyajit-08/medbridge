import { useState } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { medicineService } from '@/services/medicineService';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { MedicineCard } from './MedicineCard';
import { cn } from '@/utils/cn';

export interface MedicineSearchProps {
  onSelect?: (medicineId: string) => void;
  className?: string;
}

export function MedicineSearch({ onSelect, className }: MedicineSearchProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading } = useQuery({
    queryKey: ['medicines', 'search', debouncedQuery],
    queryFn: () => medicineService.search(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <div className={cn('space-y-4', className)}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search medicines by name or generic name..."
          className="pl-9"
          aria-label="Search medicines"
        />
      </div>

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {!isLoading && debouncedQuery.length >= 2 && results?.length === 0 && (
        <EmptyState
          title="No medicines found"
          description="Try a different search term."
        />
      )}

      {results && results.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((medicine) => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onClick={onSelect ? () => onSelect(medicine.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
