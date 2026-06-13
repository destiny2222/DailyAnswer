/**
 * Robust date parsing utility to handle various date formats including
 * standard ISO strings and "MMM DD, YYYY" (e.g., "Apr 24, 2026").
 */
export const safeParseDate = (dateStr: string | Date | null | undefined): Date => {
  if (!dateStr) return new Date();
  
  if (dateStr instanceof Date) {
    return isNaN(dateStr.getTime()) ? new Date() : dateStr;
  }

  // Try standard parsing
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  // Fallback for "Apr 24, 2026" format
  try {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };

    const match = dateStr.match(/([a-zA-Z]{3,})\s+(\d+),\s+(\d{4})/);
    if (match) {
      const [_, monthStr, day, year] = match;
      const monthIndex = months[monthStr.toLowerCase().substring(0, 3)];
      
      if (monthIndex !== undefined) {
        return new Date(parseInt(year), monthIndex, parseInt(day));
      }
    }
  } catch (error) {
    // console.error('Error parsing custom date format:', error);
  }

  return new Date(); // Final fallback to today
};

/**
 * Formats a date string or object into a human-readable format.
 */
export const formatDateLong = (date: string | Date | null | undefined): string => {
  const d = safeParseDate(date);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  };
  return d.toLocaleDateString('en-US', options);
};

export const formatDateShort = (date: string | Date | null | undefined): string => {
  const d = safeParseDate(date);
  return d.toDateString();
};
