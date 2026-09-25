import { API_BASE_URL } from '@/lib/constants';

/**
 * Resolves a media / image URL from backend or CDN.
 * Ensures relative paths like '/uploads/listings/...' point to the active backend origin.
 */
export function getMediaUrl(path?: string | null): string {
  if (!path || typeof path !== 'string') return '';
  const trimmed = path.trim();
  if (!trimmed) return '';

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const backendOrigin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${backendOrigin}${cleanPath}`;
}
