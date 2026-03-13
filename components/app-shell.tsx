"use client"

import React from "react"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabaseBrowser } from "@/lib/supabase-browser"
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
  User,
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
  const [userEmail, setUserEmail] = useState<string>("")
  const router = useRouter()
  const supabase = supabaseBrowser()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  useEffect(() => {
    let mounted = true
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!mounted) return
        setUserEmail(data.user?.email ?? "")
      })
      .catch(() => {
        if (!mounted) return
        setUserEmail("")
      })
    return () => {
      mounted = false
    }
  }, [supabase])

  return (
    <div className="relative flex h-screen min-w-0 overflow-hidden bg-background text-foreground">
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

        <div className="mt-auto border-t border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground">
              {userEmail ? (
                <span className="text-sm font-semibold">{userEmail.charAt(0).toUpperCase()}</span>
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{userEmail || "Usuario"}</p>
              <p className="truncate text-xs text-sidebar-foreground/60">Conectado</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-3 w-full justify-center" onClick={handleLogout}>
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
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

          <div className="ml-auto flex items-center gap-3" />
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 min-w-0 overflow-x-hidden overflow-y-auto p-3 pb-[calc(env(safe-area-inset-bottom)+3rem)] sm:p-4 lg:p-6 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}
