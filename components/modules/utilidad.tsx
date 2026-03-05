"use client"

import { useState, useMemo, useEffect } from "react"
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
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, BarChart3 } from "lucide-react"
import {
  type Venta,
  type Animal,
  type Pesaje,
  type EventoSanitario,
  type Racion,
  type Insumo,
  getAnimales,
  getVentas,
  getPesajes,
  getEventosSanitarios,
  getRaciones,
  getInsumos,
  formatCurrency,
  formatNumber,
  getUltimoPeso,
  calcGDP,
  getStatusColor,
  insertVenta,
} from "@/lib/data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export function UtilidadModule() {
  const [animales, setAnimales] = useState<Animal[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [pesajes, setPesajes] = useState<Pesaje[]>([])
  const [eventos, setEventos] = useState<EventoSanitario[]>([])
  const [raciones, setRaciones] = useState<Racion[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewVenta, setShowNewVenta] = useState(false)
  const [newVenta, setNewVenta] = useState({
    animalId: "", fechaVenta: new Date().toISOString().split("T")[0], canalVenta: "",
    pesoVenta: "", precioPorKg: "", costosSalida: "0", merma: "0",
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [a, v, p, e, r, i] = await Promise.all([
          getAnimales(), getVentas(), getPesajes(), getEventosSanitarios(), getRaciones(), getInsumos()
        ])
        setAnimales(a)
        setVentas(v)
        setPesajes(p)
        setEventos(e)
        setRaciones(r)
        setInsumos(i)
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const animalesVendidos = animales.filter((a) => a.estado === "vendido")
  const animalesActivos = animales.filter((a) => a.estado === "activo")

  // Check retiro activo
  const hasRetiroActivo = (animalId: string) => {
    return eventos.some(
      (ev) =>
        ev.animalId === animalId &&
        ev.fechaFinRetiro &&
        new Date(ev.fechaFinRetiro) > new Date()
    )
  }

  // Calculate profitability per sold animal
  const ventaCalcs = useMemo(() => {
    return ventas.map((venta) => {
      const animal = animales.find((a: Animal) => a.id === venta.animalId)
      if (!animal) return null

      const ingresoBruto = venta.pesoVenta * venta.precioPorKg
      const ingresoNeto = ingresoBruto * (1 - venta.merma / 100)

      // Costo compra
      const costoCompra = animal.precioTotal

      // Costo alimentación estimado (simplified)
      const diasEnFinca = Math.round(
        (new Date(venta.fechaVenta).getTime() - new Date(animal.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24)
      )
      const costoAlimentacionDiario = 2000 // CRC estimado
      const costoAlimentacion = diasEnFinca * costoAlimentacionDiario

      // Costo sanidad estimado
      const eventosSanidad = eventos.filter(
        (ev: EventoSanitario) => ev.animalId === animal.id || ev.lote === animal.lote
      )
      const costoSanidad = eventosSanidad.length * 8000

      const costoTotal = costoCompra + costoAlimentacion + costoSanidad + venta.costosSalida
      const utilidadNeta = ingresoNeto - costoTotal
      const margen = costoTotal > 0 ? (utilidadNeta / costoTotal) * 100 : 0
      const kgProducidos = venta.pesoVenta - animal.pesoIngreso
      const costoPorKgProducido = kgProducidos > 0 ? costoTotal / kgProducidos : 0
      const costoPorDia = diasEnFinca > 0 ? costoTotal / diasEnFinca : 0
      const precioEquilibrio = venta.pesoVenta > 0 ? costoTotal / venta.pesoVenta : 0

      return {
        venta,
        animal,
        ingresoBruto,
        ingresoNeto,
        costoCompra,
        costoAlimentacion,
        costoSanidad,
        costoTotal,
        utilidadNeta,
        margen,
        kgProducidos,
        costoPorKgProducido,
        costoPorDia,
        precioEquilibrio,
        diasEnFinca,
      }
    }).filter(Boolean) as any[]
  }, [ventas])

  // Aggregates por lote
  const loteData = useMemo(() => {
    const lotes = ["L-01", "L-02", "L-03"]
    return lotes.map((lote) => {
      const ventasLote = ventaCalcs.filter((vc) => vc.animal.lote === lote)
      const ingresos = ventasLote.reduce((s, v) => s + v.ingresoNeto, 0)
      const costos = ventasLote.reduce((s, v) => s + v.costoTotal, 0)
      const utilidad = ingresos - costos
      return { lote, ingresos, costos, utilidad, animales: ventasLote.length }
    })
  }, [ventaCalcs])

  // KPIs
  const totalIngresos = ventaCalcs.reduce((s, v) => s + v.ingresoNeto, 0)
  const totalCostos = ventaCalcs.reduce((s, v) => s + v.costoTotal, 0)
  const totalUtilidad = totalIngresos - totalCostos
  const margenPromedio = ventaCalcs.length > 0
    ? ventaCalcs.reduce((s, v) => s + v.margen, 0) / ventaCalcs.length
    : 0

  const handleNewVenta = async () => {
    if (!newVenta.animalId || !newVenta.fechaVenta || !newVenta.pesoVenta || !newVenta.precioPorKg) {
      alert("Complete los campos obligatorios: animal, fecha, peso y precio/kg.")
      return
    }
    if (hasRetiroActivo(newVenta.animalId)) {
      alert("Este animal tiene un retiro sanitario activo. No se puede registrar la venta.")
      return
    }

    const v: Venta = {
      id: `VTA-${String(ventas.length + 1).padStart(3, "0")}`,
      animalId: newVenta.animalId,
      fechaVenta: newVenta.fechaVenta,
      canalVenta: newVenta.canalVenta,
      pesoVenta: Number.parseFloat(newVenta.pesoVenta),
      precioPorKg: Number.parseFloat(newVenta.precioPorKg),
      costosSalida: Number.parseFloat(newVenta.costosSalida) || 0,
      merma: Number.parseFloat(newVenta.merma) || 0,
    }
    try {
      await insertVenta(v)
      setVentas([...ventas, v])
      setShowNewVenta(false)
    } catch (err) {
      console.error("Error inserting venta:", err)
      alert("Error al registrar venta")
    }
    setNewVenta({ animalId: "", fechaVenta: new Date().toISOString().split("T")[0], canalVenta: "", pesoVenta: "", precioPorKg: "", costosSalida: "0", merma: "0" })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando datos...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Utilidad y Rentabilidad</h3>
          <p className="text-sm text-muted-foreground">Consolidación de costos, ventas y márgenes</p>
        </div>
        <Dialog open={showNewVenta} onOpenChange={setShowNewVenta}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar Venta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Venta</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Animal *</Label>
                <Select value={newVenta.animalId} onValueChange={(v) => setNewVenta({ ...newVenta, animalId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {animalesActivos.map((a) => {
                      const retiro = hasRetiroActivo(a.id)
                      return (
                        <SelectItem key={a.id} value={a.id} disabled={retiro}>
                          {a.id} - {a.apodo || a.raza} {retiro ? "(Retiro activo)" : ""}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Fecha Venta *</Label>
                  <Input type="date" value={newVenta.fechaVenta} onChange={(e) => setNewVenta({ ...newVenta, fechaVenta: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Canal de Venta</Label>
                  <Input value={newVenta.canalVenta} onChange={(e) => setNewVenta({ ...newVenta, canalVenta: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Peso Venta (kg) *</Label>
                  <Input type="number" value={newVenta.pesoVenta} onChange={(e) => setNewVenta({ ...newVenta, pesoVenta: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Precio por kg *</Label>
                  <Input type="number" value={newVenta.precioPorKg} onChange={(e) => setNewVenta({ ...newVenta, precioPorKg: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Costos de Salida</Label>
                  <Input type="number" value={newVenta.costosSalida} onChange={(e) => setNewVenta({ ...newVenta, costosSalida: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Merma (%)</Label>
                  <Input type="number" value={newVenta.merma} onChange={(e) => setNewVenta({ ...newVenta, merma: e.target.value })} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewVenta(false)}>Cancelar</Button>
              <Button onClick={handleNewVenta}>Registrar Venta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ingresos Totales</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalIngresos)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10">
              <BarChart3 className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Costos Totales</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalCostos)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Utilidad Neta</p>
              <div className="flex items-center gap-1">
                <p className={`text-xl font-bold ${totalUtilidad >= 0 ? "text-primary" : "text-destructive"}`}>
                  {formatCurrency(totalUtilidad)}
                </p>
                {totalUtilidad >= 0 ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-destructive" />}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-chart-2/20">
              <DollarSign className="h-6 w-6 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Margen Promedio</p>
              <p className="text-xl font-bold text-foreground">{formatNumber(margenPromedio, 1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detalle por animal vendido */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por Animal Vendido</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Animal</TableHead>
                  <TableHead>Canal</TableHead>
                  <TableHead className="text-right">Peso Venta</TableHead>
                  <TableHead className="text-right">Ingreso</TableHead>
                  <TableHead className="text-right">Costo Total</TableHead>
                  <TableHead className="text-right">Utilidad</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="text-right">$/kg prod.</TableHead>
                  <TableHead className="text-right">$/día</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventaCalcs.map((vc) => (
                  <TableRow key={vc.venta.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{vc.animal.apodo || vc.animal.id}</p>
                        <p className="text-xs text-muted-foreground">{vc.animal.id} &middot; {vc.diasEnFinca}d</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{vc.venta.canalVenta}</TableCell>
                    <TableCell className="text-right font-mono">{vc.venta.pesoVenta} kg</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(vc.ingresoNeto)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(vc.costoTotal)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono font-medium ${vc.utilidadNeta >= 0 ? "text-primary" : "text-destructive"}`}>
                        {formatCurrency(vc.utilidadNeta)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">{formatNumber(vc.margen, 1)}%</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(vc.costoPorKgProducido)}</TableCell>
                    <TableCell className="text-right font-mono">{formatCurrency(vc.costoPorDia)}</TableCell>
                  </TableRow>
                ))}
                {ventaCalcs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                      No hay ventas registradas.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cost breakdown for sold animal */}
      {ventaCalcs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Desglose de Costos - {ventaCalcs[0].animal.apodo || ventaCalcs[0].animal.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { nombre: "Compra", valor: ventaCalcs[0].costoCompra },
                    { nombre: "Alimentación", valor: ventaCalcs[0].costoAlimentacion },
                    { nombre: "Sanidad", valor: ventaCalcs[0].costoSanidad },
                    { nombre: "Salida", valor: ventaCalcs[0].venta.costosSalida },
                  ]}
                  barSize={50}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 88%)" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), "Costo"]}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(35, 15%, 88%)" }}
                  />
                  <Bar dataKey="valor" fill="hsl(35, 55%, 55%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 rounded-lg bg-muted p-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Precio equilibrio</p>
                  <p className="font-mono font-bold text-foreground">{formatCurrency(ventaCalcs[0].precioEquilibrio)}/kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Costo/kg producido</p>
                  <p className="font-mono font-bold text-foreground">{formatCurrency(ventaCalcs[0].costoPorKgProducido)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Costo/día</p>
                  <p className="font-mono font-bold text-foreground">{formatCurrency(ventaCalcs[0].costoPorDia)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kg producidos</p>
                  <p className="font-mono font-bold text-foreground">{ventaCalcs[0].kgProducidos} kg</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Helper type
type calcVenta = {
  venta: Venta
  animal: Animal
  ingresoBruto: number
  ingresoNeto: number
  costoCompra: number
  costoAlimentacion: number
  costoSanidad: number
  costoTotal: number
  utilidadNeta: number
  margen: number
  kgProducidos: number
  costoPorKgProducido: number
  costoPorDia: number
  precioEquilibrio: number
  diasEnFinca: number
}
