import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Layout } from '../components/Layout'
import { formatDateTime, getPma, listPazienti, listPazientiChiusi } from '../services/firestore'
import type { Paziente } from '../types'
import { DIMISSIONE_MODALITA_LABELS } from '../types'

export function PazientiElencoPage() {
  const { manifestazioneId, pmaId } = useParams<{
    manifestazioneId: string
    pmaId: string
  }>()

  const [pmaNome, setPmaNome] = useState('')
  const [pazienti, setPazienti] = useState<Paziente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!manifestazioneId || !pmaId) return

    const load = async () => {
      setLoading(true)
      const [pma, allPazienti] = await Promise.all([
        getPma(manifestazioneId, pmaId),
        listPazienti(manifestazioneId, pmaId),
      ])
      setPmaNome(pma?.nome ?? '')
      setPazienti(listPazientiChiusi(allPazienti))
      setLoading(false)
    }

    void load()
  }, [manifestazioneId, pmaId])

  if (!manifestazioneId || !pmaId) return null

  return (
    <Layout
      title="Elenco pazienti"
      subtitle={`PMA ${pmaNome} · Pazienti chiusi`}
      backTo={`/manifestazioni/${manifestazioneId}/pma/${pmaId}`}
      backLabel="Torna al PMA"
    >
      {loading ? (
        <p>Caricamento...</p>
      ) : (
        <Card>
          {pazienti.length === 0 ? (
            <p className="muted">Nessun paziente chiuso.</p>
          ) : (
            <ul className="patient-admin-list">
              {pazienti.map((paziente) => (
                <li key={paziente.id} className="patient-admin-row">
                  <div className="patient-admin-info">
                    <span>
                      #{paziente.progressiveId} {paziente.cognome} {paziente.nome}
                    </span>
                    <span className="muted patient-admin-meta">
                      {paziente.scheda.dimissioni.dimissioneTimestamp
                        ? `Dimesso il ${new Date(paziente.scheda.dimissioni.dimissioneTimestamp).toLocaleString('it-IT')}`
                        : `Registrato il ${formatDateTime(paziente.createdAt)}`}
                      {paziente.scheda.dimissioni.esito
                        ? ` · ${DIMISSIONE_MODALITA_LABELS[paziente.scheda.dimissioni.esito]}`
                        : ''}
                    </span>
                  </div>
                  <div className="row-actions">
                    <Link
                      to={`/manifestazioni/${manifestazioneId}/pma/${pmaId}/pazienti/${paziente.id}`}
                    >
                      <Button variant="secondary">Scheda</Button>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </Layout>
  )
}
