import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card } from '../components/Card'
import { Layout } from '../components/Layout'
import { createPaziente, getPma } from '../services/firestore'

export function PazienteFormPage() {
  const { manifestazioneId, pmaId } = useParams<{
    manifestazioneId: string
    pmaId: string
  }>()
  const navigate = useNavigate()
  const creatingRef = useRef(false)

  const [pmaNome, setPmaNome] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!manifestazioneId || !pmaId || creatingRef.current) return
    creatingRef.current = true

    const create = async () => {
      try {
        const pma = await getPma(manifestazioneId, pmaId)
        setPmaNome(pma?.nome ?? '')
        const newId = await createPaziente(manifestazioneId, pmaId)
        navigate(
          `/manifestazioni/${manifestazioneId}/pma/${pmaId}/pazienti/${newId}?tab=anagrafica`,
          { replace: true },
        )
      } catch {
        setError('Errore durante la creazione del paziente.')
        creatingRef.current = false
      }
    }

    void create()
  }, [manifestazioneId, pmaId, navigate])

  if (!manifestazioneId || !pmaId) return null

  return (
    <Layout
      title="Nuovo paziente"
      subtitle={`PMA: ${pmaNome}`}
      backTo={`/manifestazioni/${manifestazioneId}/pma/${pmaId}`}
      backLabel="Torna al PMA"
    >
      <Card>
        {error ? (
          <p className="error-text">{error}</p>
        ) : (
          <p className="muted">Creazione paziente in corso…</p>
        )}
      </Card>
    </Layout>
  )
}
