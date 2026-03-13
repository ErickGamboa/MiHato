# AGENT GUIDELINES

This repository runs on Next.js 16 + Turbopack, Tailwind CSS, Radix UI, Supabase, and TypeScript 5.7.3. The app router is in use, the UI lives under `components/`, and state/data access flows through `hooks/use-data-store.tsx`. These notes help agents stay aligned with the stack, commands, and conventions while touching any layer.

---

## 1. Tooling & Commands

### Setup
- `npm install` installs dependencies (use `--legacy-peer-deps` only if you hit peer issues). Keep `package-lock.json` in sync when adding/removing packages.

### Local development
- `npm run dev` starts the Next.js dev server; it already uses Turbo for routing performance.
- `npm run start` serves the production build (`npm run build` first).

### Build & static checks
- `npm run build` compiles the Next.js project; run it before any environment push or preview. Rerun after schema migrations or new environment variables.
- `npm run lint` is powered by `eslint .` with the Next.js ESLint config. Use it to catch formatting, type, and accessibility issues. Pass `--max-warnings=0` to enforce zero-warning pulls.
- `npx tsc --noEmit` runs the TypeScript compiler in isolation; do this after major type changes to ensure definitions are sound.

### Tests & single-test guidance
- There is no dedicated `npm run test` script configured yet. When you add tests (e.g., Vitest, Jest), register them in `package.json` and document the command here. To run a single test once tests exist, use `npm run test -- --testNamePattern "<pattern>"` (Vitest/Jest compatible). Replace `<pattern>` with the test name or file stub you want to exercise.

### Recommended workflow checkpoints
1. `npm run lint` after any change to JSX/TSX or style files.
2. `npx tsc --noEmit` for TypeScript-heavy touches.
3. `npm run build` when touching routing, data fetching, serialization, or config.

---

## 2. Repository Layout

- `app/` contains the Next.js app router pages (`page.tsx`, `client-page.tsx`, `layout.tsx`). Mount global providers, modals, and the `Toaster` here.
- `components/` holds modular UI pieces (`ui/`), domain modules (dashboard, inventario, etc.), and shared hooks. Keep new modules close to their domain.
- `hooks/` holds reusable hooks like `use-data-store` and the custom `use-feedback` introduced for notifications.
- `lib/` houses data helpers, formatters, and Supabase helpers.
- `public/` is still empty but expect static assets there in the future.

### Key directories to watch
- `components/modules/` implements each dashboard area (Inventario, Pesajes, etc.). All business logic (dialog handling, validation, API calls) lives inside these files.
- `components/ui/` houses UI primitives (Button, Dialog, Toast, ConfirmDialog) built on Radix + Tailwind.

---

## 3. Code style, formatting, and conventions

### Imports & exports
- Always prefer `import type { ... }` for types, even if your TypeScript config strips them at compile time. This keeps the tree-shaking graph clean.
- Group imports in the following order: React/Next -> third-party libs -> internal utilities/hooks/components -> styles/assets. Add a blank line between groups.
- Use the `@/` alias for absolute paths (e.g., `@/components/ui/button`). Avoid relative spirals like `../../..`.
- Default exports are rare. Prefer named exports, even for components, so the bundler tree-shakes more effectively and rename imports explicitly.

### Formatting
- Tailwind utility classes follow a heuristic: semantic groups (layout, typography, spacing) sorted alphabetically within the component’s markup. Stick to class names already used in AD or follow the existing style (e.g., `rounded-lg border px-4 py-3`).
- Keep JSX props vertically aligned when they span multiple lines. Use `className={cn(... )}` with `cn` helper for conditional classes.
- Let ESLint and the Next.js formatter auto-fix simple issues. If you need additional formatting, run `npx prettier --write .` (the project adheres to standard Prettier defaults).

### TypeScript & typing conventions
- Use precise types for component props (prefer `interface` for component props and `type` for unions). Name components in PascalCase and hooks as `useXxx`.
- Prefer `satisfies` to assert complex literals against interfaces when available (already seen in `newAnimal` creation). Keep `readonly` on data snapshots when data should not mutate directly.
- Avoid `any`. When throwing errors, catch them as `unknown`, log them, and send to `useFeedback.error` to keep stack traces consistent (we already wrap `console.error(err)` before showing a toast).
- For data fetching, prefer `supabase` helper functions in `lib/data.ts` and `use-data-store.tsx`. Keep Supabase calls centralized to avoid duplicate logic.

### Component & hook conventions
- Keep `components/modules/*` stateful and interplay with the `use-data-store` hook. Do not duplicate fetching logic across modules; rely on `DataProvider` context.
- Modal/dialog open state should stay local (use `useState`), but the overlay/toggles should rely on shared primitives (`AlertDialog`, `Dialog`, `ConfirmDialog`).
- Toast messages should always go through `useFeedback.notify`, `success`, or `error`. Do not call `window.alert/confirm`; the new helper handles friendly copy.
- Keep business rules (e.g., lot deletion guard, duplicate checks) inside the handler functions and use domain-specific messaging via toast rather than console logs.

### Styling & visual language
- Use Tailwind + Radix components for consistency. When creating new UI elements, compose from existing `components/ui` primitives rather than rewriting CSS.
- Prefer expressive fonts (the global layout already loads Inter and JetBrains Mono). Stick to established color tokens (e.g., `text-muted-foreground`, `bg-card`), and only add new ones in `globals.css`/`tailwind.config`. No purple bias or default Inter-only combos.

### Error handling & user feedback
- Every async operation that can fail must show user feedback through `useFeedback.error` and log the raw error via `console.error(err)` before returning.
- Success operations should call `useFeedback.notify` with a confirmatory message and close the modal/dialog (set state accordingly).
- For destructive actions (deletions, revert), use `ConfirmDialog` with the `danger` flag so buttons render in the `destructive` color scheme.
- Do not swallow errors silently; prefer to propagate them up and allow a toast to show the failure reason.

### Naming & semantics
- Keep Supabase columns and derived helper names consistent: `animales`, `lote`, `pesajes`. For derived values, prefer Spanish-friendly names (e.g., `getAnimalDisplayLabel`).
- Variables representing UI state should use descriptive names (`showNewDialog`, `cambioLoteForm`). Use prefixes like `filtered`/`selected` for clarity.
- Entities like `MoveAnimalToLotInput` should live near the hook definitions so they are typed once.

### Testing & documentation
- Tests currently do not exist. Before adding tests, document the stack choice (Vitest, Jest, etc.) and add a script entry for `npm run test`.
- If you add tests, maintain the `useFeedback` infrastructure for assertions around toasts and dialogs (mock the hook if needed).

---

## 4. Cursor/Copilot rules
- There are no `.cursor/rules` or `.githooks/copilot-instructions.md` files in this repo. Continue following the AGENT conventions described here.

---

## 5. Communication
- When raising PRs or describing changes, mention lint/type coverage, Supabase/API modifications, and user-facing feedback copy changes.
- If you hit an ESLint rule you cannot satisfy, document the reasoning (brief comment or issue) instead of suppressing it globally.

---

Stay in sync with these rules whenever touching this repo. If anything changes (new tooling, tests, eslint rules), update this file so future agents don’t work blind.

---

## 6. Data & Supabase patterns
- `hooks/use-data-store.tsx` centralizes all Supabase reads/writes. Reuse it instead of scattering raw `supabase` calls.
- Every hook exposed by `use-data-store` logs the user ID, refreshes the snapshot, and returns typed records. Do not duplicate logic or bypass the refresh cadence; use the provided helpers (`createAnimal`, `deleteRacion`, etc.) whenever possible.
- When working with the lot API (`/api/lotes`), remember it uses tenant headers. Always pass `x-tenant-id` with the current Supabase user ID (available through the hook) and guard fetch calls with `response.ok` checks.
- Business rules such as checking `animalesCount` before deleting a lot or `isIdentifierDuplicated` before creating an animal belong in the module that triggered the action. Keep validation close to the UI, but delegate persistence and consistency checks to `use-data-store` or `lib/data.ts` helpers.

## 7. Frontend design expectations
- When you touch visual areas, avoid boilerplate layouts. Aim for a purposeful visual direction: define CSS variables for new color ramps, use gradients/shadows for depth, and align typography with the `Inter` + `JetBrains Mono` stack.
- Motion should be meaningful: leverage Radix `Dialog`/`AlertDialog` transitions, animate entry/exit of cards or toasts, and keep clutter minimal.
- Backgrounds should not be flat white. Use subtle textures/semi-transparent cards (`bg-card/95`), `backdrop-blur`, or gradients, especially for hero/header areas.
- Buttons and inputs should follow existing semantic groups (`Button`, `Input`, `Select`). When adding new controls, wrap them in `components/ui` primitives and include `aria` attributes where needed (e.g., `sr-only` labels for icon-only buttons).
- Always test responsiveness: the UI should feel intentional on desktop and mobile. Use `lg:` breakpoints for layout shifts, keep padding consistent, and test scroll behavior when the sidebar is pinned.

## 8. Git & workspace hygiene
- You may be in a dirty worktree. NEVER revert user changes unless explicitly asked. Understand existing diffs before editing related files.
- Do not amend commits unless the user specifically requests it or a hook mandates it. Avoid destructive commands (`git reset --hard`, `git clean -fd`, etc.).
- Do not push to remote unless explicitly instructed. If you are asked to push, use `git push` (no `--force`).
- Keep `package-lock.json` in sync whenever dependencies change.

---

## 9. Reporting & follow-up
- When summarizing changes, mention the commands you ran, the tests (lint/build) you executed, and whether Supabase/API layers were touched.
- Always call out user-facing copy updates (toast messages, dialog prompts, validation text). They drive QA.
- If you hit blockers (missing env var, API limit, unknown secret), document them in the final message instead of assuming defaults.

Stay aligned with these guidelines. If anything changes (tool versions, new UI system, new standard), update this file so future agents stay coordinated.
