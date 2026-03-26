import { format } from 'date-fns';

/**
 * Parses a date string from Supabase.
 * If the string lacks timezone information, it appends 'Z' to treat it as UTC.
 */
export const parseSupabaseDate = (dateString: string | Date | null | undefined): Date => {
  if (!dateString) return new Date();
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? new Date() : dateString;
  }
  
  if (typeof dateString !== 'string') return new Date();

  let parsed: Date;
  // Supabase generally returns 'YYYY-MM-DDTHH:mm:ss.sss', no 'Z' if it's timestamp without timezone.
  // If the date string already has timezone info (Z, +hh:mm, -hh:mm), use it as is.
  if (
    dateString.endsWith('Z') || 
    dateString.match(/[+-]\d{2}:?\d{2}$/) ||
    dateString.includes('+') // simple check as fallback
  ) {
    parsed = new Date(dateString);
  } else {
    // Force UTC parsing by appending 'Z'
    parsed = new Date(`${dateString}Z`);
  }

  // Fallback to current date if parsing fails completely (e.g. malformed string)
  if (isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
};

/**
 * Formats a date string to a relative time format like '5m', '3h', '1d', 'now'.
 */
export const formatRelativeTime = (dateString: string | Date | null | undefined): string => {
  try {
    if (!dateString) return '';
    const date = parseSupabaseDate(dateString);
    const diffMs = Date.now() - date.getTime();
    
    // If it's in the future (due to slight client clock mismatch) or < 1 min, show 'now'
    if (diffMs < 60000) return 'now';

    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 365) return `${diffDays}d`;
    return `${diffYears}y`;
  } catch (err) {
    return '';
  }
};

/**
 * Formats a date string to IST (Asia/Kolkata) time like '3:04 PM'.
 */
export const formatMessageTime = (dateString: string | Date | null | undefined): string => {
  try {
    if (!dateString) return '';
    const date = parseSupabaseDate(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch (err) {
    return '';
  }
};
