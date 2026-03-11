# AGENTS.md – MiHato Engineering Guide

## 1. Project Snapshot
- Next.js 16 App Router + TypeScript + Tailwind CSS + shadcn/ui.
- Supabase (schema `bovinos`) is the single backend; data flows through `lib/data.ts`.
- UI copy and defaults target Costa Rican ranch management and use CRC currency.
- Fonts are loaded via `next/font` (Inter + JetBrains Mono) and wired through CSS variables.

## 2. Toolchain & Commands
```bash
# Install deps (Node 20+ recommended for Next 16 compatibility)
npm install

# Turbo dev server with HMR
npm run dev

# Production build + start
npm run build
npm run start

# ESLint (Next preset)
npm run lint

# Type-check only
npx tsc --noEmit

# Tests (not yet scripted): add a script named "test" or run your chosen runner manually.
# Once a test script exists, target a single test with:
npm run test -- --testNamePattern "partial name"
```
- Prefer `npm run lint && npm run build` before opening a PR; CI assumes this baseline.
- Storybook is not configured; if you introduce it, document commands here.

## 3. Repository Layout Highlights
```
app/            # App Router routes, layouts, server components
components/     # UI primitives (shadcn/ui fork), modules, shells
hooks/          # Reusable client hooks
lib/            # Supabase client, domain types, helpers (e.g., cn, data mappers)
public/         # Static assets
tailwind.config.ts / app/globals.css   # Design system tokens
```
- Keep feature-specific state close to `app/(feature)` routes; avoid sprawling utils.

## 4. Stack & Key Dependencies
- Radix primitives + shadcn/ui scaffolding for interactive components.
- Form stack: React Hook Form + Zod + `@hookform/resolvers`.
- Visuals: Lucide icons, Embla carousel, recharts for charts.
- Notifications use `sonner`; `cmdk` powers command palette.
- Tailwind merges rely on `clsx` + `tailwind-merge` via `cn()` helper.

## 5. Environment Setup
- Required env vars (define in `.env.local`, never commit):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- Access Supabase only through `lib/supabase.ts`; do not recreate clients per request.
- For additional secrets (service role, webhook keys), add server-only variables and guard with `process.env` checks.

## 6. Git & Workflow Norms
- Follow small, topic-focused branches; use imperative commit messages ("Add cattle trends card").
- Never rewrite user history; avoid `git push --force` unless explicitly approved.
- Run lint + type-check before staging; keep commits green.
- Document migrations or schema expectations inside PR descriptions.

## 7. Imports & Module Boundaries
- Use the `@/*` alias instead of relative `../../` paths.
- Import order: React/Next → third-party → absolute internal modules → relative modules.
- Type-only imports must use the `import type { ... } from` syntax; prefer `satisfies` over annotation when constraining objects.
- Avoid default exports for shared components; named exports encourage tree-shaking.

## 8. TypeScript Practices
- `tsconfig` runs in `strict` mode; do not suppress errors with `// @ts-ignore` unless documented.
- Use interfaces for shape definitions consumed externally; use `type` for unions, mapped, or utility types.
- Prefer discriminated unions for statusful entities (e.g., `AnimalStatus`).
- Represent nullable DB fields as `value?: type` when they are optional in UI, but keep `null` when the DB requires it.
- Use `ReadonlyArray` when the consumer should not mutate results.

## 9. React & Component Patterns
- Components default to server components; add `'use client'` only when hooks/events are needed.
- Wrap interactive primitives with `React.forwardRef` and set `displayName` for devtools clarity.
- Accept `className` + `...props` consistently; merge classes via `cn` before passing down.
- When fetching in server components, perform Supabase calls directly; in client components, prefer RPC endpoints or use the Supabase JS client sparingly.
- Keep state colocated; avoid cross-component singletons unless using Context.

## 10. Styling & UI System
- Tailwind tokens live in `app/globals.css`; only extend colors in `tailwind.config.ts` using CSS variables.
- Always compose classes with `cn()`; never manually concatenate strings with falsy checks.
- Respect light background aesthetic: neutrals + lush greens; avoid introducing new palette values unless added to CSS variables.
- Use `cva` for variant-heavy components; default variant should match Figma specs (rounded corners per `--radius`).
- Add responsive considerations (stacking, scroll areas) for each new layout.

## 11. Forms, Data Entry & Validation
- Use Zod schemas for every React Hook Form instance; derive TS types from schemas (`z.infer`).
- Display validation feedback inline plus toast summary for failed submissions.
- Persist numeric inputs as numbers (parse before storing); centralize currency formatting via dedicated helpers.
- Keep React Hook Form controllers close to input components to avoid prop drilling.

## 12. Data Access & Supabase Rules
- All queries use `supabase.schema('bovinos').from('<table>')`; never omit the schema.
- `lib/data.ts` maps snake_case rows into camelCase domain objects; extend these mapping helpers instead of rewriting conversions.
- When writing, convert camelCase back to snake_case (e.g., `animalId` → `animal_id`).
- Handle Supabase errors explicitly: inspect `{ error }`, log with context, show user-friendly toast.
- Batch reads when possible using `Promise.all`; avoid sequential awaits that hit Supabase individually per record.

## 13. Currency, Locale & Copy
- Display all amounts in **Costa Rican Colón (CRC)** with the ₡ symbol and no USD fallback.
- Use a single formatter (e.g., `Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' })`).
- When storing decimals, keep cents precision; avoid binary floats for totals.
- Date strings default to ISO; format for UI using `date-fns` with Spanish locale.

## 14. Error Handling & Messaging
- Wrap async server actions in try/catch; bubble meaningful `Error` objects upward.
- Client errors: show toast via `sonner`, highlight problem fields, and prefer Spanish-language copy.
- Log sensitive data only on the server; redact animal IDs when sharing logs publicly.
- Fail fast when required env keys are missing (throw during module init with explanatory message).

## 15. Testing & Quality Gates
- Testing scaffold is not present; if you add one, colocate `*.test.ts(x)` beside source or under `__tests__/`.
- Prefer Vitest or Jest for unit tests; configure a `test` npm script before committing test files.
- Mock Supabase via dependency injection or `vi.mock('@/lib/supabase')`; never hit live services in unit tests.
- When running a single test, rely on `npm run test -- --testNamePattern "regex"` (Vitest/Jest both honor it).
- Snapshot tests should include currency-specific expectations to catch CRC regressions.

## 16. Accessibility, Performance & UX
- Always set `lang="es"` (already configured in `app/layout.tsx`; keep it intact).
- Use semantic HTML landmarks, ARIA labels for controls derived from shadcn/ui, and ensure focus states meet contrast ratios.
- Prefer CSS grid/flex for layout; avoid absolute positioning unless animating overlays.
- Lazy-load heavyweight charts or carousels using dynamic imports with `ssr: false` only when necessary.
- Animate meaningfully (e.g., `accordion-down` keyframes already defined); avoid gratuitous animation when showing data-critical screens.
- Keep bundle lean (tree-shake Lucide imports), use Suspense plus skeletons for heavy data, memoize derived state, and default to Node runtime unless the code is SSR-safe at the edge.

## 18. Release & Verification Checklist
1. `npm run lint`
2. `npx tsc --noEmit`
3. `npm run build`
4. Manual smoke test of critical flows (animal onboarding, pesaje logging, venta recording).
5. Confirm CRC formatting and Spanish copy on the touched UI.

## 19. Cursor / Copilot Rules
- `.cursor/rules` and `.cursorrules` are absent; there are no Cursor-specific directives today.
- `.github/copilot-instructions.md` is absent; follow the guidelines in this document instead.

## 20. When Adding New Capabilities
- Extend `lib/data.ts` for any new table before using it in UI; update mapping tables to keep camelCase ↔ snake_case parity.
- Document new env vars at the top of this file and in README/PR descriptions.
- Update Tailwind tokens + CSS variables together to keep shadcn/ui theme consistent.
- If you introduce a new global provider (context, theme, query client), register it in `app/layout.tsx`.
