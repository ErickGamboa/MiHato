"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
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
import { Plus, AlertTriangle, Package, Wheat } from "lucide-react"
import {
  type Animal,
  type Insumo,
  type Racion,
  getAnimales,
  getInsumos,
  getRaciones,
  formatCurrency,
  formatNumber,
  insertInsumo,
} from "@/lib/data"

export function SuplementacionModule() {
  const [animales, setAnimales] = useState<Animal[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [raciones, setRaciones] = useState<Racion[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewInsumo, setShowNewInsumo] = useState(false)
  const [newInsumo, setNewInsumo] = useState({
    nombre: "", precio: "", presentacion: "", costoPorKg: "", stock: "", unidad: "kg",
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [a, i, r] = await Promise.all([getAnimales(), getInsumos(), getRaciones()])
        setAnimales(a)
        setInsumos(i)
        setRaciones(r)
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const animalesActivos = animales.filter((a) => a.estado === "activo")

  // Calculate ration costs
  const racionesCalc = raciones.map((racion) => {
    const animalesLote = animalesActivos.filter((a) => a.lote === racion.lote)
    const numAnimales = animalesLote.length

    let costoDiaPorAnimal = 0
    const detalleInsumos = racion.insumos.map((ri) => {
      const insumo = insumos.find((i) => i.id === ri.insumoId)
      const costoDia = insumo ? insumo.costoPorKg * ri.kgPorAnimalDia : 0
      costoDiaPorAnimal += costoDia
      return {
        ...ri,
        insumo,
        costoDia,
      }
    })

    const costoDiarioTotal = costoDiaPorAnimal * numAnimales
    const costoMensualTotal = costoDiarioTotal * 30

    // Consumo semanal estimado
    const consumoSemanal = racion.insumos.map((ri) => {
      const insumo = insumos.find((i) => i.id === ri.insumoId)
      const consumo = ri.kgPorAnimalDia * numAnimales * 7
      return { insumo, consumo }
    })

    return {
      racion,
      numAnimales,
      costoDiaPorAnimal,
      costoDiarioTotal,
      costoMensualTotal,
      detalleInsumos,
      consumoSemanal,
    }
  })

  // Low stock alerts
  const lowStockInsumos = insumos.filter((i) => {
    // Estimate weekly consumption across all raciones
    let weeklyUse = 0
    for (const rac of raciones) {
      const animalesLote = animalesActivos.filter((a) => a.lote === rac.lote)
      const ri = rac.insumos.find((r) => r.insumoId === i.id)
      if (ri) {
        weeklyUse += ri.kgPorAnimalDia * animalesLote.length * 7
      }
    }
    return i.stock < weeklyUse * 2 // Less than 2 weeks supply
  })

  const handleCreateInsumo = async () => {
    if (!newInsumo.nombre || !newInsumo.precio || !newInsumo.costoPorKg || !newInsumo.stock) {
      alert("Complete los campos obligatorios.")
      return
    }
    const ins: Insumo = {
      id: `INS-${String(insumos.length + 1).padStart(3, "0")}`,
      nombre: newInsumo.nombre,
      precio: Number.parseFloat(newInsumo.precio),
      presentacion: newInsumo.presentacion,
      costoPorKg: Number.parseFloat(newInsumo.costoPorKg),
      stock: Number.parseFloat(newInsumo.stock),
      unidad: newInsumo.unidad,
    }
    try {
      await insertInsumo(ins)
      setInsumos([...insumos, ins])
      setShowNewInsumo(false)
    } catch (err) {
      console.error("Error inserting insumo:", err)
      alert("Error al registrar insumo")
    }
    setNewInsumo({ nombre: "", precio: "", presentacion: "", costoPorKg: "", stock: "", unidad: "kg" })
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando datos...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground">Suplementación e Insumos</h3>
        <p className="text-sm text-muted-foreground">Gestión de raciones, insumos e inventario</p>
      </div>

      <Tabs defaultValue="raciones" className="w-full">
        <TabsList>
          <TabsTrigger value="raciones">Raciones</TabsTrigger>
          <TabsTrigger value="insumos">Catálogo de Insumos</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
        </TabsList>

        {/* RACIONES */}
        <TabsContent value="raciones" className="mt-4">
          <div className="flex flex-col gap-4">
            {racionesCalc.map(({ racion, numAnimales, costoDiaPorAnimal, costoDiarioTotal, costoMensualTotal, detalleInsumos, consumoSemanal }) => (
              <Card key={racion.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Wheat className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{racion.nombre}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Lote {racion.lote} &middot; {numAnimales} animales &middot; Desde {racion.fechaInicio}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Insumos de la ración */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead className="text-right">kg/animal/día</TableHead>
                        <TableHead className="text-right">Costo/kg</TableHead>
                        <TableHead className="text-right">Costo/día/animal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalleInsumos.map((di) => (
                        <TableRow key={di.insumoId}>
                          <TableCell className="font-medium">{di.insumo?.nombre || di.insumoId}</TableCell>
                          <TableCell className="text-right font-mono">{di.kgPorAnimalDia}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(di.insumo?.costoPorKg || 0)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(di.costoDia)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Summary */}
                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg bg-muted p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Costo / animal / día</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(costoDiaPorAnimal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Costo diario total</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(costoDiarioTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Costo mensual total</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(costoMensualTotal)}</p>
                    </div>
                  </div>

                  {/* Weekly consumption estimates */}
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-foreground">Consumo semanal estimado</p>
                    <div className="flex flex-col gap-2">
                      {consumoSemanal.map(({ insumo, consumo }) => (
                        <div key={insumo?.id} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{insumo?.nombre}</span>
                          <span className="font-mono text-foreground">
                            {formatNumber(consumo, 0)} {insumo?.unidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* INSUMOS CATALOG */}
        <TabsContent value="insumos" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-end">
              <Dialog open={showNewInsumo} onOpenChange={setShowNewInsumo}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nuevo Insumo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Registrar Insumo</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label>Nombre *</Label>
                      <Input value={newInsumo.nombre} onChange={(e) => setNewInsumo({ ...newInsumo, nombre: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label>Precio *</Label>
                        <Input type="number" value={newInsumo.precio} onChange={(e) => setNewInsumo({ ...newInsumo, precio: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Presentación</Label>
                        <Input value={newInsumo.presentacion} onChange={(e) => setNewInsumo({ ...newInsumo, presentacion: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label>Costo/kg *</Label>
                        <Input type="number" value={newInsumo.costoPorKg} onChange={(e) => setNewInsumo({ ...newInsumo, costoPorKg: e.target.value })} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Stock *</Label>
                        <Input type="number" value={newInsumo.stock} onChange={(e) => setNewInsumo({ ...newInsumo, stock: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setShowNewInsumo(false)}>Cancelar</Button>
                    <Button onClick={handleCreateInsumo}>Registrar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Presentación</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Costo/kg</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {insumos.map((ins) => (
                        <TableRow key={ins.id}>
                          <TableCell className="font-medium">{ins.nombre}</TableCell>
                          <TableCell className="text-muted-foreground">{ins.presentacion}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(ins.precio)}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(ins.costoPorKg)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(ins.stock, 0)} {ins.unidad}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* INVENTARIO */}
        <TabsContent value="inventario" className="mt-4">
          <div className="flex flex-col gap-4">
            {lowStockInsumos.length > 0 && (
              <Card className="border-warning/40 bg-warning/5">
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Alertas de Stock Bajo</p>
                    <div className="mt-1 flex flex-col gap-1">
                      {lowStockInsumos.map((ins) => (
                        <p key={ins.id} className="text-sm text-muted-foreground">
                          {ins.nombre}: {formatNumber(ins.stock, 0)} {ins.unidad} restantes
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {insumos.map((ins) => {
                // Calc weekly use
                let weeklyUse = 0
                for (const rac of raciones) {
                  const animalesLote = animalesActivos.filter((a) => a.lote === rac.lote)
                  const ri = rac.insumos.find((r) => r.insumoId === ins.id)
                  if (ri) weeklyUse += ri.kgPorAnimalDia * animalesLote.length * 7
                }
                const weeksRemaining = weeklyUse > 0 ? ins.stock / weeklyUse : Infinity
                const stockPct = Math.min(100, (weeksRemaining / 8) * 100) // 8 weeks = 100%

                return (
                  <Card key={ins.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{ins.nombre}</p>
                            <p className="text-xs text-muted-foreground">{ins.presentacion}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Stock actual</span>
                          <span className="font-mono font-medium text-foreground">
                            {formatNumber(ins.stock, 0)} {ins.unidad}
                          </span>
                        </div>
                        <Progress value={stockPct} className="mt-2 h-2" />
                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Consumo semanal: {formatNumber(weeklyUse, 0)} {ins.unidad}</span>
                          <span>
                            {weeksRemaining === Infinity
                              ? "Sin uso"
                              : `${formatNumber(weeksRemaining, 1)} sem.`}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
