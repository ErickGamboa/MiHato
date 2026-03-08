"use client"

import React from "react"

import { useState, type ReactNode } from "react"
import {
  LayoutDashboard,
  Beef,
  Scale,
  Wheat,
  Syringe,
  TrendingUp,
  DollarSign,
  Menu,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type ModuleKey = "dashboard" | "inventario" | "pesajes" | "suplementacion" | "sanidad" | "proyecciones" | "utilidad"

interface NavItem {
  key: ModuleKey
  label: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "inventario", label: "Inventario", icon: Beef },
  { key: "pesajes", label: "Pesajes", icon: Scale },
  { key: "suplementacion", label: "Suplementación", icon: Wheat },
  { key: "sanidad", label: "Sanidad", icon: Syringe },
  { key: "proyecciones", label: "Proyecciones", icon: TrendingUp },
  { key: "utilidad", label: "Utilidad", icon: DollarSign },
]

interface AppShellProps {
  activeModule: ModuleKey
  onModuleChange: (mod: ModuleKey) => void
  children: ReactNode
}

export function AppShell({ activeModule, onModuleChange, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Beef className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-sidebar-foreground">MiHato</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-sidebar-foreground lg:hidden hover:bg-sidebar-accent"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Cerrar menú</span>
          </Button>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="flex flex-col gap-1" role="list">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeModule === item.key
              return (
                <li key={item.key}>
                  <button
                    onClick={() => {
                      onModuleChange(item.key)
                      setSidebarOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4.5 w-4.5 shrink-0" />
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-sidebar-border px-4 py-4">
          <p className="text-xs text-sidebar-foreground/50">MiHato v1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-4 border-b bg-card/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </Button>
          <h2 className="text-base font-semibold text-foreground">
            {navItems.find((n) => n.key === activeModule)?.label}
          </h2>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto p-4 pb-[calc(env(safe-area-inset-bottom)+3rem)] lg:p-6 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
