const SKIP_PATTERNS = [
  /^just do it$/i,
  /^skip planning$/i,
  /^no preamble$/i,
  /^fix typo/i,
  /^rename /i,
  /^change .+ to .+$/i,
];

export function shouldSkipBuddy(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 20) return true;
  return SKIP_PATTERNS.some((pattern) => pattern.test(trimmed));
}
