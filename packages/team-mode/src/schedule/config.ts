import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { ok, err, type Result } from '@forge/protocol';
import { ScheduleError } from './errors.js';

export interface ScheduleConfig {
  timezone: string;
  businessHours: Record<string, string>;
  twentyFourHourModeOverride: boolean;
  dreamModeWindow: { weekday: string; weekend: string };
}

export async function loadScheduleConfig(
  projectRoot: string,
): Promise<Result<ScheduleConfig, ScheduleError>> {
  const configPath = join(projectRoot, '.forge', 'schedule.yaml');

  let content: string;
  try {
    content = await readFile(configPath, 'utf-8');
  } catch (e) {
    return err(
      new ScheduleError(
        'IO_ERROR',
        `Failed to read schedule config: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  let raw: unknown;
  try {
    raw = parseYaml(content);
  } catch (e) {
    return err(
      new ScheduleError(
        'CONFIG_ERROR',
        `Failed to parse schedule YAML: ${e instanceof Error ? e.message : String(e)}`,
      ),
    );
  }

  if (!raw || typeof raw !== 'object') {
    return err(new ScheduleError('CONFIG_ERROR', 'Schedule config is not a valid object'));
  }

  const data = raw as Record<string, unknown>;
  const timezone = String(data['timezone'] ?? 'UTC');
  const twentyFourHourModeOverride = Boolean(data['twentyFourHourModeOverride'] ?? false);

  const rawBusinessHours = (data['businessHours'] ?? {}) as Record<string, string>;
  const businessHours: Record<string, string> = {};
  for (const [day, hours] of Object.entries(rawBusinessHours)) {
    businessHours[day] = hours;
  }

  const rawDream = (data['dreamModeWindow'] ?? {}) as Record<string, string>;
  const dreamModeWindow = {
    weekday: rawDream['weekday'] ?? '02:00-06:00',
    weekend: rawDream['weekend'] ?? '02:00-06:00',
  };

  return ok({ timezone, businessHours, twentyFourHourModeOverride, dreamModeWindow });
}
