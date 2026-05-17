import { ok, err, type Result } from '@forge/protocol';
import type { SliceAssignment } from './types.js';
import { OrchestratorError } from './errors.js';

const SLICE_HEADER_RE = /^## Slice (\d+):\s*(.+)$/;
const ROLE_RE = /^Role:\s*(.+)$/;
const FILES_RE = /^Files:\s*(.+)$/;
const DEPS_RE = /^Dependencies:\s*(.+)$/;

/**
 * Parse a structured text plan into SliceAssignment[].
 *
 * Expected format:
 * ```
 * ## Slice 1: <description>
 * Role: impl-a
 * Files: src/foo.ts, src/bar.ts
 * Dependencies: none
 *
 * ## Slice 2: <description>
 * Role: impl-b
 * Files: src/baz.ts
 * Dependencies: slice-1
 * ```
 */
export function parseSlicePlan(planText: string): Result<SliceAssignment[], OrchestratorError> {
  const lines = planText.split('\n');
  const slices: SliceAssignment[] = [];

  let current: Partial<SliceAssignment> | null = null;
  let currentNumber: number | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const headerMatch = SLICE_HEADER_RE.exec(trimmed);
    if (headerMatch) {
      // Flush previous slice
      if (current !== null) {
        const validated = validateSlice(current, currentNumber!);
        if (!validated.ok) return validated;
        slices.push(validated.value);
      }

      currentNumber = parseInt(headerMatch[1]!, 10);
      current = {
        sliceId: `slice-${currentNumber}`,
        description: headerMatch[2]!.trim(),
      };
      continue;
    }

    if (current === null) continue;

    const roleMatch = ROLE_RE.exec(trimmed);
    if (roleMatch) {
      current.roleId = roleMatch[1]!.trim();
      continue;
    }

    const filesMatch = FILES_RE.exec(trimmed);
    if (filesMatch) {
      current.files = filesMatch[1]!
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);
      continue;
    }

    const depsMatch = DEPS_RE.exec(trimmed);
    if (depsMatch) {
      const raw = depsMatch[1]!.trim().toLowerCase();
      current.dependencies =
        raw === 'none'
          ? []
          : raw
              .split(',')
              .map((d) => d.trim())
              .filter(Boolean);
      continue;
    }
  }

  // Flush last slice
  if (current !== null) {
    const validated = validateSlice(current, currentNumber!);
    if (!validated.ok) return validated;
    slices.push(validated.value);
  }

  if (slices.length === 0) {
    return err(new OrchestratorError('DECOMPOSE_FAILED', 'No slices found in plan text'));
  }

  return ok(slices);
}

function validateSlice(
  partial: Partial<SliceAssignment>,
  sliceNum: number,
): Result<SliceAssignment, OrchestratorError> {
  if (!partial.roleId) {
    return err(
      new OrchestratorError(
        'DECOMPOSE_FAILED',
        `Slice ${sliceNum} is missing required field: Role`,
      ),
    );
  }
  if (!partial.files || partial.files.length === 0) {
    return err(
      new OrchestratorError(
        'DECOMPOSE_FAILED',
        `Slice ${sliceNum} is missing required field: Files`,
      ),
    );
  }

  return ok({
    sliceId: partial.sliceId!,
    roleId: partial.roleId,
    description: partial.description ?? '',
    files: partial.files,
    dependencies: partial.dependencies ?? [],
  });
}
