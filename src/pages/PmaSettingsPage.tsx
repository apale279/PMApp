import { useEffect, useState, type FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Layout } from '../components/Layout'
import { getPma, getPmaSettings, savePmaSettings } from '../services/firestore'
import { EO_RAPIDO_LABELS, EO_RAPIDO_VOCI, type EoRapidoVoce, type PmaSettings } from '../types'
import { createDefaultPmaSettings } from '../utils/schedaDefaults'
import { linesToText, parseLines } from '../utils/settingsText'

function LinesTextEditor({
  label,
  hint,
  value,
  onChange,
  rows = 6,
  placeholder = 'Un valore per riga...',
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}) {
  return (
    <div className="settings-list-editor">
      <h3>{label}</h3>
      <p className="muted">{hint}</p>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function SettingsTextEditor({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <LinesTextEditor
      label={label}
      hint={hint}
      value={value}
      onChange={onChange}
      rows={5}
      placeholder="Testo da mostrare nella scheda paziente..."
    />
  )
}

export function PmaSettingsPage() {
  const { manifestazioneId, pmaId } = useParams<{
    manifestazioneId: string
    pmaId: string
  }>()

  const [pmaNome, setPmaNome] = useState('')
  const [settings, setSettings] = useState<PmaSettings>(createDefaultPmaSettings())
  const [motiviText, setMotiviText] = useState('')
  const [dettagliText, setDettagliText] = useState('')
  const [eoRapidoText, setEoRapidoText] = useState<Record<EoRapidoVoce, string>>(() =>
    Object.fromEntries(EO_RAPIDO_VOCI.map((voce) => [voce, ''])) as Record<EoRapidoVoce, string>,
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!manifestazioneId || !pmaId) return

    const load = async () => {
      setLoading(true)
      const [pma, pmaSettings] = await Promise.all([
        getPma(manifestazioneId, pmaId),
        getPmaSettings(manifestazioneId, pmaId),
      ])
      setPmaNome(pma?.nome ?? '')
      setSettings(pmaSettings)
      setMotiviText(linesToText(pmaSettings.motiviPresentazione))
      setDettagliText(linesToText(pmaSettings.dettagliMotivo))
      setEoRapidoText(
        Object.fromEntries(
          EO_RAPIDO_VOCI.map((voce) => [voce, linesToText(pmaSettings.eoRapidoDettagli[voce])]),
        ) as Record<EoRapidoVoce, string>,
      )
      setLoading(false)
    }

    void load()
  }, [manifestazioneId, pmaId])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!manifestazioneId || !pmaId) return

    const nextSettings: PmaSettings = {
      ...settings,
      motiviPresentazione: parseLines(motiviText),
      dettagliMotivo: parseLines(dettagliText),
      eoRapidoDettagli: Object.fromEntries(
        EO_RAPIDO_VOCI.map((voce) => [voce, parseLines(eoRapidoText[voce])]),
      ) as PmaSettings['eoRapidoDettagli'],
    }

    setSaving(true)
    setError(null)
    try {
      await savePmaSettings(manifestazioneId, pmaId, nextSettings)
      setSettings(nextSettings)
      setSaved(true)
    } catch {
      setError('Errore durante il salvataggio delle impostazioni.')
    } finally {
      setSaving(false)
    }
  }

  if (!manifestazioneId || !pmaId) return null

  return (
    <Layout
      title="Impostazioni PMA"
      subtitle={pmaNome}
      backTo={`/manifestazioni/${manifestazioneId}/pma/${pmaId}`}
      backLabel="Torna al PMA"
    >
      {loading ? (
        <p>Caricamento...</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <p className="muted">
              I menu nelle schede paziente usano liste di testo: inserisci un valore per riga.
            </p>

            <LinesTextEditor
              label="Motivi di presentazione *"
              hint="Opzioni disponibili nel menu a tendina della scheda anagrafica."
              value={motiviText}
              onChange={(value) => {
                setMotiviText(value)
                setSaved(false)
              }}
            />

            <LinesTextEditor
              label="Dettagli motivo *"
              hint="Opzioni per il dettaglio del motivo di presentazione."
              value={dettagliText}
              onChange={(value) => {
                setDettagliText(value)
                setSaved(false)
              }}
            />
          </Card>

          <Card className="stack-top">
            <h2>EO rapido</h2>
            <p className="muted">
              Configura i dettagli selezionabili per ogni voce dell&apos;EO rapido. NEGATIVO è
              sempre disponibile e non va aggiunto qui. Un valore per riga.
            </p>

            {EO_RAPIDO_VOCI.map((voce) => (
              <LinesTextEditor
                key={voce}
                label={`Dettagli ${EO_RAPIDO_LABELS[voce]}`}
                hint="Valori positivi selezionabili nella scheda paziente."
                value={eoRapidoText[voce]}
                onChange={(value) => {
                  setEoRapidoText((current) => ({ ...current, [voce]: value }))
                  setSaved(false)
                }}
              />
            ))}
          </Card>

          <Card className="stack-top">
            <h2>Dimissioni</h2>
            <p className="muted">
              Testi mostrati nel tab Dimissioni della scheda paziente.
            </p>

            <SettingsTextEditor
              label="Rifiuto invio in PS *"
              hint="Mostrato quando è selezionata la modalità Rifiuta invio in PS."
              value={settings.testoRifiutoInvioPs}
              onChange={(testoRifiutoInvioPs) => {
                setSettings((current) => ({ ...current, testoRifiutoInvioPs }))
                setSaved(false)
              }}
            />

            <SettingsTextEditor
              label="Consenso privacy *"
              hint="Testo del consenso privacy da confermare prima della dimissione."
              value={settings.testoConsensoPrivacy}
              onChange={(testoConsensoPrivacy) => {
                setSettings((current) => ({ ...current, testoConsensoPrivacy }))
                setSaved(false)
              }}
            />

            <SettingsTextEditor
              label="Consenso generico alle cure *"
              hint="Testo del consenso generico alle cure da confermare prima della dimissione."
              value={settings.testoConsensoGenericoCure}
              onChange={(testoConsensoGenericoCure) => {
                setSettings((current) => ({ ...current, testoConsensoGenericoCure }))
                setSaved(false)
              }}
            />
          </Card>

          <div className="form-actions">
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva impostazioni'}
            </Button>
            {saved && <span className="save-ok">Salvato</span>}
          </div>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}
    </Layout>
  )
}
