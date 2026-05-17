import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['codeoss/**', '**/dist/**', '**/out/**', '**/node_modules/**', '**/*.js', '**/*.mjs'],
  },
  ...tseslint.configs.strict,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
);
