"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { Plus, TrendingUp, Target, Calculator } from "lucide-react"
import { type Escenario, getEscenarios, formatCurrency, formatNumber, insertEscenario } from "@/lib/data"

export function ProyeccionesModule() {
  const [escenarios, setEscenarios] = useState<Escenario[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [newEsc, setNewEsc] = useState({
    nombre: "", pesoInicial: "", pesoObjetivo: "", gdpEsperado: "", costoDiario: "", precioVentaEsperado: "",
  })

  useEffect(() => {
    async function loadData() {
      try {
        const e = await getEscenarios()
        setEscenarios(e)
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const calcs = useMemo(() => {
    return escenarios.map((esc) => {
      const kgNecesarios = esc.pesoObjetivo - esc.pesoInicial
      const diasAObjetivo = Math.ceil(kgNecesarios / esc.gdpEsperado)
      const costoTotal = diasAObjetivo * esc.costoDiario
      const ingresoVenta = esc.pesoObjetivo * esc.precioVentaEsperado
      const utilidadEsperada = ingresoVenta - costoTotal - esc.pesoInicial * 1200
      const roi = ((utilidadEsperada / (costoTotal + esc.pesoInicial * 1200)) * 100)

      return {
        ...esc,
        kgNecesarios,
        diasAObjetivo,
        costoTotal,
        ingresoVenta,
        utilidadEsperada,
        roi,
      }
    })
  }, [escenarios])

  // Sensitivity matrix for first scenario
  const sensitivityData = useMemo(() => {
    if (escenarios.length === 0) return []
    const base = escenarios[0]
    const gdpValues = [0.6, 0.8, 1.0, 1.2, 1.4]
    const costValues = [50, 65, 80, 95, 110]

    return gdpValues.map((gdp) => {
      const row: Record<string, number | string> = { gdp: `${gdp} kg/d` }
      for (const costo of costValues) {
        const kgNec = base.pesoObjetivo - base.pesoInicial
        const dias = Math.ceil(kgNec / gdp)
        const costoTotal = dias * costo
        const ingreso = base.pesoObjetivo * base.precioVentaEsperado
        const utilidad = ingreso - costoTotal - base.pesoInicial * 1200
        row[`$${costo}`] = utilidad
      }
      return row
    })
  }, [escenarios])

  const handleCreate = () => {
    if (!newEsc.nombre || !newEsc.pesoInicial || !newEsc.pesoObjetivo || !newEsc.gdpEsperado || !newEsc.costoDiario || !newEsc.precioVentaEsperado) {
      alert("Complete todos los campos.")
      return
    }
    const esc: Escenario = {
      id: `ESC-${String(escenarios.length + 1).padStart(3, "0")}`,
      nombre: newEsc.nombre,
      pesoInicial: Number.parseFloat(newEsc.pesoInicial),
      pesoObjetivo: Number.parseFloat(newEsc.pesoObjetivo),
      gdpEsperado: Number.parseFloat(newEsc.gdpEsperado),
      costoDiario: Number.parseFloat(newEsc.costoDiario),
      precioVentaEsperado: Number.parseFloat(newEsc.precioVentaEsperado),
    }
    setEscenarios([...escenarios, esc])
    setShowNew(false)
    setNewEsc({ nombre: "", pesoInicial: "", pesoObjetivo: "", gdpEsperado: "", costoDiario: "", precioVentaEsperado: "" })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando datos...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Proyecciones y Escenarios</h3>
          <p className="text-sm text-muted-foreground">Modele escenarios de engorde y compare utilidades estimadas</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Escenario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Escenario</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Nombre *</Label>
                <Input value={newEsc.nombre} onChange={(e) => setNewEsc({ ...newEsc, nombre: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Peso Inicial (kg) *</Label>
                  <Input type="number" value={newEsc.pesoInicial} onChange={(e) => setNewEsc({ ...newEsc, pesoInicial: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Peso Objetivo (kg) *</Label>
                  <Input type="number" value={newEsc.pesoObjetivo} onChange={(e) => setNewEsc({ ...newEsc, pesoObjetivo: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>GDP esperado *</Label>
                  <Input type="number" step="0.1" value={newEsc.gdpEsperado} onChange={(e) => setNewEsc({ ...newEsc, gdpEsperado: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Costo diario *</Label>
                  <Input type="number" value={newEsc.costoDiario} onChange={(e) => setNewEsc({ ...newEsc, costoDiario: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Precio venta/kg *</Label>
                  <Input type="number" value={newEsc.precioVentaEsperado} onChange={(e) => setNewEsc({ ...newEsc, precioVentaEsperado: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Crear</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {calcs.map((esc) => (
          <Card key={esc.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{esc.nombre}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {esc.pesoInicial} kg - {esc.pesoObjetivo} kg &middot; GDP: {esc.gdpEsperado} kg/d
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Días a objetivo</p>
                  <p className="text-xl font-bold text-foreground">{esc.diasAObjetivo}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Kg necesarios</p>
                  <p className="text-xl font-bold text-foreground">{esc.kgNecesarios}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Costo total engorde</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(esc.costoTotal)}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Ingreso venta est.</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(esc.ingresoVenta)}</p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-xs text-muted-foreground">Utilidad esperada</p>
                  <p className={`text-xl font-bold ${esc.utilidadEsperada >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatCurrency(esc.utilidadEsperada)}
                  </p>
                </div>
                <div className="rounded-lg bg-primary/10 p-3">
                  <p className="text-xs text-muted-foreground">ROI</p>
                  <p className={`text-xl font-bold ${esc.roi >= 0 ? "text-primary" : "text-destructive"}`}>
                    {formatNumber(esc.roi, 1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sensitivity Matrix */}
      {sensitivityData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calculator className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle className="text-base">Matriz de Sensibilidad</CardTitle>
                <p className="text-xs text-muted-foreground">GDP vs Costo diario - Utilidad neta estimada ({escenarios[0]?.nombre})</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-medium">GDP / Costo día</TableHead>
                    <TableHead className="text-right">$50</TableHead>
                    <TableHead className="text-right">$65</TableHead>
                    <TableHead className="text-right">$80</TableHead>
                    <TableHead className="text-right">$95</TableHead>
                    <TableHead className="text-right">$110</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sensitivityData.map((row) => (
                    <TableRow key={row.gdp as string}>
                      <TableCell className="font-medium">{row.gdp as string}</TableCell>
                      {["$50", "$65", "$80", "$95", "$110"].map((key) => {
                        const val = row[key] as number
                        return (
                          <TableCell key={key} className="text-right">
                            <span className={`font-mono text-sm ${val >= 0 ? "text-primary" : "text-destructive"}`}>
                              {formatCurrency(val)}
                            </span>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
