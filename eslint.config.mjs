import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: ["lib/**", "node_modules/**", "coverage/**"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: false,
      },
      globals: {
        fetch: "readonly",
        Buffer: "readonly",
        ReadableStream: "readonly",
        Headers: "readonly",
        RequestInit: "readonly",
        Response: "readonly",
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        Blob: "readonly",
        AbortController: "readonly",
        console: "readonly",
        process: "readonly",
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        vi: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-undef": "off",
      "no-var": "error",
      "prefer-const": "error",
      "prefer-arrow-callback": "error",
      "prefer-destructuring": "error",
      "prefer-rest-params": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "none",
        },
      ],
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  prettier,
];
