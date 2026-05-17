import { describe, it, expect } from 'vitest';
import { isOk, isErr } from '@forge/protocol';
import { parseSlicePlan } from './decompose.js';

describe('parseSlicePlan', () => {
  it('should parse a valid plan with 3 slices', () => {
    const plan = `
## Slice 1: Build user model
Role: impl-a
Files: src/models/user.ts, src/models/index.ts
Dependencies: none

## Slice 2: Build auth middleware
Role: impl-b
Files: src/middleware/auth.ts
Dependencies: none

## Slice 3: Build user endpoint
Role: impl-c
Files: src/routes/user.ts, src/routes/index.ts
Dependencies: slice-1, slice-2
`;

    const result = parseSlicePlan(plan);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(3);

    expect(result.value[0]).toEqual({
      sliceId: 'slice-1',
      roleId: 'impl-a',
      description: 'Build user model',
      files: ['src/models/user.ts', 'src/models/index.ts'],
      dependencies: [],
    });

    expect(result.value[1]).toEqual({
      sliceId: 'slice-2',
      roleId: 'impl-b',
      description: 'Build auth middleware',
      files: ['src/middleware/auth.ts'],
      dependencies: [],
    });

    expect(result.value[2]).toEqual({
      sliceId: 'slice-3',
      roleId: 'impl-c',
      description: 'Build user endpoint',
      files: ['src/routes/user.ts', 'src/routes/index.ts'],
      dependencies: ['slice-1', 'slice-2'],
    });
  });

  it('should parse plan with dependencies correctly', () => {
    const plan = `
## Slice 1: Setup database
Role: db-impl
Files: src/db.ts
Dependencies: none

## Slice 2: Add migrations
Role: db-impl
Files: src/migrations/001.ts
Dependencies: slice-1
`;

    const result = parseSlicePlan(plan);
    expect(isOk(result)).toBe(true);
    if (!result.ok) return;

    expect(result.value).toHaveLength(2);
    expect(result.value[0]!.dependencies).toEqual([]);
    expect(result.value[1]!.dependencies).toEqual(['slice-1']);
  });

  it('should reject an empty plan', () => {
    const result = parseSlicePlan('');
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('DECOMPOSE_FAILED');
    expect(result.error.message).toContain('No slices found');
  });

  it('should reject a slice missing the Role field', () => {
    const plan = `
## Slice 1: Missing role
Files: src/foo.ts
Dependencies: none
`;

    const result = parseSlicePlan(plan);
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('DECOMPOSE_FAILED');
    expect(result.error.message).toContain('Role');
  });

  it('should reject a slice missing the Files field', () => {
    const plan = `
## Slice 1: Missing files
Role: impl-a
Dependencies: none
`;

    const result = parseSlicePlan(plan);
    expect(isErr(result)).toBe(true);
    if (result.ok) return;
    expect(result.error.code).toBe('DECOMPOSE_FAILED');
    expect(result.error.message).toContain('Files');
  });
});
