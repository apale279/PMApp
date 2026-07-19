import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { BodyMapDiagram } from '../components/BodyMapDiagram'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { DimissioniSection } from '../components/DimissioniSection'
import { EoRapidoSection } from '../components/EoRapidoSection'
import { FarmaciTable } from '../components/FarmaciTable'
import { Layout } from '../components/Layout'
import { RivalutazioniList } from '../components/RivalutazioniList'
import { SchedaPdfPreview } from '../components/SchedaPdfPreview'
import { Tabs } from '../components/Tabs'
import { VitalParamsTable } from '../components/VitalParamsTable'
import {
  dimettiPaziente,
  formatDateTime,
  getManifestazione,
  getPaziente,
  getPma,
  getPmaSettings,
  savePazienteScheda,
  statoLabel,
} from '../services/firestore'
import type {
  AllergieRisposta,
  AnamnesiRapidaVoce,
  Paziente,
  PazienteScheda,
  PmaSettings,
} from '../types'
import { ANAMNESI_RAPIDA_VOCI, CODICI_COLORE } from '../types'
import { createDefaultPmaSettings } from '../utils/schedaDefaults'
import { calculateAge, nowDatetimeLocal } from '../utils/vitals'

const MAIN_TABS = [
  { id: 'anagrafica', label: 'Anagrafica' },
  { id: 'triage', label: 'Triage' },
  { id: 'cartella', label: 'Cartella clinica' },
  { id: 'dimissioni', label: 'Dimissioni' },
]

const CARTELLA_TABS = [
  { id: 'anamnesi', label: 'Anamnesi' },
  { id: 'esameObiettivo', label: 'Esame obiettivo' },
  { id: 'parametriFarmaci', label: 'Parametri e farmaci' },
]

const ANAMNESI_RAPIDA_LABELS: Record<AnamnesiRapidaVoce, string> = {
  NEUROLOGICA: 'Neurologica',
  RESPIRATORIA: 'Respiratoria',
  CIRCOLATORIA: 'Circolatoria',
  METABOLICA: 'Metabolica',
  EMATO_ONCO: 'Emato/Onco',
}

export function PazienteSchedaPage() {
  const [searchParams] = useSearchParams()
  const { manifestazioneId, pmaId, pazienteId } = useParams<{
    manifestazioneId: string
    pmaId: string
    pazienteId: string
  }>()

  const [paziente, setPaziente] = useState<Paziente | null>(null)
  const [scheda, setScheda] = useState<PazienteScheda | null>(null)
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [settings, setSettings] = useState<PmaSettings>(createDefaultPmaSettings())
  const [pmaNome, setPmaNome] = useState('')
  const [manifestazioneNome, setManifestazioneNome] = useState('')
  const [mainTab, setMainTab] = useState('anagrafica')
  const [cartellaTab, setCartellaTab] = useState('anamnesi')
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && MAIN_TABS.some((item) => item.id === tab)) {
      setMainTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (!manifestazioneId || !pmaId || !pazienteId) return

    const load = async () => {
      setLoading(true)
      const [pma, pazienteData, pmaSettings, manifestazione] = await Promise.all([
        getPma(manifestazioneId, pmaId),
        getPaziente(manifestazioneId, pmaId, pazienteId),
        getPmaSettings(manifestazioneId, pmaId),
        getManifestazione(manifestazioneId),
      ])

      setPmaNome(pma?.nome ?? '')
      setManifestazioneNome(manifestazione?.nome ?? '')
      setSettings(pmaSettings)

      if (pazienteData) {
        setPaziente(pazienteData)
        setScheda(structuredClone(pazienteData.scheda))
        setNome(pazienteData.nome)
        setCognome(pazienteData.cognome)
      }
      setLoading(false)
    }

    void load()
  }, [manifestazioneId, pmaId, pazienteId])

  const patchScheda = (patch: Partial<PazienteScheda>) => {
    setScheda((current) => (current ? { ...current, ...patch } : current))
    setSaved(false)
  }

  const handleSave = async (event?: FormEvent) => {
    event?.preventDefault()
    if (!manifestazioneId || !pmaId || !pazienteId || !scheda) return

    setSaving(true)
    setError(null)
    try {
      await savePazienteScheda(manifestazioneId, pmaId, pazienteId, {
        nome,
        cognome,
        scheda,
      })
      setSaved(true)
    } catch {
      setError('Errore durante il salvataggio della scheda.')
    } finally {
      setSaving(false)
    }
  }

  const anamnesiBlocked = scheda?.cartellaClinica.anamnesi.allergie === null
  const eta = scheda ? calculateAge(scheda.anagrafica.dataNascita) : null
  const settingsHref = `/manifestazioni/${manifestazioneId}/pma/${pmaId}/impostazioni`

  const setAllergie = (allergie: AllergieRisposta) => {
    if (!scheda) return
    patchScheda({
      cartellaClinica: {
        ...scheda.cartellaClinica,
        anamnesi: {
          ...scheda.cartellaClinica.anamnesi,
          allergie,
          dettaglioAllergie: allergie === 'SI' ? scheda.cartellaClinica.anamnesi.dettaglioAllergie : '',
        },
      },
    })
  }

  const toggleAnamnesiRapida = (voce: AnamnesiRapidaVoce) => {
    if (!scheda || anamnesiBlocked) return
    const current = scheda.cartellaClinica.anamnesi.anamnesiRapida
    const next = current.includes(voce)
      ? current.filter((item) => item !== voce)
      : [...current, voce]

    patchScheda({
      cartellaClinica: {
        ...scheda.cartellaClinica,
        anamnesi: {
          ...scheda.cartellaClinica.anamnesi,
          anamnesiRapida: next,
        },
      },
    })
  }

  const handleDimetti = async () => {
    if (!manifestazioneId || !pmaId || !pazienteId || !scheda || !paziente?.aperto) return

    const confirmed = window.confirm(
      `Dimettere ${cognome} ${nome}? Il paziente verrà chiuso e non comparirà più nel PMA attivo.`,
    )
    if (!confirmed) return

    const nextScheda: PazienteScheda = {
      ...scheda,
      dimissioni: {
        ...scheda.dimissioni,
        dimissioneTimestamp: nowDatetimeLocal(),
      },
    }

    setSaving(true)
    setError(null)
    try {
      await dimettiPaziente(manifestazioneId, pmaId, pazienteId, {
        nome,
        cognome,
        scheda: nextScheda,
      })
      setScheda(nextScheda)
      setPaziente({
        ...paziente,
        aperto: false,
        stato: 'DIMESSO',
        bedId: null,
        scheda: nextScheda,
      })
      setSaved(true)
    } catch {
      setError('Errore durante la dimissione del paziente.')
    } finally {
      setSaving(false)
    }
  }

  if (!manifestazioneId || !pmaId || !pazienteId) return null

  return (
    <Layout
      title={paziente ? `${paziente.cognome} ${paziente.nome}` : 'Scheda paziente'}
      subtitle={`PMA ${pmaNome} · ID #${paziente?.progressiveId ?? '—'}`}
      backTo={`/manifestazioni/${manifestazioneId}/pma/${pmaId}`}
      backLabel="Torna al PMA"
      actions={
        <div className="page-actions-row">
          <Link to={settingsHref}>
            <Button variant="secondary">Impostazioni PMA</Button>
          </Link>
          <Button onClick={() => void handleSave()} disabled={saving || loading}>
            {saving ? 'Salvataggio...' : 'Salva scheda'}
          </Button>
        </div>
      }
    >
      {loading || !scheda || !paziente ? (
        <p className="muted">Caricamento...</p>
      ) : (
        <form className="scheda-page" onSubmit={handleSave}>
          <Card className="scheda-summary">
            <p>
              Stato: <strong>{statoLabel(paziente.stato)}</strong> · Aperto:{' '}
              <strong>{paziente.aperto ? 'Sì' : 'No'}</strong> · Registrato il{' '}
              {formatDateTime(paziente.createdAt)}
            </p>
          </Card>

          <Tabs tabs={MAIN_TABS} activeId={mainTab} onChange={setMainTab} />

          {mainTab === 'anagrafica' && (
            <>
              <Card>
                <h2>Dati anagrafici</h2>
                <div className="form-grid">
                  <label>
                    Timestamp
                    <input
                      type="datetime-local"
                      value={scheda.anagrafica.timestamp}
                      onChange={(event) =>
                        patchScheda({
                          anagrafica: { ...scheda.anagrafica, timestamp: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    ID paziente
                    <input type="text" value={`#${paziente.progressiveId}`} readOnly disabled />
                  </label>
                  <label>
                    Cognome
                    <input
                      type="text"
                      value={cognome}
                      onChange={(event) => {
                        setCognome(event.target.value)
                        setSaved(false)
                      }}
                      required
                    />
                  </label>
                  <label>
                    Nome
                    <input
                      type="text"
                      value={nome}
                      onChange={(event) => {
                        setNome(event.target.value)
                        setSaved(false)
                      }}
                      required
                    />
                  </label>
                  <label>
                    Data di nascita
                    <input
                      type="date"
                      value={scheda.anagrafica.dataNascita}
                      onChange={(event) =>
                        patchScheda({
                          anagrafica: { ...scheda.anagrafica, dataNascita: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    Età
                    <input type="text" value={eta !== null ? `${eta} anni` : '—'} readOnly disabled />
                  </label>
                  <label>
                    Comune
                    <input
                      type="text"
                      value={scheda.anagrafica.comune}
                      onChange={(event) =>
                        patchScheda({
                          anagrafica: { ...scheda.anagrafica, comune: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label className="form-grid-full">
                    Indirizzo
                    <input
                      type="text"
                      value={scheda.anagrafica.indirizzo}
                      onChange={(event) =>
                        patchScheda({
                          anagrafica: { ...scheda.anagrafica, indirizzo: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    Telefono
                    <input
                      type="tel"
                      value={scheda.anagrafica.telefono}
                      onChange={(event) =>
                        patchScheda({
                          anagrafica: { ...scheda.anagrafica, telefono: event.target.value },
                        })
                      }
                    />
                  </label>
                  <label>
                    Mail
                    <input
                      type="email"
                      value={scheda.anagrafica.mail}
                      onChange={(event) =>
                        patchScheda({
                          anagrafica: { ...scheda.anagrafica, mail: event.target.value },
                        })
                      }
                    />
                  </label>
                </div>
              </Card>

              <Card className="stack-top">
                <h2>Motivo di accesso</h2>
                <div className="form-grid">
                  <label>
                    Motivo di presentazione *
                    <select
                      value={scheda.anagrafica.motivoPresentazione}
                      onChange={(event) =>
                        patchScheda({
                          anagrafica: {
                            ...scheda.anagrafica,
                            motivoPresentazione: event.target.value,
                          },
                        })
                      }
                    >
                      <option value="">— Seleziona —</option>
                      {settings.motiviPresentazione.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {settings.motiviPresentazione.length === 0 && (
                      <span className="field-hint">
                        Configura le opzioni in{' '}
                        <Link to={settingsHref}>Impostazioni PMA</Link>
                      </span>
                    )}
                  </label>
                  <label>
                    Dettagli motivo *
                    <select
                      value={scheda.anagrafica.dettagliMotivo}
                      onChange={(event) =>
                        patchScheda({
                          anagrafica: { ...scheda.anagrafica, dettagliMotivo: event.target.value },
                        })
                      }
                    >
                      <option value="">— Seleziona —</option>
                      {settings.dettagliMotivo.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="form-grid-full">
                    Codice colore
                    <div className="choice-buttons codice-colore-buttons">
                      {CODICI_COLORE.map((codice) => {
                        const active = scheda.anagrafica.codiceColore === codice
                        return (
                          <button
                            key={codice}
                            type="button"
                            className={`choice-btn codice-colore-btn codice-colore-${codice.toLowerCase()} ${
                              active ? 'choice-btn-active' : ''
                            }`}
                            onClick={() =>
                              patchScheda({
                                anagrafica: {
                                  ...scheda.anagrafica,
                                  codiceColore: active ? null : codice,
                                },
                              })
                            }
                          >
                            {codice}
                          </button>
                        )
                      })}
                    </div>
                  </label>
                </div>
              </Card>
            </>
          )}

          {mainTab === 'triage' && (
            <Card>
              <h2>Triage</h2>
              <h3>Parametri triage</h3>
              <VitalParamsTable
                rows={scheda.triage.parametri}
                onChange={(parametri) =>
                  patchScheda({ triage: { ...scheda.triage, parametri } })
                }
              />
              <label className="form-grid-full stack-top">
                Note triage
                <textarea
                  rows={4}
                  value={scheda.triage.note}
                  onChange={(event) =>
                    patchScheda({ triage: { ...scheda.triage, note: event.target.value } })
                  }
                />
              </label>
            </Card>
          )}

          {mainTab === 'cartella' && (
            <Card>
              <h2>Cartella clinica</h2>
              <Tabs
                tabs={CARTELLA_TABS}
                activeId={cartellaTab}
                onChange={setCartellaTab}
                className="sub-tabs"
              />

              {cartellaTab === 'anamnesi' && (
                <div className="anamnesi-section">
                  <div className="allergie-block">
                    <span className="field-label">ALLERGIE *</span>
                    <div className="choice-buttons">
                      {(['SI', 'NO', 'NON_NOTO'] as AllergieRisposta[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={`choice-btn ${
                            scheda.cartellaClinica.anamnesi.allergie === option
                              ? 'choice-btn-active'
                              : ''
                          }`}
                          onClick={() => setAllergie(option)}
                        >
                          {option === 'NON_NOTO' ? 'NON NOTO' : option}
                        </button>
                      ))}
                    </div>
                    {scheda.cartellaClinica.anamnesi.allergie === 'SI' && (
                      <label className="form-grid-full stack-top">
                        Dettaglio allergie
                        <textarea
                          rows={3}
                          value={scheda.cartellaClinica.anamnesi.dettaglioAllergie}
                          onChange={(event) =>
                            patchScheda({
                              cartellaClinica: {
                                ...scheda.cartellaClinica,
                                anamnesi: {
                                  ...scheda.cartellaClinica.anamnesi,
                                  dettaglioAllergie: event.target.value,
                                },
                              },
                            })
                          }
                        />
                      </label>
                    )}
                  </div>

                  {anamnesiBlocked && (
                    <p className="warning-text">
                      Seleziona una risposta sulle allergie per compilare i campi sottostanti.
                    </p>
                  )}

                  <div className={`stack-top ${anamnesiBlocked ? 'field-disabled' : ''}`}>
                    <span className="field-label">Anamnesi rapida</span>
                    <div className="choice-buttons">
                      {ANAMNESI_RAPIDA_VOCI.map((voce) => (
                        <button
                          key={voce}
                          type="button"
                          disabled={anamnesiBlocked}
                          className={`choice-btn ${
                            scheda.cartellaClinica.anamnesi.anamnesiRapida.includes(voce)
                              ? 'choice-btn-active'
                              : ''
                          }`}
                          onClick={() => toggleAnamnesiRapida(voce)}
                        >
                          {ANAMNESI_RAPIDA_LABELS[voce]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className={`form-grid-full stack-top ${anamnesiBlocked ? 'field-disabled' : ''}`}>
                    APR
                    <textarea
                      rows={4}
                      disabled={anamnesiBlocked}
                      value={scheda.cartellaClinica.anamnesi.apr}
                      onChange={(event) =>
                        patchScheda({
                          cartellaClinica: {
                            ...scheda.cartellaClinica,
                            anamnesi: {
                              ...scheda.cartellaClinica.anamnesi,
                              apr: event.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>

                  <label className={`form-grid-full stack-top ${anamnesiBlocked ? 'field-disabled' : ''}`}>
                    APP
                    <textarea
                      rows={4}
                      disabled={anamnesiBlocked}
                      value={scheda.cartellaClinica.anamnesi.app}
                      onChange={(event) =>
                        patchScheda({
                          cartellaClinica: {
                            ...scheda.cartellaClinica,
                            anamnesi: {
                              ...scheda.cartellaClinica.anamnesi,
                              app: event.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>
                </div>
              )}

              {cartellaTab === 'esameObiettivo' && (
                <div className="esame-obiettivo-section">
                  <h3>Mappa corporea</h3>
                  <BodyMapDiagram
                    points={scheda.cartellaClinica.esameObiettivo.puntiCorpo}
                    onChange={(puntiCorpo) =>
                      patchScheda({
                        cartellaClinica: {
                          ...scheda.cartellaClinica,
                          esameObiettivo: {
                            ...scheda.cartellaClinica.esameObiettivo,
                            puntiCorpo,
                          },
                        },
                      })
                    }
                  />

                  <EoRapidoSection
                    sections={scheda.cartellaClinica.esameObiettivo.eoRapido}
                    dettagli={settings.eoRapidoDettagli}
                    settingsHref={settingsHref}
                    onChange={(eoRapido) =>
                      patchScheda({
                        cartellaClinica: {
                          ...scheda.cartellaClinica,
                          esameObiettivo: {
                            ...scheda.cartellaClinica.esameObiettivo,
                            eoRapido,
                          },
                        },
                      })
                    }
                  />

                  <label className="form-grid-full stack-top">
                    Dettaglio EO
                    <textarea
                      rows={6}
                      value={scheda.cartellaClinica.esameObiettivo.dettaglioEo}
                      onChange={(event) =>
                        patchScheda({
                          cartellaClinica: {
                            ...scheda.cartellaClinica,
                            esameObiettivo: {
                              ...scheda.cartellaClinica.esameObiettivo,
                              dettaglioEo: event.target.value,
                            },
                          },
                        })
                      }
                    />
                  </label>

                  <RivalutazioniList
                    rows={scheda.cartellaClinica.esameObiettivo.rivalutazioni}
                    onChange={(rivalutazioni) =>
                      patchScheda({
                        cartellaClinica: {
                          ...scheda.cartellaClinica,
                          esameObiettivo: {
                            ...scheda.cartellaClinica.esameObiettivo,
                            rivalutazioni,
                          },
                        },
                      })
                    }
                  />
                </div>
              )}

              {cartellaTab === 'parametriFarmaci' && (
                <div className="parametri-farmaci-section">
                  <h3>Parametri</h3>
                  <VitalParamsTable
                    rows={scheda.cartellaClinica.parametriFarmaci.parametri}
                    onChange={(parametri) =>
                      patchScheda({
                        cartellaClinica: {
                          ...scheda.cartellaClinica,
                          parametriFarmaci: {
                            ...scheda.cartellaClinica.parametriFarmaci,
                            parametri,
                          },
                        },
                      })
                    }
                  />

                  <h3 className="stack-top">Farmaci</h3>
                  <FarmaciTable
                    rows={scheda.cartellaClinica.parametriFarmaci.farmaci}
                    onChange={(farmaci) =>
                      patchScheda({
                        cartellaClinica: {
                          ...scheda.cartellaClinica,
                          parametriFarmaci: {
                            ...scheda.cartellaClinica.parametriFarmaci,
                            farmaci,
                          },
                        },
                      })
                    }
                  />
                </div>
              )}
            </Card>
          )}

          {mainTab === 'dimissioni' && (
            <Card>
              <h2>Dimissioni</h2>
              <DimissioniSection
                dimissioni={scheda.dimissioni}
                settings={settings}
                settingsHref={settingsHref}
                chiuso={!paziente.aperto}
                saving={saving}
                onChange={(dimissioni) => patchScheda({ dimissioni })}
                onDimetti={() => void handleDimetti()}
                onPreviewPdf={() => setPdfPreviewOpen(true)}
              />
            </Card>
          )}

          {scheda && paziente && (
            <SchedaPdfPreview
              open={pdfPreviewOpen}
              onClose={() => setPdfPreviewOpen(false)}
              paziente={paziente}
              scheda={scheda}
              settings={settings}
              pmaNome={pmaNome}
              manifestazioneNome={manifestazioneNome}
              nome={nome}
              cognome={cognome}
              registratoIl={formatDateTime(paziente.createdAt)}
            />
          )}

          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva scheda'}
            </Button>
            {saved && <span className="save-ok">Salvato</span>}
          </div>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}
    </Layout>
  )
}
