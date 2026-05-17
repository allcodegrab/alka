import { describe, it, expect } from 'vitest';
import { shouldSkipBuddy } from './skip.js';

describe('shouldSkipBuddy', () => {
  describe('skip patterns', () => {
    it('should skip "just do it"', () => {
      expect(shouldSkipBuddy('just do it')).toBe(true);
    });

    it('should skip "Just Do It" (case-insensitive)', () => {
      expect(shouldSkipBuddy('Just Do It')).toBe(true);
    });

    it('should skip "skip planning"', () => {
      expect(shouldSkipBuddy('skip planning')).toBe(true);
    });

    it('should skip "no preamble"', () => {
      expect(shouldSkipBuddy('no preamble')).toBe(true);
    });

    it('should skip "fix typo on line 22"', () => {
      expect(shouldSkipBuddy('fix typo on line 22')).toBe(true);
    });

    it('should skip "rename foo to bar"', () => {
      expect(shouldSkipBuddy('rename foo to bar')).toBe(true);
    });

    it('should skip "change color to blue"', () => {
      expect(shouldSkipBuddy('change color to blue')).toBe(true);
    });
  });

  describe('short prompts', () => {
    it('should skip prompts shorter than 20 chars', () => {
      expect(shouldSkipBuddy('fix bug')).toBe(true);
    });

    it('should skip exactly 19 chars', () => {
      expect(shouldSkipBuddy('1234567890123456789')).toBe(true);
    });
  });

  describe('non-skip prompts', () => {
    it('should not skip "add authentication to the API"', () => {
      expect(shouldSkipBuddy('add authentication to the API')).toBe(false);
    });

    it('should not skip "refactor the payment system"', () => {
      expect(shouldSkipBuddy('refactor the payment system')).toBe(false);
    });

    it('should not skip "implement user dashboard with charts"', () => {
      expect(shouldSkipBuddy('implement user dashboard with charts')).toBe(false);
    });

    it('should not skip long prompts that do not match patterns', () => {
      expect(shouldSkipBuddy('we need to build a new microservice for order processing')).toBe(
        false,
      );
    });
  });
});
