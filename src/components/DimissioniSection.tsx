import { Link } from 'react-router-dom'
import { Button } from './Button'
import type {
  DimissioneModalita,
  DimissioniScheda,
  InvioPsCodice,
  PmaSettings,
} from '../types'
import {
  DIMISSIONE_MODALITA,
  DIMISSIONE_MODALITA_LABELS,
} from '../types'
import { inputToNumber, numberToInput } from '../utils/vitals'

interface DimissioniSectionProps {
  dimissioni: DimissioniScheda
  settings: PmaSettings
  settingsHref: string
  chiuso: boolean
  saving: boolean
  onChange: (dimissioni: DimissioniScheda) => void
  onDimetti: () => void
  onPreviewPdf: () => void
}

const INVIO_PS_CODICI: InvioPsCodice[] = ['V', 'G', 'R']

export function DimissioniSection({
  dimissioni,
  settings,
  settingsHref,
  chiuso,
  saving,
  onChange,
  onDimetti,
  onPreviewPdf,
}: DimissioniSectionProps) {
  const patch = (patchData: Partial<DimissioniScheda>) => {
    onChange({ ...dimissioni, ...patchData })
  }

  const setEsito = (esito: DimissioneModalita) => {
    patch({ esito })
  }

  const showInvioPs = dimissioni.esito === 'INVIO_PS'
  const showRifiuto = dimissioni.esito === 'RIFIUTA_INVIO_PS'
  const showRiaffidato = dimissioni.esito === 'RIAFFIDATO_A'

  const canDimetti =
    !chiuso && dimissioni.esito !== null && dimissioni.consensoPrivacy && dimissioni.consensoGenericoCure

  return (
    <div className="dimissioni-section">
      {chiuso && dimissioni.dimissioneTimestamp && (
        <p className="dimissioni-closed-banner">
          Paziente dimesso il{' '}
          <strong>{new Date(dimissioni.dimissioneTimestamp).toLocaleString('it-IT')}</strong>
        </p>
      )}

      <div className={chiuso ? 'field-disabled' : ''}>
        <span className="field-label">Esito dimissione</span>
        <div className="choice-buttons">
          {DIMISSIONE_MODALITA.map((esito) => (
            <button
              key={esito}
              type="button"
              disabled={chiuso}
              className={`choice-btn ${dimissioni.esito === esito ? 'choice-btn-active' : ''}`}
              onClick={() => setEsito(esito)}
            >
              {DIMISSIONE_MODALITA_LABELS[esito]}
            </button>
          ))}
        </div>
      </div>

      {showInvioPs && (
        <div className={`dimissioni-block ${chiuso ? 'field-disabled' : ''}`}>
          <h3>Invio in PS</h3>
          <div className="form-grid">
            <label>
              N° missione SOREU
              <input
                type="number"
                disabled={chiuso}
                value={numberToInput(dimissioni.invioPs.numeroMissioneSoreu)}
                onChange={(event) =>
                  patch({
                    invioPs: {
                      ...dimissioni.invioPs,
                      numeroMissioneSoreu: inputToNumber(event.target.value),
                    },
                  })
                }
              />
            </label>
            <label>
              Ora missione
              <input
                type="datetime-local"
                disabled={chiuso}
                value={dimissioni.invioPs.oraMissione}
                onChange={(event) =>
                  patch({
                    invioPs: {
                      ...dimissioni.invioPs,
                      oraMissione: event.target.value,
                    },
                  })
                }
              />
            </label>
            <label className="form-grid-full">
              Codice
              <div className="choice-buttons">
                {INVIO_PS_CODICI.map((codice) => (
                  <button
                    key={codice}
                    type="button"
                    disabled={chiuso}
                    className={`choice-btn ${dimissioni.invioPs.codice === codice ? 'choice-btn-active' : ''}`}
                    onClick={() =>
                      patch({
                        invioPs: {
                          ...dimissioni.invioPs,
                          codice,
                        },
                      })
                    }
                  >
                    {codice}
                  </button>
                ))}
              </div>
            </label>
            <label>
              Ospedale destinazione
              <input
                type="text"
                disabled={chiuso}
                value={dimissioni.invioPs.ospedaleDestinazione}
                onChange={(event) =>
                  patch({
                    invioPs: {
                      ...dimissioni.invioPs,
                      ospedaleDestinazione: event.target.value,
                    },
                  })
                }
              />
            </label>
            <label>
              Mezzo
              <input
                type="text"
                disabled={chiuso}
                value={dimissioni.invioPs.mezzo}
                onChange={(event) =>
                  patch({
                    invioPs: {
                      ...dimissioni.invioPs,
                      mezzo: event.target.value,
                    },
                  })
                }
              />
            </label>
          </div>
        </div>
      )}

      {showRifiuto && (
        <div className="dimissioni-block">
          <h3>Rifiuto invio in PS *</h3>
          {settings.testoRifiutoInvioPs ? (
            <p className="dimissioni-legal-text">{settings.testoRifiutoInvioPs}</p>
          ) : (
            <p className="field-hint">
              Configura il testo in <Link to={settingsHref}>Impostazioni PMA</Link>
            </p>
          )}
        </div>
      )}

      {showRiaffidato && (
        <div className={`dimissioni-block ${chiuso ? 'field-disabled' : ''}`}>
          <h3>Riaffidato a</h3>
          <div className="form-grid">
            <label>
              Nome e Cognome affidatario
              <input
                type="text"
                disabled={chiuso}
                value={dimissioni.riaffidatoA.nomeCognomeAffidatario}
                onChange={(event) =>
                  patch({
                    riaffidatoA: {
                      ...dimissioni.riaffidatoA,
                      nomeCognomeAffidatario: event.target.value,
                    },
                  })
                }
              />
            </label>
            <label>
              Relazione
              <input
                type="text"
                disabled={chiuso}
                value={dimissioni.riaffidatoA.relazione}
                onChange={(event) =>
                  patch({
                    riaffidatoA: {
                      ...dimissioni.riaffidatoA,
                      relazione: event.target.value,
                    },
                  })
                }
              />
            </label>
          </div>
        </div>
      )}

      <label className={`form-grid-full ${chiuso ? 'field-disabled' : ''}`}>
        Note dimissione
        <textarea
          rows={6}
          disabled={chiuso}
          value={dimissioni.noteDimissione}
          onChange={(event) => patch({ noteDimissione: event.target.value })}
        />
      </label>

      <div className={`dimissioni-block ${chiuso ? 'field-disabled' : ''}`}>
        <h3>Consenso privacy *</h3>
        {settings.testoConsensoPrivacy ? (
          <p className="dimissioni-legal-text">{settings.testoConsensoPrivacy}</p>
        ) : (
          <p className="field-hint">
            Configura il testo in <Link to={settingsHref}>Impostazioni PMA</Link>
          </p>
        )}
        <label className="consenso-check">
          <input
            type="checkbox"
            disabled={chiuso}
            checked={dimissioni.consensoPrivacy}
            onChange={(event) => patch({ consensoPrivacy: event.target.checked })}
          />
          Consenso privacy acquisito
        </label>
      </div>

      <div className={`dimissioni-block ${chiuso ? 'field-disabled' : ''}`}>
        <h3>Consenso generico alle cure *</h3>
        {settings.testoConsensoGenericoCure ? (
          <p className="dimissioni-legal-text">{settings.testoConsensoGenericoCure}</p>
        ) : (
          <p className="field-hint">
            Configura il testo in <Link to={settingsHref}>Impostazioni PMA</Link>
          </p>
        )}
        <label className="consenso-check">
          <input
            type="checkbox"
            disabled={chiuso}
            checked={dimissioni.consensoGenericoCure}
            onChange={(event) => patch({ consensoGenericoCure: event.target.checked })}
          />
          Consenso generico alle cure acquisito
        </label>
      </div>

      <div className="dimissioni-actions">
        <Button type="button" variant="secondary" onClick={onPreviewPdf}>
          Anteprima PDF
        </Button>

        {!chiuso && (
          <>
            <Button
              type="button"
              variant="danger"
              disabled={!canDimetti || saving}
              onClick={onDimetti}
            >
              DIMETTI
            </Button>
            {!canDimetti && (
              <p className="field-hint">
                Seleziona un esito e conferma entrambi i consensi per dimettere.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
