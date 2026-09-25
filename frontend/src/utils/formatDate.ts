/**
 * Parse any date representation into a valid Date object.
 * Handles ISO strings, timestamps (seconds or ms), date strings with spaces, Date objects, etc.
 */
export function parseDate(date?: string | Date | number | null): Date | null {
  if (date === null || date === undefined || date === '') return null;
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  // Handle number or numeric string timestamp
  if (typeof date === 'number' || (!isNaN(Number(date)) && typeof date === 'string' && date.trim().length > 0 && !date.includes('-') && !date.includes('/'))) {
    const num = Number(date);
    // If timestamp is in seconds (< 1e11), convert to milliseconds
    const ms = num < 1e11 ? num * 1000 : num;
    const d = new Date(ms);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed || trimmed === 'None' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'Invalid Date') {
      return null;
    }

    // Replace space with T for cross-browser ISO compatibility (e.g. "2026-09-25 15:30:00" -> "2026-09-25T15:30:00")
    let normalized = trimmed;
    if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(trimmed)) {
      normalized = trimmed.replace(' ', 'T');
    }

    // If it's a date-only string like "2026-09-25", construct date in local time to avoid UTC midnight day shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
      const [year, month, day] = normalized.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return isNaN(localDate.getTime()) ? null : localDate;
    }

    const d = new Date(normalized);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Format a date to standard display: e.g. "25 Sep 2026"
 */
export function formatDate(date?: string | Date | number | null): string {
  const d = parseDate(date);
  if (!d) return '—';
  try {
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/**
 * Format a date and time to standard display: e.g. "25 Sep 2026, 03:22 PM"
 */
export function formatDateTime(date?: string | Date | number | null): string {
  const d = parseDate(date);
  if (!d) return '—';
  try {
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

/**
 * Format relative time: e.g. "Just now", "5m ago", "2h ago", "Yesterday", or "25 Sep 2026"
 */
export function formatRelativeTime(date?: string | Date | number | null): string {
  const d = parseDate(date);
  if (!d) return '—';
  try {
    const diff = Date.now() - d.getTime();
    
    // Future or slightly in future due to server clock skew
    if (diff < 30000) return 'Just now';

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;

    // For older dates, return full readable date
    return formatDate(d);
  } catch {
    return '—';
  }
}

/**
 * Format time only: e.g. "03:22 PM"
 */
export function formatTimeOnly(date?: string | Date | number | null): string {
  const d = parseDate(date);
  if (!d) return '—';
  try {
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
}

/**
 * Calculates remaining days until an expiry date
 */
export function getDaysRemaining(expiryDate?: string | Date | number | null): number {
  const expiry = parseDate(expiryDate);
  if (!expiry) return 0;
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expiry);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

