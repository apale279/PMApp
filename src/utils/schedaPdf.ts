import html2pdf from 'html2pdf.js'

const PDF_OPTIONS = {
  margin: [12, 12, 12, 12] as [number, number, number, number],
  image: { type: 'jpeg' as const, quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 },
  jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
  pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as const },
}

export async function generateSchedaPdfBlob(element: HTMLElement): Promise<Blob> {
  return html2pdf().set(PDF_OPTIONS).from(element).outputPdf('blob')
}

export function downloadPdfBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function buildSchedaPdfFilename(progressiveId: number, cognome: string, nome: string): string {
  const safeName = `${cognome}_${nome}`.trim().replace(/\s+/g, '_') || 'paziente'
  return `scheda_${progressiveId}_${safeName}.pdf`
}

export function buildSchedaMailto(
  email: string,
  progressiveId: number,
  cognome: string,
  nome: string,
): string {
  const subject = encodeURIComponent(`Scheda paziente #${progressiveId} ${cognome} ${nome}`.trim())
  const body = encodeURIComponent(
    'In allegato la scheda paziente generata da PMApp.\n\nScarica il PDF dall\'anteprima e allegalo a questa email.',
  )
  return `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`
}
