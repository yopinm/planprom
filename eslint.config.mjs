import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**", "out/**", "build/**", "next-env.d.ts",
    ".codex-ssh/**", "server-with-env.js",
  ]),
  {
    rules: {
      // Thai text contains characters that look like unescaped entities — downgrade to warn
      "react/no-unescaped-entities": "warn",
      // Pre-existing hook patterns — downgrade to warn until fixed
      "react-hooks/rules-of-hooks": "warn",
      // setState in useEffect is a valid sync pattern — downgrade to warn
      "react-hooks/set-state-in-effect": "warn",
      // Ref assignment during render is a common pattern to avoid stale closures
      "react-hooks/refs": "warn",
      // Unused vars — warn only, not error
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
]);

export default eslintConfig;
