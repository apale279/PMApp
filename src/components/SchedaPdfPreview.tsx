import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Paziente, PazienteScheda, PmaSettings } from '../types'
import { Button } from './Button'
import { SchedaPdfDocument } from './SchedaPdfDocument'
import {
  buildSchedaMailto,
  buildSchedaPdfFilename,
  downloadPdfBlob,
  generateSchedaPdfBlob,
} from '../utils/schedaPdf'

interface SchedaPdfPreviewProps {
  open: boolean
  onClose: () => void
  paziente: Paziente
  scheda: PazienteScheda
  settings: PmaSettings
  pmaNome: string
  manifestazioneNome: string
  nome: string
  cognome: string
  registratoIl: string
}

export function SchedaPdfPreview({
  open,
  onClose,
  paziente,
  scheda,
  settings,
  pmaNome,
  manifestazioneNome,
  nome,
  cognome,
  registratoIl,
}: SchedaPdfPreviewProps) {
  const sourceRef = useRef<HTMLDivElement>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setPdfUrl(null)
      setPdfBlob(null)
      setError(null)
      return
    }

    const generate = async () => {
      const element = sourceRef.current
      if (!element) return

      setGenerating(true)
      setError(null)
      try {
        const blob = await generateSchedaPdfBlob(element)
        const url = URL.createObjectURL(blob)
        setPdfBlob(blob)
        setPdfUrl(url)
      } catch {
        setError('Impossibile generare il PDF.')
      } finally {
        setGenerating(false)
      }
    }

    const timer = window.setTimeout(() => {
      void generate()
    }, 150)

    return () => window.clearTimeout(timer)
  }, [open, paziente.progressiveId, cognome, nome, scheda, settings, pmaNome, manifestazioneNome])

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  const filename = buildSchedaPdfFilename(paziente.progressiveId, cognome, nome)

  const handlePrint = () => {
    if (!pdfUrl) return
    const printWindow = window.open(pdfUrl, '_blank')
    printWindow?.focus()
    printWindow?.print()
  }

  const handleDownload = () => {
    if (!pdfBlob) return
    downloadPdfBlob(pdfBlob, filename)
  }

  const handleMail = () => {
    const email = scheda.anagrafica.mail.trim()
    if (!email) {
      window.alert('Inserisci la mail del paziente in anagrafica per inviare la scheda.')
      return
    }
    if (pdfBlob) downloadPdfBlob(pdfBlob, filename)
    window.location.href = buildSchedaMailto(email, paziente.progressiveId, cognome, nome)
  }

  if (!open) return null

  return createPortal(
    <>
      <div className="pdf-preview-backdrop" onClick={onClose} />
      <div className="pdf-preview-modal" role="dialog" aria-modal="true" aria-label="Anteprima PDF scheda">
        <div className="pdf-preview-header">
          <h2>Anteprima PDF</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Chiudi">
            ✕
          </button>
        </div>

        <div className="pdf-preview-body">
          {generating && <p>Generazione PDF in corso…</p>}
          {error && <p className="error-text">{error}</p>}
          {!generating && !error && pdfUrl && (
            <iframe title="Anteprima scheda PDF" src={pdfUrl} className="pdf-preview-frame" />
          )}
        </div>

        <div className="pdf-preview-actions">
          <Button type="button" variant="secondary" disabled={!pdfUrl} onClick={handlePrint}>
            Stampa
          </Button>
          <Button type="button" variant="secondary" disabled={!pdfBlob} onClick={handleDownload}>
            Scarica PDF
          </Button>
          <Button type="button" disabled={!pdfBlob} onClick={handleMail}>
            Invia via mail
          </Button>
        </div>
      </div>

      <div className="pdf-source-container" aria-hidden="true">
        <div ref={sourceRef}>
          <SchedaPdfDocument
            paziente={paziente}
            scheda={scheda}
            settings={settings}
            pmaNome={pmaNome}
            manifestazioneNome={manifestazioneNome}
            nome={nome}
            cognome={cognome}
            registratoIl={registratoIl}
          />
        </div>
      </div>
    </>,
    document.body,
  )
}
