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
import { DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, BarChart3, ChevronsUpDown } from "lucide-react"
import {
  type Venta,
  type Animal,
  type Pesaje,
  type EventoSanitario,
  type Racion,
  type Insumo,
  formatCurrency,
  formatNumber,
  getUltimoPeso,
  calcGDP,
  getStatusColor,
  hasActiveRetiro,
  getCostaRicaNow,
  formatCRDateOnly,
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
import { useDataStore } from "@/hooks/use-data-store"
import { getAnimalDisplayLabel, getAnimalSecondaryLabel } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"

export function UtilidadModule() {
  const { animales, ventas, pesajes, eventos, raciones, insumos, loading, createVenta } = useDataStore()
  const [showNewVenta, setShowNewVenta] = useState(false)
  const today = formatCRDateOnly(getCostaRicaNow())
  const animalesActivos = animales.filter((a) => a.estado === "activo")
  const animalesVendidos = animales.filter((a) => a.estado === "vendido")
  const [filtroGraficoModo, setFiltroGraficoModo] = useState<"animal" | "lote">("animal")
  const [filtroGraficoId, setFiltroGraficoId] = useState<string>("")
  const [newVenta, setNewVenta] = useState({
    animalId: "",
    fechaVenta: today,
    canalVenta: "",
    pesoVenta: "",
    precioPorKg: "",
    costosSalida: "0",
    merma: "0",
    tipoSalida: "venta" as "venta" | "muerte",
    causa: "",
  })
  const [ventaFilters, setVentaFilters] = useState({
    animal: "",
    canal: "",
    lote: "",
    peso: "",
    ingreso: "",
    costo: "",
    margen: "",
    costoKg: "",
    costoDia: "",
  })

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
        lote: animal.lote,
      }
    }).filter(Boolean) as any[]
  }, [ventas, animales, eventos])

  // Aggregates por lote
  const loteData = useMemo(() => {
    const lotes = Array.from(new Set(ventaCalcs.map((vc) => vc.animal.lote)))
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

  const lotesVendidos = useMemo(() => Array.from(new Set(ventaCalcs.map((vc) => vc.animal.lote))), [ventaCalcs])
  const animalesUnicosVendidos = useMemo(
    () => {
      const seen = new Set<string>()
      const list: { id: string; label: string }[] = []
      for (const vc of ventaCalcs) {
        if (!seen.has(vc.animal.id)) {
          seen.add(vc.animal.id)
          list.push({ id: vc.animal.id, label: getAnimalDisplayLabel(vc.animal) })
        }
      }
      return list
    },
    [ventaCalcs]
  )

  const selectedGraficoId = useMemo(() => {
    if (filtroGraficoModo === "lote") {
      const isValid = filtroGraficoId && lotesVendidos.includes(filtroGraficoId)
      return isValid ? filtroGraficoId : lotesVendidos[0] ?? ""
    }
    const isValid = filtroGraficoId && animalesUnicosVendidos.some((a) => a.id === filtroGraficoId)
    return isValid ? filtroGraficoId : animalesUnicosVendidos[0]?.id ?? ""
  }, [filtroGraficoId, filtroGraficoModo, lotesVendidos, animalesUnicosVendidos])

  const graphCalcs = useMemo(() => {
    if (!selectedGraficoId) return []
    if (filtroGraficoModo === "lote") {
      return ventaCalcs.filter((vc) => vc.animal.lote === selectedGraficoId)
    }
    return ventaCalcs.filter((vc) => vc.animal.id === selectedGraficoId)
  }, [selectedGraficoId, filtroGraficoModo, ventaCalcs])

  const graphSummary = useMemo(() => {
    if (graphCalcs.length === 0) return null
    const sum = graphCalcs.reduce(
      (acc, item) => {
        acc.costoCompra += item.costoCompra
        acc.costoAlimentacion += item.costoAlimentacion
        acc.costoSanidad += item.costoSanidad
        acc.costosSalida += item.venta.costosSalida
        acc.costoTotal += item.costoTotal
        acc.ingresoNeto += item.ingresoNeto
        acc.kgProducidos += item.kgProducidos
        acc.pesoVenta += item.venta.pesoVenta
        acc.diasEnFinca += item.diasEnFinca
        return acc
      },
      {
        costoCompra: 0,
        costoAlimentacion: 0,
        costoSanidad: 0,
        costosSalida: 0,
        costoTotal: 0,
        ingresoNeto: 0,
        kgProducidos: 0,
        pesoVenta: 0,
        diasEnFinca: 0,
      }
    )

    const costoPorKgProducido = sum.kgProducidos > 0 ? sum.costoTotal / sum.kgProducidos : 0
    const costoPorDia = sum.diasEnFinca > 0 ? sum.costoTotal / sum.diasEnFinca : 0
    const precioEquilibrio = sum.pesoVenta > 0 ? sum.costoTotal / sum.pesoVenta : 0

    return {
      costoCompra: sum.costoCompra,
      costoAlimentacion: sum.costoAlimentacion,
      costoSanidad: sum.costoSanidad,
      costosSalida: sum.costosSalida,
      costoPorKgProducido,
      costoPorDia,
      precioEquilibrio,
      kgProducidos: sum.kgProducidos,
    }
  }, [graphCalcs])

  const filteredVentaCalcs = useMemo(() => {
    return ventaCalcs.filter((vc) => {
      const match = (value: string | undefined, filter: string) =>
        !filter || (value ?? "").toLowerCase().includes(filter.toLowerCase())
      const animalName = getAnimalDisplayLabel(vc.animal)
      const ingreso = formatCurrency(vc.ingresoNeto)
      const costo = formatCurrency(vc.costoTotal)
      const utilidad = formatCurrency(vc.utilidadNeta)
      const margen = `${formatNumber(vc.margen, 1)}%`
      const costoKg = formatCurrency(vc.costoPorKgProducido)
      const costoDia = formatCurrency(vc.costoPorDia)
      return (
        match(animalName, ventaFilters.animal) &&
        match(vc.venta.canalVenta, ventaFilters.canal) &&
        match(vc.animal.lote, ventaFilters.lote) &&
        (!ventaFilters.peso || `${vc.venta.pesoVenta}`.includes(ventaFilters.peso)) &&
        (!ventaFilters.ingreso || ingreso.toLowerCase().includes(ventaFilters.ingreso.toLowerCase())) &&
        (!ventaFilters.costo || costo.toLowerCase().includes(ventaFilters.costo.toLowerCase())) &&
        (!ventaFilters.margen || margen.toLowerCase().includes(ventaFilters.margen.toLowerCase())) &&
        (!ventaFilters.costoKg || costoKg.toLowerCase().includes(ventaFilters.costoKg.toLowerCase())) &&
        (!ventaFilters.costoDia || costoDia.toLowerCase().includes(ventaFilters.costoDia.toLowerCase()))
      )
    })
  }, [ventaCalcs, ventaFilters])

  const handleNewVenta = async () => {
    const esMuerte = newVenta.tipoSalida === "muerte"

    if (!newVenta.animalId || !newVenta.fechaVenta) {
      alert("Complete los campos obligatorios: animal y fecha.")
      return
    }
    if (!esMuerte && (!newVenta.pesoVenta || !newVenta.precioPorKg)) {
      alert("Complete peso y precio/kg para registrar una venta.")
      return
    }
    if (hasActiveRetiro(eventos, newVenta.animalId)) {
      alert("Este animal tiene un retiro sanitario activo. No se puede registrar la salida.")
      return
    }

    const v = {
      animalId: newVenta.animalId,
      fechaVenta: newVenta.fechaVenta,
      canalVenta: esMuerte ? (newVenta.causa ? `muerte - ${newVenta.causa}` : "muerte") : newVenta.canalVenta,
      pesoVenta: esMuerte ? 0 : Number.parseFloat(newVenta.pesoVenta),
      precioPorKg: esMuerte ? 0 : Number.parseFloat(newVenta.precioPorKg),
      costosSalida: esMuerte ? 0 : Number.parseFloat(newVenta.costosSalida) || 0,
      merma: esMuerte ? 0 : Number.parseFloat(newVenta.merma) || 0,
    }
    try {
      await createVenta(v)
      setShowNewVenta(false)
      setNewVenta({
        animalId: "",
        fechaVenta: today,
        canalVenta: "",
        pesoVenta: "",
        precioPorKg: "",
        costosSalida: "0",
        merma: "0",
        tipoSalida: "venta",
        causa: "",
      })
    } catch (error) {
      console.error(error)
      alert("No se pudo registrar la venta.")
    }
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
              Registrar salida
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar salida</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Animal *</Label>
                <Select value={newVenta.animalId} onValueChange={(v) => setNewVenta({ ...newVenta, animalId: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>
                    {animalesActivos.map((a) => {
                      const retiro = hasActiveRetiro(eventos, a.id)
                      return (
                        <SelectItem key={a.id} value={a.id} disabled={retiro}>
                          {getAnimalDisplayLabel(a)} {retiro ? "(Retiro activo)" : ""}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Fecha *</Label>
                  <Input type="date" value={newVenta.fechaVenta} onChange={(e) => setNewVenta({ ...newVenta, fechaVenta: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Tipo de salida *</Label>
                  <Select
                    value={newVenta.tipoSalida}
                    onValueChange={(value: "venta" | "muerte") => setNewVenta({ ...newVenta, tipoSalida: value })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venta">Venta</SelectItem>
                      <SelectItem value="muerte">Muerte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {newVenta.tipoSalida === "venta" ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Canal de Venta</Label>
                    <Input value={newVenta.canalVenta} onChange={(e) => setNewVenta({ ...newVenta, canalVenta: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Peso Venta (kg) *</Label>
                    <Input type="number" value={newVenta.pesoVenta} onChange={(e) => setNewVenta({ ...newVenta, pesoVenta: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Precio por kg *</Label>
                    <Input type="number" value={newVenta.precioPorKg} onChange={(e) => setNewVenta({ ...newVenta, precioPorKg: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Costos de Salida</Label>
                    <Input type="number" value={newVenta.costosSalida} onChange={(e) => setNewVenta({ ...newVenta, costosSalida: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Merma (%)</Label>
                    <Input type="number" value={newVenta.merma} onChange={(e) => setNewVenta({ ...newVenta, merma: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 sm:col-span-2">
                    <Label>Causa</Label>
                    <Input value={newVenta.causa} onChange={(e) => setNewVenta({ ...newVenta, causa: e.target.value })} placeholder="Enfermedad, accidente, etc." />
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewVenta(false)}>Cancelar</Button>
              <Button onClick={handleNewVenta}>Registrar salida</Button>
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

      {/* Filtros tabla */}
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="w-full sm:w-1/4">
          <Label>Lote</Label>
          <Input
            value={ventaFilters.lote}
            onChange={(e) => setVentaFilters((f) => ({ ...f, lote: e.target.value }))}
            placeholder="Filtrar por lote"
          />
        </div>
        <div className="w-full sm:w-1/4">
          <Label>Animal</Label>
          <Input
            value={ventaFilters.animal}
            onChange={(e) => setVentaFilters((f) => ({ ...f, animal: e.target.value }))}
            placeholder="ID, apodo, etc."
          />
        </div>
        <div className="w-full sm:w-1/4">
          <Label>Canal</Label>
          <Input
            value={ventaFilters.canal}
            onChange={(e) => setVentaFilters((f) => ({ ...f, canal: e.target.value }))}
            placeholder="Canal o causa"
          />
        </div>
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
                  <TableHead>Canal / Causa</TableHead>
                  <TableHead>Lote</TableHead>
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
                {filteredVentaCalcs.map((vc) => {
                  const label = getAnimalDisplayLabel(vc.animal)
                  const secondary = `${getAnimalSecondaryLabel(vc.animal)} · ${vc.diasEnFinca}d`
                  return (
                    <TableRow key={vc.venta.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          <p className="text-xs text-muted-foreground">{secondary}</p>
                        </div>
                      </TableCell>
                    <TableCell className="text-sm">{vc.venta.canalVenta}</TableCell>
                    <TableCell className="text-sm">{vc.animal.lote}</TableCell>
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
                  )
                })}
                {filteredVentaCalcs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">
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
      {graphCalcs.length > 0 && graphSummary && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Desglose de Costos</CardTitle>
              <div className="w-full sm:w-64">
                <Label className="text-xs text-muted-foreground">Modo</Label>
                <div className="mb-2 flex gap-2">
                  <Button variant={filtroGraficoModo === "animal" ? "default" : "outline"} size="sm" onClick={() => setFiltroGraficoModo("animal")}>
                    Animal
                  </Button>
                  <Button variant={filtroGraficoModo === "lote" ? "default" : "outline"} size="sm" onClick={() => setFiltroGraficoModo("lote")}>
                    Lote
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Selecciona</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {selectedGraficoId
                          ? filtroGraficoModo === "lote"
                            ? `Lote ${selectedGraficoId}`
                            : (animalesUnicosVendidos.find((a) => a.id === selectedGraficoId)?.label ?? "")
                          : "Buscar..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <Command>
                        <CommandInput placeholder={filtroGraficoModo === "animal" ? "Buscar animal" : "Buscar lote"} />
                        <CommandList>
                          <CommandEmpty>No hay resultados</CommandEmpty>
                          <CommandGroup>
                            {filtroGraficoModo === "lote"
                              ? lotesVendidos.map((lote) => (
                                  <CommandItem key={`lote-${lote}`} value={lote} onSelect={(v) => setFiltroGraficoId(v)}>
                                    Lote {lote}
                                  </CommandItem>
                                ))
                              : animalesUnicosVendidos.map((a) => (
                                  <CommandItem key={a.id} value={a.id} onSelect={(v) => setFiltroGraficoId(v)}>
                                    {a.label}
                                  </CommandItem>
                                ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { nombre: "Compra", valor: graphSummary.costoCompra },
                    { nombre: "Alimentación", valor: graphSummary.costoAlimentacion },
                    { nombre: "Sanidad", valor: graphSummary.costoSanidad },
                    { nombre: "Salida", valor: graphSummary.costosSalida },
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
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-muted-foreground">Precio equilibrio</p>
                  <p className="font-mono font-bold text-foreground">{formatCurrency(graphSummary.precioEquilibrio)}/kg</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Costo/kg producido</p>
                  <p className="font-mono font-bold text-foreground">{formatCurrency(graphSummary.costoPorKgProducido)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Costo/día</p>
                  <p className="font-mono font-bold text-foreground">{formatCurrency(graphSummary.costoPorDia)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kg producidos</p>
                  <p className="font-mono font-bold text-foreground">{graphSummary.kgProducidos} kg</p>
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
