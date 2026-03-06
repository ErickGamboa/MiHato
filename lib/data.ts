import { supabase } from "@/lib/supabase"

const bovinos = (table: string) => supabase.schema("bovinos").from(table)

export type AnimalStatus = "activo" | "vendido" | "muerto" | "descartado"
export type Gender = "macho" | "hembra"
export type Procedencia = "finca" | "subasta"

export interface Animal {
  id: string
  diio?: string
  idSubasta?: string
  idFinca?: string
  fierroOrigen?: string
  genero: Gender
  raza: string
  fechaIngreso: string
  procedencia: Procedencia
  pesoIngreso: number
  apodo?: string
  lote: string
  precioPorKg: number
  precioCompra: number
  costoTransporte: number
  comision: number
  precioTotal: number
  estado: AnimalStatus
  historialLotes: LotMovement[]
  historialCambios: ChangeRecord[]
}

export interface Lot {
  id: string
  nombre: string
  descripcion?: string
  capacidad?: number
  notas?: string
  persisted?: boolean
}

export interface LotMovement {
  id: string
  animalId?: string
  fecha: string
  loteOrigen: string
  loteDestino: string
  motivo: string
}

export interface ChangeRecord {
  id: string
  animalId?: string
  fecha: string
  campo: string
  valorAnterior: string
  valorNuevo: string
}

export interface Pesaje {
  id: string
  animalId: string
  fecha: string
  peso: number
  suplementacion?: string
  racionId?: string
}

export interface Insumo {
  id: string
  nombre: string
  precio: number
  presentacion?: string
  costoPorKg: number
  stock: number
  unidad: string
}

export interface RacionIngrediente {
  insumoId: string
  kgPorAnimalDia: number
}

export interface Racion {
  id: string
  nombre: string
  insumos: RacionIngrediente[]
  lote: string
  fechaInicio: string
  fechaFin?: string
  activa: boolean
  ultimoConsumo?: string | null
  motivoDesactivacion?: "fecha_fin" | "stock" | null
}

export interface EventoSanitario {
  id: string
  animalId?: string
  lote?: string
  fecha: string
  tipo: string
  producto: string
  dosis: string
  viaAplicacion: string
  diagnostico?: string
  observaciones?: string
  diasRetiro?: number
  fechaFinRetiro?: string
}

export interface MedicamentoStock {
  id: string
  nombre: string
  stock: number
  unidad: string
  fechaVencimiento: string
}

export interface Escenario {
  id: string
  nombre: string
  pesoInicial: number
  pesoObjetivo: number
  gdpEsperado: number
  costoDiario: number
  precioVentaEsperado: number
}

export interface Venta {
  id: string
  animalId: string
  fechaVenta: string
  canalVenta: string
  pesoVenta: number
  precioPorKg: number
  costosSalida: number
  merma: number
}

export type CategoriaCosto = "alimentacion" | "sanidad" | "transporte" | "comision" | "otro"

export interface Costo {
  id: string
  animalId?: string
  lote?: string
  categoria: CategoriaCosto
  descripcion: string
  monto: number
  fecha: string
}

export interface DataSnapshot {
  animales: Animal[]
  lotes: Lot[]
  pesajes: Pesaje[]
  insumos: Insumo[]
  raciones: Racion[]
  eventos: EventoSanitario[]
  medicamentos: MedicamentoStock[]
  escenarios: Escenario[]
  ventas: Venta[]
  costos: Costo[]
  lotMovements: LotMovement[]
  changeRecords: ChangeRecord[]
}

const emptySnapshot: DataSnapshot = {
  animales: [],
  lotes: [],
  pesajes: [],
  insumos: [],
  raciones: [],
  eventos: [],
  medicamentos: [],
  escenarios: [],
  ventas: [],
  costos: [],
  lotMovements: [],
  changeRecords: [],
}

type AnimalRow = {
  id: string
  diio: string | null
  id_subasta: string | null
  id_finca: string | null
  fierro_origen: string | null
  genero: Gender
  raza: string
  fecha_ingreso: string
  procedencia: Procedencia
  peso_ingreso: number
  apodo: string | null
  lote: string
  precio_por_kg: number
  precio_compra: number
  costo_transporte: number
  comision: number
  precio_total: number
  estado: AnimalStatus
}

type PesajeRow = {
  id: string
  animal_id: string
  fecha: string
  peso: number
  suplementacion: string | null
  racion_id: string | null
}

type LotRow = {
  id: string
  nombre: string
  descripcion: string | null
  capacidad: number | null
  notas: string | null
}

type InsumoRow = {
  id: string
  nombre: string
  precio: number
  presentacion: string | null
  costo_por_kg: number
  stock: number
  unidad: string
}

type RacionRow = {
  id: string
  nombre: string
  lote: string
  fecha_inicio: string
  fecha_fin: string | null
  activa: boolean
  ultimo_consumo: string | null
  motivo_desactivacion: string | null
  insumos: unknown
}

type EventoSanitarioRow = {
  id: string
  animal_id: string | null
  lote: string | null
  fecha: string
  tipo: string
  producto: string
  dosis: string
  via_aplicacion: string
  diagnostico: string | null
  observaciones: string | null
  dias_retiro: number | null
  fecha_fin_retiro: string | null
}

type MedicamentoRow = {
  id: string
  nombre: string
  stock: number
  unidad: string
  fecha_vencimiento: string
}

type EscenarioRow = {
  id: string
  nombre: string
  peso_inicial: number
  peso_objetivo: number
  gdp_esperado: number
  costo_diario: number
  precio_venta_esperado: number
}

type VentaRow = {
  id: string
  animal_id: string
  fecha_venta: string
  canal_venta: string
  peso_venta: number
  precio_por_kg: number
  costos_salida: number
  merma: number
}

type CostoRow = {
  id: string
  animal_id: string | null
  lote: string | null
  categoria: CategoriaCosto
  descripcion: string
  monto: number
  fecha: string
}

type LotMovementRow = {
  id: string
  animal_id: string | null
  fecha: string
  lote_origen: string
  lote_destino: string
  motivo: string
}

type ChangeRecordRow = {
  id: string
  animal_id: string | null
  fecha: string
  campo: string
  valor_anterior: string
  valor_nuevo: string
}

function mapAnimal(row: AnimalRow): Animal {
  return {
    id: row.id,
    diio: row.diio ?? undefined,
    idSubasta: row.id_subasta ?? undefined,
    idFinca: row.id_finca ?? undefined,
    fierroOrigen: row.fierro_origen ?? undefined,
    genero: row.genero,
    raza: row.raza,
    fechaIngreso: row.fecha_ingreso,
    procedencia: row.procedencia,
    pesoIngreso: row.peso_ingreso,
    apodo: row.apodo ?? undefined,
    lote: row.lote,
    precioPorKg: row.precio_por_kg,
    precioCompra: row.precio_compra,
    costoTransporte: row.costo_transporte,
    comision: row.comision,
    precioTotal: row.precio_total,
    estado: row.estado,
    historialLotes: [],
    historialCambios: [],
  }
}

function mapPesaje(row: PesajeRow): Pesaje {
  return {
    id: row.id,
    animalId: row.animal_id,
    fecha: row.fecha,
    peso: row.peso,
    suplementacion: row.suplementacion ?? undefined,
    racionId: row.racion_id ?? undefined,
  }
}

function mapInsumo(row: InsumoRow): Insumo {
  return {
    id: row.id,
    nombre: row.nombre,
    precio: row.precio,
    presentacion: row.presentacion ?? undefined,
    costoPorKg: row.costo_por_kg,
    stock: row.stock,
    unidad: row.unidad,
  }
}

function mapRacion(row: RacionRow): Racion {
  const ingredientes: RacionIngrediente[] = Array.isArray(row.insumos)
    ? (row.insumos as any[]).map((item) => ({
        insumoId: item.insumo_id ?? item.insumoId,
        kgPorAnimalDia: item.kg_por_animal_dia ?? item.kgPorAnimalDia ?? 0,
      }))
    : []

  return {
    id: row.id,
    nombre: row.nombre,
    lote: row.lote,
    fechaInicio: row.fecha_inicio,
    fechaFin: row.fecha_fin ?? undefined,
    activa: row.activa,
    ultimoConsumo: row.ultimo_consumo,
    motivoDesactivacion: (row.motivo_desactivacion as Racion["motivoDesactivacion"]) ?? null,
    insumos: ingredientes,
  }
}

function mapEvento(row: EventoSanitarioRow): EventoSanitario {
  return {
    id: row.id,
    animalId: row.animal_id ?? undefined,
    lote: row.lote ?? undefined,
    fecha: row.fecha,
    tipo: row.tipo,
    producto: row.producto,
    dosis: row.dosis,
    viaAplicacion: row.via_aplicacion,
    diagnostico: row.diagnostico ?? undefined,
    observaciones: row.observaciones ?? undefined,
    diasRetiro: row.dias_retiro ?? undefined,
    fechaFinRetiro: row.fecha_fin_retiro ?? undefined,
  }
}

function mapMedicamento(row: MedicamentoRow): MedicamentoStock {
  return {
    id: row.id,
    nombre: row.nombre,
    stock: row.stock,
    unidad: row.unidad,
    fechaVencimiento: row.fecha_vencimiento,
  }
}

function mapEscenario(row: EscenarioRow): Escenario {
  return {
    id: row.id,
    nombre: row.nombre,
    pesoInicial: row.peso_inicial,
    pesoObjetivo: row.peso_objetivo,
    gdpEsperado: row.gdp_esperado,
    costoDiario: row.costo_diario,
    precioVentaEsperado: row.precio_venta_esperado,
  }
}

function mapVenta(row: VentaRow): Venta {
  return {
    id: row.id,
    animalId: row.animal_id,
    fechaVenta: row.fecha_venta,
    canalVenta: row.canal_venta,
    pesoVenta: row.peso_venta,
    precioPorKg: row.precio_por_kg,
    costosSalida: row.costos_salida,
    merma: row.merma,
  }
}

function mapCosto(row: CostoRow): Costo {
  return {
    id: row.id,
    animalId: row.animal_id ?? undefined,
    lote: row.lote ?? undefined,
    categoria: row.categoria,
    descripcion: row.descripcion,
    monto: row.monto,
    fecha: row.fecha,
  }
}

function mapLot(row: LotRow): Lot {
  return {
    id: row.id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? undefined,
    capacidad: row.capacidad ?? undefined,
    notas: row.notas ?? undefined,
    persisted: true,
  }
}

function mapLotMovement(row: LotMovementRow): LotMovement {
  return {
    id: row.id,
    animalId: row.animal_id ?? undefined,
    fecha: row.fecha,
    loteOrigen: row.lote_origen,
    loteDestino: row.lote_destino,
    motivo: row.motivo,
  }
}

function mapChangeRecord(row: ChangeRecordRow): ChangeRecord {
  return {
    id: row.id,
    animalId: row.animal_id ?? undefined,
    fecha: row.fecha,
    campo: row.campo,
    valorAnterior: row.valor_anterior,
    valorNuevo: row.valor_nuevo,
  }
}

async function fetchTable<T>(table: string): Promise<T[]> {
  const { data, error } = await bovinos(table).select("*")
  if (error) throw error
  return (data as T[]) ?? []
}

export async function fetchDataSnapshot(): Promise<DataSnapshot> {
  try {
    const [animalRows, pesajeRows, insumoRows, racionRows, eventoRows, medicamentoRows, escenarioRows, ventaRows, costoRows, lotMovementRows, changeRows] =
      await Promise.all([
        fetchTable<AnimalRow>("animales"),
        fetchTable<PesajeRow>("pesajes"),
        fetchTable<InsumoRow>("insumos"),
        fetchTable<RacionRow>("raciones"),
        fetchTable<EventoSanitarioRow>("eventos_sanitarios"),
        fetchTable<MedicamentoRow>("medicamentos"),
        fetchTable<EscenarioRow>("escenarios"),
        fetchTable<VentaRow>("ventas"),
        fetchTable<CostoRow>("costos"),
        fetchTable<LotMovementRow>("lot_movements"),
        fetchTable<ChangeRecordRow>("change_records"),
      ])

    let lotDefinitionRows: LotRow[] = []
    try {
      lotDefinitionRows = await fetchTable<LotRow>("lotes")
    } catch (error) {
      console.warn("Could not load lotes table, falling back to derived lots", error)
    }

    const lotMovements = lotMovementRows.map(mapLotMovement)
    const changeRecords = changeRows.map(mapChangeRecord)

    const animales = animalRows.map(mapAnimal).map((animal) => ({
      ...animal,
      historialLotes: lotMovements.filter((lm) => lm.animalId === animal.id),
      historialCambios: changeRecords.filter((cr) => cr.animalId === animal.id),
    }))

    const persistedLots = lotDefinitionRows.map(mapLot)
    const derivedLots = getLotes(animales)
      .filter((nombre) => !persistedLots.some((lot) => lot.nombre === nombre))
      .map((nombre) => ({ id: nombre, nombre, persisted: false }))
    const lotes = [...persistedLots, ...derivedLots]

    return {
      animales,
      lotes,
      pesajes: pesajeRows.map(mapPesaje),
      insumos: insumoRows.map(mapInsumo),
      raciones: racionRows.map(mapRacion),
      eventos: eventoRows.map(mapEvento),
      medicamentos: medicamentoRows.map(mapMedicamento),
      escenarios: escenarioRows.map(mapEscenario),
      ventas: ventaRows.map(mapVenta),
      costos: costoRows.map(mapCosto),
      lotMovements,
      changeRecords,
    }
  } catch (error) {
    console.error("Error fetching snapshot", error)
    return emptySnapshot
  }
}

export type AnimalInsert = Omit<Animal, "historialLotes" | "historialCambios" | "id"> & { id?: string }

function toAnimalRow(animal: AnimalInsert): AnimalRow {
  return {
    id: animal.id ?? crypto.randomUUID(),
    diio: animal.diio ?? null,
    id_subasta: animal.idSubasta ?? null,
    id_finca: animal.idFinca ?? null,
    fierro_origen: animal.fierroOrigen ?? null,
    genero: animal.genero,
    raza: animal.raza,
    fecha_ingreso: animal.fechaIngreso,
    procedencia: animal.procedencia,
    peso_ingreso: animal.pesoIngreso,
    apodo: animal.apodo ?? null,
    lote: animal.lote,
    precio_por_kg: animal.precioPorKg,
    precio_compra: animal.precioCompra,
    costo_transporte: animal.costoTransporte,
    comision: animal.comision,
    precio_total: animal.precioTotal,
    estado: animal.estado,
  }
}

export async function createAnimalRecord(animal: AnimalInsert): Promise<Animal> {
  const row = toAnimalRow(animal)
  const { data, error } = await bovinos("animales").insert(row).select().single()
  if (error) throw error
  return mapAnimal(data as AnimalRow)
}

export async function updateAnimalRecord(id: string, updates: Partial<AnimalInsert>): Promise<Animal> {
  const updatePayload: Record<string, unknown> = {}
  if ("diio" in updates) updatePayload.diio = updates.diio ?? null
  if ("idSubasta" in updates) updatePayload.id_subasta = updates.idSubasta ?? null
  if ("idFinca" in updates) updatePayload.id_finca = updates.idFinca ?? null
  if ("fierroOrigen" in updates) updatePayload.fierro_origen = updates.fierroOrigen ?? null
  if ("genero" in updates) updatePayload.genero = updates.genero
  if ("raza" in updates) updatePayload.raza = updates.raza
  if ("fechaIngreso" in updates) updatePayload.fecha_ingreso = updates.fechaIngreso
  if ("procedencia" in updates) updatePayload.procedencia = updates.procedencia
  if ("pesoIngreso" in updates) updatePayload.peso_ingreso = updates.pesoIngreso
  if ("apodo" in updates) updatePayload.apodo = updates.apodo ?? null
  if ("lote" in updates) updatePayload.lote = updates.lote
  if ("precioPorKg" in updates) updatePayload.precio_por_kg = updates.precioPorKg
  if ("precioCompra" in updates) updatePayload.precio_compra = updates.precioCompra
  if ("costoTransporte" in updates) updatePayload.costo_transporte = updates.costoTransporte
  if ("comision" in updates) updatePayload.comision = updates.comision
  if ("precioTotal" in updates) updatePayload.precio_total = updates.precioTotal
  if ("estado" in updates) updatePayload.estado = updates.estado
  const { data, error } = await bovinos("animales").update(updatePayload).eq("id", id).select().single()
  if (error) throw error
  return mapAnimal(data as AnimalRow)
}

export async function isAnimalIdentifierDuplicated(diio?: string, idSubasta?: string, excludeId?: string): Promise<boolean> {
  if (!diio && !idSubasta) return false
  let query = bovinos("animales").select("id", { count: "exact" })
  if (diio) query = query.eq("diio", diio)
  if (idSubasta) query = query.eq("id_subasta", idSubasta)
  if (excludeId) query = query.neq("id", excludeId)
  const { count, error } = await query
  if (error) throw error
  return (count ?? 0) > 0
}

export async function createPesajeRecord(pesaje: {
  animalId: string
  fecha: string
  peso: number
  suplementacion?: string
  racionId?: string
}): Promise<Pesaje> {
  const payload = {
    animal_id: pesaje.animalId,
    fecha: pesaje.fecha,
    peso: pesaje.peso,
    suplementacion: pesaje.suplementacion ?? null,
    racion_id: pesaje.racionId ?? null,
  }
  const { data, error } = await bovinos("pesajes").insert(payload).select().single()
  if (error) throw error
  return mapPesaje(data as PesajeRow)
}

export async function createInsumoRecord(insumo: Omit<Insumo, "id"> & { id?: string }): Promise<Insumo> {
  const payload = {
    id: insumo.id ?? crypto.randomUUID(),
    nombre: insumo.nombre,
    precio: insumo.precio,
    presentacion: insumo.presentacion ?? null,
    costo_por_kg: insumo.costoPorKg,
    stock: insumo.stock,
    unidad: insumo.unidad,
  }
  const { data, error } = await bovinos("insumos").insert(payload).select().single()
  if (error) throw error
  return mapInsumo(data as InsumoRow)
}

export async function updateInsumoRecord(id: string, updates: Partial<Insumo>): Promise<Insumo> {
  const payload: Record<string, unknown> = {}
  if ("nombre" in updates) payload.nombre = updates.nombre
  if ("precio" in updates) payload.precio = updates.precio
  if ("presentacion" in updates) payload.presentacion = updates.presentacion ?? null
  if ("costoPorKg" in updates) payload.costo_por_kg = updates.costoPorKg
  if ("stock" in updates) payload.stock = updates.stock
  if ("unidad" in updates) payload.unidad = updates.unidad
  const { data, error } = await bovinos("insumos").update(payload).eq("id", id).select().single()
  if (error) throw error
  return mapInsumo(data as InsumoRow)
}

export async function deleteInsumoRecord(id: string): Promise<void> {
  const { error } = await bovinos("insumos").delete().eq("id", id)
  if (error) throw error
}

function racionToRow(racion: Racion): RacionRow {
  return {
    id: racion.id,
    nombre: racion.nombre,
    lote: racion.lote,
    fecha_inicio: racion.fechaInicio,
    fecha_fin: racion.fechaFin ?? null,
    activa: racion.activa,
    ultimo_consumo: racion.ultimoConsumo ?? null,
    motivo_desactivacion: racion.motivoDesactivacion ?? null,
    insumos: racion.insumos.map((ri) => ({ insumo_id: ri.insumoId, kg_por_animal_dia: ri.kgPorAnimalDia })),
  }
}

export async function createRacionRecord(racion: Omit<Racion, "id"> & { id?: string }): Promise<Racion> {
  const payload = racionToRow({ ...racion, id: racion.id ?? crypto.randomUUID() } as Racion)
  const { data, error } = await bovinos("raciones").insert(payload).select().single()
  if (error) throw error
  return mapRacion(data as RacionRow)
}

export async function updateRacionRecord(id: string, updates: Partial<Racion>): Promise<Racion> {
  const payload: Record<string, unknown> = {}
  if ("nombre" in updates) payload.nombre = updates.nombre
  if ("lote" in updates) payload.lote = updates.lote
  if ("fechaInicio" in updates) payload.fecha_inicio = updates.fechaInicio
  if ("fechaFin" in updates) payload.fecha_fin = updates.fechaFin ?? null
  if ("activa" in updates) payload.activa = updates.activa
  if ("ultimoConsumo" in updates) payload.ultimo_consumo = updates.ultimoConsumo ?? null
  if ("motivoDesactivacion" in updates) payload.motivo_desactivacion = updates.motivoDesactivacion ?? null
  if (updates.insumos) {
    payload.insumos = updates.insumos.map((ri) => ({ insumo_id: ri.insumoId, kg_por_animal_dia: ri.kgPorAnimalDia }))
  }
  const { data, error } = await bovinos("raciones").update(payload).eq("id", id).select().single()
  if (error) throw error
  return mapRacion(data as RacionRow)
}

export async function deleteRacionRecord(id: string): Promise<void> {
  const { error } = await bovinos("raciones").delete().eq("id", id)
  if (error) throw error
}

export async function createEventoRecord(evento: Omit<EventoSanitario, "id"> & { id?: string }): Promise<EventoSanitario> {
  const payload = {
    id: evento.id ?? crypto.randomUUID(),
    animal_id: evento.animalId ?? null,
    lote: evento.lote ?? null,
    fecha: evento.fecha,
    tipo: evento.tipo,
    producto: evento.producto,
    dosis: evento.dosis,
    via_aplicacion: evento.viaAplicacion,
    diagnostico: evento.diagnostico ?? null,
    observaciones: evento.observaciones ?? null,
    dias_retiro: evento.diasRetiro ?? null,
    fecha_fin_retiro: evento.fechaFinRetiro ?? null,
  }
  const { data, error } = await bovinos("eventos_sanitarios").insert(payload).select().single()
  if (error) throw error
  return mapEvento(data as EventoSanitarioRow)
}

export async function createMedicamentoRecord(med: Omit<MedicamentoStock, "id"> & { id?: string }): Promise<MedicamentoStock> {
  const payload = {
    id: med.id ?? crypto.randomUUID(),
    nombre: med.nombre,
    stock: med.stock,
    unidad: med.unidad,
    fecha_vencimiento: med.fechaVencimiento,
  }
  const { data, error } = await bovinos("medicamentos").insert(payload).select().single()
  if (error) throw error
  return mapMedicamento(data as MedicamentoRow)
}

export async function updateMedicamentoRecord(id: string, updates: Partial<MedicamentoStock>): Promise<MedicamentoStock> {
  const payload: Record<string, unknown> = {}
  if ("nombre" in updates) payload.nombre = updates.nombre
  if ("stock" in updates) payload.stock = updates.stock
  if ("unidad" in updates) payload.unidad = updates.unidad
  if ("fechaVencimiento" in updates) payload.fecha_vencimiento = updates.fechaVencimiento
  const { data, error } = await bovinos("medicamentos").update(payload).eq("id", id).select().single()
  if (error) throw error
  return mapMedicamento(data as MedicamentoRow)
}

export async function createEscenarioRecord(esc: Omit<Escenario, "id"> & { id?: string }): Promise<Escenario> {
  const payload = {
    id: esc.id ?? crypto.randomUUID(),
    nombre: esc.nombre,
    peso_inicial: esc.pesoInicial,
    peso_objetivo: esc.pesoObjetivo,
    gdp_esperado: esc.gdpEsperado,
    costo_diario: esc.costoDiario,
    precio_venta_esperado: esc.precioVentaEsperado,
  }
  const { data, error } = await bovinos("escenarios").insert(payload).select().single()
  if (error) throw error
  return mapEscenario(data as EscenarioRow)
}

export async function createVentaRecord(venta: Omit<Venta, "id"> & { id?: string }): Promise<Venta> {
  const payload = {
    id: venta.id ?? crypto.randomUUID(),
    animal_id: venta.animalId,
    fecha_venta: venta.fechaVenta,
    canal_venta: venta.canalVenta,
    peso_venta: venta.pesoVenta,
    precio_por_kg: venta.precioPorKg,
    costos_salida: venta.costosSalida,
    merma: venta.merma,
  }
  const { data, error } = await bovinos("ventas").insert(payload).select().single()
  if (error) throw error
  return mapVenta(data as VentaRow)
}

export async function createCostoRecord(costo: Omit<Costo, "id"> & { id?: string }): Promise<Costo> {
  const payload = {
    id: costo.id ?? crypto.randomUUID(),
    animal_id: costo.animalId ?? null,
    lote: costo.lote ?? null,
    categoria: costo.categoria,
    descripcion: costo.descripcion,
    monto: costo.monto,
    fecha: costo.fecha,
  }
  const { data, error } = await bovinos("costos").insert(payload).select().single()
  if (error) throw error
  return mapCosto(data as CostoRow)
}

export async function createLotMovementRecord(movement: Omit<LotMovement, "id"> & { id?: string }): Promise<LotMovement> {
  const payload = {
    id: movement.id ?? crypto.randomUUID(),
    animal_id: movement.animalId ?? null,
    fecha: movement.fecha,
    lote_origen: movement.loteOrigen,
    lote_destino: movement.loteDestino,
    motivo: movement.motivo,
  }
  const { data, error } = await bovinos("lot_movements").insert(payload).select().single()
  if (error) throw error
  return mapLotMovement(data as LotMovementRow)
}

export async function createChangeRecordEntry(entry: Omit<ChangeRecord, "id"> & { id?: string }): Promise<ChangeRecord> {
  const payload = {
    id: entry.id ?? crypto.randomUUID(),
    animal_id: entry.animalId ?? null,
    fecha: entry.fecha,
    campo: entry.campo,
    valor_anterior: entry.valorAnterior,
    valor_nuevo: entry.valorNuevo,
  }
  const { data, error } = await bovinos("change_records").insert(payload).select().single()
  if (error) throw error
  return mapChangeRecord(data as ChangeRecordRow)
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "CRC",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals)
}

export function getStatusColor(estado: AnimalStatus): string {
  switch (estado) {
    case "activo":
      return "bg-emerald-100 text-emerald-800"
    case "vendido":
      return "bg-blue-100 text-blue-800"
    case "muerto":
      return "bg-red-100 text-red-800"
    case "descartado":
      return "bg-amber-100 text-amber-800"
  }
}

export function getLotes(animales: Animal[]): string[] {
  return [...new Set(animales.map((a) => a.lote))].sort()
}

export function getUltimoPeso(animalId: string, pesajes: Pesaje[]): number | null {
  const animalPesajes = pesajes
    .filter((p) => p.animalId === animalId)
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  return animalPesajes.length > 0 ? animalPesajes[0].peso : null
}

export function calcGDP(pesajes: Pesaje[]): number | null {
  if (pesajes.length < 2) return null
  const sorted = [...pesajes].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const dias = (new Date(last.fecha).getTime() - new Date(first.fecha).getTime()) / (1000 * 60 * 60 * 24)
  if (dias === 0) return null
  return (last.peso - first.peso) / dias
}

export function getAnimalesConProblemas(animales: Animal[], pesajes: Pesaje[]): {
  estancados: string[]
  perdaPeso: string[]
} {
  const estancados: string[] = []
  const perdaPeso: string[] = []

  for (const animal of animales.filter((a) => a.estado === "activo")) {
    const animalPesajes = pesajes
      .filter((p) => p.animalId === animal.id)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    if (animalPesajes.length >= 2) {
      const ultimo = animalPesajes[animalPesajes.length - 1]
      const anterior = animalPesajes[animalPesajes.length - 2]
      const dias =
        (new Date(ultimo.fecha).getTime() - new Date(anterior.fecha).getTime()) / (1000 * 60 * 60 * 24)

      if (ultimo.peso < anterior.peso) {
        perdaPeso.push(animal.id)
      } else if (dias > 30 && calcGDP(animalPesajes) !== null && calcGDP(animalPesajes)! < 0.1) {
        estancados.push(animal.id)
      }
    }
  }

  return { estancados, perdaPeso }
}

export function getInsumosBajoStock(insumos: Insumo[], umbral = 10): Insumo[] {
  return insumos.filter((i) => i.stock <= umbral)
}

export function getMedicamentosBajoStock(medicamentos: MedicamentoStock[], umbral = 5): MedicamentoStock[] {
  return medicamentos.filter((m) => m.stock <= umbral)
}

export function getMedicamentosVencidos(medicamentos: MedicamentoStock[]): MedicamentoStock[] {
  const hoy = new Date()
  return medicamentos.filter((m) => m.fechaVencimiento && new Date(m.fechaVencimiento) < hoy)
}

export function getMedicamentosVencimientoProximo(medicamentos: MedicamentoStock[], dias = 30): MedicamentoStock[] {
  const hoy = new Date()
  const limite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000)
  return medicamentos.filter(
    (m) => m.fechaVencimiento && new Date(m.fechaVencimiento) >= hoy && new Date(m.fechaVencimiento) <= limite
  )
}

export function hasActiveRetiro(eventos: EventoSanitario[], animalId: string, fechaReferencia: Date = new Date()): boolean {
  return eventos.some((ev) => ev.animalId === animalId && ev.fechaFinRetiro && new Date(ev.fechaFinRetiro) > fechaReferencia)
}

export function getAlertasDashboard(
  animales: Animal[],
  pesajes: Pesaje[],
  eventos: EventoSanitario[],
  medicamentos: MedicamentoStock[],
  insumos: Insumo[]
) {
  const animalesActivos = animales.filter((a) => a.estado === "activo")
  const { estancados, perdaPeso } = getAnimalesConProblemas(animales, pesajes)
  const medsBajoStock = getMedicamentosBajoStock(medicamentos)
  const medsVencidos = getMedicamentosVencidos(medicamentos)
  const medsVencimientoProximo = getMedicamentosVencimientoProximo(medicamentos)
  const insumosBajoStock = getInsumosBajoStock(insumos)

  const retirosActivos = animalesActivos.filter((a) => hasActiveRetiro(eventos, a.id))

  return {
    countAnimales: animalesActivos.length,
    countEstancados: estancados.length,
    countPerdaPeso: perdaPeso.length,
    countRetirosActivos: retirosActivos.length,
    countMedsBajoStock: medsBajoStock.length,
    countMedsVencidos: medsVencidos.length,
    countMedsVencimientoProximo: medsVencimientoProximo.length,
    countInsumosBajoStock: insumosBajoStock.length,
    idsEstancados: estancados,
    idsPerdaPeso: perdaPeso,
    idsRetirosActivos: retirosActivos.map((a) => a.id),
    medicamentosBajoStock: medsBajoStock,
    medicamentosVencidos: medsVencidos,
    medicamentosVencimientoProximo: medsVencimientoProximo,
    insumosBajoStock,
  }
}

export function getCostaRicaNow(): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  const year = Number(lookup.year)
  const month = Number(lookup.month)
  const day = Number(lookup.day)
  const hour = Number(lookup.hour)
  const minute = Number(lookup.minute)
  const second = Number(lookup.second)
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second))
}

export function toCostaRicaDate(dateString: string): Date {
  if (!dateString) return getCostaRicaNow()
  return new Date(`${dateString}T00:00:00-06:00`)
}

export function differenceInDays(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  return Math.floor((endUTC - startUTC) / msPerDay)
}

export function isAfterDate(a: Date, b: Date): boolean {
  return a.getTime() > b.getTime()
}
