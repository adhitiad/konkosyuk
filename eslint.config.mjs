import globals from "globals";
import tsParser from "@typescript-eslint/parser";

export default [
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**"] },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
