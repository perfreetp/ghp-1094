export function formatDate(date: string | Date, format: 'full' | 'short' | 'chinese' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  if (format === 'chinese') {
    return `${year}年${month}月${day}日`;
  }
  if (format === 'full') {
    return `${year}-${month}-${day} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }
  return `${year}-${month}-${day}`;
}

export function isOverdue(dueDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

export function isToday(dateStr: string): boolean {
  const today = new Date();
  const date = new Date(dateStr);
  return today.toDateString() === date.toDateString();
}

export function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay() || 7;
  startOfWeek.setDate(startOfWeek.getDate() - day + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return date >= startOfWeek && date <= endOfWeek;
}

export function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function getWeekRange(baseDate: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(baseDate);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function getMonthCalendar(year: number, month: number): (Date | null)[][] {
  const weeks: (Date | null)[][] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay() || 7;

  let currentWeek: (Date | null)[] = [];
  for (let i = 1; i < startDayOfWeek; i++) {
    currentWeek.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function todayDateInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function toDateInputValue(isoStr?: string | null): string {
  if (!isoStr) return todayDateInput();
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return todayDateInput();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function toSafeISODate(input?: string | null, fallback?: Date): string {
  const fallbackDate = fallback || new Date();
  if (!input || input.trim() === '') return fallbackDate.toISOString();
  try {
    const d = new Date(input);
    if (isNaN(d.getTime())) return fallbackDate.toISOString();
    return d.toISOString();
  } catch {
    return fallbackDate.toISOString();
  }
}

export function isValidDateInput(input?: string | null): boolean {
  if (!input || input.trim() === '') return false;
  try {
    const d = new Date(input);
    return !isNaN(d.getTime());
  } catch {
    return false;
  }
}
