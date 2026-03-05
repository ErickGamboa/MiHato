"use client"

import { useState } from "react"
import { AppShell, type ModuleKey } from "@/components/app-shell"
import { DashboardModule } from "@/components/modules/dashboard"
import { InventarioModule } from "@/components/modules/inventario"
import { PesajesModule } from "@/components/modules/pesajes"
import { SuplementacionModule } from "@/components/modules/suplementacion"
import { SanidadModule } from "@/components/modules/sanidad"
import { ProyeccionesModule } from "@/components/modules/proyecciones"
import { UtilidadModule } from "@/components/modules/utilidad"

export default function Page() {
  const [activeModule, setActiveModule] = useState<ModuleKey>("dashboard")

  return (
    <AppShell activeModule={activeModule} onModuleChange={setActiveModule}>
      {activeModule === "dashboard" && <DashboardModule />}
      {activeModule === "inventario" && <InventarioModule />}
      {activeModule === "pesajes" && <PesajesModule />}
      {activeModule === "suplementacion" && <SuplementacionModule />}
      {activeModule === "sanidad" && <SanidadModule />}
      {activeModule === "proyecciones" && <ProyeccionesModule />}
      {activeModule === "utilidad" && <UtilidadModule />}
    </AppShell>
  )
}
