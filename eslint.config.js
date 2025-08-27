import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

export default defineConfig([
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    files: ["**/*.js"],
    settings: {
      "import/resolver": {
        typescript: {
          project: "./jsconfig.json",
        },
      },
    },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.webextensions },
    },
    rules: {
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "(^_[^_])|(^_$)",
          argsIgnorePattern: "(^_[^_])|(^_$)",
          caughtErrorsIgnorePattern: "(^_[^_])|(^_$)",
          destructuredArrayIgnorePattern: "(^_[^_])|(^_$)",
          reportUsedIgnorePattern: true,
        },
      ],
      // Turn no-unresolved off b/c it doesn't handle absolute paths
      "import/no-unresolved": "off",
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          pathGroups: [
            {
              pattern: "/**",
              group: "internal",
            },
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          named: true,
          warnOnUnassignedImports: true,
        },
      ],
    },
  },
]);
