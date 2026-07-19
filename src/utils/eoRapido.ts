import { NEGATIVO_EO } from '../types'

export function toggleEoRapidoDettaglio(selezionati: string[], dettaglio: string): string[] {
  if (dettaglio === NEGATIVO_EO) {
    return ['NEGATIVO']
  }

  if (selezionati.includes(dettaglio)) {
    const next = selezionati.filter((item) => item !== dettaglio)
    return next.length === 0 ? [NEGATIVO_EO] : next
  }

  return [...selezionati.filter((item) => item !== NEGATIVO_EO), dettaglio]
}
