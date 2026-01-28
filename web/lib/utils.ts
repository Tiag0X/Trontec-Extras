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

export function extractHour(val: any): number {
  const v = String(val).trim()
  if (!v || ["nan", "none", "", "nat"].includes(v.toLowerCase())) return -1;
  try {
    const timePart = v.includes(" ") ? v.split(" ")[1] : v;
    if (timePart.includes(":")) {
      return parseInt(timePart.split(":")[0], 10);
    }
  } catch { }
  return -1;
}

export function parseSheetDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  // Tentar formato ISO yyyy-mm-dd
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(dateStr)
  }
  // Tentar formato BR dd/mm/yyyy
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/')
    if (parts.length === 3) {
      // assumindo dia/mes/ano
      return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`)
    }
  }
  return null
}


