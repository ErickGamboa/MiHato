"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import {
  type Animal,
  type ChangeRecord,
  type Costo,
  type DataSnapshot,
  type Escenario,
  type EventoSanitario,
  type Insumo,
  type LotMovement,
  type MedicamentoStock,
  type Pesaje,
  type Racion,
  type Venta,
  cloneInitialData,
} from "@/lib/data"

type CreateAnimalInput = Omit<Animal, "historialLotes" | "historialCambios"> & {
  id?: string
}

type CreatePesajeInput = Omit<Pesaje, "id"> & { id?: string }
type CreateInsumoInput = Omit<Insumo, "id"> & { id?: string }
type CreateEventoInput = Omit<EventoSanitario, "id"> & { id?: string }
type CreateRacionInput = Omit<Racion, "id"> & { id?: string }
type CreateEscenarioInput = Omit<Escenario, "id"> & { id?: string }
type CreateVentaInput = Omit<Venta, "id"> & { id?: string }
type CreateCostoInput = Omit<Costo, "id"> & { id?: string }
type CreateLotMovementInput = Omit<LotMovement, "id"> & { id?: string }
type CreateChangeRecordInput = Omit<ChangeRecord, "id"> & { id?: string }

interface DataStoreValue extends DataSnapshot {
  loading: boolean
  createAnimal: (animal: CreateAnimalInput) => Animal
  updateAnimal: (id: string, updates: Partial<Animal>) => void
  createPesaje: (pesaje: CreatePesajeInput) => Pesaje
  createInsumo: (insumo: CreateInsumoInput) => Insumo
  updateInsumo: (id: string, updates: Partial<Insumo>) => void
  createEvento: (evento: CreateEventoInput) => EventoSanitario
  createMedicamento: (med: MedicamentoStock) => void
  updateMedicamento: (id: string, updates: Partial<MedicamentoStock>) => void
  createRacion: (racion: CreateRacionInput) => Racion
  createEscenario: (escenario: CreateEscenarioInput) => Escenario
  createVenta: (venta: CreateVentaInput) => Venta
  createCosto: (costo: CreateCostoInput) => Costo
  createLotMovement: (movement: CreateLotMovementInput) => LotMovement
  createChangeRecord: (record: CreateChangeRecordInput) => ChangeRecord
  isIdentifierDuplicated: (diio?: string, idSubasta?: string, excludeId?: string) => boolean
}

const DataStoreContext = createContext<DataStoreValue | null>(null)

function nextId(collection: { id: string }[], prefix: string, digits = 3) {
  const numbers = collection
    .map((item) => {
      if (!item.id.startsWith(prefix)) return 0
      const [, value] = item.id.split("-")
      return Number.parseInt(value || "0", 10)
    })
    .filter((num) => !Number.isNaN(num))
  const max = numbers.length > 0 ? Math.max(...numbers) : 0
  return `${prefix}-${String(max + 1).padStart(digits, "0")}`
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataSnapshot>(() => cloneInitialData())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 350)
    return () => clearTimeout(timeout)
  }, [])

  const createAnimal = (input: CreateAnimalInput): Animal => {
    const id = input.id ?? nextId(state.animales, "AN")
    const newAnimal: Animal = {
      ...input,
      id,
      historialCambios: [],
      historialLotes: [],
    }
    setState((prev) => ({ ...prev, animales: [...prev.animales, newAnimal] }))
    return newAnimal
  }

  const updateAnimal = (id: string, updates: Partial<Animal>) => {
    setState((prev) => ({
      ...prev,
      animales: prev.animales.map((animal) => (animal.id === id ? { ...animal, ...updates } : animal)),
    }))
  }

  const createPesaje = (input: CreatePesajeInput): Pesaje => {
    const id = input.id ?? nextId(state.pesajes, "P")
    const pesaje: Pesaje = { ...input, id }
    setState((prev) => ({ ...prev, pesajes: [...prev.pesajes, pesaje] }))
    return pesaje
  }

  const createInsumo = (input: CreateInsumoInput): Insumo => {
    const id = input.id ?? nextId(state.insumos, "INS")
    const insumo: Insumo = { ...input, id }
    setState((prev) => ({ ...prev, insumos: [...prev.insumos, insumo] }))
    return insumo
  }

  const updateInsumo = (id: string, updates: Partial<Insumo>) => {
    setState((prev) => ({
      ...prev,
      insumos: prev.insumos.map((ins) => (ins.id === id ? { ...ins, ...updates } : ins)),
    }))
  }

  const createEvento = (input: CreateEventoInput): EventoSanitario => {
    const id = input.id ?? nextId(state.eventos, "EV")
    const evento: EventoSanitario = { ...input, id }
    setState((prev) => ({ ...prev, eventos: [...prev.eventos, evento] }))
    return evento
  }

  const createMedicamento = (med: MedicamentoStock) => {
    setState((prev) => ({ ...prev, medicamentos: [...prev.medicamentos, med] }))
  }

  const updateMedicamento = (id: string, updates: Partial<MedicamentoStock>) => {
    setState((prev) => ({
      ...prev,
      medicamentos: prev.medicamentos.map((med) => (med.id === id ? { ...med, ...updates } : med)),
    }))
  }

  const createRacion = (input: CreateRacionInput): Racion => {
    const id = input.id ?? nextId(state.raciones, "RAC")
    const racion: Racion = { ...input, id }
    setState((prev) => ({ ...prev, raciones: [...prev.raciones, racion] }))
    return racion
  }

  const createEscenario = (input: CreateEscenarioInput): Escenario => {
    const id = input.id ?? nextId(state.escenarios, "ESC")
    const escenario: Escenario = { ...input, id }
    setState((prev) => ({ ...prev, escenarios: [...prev.escenarios, escenario] }))
    return escenario
  }

  const createVenta = (input: CreateVentaInput): Venta => {
    const id = input.id ?? nextId(state.ventas, "VTA")
    const venta: Venta = { ...input, id }
    setState((prev) => ({
      ...prev,
      ventas: [...prev.ventas, venta],
      animales: prev.animales.map((animal) =>
        animal.id === venta.animalId ? { ...animal, estado: "vendido" } : animal
      ),
    }))
    return venta
  }

  const createCosto = (input: CreateCostoInput): Costo => {
    const id = input.id ?? nextId(state.costos, "CST")
    const costo: Costo = { ...input, id }
    setState((prev) => ({ ...prev, costos: [...prev.costos, costo] }))
    return costo
  }

  const createLotMovement = (input: CreateLotMovementInput): LotMovement => {
    const id = input.id ?? nextId(state.lotMovements, "LM")
    const movement: LotMovement = { ...input, id }
    setState((prev) => ({ ...prev, lotMovements: [...prev.lotMovements, movement] }))
    return movement
  }

  const createChangeRecord = (input: CreateChangeRecordInput): ChangeRecord => {
    const id = input.id ?? nextId(state.changeRecords, "CHG")
    const record: ChangeRecord = { ...input, id }
    setState((prev) => ({ ...prev, changeRecords: [...prev.changeRecords, record] }))
    return record
  }

  const isIdentifierDuplicated = (diio?: string, idSubasta?: string, excludeId?: string): boolean => {
    if (!diio && !idSubasta) return false
    return state.animales.some((animal) => {
      if (excludeId && animal.id === excludeId) return false
      if (diio && animal.diio === diio) return true
      if (idSubasta && animal.idSubasta === idSubasta) return true
      return false
    })
  }

  const value = useMemo<DataStoreValue>(
    () => ({
      ...state,
      loading,
      createAnimal,
      updateAnimal,
      createPesaje,
      createInsumo,
      updateInsumo,
      createEvento,
      createMedicamento,
      updateMedicamento,
      createRacion,
      createEscenario,
      createVenta,
      createCosto,
      createLotMovement,
      createChangeRecord,
      isIdentifierDuplicated,
    }),
    [state, loading]
  )

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>
}

export function useDataStore() {
  const context = useContext(DataStoreContext)
  if (!context) {
    throw new Error("useDataStore must be used within DataProvider")
  }
  return context
}
