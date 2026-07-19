export function parseLines(text: string): string[] {
  const seen = new Set<string>()
  const values: string[] = []

  text.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || seen.has(trimmed)) return
    seen.add(trimmed)
    values.push(trimmed)
  })

  return values
}

export function linesToText(values: string[]): string {
  return values.join('\n')
}

export function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return parseLines(value)
  }
  return []
}
