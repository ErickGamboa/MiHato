"use client"

import { useCallback, useState } from "react"
import { AppShell, type ModuleKey } from "@/components/app-shell"
import { DashboardModule } from "@/components/modules/dashboard"
import { InventarioModule } from "@/components/modules/inventario"
import { PesajesModule } from "@/components/modules/pesajes"
import { SuplementacionModule } from "@/components/modules/suplementacion"
import { SanidadModule } from "@/components/modules/sanidad"
import { ProyeccionesModule } from "@/components/modules/proyecciones"
import { UtilidadModule } from "@/components/modules/utilidad"
import { DataProvider } from "@/hooks/use-data-store"

const ACTIVE_MODULE_STORAGE_KEY = "mihato-active-module"

interface ClientPageProps {
  initialModule: ModuleKey
}

export function ClientPage({ initialModule }: ClientPageProps) {
  const [activeModule, setActiveModule] = useState<ModuleKey>(initialModule)

  const handleModuleChange = useCallback((module: ModuleKey) => {
    setActiveModule(module)
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ACTIVE_MODULE_STORAGE_KEY, module)
      document.cookie = `${ACTIVE_MODULE_STORAGE_KEY}=${module}; path=/; max-age=${60 * 60 * 24 * 30}`
    }
  }, [])

  return (
    <DataProvider>
      <AppShell activeModule={activeModule} onModuleChange={handleModuleChange}>
        {activeModule === "dashboard" && <DashboardModule />}
        {activeModule === "inventario" && <InventarioModule />}
        {activeModule === "pesajes" && <PesajesModule />}
        {activeModule === "suplementacion" && <SuplementacionModule />}
        {activeModule === "sanidad" && <SanidadModule />}
        {activeModule === "proyecciones" && <ProyeccionesModule />}
        {activeModule === "utilidad" && <UtilidadModule />}
      </AppShell>
    </DataProvider>
  )
}
