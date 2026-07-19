import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Layout } from '../components/Layout'
import { PmaWorkspaceMap } from '../components/PmaWorkspaceMap'
import {
  applyPatientDismissed,
  applyPatientPlacement,
  dimettiPaziente,
  getManifestazione,
  getPma,
  listPazienti,
  listPazientiAperti,
  movePaziente,
  takeInChargeWithoutBed,
} from '../services/firestore'
import type { Manifestazione, Paziente, Pma } from '../types'

export function PmaPage() {
  const { manifestazioneId, pmaId } = useParams<{
    manifestazioneId: string
    pmaId: string
  }>()

  const [manifestazione, setManifestazione] = useState<Manifestazione | null>(null)
  const [pma, setPma] = useState<Pma | null>(null)
  const [pazienti, setPazienti] = useState<Paziente[]>([])
  const [initialLoading, setInitialLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!manifestazioneId || !pmaId) return

    const load = async () => {
      setInitialLoading(true)
      const [manifestazioneData, pmaData, pazientiData] = await Promise.all([
        getManifestazione(manifestazioneId),
        getPma(manifestazioneId, pmaId),
        listPazienti(manifestazioneId, pmaId),
      ])
      setManifestazione(manifestazioneData)
      setPma(pmaData)
      setPazienti(pazientiData)
      setInitialLoading(false)
    }

    void load()
  }, [manifestazioneId, pmaId])

  const runPatientAction = async (
    action: () => Promise<void>,
    optimisticUpdate?: (current: Paziente[]) => Paziente[],
  ) => {
    const snapshot = pazienti
    if (optimisticUpdate) {
      setPazienti(optimisticUpdate(pazienti))
    }
    setActionError(null)

    try {
      await action()
    } catch (error) {
      setPazienti(snapshot)
      setActionError(error instanceof Error ? error.message : 'Operazione non riuscita.')
    }
  }

  const handleDropPatient = (pazienteId: string, zoneId: string) => {
    if (!manifestazioneId || !pmaId) return
    void runPatientAction(
      () => movePaziente(manifestazioneId, pmaId, pazienteId, zoneId),
      (current) => applyPatientPlacement(current, pazienteId, zoneId),
    )
  }

  const handleTakeWithoutBed = (pazienteId: string) => {
    if (!manifestazioneId || !pmaId) return
    void runPatientAction(
      () => takeInChargeWithoutBed(manifestazioneId, pmaId, pazienteId),
      (current) => applyPatientPlacement(current, pazienteId, 'no-bed'),
    )
  }

  const handleDimetti = (pazienteId: string) => {
    if (!manifestazioneId || !pmaId) return
    const paziente = pazienti.find((p) => p.id === pazienteId)
    if (!paziente) return
    const confirmed = window.confirm(
      `Dimettere ${paziente.cognome} ${paziente.nome}? Il paziente risulterà chiuso (APERTO = no).`,
    )
    if (!confirmed) return
    void runPatientAction(
      () => dimettiPaziente(manifestazioneId, pmaId, pazienteId),
      (current) => applyPatientDismissed(current, pazienteId),
    )
  }

  const pazientiAperti = listPazientiAperti(pazienti)

  if (!manifestazioneId || !pmaId) return null

  return (
    <Layout
      wide
      title={pma?.nome ?? 'PMA'}
      subtitle={`${manifestazione?.nome ?? ''}${pma?.dettagli ? ` · ${pma.dettagli}` : ''}`}
      backTo={`/manifestazioni/${manifestazioneId}`}
      backLabel="Manifestazione"
      actions={
        <div className="page-actions-row">
          <Link to={`/manifestazioni/${manifestazioneId}/pma/${pmaId}/pazienti/nuovo`}>
            <Button>Nuovo paziente</Button>
          </Link>
          <Link to={`/manifestazioni/${manifestazioneId}/pma/${pmaId}/pazienti/elenco`}>
            <Button variant="secondary">Elenco pazienti</Button>
          </Link>
          <Link to={`/manifestazioni/${manifestazioneId}/pma/${pmaId}/impostazioni`}>
            <Button variant="secondary">Impostazioni</Button>
          </Link>
          <Link to={`/manifestazioni/${manifestazioneId}/pma/${pmaId}/modifica`}>
            <Button variant="secondary">Modifica PMA</Button>
          </Link>
        </div>
      }
    >
      {initialLoading ? (
        <p>Caricamento...</p>
      ) : !pma ? (
        <p className="error-text">PMA non trovato.</p>
      ) : (
        <div className="pma-workspace-page">
          {actionError && <p className="error-text">{actionError}</p>}

          <PmaWorkspaceMap
            pma={pma}
            pazienti={pazientiAperti}
            manifestazioneId={manifestazioneId}
            onDropPatient={handleDropPatient}
            onTakeWithoutBed={handleTakeWithoutBed}
            onDimetti={handleDimetti}
          />
        </div>
      )}
    </Layout>
  )
}
