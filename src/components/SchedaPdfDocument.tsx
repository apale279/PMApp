import type { Paziente, PazienteScheda, PmaSettings } from '../types'
import {
  DIMISSIONE_MODALITA_LABELS,
  EO_RAPIDO_LABELS,
  type AnamnesiRapidaVoce,
} from '../types'
import { calculateAge, formatPamDisplay } from '../utils/vitals'

function formatDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('it-IT')
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('it-IT')
}

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

function displayNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : String(value)
}

const ANAMNESI_RAPIDA_LABELS: Record<AnamnesiRapidaVoce, string> = {
  NEUROLOGICA: 'Neurologica',
  RESPIRATORIA: 'Respiratoria',
  CIRCOLATORIA: 'Circolatoria',
  METABOLICA: 'Metabolica',
  EMATO_ONCO: 'Emato/Onco',
}

interface SchedaPdfDocumentProps {
  paziente: Paziente
  scheda: PazienteScheda
  settings: PmaSettings
  pmaNome: string
  manifestazioneNome: string
  nome: string
  cognome: string
  registratoIl: string
}

function PdfField({ label, value }: { label: string; value: string }) {
  return (
    <div className="pdf-field">
      <span className="pdf-field-label">{label}</span>
      <span className="pdf-field-value">{value}</span>
    </div>
  )
}

function PdfSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pdf-section">
      <h2 className="pdf-section-title">{title}</h2>
      {children}
    </section>
  )
}

export function SchedaPdfDocument({
  paziente,
  scheda,
  settings,
  pmaNome,
  manifestazioneNome,
  nome,
  cognome,
  registratoIl,
}: SchedaPdfDocumentProps) {
  const eta = calculateAge(scheda.anagrafica.dataNascita)
  const { anagrafica, triage, cartellaClinica, dimissioni } = scheda
  const { anamnesi, esameObiettivo, parametriFarmaci } = cartellaClinica

  return (
    <div className="scheda-pdf-document">
      <header className="pdf-header pdf-section">
        <h1 className="pdf-title">Scheda paziente PMA</h1>
        <p className="pdf-subtitle">
          {manifestazioneNome} · PMA {pmaNome}
        </p>
        <div className="pdf-header-grid">
          <PdfField label="ID paziente" value={`#${paziente.progressiveId}`} />
          <PdfField label="Cognome Nome" value={`${cognome || '—'} ${nome || '—'}`.trim()} />
          <PdfField label="Stato" value={paziente.aperto ? 'Aperto' : 'Chiuso'} />
          <PdfField label="Registrato il" value={registratoIl} />
        </div>
      </header>

      <PdfSection title="1. Anagrafica">
        <div className="pdf-grid">
          <PdfField label="Timestamp" value={formatDateTimeLocal(anagrafica.timestamp)} />
          <PdfField label="Data di nascita" value={formatDate(anagrafica.dataNascita)} />
          <PdfField label="Età" value={eta !== null ? `${eta} anni` : '—'} />
          <PdfField label="Comune" value={display(anagrafica.comune)} />
          <PdfField label="Indirizzo" value={display(anagrafica.indirizzo)} />
          <PdfField label="Telefono" value={display(anagrafica.telefono)} />
          <PdfField label="Mail" value={display(anagrafica.mail)} />
        </div>
      </PdfSection>

      <PdfSection title="2. Motivo di accesso">
        <div className="pdf-grid">
          <PdfField label="Motivo presentazione" value={display(anagrafica.motivoPresentazione)} />
          <PdfField label="Dettagli motivo" value={display(anagrafica.dettagliMotivo)} />
          <PdfField label="Codice colore" value={display(anagrafica.codiceColore)} />
        </div>
      </PdfSection>

      <PdfSection title="3. Triage">
        {triage.parametri.length === 0 ? (
          <p className="pdf-empty">Nessuna rilevazione parametri.</p>
        ) : (
          <table className="pdf-table">
            <thead>
              <tr>
                <th>Data/Ora</th>
                <th>GCS</th>
                <th>FR</th>
                <th>SpO2 AA</th>
                <th>SpO2 O2</th>
                <th>FC</th>
                <th>PAsis</th>
                <th>PAdias</th>
                <th>PAM</th>
                <th>Temp</th>
                <th>DTX</th>
                <th>NRS</th>
              </tr>
            </thead>
            <tbody>
              {triage.parametri.map((row) => (
                <tr key={row.id}>
                  <td>{formatDateTimeLocal(row.timestamp)}</td>
                  <td>{displayNumber(row.gcs)}</td>
                  <td>{displayNumber(row.fr)}</td>
                  <td>{displayNumber(row.spo2Aa)}</td>
                  <td>{displayNumber(row.spo2O2)}</td>
                  <td>{displayNumber(row.fc)}</td>
                  <td>{displayNumber(row.paSis)}</td>
                  <td>{displayNumber(row.paDias)}</td>
                  <td>{formatPamDisplay(row.paSis, row.paDias)}</td>
                  <td>{displayNumber(row.temp)}</td>
                  <td>{displayNumber(row.dtx)}</td>
                  <td>{displayNumber(row.nrs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="pdf-block">
          <span className="pdf-field-label">Note triage</span>
          <p className="pdf-text-block">{display(triage.note)}</p>
        </div>
      </PdfSection>

      <PdfSection title="4. Cartella clinica — Anamnesi">
        <div className="pdf-grid">
          <PdfField
            label="Allergie"
            value={
              anamnesi.allergie === 'NON_NOTO'
                ? 'NON NOTO'
                : display(anamnesi.allergie)
            }
          />
          {anamnesi.allergie === 'SI' && (
            <PdfField label="Dettaglio allergie" value={display(anamnesi.dettaglioAllergie)} />
          )}
          <PdfField
            label="Anamnesi rapida"
            value={
              anamnesi.anamnesiRapida.length > 0
                ? anamnesi.anamnesiRapida.map((item) => ANAMNESI_RAPIDA_LABELS[item]).join(', ')
                : '—'
            }
          />
        </div>
        <div className="pdf-block">
          <span className="pdf-field-label">APR</span>
          <p className="pdf-text-block">{display(anamnesi.apr)}</p>
        </div>
        <div className="pdf-block">
          <span className="pdf-field-label">APP</span>
          <p className="pdf-text-block">{display(anamnesi.app)}</p>
        </div>
      </PdfSection>

      <PdfSection title="5. Cartella clinica — Esame obiettivo">
        {esameObiettivo.puntiCorpo.length > 0 && (
          <div className="pdf-block">
            <span className="pdf-field-label">Punti corporei</span>
            <ul className="pdf-list">
              {esameObiettivo.puntiCorpo
                .slice()
                .sort((a, b) => a.number - b.number)
                .map((point) => (
                  <li key={point.id}>
                    Punto {point.number} ({point.view === 'front' ? 'anteriore' : 'posteriore'}):{' '}
                    {display(point.note)}
                  </li>
                ))}
            </ul>
          </div>
        )}
        <div className="pdf-block">
          <span className="pdf-field-label">EO rapido</span>
          {esameObiettivo.eoRapido.map((section) => (
            <p key={section.voce} className="pdf-line">
              <strong>{EO_RAPIDO_LABELS[section.voce]}:</strong>{' '}
              {section.selezionati.join(', ') || 'NEGATIVO'}
            </p>
          ))}
        </div>
        <div className="pdf-block">
          <span className="pdf-field-label">Dettaglio EO</span>
          <p className="pdf-text-block">{display(esameObiettivo.dettaglioEo)}</p>
        </div>
        {esameObiettivo.rivalutazioni.length > 0 && (
          <div className="pdf-block">
            <span className="pdf-field-label">Rivalutazioni</span>
            {esameObiettivo.rivalutazioni.map((row, index) => (
              <div key={row.id} className="pdf-subblock">
                <p className="pdf-line">
                  <strong>Rivalutazione {index + 1}</strong> · {formatDateTimeLocal(row.timestamp)}
                </p>
                <p className="pdf-text-block">{display(row.descrizione)}</p>
              </div>
            ))}
          </div>
        )}
      </PdfSection>

      <PdfSection title="6. Cartella clinica — Parametri e farmaci">
        {parametriFarmaci.parametri.length > 0 && (
          <>
            <h3 className="pdf-subtitle">Parametri</h3>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Data/Ora</th>
                  <th>GCS</th>
                  <th>FR</th>
                  <th>SpO2 AA</th>
                  <th>SpO2 O2</th>
                  <th>FC</th>
                  <th>PAsis</th>
                  <th>PAdias</th>
                  <th>PAM</th>
                  <th>Temp</th>
                  <th>DTX</th>
                  <th>NRS</th>
                </tr>
              </thead>
              <tbody>
                {parametriFarmaci.parametri.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTimeLocal(row.timestamp)}</td>
                    <td>{displayNumber(row.gcs)}</td>
                    <td>{displayNumber(row.fr)}</td>
                    <td>{displayNumber(row.spo2Aa)}</td>
                    <td>{displayNumber(row.spo2O2)}</td>
                    <td>{displayNumber(row.fc)}</td>
                    <td>{displayNumber(row.paSis)}</td>
                    <td>{displayNumber(row.paDias)}</td>
                    <td>{formatPamDisplay(row.paSis, row.paDias)}</td>
                    <td>{displayNumber(row.temp)}</td>
                    <td>{displayNumber(row.dtx)}</td>
                    <td>{displayNumber(row.nrs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {parametriFarmaci.farmaci.length > 0 && (
          <>
            <h3 className="pdf-subtitle">Farmaci</h3>
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Data/Ora</th>
                  <th>Nome farmaco</th>
                  <th>Dose</th>
                  <th>Via</th>
                </tr>
              </thead>
              <tbody>
                {parametriFarmaci.farmaci.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTimeLocal(row.timestamp)}</td>
                    <td>{display(row.nome)}</td>
                    <td>{display(row.dose)}</td>
                    <td>{display(row.via)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </PdfSection>

      <PdfSection title="7. Dimissioni">
        <div className="pdf-grid">
          <PdfField
            label="Esito dimissione"
            value={dimissioni.esito ? DIMISSIONE_MODALITA_LABELS[dimissioni.esito] : '—'}
          />
          <PdfField
            label="Data/ora dimissione"
            value={formatDateTimeLocal(dimissioni.dimissioneTimestamp)}
          />
        </div>

        {dimissioni.esito === 'INVIO_PS' && (
          <div className="pdf-grid">
            <PdfField
              label="N° missione SOREU"
              value={displayNumber(dimissioni.invioPs.numeroMissioneSoreu)}
            />
            <PdfField label="Ora missione" value={formatDateTimeLocal(dimissioni.invioPs.oraMissione)} />
            <PdfField label="Codice" value={display(dimissioni.invioPs.codice)} />
            <PdfField
              label="Ospedale destinazione"
              value={display(dimissioni.invioPs.ospedaleDestinazione)}
            />
            <PdfField label="Mezzo" value={display(dimissioni.invioPs.mezzo)} />
          </div>
        )}

        {dimissioni.esito === 'RIFIUTA_INVIO_PS' && settings.testoRifiutoInvioPs && (
          <div className="pdf-block">
            <span className="pdf-field-label">Rifiuto invio in PS</span>
            <p className="pdf-text-block">{settings.testoRifiutoInvioPs}</p>
          </div>
        )}

        {dimissioni.esito === 'RIAFFIDATO_A' && (
          <div className="pdf-grid">
            <PdfField
              label="Affidatario"
              value={display(dimissioni.riaffidatoA.nomeCognomeAffidatario)}
            />
            <PdfField label="Relazione" value={display(dimissioni.riaffidatoA.relazione)} />
          </div>
        )}

        <div className="pdf-block">
          <span className="pdf-field-label">Note dimissione</span>
          <p className="pdf-text-block">{display(dimissioni.noteDimissione)}</p>
        </div>

        <div className="pdf-grid">
          <PdfField
            label="Consenso privacy"
            value={dimissioni.consensoPrivacy ? 'Acquisito' : 'Non acquisito'}
          />
          <PdfField
            label="Consenso generico alle cure"
            value={dimissioni.consensoGenericoCure ? 'Acquisito' : 'Non acquisito'}
          />
        </div>
      </PdfSection>
    </div>
  )
}
