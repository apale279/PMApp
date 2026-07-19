import { PatientCard, PatientDropZone } from './PatientCard'
import { BedMapCanvas } from './BedMapCanvas'
import { getBedDisplaySize, getCanvasSizeForBeds } from '../utils/bedGrid'
import type { BedLayout, Paziente, Pma } from '../types'

interface PmaWorkspaceMapProps {
  pma: Pma
  pazienti: Paziente[]
  manifestazioneId: string
  onDropPatient: (pazienteId: string, zoneId: string) => void
  onTakeWithoutBed: (pazienteId: string) => void
  onDimetti: (pazienteId: string) => void
}

function groupPazienti(pazienti: Paziente[]) {
  const attesa = pazienti.filter((p) => p.aperto && p.stato === 'IN_ATTESA')
  const senzaLetto = pazienti.filter((p) => p.aperto && p.stato === 'IN_CARICO' && !p.bedId)
  const byBed = new Map<string, Paziente>()

  pazienti
    .filter((p) => p.aperto && p.bedId)
    .forEach((p) => byBed.set(p.bedId!, p))

  return { attesa, senzaLetto, byBed }
}

function BedDropTarget({
  bed,
  occupant,
  manifestazioneId,
  pmaId,
  onDropPatient,
  onTakeWithoutBed,
  onDimetti,
}: {
  bed: BedLayout
  occupant?: Paziente
  manifestazioneId: string
  pmaId: string
  onDropPatient: (pazienteId: string, zoneId: string) => void
  onTakeWithoutBed: (pazienteId: string) => void
  onDimetti: (pazienteId: string) => void
}) {
  const { width, height } = getBedDisplaySize(bed)

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = occupant ? 'none' : 'move'
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (occupant) return
    const data = event.dataTransfer.getData('application/x-pmapp-paziente')
    if (data) onDropPatient(data, bed.id)
  }

  return (
    <div
      className={`bed-item bed-item-workspace ${occupant ? 'bed-item-occupied' : 'bed-item-empty'}`}
      style={{
        left: bed.x,
        top: bed.y,
        width,
        height,
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <span className="bed-label">Letto {bed.number}</span>
      {occupant && (
        <PatientCard
          paziente={occupant}
          manifestazioneId={manifestazioneId}
          pmaId={pmaId}
          compact
          onTakeWithoutBed={onTakeWithoutBed}
          onDimetti={onDimetti}
        />
      )}
    </div>
  )
}

export function PmaWorkspaceMap({
  pma,
  pazienti,
  manifestazioneId,
  onDropPatient,
  onTakeWithoutBed,
  onDimetti,
}: PmaWorkspaceMapProps) {
  const { attesa, senzaLetto, byBed } = groupPazienti(pazienti)
  const canvasSize = getCanvasSizeForBeds(pma.beds)

  const cardProps = {
    manifestazioneId,
    pmaId: pma.id,
    onTakeWithoutBed,
    onDimetti,
  }

  return (
    <div className="pma-workspace">
      <aside className="pma-sidebar">
        <PatientDropZone
          zoneId="waiting"
          label="In attesa"
          hint="Trascina qui i pazienti da mettere in attesa."
          onDropPatient={onDropPatient}
          className="drop-zone-waiting drop-zone-sidebar"
        >
          {attesa.length === 0 ? (
            <p className="drop-zone-empty">Nessun paziente in attesa</p>
          ) : (
            attesa.map((paziente) => (
              <PatientCard key={paziente.id} paziente={paziente} {...cardProps} />
            ))
          )}
        </PatientDropZone>
      </aside>

      <div className="pma-main">
        <section className="bed-map-section">
          <div className="drop-zone-header">
            <h3>Mappa letti</h3>
            <p className="muted">Trascina un paziente su un letto libero per prenderlo in carico.</p>
          </div>
          {pma.layoutConfigured ? (
            <BedMapCanvas width={canvasSize.width} height={canvasSize.height}>
              {pma.beds.map((bed) => (
                <BedDropTarget
                  key={bed.id}
                  bed={bed}
                  occupant={byBed.get(bed.id)}
                  manifestazioneId={manifestazioneId}
                  pmaId={pma.id}
                  onDropPatient={onDropPatient}
                  onTakeWithoutBed={onTakeWithoutBed}
                  onDimetti={onDimetti}
                />
              ))}
            </BedMapCanvas>
          ) : (
            <p className="muted">Layout letti non configurato. Modifica il PMA per impostarlo.</p>
          )}
        </section>

        <PatientDropZone
          zoneId="no-bed"
          label="In carico senza letto"
          hint="Visite o pazienti in carico senza posto letto assegnato."
          onDropPatient={onDropPatient}
          className="drop-zone-no-bed"
        >
          {senzaLetto.length === 0 ? (
            <p className="drop-zone-empty">Nessun paziente senza letto</p>
          ) : (
            senzaLetto.map((paziente) => (
              <PatientCard key={paziente.id} paziente={paziente} {...cardProps} />
            ))
          )}
        </PatientDropZone>
      </div>
    </div>
  )
}
