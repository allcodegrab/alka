import { describe, it, expect } from 'vitest';
import { ok, err, isOk, isErr, unwrap } from './result.js';

describe('Result', () => {
  it('ok() creates a success result', () => {
    const result = ok(42);
    expect(result.ok).toBe(true);
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
    if (result.ok) {
      expect(result.value).toBe(42);
    }
  });

  it('err() creates a failure result', () => {
    const result = err('something went wrong');
    expect(result.ok).toBe(false);
    expect(isOk(result)).toBe(false);
    expect(isErr(result)).toBe(true);
    if (!result.ok) {
      expect(result.error).toBe('something went wrong');
    }
  });

  it('unwrap() returns value on Ok', () => {
    expect(unwrap(ok('hello'))).toBe('hello');
  });

  it('unwrap() throws on Err', () => {
    expect(() => unwrap(err('bad'))).toThrow('Called unwrap on an Err result: bad');
  });
});
