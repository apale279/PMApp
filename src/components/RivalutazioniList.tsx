import { Button } from './Button'
import type { RivalutazioneRow } from '../types'
import { createEmptyRivalutazioneRow } from '../utils/schedaDefaults'

interface RivalutazioniListProps {
  rows: RivalutazioneRow[]
  onChange: (rows: RivalutazioneRow[]) => void
}

export function RivalutazioniList({ rows, onChange }: RivalutazioniListProps) {
  const updateRow = (rowId: string, patch: Partial<RivalutazioneRow>) => {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    onChange([...rows, createEmptyRivalutazioneRow()])
  }

  const removeRow = (rowId: string) => {
    onChange(rows.filter((row) => row.id !== rowId))
  }

  return (
    <div className="rivalutazioni-section">
      <div className="vital-table-toolbar">
        <h3>Rivalutazione</h3>
        <Button type="button" variant="secondary" onClick={addRow}>
          + Aggiungi rivalutazione
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="drop-zone-empty">Nessuna rivalutazione registrata.</p>
      ) : (
        <div className="rivalutazioni-list">
          {rows.map((row, index) => (
            <div key={row.id} className="rivalutazione-card">
              <div className="rivalutazione-header">
                <strong>Rivalutazione {index + 1}</strong>
                <input
                  type="datetime-local"
                  className="vital-input vital-input-datetime"
                  value={row.timestamp}
                  onChange={(event) => updateRow(row.id, { timestamp: event.target.value })}
                />
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  title="Elimina rivalutazione"
                  onClick={() => removeRow(row.id)}
                >
                  ✕
                </button>
              </div>
              <label>
                Descrizione
                <textarea
                  rows={4}
                  value={row.descrizione}
                  onChange={(event) => updateRow(row.id, { descrizione: event.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
