import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Animal } from "@/lib/data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAnimalDisplayLabel(animal: Pick<Animal, "id" | "diio" | "apodo">): string {
  const diio = animal.diio?.trim()
  const apodo = animal.apodo?.trim()
  if (diio && apodo) return `${diio} — ${apodo}`
  if (diio) return diio
  if (apodo) return apodo
  return "Animal sin identificación"
}

export function getAnimalSecondaryLabel(animal: Pick<Animal, "diio" | "apodo" | "lote" | "raza">): string {
  const details = [animal.diio || null, animal.raza || null, animal.lote || null].filter(Boolean)
  if (details.length === 0 && animal.apodo) return animal.apodo
  return details.join(" · ") || "Sin datos"
}
