function parseWindow(window: string): {
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
} {
  const [startStr, endStr] = window.split('-');
  const [startHour, startMin] = (startStr ?? '').split(':').map(Number);
  const [endHour, endMin] = (endStr ?? '').split(':').map(Number);
  return {
    startHour: startHour ?? 0,
    startMin: startMin ?? 0,
    endHour: endHour ?? 0,
    endMin: endMin ?? 0,
  };
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isDreamWindow(
  dreamConfig: { weekday: string; weekend: string },
  now?: Date,
): boolean {
  const current = now ?? new Date();
  const window = isWeekend(current) ? dreamConfig.weekend : dreamConfig.weekday;
  const { startHour, startMin, endHour, endMin } = parseWindow(window);

  const currentMinutes = current.getHours() * 60 + current.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Wraps midnight
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}

export function nextDreamWindow(
  dreamConfig: { weekday: string; weekend: string },
  now?: Date,
): Date {
  const current = now ?? new Date();
  const result = new Date(current);

  // Check up to 7 days ahead
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const candidate = new Date(current);
    candidate.setDate(candidate.getDate() + dayOffset);

    const window = isWeekend(candidate) ? dreamConfig.weekend : dreamConfig.weekday;
    const { startHour, startMin } = parseWindow(window);

    candidate.setHours(startHour, startMin, 0, 0);

    if (candidate > current) {
      return candidate;
    }
  }

  // Fallback: tomorrow same time
  result.setDate(result.getDate() + 1);
  const window = isWeekend(result) ? dreamConfig.weekend : dreamConfig.weekday;
  const { startHour, startMin } = parseWindow(window);
  result.setHours(startHour, startMin, 0, 0);
  return result;
}
