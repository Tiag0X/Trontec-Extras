import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function cleanCurrency(value: string | number): number {
  if (typeof value === 'number') return value
  if (!value) return 0

  const str = value.toString()
  // Remove R$, espaços e converte formato BR (1.000,00) para US (1000.00)
  const cleaned = str.replace("R$", "").trim().replace(/\./g, "").replace(",", ".")
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

export function normalizeBoolean(value: any): "Sim" | "Não" {
  if (!value) return "Não"
  const valStr = String(value).toLowerCase().trim()
  return ["sim", "s", "yes", "true", "1"].includes(valStr) ? "Sim" : "Não"
}
