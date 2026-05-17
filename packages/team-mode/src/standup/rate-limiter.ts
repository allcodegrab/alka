const lastEmission = new Map<string, number>();

export function canEmit(roleId: string, minIntervalMs: number = 15 * 60 * 1000): boolean {
  const last = lastEmission.get(roleId);
  if (last === undefined) return true;
  return Date.now() - last >= minIntervalMs;
}

export function recordEmission(roleId: string): void {
  lastEmission.set(roleId, Date.now());
}

export function resetAll(): void {
  lastEmission.clear();
}
