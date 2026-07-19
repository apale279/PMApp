import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Layout } from '../components/Layout'
import { getManifestazione, listPmas } from '../services/firestore'
import type { Manifestazione, Pma } from '../types'

export function ManifestazionePage() {
  const { manifestazioneId } = useParams<{ manifestazioneId: string }>()
  const [manifestazione, setManifestazione] = useState<Manifestazione | null>(null)
  const [pmas, setPmas] = useState<Pma[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!manifestazioneId) return

    const load = async () => {
      setLoading(true)
      const [manifestazioneData, pmasData] = await Promise.all([
        getManifestazione(manifestazioneId),
        listPmas(manifestazioneId),
      ])
      setManifestazione(manifestazioneData)
      setPmas(pmasData)
      setLoading(false)
    }

    void load()
  }, [manifestazioneId])

  if (!manifestazioneId) return null

  return (
    <Layout
      title={manifestazione?.nome ?? 'Manifestazione'}
      subtitle="Gestisci i Posti Medici Avanzati di questa manifestazione."
      backTo="/"
      backLabel="Tutte le manifestazioni"
      actions={
        <Link to={`/manifestazioni/${manifestazioneId}/pma/nuovo`}>
          <Button>Nuovo PMA</Button>
        </Link>
      }
    >
      {loading ? (
        <p>Caricamento...</p>
      ) : (
        <Card>
          <h2>PMA ({pmas.length})</h2>
          {pmas.length === 0 ? (
            <p className="muted">Nessun PMA configurato. Crea il primo con il wizard.</p>
          ) : (
            <ul className="item-list">
              {pmas.map((pma) => (
                <li key={pma.id}>
                  <Link
                    to={`/manifestazioni/${manifestazioneId}/pma/${pma.id}`}
                    className="item-link"
                  >
                    <span className="item-title">{pma.nome}</span>
                    <span className="item-meta">
                      {pma.numeroLetti} letti
                      {!pma.layoutConfigured && ' · Layout da completare'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </Layout>
  )
}
