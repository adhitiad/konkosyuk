import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@next/next/no-mfe-config-missing": "off",
      "import/no-anonymous-default-export": "off",
      "no-restricted-imports": [
        "error",
        {
          "paths": [
            {
              "name": "fs",
              "message":
                "Dilarang mengimpor modul server-only 'fs' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
            {
              "name": "path",
              "message":
                "Dilarang mengimpor modul server-only 'path' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
            {
              "name": "crypto",
              "message":
                "Dilarang mengimpor modul server-only 'crypto' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
            {
              "name": "winston",
              "message":
                "Dilarang mengimpor modul server-only 'winston' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
          ],
          "patterns": [
            {
              "group": ["*/server/*", "*/db/*"],
              "message":
                "Dilarang mengimpor modul server-only ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["sentry.*.config.ts"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "e2e/**",
    ],
  },
  {
    files: ["components/**/*.{ts,tsx}", "**/*.client.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          "paths": [
            {
              "name": "fs",
              "message":
                "Dilarang mengimpor modul server-only 'fs' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
            {
              "name": "path",
              "message":
                "Dilarang mengimpor modul server-only 'path' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
            {
              "name": "crypto",
              "message":
                "Dilarang mengimpor modul server-only 'crypto' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
            {
              "name": "winston",
              "message":
                "Dilarang mengimpor modul server-only 'winston' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
            {
              "name": "drizzle-orm",
              "message":
                "Dilarang mengimpor modul server-only 'drizzle-orm' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
          ],
          "patterns": [
            {
              "group": ["/drizzle-orm/*"],
              "message":
                "Dilarang mengimpor modul server-only 'drizzle-orm' ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
            {
              "group": ["*/server/*", "*/db/*"],
              "message":
                "Dilarang mengimpor modul server-only ke dalam komponen klien. Pisahkan logika ini ke Server Action atau file utilitas server.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "app/api/**/*.{ts,tsx}",
      "actions/**/*.{ts,tsx}",
      "server/**/*.{ts,tsx}",
      "lib/server/**/*.{ts,tsx}",
      "src/server/**/*.{ts,tsx}",
      "src/actions/**/*.{ts,tsx}",
      "src/app/**/*.{ts,tsx}",
      "src/scripts/**/*.{ts,tsx}",
      "src/lib/**/*.{ts,tsx}",
      "scripts/**/*.{ts,tsx}",
      "vitest.config.ts",
    ],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];