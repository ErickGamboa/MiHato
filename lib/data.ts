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

export const initialData: DataSnapshot = {
  animales: [
    {
      id: "AN-001",
      diio: "CR-0001",
      idSubasta: "SB-9801",
      fierroOrigen: "El Cacique",
      genero: "macho",
      raza: "Brahman",
      fechaIngreso: "2024-09-05",
      procedencia: "subasta",
      pesoIngreso: 280,
      apodo: "Titan",
      lote: "L-01",
      precioPorKg: 1800,
      precioCompra: 504000,
      costoTransporte: 25000,
      comision: 18000,
      precioTotal: 547000,
      estado: "activo",
      historialLotes: [],
      historialCambios: [],
    },
    {
      id: "AN-002",
      diio: "CR-0002",
      idFinca: "FIN-210",
      fierroOrigen: "Las Brumas",
      genero: "hembra",
      raza: "Angus",
      fechaIngreso: "2024-08-20",
      procedencia: "finca",
      pesoIngreso: 260,
      apodo: "Luna",
      lote: "L-02",
      precioPorKg: 1750,
      precioCompra: 455000,
      costoTransporte: 18000,
      comision: 0,
      precioTotal: 473000,
      estado: "activo",
      historialLotes: [],
      historialCambios: [],
    },
    {
      id: "AN-003",
      diio: "CR-0003",
      idSubasta: "SB-9822",
      fierroOrigen: "Los Lirios",
      genero: "macho",
      raza: "Brangus",
      fechaIngreso: "2024-06-15",
      procedencia: "subasta",
      pesoIngreso: 290,
      apodo: "Rayo",
      lote: "L-01",
      precioPorKg: 1820,
      precioCompra: 527800,
      costoTransporte: 24000,
      comision: 17000,
      precioTotal: 568800,
      estado: "vendido",
      historialLotes: [],
      historialCambios: [],
    },
    {
      id: "AN-004",
      diio: "CR-0004",
      idFinca: "FIN-220",
      fierroOrigen: "Altavista",
      genero: "hembra",
      raza: "Gyr",
      fechaIngreso: "2024-07-10",
      procedencia: "finca",
      pesoIngreso: 240,
      apodo: "Candela",
      lote: "L-03",
      precioPorKg: 1680,
      precioCompra: 403200,
      costoTransporte: 15000,
      comision: 0,
      precioTotal: 418200,
      estado: "activo",
      historialLotes: [],
      historialCambios: [],
    },
    {
      id: "AN-005",
      diio: "CR-0005",
      idFinca: "FIN-310",
      fierroOrigen: "Cordillera",
      genero: "macho",
      raza: "Holstein",
      fechaIngreso: "2024-05-05",
      procedencia: "finca",
      pesoIngreso: 300,
      apodo: "Trueno",
      lote: "L-02",
      precioPorKg: 1700,
      precioCompra: 510000,
      costoTransporte: 20000,
      comision: 0,
      precioTotal: 530000,
      estado: "descartado",
      historialLotes: [],
      historialCambios: [],
    },
  ],
  pesajes: [
    { id: "P-001", animalId: "AN-001", fecha: "2024-09-05", peso: 280 },
    { id: "P-002", animalId: "AN-001", fecha: "2024-10-05", peso: 318, suplementacion: "Ración Engorde" },
    { id: "P-003", animalId: "AN-001", fecha: "2024-11-05", peso: 352 },
    { id: "P-004", animalId: "AN-002", fecha: "2024-08-20", peso: 260 },
    { id: "P-005", animalId: "AN-002", fecha: "2024-09-25", peso: 286 },
    { id: "P-006", animalId: "AN-002", fecha: "2024-11-02", peso: 310 },
    { id: "P-007", animalId: "AN-003", fecha: "2024-06-15", peso: 290 },
    { id: "P-008", animalId: "AN-003", fecha: "2024-08-01", peso: 335 },
    { id: "P-009", animalId: "AN-003", fecha: "2024-10-10", peso: 378 },
    { id: "P-010", animalId: "AN-004", fecha: "2024-07-10", peso: 240 },
    { id: "P-011", animalId: "AN-004", fecha: "2024-09-01", peso: 272 },
    { id: "P-012", animalId: "AN-004", fecha: "2024-11-01", peso: 299 },
  ],
  insumos: [
    { id: "INS-001", nombre: "Concentrado Premium", precio: 23000, presentacion: "Saco 40kg", costoPorKg: 575, stock: 820, unidad: "kg" },
    { id: "INS-002", nombre: "Melaza", precio: 18500, presentacion: "Tanque 200L", costoPorKg: 320, stock: 640, unidad: "kg" },
    { id: "INS-003", nombre: "Minerales Chelados", precio: 28000, presentacion: "Saco 25kg", costoPorKg: 1120, stock: 190, unidad: "kg" },
  ],
  raciones: [
    {
      id: "RAC-001",
      nombre: "Engorde Intensivo L-01",
      lote: "L-01",
      fechaInicio: "2024-09-01",
      insumos: [
        { insumoId: "INS-001", kgPorAnimalDia: 4.2 },
        { insumoId: "INS-002", kgPorAnimalDia: 1.1 },
        { insumoId: "INS-003", kgPorAnimalDia: 0.15 },
      ],
    },
    {
      id: "RAC-002",
      nombre: "Recría L-02",
      lote: "L-02",
      fechaInicio: "2024-08-10",
      insumos: [
        { insumoId: "INS-001", kgPorAnimalDia: 3.2 },
        { insumoId: "INS-003", kgPorAnimalDia: 0.08 },
      ],
    },
  ],
  eventos: [
    {
      id: "EV-001",
      animalId: "AN-001",
      fecha: "2024-09-12",
      tipo: "vacuna",
      producto: "Clostridiosis 8 vías",
      dosis: "5 ml",
      viaAplicacion: "Subcutánea",
      diasRetiro: 15,
      fechaFinRetiro: "2024-09-27",
    },
    {
      id: "EV-002",
      lote: "L-02",
      fecha: "2024-10-03",
      tipo: "desparasitación",
      producto: "Ivermectina 1%",
      dosis: "1 ml/50kg",
      viaAplicacion: "Subcutánea",
      diasRetiro: 21,
      fechaFinRetiro: "2024-10-24",
    },
    {
      id: "EV-003",
      animalId: "AN-004",
      fecha: "2024-11-15",
      tipo: "antibiótico",
      producto: "Oxitetra LA",
      dosis: "10 ml",
      viaAplicacion: "Intramuscular",
      diasRetiro: 28,
      fechaFinRetiro: "2024-12-13",
      observaciones: "Fiebre leve",
    },
  ],
  medicamentos: [
    { id: "MED-001", nombre: "Ivermectina 1%", stock: 36, unidad: "frasco", fechaVencimiento: "2025-02-20" },
    { id: "MED-002", nombre: "Clostridiosis 8 vías", stock: 18, unidad: "frasco", fechaVencimiento: "2025-05-12" },
    { id: "MED-003", nombre: "Oxitetra LA", stock: 9, unidad: "frasco", fechaVencimiento: "2024-12-01" },
  ],
  escenarios: [
    { id: "ESC-001", nombre: "Engorde 2025 Q1", pesoInicial: 280, pesoObjetivo: 420, gdpEsperado: 1.1, costoDiario: 2800, precioVentaEsperado: 1350 },
    { id: "ESC-002", nombre: "Exportación Dorper", pesoInicial: 260, pesoObjetivo: 400, gdpEsperado: 0.95, costoDiario: 2500, precioVentaEsperado: 1400 },
  ],
  ventas: [
    {
      id: "VTA-001",
      animalId: "AN-003",
      fechaVenta: "2024-11-25",
      canalVenta: "Frigorífico",
      pesoVenta: 382,
      precioPorKg: 1400,
      costosSalida: 42000,
      merma: 2.5,
    },
  ],
  costos: [
    { id: "CST-001", animalId: "AN-001", categoria: "alimentacion", descripcion: "Ración Engorde", monto: 95000, fecha: "2024-10-01" },
    { id: "CST-002", lote: "L-02", categoria: "sanidad", descripcion: "Vacunación Brucelosis", monto: 42000, fecha: "2024-09-15" },
    { id: "CST-003", animalId: "AN-003", categoria: "transporte", descripcion: "Salida a planta", monto: 60000, fecha: "2024-11-24" },
  ],
  lotMovements: [
    { id: "LM-001", animalId: "AN-002", fecha: "2024-10-12", loteOrigen: "L-02", loteDestino: "L-03", motivo: "Balancear densidad" },
  ],
  changeRecords: [
    {
      id: "CHG-001",
      animalId: "AN-001",
      fecha: "2024-10-10",
      campo: "precioTotal",
      valorAnterior: "₡540.000",
      valorNuevo: "₡547.000",
    },
  ],
}

export function cloneInitialData(): DataSnapshot {
  return structuredClone(initialData)
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
        (new Date(ultimo.fecha).getTime() - new Date(anterior.fecha).getTime()) /
        (1000 * 60 * 60 * 24)

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

export function getMedicamentosVencimientoProximo(
  medicamentos: MedicamentoStock[],
  dias = 30
): MedicamentoStock[] {
  const hoy = new Date()
  const limite = new Date(hoy.getTime() + dias * 24 * 60 * 60 * 1000)
  return medicamentos.filter(
    (m) =>
      m.fechaVencimiento &&
      new Date(m.fechaVencimiento) >= hoy &&
      new Date(m.fechaVencimiento) <= limite
  )
}

export function hasActiveRetiro(
  eventos: EventoSanitario[],
  animalId: string,
  fechaReferencia: Date = new Date()
): boolean {
  return eventos.some(
    (ev) => ev.animalId === animalId && ev.fechaFinRetiro && new Date(ev.fechaFinRetiro) > fechaReferencia
  )
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
