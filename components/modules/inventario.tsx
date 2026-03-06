"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  Filter,
  Eye,
  ArrowLeft,
  Beef,
  Scale,
  Syringe,
  Clock,
  ArrowRightLeft,
} from "lucide-react"
import {
  type Animal,
  type AnimalStatus,
  type Gender,
  type Pesaje,
  type EventoSanitario,
  formatCurrency,
  formatNumber,
  getStatusColor,
  calcGDP,
  getUltimoPeso,
  getLotes,
} from "@/lib/data"
import { useDataStore } from "@/hooks/use-data-store"

export function InventarioModule() {
  const { animales, pesajes, eventos, loading, createAnimal, isIdentifierDuplicated } = useDataStore()
  const [search, setSearch] = useState("")
  const [filterGenero, setFilterGenero] = useState<string>("todos")
  const [filterLote, setFilterLote] = useState<string>("todos")
  const [filterEstado, setFilterEstado] = useState<string>("todos")
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showCambioLoteDialog, setShowCambioLoteDialog] = useState(false)
  const [cambioLoteForm, setCambioLoteForm] = useState({ fecha: new Date().toISOString().split("T")[0], loteOrigen: "", loteDestino: "", motivo: "" })
  const [columnFilters, setColumnFilters] = useState({
    id: "",
    diio: "",
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
    genero: "macho" as Gender, raza: "", fechaIngreso: new Date().toISOString().split("T")[0],
    procedencia: "finca" as "finca" | "subasta", pesoIngreso: "",
    apodo: "", lote: "L-01", precioPorKg: "", costoTransporte: "0", comision: "0",
  })

  const lotes = getLotes(animales)

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

      const idMatch = matches(animal.id, columnFilters.id)
      const diioMatch = matches(animal.diio, columnFilters.diio)
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
        diioMatch &&
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

  const handleCreateAnimal = async () => {
    // Validación de campos obligatorios
    if (!newForm.genero || !newForm.fechaIngreso || !newForm.pesoIngreso || !newForm.lote || !newForm.precioPorKg) {
      alert("Complete los campos obligatorios: género, fecha ingreso, peso ingreso, lote, precio/kg.")
      return
    }

    // Validación de duplicados en Supabase
    const duplicated = await isIdentifierDuplicated(newForm.diio || undefined, newForm.idSubasta || undefined)
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
      diio: newForm.diio || undefined,
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
      genero: "macho", raza: "", fechaIngreso: new Date().toISOString().split("T")[0],
      procedencia: "finca", pesoIngreso: "", apodo: "", lote: "L-01",
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
                <Label>DIIO</Label>
                <Input
                  placeholder="CL-XXXXXXXX"
                  value={newForm.diio}
                  onChange={(e) => setNewForm({ ...newForm, diio: e.target.value })}
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {lotes.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                    <SelectItem value="L-nuevo">Nuevo Lote</SelectItem>
                  </SelectContent>
                </Select>
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
              <Button onClick={handleCreateAnimal}>Registrar Animal</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por DIIO, ID, fierro, apodo, lote..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterGenero} onValueChange={setFilterGenero}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Género" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="macho">Macho</SelectItem>
                  <SelectItem value="hembra">Hembra</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLote} onValueChange={setFilterLote}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Lote" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {lotes.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterEstado} onValueChange={setFilterEstado}>
                <SelectTrigger className="w-[130px]">
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

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>DIIO</TableHead>
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
                  <TableHead>
                    <Input
                      placeholder="ID"
                      value={columnFilters.id}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, id: e.target.value }))}
                    />
                  </TableHead>
                  <TableHead>
                    <Input
                      placeholder="DIIO"
                      value={columnFilters.diio}
                      onChange={(e) => setColumnFilters((prev) => ({ ...prev, diio: e.target.value }))}
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
                  const ultimoPeso = getUltimoPeso(animal.id, pesajes)
                  const animalPesajes = pesajes.filter((p: Pesaje) => p.animalId === animal.id)
                  const gdp = calcGDP(animalPesajes)
                  return (
                    <TableRow key={animal.id}>
                      <TableCell className="font-mono text-xs font-medium">{animal.id}</TableCell>
                      <TableCell className="text-xs">{animal.diio || "—"}</TableCell>
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
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAnimal(animal)}
                        >
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Ver detalle</span>
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
              <h3 className="text-xl font-bold text-foreground">{animal.apodo || animal.id}</h3>
              <Badge variant="secondary" className={getStatusColor(animal.estado)}>
                {animal.estado}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {animal.id} &middot; {animal.diio || "Sin DIIO"} &middot; {animal.raza} &middot; {animal.genero}
            </p>
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
        <TabsList className="w-full justify-start">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pesajes">Pesajes</TabsTrigger>
          <TabsTrigger value="sanidad">Sanidad</TabsTrigger>
          <TabsTrigger value="costos">Costos</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <InfoField label="ID" value={animal.id} />
                <InfoField label="DIIO" value={animal.diio || "—"} />
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
