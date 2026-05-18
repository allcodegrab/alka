const SAFE_PREFIXES = ['.claude/', '.forge/'];

export function isDreamSafe(filePath: string): boolean {
  const normalized = filePath.startsWith('/') ? filePath : filePath;
  for (const prefix of SAFE_PREFIXES) {
    if (normalized.startsWith(prefix)) {
      return true;
    }
  }
  return false;
}
