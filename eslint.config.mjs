import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

// eslint-config-next 16 levererar färdiga flat configs. FlatCompat behövs inte,
// och gick inte att använda: den cirkulära referensen i "react"-plugin fick
// eslintrc-bryggan att kasta vid schemavalidering.
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'supabase/.temp/**',
      'docs/referens/**',
      'next-env.d.ts',
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
]

export default config
