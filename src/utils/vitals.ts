export function numberToInput(value: number | null | undefined): string {
  if (value === null || value === undefined) return ''
  return String(value)
}

export function inputToNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

export function calculatePam(paSis: number | null, paDias: number | null): number | null {
  if (paSis === null || paDias === null) return null
  return Math.round((paSis + 2 * paDias) / 3)
}

export function calculateAge(dataNascita: string): number | null {
  if (!dataNascita) return null
  const birth = new Date(dataNascita)
  if (Number.isNaN(birth.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 0 ? age : null
}

export function nowDatetimeLocal(): string {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

export function formatPamDisplay(paSis: number | null, paDias: number | null): string {
  const pam = calculatePam(paSis, paDias)
  return pam === null ? '—' : String(pam)
}
