import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BedLayoutEditor } from '../components/BedLayoutEditor'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Layout } from '../components/Layout'
import {
  createInitialBeds,
  getPma,
  isPmaNameTaken,
  resizeBeds,
  savePmaEdit,
} from '../services/firestore'
import type { BedLayout } from '../types'
import { getCanvasSizeForBeds, normalizeBedsOnGrid } from '../utils/bedGrid'

export function PmaEditPage() {
  const { manifestazioneId, pmaId } = useParams<{
    manifestazioneId: string
    pmaId: string
  }>()
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [dettagli, setDettagli] = useState('')
  const [numeroLetti, setNumeroLetti] = useState(4)
  const [beds, setBeds] = useState<BedLayout[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!manifestazioneId || !pmaId) return

    const load = async () => {
      setLoading(true)
      const pma = await getPma(manifestazioneId, pmaId)
      if (pma) {
        setNome(pma.nome)
        setDettagli(pma.dettagli)
        setNumeroLetti(pma.numeroLetti)
        setBeds(pma.beds.length > 0 ? pma.beds : createInitialBeds(pma.numeroLetti))
      }
      setLoading(false)
    }

    void load()
  }, [manifestazioneId, pmaId])

  const handleBedCountChange = (count: number) => {
    const safeCount = Math.max(1, Math.min(50, count))
    setNumeroLetti(safeCount)
    setBeds((current) => resizeBeds(current.length > 0 ? current : createInitialBeds(safeCount), safeCount))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!manifestazioneId || !pmaId) return

    setSaving(true)
    setError(null)

    try {
      const taken = await isPmaNameTaken(manifestazioneId, nome, pmaId)
      if (taken) {
        setError('Esiste già un PMA con questo nome in questa manifestazione.')
        return
      }

      const canvasSize = getCanvasSizeForBeds(beds)
      await savePmaEdit(manifestazioneId, pmaId, {
        nome,
        dettagli,
        numeroLetti,
        beds: normalizeBedsOnGrid(beds, canvasSize.width, canvasSize.height),
      })
      navigate(`/manifestazioni/${manifestazioneId}/pma/${pmaId}`)
    } catch {
      setError('Errore durante il salvataggio del PMA.')
    } finally {
      setSaving(false)
    }
  }

  if (!manifestazioneId || !pmaId) return null

  return (
    <Layout
      title="Modifica PMA"
      subtitle="Aggiorna dati, numero letti e disposizione."
      backTo={`/manifestazioni/${manifestazioneId}/pma/${pmaId}`}
      backLabel="Torna al PMA"
    >
      {loading ? (
        <p className="muted">Caricamento...</p>
      ) : (
        <form className="pma-edit-form" onSubmit={handleSubmit}>
          <Card>
            <h2>Dati PMA</h2>
            <div className="stack-form">
              <label>
                Nome PMA
                <input
                  type="text"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  required
                />
              </label>
              <label>
                Dettagli
                <textarea
                  value={dettagli}
                  onChange={(event) => setDettagli(event.target.value)}
                  rows={3}
                />
              </label>
              <label>
                Numero di letti
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={numeroLetti}
                  onChange={(event) => handleBedCountChange(Number(event.target.value) || 1)}
                  required
                />
              </label>
            </div>
          </Card>

          <Card>
            <h2>Disposizione letti</h2>
            <BedLayoutEditor
              beds={beds}
              onChange={setBeds}
              onSave={() => undefined}
              hideSaveButton
            />
          </Card>

          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
            <Link to={`/manifestazioni/${manifestazioneId}/pma/${pmaId}`}>
              <Button type="button" variant="secondary">
                Annulla
              </Button>
            </Link>
          </div>

          {error && <p className="error-text">{error}</p>}
        </form>
      )}
    </Layout>
  )
}
