import { Button } from './Button'
import type { VitalParamRow } from '../types'
import {
  calculatePam,
  formatPamDisplay,
  inputToNumber,
  numberToInput,
} from '../utils/vitals'
import { createEmptyVitalRow } from '../utils/schedaDefaults'

interface VitalParamsTableProps {
  rows: VitalParamRow[]
  onChange: (rows: VitalParamRow[]) => void
}

type NumericField = Exclude<keyof VitalParamRow, 'id' | 'timestamp'>

const COLUMNS: { key: NumericField | 'timestamp' | 'pam'; label: string; min?: number; max?: number }[] = [
  { key: 'timestamp', label: 'Data/Ora' },
  { key: 'gcs', label: 'GCS', min: 1, max: 15 },
  { key: 'fr', label: 'FR' },
  { key: 'spo2Aa', label: 'SpO2 AA', min: 1, max: 100 },
  { key: 'spo2O2', label: 'SpO2 O2', min: 1, max: 100 },
  { key: 'fc', label: 'FC' },
  { key: 'paSis', label: 'PAsis' },
  { key: 'paDias', label: 'PAdias' },
  { key: 'pam', label: 'PAM' },
  { key: 'temp', label: 'Temp' },
  { key: 'dtx', label: 'DTX' },
  { key: 'nrs', label: 'NRS', min: 1, max: 10 },
]

export function VitalParamsTable({ rows, onChange }: VitalParamsTableProps) {
  const updateRow = (rowId: string, patch: Partial<VitalParamRow>) => {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)))
  }

  const updateNumeric = (rowId: string, field: NumericField, raw: string) => {
    updateRow(rowId, { [field]: inputToNumber(raw) })
  }

  const addRow = () => {
    onChange([...rows, createEmptyVitalRow()])
  }

  const removeRow = (rowId: string) => {
    onChange(rows.filter((row) => row.id !== rowId))
  }

  return (
    <div className="vital-table-wrap">
      <div className="vital-table-toolbar">
        <p className="muted">
          Lascia vuoto ciò che non misuri. Il valore 0 va inserito esplicitamente se misurato.
        </p>
        <Button type="button" variant="secondary" onClick={addRow}>
          + Rilevazione
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="drop-zone-empty">Nessuna rilevazione. Aggiungi la prima riga.</p>
      ) : (
        <div className="vital-table-scroll">
          <table className="vital-table">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th aria-label="Azioni" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="datetime-local"
                      className="vital-input vital-input-datetime"
                      value={row.timestamp}
                      onChange={(event) => updateRow(row.id, { timestamp: event.target.value })}
                    />
                  </td>
                  {COLUMNS.slice(1).map((col) => {
                    if (col.key === 'pam') {
                      return (
                        <td key={col.key} className="vital-pam-cell">
                          {formatPamDisplay(row.paSis, row.paDias)}
                        </td>
                      )
                    }

                    const field = col.key as NumericField
                    return (
                      <td key={col.key}>
                        <input
                          type="number"
                          className="vital-input"
                          value={numberToInput(row[field])}
                          min={col.min}
                          max={col.max}
                          step="any"
                          placeholder="—"
                          onChange={(event) => updateNumeric(row.id, field, event.target.value)}
                        />
                      </td>
                    )
                  })}
                  <td>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      title="Elimina riga"
                      onClick={() => removeRow(row.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export { calculatePam }
