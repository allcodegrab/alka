import type { ScheduleConfig } from './config.js';

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function parseTimeRange(
  range: string,
): { startHour: number; startMin: number; endHour: number; endMin: number } | null {
  const match = range.match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2})$/);
  if (!match) return null;
  return {
    startHour: parseInt(match[1]!, 10),
    startMin: parseInt(match[2]!, 10),
    endHour: parseInt(match[3]!, 10),
    endMin: parseInt(match[4]!, 10),
  };
}

function getCurrentDayName(now: Date): string {
  return DAY_NAMES[now.getDay()]!;
}

export function isWithinBusinessHours(config: ScheduleConfig, now?: Date): boolean {
  const current = now ?? new Date();
  const dayName = getCurrentDayName(current);
  const hoursStr = config.businessHours[dayName];

  if (!hoursStr) return false;

  const range = parseTimeRange(hoursStr);
  if (!range) return false;

  const currentMinutes = current.getHours() * 60 + current.getMinutes();
  const startMinutes = range.startHour * 60 + range.startMin;
  const endMinutes = range.endHour * 60 + range.endMin;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function canAcceptMission(
  config: ScheduleConfig,
  mode: 'standard' | '24h',
  now?: Date,
): boolean {
  if (mode === '24h' && config.twentyFourHourModeOverride) {
    return true;
  }
  return isWithinBusinessHours(config, now);
}
