# AGENTS.md - Development Guide for MiHato

## Project Overview

MiHato is a Next.js 16 application with TypeScript, Tailwind CSS, and Supabase. It uses the App Router structure and includes shadcn/ui components for the UI layer. The application is configured to use **Costa Rican Colon (CRC)** as the default currency.

## Build Commands

```bash
# Development server (with Turbo)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint

# Run a single test (if tests exist)
npm run test -- --testNamePattern="test name"

# TypeScript check
npx tsc --noEmit
```

## Project Structure

```
/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── modules/          # Feature-specific components
│   └── app-shell.tsx    # App layout wrapper
├── lib/
│   ├── utils.ts         # cn() utility function
│   ├── supabase.ts      # Supabase client
│   └── data.ts          # Data fetching & CRUD utilities
├── hooks/               # Custom React hooks
├── public/              # Static assets
└── styles/              # Additional styles
```

## Code Style Guidelines

### Imports and Path Aliases

- Use `@/*` alias for imports: `import { cn } from '@/lib/utils'`
- Order imports: React imports first, then external libraries, then internal modules
- Use explicit type imports when needed: `import { type ClassValue } from 'clsx'`

### TypeScript

- **Strict mode is enabled** in tsconfig.json - all type errors must be fixed
- Enable strict null checks: `myVar?.property` instead of `myVar.property`
- Use interfaces for public API types, type aliases for unions/primitives
- Avoid `any` - use `unknown` if type is truly unknown

### React Components

- Use `React.forwardRef` for components that need ref forwarding
- Define prop types using `extends React.XHTMLAttributes` pattern
- Set `displayName` for components: `Button.displayName = 'Button'`
- Use functional components with explicit return types when helpful
- Use `"use client"` directive for client-side components

### Styling with Tailwind CSS

- Use `cn()` utility from `@/lib/utils` for conditional class merging
- Follow shadcn/ui color system (hsl variables for theming)
- Use semantic color tokens: `bg-primary`, `text-foreground`, `bg-destructive`
- Use `cva` (class-variance-authority) for component variants

### Form Handling

- Use React Hook Form with Zod for form validation
- Define schemas using Zod: `z.object({ ... })`
- Use `@hookform/resolvers` to integrate Zod with React Hook Form

### Naming Conventions

- **Components**: PascalCase (e.g., `Button`, `UserProfile`)
- **Functions**: camelCase (e.g., `formatDate`, `calculateTotal`)
- **Constants**: PascalCase for exported constants, SCREAMING_SNAKE for config
- **Files**: kebab-case for utilities, PascalCase for components
- **Database columns**: snake_case (e.g., `animal_id`, `fecha_ingreso`)

### Currency

- All monetary values are in **Costa Rican Colon (CRC)**
- Use `formatCurrency()` from `@/lib/data` to display values
- Hardcoded values should use CRC equivalent (e.g., ₡2,000 instead of $2)

### Error Handling

- Use try/catch with async/await for database operations
- Display user-friendly error messages via toast/sonner
- Log errors appropriately for debugging
- Handle Supabase errors with proper error states

### Database (Supabase)

- Use the Supabase client from `@/lib/supabase`
- All tables are in the `bovinos` schema: `supabase.schema('bovinos').from('table')`
- **IMPORTANT**: When inserting/updating, use snake_case column names to match the database
- Enable RLS (Row Level Security) policies in the database
- Handle loading and error states in data-fetching components

### Testing Guidelines

- Place tests in `__tests__/` directories or alongside components with `.test.tsx` suffix
- Use descriptive test names: `it('should display user name when logged in')`
- Mock Supabase calls in tests when needed

### Pre-commit Checks

Before committing, ensure:
1. `npm run lint` passes with no errors
2. `npm run build` succeeds
3. No TypeScript errors (`npx tsc --noEmit`)

## Common Patterns

### Creating a New UI Component

Follow the shadcn/ui pattern:
1. Use cva for variants
2. Extend Radix UI primitive if available
3. Use cn() for class merging
4. Forward ref with displayName

### Adding a New Page

1. Create `app/[route]/page.tsx` for the page
2. Add any necessary layout in `app/[route]/layout.tsx`
3. Fetch data server-side with async components

### Database Operations (Supabase)

Always specify the `bovinos` schema and use snake_case for column names:

```typescript
// Fetch data
const { data, error } = await supabase.schema('bovinos').from('animales').select('*')

// Insert data (IMPORTANT: use snake_case column names)
const { error } = await supabase.schema('bovinos').from('ventas').insert({
  id: '...',
  animal_id: '...',      // NOT animalId
  fecha_venta: '...',    // NOT fechaVenta
  peso_venta: 100,       // NOT pesoVenta
})

// Handle errors
if (error) {
  console.error(error)
  return
}
```

### Column Name Mapping

The codebase uses camelCase in TypeScript interfaces but **snake_case** in the database:

| TypeScript (lib/data.ts) | Database (bovinos schema) |
|--------------------------|---------------------------|
| `animalId` | `animal_id` |
| `fechaVenta` | `fecha_venta` |
| `pesoVenta` | `peso_venta` |
| `costoPorKg` | `costo_por_kg` |
| `fechaVencimiento` | `fecha_vencimiento` |
