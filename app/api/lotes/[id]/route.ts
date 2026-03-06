import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const lotesTable = () => supabaseAdmin.schema("bovinos").from("lotes")

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url)
  const idParam = params?.id ?? url.searchParams.get("id") ?? undefined
  if (!idParam || idParam === "undefined") {
    return NextResponse.json({ error: "ID de lote inválido" }, { status: 400 })
  }
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
  const { data, error } = await lotesTable().update(updates).eq("id", idParam).select().single()
  if (error) {
    console.error("Error updating lote", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ...data, persisted: true })
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url)
  const idParam = params?.id ?? url.searchParams.get("id") ?? undefined
  if (!idParam || idParam === "undefined") {
    return NextResponse.json({ error: "ID de lote inválido" }, { status: 400 })
  }
  const { error } = await lotesTable().delete().eq("id", idParam)
  if (error) {
    console.error("Error deleting lote", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
