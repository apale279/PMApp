import { Button } from './Button'
import type { FarmacoRow } from '../types'
import { createEmptyFarmacoRow } from '../utils/schedaDefaults'

interface FarmaciTableProps {
  rows: FarmacoRow[]
  onChange: (rows: FarmacoRow[]) => void
}

export function FarmaciTable({ rows, onChange }: FarmaciTableProps) {
  const updateRow = (rowId: string, patch: Partial<FarmacoRow>) => {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    onChange([...rows, createEmptyFarmacoRow()])
  }

  const removeRow = (rowId: string) => {
    onChange(rows.filter((row) => row.id !== rowId))
  }

  return (
    <div className="vital-table-wrap">
      <div className="vital-table-toolbar">
        <p className="muted">Registra farmaci somministrati con data, dose e via.</p>
        <Button type="button" variant="secondary" onClick={addRow}>
          + Aggiungi farmaco
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="drop-zone-empty">Nessun farmaco registrato.</p>
      ) : (
        <div className="vital-table-scroll">
          <table className="vital-table farmaci-table">
            <thead>
              <tr>
                <th>Data/Ora</th>
                <th>Nome farmaco</th>
                <th>Dose</th>
                <th>Via di somministrazione</th>
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
                  <td>
                    <input
                      type="text"
                      className="farmaco-input farmaco-input-wide"
                      value={row.nome}
                      onChange={(event) => updateRow(row.id, { nome: event.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="farmaco-input"
                      value={row.dose}
                      onChange={(event) => updateRow(row.id, { dose: event.target.value })}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="farmaco-input farmaco-input-wide"
                      value={row.via}
                      onChange={(event) => updateRow(row.id, { via: event.target.value })}
                    />
                  </td>
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
