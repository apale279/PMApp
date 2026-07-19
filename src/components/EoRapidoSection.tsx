import { Link } from 'react-router-dom'
import type { EoRapidoDettagli, EoRapidoSezione } from '../types'
import { EO_RAPIDO_LABELS, EO_RAPIDO_VOCI, NEGATIVO_EO } from '../types'
import { toggleEoRapidoDettaglio } from '../utils/eoRapido'

interface EoRapidoSectionProps {
  sections: EoRapidoSezione[]
  dettagli: EoRapidoDettagli
  settingsHref: string
  onChange: (sections: EoRapidoSezione[]) => void
}

export function EoRapidoSection({
  sections,
  dettagli,
  settingsHref,
  onChange,
}: EoRapidoSectionProps) {
  const updateSection = (voce: EoRapidoSezione['voce'], selezionati: string[]) => {
    onChange(
      sections.map((section) =>
        section.voce === voce ? { ...section, selezionati } : section,
      ),
    )
  }

  return (
    <div className="eo-rapido-section">
      <h3>EO rapido</h3>
      <p className="muted">
        Ogni voce parte da NEGATIVO. Se selezioni un dettaglio positivo, NEGATIVO si deseleziona
        automaticamente.
      </p>

      {EO_RAPIDO_VOCI.map((voce) => {
        const section = sections.find((item) => item.voce === voce) ?? {
          voce,
          selezionati: [NEGATIVO_EO],
        }
        const options = dettagli[voce] ?? []
        const allOptions = [NEGATIVO_EO, ...options.filter((item) => item !== NEGATIVO_EO)]

        return (
          <div key={voce} className="eo-rapido-block">
            <span className="field-label">{EO_RAPIDO_LABELS[voce]}</span>
            <div className="choice-buttons">
              {allOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`choice-btn ${section.selezionati.includes(option) ? 'choice-btn-active' : ''}`}
                  onClick={() =>
                    updateSection(voce, toggleEoRapidoDettaglio(section.selezionati, option))
                  }
                >
                  {option}
                </button>
              ))}
            </div>
            {options.length === 0 && (
              <span className="field-hint">
                Configura i dettagli in{' '}
                <Link to={settingsHref}>Impostazioni PMA</Link>
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
