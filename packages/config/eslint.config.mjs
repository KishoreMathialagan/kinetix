import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'build', '.next', '.turbo', '*.d.ts'] },
  ...tseslint.configs.recommended,
);
