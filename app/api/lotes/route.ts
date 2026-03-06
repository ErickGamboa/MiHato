import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const lotesTable = () => supabaseAdmin.schema("bovinos").from("lotes")

export async function GET() {
  const { data, error } = await lotesTable().select("*").order("nombre")
  if (error) {
    console.error("Error fetching lotes", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json((data ?? []).map((row) => ({ ...row, persisted: true })))
}

export async function POST(request: Request) {
  const body = await request.json()
  const nombre = (body?.nombre as string | undefined)?.trim()
  if (!nombre) {
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 })
  }
  const capacidadValue = body?.capacidad
  let capacidad: number | null = null
  if (capacidadValue !== undefined && capacidadValue !== null && capacidadValue !== "") {
    capacidad = Number(capacidadValue)
    if (Number.isNaN(capacidad)) {
      return NextResponse.json({ error: "Capacidad inválida" }, { status: 400 })
    }
  }
  const payload = {
    nombre,
    descripcion: body?.descripcion ? String(body.descripcion) : null,
    capacidad,
    notas: body?.notas ? String(body.notas) : null,
  }
  const { data, error } = await lotesTable().insert(payload).select().single()
  if (error) {
    console.error("Error creating lote", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ...data, persisted: true }, { status: 201 })
}
