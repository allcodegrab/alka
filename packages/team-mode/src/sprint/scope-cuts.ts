import type { SlicePriority, ScopeCutResult } from './types.js';

interface SliceInput {
  id: string;
  priority: SlicePriority;
  status: string;
  files?: string[];
}

const SECONDARY_VERIFIERS = ['performance-verifier', 'reliability-verifier'];
const PROTECTED_VERIFIERS = ['tests-verifier', 'security-verifier'];

function touchesSensitivePaths(slices: SliceInput[], sensitivePaths: string[]): boolean {
  if (sensitivePaths.length === 0) return false;
  for (const slice of slices) {
    if (!slice.files) continue;
    for (const file of slice.files) {
      if (sensitivePaths.some((sp) => file.startsWith(sp) || file.includes(sp))) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Estimate saved minutes per cut level.
 * Each incomplete nice-to-have slice saves ~60min.
 * Cutting secondary verifiers saves ~30min.
 * Draft docs saves ~20min. Draft PR saves ~15min.
 */
const MINUTES_PER_SLICE = 60;
const MINUTES_PER_VERIFIER_CUT = 30;
const MINUTES_DOCS_DRAFT = 20;
const MINUTES_RELEASE_DRAFT = 15;

export function calculateScopeCuts(
  slices: SliceInput[],
  timeRemainingMinutes: number,
  sensitivePaths: string[],
): ScopeCutResult {
  const result: ScopeCutResult = {
    cutSlices: [],
    cutVerifiers: [],
    docsMode: 'full',
    releaseMode: 'full',
    reason: '',
  };

  // If time is sufficient, no cuts needed
  if (timeRemainingMinutes >= 0) {
    result.reason = 'No cuts needed — sufficient time remaining';
    return result;
  }

  let deficit = -timeRemainingMinutes;
  const reasons: string[] = [];

  // Level 1: Cut nice-to-have slices (incomplete ones only)
  const niceToHaveSlices = slices.filter(
    (s) => s.priority === 'nice-to-have' && s.status !== 'complete',
  );
  for (const slice of niceToHaveSlices) {
    if (deficit <= 0) break;
    result.cutSlices.push(slice.id);
    deficit -= MINUTES_PER_SLICE;
  }
  if (result.cutSlices.length > 0) {
    reasons.push(`Cut ${result.cutSlices.length} nice-to-have slice(s)`);
  }

  if (deficit <= 0) {
    result.reason = reasons.join('; ');
    return result;
  }

  // Level 2: Cut secondary verifiers (unless sensitive paths are touched)
  const hasSensitive = touchesSensitivePaths(slices, sensitivePaths);
  for (const verifier of SECONDARY_VERIFIERS) {
    if (deficit <= 0) break;
    result.cutVerifiers.push(verifier);
    deficit -= MINUTES_PER_VERIFIER_CUT;
  }
  // Never cut protected verifiers if sensitive paths are touched
  if (!hasSensitive) {
    for (const verifier of PROTECTED_VERIFIERS) {
      if (deficit <= 0) break;
      result.cutVerifiers.push(verifier);
      deficit -= MINUTES_PER_VERIFIER_CUT;
    }
  }
  if (result.cutVerifiers.length > 0) {
    reasons.push(`Cut ${result.cutVerifiers.length} verifier(s)`);
  }

  if (deficit <= 0) {
    result.reason = reasons.join('; ');
    return result;
  }

  // Level 3: Switch docs to draft mode
  result.docsMode = 'draft';
  deficit -= MINUTES_DOCS_DRAFT;
  reasons.push('Docs downgraded to draft');

  if (deficit <= 0) {
    result.reason = reasons.join('; ');
    return result;
  }

  // Level 4: Switch release to draft-pr
  result.releaseMode = 'draft-pr';
  deficit -= MINUTES_RELEASE_DRAFT;
  reasons.push('Release downgraded to draft-pr');

  result.reason = reasons.join('; ');
  return result;
}
