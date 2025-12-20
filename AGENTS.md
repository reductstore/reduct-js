# Repository Guidelines

Contributor notes for the ReductStore JavaScript/TypeScript SDK. Keep changes scoped, documented, and reproducible.

## Project Structure & Module Organization

- `src/` holds the TypeScript source; `src/http` wraps fetch requests and auth, `src/messages` defines request/response DTOs with parsing helpers, and `src/utils` contains shared helpers.
- `lib/esm` and `lib/cjs` are generated build outputs; do not edit them directly—regenerate via the build.
- `test/` contains Jest suites (`*.test.ts`) mirroring the client surface; `test/utils` hosts shared fixtures.
- `examples/` has minimal usage snippets; update when adding notable features.
- `coverage/` is produced by Jest when coverage is enabled.

## Build, Test, and Development Commands

- `npm run tsc` compiles the SDK to ESM and CJS and rewrites `src/version.ts` from `package.json`—run after bumping versions or touching types.
- `npm test` compiles then runs Jest in-band (stable for async HTTP tests). Filter with `npm test -- Bucket`.
- `npm run lint` enforces the ESLint ruleset; `npm run fmt` applies Prettier; `npm run fmt:check` validates formatting without writes.
- Install deps with `npm install`; Node.js 18+ is required.

## Coding Style & Naming Conventions

- TypeScript-first, async/await APIs. Prefer `const`, arrow callbacks, and destructuring (`no-var`, `prefer-const`, `prefer-arrow-callback` are enforced).
- Prettier defaults (2-space indent, double quotes, trailing commas where valid) plus ESLint (`@typescript-eslint` + `eslint:recommended` + `prettier`).
- Classes/types/interfaces use PascalCase (`Client`, `BucketSettings`); functions, variables, and fields use camelCase. Align new DTOs with existing `parse`/`serialize` helpers in `src/messages`.
- Keep public API docs concise with JSDoc blocks; include examples for new methods.

## Testing Guidelines

- Jest with `ts-jest`; place specs next to related modules under `test/` using `*.test.ts`.
- Aim for deterministic tests; prefer mocked fetch/HTTP interactions over live endpoints. Reuse helpers from `test/utils`.
- Add coverage when adding public APIs; run `npm test -- --coverage` locally before large changes.

## Commit & Pull Request Guidelines

- Use short, imperative subjects and reference issues/PRs when relevant (e.g., `Add baseUrl argument (#123)`); avoid committing generated `lib` diffs without a matching source change.
- PRs should state what changed and why, list key commands run (`npm run tsc`, `npm test`, `npm run lint`), and link related issues. Include doc updates for user-facing API shifts and CHANGELOG entries for release-worthy changes.
- **CHANGELOG.md must be updated for every PR** (bug fixes, features, docs) following the format from the [PR template](https://github.com/reductstore/.github/blob/main/.github/pull_request_template.md). Add entries under the "Unreleased" section using the appropriate category (Added, Changed, Deprecated, Removed, Fixed, Security).
- **PR links in CHANGELOG**: Always use the format `[PR-XX](https://github.com/reductstore/reduct-js/pull/XX)` where XX is the PR number. This should be added when the PR number is known (typically by the maintainer before merging).
- **Do not create examples** for new features unless explicitly requested in the issue description.
- **Do not update README** unless explicitly requested in the issue description or necessary for the change.
- **Always run linter** (`npm run lint`) before committing changes. If the linter fails with "command not found", ensure dependencies are properly installed with `npm install`.
- **Verify CI checks**: After pushing changes, monitor the CI pipeline to ensure all checks pass, including format, build, lint, and tests.
- **Test with multiple ReductStore versions**: Ensure changes work with both `reduct/store:main` (new features) and `reduct/store:latest` (stable version) when testing locally.
