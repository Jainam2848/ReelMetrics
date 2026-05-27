import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
  // Public Bundle Separation Boundary (spec §14.7)
  {
    files: [
      "app/\\(public\\)/**/*.ts",
      "app/\\(public\\)/**/*.tsx",
      "app/(public)/**/*.ts",
      "app/(public)/**/*.tsx"
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/db",
              message: "Public pages must not import database connections or schemas to safeguard bundle sizes.",
            },
            {
              name: "@/lib/supabase",
              message: "Public pages must not import Supabase clients to safeguard bundle sizes.",
            },
            {
              name: "@/lib/supabase/client",
              message: "Public pages must not import Supabase clients to safeguard bundle sizes.",
            },
            {
              name: "@/lib/supabase/server",
              message: "Public pages must not import Supabase clients to safeguard bundle sizes.",
            },
            {
              name: "@/lib/supabase/admin",
              message: "Public pages must not import Supabase admin client to safeguard bundle sizes.",
            },
            {
              name: "@/lib/security/encryption",
              message: "Public pages must not import encryption keys or routines inside public bundles.",
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    }
  }
]);

export default eslintConfig;
