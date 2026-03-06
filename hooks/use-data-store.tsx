"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

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
  differenceInDays,
  fetchDataSnapshot,
  getCostaRicaNow,
  isAfterDate,
  toCostaRicaDate,
  createAnimalRecord as createAnimalDb,
  updateAnimalRecord as updateAnimalDb,
  createPesajeRecord,
  createInsumoRecord,
  updateInsumoRecord,
  deleteInsumoRecord,
  createEventoRecord,
  createMedicamentoRecord,
  updateMedicamentoRecord,
  createRacionRecord,
  updateRacionRecord,
  deleteRacionRecord,
  isAnimalIdentifierDuplicated,
  createEscenarioRecord,
  createVentaRecord,
  createCostoRecord,
  createLotMovementRecord,
  createChangeRecordEntry,
} from "@/lib/data"

type CreateAnimalInput = Omit<Animal, "historialLotes" | "historialCambios" | "id"> & { id?: string }
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
  refresh: () => Promise<void>
  createAnimal: (animal: CreateAnimalInput) => Promise<Animal>
  updateAnimal: (id: string, updates: Partial<Animal>) => Promise<Animal>
  createPesaje: (pesaje: CreatePesajeInput) => Promise<Pesaje>
  createInsumo: (insumo: CreateInsumoInput) => Promise<Insumo>
  updateInsumo: (id: string, updates: Partial<Insumo>) => Promise<Insumo>
  deleteInsumo: (id: string) => Promise<void>
  adjustInsumoStock: (id: string, delta: number) => Promise<void>
  createEvento: (evento: CreateEventoInput) => Promise<EventoSanitario>
  createMedicamento: (med: MedicamentoStock) => Promise<MedicamentoStock>
  updateMedicamento: (id: string, updates: Partial<MedicamentoStock>) => Promise<MedicamentoStock>
  createRacion: (racion: CreateRacionInput) => Promise<Racion>
  updateRacion: (id: string, updates: Partial<Racion>) => Promise<Racion>
  deleteRacion: (id: string) => Promise<void>
  toggleRacion: (id: string, activa: boolean) => Promise<Racion>
  autoConsumeRaciones: (fechaReferencia?: Date) => Promise<void>
  deactivateExpiredRaciones: (fechaReferencia?: Date) => Promise<void>
  createEscenario: (escenario: CreateEscenarioInput) => Promise<Escenario>
  createVenta: (venta: CreateVentaInput) => Promise<Venta>
  createCosto: (costo: CreateCostoInput) => Promise<Costo>
  createLotMovement: (movement: CreateLotMovementInput) => Promise<LotMovement>
  createChangeRecord: (record: CreateChangeRecordInput) => Promise<ChangeRecord>
  isIdentifierDuplicated: (diio?: string, idSubasta?: string, excludeId?: string) => Promise<boolean>
}

const DataStoreContext = createContext<DataStoreValue | null>(null)

const createEmptySnapshot = (): DataSnapshot => ({
  animales: [],
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
})

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DataSnapshot>(createEmptySnapshot)
  const [loading, setLoading] = useState(true)

  const loadSnapshot = useCallback(async (showSpinner = false) => {
    if (showSpinner) setLoading(true)
    try {
      const snapshot = await fetchDataSnapshot()
      setState(snapshot)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSnapshot(true)
  }, [loadSnapshot])

  const refresh = useCallback(async () => {
    await loadSnapshot(false)
  }, [loadSnapshot])

  const createAnimal = useCallback(
    async (input: CreateAnimalInput) => {
      const record = await createAnimalDb(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const updateAnimal = useCallback(
    async (id: string, updates: Partial<Animal>) => {
      const record = await updateAnimalDb(id, updates)
      await refresh()
      return record
    },
    [refresh]
  )

  const createPesaje = useCallback(
    async (input: CreatePesajeInput) => {
      const record = await createPesajeRecord(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const createInsumo = useCallback(
    async (input: CreateInsumoInput) => {
      const record = await createInsumoRecord(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const updateInsumo = useCallback(
    async (id: string, updates: Partial<Insumo>) => {
      const record = await updateInsumoRecord(id, updates)
      await refresh()
      return record
    },
    [refresh]
  )

  const deleteInsumo = useCallback(
    async (id: string) => {
      await deleteInsumoRecord(id)
      await refresh()
    },
    [refresh]
  )

  const adjustInsumoStock = useCallback(
    async (id: string, delta: number) => {
      const insumo = state.insumos.find((i) => i.id === id)
      if (!insumo) return
      const nuevoStock = Math.max(0, Math.round((insumo.stock + delta) * 100) / 100)
      await updateInsumoRecord(id, { stock: nuevoStock })
      await refresh()
    },
    [refresh, state.insumos]
  )

  const createEvento = useCallback(
    async (input: CreateEventoInput) => {
      const record = await createEventoRecord(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const createMedicamento = useCallback(
    async (med: MedicamentoStock) => {
      const record = await createMedicamentoRecord(med)
      await refresh()
      return record
    },
    [refresh]
  )

  const updateMedicamento = useCallback(
    async (id: string, updates: Partial<MedicamentoStock>) => {
      const record = await updateMedicamentoRecord(id, updates)
      await refresh()
      return record
    },
    [refresh]
  )

  const createRacion = useCallback(
    async (input: CreateRacionInput) => {
      const last = input.fechaInicio ? toCostaRicaDate(input.fechaInicio).toISOString() : getCostaRicaNow().toISOString()
      const record = await createRacionRecord({
        ...input,
        activa: input.activa ?? true,
        ultimoConsumo: input.ultimoConsumo ?? last,
        motivoDesactivacion: input.motivoDesactivacion ?? null,
      })
      await refresh()
      return record
    },
    [refresh]
  )

  const updateRacion = useCallback(
    async (id: string, updates: Partial<Racion>) => {
      const record = await updateRacionRecord(id, updates)
      await refresh()
      return record
    },
    [refresh]
  )

  const deleteRacion = useCallback(
    async (id: string) => {
      await deleteRacionRecord(id)
      await refresh()
    },
    [refresh]
  )

  const toggleRacion = useCallback(
    async (id: string, activa: boolean) => {
      const payload: Partial<Racion> = {
        activa,
        motivoDesactivacion: activa ? null : "stock",
      }
      if (activa) {
        payload.ultimoConsumo = getCostaRicaNow().toISOString()
      }
      const record = await updateRacionRecord(id, payload)
      await refresh()
      return record
    },
    [refresh]
  )

  const autoConsumeRaciones = useCallback(
    async (fechaReferencia?: Date) => {
      const now = fechaReferencia ?? getCostaRicaNow()
      const animalsPerLot = state.animales
        .filter((animal) => animal.estado === "activo")
        .reduce<Record<string, number>>((acc, animal) => {
          acc[animal.lote] = (acc[animal.lote] || 0) + 1
          return acc
        }, {})

      const insumoAdjustments = new Map<string, number>()
      const racionUpdates: { id: string; updates: Partial<Racion> }[] = []

      for (const racion of state.raciones) {
        if (!racion.activa) continue

        if (racion.fechaFin) {
          const fin = toCostaRicaDate(racion.fechaFin)
          if (isAfterDate(now, fin)) {
            racionUpdates.push({ id: racion.id, updates: { activa: false, motivoDesactivacion: "fecha_fin" } })
            continue
          }
        }

        const last = racion.ultimoConsumo ? new Date(racion.ultimoConsumo) : toCostaRicaDate(racion.fechaInicio)
        const pendingDays = differenceInDays(last, now)
        if (pendingDays < 1) continue

        const animalsCount = animalsPerLot[racion.lote] ?? 0
        if (animalsCount === 0) {
          racionUpdates.push({ id: racion.id, updates: { ultimoConsumo: now.toISOString() } })
          continue
        }

        const consumos = racion.insumos.map((ri) => ({
          insumoId: ri.insumoId,
          total: ri.kgPorAnimalDia * animalsCount * pendingDays,
        }))

        const hasStock = consumos.every(({ insumoId, total }) => {
          const insumo = state.insumos.find((i) => i.id === insumoId)
          return insumo ? insumo.stock >= total : false
        })

        if (!hasStock) {
          racionUpdates.push({ id: racion.id, updates: { activa: false, motivoDesactivacion: "stock" } })
          continue
        }

        consumos.forEach(({ insumoId, total }) => {
          insumoAdjustments.set(insumoId, (insumoAdjustments.get(insumoId) ?? 0) - total)
        })
        racionUpdates.push({ id: racion.id, updates: { ultimoConsumo: now.toISOString(), motivoDesactivacion: null } })
      }

      const insumoPromises = Array.from(insumoAdjustments.entries()).map(([insumoId, delta]) => {
        const insumo = state.insumos.find((i) => i.id === insumoId)
        if (!insumo) return null
        const nuevo = Math.max(0, Math.round((insumo.stock + delta) * 100) / 100)
        return updateInsumoRecord(insumoId, { stock: nuevo })
      }).filter(Boolean) as Promise<Insumo>[]

      const racionPromises = racionUpdates.map(({ id, updates }) => updateRacionRecord(id, updates))

      if (insumoPromises.length === 0 && racionPromises.length === 0) return
      await Promise.all([...insumoPromises, ...racionPromises])
      await refresh()
    },
    [refresh, state.animales, state.insumos, state.raciones]
  )

  const deactivateExpiredRaciones = useCallback(
    async (fechaReferencia?: Date) => {
      const now = fechaReferencia ?? getCostaRicaNow()
      const expired = state.raciones.filter((racion) => racion.fechaFin && isAfterDate(now, toCostaRicaDate(racion.fechaFin)) && racion.activa)
      if (expired.length === 0) return
      await Promise.all(expired.map((racion) => updateRacionRecord(racion.id, { activa: false, motivoDesactivacion: "fecha_fin" })))
      await refresh()
    },
    [refresh, state.raciones]
  )

  const createEscenario = useCallback(
    async (input: CreateEscenarioInput) => {
      const record = await createEscenarioRecord(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const createVenta = useCallback(
    async (input: CreateVentaInput) => {
      const record = await createVentaRecord(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const createCosto = useCallback(
    async (input: CreateCostoInput) => {
      const record = await createCostoRecord(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const createLotMovement = useCallback(
    async (input: CreateLotMovementInput) => {
      const record = await createLotMovementRecord(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const createChangeRecord = useCallback(
    async (input: CreateChangeRecordInput) => {
      const record = await createChangeRecordEntry(input)
      await refresh()
      return record
    },
    [refresh]
  )

  const isIdentifierDuplicated = useCallback(async (diio?: string, idSubasta?: string, excludeId?: string) => {
    return isAnimalIdentifierDuplicated(diio, idSubasta, excludeId)
  }, [])

  const value = useMemo<DataStoreValue>(
    () => ({
      ...state,
      loading,
      refresh,
      createAnimal,
      updateAnimal,
      createPesaje,
      createInsumo,
      updateInsumo,
      deleteInsumo,
      adjustInsumoStock,
      createEvento,
      createMedicamento,
      updateMedicamento,
      createRacion,
      updateRacion,
      deleteRacion,
      toggleRacion,
      autoConsumeRaciones,
      deactivateExpiredRaciones,
      createEscenario,
      createVenta,
      createCosto,
      createLotMovement,
      createChangeRecord,
      isIdentifierDuplicated,
    }),
    [state, loading, refresh, createAnimal, updateAnimal, createPesaje, createInsumo, updateInsumo, adjustInsumoStock, createEvento, createMedicamento, updateMedicamento, createRacion, updateRacion, toggleRacion, autoConsumeRaciones, deactivateExpiredRaciones, createEscenario, createVenta, createCosto, createLotMovement, createChangeRecord, isIdentifierDuplicated]
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
