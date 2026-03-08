import { cookies } from "next/headers"
import { ClientPage } from "./client-page"
import type { ModuleKey } from "@/components/app-shell"

const MODULE_KEYS: ModuleKey[] = [
  "dashboard",
  "inventario",
  "pesajes",
  "suplementacion",
  "sanidad",
  "proyecciones",
  "utilidad",
]

export default async function Page() {
  const cookieStore = await cookies()
  const stored = cookieStore.get("mihato-active-module")?.value
  const initialModule: ModuleKey = stored && MODULE_KEYS.includes(stored as ModuleKey)
    ? (stored as ModuleKey)
    : "dashboard"

  return <ClientPage initialModule={initialModule} />
}
