import { useCallback, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FileUploaderProps {
  accept?: string;
  maxSizeMB?: number;
  maxSizeMb?: number;
  onFileSelect: (file: File | null) => void;
  selectedFile?: File | null;
  label?: string;
  className?: string;
}

export function FileUploader({
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMB,
  maxSizeMb,
  onFileSelect,
  selectedFile,
  label = 'Upload document',
  className,
}: FileUploaderProps) {
  const resolvedMaxSize = maxSizeMB ?? maxSizeMb ?? 10;
  const [file, setFile] = useState<File | null>(selectedFile ?? null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const validate = useCallback(
    (selected: File) => {
      const maxBytes = resolvedMaxSize * 1024 * 1024;
      if (selected.size > maxBytes) {
        return `File must be smaller than ${resolvedMaxSize} MB`;
      }
      return null;
    },
    [resolvedMaxSize],
  );

  const handleFile = (selected: File | null) => {
    if (!selected) {
      setFile(null);
      setError(null);
      onFileSelect(null);
      return;
    }
    const validationError = validate(selected);
    if (validationError) {
      setError(validationError);
      return;
    }
    setFile(selected);
    setError(null);
    onFileSelect(selected);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <span className="block text-sm font-medium text-text-primary">{label}</span>
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-background',
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0] ?? null);
        }}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-text-primary">{file.name}</p>
              <p className="text-xs text-text-secondary">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={() => handleFile(null)}
              className="rounded-lg p-1 text-text-secondary hover:bg-surface"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-text-secondary" aria-hidden="true" />
            <p className="text-sm text-text-secondary">
              Drag and drop or{' '}
              <label className="cursor-pointer font-medium text-primary hover:underline">
                browse
                <input
                  type="file"
                  accept={accept}
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </p>
            <p className="mt-1 text-xs text-text-secondary">Max {resolvedMaxSize} MB</p>
          </>
        )}
      </div>
      {error && <p className="text-sm text-critical">{error}</p>}
    </div>
  );
}
