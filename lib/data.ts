import { supabase } from './supabase'

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

export interface LotMovement {
  id: string
  fecha: string
  loteOrigen: string
  loteDestino: string
  motivo: string
}

export interface ChangeRecord {
  id: string
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
}

export interface Insumo {
  id: string
  nombre: string
  precio: number
  presentacion: string
  costoPorKg: number
  stock: number
  unidad: string
}

export interface Racion {
  id: string
  nombre: string
  insumos: { insumoId: string; kgPorAnimalDia: number }[]
  lote: string
  fechaInicio: string
  fechaFin?: string
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

const mapAnimal = (row: any): Animal => ({
  id: row.id,
  diio: row.diio,
  idSubasta: row.id_subasta,
  idFinca: row.id_finca,
  fierroOrigen: row.fierro_origen,
  genero: row.genero,
  raza: row.raza,
  fechaIngreso: row.fecha_ingreso,
  procedencia: row.procedencia,
  pesoIngreso: row.peso_ingreso,
  apodo: row.apodo,
  lote: row.lote,
  precioPorKg: row.precio_por_kg,
  precioCompra: row.precio_compra,
  costoTransporte: row.costo_transporte,
  comision: row.comision,
  precioTotal: row.precio_total,
  estado: row.estado,
  historialLotes: [],
  historialCambios: [],
})

const mapPesaje = (row: any): Pesaje => ({
  id: row.id,
  animalId: row.animal_id,
  fecha: row.fecha,
  peso: row.peso,
  suplementacion: row.suplementacion,
})

const mapInsumo = (row: any): Insumo => ({
  id: row.id,
  nombre: row.nombre,
  precio: row.precio,
  presentacion: row.presentacion,
  costoPorKg: row.costo_por_kg,
  stock: row.stock,
  unidad: row.unidad,
})

const mapRacion = (row: any, insumos: any[]): Racion => ({
  id: row.id,
  nombre: row.nombre,
  lote: row.lote,
  fechaInicio: row.fecha_inicio,
  fechaFin: row.fecha_fin,
  insumos: insumos.map(i => ({ insumoId: i.insumo_id, kgPorAnimalDia: i.kg_por_animal_dia })),
})

const mapEventoSanitario = (row: any): EventoSanitario => ({
  id: row.id,
  animalId: row.animal_id,
  lote: row.lote,
  fecha: row.fecha,
  tipo: row.tipo,
  producto: row.producto,
  dosis: row.dosis,
  viaAplicacion: row.via_aplicacion,
  diagnostico: row.diagnostico,
  observaciones: row.observaciones,
  diasRetiro: row.dias_retiro,
  fechaFinRetiro: row.fecha_fin_retiro,
})

const mapMedicamento = (row: any): MedicamentoStock => ({
  id: row.id,
  nombre: row.nombre,
  stock: row.stock,
  unidad: row.unidad,
  fechaVencimiento: row.fecha_vencimiento,
})

const mapEscenario = (row: any): Escenario => ({
  id: row.id,
  nombre: row.nombre,
  pesoInicial: row.peso_inicial,
  pesoObjetivo: row.peso_objetivo,
  gdpEsperado: row.gdp_esperado,
  costoDiario: row.costo_diario,
  precioVentaEsperado: row.precio_venta_esperado,
})

const mapVenta = (row: any): Venta => ({
  id: row.id,
  animalId: row.animal_id,
  fechaVenta: row.fecha_venta,
  canalVenta: row.canal_venta,
  pesoVenta: row.peso_venta,
  precioPorKg: row.precio_por_kg,
  costosSalida: row.costos_salida,
  merma: row.merma,
})

export async function getAnimales(): Promise<Animal[]> {
  const { data, error } = await supabase.schema('bovinos').from('animales').select('*').order('id')
  if (error) throw error
  return data.map(mapAnimal)
}

export async function getPesajes(): Promise<Pesaje[]> {
  const { data, error } = await supabase.schema('bovinos').from('pesajes').select('*').order('fecha', { ascending: false })
  if (error) throw error
  return data.map(mapPesaje)
}

export async function getInsumos(): Promise<Insumo[]> {
  const { data, error } = await supabase.schema('bovinos').from('insumos').select('*').order('nombre')
  if (error) throw error
  return data.map(mapInsumo)
}

export async function getRaciones(): Promise<Racion[]> {
  const { data: raciones, error } = await supabase.schema('bovinos').from('raciones').select('*').order('nombre')
  if (error) throw error
  
  const result: Racion[] = []
  for (const r of raciones) {
    const { data: insumos } = await supabase.schema('bovinos')
      .from('racion_insumos')
      .select('*')
      .eq('racion_id', r.id)
    result.push(mapRacion(r, insumos || []))
  }
  return result
}

export async function getEventosSanitarios(): Promise<EventoSanitario[]> {
  const { data, error } = await supabase.schema('bovinos').from('eventos_sanitarios').select('*').order('fecha', { ascending: false })
  if (error) throw error
  return data.map(mapEventoSanitario)
}

export async function getMedicamentos(): Promise<MedicamentoStock[]> {
  const { data, error } = await supabase.schema('bovinos').from('medicamentos').select('*').order('nombre')
  if (error) throw error
  return data.map(mapMedicamento)
}

export async function getEscenarios(): Promise<Escenario[]> {
  const { data, error } = await supabase.schema('bovinos').from('escenarios').select('*').order('nombre')
  if (error) throw error
  return data.map(mapEscenario)
}

export async function getVentas(): Promise<Venta[]> {
  const { data, error } = await supabase.schema('bovinos').from('ventas').select('*').order('fecha_venta', { ascending: false })
  if (error) throw error
  return data.map(mapVenta)
}

export async function insertAnimal(animal: Omit<Animal, 'historialLotes' | 'historialCambios'>) {
  const { error } = await supabase.schema('bovinos').from('animales').insert({
    id: animal.id,
    diio: animal.diio,
    id_subasta: animal.idSubasta,
    id_finca: animal.idFinca,
    fierro_origen: animal.fierroOrigen,
    genero: animal.genero,
    raza: animal.raza,
    fecha_ingreso: animal.fechaIngreso,
    procedencia: animal.procedencia,
    peso_ingreso: animal.pesoIngreso,
    apodo: animal.apodo,
    lote: animal.lote,
    precio_por_kg: animal.precioPorKg,
    precio_compra: animal.precioCompra,
    costo_transporte: animal.costoTransporte,
    comision: animal.comision,
    precio_total: animal.precioTotal,
    estado: animal.estado,
  })
  if (error) throw error
}

export async function updateAnimal(id: string, updates: Partial<Animal>) {
  const { error } = await supabase.schema('bovinos').from('animales').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteAnimal(id: string) {
  const { error } = await supabase.schema('bovinos').from('animales').delete().eq('id', id)
  if (error) throw error
}

export async function insertPesaje(pesaje: Pesaje) {
  const { error } = await supabase.schema('bovinos').from('pesajes').insert({
    id: pesaje.id,
    animal_id: pesaje.animalId,
    fecha: pesaje.fecha,
    peso: pesaje.peso,
    suplementacion: pesaje.suplementacion,
  })
  if (error) throw error
}

export async function insertInsumo(insumo: Insumo) {
  const { error } = await supabase.schema('bovinos').from('insumos').insert({
    id: insumo.id,
    nombre: insumo.nombre,
    precio: insumo.precio,
    presentacion: insumo.presentacion,
    costo_por_kg: insumo.costoPorKg,
    stock: insumo.stock,
    unidad: insumo.unidad,
  })
  if (error) throw error
}

export async function updateInsumo(id: string, updates: Partial<Insumo>) {
  const updateData: any = {}
  if (updates.nombre !== undefined) updateData.nombre = updates.nombre
  if (updates.precio !== undefined) updateData.precio = updates.precio
  if (updates.presentacion !== undefined) updateData.presentacion = updates.presentacion
  if (updates.costoPorKg !== undefined) updateData.costo_por_kg = updates.costoPorKg
  if (updates.stock !== undefined) updateData.stock = updates.stock
  if (updates.unidad !== undefined) updateData.unidad = updates.unidad
  
  const { error } = await supabase.schema('bovinos').from('insumos').update(updateData).eq('id', id)
  if (error) throw error
}

export async function deleteInsumo(id: string) {
  const { error } = await supabase.schema('bovinos').from('insumos').delete().eq('id', id)
  if (error) throw error
}

export async function insertRacion(racion: Racion) {
  const { error: errorRacion } = await supabase.schema('bovinos').from('raciones').insert({
    id: racion.id,
    nombre: racion.nombre,
    lote: racion.lote,
    fecha_inicio: racion.fechaInicio,
    fecha_fin: racion.fechaFin,
  })
  if (errorRacion) throw errorRacion

  for (const insumo of racion.insumos) {
    const { error: errorInsumo } = await supabase.schema('bovinos').from('racion_insumos').insert({
      id: `${racion.id}-${insumo.insumoId}`,
      racion_id: racion.id,
      insumo_id: insumo.insumoId,
      kg_por_animal_dia: insumo.kgPorAnimalDia,
    })
    if (errorInsumo) throw errorInsumo
  }
}

export async function insertEventoSanitario(evento: EventoSanitario) {
  const { error } = await supabase.schema('bovinos').from('eventos_sanitarios').insert({
    id: evento.id,
    animal_id: evento.animalId,
    lote: evento.lote,
    fecha: evento.fecha,
    tipo: evento.tipo,
    producto: evento.producto,
    dosis: evento.dosis,
    via_aplicacion: evento.viaAplicacion,
    diagnostico: evento.diagnostico,
    observaciones: evento.observaciones,
    dias_retiro: evento.diasRetiro,
    fecha_fin_retiro: evento.fechaFinRetiro,
  })
  if (error) throw error
}

export async function insertMedicamento(medicamento: MedicamentoStock) {
  const { error } = await supabase.schema('bovinos').from('medicamentos').insert({
    id: medicamento.id,
    nombre: medicamento.nombre,
    stock: medicamento.stock,
    unidad: medicamento.unidad,
    fecha_vencimiento: medicamento.fechaVencimiento,
  })
  if (error) throw error
}

export async function updateMedicamento(id: string, updates: Partial<MedicamentoStock>) {
  const { error } = await supabase.schema('bovinos').from('medicamentos').update(updates).eq('id', id)
  if (error) throw error
}

export async function insertEscenario(escenario: Escenario) {
  const { error } = await supabase.schema('bovinos').from('escenarios').insert(escenario)
  if (error) throw error
}

export async function insertVenta(venta: Venta) {
  const { error } = await supabase.schema('bovinos').from('ventas').insert({
    id: venta.id,
    animal_id: venta.animalId,
    fecha_venta: venta.fechaVenta,
    canal_venta: venta.canalVenta,
    peso_venta: venta.pesoVenta,
    precio_por_kg: venta.precioPorKg,
    costos_salida: venta.costosSalida,
    merma: venta.merma,
  })
  if (error) throw error
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

export function getAnimalesPorLote(animales: Animal[]): Record<string, Animal[]> {
  return animales.reduce(
    (acc, a) => {
      if (!acc[a.lote]) acc[a.lote] = []
      acc[a.lote].push(a)
      return acc
    },
    {} as Record<string, Animal[]>
  )
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value)
}

export function formatNumber(value: number, decimals = 1): string {
  return value.toFixed(decimals)
}

export function getStatusColor(estado: AnimalStatus): string {
  switch (estado) {
    case "activo": return "bg-emerald-100 text-emerald-800"
    case "vendido": return "bg-blue-100 text-blue-800"
    case "muerto": return "bg-red-100 text-red-800"
    case "descartado": return "bg-amber-100 text-amber-800"
  }
}

export function getLotes(animales: Animal[]): string[] {
  return [...new Set(animales.map((a) => a.lote))].sort()
}
