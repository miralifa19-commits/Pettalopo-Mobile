const INDONESIAN_MONTHS: Record<string, number> = {
  januari: 0, februari: 1, maret: 2, april: 3, mei: 4, juni: 5,
  juli: 6, agustus: 7, september: 8, oktober: 9, november: 10, desember: 11
};

const WEEKDAY_PREFIX = /^(senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu),?\s*/i;

export const parseAgendaDate = (value?: string): Date | null => {
  if (!value) return null;
  const cleaned = value.trim().replace(WEEKDAY_PREFIX, '');
  const match = cleaned.match(/(\d{1,2})(?:\s*[-–—]\s*\d{1,2})?\s+([a-zA-Z]+)\s+(\d{4})/i);
  if (match) {
    const day = Number(match[1]);
    const month = INDONESIAN_MONTHS[match[2].toLowerCase()];
    const year = Number(match[3]);
    if (month === undefined || day < 1 || day > 31) return null;
    const parsed = new Date(year, month, day, 12, 0, 0, 0);
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month || parsed.getDate() !== day) return null;
    return parsed;
  }
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const parsed = new Date(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]), 12, 0, 0, 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

export const isUpcomingAgenda = (value?: string, referenceDate = new Date()): boolean => {
  const date = parseAgendaDate(value);
  if (!date) return false;
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  return date >= today;
};

export const formatAgendaDate = (value?: string): string => {
  const date = parseAgendaDate(value);
  if (!date) return value || 'Tanggal belum ditentukan';
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
};
