import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { medicineService } from '@/services/medicineService';
import type { Medicine, MedicineSearchResult } from '@/types/medicine';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { cn } from '@/utils/cn';
import { initialMedicines, toSearchResult } from '@/mocks/data/medicines';

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

  const fallbackResults = initialMedicines
    .filter((medicine) => {
      const normalizedQuery = debouncedQuery.toLowerCase();
      return [medicine.name, medicine.genericName, medicine.category].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    })
    .map(toSearchResult);
  const displayedResults = results?.length ? results : fallbackResults;

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
      <div>
        <Input
          label={label}
          icon={Search}
          endIcon={
            query ? (
              <button
                type="button"
                onClick={handleClear}
                className="text-text-secondary hover:text-text-primary p-1 focus:outline-none"
                aria-label="Clear selection"
              >
                <X className="size-4" />
              </button>
            ) : undefined
          }
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            setOpen(true);
            if (val.trim()) {
              onChange({
                id: val.trim(),
                name: val.trim(),
                genericName: val.trim(),
                strength: 'Standard',
                category: 'General',
                dosageForm: 'Tablet',
                manufacturer: 'Unspecified',
              });
            } else {
              onChange(null);
            }
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search catalogue or type medicine name..."
          error={error}
          aria-autocomplete="list"
          aria-expanded={open}
        />
      </div>

      {open && debouncedQuery.length >= 2 && (
        <ul
          className="absolute z-20 mt-1 max-h-60 overflow-auto w-full rounded-lg border border-border bg-surface py-1 shadow-[var(--shadow-card)]"
          role="listbox"
        >
          {isLoading && (
            <li className="flex justify-center py-4">
              <LoadingSpinner size="sm" />
            </li>
          )}
          {!isLoading && displayedResults.length === 0 && (
            <li className="px-3 py-2 text-sm text-text-secondary">No exact catalog match</li>
          )}
          {displayedResults.map((medicine) => (
            <li key={medicine.id}>
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2 text-left text-sm hover:bg-background"
                onClick={() => handleSelect(medicine)}
              >
                <span className="font-medium text-text-primary">{medicine.name}</span>
                {medicine.genericName && medicine.genericName !== medicine.name && (
                  <span className="text-text-secondary"> — {medicine.genericName}</span>
                )}
                {medicine.strength && medicine.strength !== 'Standard' && (
                  <span className="text-xs text-text-muted ml-2">({medicine.strength})</span>
                )}
              </button>
            </li>
          ))}
          {query.trim() && !displayedResults.some(m => m.name.toLowerCase() === query.trim().toLowerCase()) && (
            <li className="border-t border-border mt-1 pt-1">
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-background font-medium"
                onClick={() => handleSelect({
                  id: query.trim(),
                  name: query.trim(),
                  genericName: query.trim(),
                  strength: 'Standard',
                  category: 'General',
                  dosageForm: 'Tablet',
                  manufacturer: 'Unspecified',
                  label: query.trim(),
                })}
              >
                + Use "{query.trim()}"
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
