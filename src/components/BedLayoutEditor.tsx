import { useCallback, useMemo, useRef, useState } from 'react'
import type { BedLayout } from '../types'
import { GRID_CELL_SIZE } from '../types'
import {
  clampBedPosition,
  getBedDisplaySize,
  getCanvasSizeForBeds,
} from '../utils/bedGrid'
import { Button } from './Button'

interface BedLayoutEditorProps {
  beds: BedLayout[]
  onChange: (beds: BedLayout[]) => void
  onSave: () => void
  saving?: boolean
  readOnly?: boolean
  hideSaveButton?: boolean
}

export function BedLayoutEditor({
  beds,
  onChange,
  onSave,
  saving = false,
  readOnly = false,
  hideSaveButton = false,
}: BedLayoutEditorProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  const canvasSize = useMemo(
    () => getCanvasSizeForBeds(beds, { minHeight: GRID_CELL_SIZE * 10 }),
    [beds],
  )

  const updateBed = useCallback(
    (id: string, patch: Partial<BedLayout>) => {
      onChange(beds.map((bed) => (bed.id === id ? { ...bed, ...patch } : bed)))
    },
    [beds, onChange],
  )

  const placeBed = (bed: BedLayout, rawX: number, rawY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const { width, height } = getBedDisplaySize(bed)
    const { x, y } = clampBedPosition(rawX, rawY, width, height, rect.width, rect.height)
    updateBed(bed.id, { x, y, width, height })
  }

  const handlePointerDown = (event: React.PointerEvent, bed: BedLayout) => {
    if (readOnly) return
    event.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const { width, height } = getBedDisplaySize(bed)
    dragOffset.current = {
      x: event.clientX - rect.left - bed.x,
      y: event.clientY - rect.top - bed.y,
    }
    setDraggingId(bed.id)
    setSelectedId(bed.id)
    updateBed(bed.id, { width, height })
    ;(event.target as HTMLElement).setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent) => {
    if (!draggingId || readOnly) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const bed = beds.find((b) => b.id === draggingId)
    if (!bed) return

    placeBed(
      bed,
      event.clientX - rect.left - dragOffset.current.x,
      event.clientY - rect.top - dragOffset.current.y,
    )
  }

  const handlePointerUp = () => {
    if (draggingId) {
      const bed = beds.find((b) => b.id === draggingId)
      const canvas = canvasRef.current
      if (bed && canvas) {
        const { width, height } = getBedDisplaySize(bed)
        const { x, y } = clampBedPosition(
          bed.x,
          bed.y,
          width,
          height,
          canvas.clientWidth,
          canvas.clientHeight,
        )
        updateBed(bed.id, { x, y, width, height })
      }
    }
    setDraggingId(null)
  }

  const selectedBed = beds.find((bed) => bed.id === selectedId)

  return (
    <div className="layout-editor">
      {!readOnly && (
        <div className="layout-toolbar">
          <p>
            Trascina i letti sulla griglia: si agganciano ai quadrati e restano dentro la mappa.
          </p>
          {selectedBed && (
            <label className="bed-number-input">
              Numero letto
              <input
                type="number"
                min={1}
                value={selectedBed.number}
                onChange={(event) =>
                  updateBed(selectedBed.id, { number: Number(event.target.value) || 1 })
                }
              />
            </label>
          )}
          {!hideSaveButton && (
            <Button onClick={onSave} disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva mappa letti'}
            </Button>
          )}
        </div>
      )}

      <div
        ref={canvasRef}
        className={`bed-canvas ${readOnly ? 'bed-canvas-readonly' : ''}`}
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          minWidth: canvasSize.width,
          minHeight: canvasSize.height,
          ['--grid-size' as string]: `${GRID_CELL_SIZE}px`,
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {beds.map((bed) => {
          const { width, height } = getBedDisplaySize(bed)
          return (
            <div
              key={bed.id}
              className={`bed-item ${selectedId === bed.id ? 'bed-item-selected' : ''}`}
              style={{
                left: bed.x,
                top: bed.y,
                width,
                height,
              }}
              onPointerDown={(event) => handlePointerDown(event, bed)}
              onClick={() => setSelectedId(bed.id)}
            >
              <span className="bed-label">Letto {bed.number}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
