import { describe, it, expect } from 'vitest';
import { generateIntake } from './intake.js';

describe('generateIntake', () => {
  it('should extract intent from a feature request', () => {
    const result = generateIntake(
      'Add a REST API endpoint for user authentication. It should support OAuth2 and JWT tokens.',
      '',
    );

    expect(result.restatedIntent).toBe('Add a REST API endpoint for user authentication');
  });

  it('should infer scope from keywords', () => {
    const result = generateIntake(
      'Build a new React component for the dashboard page with responsive layout',
      '',
    );

    expect(result.inferredScope).toContain('frontend');
  });

  it('should infer multiple scopes', () => {
    const result = generateIntake(
      'Add an API endpoint that connects to the database and display results in the UI component',
      '',
    );

    expect(result.inferredScope).toContain('backend');
    expect(result.inferredScope).toContain('frontend');
  });

  it('should suggest team based on inferred scope', () => {
    const result = generateIntake(
      'Deploy the application to kubernetes using a CI/CD pipeline',
      '',
    );

    expect(result.suggestedTeam).toContain('devops');
    expect(result.suggestedMode).toBe('standard');
  });

  it('should suggest 24h mode for urgent requests', () => {
    const result = generateIntake(
      'Urgent: the production API is returning 500 errors and needs a hotfix immediately',
      '',
    );

    expect(result.suggestedMode).toBe('24h');
  });

  it('should predict security concerns', () => {
    const result = generateIntake('Implement OAuth2 authentication with JWT token handling', '');

    expect(result.predictedConcerns).toContain('Security implications need review');
  });

  it('should use memory context for scope inference', () => {
    const result = generateIntake(
      'Improve the query performance',
      'Previous work involved database schema migration',
    );

    expect(result.inferredScope).toContain('performance');
    expect(result.predictedConcerns).toContain('Database schema changes may require migration');
  });
});
