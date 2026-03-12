"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
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
import {
  Search,
  Plus,
  Eye,
  ArrowLeft,
  Beef,
  Scale,
  Syringe,
  Clock,
  ArrowRightLeft,
  Trash2,
  Edit3,
} from "lucide-react"
import {
  type Animal,
  type AnimalStatus,
  type Gender,
  type Pesaje,
  type EventoSanitario,
  type Lot,
  formatCurrency,
  formatNumber,
  getStatusColor,
  calcGDP,
  getUltimoPeso,
  getLotes,
  getCostaRicaNow,
  formatCRDateOnly,
} from "@/lib/data"
import { useDataStore } from "@/hooks/use-data-store"
import { getAnimalDisplayLabel, getAnimalSecondaryLabel } from "@/lib/utils"

export function InventarioModule() {
  const {
    animales,
    lotes: lotDefinitions,
    pesajes,
    eventos,
    loading,
    createAnimal,
    isIdentifierDuplicated,
    createLot,
    updateLot,
    deleteLot,
    moveAnimalToLot,
  } = useDataStore()
  const [search, setSearch] = useState("")
  const [filterGenero, setFilterGenero] = useState<string>("todos")
  const [filterLote, setFilterLote] = useState<string>("todos")
  const [filterEstado, setFilterEstado] = useState<string>("todos")
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showCambioLoteDialog, setShowCambioLoteDialog] = useState(false)
  const [showManageLoteDialog, setShowManageLoteDialog] = useState(false)
  const [selectedAnimalIds, setSelectedAnimalIds] = useState<string[]>([])
  const [moveTargets, setMoveTargets] = useState<string[]>([])
  const today = formatCRDateOnly(getCostaRicaNow())

  const [cambioLoteForm, setCambioLoteForm] = useState({ fecha: today, loteOrigen: "", loteDestino: "", motivo: "" })
  const [lotForm, setLotForm] = useState({ nombre: "", descripcion: "", capacidad: "", notas: "" })
  const [editingLotId, setEditingLotId] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState({
    id: "",
    apodo: "",
    raza: "",
    genero: "",
    lote: "",
    pesoIngreso: "",
    pesoActual: "",
    gdp: "",
    estado: "",
  })

  // New animal form
  const [newForm, setNewForm] = useState({
    diio: "", idSubasta: "", idFinca: "", fierroOrigen: "",
    genero: "macho" as Gender, raza: "", fechaIngreso: today,
    procedencia: "finca" as "finca" | "subasta", pesoIngreso: "",
    apodo: "", lote: "", precioPorKg: "", costoTransporte: "0", comision: "0",
  })

  const lotCatalog = useMemo<Lot[]>(() => {
    if (lotDefinitions.length > 0) {
      return lotDefinitions
    }
    return getLotes(animales).map((nombre) => ({ id: nombre, nombre, persisted: false }))
  }, [lotDefinitions, animales])

  const lotNames = useMemo(() => [...new Set(lotCatalog.map((lot) => lot.nombre))].sort(), [lotCatalog])
  const hasAvailableLots = lotNames.length > 0

  const lotesWithCounts = useMemo(() => {
    return lotCatalog.map((lot) => ({
      lot,
      animalesCount: animales.filter((a) => a.lote === lot.nombre).length,
    }))
  }, [lotCatalog, animales])

  useEffect(() => {
    if (!hasAvailableLots) {
      setNewForm((prev) => ({ ...prev, lote: "" }))
      return
    }
    setNewForm((prev) => {
      if (!prev.lote || !lotNames.includes(prev.lote)) {
        return { ...prev, lote: lotNames[0] }
      }
      return prev
    })
  }, [hasAvailableLots, lotNames])

  const filtered = useMemo(() => {
    return animales.filter((a) => {
      const searchLower = search.toLowerCase()
      const matchSearch =
        !search ||
        a.id.toLowerCase().includes(searchLower) ||
        (a.diio && a.diio.toLowerCase().includes(searchLower)) ||
        (a.idSubasta && a.idSubasta.toLowerCase().includes(searchLower)) ||
        (a.idFinca && a.idFinca.toLowerCase().includes(searchLower)) ||
        (a.fierroOrigen && a.fierroOrigen.toLowerCase().includes(searchLower)) ||
        (a.apodo && a.apodo.toLowerCase().includes(searchLower)) ||
        a.lote.toLowerCase().includes(searchLower)

      const matchGenero = filterGenero === "todos" || a.genero === filterGenero
      const matchLote = filterLote === "todos" || a.lote === filterLote
      const matchEstado = filterEstado === "todos" || a.estado === filterEstado
      return matchSearch && matchGenero && matchLote && matchEstado
    })
  }, [animales, search, filterGenero, filterLote, filterEstado])

  const columnFiltered = useMemo(() => {
    return filtered.filter((animal) => {
      const ultimoPeso = getUltimoPeso(animal.id, pesajes)
      const animalPesajes = pesajes.filter((p: Pesaje) => p.animalId === animal.id)
      const gdp = calcGDP(animalPesajes)

      const matches = (value: string | undefined, filter: string) =>
        !filter || (value ?? "").toLowerCase().includes(filter.toLowerCase())

      const idMatch = matches(getAnimalDisplayLabel(animal), columnFilters.id)
      const apodoMatch = matches(animal.apodo, columnFilters.apodo)
      const razaMatch = matches(animal.raza, columnFilters.raza)
      const generoMatch = matches(animal.genero, columnFilters.genero)
      const loteMatch = matches(animal.lote, columnFilters.lote)
      const pesoIngresoMatch = !columnFilters.pesoIngreso || `${animal.pesoIngreso}`.includes(columnFilters.pesoIngreso)
      const pesoActualMatch = !columnFilters.pesoActual || `${ultimoPeso ?? ""}`.includes(columnFilters.pesoActual)
      const gdpMatch = !columnFilters.gdp || (gdp !== null && `${gdp}`.includes(columnFilters.gdp))
      const estadoMatch = matches(animal.estado, columnFilters.estado)

      return (
        idMatch &&
        apodoMatch &&
        razaMatch &&
        generoMatch &&
        loteMatch &&
        pesoIngresoMatch &&
        pesoActualMatch &&
        gdpMatch &&
        estadoMatch
      )
    })
  }, [filtered, columnFilters, pesajes])

  const selectedAnimals = useMemo(() => animales.filter((a) => selectedAnimalIds.includes(a.id)), [animales, selectedAnimalIds])
  const moveTargetAnimals = useMemo(() => animales.filter((a) => moveTargets.includes(a.id)), [animales, moveTargets])
  const selectionCount = selectedAnimals.length
  const allSelected = columnFiltered.length > 0 && columnFiltered.every((animal) => selectedAnimalIds.includes(animal.id))

  const resetLotForm = () => {
    setLotForm({ nombre: "", descripcion: "", capacidad: "", notas: "" })
    setEditingLotId(null)
  }

  const handleManageDialogChange = (open: boolean) => {
    setShowManageLoteDialog(open)
    if (!open) {
      resetLotForm()
    }
  }

  const handleEditLot = (lot: Lot) => {
    setEditingLotId(lot.persisted ? lot.id ?? null : null)
    setLotForm({
      nombre: lot.nombre,
      descripcion: lot.descripcion ?? "",
      capacidad: lot.capacidad ? String(lot.capacidad) : "",
      notas: lot.notas ?? "",
    })
    setShowManageLoteDialog(true)
  }

  const handleSaveLot = async () => {
    const nombre = lotForm.nombre.trim()
    if (!nombre) {
      alert("El nombre del lote es obligatorio.")
      return
    }
    const nombreLower = nombre.toLowerCase()
    const payload = {
      nombre,
      descripcion: lotForm.descripcion.trim() ? lotForm.descripcion.trim() : undefined,
      capacidad: lotForm.capacidad ? Number.parseFloat(lotForm.capacidad) : undefined,
      notas: lotForm.notas.trim() ? lotForm.notas.trim() : undefined,
    }
    try {
      if (editingLotId) {
        const duplicate = lotCatalog.some((lot) => lot.persisted && lot.nombre.toLowerCase() === nombreLower && lot.id !== editingLotId)
        if (duplicate) {
          alert("Ya existe un lote con ese nombre.")
          return
        }
        await updateLot(editingLotId, payload)
      } else {
        const duplicate = lotCatalog.some((lot) => lot.persisted && lot.nombre.toLowerCase() === nombreLower)
        if (duplicate) {
          alert("Ya existe un lote con ese nombre.")
          return
        }
        await createLot(payload)
      }
      resetLotForm()
      setShowManageLoteDialog(false)
    } catch (error) {
      console.error(error)
      alert("No se pudo guardar el lote. Intente nuevamente.")
    }
  }

  const handleDeleteLot = async (lot: Lot) => {
    if (!lot.persisted || !lot.id) {
      alert("Este lote proviene del histórico y no puede eliminarse.")
      return
    }
    const animalesCount = animales.filter((a) => a.lote === lot.nombre).length
    if (animalesCount > 0) {
      alert("No puede eliminar un lote con animales asignados.")
      return
    }
    if (!confirm(`¿Eliminar el lote "${lot.nombre}"?`)) return
    try {
      await deleteLot(lot.id)
      if (newForm.lote === lot.nombre) {
        setNewForm((prev) => ({ ...prev, lote: lotNames[0] ?? "" }))
      }
    } catch (error) {
      console.error(error)
      alert("No se pudo eliminar el lote.")
    }
  }

  const toggleSelectAnimal = (id: string, checked: boolean) => {
    setSelectedAnimalIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev
        return [...prev, id]
      }
      return prev.filter((value) => value !== id)
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAnimalIds(columnFiltered.map((animal) => animal.id))
    } else {
      setSelectedAnimalIds([])
    }
  }

  const resetCambioForm = () => {
    setCambioLoteForm({ fecha: today, loteOrigen: "", loteDestino: "", motivo: "" })
  }

  const handleMoveDialogChange = (open: boolean) => {
    setShowCambioLoteDialog(open)
    if (!open) {
      setMoveTargets([])
      resetCambioForm()
    }
  }

  const handleOpenMoveDialog = (ids: string[]) => {
    const unique = Array.from(new Set(ids))
    if (unique.length === 0) return
    setMoveTargets(unique)
    const lotesSelec = animales.filter((a) => unique.includes(a.id)).map((a) => a.lote)
    const origenSet = new Set(lotesSelec)
    const origenValue = origenSet.size === 1 ? Array.from(origenSet)[0] : "Múltiples"
    setCambioLoteForm({
      fecha: today,
      loteOrigen: origenValue,
      loteDestino: "",
      motivo: "",
    })
    setShowCambioLoteDialog(true)
  }

  const handleMoveAnimals = async () => {
    if (!cambioLoteForm.loteDestino) {
      alert("Seleccione un lote destino.")
      return
    }
    try {
      for (const animalId of moveTargets) {
        await moveAnimalToLot({
          animalId,
          loteDestino: cambioLoteForm.loteDestino,
          motivo: cambioLoteForm.motivo || "Reasignación de lote",
          fecha: cambioLoteForm.fecha,
        })
      }
      setSelectedAnimalIds([])
      handleMoveDialogChange(false)
    } catch (error) {
      console.error(error)
      alert("No se pudo mover a los animales. Intente de nuevo.")
    }
  }

  const handleCreateAnimal = async () => {
    const diio = newForm.diio.trim().toUpperCase()
    if (!diio) {
      alert("El DIIO es obligatorio y funciona como identificador principal del animal.")
      return
    }
    if (!hasAvailableLots || !newForm.lote) {
      alert("Debe crear y seleccionar un lote antes de registrar un animal.")
      return
    }
    // Validación de campos obligatorios
    if (!newForm.genero || !newForm.fechaIngreso || !newForm.pesoIngreso || !newForm.precioPorKg) {
      alert("Complete los campos obligatorios: género, fecha ingreso, peso ingreso y precio/kg.")
      return
    }

    // Validación de duplicados en Supabase
    const duplicated = await isIdentifierDuplicated(diio, newForm.idSubasta || undefined)
    if (duplicated) {
      alert("DIIO o ID de subasta duplicado. Este identificador ya existe en el sistema.")
      return
    }

    const peso = Number.parseFloat(newForm.pesoIngreso)
    const precioPorKg = Number.parseFloat(newForm.precioPorKg)
    const transporte = Number.parseFloat(newForm.costoTransporte) || 0
    const comision = Number.parseFloat(newForm.comision) || 0
    const precioCompra = precioPorKg * peso
    const precioTotal = precioCompra + transporte + comision

    const newAnimal = {
      diio,
      idSubasta: newForm.idSubasta || undefined,
      idFinca: newForm.idFinca || undefined,
      fierroOrigen: newForm.fierroOrigen || undefined,
      genero: newForm.genero,
      raza: newForm.raza,
      fechaIngreso: newForm.fechaIngreso,
      procedencia: newForm.procedencia,
      pesoIngreso: peso,
      apodo: newForm.apodo || undefined,
      lote: newForm.lote,
      precioPorKg,
      precioCompra,
      costoTransporte: transporte,
      comision,
      precioTotal,
      estado: "activo" as Animal["estado"],
    } satisfies Omit<Animal, "historialLotes" | "historialCambios" | "id">

    try {
      await createAnimal(newAnimal)
    } catch (error) {
      console.error(error)
      alert("No se pudo crear el animal. Intente nuevamente.")
      return
    }
    setShowNewDialog(false)
    setNewForm({
      diio: "", idSubasta: "", idFinca: "", fierroOrigen: "",
      genero: "macho", raza: "", fechaIngreso: today,
      procedencia: "finca", pesoIngreso: "", apodo: "", lote: lotNames[0] ?? "",
      precioPorKg: "", costoTransporte: "0", comision: "0",
    })
  }

  if (selectedAnimal) {
    return (
      <AnimalFicha
        animal={selectedAnimal}
        pesajes={pesajes.filter((p) => p.animalId === selectedAnimal.id)}
        eventos={eventos.filter(
          (e) => e.animalId === selectedAnimal.id || e.lote === selectedAnimal.lote
        )}
        onBack={() => setSelectedAnimal(null)}
      />
    )
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Cargando datos...</div>
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Inventario de Ganado</h3>
          <p className="text-sm text-muted-foreground">
            {filtered.length} animales encontrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowManageLoteDialog(true)}>
            Gestionar lotes
          </Button>
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Animal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Animal</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>DIIO (ID) *</Label>
                <Input
                  placeholder="CL-XXXXXXXX"
                  value={newForm.diio}
                  onChange={(e) => setNewForm({ ...newForm, diio: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>ID Subasta</Label>
                <Input
                  value={newForm.idSubasta}
                  onChange={(e) => setNewForm({ ...newForm, idSubasta: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>ID Finca</Label>
                <Input
                  value={newForm.idFinca}
                  onChange={(e) => setNewForm({ ...newForm, idFinca: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Fierro de Origen</Label>
                <Input
                  value={newForm.fierroOrigen}
                  onChange={(e) => setNewForm({ ...newForm, fierroOrigen: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Género *</Label>
                <Select
                  value={newForm.genero}
                  onValueChange={(v) => setNewForm({ ...newForm, genero: v as Gender })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="macho">Macho</SelectItem>
                    <SelectItem value="hembra">Hembra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Raza</Label>
                <Input
                  value={newForm.raza}
                  onChange={(e) => setNewForm({ ...newForm, raza: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Fecha Ingreso *</Label>
                <Input
                  type="date"
                  value={newForm.fechaIngreso}
                  onChange={(e) => setNewForm({ ...newForm, fechaIngreso: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Procedencia *</Label>
                <Select
                  value={newForm.procedencia}
                  onValueChange={(v) => setNewForm({ ...newForm, procedencia: v as "finca" | "subasta" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finca">Finca</SelectItem>
                    <SelectItem value="subasta">Subasta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Peso Ingreso (kg) *</Label>
                <Input
                  type="number"
                  value={newForm.pesoIngreso}
                  onChange={(e) => setNewForm({ ...newForm, pesoIngreso: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Apodo / Descripción</Label>
                <Input
                  value={newForm.apodo}
                  onChange={(e) => setNewForm({ ...newForm, apodo: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Lote *</Label>
                <Select
                  value={newForm.lote}
                  onValueChange={(v) => setNewForm({ ...newForm, lote: v })}
                >
                  <SelectTrigger disabled={!hasAvailableLots}><SelectValue placeholder={hasAvailableLots ? undefined : "Cree un lote"} /></SelectTrigger>
                  <SelectContent>
                    {lotNames.map((loteNombre) => (
                      <SelectItem key={loteNombre} value={loteNombre}>{loteNombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!hasAvailableLots && (
                  <p className="text-xs text-destructive">Debes crear un lote antes de registrar animales.</p>
                )}
                <Button type="button" variant="link" className="justify-start p-0 text-left text-sm font-normal" onClick={() => setShowManageLoteDialog(true)}>
                  Gestionar lotes
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Precio por kg *</Label>
                <Input
                  type="number"
                  value={newForm.precioPorKg}
                  onChange={(e) => setNewForm({ ...newForm, precioPorKg: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Costo Transporte</Label>
                <Input
                  type="number"
                  value={newForm.costoTransporte}
                  onChange={(e) => setNewForm({ ...newForm, costoTransporte: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Comisión</Label>
                <Input
                  type="number"
                  value={newForm.comision}
                  onChange={(e) => setNewForm({ ...newForm, comision: e.target.value })}
                />
              </div>
              {newForm.pesoIngreso && newForm.precioPorKg && (
                <div className="col-span-full rounded-lg bg-muted p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Precio Compra</p>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(Number.parseFloat(newForm.precioPorKg) * Number.parseFloat(newForm.pesoIngreso))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transporte + Comisión</p>
                      <p className="font-semibold text-foreground">
                        {formatCurrency((Number.parseFloat(newForm.costoTransporte) || 0) + (Number.parseFloat(newForm.comision) || 0))}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Precio Total</p>
                      <p className="font-bold text-primary">
                        {formatCurrency(
                          Number.parseFloat(newForm.precioPorKg) * Number.parseFloat(newForm.pesoIngreso) +
                            (Number.parseFloat(newForm.costoTransporte) || 0) +
                            (Number.parseFloat(newForm.comision) || 0)
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
              <Button onClick={handleCreateAnimal} disabled={!hasAvailableLots}>Registrar Animal</Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por DIIO, ID, fierro, apodo, lote..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Select value={filterGenero} onValueChange={setFilterGenero}>
                <SelectTrigger className="w-full min-w-[140px] sm:w-32">
                  <SelectValue placeholder="Género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLote} onValueChange={setFilterLote}>
                <SelectTrigger className="w-full min-w-[140px] sm:w-32">
                  <SelectValue placeholder="Lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {lotNames.map((loteNombre) => (
                    <SelectItem key={loteNombre} value={loteNombre}>{loteNombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-full min-w-[140px] sm:w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="vendido">Vendido</SelectItem>
                  <SelectItem value="muerto">Muerto</SelectItem>
                  <SelectItem value="descartado">Descartado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {selectionCount > 0 ? `${selectionCount} animales seleccionados` : "Selecciona animales para moverlos de lote"}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={selectionCount === 0}
          onClick={() => handleOpenMoveDialog(selectedAnimalIds)}
        >
          <ArrowRightLeft className="h-4 w-4" />
          Mover selección
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-center">
                    <Checkbox
                      aria-label="Seleccionar todos"
                      checked={allSelected}
                      onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    />
                  </TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Apodo</TableHead>
                  <TableHead>Raza</TableHead>
                  <TableHead>Género</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead className="text-right">Peso Ing.</TableHead>
                  <TableHead className="text-right">Peso Actual</TableHead>
                  <TableHead className="text-right">GDP</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>
                    <Input
                      placeholder="DIIO o apodo"
                      value={columnFilters.id}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, id: e.target.value }))}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Apodo"
                      value={columnFilters.apodo}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, apodo: e.target.value }))}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Raza"
                      value={columnFilters.raza}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, raza: e.target.value }))}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Género"
                      value={columnFilters.genero}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, genero: e.target.value }))}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Lote"
                      value={columnFilters.lote}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, lote: e.target.value }))}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="kg"
                      value={columnFilters.pesoIngreso}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, pesoIngreso: e.target.value }))}
                      className="text-right"
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="kg"
                      value={columnFilters.pesoActual}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, pesoActual: e.target.value }))}
                      className="text-right"
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="GDP"
                      value={columnFilters.gdp}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, gdp: e.target.value }))}
                      className="text-right"
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="Estado"
                      value={columnFilters.estado}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, estado: e.target.value }))}
                    />
                  </TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {columnFiltered.map((animal) => {
                  const displayLabel = getAnimalDisplayLabel(animal)
                  const ultimoPeso = getUltimoPeso(animal.id, pesajes)
                  const animalPesajes = pesajes.filter((p: Pesaje) => p.animalId === animal.id)
                  const gdp = calcGDP(animalPesajes)
                  return (
                    <TableRow key={animal.id}>
                      <TableCell className="text-center">
                        <Checkbox
                          aria-label={`Seleccionar ${displayLabel}`}
                          checked={selectedAnimalIds.includes(animal.id)}
                          onCheckedChange={(checked) => toggleSelectAnimal(animal.id, Boolean(checked))}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{displayLabel}</TableCell>
                      <TableCell className="font-medium">{animal.apodo || "—"}</TableCell>
                      <TableCell>{animal.raza}</TableCell>
                      <TableCell className="capitalize">{animal.genero}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{animal.lote}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{animal.pesoIngreso} kg</TableCell>
                      <TableCell className="text-right font-mono">
                        {ultimoPeso ? `${ultimoPeso} kg` : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {gdp !== null ? `${formatNumber(gdp, 2)} kg/d` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(animal.estado)}>
                          {animal.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="flex flex-wrap justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAnimal(animal)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalle</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenMoveDialog([animal.id])}
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                          <span className="sr-only">Mover lote</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showManageLoteDialog} onOpenChange={handleManageDialogChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Gestión de lotes</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {lotesWithCounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aún no hay lotes definidos. Cree uno nuevo para comenzar.</p>
              ) : (
                lotesWithCounts.map(({ lot, animalesCount }) => {
                  const isPersisted = Boolean(lot.persisted && lot.id)
                  return (
                    <div key={lot.id} className="flex items-start justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{lot.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {animalesCount} {animalesCount === 1 ? "animal" : "animales"}
                          {lot.capacidad ? ` · Capacidad ${lot.capacidad}` : ""}
                        </p>
                        {lot.descripcion && <p className="text-xs text-muted-foreground">{lot.descripcion}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEditLot(lot)}>
                          <Edit3 className="h-4 w-4" />
                          <span className="sr-only">Editar lote</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={!isPersisted}
                          onClick={() => handleDeleteLot(lot)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar lote</span>
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-foreground">{editingLotId ? "Editar lote" : "Nuevo lote"}</p>
              <div className="mt-3 space-y-3">
                <div>
                  <Label>Nombre *</Label>
                  <Input value={lotForm.nombre} onChange={(e) => setLotForm((prev) => ({ ...prev, nombre: e.target.value }))} />
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea value={lotForm.descripcion} onChange={(e) => setLotForm((prev) => ({ ...prev, descripcion: e.target.value }))} />
                </div>
                <div>
                  <Label>Capacidad (cabezas)</Label>
                  <Input
                    type="number"
                    value={lotForm.capacidad}
                    onChange={(e) => setLotForm((prev) => ({ ...prev, capacidad: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea value={lotForm.notas} onChange={(e) => setLotForm((prev) => ({ ...prev, notas: e.target.value }))} />
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleSaveLot}>{editingLotId ? "Guardar cambios" : "Crear lote"}</Button>
                  {editingLotId && (
                    <Button variant="ghost" onClick={resetLotForm}>
                      Limpiar formulario
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCambioLoteDialog} onOpenChange={handleMoveDialogChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Mover animales de lote</DialogTitle>
          </DialogHeader>
          {moveTargetAnimals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Seleccione animales para cambiar de lote.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <p className="font-medium text-foreground">
                  {moveTargetAnimals.length} {moveTargetAnimals.length === 1 ? "animal" : "animales"} seleccionado(s)
                </p>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {moveTargetAnimals.map((animal) => (
                    <li key={animal.id}>• {getAnimalDisplayLabel(animal)} — {animal.lote}</li>
                  ))}
                </ul>
                {cambioLoteForm.loteOrigen && (
                  <p className="mt-2 text-xs text-muted-foreground">Origen: {cambioLoteForm.loteOrigen}</p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Fecha *</Label>
                  <Input
                    type="date"
                    value={cambioLoteForm.fecha}
                    onChange={(e) => setCambioLoteForm((prev) => ({ ...prev, fecha: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Lote destino *</Label>
                  <Select value={cambioLoteForm.loteDestino} onValueChange={(v) => setCambioLoteForm((prev) => ({ ...prev, loteDestino: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {lotNames.map((nombre) => (
                        <SelectItem key={nombre} value={nombre}>{nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {lotNames.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">Cree un lote antes de mover animales.</p>
                  )}
                </div>
              </div>
              <div>
                <Label>Motivo</Label>
                <Textarea value={cambioLoteForm.motivo} onChange={(e) => setCambioLoteForm((prev) => ({ ...prev, motivo: e.target.value }))} />
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <Button variant="outline" onClick={() => handleMoveDialogChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleMoveAnimals}>Mover animales</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ===== FICHA ANIMAL =====
function AnimalFicha({
  animal,
  pesajes,
  eventos,
  onBack,
}: {
  animal: Animal
  pesajes: Pesaje[]
  eventos: EventoSanitario[]
  onBack: () => void
}) {
  const ultimoPeso = pesajes.length > 0
    ? [...pesajes].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0].peso
    : animal.pesoIngreso
  const gdp = calcGDP(pesajes)
  const kgGanados = ultimoPeso - animal.pesoIngreso
  const diasEnFinca = Math.round(
    (new Date().getTime() - new Date(animal.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24)
  )
  const lotHistory = [...animal.historialLotes].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  )
  const displayLabel = getAnimalDisplayLabel(animal)
  const secondaryLabel = getAnimalSecondaryLabel(animal)

  return (
    <div className="flex flex-col gap-4">
      <Button variant="ghost" className="w-fit gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Volver al listado
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Beef className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-foreground">{displayLabel}</h3>
              <Badge variant="secondary" className={getStatusColor(animal.estado)}>
                {animal.estado}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{secondaryLabel} · {animal.genero}</p>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Peso Actual</p>
            <p className="text-xl font-bold text-foreground">{ultimoPeso} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Kg Ganados</p>
            <p className="text-xl font-bold text-primary">+{kgGanados} kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">GDP</p>
            <p className="text-xl font-bold text-foreground">{gdp ? formatNumber(gdp, 2) : "—"} kg/d</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Días en Finca</p>
            <p className="text-xl font-bold text-foreground">{diasEnFinca}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pesajes">Pesajes</TabsTrigger>
          <TabsTrigger value="sanidad">Sanidad</TabsTrigger>
          <TabsTrigger value="costos">Costos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <InfoField label="DIIO" value={animal.diio || "Sin DIIO"} />
                  <InfoField label="ID Subasta" value={animal.idSubasta || "—"} />
                  <InfoField label="ID Finca" value={animal.idFinca || "—"} />
                  <InfoField label="Fierro Origen" value={animal.fierroOrigen || "—"} />
                  <InfoField label="Género" value={animal.genero} />
                  <InfoField label="Raza" value={animal.raza} />
                  <InfoField label="Procedencia" value={animal.procedencia} />
                  <InfoField label="Fecha Ingreso" value={animal.fechaIngreso} />
                  <InfoField label="Peso Ingreso" value={`${animal.pesoIngreso} kg`} />
                  <InfoField label="Lote" value={animal.lote} />
                  <InfoField label="Apodo" value={animal.apodo || "—"} />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Cambios de lote</CardTitle>
                <p className="text-sm text-muted-foreground">Historial de movimientos para este animal.</p>
              </CardHeader>
              <CardContent className="p-0">
                {lotHistory.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">Sin cambios de lote registrados.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Origen</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Motivo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lotHistory.map((movimiento) => (
                          <TableRow key={movimiento.id}>
                            <TableCell className="whitespace-nowrap">{movimiento.fecha}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="outline">{movimiento.loteOrigen}</Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <Badge variant="secondary">{movimiento.loteDestino}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{movimiento.motivo}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pesajes" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Peso (kg)</TableHead>
                    <TableHead className="text-right">Kg Ganados</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                    <TableHead className="text-right">GDP</TableHead>
                    <TableHead>Suplementación</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...pesajes]
                    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                    .map((p, i, arr) => {
                      const prev = i > 0 ? arr[i - 1] : null
                      const kgG = prev ? p.peso - prev.peso : p.peso - animal.pesoIngreso
                      const dias = prev
                        ? Math.round((new Date(p.fecha).getTime() - new Date(prev.fecha).getTime()) / (1000 * 60 * 60 * 24))
                        : Math.round((new Date(p.fecha).getTime() - new Date(animal.fechaIngreso).getTime()) / (1000 * 60 * 60 * 24))
                      const gdpPeriod = dias > 0 ? kgG / dias : 0
                      return (
                        <TableRow key={p.id}>
                          <TableCell>{p.fecha}</TableCell>
                          <TableCell className="text-right font-mono">{p.peso}</TableCell>
                          <TableCell className="text-right font-mono text-primary">+{kgG}</TableCell>
                          <TableCell className="text-right font-mono">{dias}</TableCell>
                          <TableCell className="text-right font-mono">{formatNumber(gdpPeriod, 2)}</TableCell>
                          <TableCell>{p.suplementacion || "—"}</TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sanidad" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col gap-4">
                {eventos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin eventos sanitarios registrados.</p>
                ) : (
                  eventos
                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                    .map((ev) => {
                      const retiroActivo = ev.fechaFinRetiro && new Date(ev.fechaFinRetiro) > new Date()
                      return (
                        <div key={ev.id} className="flex gap-4 rounded-lg border p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Syringe className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground capitalize">{ev.tipo}</p>
                              {retiroActivo && (
                                <Badge variant="destructive" className="text-xs">Retiro activo</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {ev.producto} &middot; {ev.dosis} &middot; {ev.viaAplicacion}
                            </p>
                            <p className="text-xs text-muted-foreground">{ev.fecha}</p>
                            {ev.diagnostico && (
                              <p className="mt-1 text-xs text-muted-foreground">Dx: {ev.diagnostico}</p>
                            )}
                          </div>
                        </div>
                      )
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costos" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField label="Precio por kg" value={formatCurrency(animal.precioPorKg)} />
                <InfoField label="Precio Compra" value={formatCurrency(animal.precioCompra)} />
                <InfoField label="Transporte" value={formatCurrency(animal.costoTransporte)} />
                <InfoField label="Comisión" value={formatCurrency(animal.comision)} />
                <div className="col-span-full rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Precio Total de Compra</p>
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(animal.precioTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium capitalize text-foreground">{value}</p>
    </div>
  )
}
