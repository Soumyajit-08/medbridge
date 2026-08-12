import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { medicineService } from '@/services/medicineService';
import type { Medicine, MedicineSearchResult } from '@/types/medicine';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';

export interface MedicineAutocompleteProps {
  value?: Medicine | null;
  onChange: (medicine: Medicine | null) => void;
  error?: string;
  className?: string;
  label?: string;
}

export function MedicineAutocomplete({
  value,
  onChange,
  error,
  className,
  label = 'Medicine',
}: MedicineAutocompleteProps) {
  const [query, setQuery] = useState(value?.name ?? '');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  const { data: results, isLoading } = useQuery({
    queryKey: ['medicines', 'autocomplete', debouncedQuery],
    queryFn: () => medicineService.search(debouncedQuery),
    enabled: open && debouncedQuery.length >= 2,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(medicine: MedicineSearchResult) {
    onChange(medicine);
    setQuery(medicine.name);
    setOpen(false);
  }

  function handleClear() {
    onChange(null);
    setQuery('');
  }

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search
          className="absolute left-3 top-[2.125rem] size-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
        <Input
          label={label}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search for a medicine..."
          className="pl-9 pr-9"
          error={error}
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-[2.125rem] -translate-y-1/2 text-text-secondary hover:text-text-primary"
            aria-label="Clear selection"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {open && debouncedQuery.length >= 2 && (
        <ul
          className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface py-1 shadow-[var(--shadow-card)]"
          role="listbox"
        >
          {isLoading && (
            <li className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </li>
          )}
          {!isLoading && results?.length === 0 && (
            <li className="px-3 py-2 text-sm text-text-secondary">No medicines found</li>
          )}
          {results?.map((medicine) => (
            <li key={medicine.id}>
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2 text-left text-sm hover:bg-background"
                onClick={() => handleSelect(medicine)}
              >
                <span className="font-medium text-text-primary">{medicine.name}</span>
                <span className="text-text-secondary"> — {medicine.genericName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
