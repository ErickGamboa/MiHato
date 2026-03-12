# AGENTS.md – Guía para agentes en MiHato

## 1. Snapshot del proyecto
- Next.js 16 (App Router) + TypeScript + Tailwind CSS + shadcn/ui.
- Backend único: Supabase (esquema `bovinos`). Datos siempre filtrados por usuario/tenant.
- Idioma y copy: español (CR); moneda: **Colón (CRC)**.
- Fuentes vía `next/font` (Inter, JetBrains Mono) con variables CSS.

## 2. Comandos clave
```bash
# Instalar dependencias
npm install

# Dev con Turbopack
npm run dev

# Build y arranque prod
npm run build
npm run start

# Lint (ESLint 9 plano, ver eslint.config.mjs)

npm run lint

# Chequeo de tipos
npx tsc --noEmit

# Tests: no hay script aún. Cuando exista, un test puntual:
npm run test -- --testNamePattern "regex"
```

## 3. Estructura básica
```
app/            Rutas App Router, layouts, server components
components/     UI (shadcn/ui), módulos, shells
hooks/          Hooks reutilizables
lib/            Supabase client, tipos dominio, utilidades (cn, mapeos)
public/         Assets estáticos
tailwind.config.ts + app/globals.css  Tokens y tema
eslint.config.mjs Config ESLint plano (Next 16)
```

## 4. Stack y dependencias
- Radix + shadcn/ui para UI interactiva.
- Formularios: React Hook Form + Zod + @hookform/resolvers.
- Gráficos y UI: Lucide, Embla, recharts, sonner (toasts), cmdk (palette).
- Supabase JS como client; schema fijo `bovinos`.

## 5. Ambiente y llaves
- `.env.local` (no versionar):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  - Opcional server-only: `SUPABASE_SERVICE_ROLE_KEY` (solo en servidor para tareas admin; nunca en cliente).
- Cliente público en `lib/supabase.ts`; cliente admin (si lo usas) debe vivir en módulo server-only.

## 6. Flujos de autenticación
- Los usuarios se crean manualmente en Supabase Auth (no hay signup público).
- Login: usa `supabase.auth.signInWithPassword` desde páginas `(auth)`; copy en español.
- Sesión: obtener `auth.uid()` y propagarlo como `tenant_id` en todas las operaciones.
- Cierre de sesión con `supabase.auth.signOut()`; manejo de errores con toasts.

## 7. Aislamiento de datos y RLS
- Todas las tablas del esquema `bovinos` deben tener columna `tenant_id`/`usuario_id`.
- Consultas: siempre filtra por `tenant_id = userId` además de RLS.
- RLS en tablas: políticas `using/with check tenant_id = auth.uid()` para select/insert/update/delete.
- Operaciones internas sin RLS: usa cliente `service_role` solo en server actions/scripts y documenta su uso.

## 8. Workflow Git
- Commits pequeños, imperativos: "Add cattle trends card".
- No reescribir historia ajena; evita `--force` salvo instrucción explícita.
- Ejecuta `npm run lint` y `npm run build` antes de abrir PR.

## 9. Importaciones
- Usar alias `@/*`, evita rutas `../../` largas.
- Orden: React/Next → terceros → internos absolutos → relativos.
- Tipos con `import type { ... }`; prefiere `satisfies` para objetos literales.
- Exporta con named exports en componentes compartidos (evita default salvo páginas/routes).

## 10. TypeScript
- `strict` activo; no usar `// @ts-ignore` salvo justificación concreta.
- Interfaces para contratos externos; `type` para uniones/mapeos utilitarios.
- Prefiere `readonly`/`ReadonlyArray` cuando no se muta.
- Representa campos opcionales DB como `?:` en UI, conserva `null` si el backend lo requiere.

## 11. Patrones React
- Server components por defecto; añade `'use client'` solo si hay estado/efectos.
- `forwardRef` + `displayName` en componentes interactivos.
- Props estándar: `className` + `...props`; fusiona clases con `cn()`.
- Evita llamadas impuras en render (no `Math.random` directo); memoiza solo cuando sea estable.

## 12. Estilos y diseño
- Tema en `app/globals.css`; extiende colores vía CSS variables en `tailwind.config.ts`.
- Usa `cn()` siempre para clases condicionales; evita concatenar manualmente.
- `cva` para variantes; respeta `--radius` y estética clara (ver paleta verde/neutral).
- Asegura responsividad y scroll seguro en móviles.

## 13. Formularios y validación
- React Hook Form + Zod; deriva tipos con `z.infer`.
- Errores en línea + toast resumen; números se parsean antes de persistir.
- Mantén controllers cerca de inputs para evitar prop drilling excesivo.

## 14. Datos y Supabase
- Siempre `supabase.schema('bovinos').from('<tabla>')`.
- `lib/data.ts` mapea snake_case ↔ camelCase; extiende mapeos allí.
- Escrituras: convierte camelCase a snake_case (ej. `animalId` → `animal_id`).
- Manejo de errores: verifica `{ error }`, log con contexto, muestra toast amigable.
- Batching: usa `Promise.all` para evitar llamadas secuenciales innecesarias.

## 15. Moneda, fechas y copy
- Mostrar siempre CRC con `Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC' })`.
- Fechas ISO; formatear para UI con date-fns (v3) y locale español.
- Textos en español; evita anglicismos en UI final.

## 16. Accesibilidad y rendimiento
- `lang="es"` en `app/layout.tsx`; mantenerlo.
- Landmarks semánticos, ARIA en controles shadcn/ui; estados de foco visibles.
- Lazy/dynamic import para gráficos pesados o carruseles cuando sea necesario.
- Usa Suspense + skeletons para datos pesados; memoiza cálculos costosos con deps correctas.

## 17. Linting y calidad
- ESLint 9 con flat config en `eslint.config.mjs` (extiende `eslint-config-next`).
- Reglas de hooks: corrige deps de `useEffect/useMemo`; evita efectos con `setState` sin guardas.
- Warnings de React Compiler: al ajustar deps, asegura estabilidad de referencias.
- Antes de PR: `npm run lint`, `npx tsc --noEmit`, `npm run build`.

## 18. Testing (pendiente)
- Aún no hay runner configurado. Preferido: Vitest o Jest.
- Ubicación sugerida: junto al código (`*.test.tsx`) o `__tests__/`.
- Mock de Supabase vía `vi.mock('@/lib/supabase')`; no golpear servicios reales.
- Un solo test: `npm run test -- --testNamePattern "regex"` cuando exista script.

## 19. Cursor / Copilot
- No hay reglas en `.cursor/rules/` ni `.cursorrules`.
- No existe `.github/copilot-instructions.md`. Sigue este archivo como referencia.

## 20. Nuevas capacidades
- Nuevas tablas: añade `tenant_id`, políticas RLS y mapeos en `lib/data.ts`.
- Nuevos providers globales: registrar en `app/layout.tsx`.
- Nuevas env vars: documentar aquí y en README/PR.

## 21. Propiedad y soporte
- Este archivo es la fuente para agentes. Mantén ~150 líneas y actualiza al cambiar tooling (lint, auth, RLS, comandos).
- Cuando uses cliente admin (service role), deja constancia en la descripción del cambio/PR.
