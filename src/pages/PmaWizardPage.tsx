import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BedLayoutEditor } from '../components/BedLayoutEditor'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Layout } from '../components/Layout'
import {
  createInitialBeds,
  createPma,
  getManifestazione,
  isPmaNameTaken,
  savePmaLayout,
} from '../services/firestore'
import type { BedLayout } from '../types'
import { getCanvasSizeForBeds, normalizeBedsOnGrid } from '../utils/bedGrid'

type WizardStep = 'info' | 'layout'

export function PmaWizardPage() {
  const { manifestazioneId } = useParams<{ manifestazioneId: string }>()
  const navigate = useNavigate()

  const [step, setStep] = useState<WizardStep>('info')
  const [nome, setNome] = useState('')
  const [dettagli, setDettagli] = useState('')
  const [numeroLetti, setNumeroLetti] = useState(4)
  const [beds, setBeds] = useState<BedLayout[]>([])
  const [pmaId, setPmaId] = useState<string | null>(null)
  const [manifestazioneNome, setManifestazioneNome] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!manifestazioneId) return null

  const handleInfoSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const manifestazione = await getManifestazione(manifestazioneId)
      if (!manifestazione) {
        setError('Manifestazione non trovata.')
        return
      }
      setManifestazioneNome(manifestazione.nome)

      const taken = await isPmaNameTaken(manifestazioneId, nome)
      if (taken) {
        setError('Esiste già un PMA con questo nome in questa manifestazione.')
        return
      }

      const newPmaId = await createPma(manifestazioneId, {
        nome,
        dettagli,
        numeroLetti,
      })
      setPmaId(newPmaId)
      setBeds(createInitialBeds(numeroLetti))
      setStep('layout')
    } catch {
      setError('Errore durante la creazione del PMA.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLayout = async () => {
    if (!pmaId) return
    setLoading(true)
    setError(null)
    try {
      const canvasSize = getCanvasSizeForBeds(beds)
      await savePmaLayout(
        manifestazioneId,
        pmaId,
        normalizeBedsOnGrid(beds, canvasSize.width, canvasSize.height),
      )
      navigate(`/manifestazioni/${manifestazioneId}/pma/${pmaId}`)
    } catch {
      setError('Errore durante il salvataggio del layout.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout
      title="Nuovo PMA"
      subtitle={`Manifestazione: ${manifestazioneNome || '...'}`}
      backTo={`/manifestazioni/${manifestazioneId}`}
      backLabel="Manifestazione"
    >
      <div className="wizard-steps">
        <span className={step === 'info' ? 'step-active' : ''}>1. Dati PMA</span>
        <span className={step === 'layout' ? 'step-active' : ''}>2. Mappa letti</span>
      </div>

      {step === 'info' && (
        <Card>
          <h2>Configurazione PMA</h2>
          <form className="stack-form" onSubmit={handleInfoSubmit}>
            <label>
              Nome PMA (univoco)
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Es. PMA Arrivo"
                required
              />
            </label>
            <label>
              Dettagli
              <textarea
                value={dettagli}
                onChange={(event) => setDettagli(event.target.value)}
                placeholder="Posizione, note operative, team..."
                rows={4}
              />
            </label>
            <label>
              Numero di letti
              <input
                type="number"
                min={1}
                max={50}
                value={numeroLetti}
                onChange={(event) => setNumeroLetti(Number(event.target.value) || 1)}
                required
              />
            </label>
            <div className="form-actions">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creazione...' : 'Continua al layout letti'}
              </Button>
            </div>
          </form>
          {error && <p className="error-text">{error}</p>}
        </Card>
      )}

      {step === 'layout' && (
        <Card>
          <h2>Area di lavoro PMA</h2>
          <p className="muted">
            Disponi e numera i {beds.length} letti. Questa sarà la vista predefinita del PMA.
          </p>
          <BedLayoutEditor
            beds={beds}
            onChange={setBeds}
            onSave={handleSaveLayout}
            saving={loading}
          />
          {error && <p className="error-text">{error}</p>}
        </Card>
      )}
    </Layout>
  )
}
