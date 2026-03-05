"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react"
import {
  type Animal,
  type Pesaje,
  formatNumber,
  calcGDP,
  getLotes,
  getAnimalesConProblemas,
} from "@/lib/data"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { useDataStore } from "@/hooks/use-data-store"

export function PesajesModule() {
  const { animales, pesajes, loading, createPesaje } = useDataStore()
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [filterLote, setFilterLote] = useState<string>("todos")
  const [newForm, setNewForm] = useState({ animalId: "", fecha: new Date().toISOString().split("T")[0], peso: "", suplementacion: "" })

  const animalesActivos = animales.filter((a) => a.estado === "activo")
  const lotes = getLotes(animales)

  const animalData = useMemo(() => {
    return animalesActivos
      .filter((a) => filterLote === "todos" || a.lote === filterLote)
      .map((animal) => {
        const animalPesajes = pesajes
          .filter((p) => p.animalId === animal.id)
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
        const gdp = calcGDP(animalPesajes)
        const ultimoPeso = animalPesajes.length > 0 ? animalPesajes[animalPesajes.length - 1].peso : animal.pesoIngreso
        const kgGanados = ultimoPeso - animal.pesoIngreso
        const ultimoPesaje = animalPesajes.length > 0 ? animalPesajes[animalPesajes.length - 1] : null
        const diasDesdeUltimo = ultimoPesaje
          ? Math.round((new Date().getTime() - new Date(ultimoPesaje.fecha).getTime()) / (1000 * 60 * 60 * 24))
          : null

        let trend: "up" | "down" | "stalled" = "up"
        if (animalPesajes.length >= 2) {
          const last2 = animalPesajes.slice(-2)
          if (last2[1].peso < last2[0].peso) trend = "down"
          else if (last2[1].peso === last2[0].peso) trend = "stalled"
        }

        return {
          animal,
          pesajes: animalPesajes,
          gdp,
          ultimoPeso,
          kgGanados,
          diasDesdeUltimo,
          trend,
          numPesajes: animalPesajes.length,
        }
      })
  }, [animalesActivos, pesajes, filterLote])

  const gdpPorLoteData = lotes.map((lote) => {
    const animalesLote = animalesActivos.filter((a) => a.lote === lote)
    const gdps: number[] = []
    for (const an of animalesLote) {
      const p = pesajes.filter((pe) => pe.animalId === an.id)
      const g = calcGDP(p)
      if (g !== null) gdps.push(g)
    }
    return {
      lote,
      gdp: gdps.length > 0 ? gdps.reduce((a, b) => a + b, 0) / gdps.length : 0,
    }
  })

  const razas = [...new Set(animalesActivos.map((a) => a.raza))]
  const gdpPorRazaData = razas.map((raza) => {
    const animalesRaza = animalesActivos.filter((a) => a.raza === raza)
    const gdps: number[] = []
    for (const an of animalesRaza) {
      const p = pesajes.filter((pe) => pe.animalId === an.id)
      const g = calcGDP(p)
      if (g !== null) gdps.push(g)
    }
    return {
      raza,
      gdp: gdps.length > 0 ? gdps.reduce((a, b) => a + b, 0) / gdps.length : 0,
    }
  })

  const handleNewPesaje = async () => {
    if (!newForm.animalId || !newForm.fecha || !newForm.peso) {
      alert("Complete todos los campos obligatorios.")
      return
    }
    const newP: Pesaje = {
      id: `P-${String(pesajes.length + 1).padStart(3, "0")}`,
      animalId: newForm.animalId,
      fecha: newForm.fecha,
      peso: Number.parseFloat(newForm.peso),
      suplementacion: newForm.suplementacion || undefined,
    }
    createPesaje(newP)
    setShowNewDialog(false)
    setNewForm({ animalId: "", fecha: new Date().toISOString().split("T")[0], peso: "", suplementacion: "" })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando datos...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Alertas de pesaje */}
      {(() => {
        const { estancados, perdaPeso } = getAnimalesConProblemas(animales, pesajes)
        if (estancados.length === 0 && perdaPeso.length === 0) return null
        return (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Alertas de Desempeño</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {perdaPeso.length > 0 && (
                  <div className="flex items-center gap-1 text-red-700">
                    <TrendingDown className="h-4 w-4" />
                    <span>{perdaPeso.length} animal(es) con pérdida de peso</span>
                  </div>
                )}
                {estancados.length > 0 && (
                  <div className="flex items-center gap-1 text-orange-700">
                    <Minus className="h-4 w-4" />
                    <span>{estancados.length} animal(es) estancados (sin ganancia &gt;30 días)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Pesajes y Desempeño</h3>
          <p className="text-sm text-muted-foreground">Control de ganancia de peso por animal</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterLote} onValueChange={setFilterLote}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Lote" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {lotes.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Registrar Pesaje
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nuevo Pesaje</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Animal *</Label>
                  <Select value={newForm.animalId} onValueChange={(v) => setNewForm({ ...newForm, animalId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar animal" /></SelectTrigger>
                    <SelectContent>
                      {animalesActivos.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.id} - {a.apodo || a.raza} ({a.lote})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Fecha *</Label>
                  <Input type="date" value={newForm.fecha} onChange={(e) => setNewForm({ ...newForm, fecha: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Peso (kg) *</Label>
                  <Input type="number" value={newForm.peso} onChange={(e) => setNewForm({ ...newForm, peso: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Suplementación</Label>
                  <Input value={newForm.suplementacion} onChange={(e) => setNewForm({ ...newForm, suplementacion: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
                <Button onClick={handleNewPesaje}>Registrar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GDP Promedio por Lote</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gdpPorLoteData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 88%)" />
                  <XAxis dataKey="lote" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kg/d`, "GDP"]} />
                  <Bar dataKey="gdp" fill="hsl(142, 40%, 32%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">GDP Promedio por Raza</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={gdpPorRazaData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 88%)" />
                  <XAxis dataKey="raza" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)} kg/d`, "GDP"]} />
                  <Bar dataKey="gdp" fill="hsl(35, 55%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por Animal</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-right">Peso Ing.</TableHead>
                  <TableHead className="text-right">Peso Actual</TableHead>
                  <TableHead className="text-right">Kg Ganados</TableHead>
                  <TableHead className="text-right">GDP (kg/d)</TableHead>
                  <TableHead className="text-center">Tendencia</TableHead>
                  <TableHead className="text-right">Pesajes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {animalData.map(({ animal, gdp, ultimoPeso, kgGanados, trend, numPesajes }) => (
                  <TableRow key={animal.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{animal.apodo || animal.id}</p>
                        <p className="text-xs text-muted-foreground">{animal.id} · {animal.raza}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{animal.lote}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{animal.pesoIngreso}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{ultimoPeso}</TableCell>
                    <TableCell className="text-right font-mono text-primary">+{kgGanados}</TableCell>
                    <TableCell className="text-right font-mono">
                      {gdp !== null ? formatNumber(gdp, 2) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {trend === "up" && <TrendingUp className="mx-auto h-4 w-4 text-emerald-600" />}
                      {trend === "down" && (
                        <div className="flex items-center justify-center gap-1">
                          <TrendingDown className="h-4 w-4 text-destructive" />
                          <AlertTriangle className="h-3 w-3 text-warning" />
                        </div>
                      )}
                      {trend === "stalled" && <Minus className="mx-auto h-4 w-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="text-right">{numPesajes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
