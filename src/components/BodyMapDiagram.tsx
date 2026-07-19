import type { BodyMapView, EoBodyPoint } from '../types'

interface BodyMapDiagramProps {
  points: EoBodyPoint[]
  onChange: (points: EoBodyPoint[]) => void
}

function BodySilhouette({ view }: { view: BodyMapView }) {
  if (view === 'back') {
    return (
      <g className="body-map-silhouette">
        <ellipse cx="60" cy="24" rx="20" ry="24" />
        <rect x="52" y="46" width="16" height="10" rx="2" />
        <path d="M38 56 L28 108 L32 148 L46 168 L74 168 L88 148 L92 108 L82 56 Z" />
        <path d="M38 56 L18 92 L14 132 L22 136 L30 100 Z" />
        <path d="M82 56 L102 92 L106 132 L98 136 L90 100 Z" />
        <path d="M46 168 L40 228 L44 268 L56 268 L58 168 Z" />
        <path d="M74 168 L76 168 L78 268 L90 268 L94 228 L88 168 Z" />
      </g>
    )
  }

  return (
    <g className="body-map-silhouette">
      <ellipse cx="60" cy="24" rx="20" ry="24" />
      <rect x="52" y="46" width="16" height="10" rx="2" />
      <path d="M38 56 L28 108 L32 148 L46 168 L74 168 L88 148 L92 108 L82 56 Z" />
      <path d="M38 56 L18 92 L14 132 L22 136 L30 100 Z" />
      <path d="M82 56 L102 92 L106 132 L98 136 L90 100 Z" />
      <path d="M46 168 L40 228 L44 268 L56 268 L58 168 Z" />
      <path d="M74 168 L76 168 L78 268 L90 268 L94 228 L88 168 Z" />
      <circle cx="52" cy="88" r="4" className="body-map-detail" />
      <circle cx="68" cy="88" r="4" className="body-map-detail" />
    </g>
  )
}

function BodyMapViewPanel({
  view,
  label,
  points,
  onAddPoint,
}: {
  view: BodyMapView
  label: string
  points: EoBodyPoint[]
  onAddPoint: (view: BodyMapView, xPercent: number, yPercent: number) => void
}) {
  const handleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget
    const rect = svg.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return

    const xPercent = ((event.clientX - rect.left) / rect.width) * 100
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100
    onAddPoint(view, xPercent, yPercent)
  }

  const viewPoints = points.filter((point) => point.view === view)

  return (
    <div className="body-map-panel">
      <h4>{label}</h4>
      <svg
        viewBox="0 0 120 280"
        className="body-map-svg"
        role="img"
        aria-label={label}
        onClick={handleClick}
      >
        <rect x="0" y="0" width="120" height="280" className="body-map-bg" />
        <BodySilhouette view={view} />
        {viewPoints.map((point) => (
          <g key={point.id} transform={`translate(${(point.xPercent / 100) * 120}, ${(point.yPercent / 100) * 280})`}>
            <circle r="8" className="body-map-marker" />
            <text y="4" textAnchor="middle" className="body-map-marker-label">
              {point.number}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

export function BodyMapDiagram({ points, onChange }: BodyMapDiagramProps) {
  const addPoint = (view: BodyMapView, xPercent: number, yPercent: number) => {
    const nextNumber = points.reduce((max, point) => Math.max(max, point.number), 0) + 1
    onChange([
      ...points,
      {
        id: crypto.randomUUID(),
        number: nextNumber,
        view,
        xPercent,
        yPercent,
        note: '',
      },
    ])
  }

  const updatePointNote = (pointId: string, note: string) => {
    onChange(points.map((point) => (point.id === pointId ? { ...point, note } : point)))
  }

  const removePoint = (pointId: string) => {
    const remaining = points
      .filter((point) => point.id !== pointId)
      .sort((a, b) => a.number - b.number)
      .map((point, index) => ({ ...point, number: index + 1 }))
    onChange(remaining)
  }

  return (
    <div className="body-map-section">
      <p className="muted">Clicca sulla figura per aggiungere un punto numerato.</p>
      <div className="body-map-grid">
        <BodyMapViewPanel
          view="front"
          label="Anteriore"
          points={points}
          onAddPoint={addPoint}
        />
        <BodyMapViewPanel
          view="back"
          label="Posteriore"
          points={points}
          onAddPoint={addPoint}
        />
      </div>

      {points.length === 0 ? (
        <p className="drop-zone-empty">Nessun punto marcato.</p>
      ) : (
        <ul className="body-map-notes">
          {points
            .slice()
            .sort((a, b) => a.number - b.number)
            .map((point) => (
              <li key={point.id}>
                <span className="body-map-note-label">
                  Punto {point.number} ({point.view === 'front' ? 'anteriore' : 'posteriore'})
                </span>
                <input
                  type="text"
                  value={point.note}
                  placeholder="Descrizione breve del punto"
                  onChange={(event) => updatePointNote(point.id, event.target.value)}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  title="Rimuovi punto"
                  onClick={() => removePoint(point.id)}
                >
                  ✕
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  )
}
