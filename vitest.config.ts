import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: [
      'lib/**/*.test.ts',
    ],
    // src/lib/__tests__/ contains legacy couponkum V13/V14 tests that reference
    // deleted source files — excluded to keep CI green
    exclude: [
      'src/**',
      'node_modules/**',
    ],
  },
})
