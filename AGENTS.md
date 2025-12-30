# Repository Guidelines

## Project Structure and Module Organization
- `apps/web-new/` is the active Preact/Vite PWA.
  - `apps/web-new/src/` contains UI, screens, services, hooks, types, and utilities.
  - `apps/web-new/public/` includes static assets and `public/data/` for templates and scenarios.
  - `apps/web-new/tests/` splits unit and component tests.
- `android/` hosts the Capacitor Android wrapper; built APKs land in `apks/`.
- `docs/` includes guides (APK build, architecture notes); `legacy/` is archived code.
- `build-apk.sh` builds the web app and packages it into an APK.

## Build, Test, and Development Commands
Run from the repo root unless noted:
- `cd apps/web-new && npm install` install dependencies.
- `npm run dev` start the Vite dev server (http://localhost:5173).
- `npm run build` production build; `npm run preview` preview the build.
- `npm run test` run Vitest once; `npm run test:watch` for watch mode.
- `npm run typecheck`, `npm run lint`, `npm run format` for quality gates.
- `npm run build:mobile` prepares a mobile build for Capacitor.
- Android: `./build-apk.sh release` or `./build-apk.sh debug`.
- Android sync/open: `cd apps/web-new && npx cap sync android` and `npx cap open android`.

## Coding Style and Naming Conventions
- TypeScript strict mode; Preact functional components with hooks.
- Formatting via Prettier (`apps/web-new/.prettierrc`): 2-space indent, 100 char width, semicolons, double quotes.
- Linting via ESLint (`apps/web-new/eslint.config.js`); avoid explicit `any` when possible and prefix unused vars with `_`.
- Naming: components in PascalCase (`QuestionnaireForm.tsx`), hooks in `useX.ts`, tests as `*.test.ts` or `*.test.tsx`.
- Follow `.editorconfig` defaults for non-TS files.

## Testing Guidelines
- Frameworks: Vitest + Testing Library (jsdom).
- Tests live in `apps/web-new/tests/unit/` and `apps/web-new/tests/component/`.
- Coverage goal: 80% for critical logic (see `CONTRIBUTING.md`).
- Example: `npm run test -- tests/unit/services/api.test.ts`.

## Commit and Pull Request Guidelines
- Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`.
  Example: `git commit -m "feat(compare): add conversation prompts"`.
- Branch names: `feature/<name>` or `fix/<name>`.
- PRs should include what/why, testing performed, and screenshots for UI changes.

## Security and Configuration Notes
- Data is local-first (localStorage); do not log or commit sensitive data.
- AI features are opt-in and require a user-provided OpenRouter key; never hardcode secrets.
