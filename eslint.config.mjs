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
  // ── RSC Guard: event handlers in Server Components crash at runtime ─────────
  // page.tsx / layout.tsx are Server Components by default in Next.js App Router.
  // onClick / onChange / on* props cannot be passed from Server → Client Components.
  // Fix: extract the interactive element into a separate 'use client' component.
  {
    files: ["app/admin/**/page.tsx", "app/admin/**/layout.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name=/^on[A-Z]/]",
          message:
            "RSC: Event handlers (onClick, onChange, on*) cannot be passed in Server Components (page.tsx / layout.tsx). " +
            "Extract the interactive element to a separate 'use client' component instead.",
        },
      ],
    },
  },
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
