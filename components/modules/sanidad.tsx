"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Plus, AlertTriangle, Shield, Syringe, Clock, Package } from "lucide-react"
import {
  type Animal,
  type EventoSanitario,
  type MedicamentoStock,
  getLotes,
  getCostaRicaNow,
  formatCRDateOnly,
  toCostaRicaDate,
} from "@/lib/data"
import { useFeedback } from "@/hooks/use-feedback"
import { useDataStore } from "@/hooks/use-data-store"
import { getAnimalDisplayLabel } from "@/lib/utils"

const tiposEvento = ["vacuna", "desparasitación", "antibiótico", "implante", "cirugía", "otro"]
const viasAplicacion = ["Subcutánea", "Intramuscular", "Oral", "Tópica", "Subcutánea oreja", "Intravenosa"]

export function SanidadModule() {
  const { animales, eventos, medicamentos, loading, createEvento } = useDataStore()
  const { error, notify } = useFeedback()
  const [showNewEvento, setShowNewEvento] = useState(false)
  const today = formatCRDateOnly(getCostaRicaNow())

  const [newEvento, setNewEvento] = useState({
    aplicarA: "animal" as "animal" | "lote",
    animalId: "", lote: "", fecha: today,
    tipo: "vacuna", producto: "", dosis: "", viaAplicacion: "Subcutánea",
    diagnostico: "", observaciones: "", diasRetiro: "0",
  })
  const [eventoFilters, setEventoFilters] = useState({
    fecha: "",
    tipo: "",
    target: "",
    producto: "",
    dosis: "",
    via: "",
    retiro: "",
    estado: "",
  })

  const animalesActivos = animales.filter((a) => a.estado === "activo")
  const lotes = getLotes(animales)
  const hoy = toCostaRicaDate(today)

  // Retiros activos
  const retirosActivos = useMemo(() => {
    return eventos.filter(
      (ev) => ev.fechaFinRetiro && new Date(ev.fechaFinRetiro) > hoy
    )
  }, [eventos, hoy])

  // Próximas dosis / vencidas (simple mock)
  const alertas = useMemo(() => {
    const al: { tipo: string; mensaje: string; severity: "warning" | "destructive" }[] = []

    // Active retiros
    for (const ev of retirosActivos) {
      const animalRef = ev.animalId ? animales.find((a) => a.id === ev.animalId) : undefined
      const target = animalRef ? getAnimalDisplayLabel(animalRef) : `Lote ${ev.lote}`
      al.push({
        tipo: "Retiro activo",
        mensaje: `${target}: ${ev.producto} hasta ${ev.fechaFinRetiro}`,
        severity: "destructive",
      })
    }

    // Medicamentos vencidos
    for (const med of medicamentos) {
      const venc = new Date(med.fechaVencimiento)
      const diasHastaVenc = Math.round((venc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
      if (diasHastaVenc < 0 && diasHastaVenc > -90) {
        // This is mock data with future dates stored as negative days, skip
      }
      if (med.stock < 10) {
        al.push({
          tipo: "Stock bajo",
          mensaje: `${med.nombre}: ${med.stock} ${med.unidad}`,
          severity: "warning",
        })
      }
    }

    return al
  }, [medicamentos, retirosActivos, animales, hoy])

  const handleCreateEvento = async () => {
    if (!newEvento.fecha || !newEvento.producto || !newEvento.dosis) {
      error("Campos obligatorios", "Completa fecha, producto y dosis.")
      return
    }
    if (newEvento.aplicarA === "animal" && !newEvento.animalId) {
      error("Selecciona un animal", "Elige un animal para aplicar el evento.")
      return
    }
    if (newEvento.aplicarA === "lote" && !newEvento.lote) {
      error("Selecciona un lote", "Elige un lote para aplicar el evento.")
      return
    }

    const diasRetiro = Number.parseInt(newEvento.diasRetiro) || 0
    const fechaFinRetiro = diasRetiro > 0
      ? formatCRDateOnly(new Date(new Date(newEvento.fecha).getTime() + diasRetiro * 24 * 60 * 60 * 1000))
      : undefined

    const ev = {
      animalId: newEvento.aplicarA === "animal" ? newEvento.animalId : undefined,
      lote: newEvento.aplicarA === "lote" ? newEvento.lote : undefined,
      fecha: newEvento.fecha,
      tipo: newEvento.tipo,
      producto: newEvento.producto,
      dosis: newEvento.dosis,
      viaAplicacion: newEvento.viaAplicacion,
      diagnostico: newEvento.diagnostico || undefined,
      observaciones: newEvento.observaciones || undefined,
      diasRetiro,
      fechaFinRetiro,
    }
    try {
      await createEvento(ev)
      setShowNewEvento(false)
      notify({
        title: "Evento registrado",
        description: `${ev.producto} agendado para ${ev.fecha}.`,
      })
    } catch (err) {
      console.error(err)
      error("No se pudo registrar el evento", "Intenta nuevamente.")
    }
  }

  // costos sanitarios
  const costosSanitarios = useMemo(() => {
    const costosPorAnimal: Record<string, number> = {}
    for (const ev of eventos) {
      if (ev.animalId) {
        costosPorAnimal[ev.animalId] = (costosPorAnimal[ev.animalId] || 0) + 8000 // CRC estimado por evento
      }
      if (ev.lote) {
        const animalesLote = animales.filter((a) => a.lote === ev.lote)
        for (const a of animalesLote) {
          costosPorAnimal[a.id] = (costosPorAnimal[a.id] || 0) + 8000
        }
      }
    }
    return costosPorAnimal
  }, [eventos, animales])

  const filteredEventos = useMemo(() => {
    return eventos.filter((ev) => {
      const match = (value: string | undefined, filter: string) =>
        !filter || (value ?? "").toLowerCase().includes(filter.toLowerCase())
      const animalRef = ev.animalId ? animales.find((a: Animal) => a.id === ev.animalId) : undefined
      const target = animalRef ? getAnimalDisplayLabel(animalRef) : `Lote ${ev.lote}`
      const retiro = ev.diasRetiro ? `${ev.diasRetiro} días` : "Sin retiro"
      const estado = ev.fechaFinRetiro && new Date(ev.fechaFinRetiro) > new Date() ? "Retiro activo" : "Sin retiro"
      return (
        match(ev.fecha, eventoFilters.fecha) &&
        match(ev.tipo, eventoFilters.tipo) &&
        match(target, eventoFilters.target) &&
        match(ev.producto, eventoFilters.producto) &&
        match(ev.dosis, eventoFilters.dosis) &&
        match(ev.viaAplicacion, eventoFilters.via) &&
        match(retiro, eventoFilters.retiro) &&
        match(estado, eventoFilters.estado)
      )
    })
  }, [eventos, eventoFilters, animales])

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando datos...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Sanidad Animal</h3>
          <p className="text-sm text-muted-foreground">Registro de eventos sanitarios, retiros y stock de medicamentos</p>
        </div>
        <Dialog open={showNewEvento} onOpenChange={setShowNewEvento}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo Evento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Registrar Evento Sanitario</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              {/* Apply to */}
              <div className="flex flex-col gap-2">
                <Label>Aplicar a</Label>
                <Select value={newEvento.aplicarA} onValueChange={(v) => setNewEvento({ ...newEvento, aplicarA: v as "animal" | "lote" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="animal">Animal individual</SelectItem>
                    <SelectItem value="lote">Lote completo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newEvento.aplicarA === "animal" ? (
                <div className="flex flex-col gap-2">
                  <Label>Animal *</Label>
                  <Select value={newEvento.animalId} onValueChange={(v) => setNewEvento({ ...newEvento, animalId: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {animalesActivos.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{getAnimalDisplayLabel(a)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label>Lote *</Label>
                  <Select value={newEvento.lote} onValueChange={(v) => setNewEvento({ ...newEvento, lote: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {lotes.map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Fecha *</Label>
                  <Input type="date" value={newEvento.fecha} onChange={(e) => setNewEvento({ ...newEvento, fecha: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Tipo *</Label>
                  <Select value={newEvento.tipo} onValueChange={(v) => setNewEvento({ ...newEvento, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {tiposEvento.map((t) => (
                        <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Producto *</Label>
                <Input value={newEvento.producto} onChange={(e) => setNewEvento({ ...newEvento, producto: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label>Dosis *</Label>
                  <Input value={newEvento.dosis} onChange={(e) => setNewEvento({ ...newEvento, dosis: e.target.value })} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Vía de aplicación</Label>
                  <Select value={newEvento.viaAplicacion} onValueChange={(v) => setNewEvento({ ...newEvento, viaAplicacion: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {viasAplicacion.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Días de retiro</Label>
                <Input type="number" value={newEvento.diasRetiro} onChange={(e) => setNewEvento({ ...newEvento, diasRetiro: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Diagnóstico</Label>
                <Input value={newEvento.diagnostico} onChange={(e) => setNewEvento({ ...newEvento, diagnostico: e.target.value })} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Observaciones</Label>
                <Textarea value={newEvento.observaciones} onChange={(e) => setNewEvento({ ...newEvento, observaciones: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewEvento(false)}>Cancelar</Button>
              <Button onClick={handleCreateEvento}>Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {alertas.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {alertas.map((al, i) => (
            <Card key={i} className={al.severity === "destructive" ? "border-destructive/40 bg-destructive/5" : "border-warning/40 bg-warning/5"}>
              <CardContent className="flex items-start gap-3 p-4">
                {al.severity === "destructive" ? (
                  <Shield className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{al.tipo}</p>
                  <p className="text-sm text-foreground">{al.mensaje}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Tabs defaultValue="eventos" className="w-full">
        <TabsList className="flex w-full flex-wrap gap-2">
          <TabsTrigger value="eventos">Eventos Sanitarios</TabsTrigger>
          <TabsTrigger value="medicamentos">Stock Medicamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="eventos" className="mt-4">
          <Card>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Animal / Lote</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Dosis</TableHead>
                      <TableHead>Vía</TableHead>
                      <TableHead>Retiro</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                    <TableRow>
                      <TableHead>
                        <Input
                          placeholder="Fecha"
                          value={eventoFilters.fecha}
                          onChange={(e) => setEventoFilters((prev) => ({ ...prev, fecha: e.target.value }))}
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          placeholder="Tipo"
                          value={eventoFilters.tipo}
                          onChange={(e) => setEventoFilters((prev) => ({ ...prev, tipo: e.target.value }))}
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          placeholder="Animal/Lote"
                          value={eventoFilters.target}
                          onChange={(e) => setEventoFilters((prev) => ({ ...prev, target: e.target.value }))}
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          placeholder="Producto"
                          value={eventoFilters.producto}
                          onChange={(e) => setEventoFilters((prev) => ({ ...prev, producto: e.target.value }))}
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          placeholder="Dosis"
                          value={eventoFilters.dosis}
                          onChange={(e) => setEventoFilters((prev) => ({ ...prev, dosis: e.target.value }))}
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          placeholder="Vía"
                          value={eventoFilters.via}
                          onChange={(e) => setEventoFilters((prev) => ({ ...prev, via: e.target.value }))}
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          placeholder="Retiro"
                          value={eventoFilters.retiro}
                          onChange={(e) => setEventoFilters((prev) => ({ ...prev, retiro: e.target.value }))}
                        />
                      </TableHead>
                      <TableHead>
                        <Input
                          placeholder="Estado"
                          value={eventoFilters.estado}
                          onChange={(e) => setEventoFilters((prev) => ({ ...prev, estado: e.target.value }))}
                        />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...filteredEventos]
                      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                      .map((ev) => {
                        const retiroActivo = ev.fechaFinRetiro && new Date(ev.fechaFinRetiro) > hoy
                        const animalRef = ev.animalId ? animales.find((a: Animal) => a.id === ev.animalId) : undefined
                        const target = animalRef ? getAnimalDisplayLabel(animalRef) : `Lote ${ev.lote}`
                        return (
                          <TableRow key={ev.id}>
                            <TableCell className="text-sm">{ev.fecha}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">{ev.tipo}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">{target}</TableCell>
                            <TableCell className="text-sm font-medium">{ev.producto}</TableCell>
                            <TableCell className="text-sm font-mono">{ev.dosis}</TableCell>
                            <TableCell className="text-sm">{ev.viaAplicacion}</TableCell>
                            <TableCell className="text-sm">
                              {ev.diasRetiro ? `${ev.diasRetiro}d` : "—"}
                            </TableCell>
                            <TableCell>
                              {retiroActivo ? (
                                <Badge variant="destructive">Retiro</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">OK</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medicamentos" className="mt-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {medicamentos.map((med) => (
              <Card key={med.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{med.nombre}</p>
                      <p className="text-xs text-muted-foreground">Vence: {med.fechaVencimiento}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Stock</span>
                    <span className="font-mono text-sm font-medium text-foreground">
                      {med.stock} {med.unidad}
                    </span>
                  </div>
                  {med.stock < 10 && (
                    <div className="mt-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-warning" />
                      <span className="text-xs text-warning">Stock bajo</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
