import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Downgraded from the recommended-config default of "error": there are
      // ~400 pre-existing `any` usages across the codebase (mostly Supabase
      // query results and edge function payloads), and nobody had been
      // running `npm run lint` as a gate — turning this into a hard error
      // now would make CI permanently red on day one instead of catching
      // new problems. Still flagged as a warning so new `any`s are visible.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
