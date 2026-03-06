"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Plus, AlertTriangle, Package, Wheat, Droplets, Edit3, Trash2 } from "lucide-react"
import {
  type Animal,
  type Insumo,
  type Racion,
  formatCurrency,
  formatNumber,
  getLotes,
  getCostaRicaNow,
  toCostaRicaDate,
  isAfterDate,
} from "@/lib/data"
import { useDataStore } from "@/hooks/use-data-store"

export function SuplementacionModule() {
  const {
    animales,
    insumos,
    raciones,
    loading,
    createInsumo,
    createRacion,
    adjustInsumoStock,
    updateRacion,
    toggleRacion,
    autoConsumeRaciones,
    deactivateExpiredRaciones,
    updateInsumo,
    deleteInsumo,
    deleteRacion,
  } = useDataStore()
  const [showInsumoModal, setShowInsumoModal] = useState(false)
  const [editingInsumoId, setEditingInsumoId] = useState<string | null>(null)
  const [insumoForm, setInsumoForm] = useState({
    nombre: "",
    precio: "",
    presentacion: "",
    costoPorKg: "",
    stock: "",
    unidad: "kg",
  })
  const [showNewRacion, setShowNewRacion] = useState(false)
  const [editingRacionId, setEditingRacionId] = useState<string | null>(null)
  const [racionForm, setRacionForm] = useState({
    nombre: "",
    lote: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: "",
    activa: true,
    insumos: [{ insumoId: "", kgPorAnimalDia: "" }],
  })
  const [consumoDialog, setConsumoDialog] = useState<{ racion: Racion | null; dias: string }>({
    racion: null,
    dias: "1",
  })
  const [racionToDelete, setRacionToDelete] = useState<Racion | null>(null)
  const [insumoToDelete, setInsumoToDelete] = useState<Insumo | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const animalesActivos = useMemo(() => animales.filter((a) => a.estado === "activo"), [animales])
  const lotes = useMemo(() => getLotes(animales), [animales])
  const nowCR = getCostaRicaNow()

  useEffect(() => {
    void (async () => {
      await autoConsumeRaciones()
      await deactivateExpiredRaciones()
    })()
    const interval = setInterval(() => {
      void autoConsumeRaciones()
      void deactivateExpiredRaciones()
    }, 1000 * 60 * 60)
    return () => clearInterval(interval)
  }, [autoConsumeRaciones, deactivateExpiredRaciones])

  const crDateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("es-CR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Costa_Rica",
      }),
    []
  )

  const formatCRDateTime = (iso?: string | null) => {
    if (!iso) return "—"
    return crDateTimeFormatter.format(new Date(iso))
  }

  const isRacionExpired = (fechaFin?: string) => {
    if (!fechaFin) return false
    return isAfterDate(nowCR, toCostaRicaDate(fechaFin))
  }

  const getRacionStatusLabel = (racion: Racion) => {
    if (isRacionExpired(racion.fechaFin)) return "Finalizada"
    if (racion.activa) return "Activa"
    if (racion.motivoDesactivacion === "stock") return "Pausada por stock"
    return "Pausada"
  }

  const getRacionStatusClass = (racion: Racion) => {
    if (isRacionExpired(racion.fechaFin)) return "bg-muted text-muted-foreground"
    if (racion.activa) return "bg-emerald-100 text-emerald-700"
    if (racion.motivoDesactivacion === "stock") return "bg-warning/20 text-warning"
    return "bg-muted text-muted-foreground"
  }

  // Calculate ration costs
  const racionesCalc = useMemo(() => {
    return raciones.map((racion) => {
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
  }, [raciones, animalesActivos, insumos])

  // Low stock alerts
  const lowStockInsumos = useMemo(() => {
    return insumos.filter((i) => {
      let weeklyUse = 0
      for (const rac of raciones) {
        const animalesLote = animalesActivos.filter((a) => a.lote === rac.lote)
        const ri = rac.insumos.find((r) => r.insumoId === i.id)
        if (ri) {
          weeklyUse += ri.kgPorAnimalDia * animalesLote.length * 7
        }
      }
      return i.stock < weeklyUse * 2
    })
  }, [insumos, raciones, animalesActivos])

  const resetInsumoForm = () => {
    setInsumoForm({ nombre: "", precio: "", presentacion: "", costoPorKg: "", stock: "", unidad: "kg" })
  }

  const openNewInsumo = () => {
    setEditingInsumoId(null)
    resetInsumoForm()
    setShowInsumoModal(true)
  }

  const openEditInsumo = (insumo: Insumo) => {
    setEditingInsumoId(insumo.id)
    setInsumoForm({
      nombre: insumo.nombre,
      precio: insumo.precio.toString(),
      presentacion: insumo.presentacion ?? "",
      costoPorKg: insumo.costoPorKg.toString(),
      stock: insumo.stock.toString(),
      unidad: insumo.unidad,
    })
    setShowInsumoModal(true)
  }

  const closeInsumoModal = () => {
    setShowInsumoModal(false)
    setEditingInsumoId(null)
    resetInsumoForm()
  }

  const handleSubmitInsumo = async () => {
    if (!insumoForm.nombre || !insumoForm.precio || !insumoForm.costoPorKg || !insumoForm.stock) {
      alert("Complete los campos obligatorios.")
      return
    }
    const payload = {
      nombre: insumoForm.nombre,
      precio: Number.parseFloat(insumoForm.precio),
      presentacion: insumoForm.presentacion || undefined,
      costoPorKg: Number.parseFloat(insumoForm.costoPorKg),
      stock: Number.parseFloat(insumoForm.stock),
      unidad: insumoForm.unidad,
    }
    try {
      if (editingInsumoId) {
        await updateInsumo(editingInsumoId, payload)
      } else {
        await createInsumo(payload)
      }
      closeInsumoModal()
    } catch (error) {
      console.error(error)
      alert("No se pudo guardar el insumo.")
    }
  }

  const confirmDeleteInsumo = async () => {
    if (!insumoToDelete) return
    setDeleteLoading(true)
    try {
      await deleteInsumo(insumoToDelete.id)
      setInsumoToDelete(null)
    } catch (error) {
      console.error(error)
      alert("No se pudo eliminar el insumo.")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddRacionRow = () => {
    setRacionForm((prev) => ({ ...prev, insumos: [...prev.insumos, { insumoId: "", kgPorAnimalDia: "" }] }))
  }

  const handleRemoveRacionRow = (idx: number) => {
    setRacionForm((prev) => ({
      ...prev,
      insumos: prev.insumos.filter((_, i) => i !== idx),
    }))
  }

  const resetRacionForm = () => {
    setRacionForm({
      nombre: "",
      lote: "",
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: "",
      activa: true,
      insumos: [{ insumoId: "", kgPorAnimalDia: "" }],
    })
  }

  const openCreateRacion = () => {
    resetRacionForm()
    setEditingRacionId(null)
    setShowNewRacion(true)
  }

  const handleEditRacion = (racion: Racion) => {
    setEditingRacionId(racion.id)
    setRacionForm({
      nombre: racion.nombre,
      lote: racion.lote,
      fechaInicio: racion.fechaInicio,
      fechaFin: racion.fechaFin || "",
      activa: racion.activa,
      insumos: racion.insumos.map((ri) => ({ insumoId: ri.insumoId, kgPorAnimalDia: ri.kgPorAnimalDia.toString() })),
    })
    setShowNewRacion(true)
  }

  const handleSubmitRacion = async () => {
    if (!racionForm.nombre || !racionForm.lote) {
      alert("Defina nombre y lote")
      return
    }
    if (racionForm.insumos.length === 0 || racionForm.insumos.some((ri) => !ri.insumoId || !ri.kgPorAnimalDia)) {
      alert("Agregue al menos un insumo y su dosis diaria")
      return
    }

    const payload = {
      nombre: racionForm.nombre,
      lote: racionForm.lote,
      fechaInicio: racionForm.fechaInicio,
      fechaFin: racionForm.fechaFin || undefined,
      activa: racionForm.activa,
      insumos: racionForm.insumos.map((ri) => ({
        insumoId: ri.insumoId,
        kgPorAnimalDia: Number.parseFloat(ri.kgPorAnimalDia),
      })),
    }

    try {
      if (editingRacionId) {
        await updateRacion(editingRacionId, payload)
      } else {
        await createRacion(payload)
      }
      setShowNewRacion(false)
      setEditingRacionId(null)
      resetRacionForm()
    } catch (error) {
      console.error(error)
      alert("No se pudo guardar la ración.")
    }
  }

  const confirmDeleteRacion = async () => {
    if (!racionToDelete) return
    setDeleteLoading(true)
    try {
      await deleteRacion(racionToDelete.id)
      setRacionToDelete(null)
    } catch (error) {
      console.error(error)
      alert("No se pudo eliminar la ración.")
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleRegistrarConsumo = async () => {
    if (!consumoDialog.racion) return
    const dias = Number.parseFloat(consumoDialog.dias)
    if (Number.isNaN(dias) || dias <= 0) {
      alert("Ingrese los días aplicados")
      return
    }
    const animalesLote = animalesActivos.filter((a) => a.lote === consumoDialog.racion?.lote)
    if (animalesLote.length === 0) {
      alert("No hay animales activos en este lote")
      return
    }

    const ajustes = new Map<string, number>()
    consumoDialog.racion.insumos.forEach((ri) => {
      const consumo = ri.kgPorAnimalDia * animalesLote.length * dias
      ajustes.set(ri.insumoId, (ajustes.get(ri.insumoId) ?? 0) - consumo)
    })

    try {
      await Promise.all(Array.from(ajustes.entries()).map(([insumoId, delta]) => adjustInsumoStock(insumoId, delta)))
      setConsumoDialog({ racion: null, dias: "1" })
    } catch (error) {
      console.error(error)
      alert("No se pudo registrar el consumo.")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando datos...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Suplementación e Insumos</h3>
          <p className="text-sm text-muted-foreground">Gestión de raciones, insumos e inventario</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" className="gap-2" onClick={openCreateRacion}>
            <Droplets className="h-4 w-4" /> Nueva ración
          </Button>
          <Button className="gap-2" onClick={openNewInsumo}>
            <Plus className="h-4 w-4" /> Nuevo insumo
          </Button>
        </div>
      </div>

      <Dialog
        open={showNewRacion}
        onOpenChange={(open) => {
          setShowNewRacion(open)
          if (!open) {
            setEditingRacionId(null)
            resetRacionForm()
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRacionId ? "Editar ración" : "Configurar ración"}</DialogTitle>
            </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label>Nombre *</Label>
                    <Input value={racionForm.nombre} onChange={(e) => setRacionForm({ ...racionForm, nombre: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Lote *</Label>
                    <Select value={racionForm.lote} onValueChange={(v) => setRacionForm({ ...racionForm, lote: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar lote" />
                      </SelectTrigger>
                      <SelectContent>
                        {lotes.map((lote) => (
                          <SelectItem key={lote} value={lote}>
                            {lote}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Inicio *</Label>
                    <Input type="date" value={racionForm.fechaInicio} onChange={(e) => setRacionForm({ ...racionForm, fechaInicio: e.target.value })} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Fin</Label>
                    <Input type="date" value={racionForm.fechaFin} onChange={(e) => setRacionForm({ ...racionForm, fechaFin: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Ración activa</p>
                    <p className="text-xs text-muted-foreground">Si está activa se descontará inventario automáticamente</p>
                  </div>
                  <Switch checked={racionForm.activa} onCheckedChange={(v) => setRacionForm({ ...racionForm, activa: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Ingredientes</Label>
                  <Button variant="outline" size="sm" onClick={handleAddRacionRow}>
                    Agregar insumo
                  </Button>
                </div>
                <div className="flex flex-col gap-3">
                  {racionForm.insumos.map((ri, idx) => (
                    <div key={idx} className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <Label className="text-xs">Insumo *</Label>
                        <Select
                          value={ri.insumoId}
                          onValueChange={(v) => {
                            const updated = [...racionForm.insumos]
                            updated[idx] = { ...updated[idx], insumoId: v }
                            setRacionForm({ ...racionForm, insumos: updated })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {insumos.map((ins) => (
                              <SelectItem key={ins.id} value={ins.id}>
                                {ins.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="text-xs">kg/animal/día *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={ri.kgPorAnimalDia}
                          onChange={(e) => {
                            const updated = [...racionForm.insumos]
                            updated[idx] = { ...updated[idx], kgPorAnimalDia: e.target.value }
                            setRacionForm({ ...racionForm, insumos: updated })
                          }}
                        />
                      </div>
                      {racionForm.insumos.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="justify-self-end text-muted-foreground"
                          onClick={() => handleRemoveRacionRow(idx)}
                        >
                          Quitar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowNewRacion(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitRacion}>{editingRacionId ? "Guardar cambios" : "Guardar"}</Button>
                </div>
              </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showInsumoModal} onOpenChange={(open) => (open ? setShowInsumoModal(true) : closeInsumoModal())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingInsumoId ? "Editar insumo" : "Registrar insumo"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Nombre *</Label>
              <Input value={insumoForm.nombre} onChange={(e) => setInsumoForm({ ...insumoForm, nombre: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Precio *</Label>
                <Input type="number" value={insumoForm.precio} onChange={(e) => setInsumoForm({ ...insumoForm, precio: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Presentación</Label>
                <Input value={insumoForm.presentacion} onChange={(e) => setInsumoForm({ ...insumoForm, presentacion: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>Costo/kg *</Label>
                <Input type="number" value={insumoForm.costoPorKg} onChange={(e) => setInsumoForm({ ...insumoForm, costoPorKg: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Stock *</Label>
                <Input type="number" value={insumoForm.stock} onChange={(e) => setInsumoForm({ ...insumoForm, stock: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Unidad</Label>
                <Input value={insumoForm.unidad} onChange={(e) => setInsumoForm({ ...insumoForm, unidad: e.target.value || "kg" })} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={closeInsumoModal}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitInsumo}>{editingInsumoId ? "Guardar cambios" : "Registrar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

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
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3 md:items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Wheat className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{racion.nombre}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Lote {racion.lote} &middot; {numAnimales} animales &middot; Desde {racion.fechaInicio}
                        </p>
                        <p className="text-xs text-muted-foreground">Último consumo: {formatCRDateTime(racion.ultimoConsumo)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Switch
                        checked={racion.activa && !isRacionExpired(racion.fechaFin)}
                        disabled={isRacionExpired(racion.fechaFin)}
                        onCheckedChange={(checked) => {
                          void toggleRacion(racion.id, checked)
                        }}
                      />
                      <Badge variant="outline" className={getRacionStatusClass(racion)}>
                        {getRacionStatusLabel(racion)}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleEditRacion(racion)}>
                        <Edit3 className="h-4 w-4" />
                        <span className="sr-only">Editar ración</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setRacionToDelete(racion)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar ración</span>
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => setConsumoDialog({ racion, dias: "1" })}>
                        <Droplets className="h-4 w-4" /> Registrar consumo
                      </Button>
                    </div>
                  </div>
                  {!racion.activa && racion.motivoDesactivacion === "stock" && (
                    <p className="text-xs text-warning">Pausada automáticamente por falta de insumos</p>
                  )}
                  {isRacionExpired(racion.fechaFin) && (
                    <p className="text-xs text-muted-foreground">Finalizada automáticamente el {racion.fechaFin}</p>
                  )}
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
                          <div key={insumo?.id ?? `${racion.id}-${consumo}`} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{insumo?.nombre || "—"}</span>
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
                        <TableHead className="text-right">Acciones</TableHead>
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
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openEditInsumo(ins)}>
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setInsumoToDelete(ins)}
                            >
                              Eliminar
                            </Button>
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
      <Dialog open={!!consumoDialog.racion} onOpenChange={(open) => !open && setConsumoDialog({ racion: null, dias: "1" })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar consumo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {consumoDialog.racion && (
              <p className="text-sm text-muted-foreground">
                {consumoDialog.racion.nombre} · Lote {consumoDialog.racion.lote}
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Label>Días aplicados *</Label>
              <Input
                type="number"
                min="1"
                value={consumoDialog.dias}
                onChange={(e) => setConsumoDialog((prev) => ({ ...prev, dias: e.target.value }))}
              />
            </div>
            {consumoDialog.racion && (
              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                {consumoDialog.racion.insumos.map((ri) => {
                  const ins = insumos.find((i) => i.id === ri.insumoId)
                  return (
                    <p key={ri.insumoId}>
                      {ins?.nombre || ri.insumoId}: {formatNumber(ri.kgPorAnimalDia, 2)} kg/animal/día
                    </p>
                  )
                })}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConsumoDialog({ racion: null, dias: "1" })}>
                Cancelar
              </Button>
              <Button onClick={handleRegistrarConsumo}>Aplicar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!racionToDelete} onOpenChange={(open) => {
        if (!open && !deleteLoading) setRacionToDelete(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar ración</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ración se eliminará del catálogo y dejará de descontar inventario. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading} onClick={() => setRacionToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleteLoading} onClick={confirmDeleteRacion} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!insumoToDelete} onOpenChange={(open) => {
        if (!open && !deleteLoading) setInsumoToDelete(null)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar insumo</AlertDialogTitle>
            <AlertDialogDescription>
              El insumo desaparecerá del catálogo y las raciones que lo usan deberán reconfigurarse. ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading} onClick={() => setInsumoToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={deleteLoading} onClick={confirmDeleteInsumo} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
