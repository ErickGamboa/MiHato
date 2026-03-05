"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Beef,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Scale,
  ArrowUpRight,
} from "lucide-react"
import {
  type Animal,
  type Pesaje,
  type Insumo,
  type Racion,
  type EventoSanitario,
  calcGDP,
  formatCurrency,
  formatNumber,
  getStatusColor,
  getAnimales,
  getPesajes,
  getInsumos,
  getRaciones,
  getEventosSanitarios,
} from "@/lib/data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

export function DashboardModule() {
  const [animales, setAnimales] = useState<Animal[]>([])
  const [pesajes, setPesajes] = useState<Pesaje[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [raciones, setRaciones] = useState<Racion[]>([])
  const [eventos, setEventos] = useState<EventoSanitario[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [a, p, i, r, e] = await Promise.all([
          getAnimales(),
          getPesajes(),
          getInsumos(),
          getRaciones(),
          getEventosSanitarios(),
        ])
        setAnimales(a)
        setPesajes(p)
        setInsumos(i)
        setRaciones(r)
        setEventos(e)
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando datos...</div>
  }

  const animalesActivos = animales.filter((a) => a.estado === "activo")
  const totalAnimales = animalesActivos.length

  const gdps: number[] = []
  for (const animal of animalesActivos) {
    const pesajesAnimal = pesajes.filter((p) => p.animalId === animal.id)
    const gdp = calcGDP(pesajesAnimal)
    if (gdp !== null) gdps.push(gdp)
  }
  const gdpPromedio = gdps.length > 0 ? gdps.reduce((a, b) => a + b, 0) / gdps.length : 0

  const costoDiarioPromedio = raciones.reduce((sum, racion) => {
    const costoDia = racion.insumos.reduce((c, ri) => {
      const insumo = insumos.find((i) => i.id === ri.insumoId)
      return c + (insumo ? insumo.costoPorKg * ri.kgPorAnimalDia : 0)
    }, 0)
    return sum + costoDia
  }, 0) / (raciones.length || 1)

  const utilidadProyectada = animalesActivos.reduce((sum, a) => {
    const ultimoPesaje = pesajes
      .filter((p) => p.animalId === a.id)
      .sort((x, y) => new Date(y.fecha).getTime() - new Date(x.fecha).getTime())[0]
    const pesoActual = ultimoPesaje ? ultimoPesaje.peso : a.pesoIngreso
    const ingresoEstimado = pesoActual * 1350
    return sum + (ingresoEstimado - a.precioTotal)
  }, 0)

  const alerts: { tipo: string; mensaje: string; severity: "warning" | "destructive" | "default" }[] = []
  const hoy = new Date()

  for (const ev of eventos) {
    if (ev.fechaFinRetiro && new Date(ev.fechaFinRetiro) > hoy) {
      const target = ev.animalId || `Lote ${ev.lote}`
      alerts.push({
        tipo: "Retiro activo",
        mensaje: `${target}: ${ev.producto} - retiro hasta ${ev.fechaFinRetiro}`,
        severity: "destructive",
      })
    }
  }

  for (const ins of insumos) {
    if (ins.stock < 400) {
      alerts.push({
        tipo: "Stock bajo",
        mensaje: `${ins.nombre}: ${ins.stock} ${ins.unidad}`,
        severity: "warning",
      })
    }
  }

  const lotes = ["L-01", "L-02", "L-03"]
  const gdpPorLote = lotes.map((lote) => {
    const animalesLote = animalesActivos.filter((a) => a.lote === lote)
    const gdpsLote: number[] = []
    for (const an of animalesLote) {
      const pesos = pesajes.filter((p) => p.animalId === an.id)
      const g = calcGDP(pesos)
      if (g !== null) gdpsLote.push(g)
    }
    return {
      lote,
      gdp: gdpsLote.length > 0 ? gdpsLote.reduce((a, b) => a + b, 0) / gdpsLote.length : 0,
      animales: animalesLote.length,
    }
  })

  const razaCount: Record<string, number> = {}
  for (const a of animalesActivos) {
    razaCount[a.raza] = (razaCount[a.raza] || 0) + 1
  }
  const razaData = Object.entries(razaCount).map(([name, value]) => ({ name, value }))
  const pieColors = [
    "hsl(142, 40%, 32%)",
    "hsl(35, 55%, 55%)",
    "hsl(200, 30%, 45%)",
    "hsl(25, 70%, 50%)",
    "hsl(0, 60%, 50%)",
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Beef className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Animales Activos</p>
              <p className="text-2xl font-bold text-foreground">{totalAnimales}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2/20">
              <Scale className="h-6 w-6 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">GDP Promedio</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{formatNumber(gdpPromedio, 2)}</p>
                <span className="text-xs text-muted-foreground">kg/día</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/20">
              <DollarSign className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costo Diario Prom.</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(costoDiarioPromedio)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilidad Proyectada</p>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-foreground">{formatCurrency(utilidadProyectada)}</p>
                <ArrowUpRight className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">GDP Promedio por Lote (kg/día)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gdpPorLote} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 88%)" />
                  <XAxis dataKey="lote" tick={{ fontSize: 13 }} />
                  <YAxis tick={{ fontSize: 13 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(35, 15%, 88%)",
                      fontSize: "13px",
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)} kg/día`, "GDP"]}
                  />
                  <Bar dataKey="gdp" fill="hsl(142, 40%, 32%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Raza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={razaData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name} (${value})`}
                  >
                    {razaData.map((_, idx) => (
                      <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas activas.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {alerts.slice(0, 6).map((alert, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                    <div
                      className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                        alert.severity === "destructive" ? "bg-destructive" : "bg-warning"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">{alert.tipo}</p>
                      <p className="text-sm text-foreground">{alert.mensaje}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos Ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {animales
                .sort((a, b) => new Date(b.fechaIngreso).getTime() - new Date(a.fechaIngreso).getTime())
                .slice(0, 5)
                .map((animal) => (
                  <div key={animal.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted font-mono text-xs font-bold text-foreground">
                        {animal.id.split("-")[1]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{animal.apodo || animal.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {animal.raza} · {animal.lote} · {animal.pesoIngreso} kg
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(animal.estado)}>
                      {animal.estado}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
