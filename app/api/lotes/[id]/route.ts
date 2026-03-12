import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const lotesTable = () => supabaseAdmin.schema("bovinos").from("lotes")

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tenantId = request.headers.get("x-tenant-id") ?? undefined
  if (!tenantId) return NextResponse.json({ error: "Falta x-tenant-id" }, { status: 401 })
  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body?.nombre !== undefined) updates.nombre = String(body.nombre)
  if (body?.descripcion !== undefined) updates.descripcion = body.descripcion ? String(body.descripcion) : null
  if (body?.capacidad !== undefined) {
    if (body.capacidad === null || body.capacidad === "") {
      updates.capacidad = null
    } else {
      const parsed = Number(body.capacidad)
      if (Number.isNaN(parsed)) {
        return NextResponse.json({ error: "Capacidad inválida" }, { status: 400 })
      }
      updates.capacidad = parsed
    }
  }
  if (body?.notas !== undefined) updates.notas = body.notas ? String(body.notas) : null
  const { data, error } = await lotesTable().update(updates).eq("id", id).eq("tenant_id", tenantId).select().single()
  if (error) {
    console.error("Error updating lote", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ...data, persisted: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tenantId = request.headers.get("x-tenant-id") ?? undefined
  if (!tenantId) return NextResponse.json({ error: "Falta x-tenant-id" }, { status: 401 })
  const { error } = await lotesTable().delete().eq("id", id).eq("tenant_id", tenantId)
  if (error) {
    console.error("Error deleting lote", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
