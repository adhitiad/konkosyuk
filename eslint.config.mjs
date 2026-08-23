import globals from "globals";

export default [
  { ignores: ["**/node_modules/**", "**/dist/**", "**/.next/**"] },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
];
