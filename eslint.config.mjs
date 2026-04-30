import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  // react-hooks/set-state-in-effect fires on valid patterns (fetch-in-effect,
  // hydration guards, shadcn/ui components). Disable project-wide.
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  // API routes and server-side lib files are not React components —
  // disable react-hooks rules that cause false positives there.
  {
    files: ['app/api/**/*.ts', 'lib/**/*.ts'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // Supabase query results have no generated types in this project — downgrade to warning.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Audit page and other pages that map Supabase results without generated types.
  {
    files: ['app/**/*.tsx', 'app/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Valid patterns in shadcn/ui generated hooks.
  {
    files: [
      'components/ui/use-mobile.tsx',
      'components/ui/sidebar.tsx',
      'hooks/use-mobile.ts',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/purity': 'off',
    },
  },
]);
