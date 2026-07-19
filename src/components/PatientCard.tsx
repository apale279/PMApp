import { Link } from 'react-router-dom'
import { statoLabel } from '../services/firestore'
import type { Paziente } from '../types'

const DRAG_TYPE = 'application/x-pmapp-paziente'

export function setPatientDragData(event: React.DragEvent, pazienteId: string) {
  event.dataTransfer.setData(DRAG_TYPE, pazienteId)
  event.dataTransfer.effectAllowed = 'move'
}

export function getPatientDragData(event: React.DragEvent): string | null {
  return event.dataTransfer.getData(DRAG_TYPE) || null
}

function stopDrag(event: React.SyntheticEvent) {
  event.stopPropagation()
}

interface PatientCardProps {
  paziente: Paziente
  manifestazioneId: string
  pmaId: string
  compact?: boolean
  onTakeWithoutBed?: (pazienteId: string) => void
  onDimetti?: (pazienteId: string) => void
  busy?: boolean
}

export function PatientCard({
  paziente,
  manifestazioneId,
  pmaId,
  compact = false,
  onTakeWithoutBed,
  onDimetti,
  busy = false,
}: PatientCardProps) {
  const draggable = paziente.aperto && !busy
  const schedaPath = `/manifestazioni/${manifestazioneId}/pma/${pmaId}/pazienti/${paziente.id}`

  return (
    <div
      className={`patient-card ${compact ? 'patient-card-compact' : ''} ${draggable ? 'patient-card-draggable' : 'patient-card-static'}`}
      draggable={draggable}
      onDragStart={(event) => {
        if (!draggable) {
          event.preventDefault()
          return
        }
        setPatientDragData(event, paziente.id)
      }}
    >
      <div className="patient-card-main">
        <span className="patient-id">#{paziente.progressiveId}</span>
        <span className="patient-name">
          {paziente.cognome} {paziente.nome}
        </span>
        {!compact && (
          <span className={`patient-status patient-status-${paziente.stato.toLowerCase()}`}>
            {statoLabel(paziente.stato)}
            {!paziente.aperto && ' · Chiuso'}
          </span>
        )}
      </div>

      <div className={`patient-card-actions ${compact ? 'patient-card-actions-compact' : ''}`}>
        <Link
          to={schedaPath}
          className="scheda-btn"
          title="Apri scheda paziente"
          draggable={false}
          onDragStart={(event) => event.preventDefault()}
          onPointerDown={stopDrag}
          onMouseDown={stopDrag}
          onClick={stopDrag}
        >
          Apri scheda
        </Link>

        {!compact && (
          <>
            {paziente.stato === 'IN_ATTESA' && paziente.aperto && onTakeWithoutBed && (
              <button
                type="button"
                className="icon-btn"
                title="Prendi in carico senza letto"
                disabled={busy}
                onPointerDown={stopDrag}
                onClick={() => onTakeWithoutBed(paziente.id)}
              >
                🛏️
              </button>
            )}
            {paziente.stato === 'IN_CARICO' && paziente.aperto && onDimetti && (
              <button
                type="button"
                className="icon-btn icon-btn-danger"
                title="Dimetti paziente"
                disabled={busy}
                onPointerDown={stopDrag}
                onClick={() => onDimetti(paziente.id)}
              >
                ✕
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

interface PatientDropZoneProps {
  zoneId: string
  label: string
  hint?: string
  children: React.ReactNode
  onDropPatient: (pazienteId: string, zoneId: string) => void
  className?: string
}

export function PatientDropZone({
  zoneId,
  label,
  hint,
  children,
  onDropPatient,
  className = '',
}: PatientDropZoneProps) {
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const pazienteId = getPatientDragData(event)
    if (pazienteId) onDropPatient(pazienteId, zoneId)
  }

  return (
    <section
      className={`drop-zone ${className}`.trim()}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="drop-zone-header">
        <h3>{label}</h3>
        {hint && <p className="muted">{hint}</p>}
      </div>
      <div className="drop-zone-content">{children}</div>
    </section>
  )
}
