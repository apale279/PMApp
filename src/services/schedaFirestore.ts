import type {
  AllergieRisposta,
  AnagraficaScheda,
  AnamnesiRapidaVoce,
  AnamnesiScheda,
  CartellaClinicaScheda,
  CodiceColore,
  DimissioneModalita,
  DimissioniScheda,
  EoBodyPoint,
  EoRapidoDettagli,
  EoRapidoSezione,
  EoRapidoVoce,
  EsameObiettivoScheda,
  FarmacoRow,
  InvioPsCodice,
  ParametriFarmaciScheda,
  PazienteScheda,
  PmaSettings,
  RivalutazioneRow,
  TriageScheda,
  VitalParamRow,
} from '../types'
import {
  ANAMNESI_RAPIDA_VOCI,
  DIMISSIONE_MODALITA,
  EO_RAPIDO_VOCI,
  NEGATIVO_EO,
} from '../types'
import {
  createDefaultAnamnesi,
  createDefaultDimissioni,
  createDefaultEoRapido,
  createDefaultEsameObiettivo,
  createDefaultParametriFarmaci,
  createDefaultPmaSettings,
  createDefaultScheda,
} from '../utils/schedaDefaults'
import { parseStringList } from '../utils/settingsText'
import { nowDatetimeLocal } from '../utils/vitals'

function parseVitalRow(raw: Record<string, unknown>): VitalParamRow {
  const num = (key: string) => {
    const value = raw[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }

  return {
    id: (raw.id as string) ?? crypto.randomUUID(),
    timestamp: (raw.timestamp as string) ?? nowDatetimeLocal(),
    gcs: num('gcs'),
    fr: num('fr'),
    spo2Aa: num('spo2Aa'),
    spo2O2: num('spo2O2'),
    fc: num('fc'),
    paSis: num('paSis'),
    paDias: num('paDias'),
    temp: num('temp'),
    dtx: num('dtx'),
    nrs: num('nrs'),
  }
}

function parseFarmacoRow(raw: Record<string, unknown>): FarmacoRow {
  return {
    id: (raw.id as string) ?? crypto.randomUUID(),
    timestamp: (raw.timestamp as string) ?? nowDatetimeLocal(),
    nome: (raw.nome as string) ?? '',
    dose: (raw.dose as string) ?? '',
    via: (raw.via as string) ?? '',
  }
}

function parseRivalutazioneRow(raw: Record<string, unknown>): RivalutazioneRow {
  return {
    id: (raw.id as string) ?? crypto.randomUUID(),
    timestamp: (raw.timestamp as string) ?? nowDatetimeLocal(),
    descrizione: (raw.descrizione as string) ?? '',
  }
}

function parseEoBodyPoint(raw: Record<string, unknown>): EoBodyPoint {
  const view = raw.view === 'back' ? 'back' : 'front'
  const xPercent = typeof raw.xPercent === 'number' ? raw.xPercent : 0
  const yPercent = typeof raw.yPercent === 'number' ? raw.yPercent : 0

  return {
    id: (raw.id as string) ?? crypto.randomUUID(),
    number: typeof raw.number === 'number' ? raw.number : 1,
    view,
    xPercent: Math.max(0, Math.min(100, xPercent)),
    yPercent: Math.max(0, Math.min(100, yPercent)),
    note: (raw.note as string) ?? '',
  }
}

function parseEoRapido(raw: unknown): EoRapidoSezione[] {
  const defaults = createDefaultEoRapido()
  if (!Array.isArray(raw)) return defaults

  const byVoce = new Map<EoRapidoVoce, EoRapidoSezione>()
  defaults.forEach((section) => byVoce.set(section.voce, section))

  raw.forEach((item) => {
    const row = item as Record<string, unknown>
    const voce = row.voce as EoRapidoVoce
    if (!EO_RAPIDO_VOCI.includes(voce)) return

    const selezionatiRaw = row.selezionati
    const selezionati = Array.isArray(selezionatiRaw)
      ? (selezionatiRaw as string[]).filter(Boolean)
      : [NEGATIVO_EO]

    byVoce.set(voce, {
      voce,
      selezionati: selezionati.length > 0 ? selezionati : [NEGATIVO_EO],
    })
  })

  return EO_RAPIDO_VOCI.map((voce) => byVoce.get(voce)!)
}

function parseAnagrafica(raw: Record<string, unknown> | undefined): AnagraficaScheda {
  const defaults = createDefaultScheda().anagrafica
  if (!raw) return defaults

  const codiceRaw = raw.codiceColore
  const codiceColore: CodiceColore | null =
    codiceRaw === 'B' || codiceRaw === 'V' || codiceRaw === 'G' || codiceRaw === 'R'
      ? codiceRaw
      : null

  return {
    timestamp: (raw.timestamp as string) ?? defaults.timestamp,
    dataNascita: (raw.dataNascita as string) ?? '',
    comune: (raw.comune as string) ?? '',
    indirizzo: (raw.indirizzo as string) ?? '',
    telefono: (raw.telefono as string) ?? '',
    mail: (raw.mail as string) ?? '',
    motivoPresentazione: (raw.motivoPresentazione as string) ?? '',
    dettagliMotivo: (raw.dettagliMotivo as string) ?? '',
    codiceColore,
  }
}

function parseAnamnesi(raw: Record<string, unknown> | undefined): AnamnesiScheda {
  const defaults = createDefaultAnamnesi()
  if (!raw) return defaults

  const allergieRaw = raw.allergie as AllergieRisposta | null | undefined
  const allergie =
    allergieRaw === 'SI' || allergieRaw === 'NO' || allergieRaw === 'NON_NOTO'
      ? allergieRaw
      : null

  const anamnesiRapidaRaw = raw.anamnesiRapida
  const anamnesiRapida = Array.isArray(anamnesiRapidaRaw)
    ? (anamnesiRapidaRaw as string[]).filter((item): item is AnamnesiRapidaVoce =>
        ANAMNESI_RAPIDA_VOCI.includes(item as AnamnesiRapidaVoce),
      )
    : []

  return {
    allergie,
    dettaglioAllergie: (raw.dettaglioAllergie as string) ?? '',
    anamnesiRapida,
    apr: (raw.apr as string) ?? 'Muta',
    app: (raw.app as string) ?? '',
  }
}

function parseEsameObiettivo(raw: Record<string, unknown> | undefined): EsameObiettivoScheda {
  const defaults = createDefaultEsameObiettivo()
  if (!raw) return defaults

  const puntiRaw = raw.puntiCorpo
  const puntiCorpo = Array.isArray(puntiRaw)
    ? puntiRaw.map((item) => parseEoBodyPoint(item as Record<string, unknown>))
    : []

  const rivalutazioniRaw = raw.rivalutazioni
  const rivalutazioni = Array.isArray(rivalutazioniRaw)
    ? rivalutazioniRaw.map((item) => parseRivalutazioneRow(item as Record<string, unknown>))
    : []

  return {
    puntiCorpo,
    eoRapido: parseEoRapido(raw.eoRapido),
    dettaglioEo: (raw.dettaglioEo as string) ?? '',
    rivalutazioni,
  }
}

function parseParametriFarmaci(raw: Record<string, unknown> | undefined): ParametriFarmaciScheda {
  const defaults = createDefaultParametriFarmaci()
  if (!raw) return defaults

  const parametriRaw = raw.parametri
  const parametri = Array.isArray(parametriRaw)
    ? parametriRaw.map((row) => parseVitalRow(row as Record<string, unknown>))
    : []

  const farmaciRaw = raw.farmaci
  const farmaci = Array.isArray(farmaciRaw)
    ? farmaciRaw.map((row) => parseFarmacoRow(row as Record<string, unknown>))
    : []

  return { parametri, farmaci }
}

function parseDimissioni(raw: Record<string, unknown> | undefined): DimissioniScheda {
  const defaults = createDefaultDimissioni()
  if (!raw) return defaults

  const esitoRaw = raw.esito ?? (Array.isArray(raw.modalita) ? raw.modalita[0] : null)
  const esito =
    typeof esitoRaw === 'string' &&
    DIMISSIONE_MODALITA.includes(esitoRaw as DimissioneModalita)
      ? (esitoRaw as DimissioneModalita)
      : null

  const invioPsRaw = raw.invioPs as Record<string, unknown> | undefined
  const numeroMissioneSoreu =
    typeof invioPsRaw?.numeroMissioneSoreu === 'number' &&
    Number.isFinite(invioPsRaw.numeroMissioneSoreu)
      ? invioPsRaw.numeroMissioneSoreu
      : null

  const codiceRaw = invioPsRaw?.codice
  const codice: InvioPsCodice | null =
    codiceRaw === 'V' || codiceRaw === 'G' || codiceRaw === 'R' ? codiceRaw : null

  const riaffidatoRaw = raw.riaffidatoA as Record<string, unknown> | undefined

  return {
    esito,
    noteDimissione: (raw.noteDimissione as string) ?? '',
    invioPs: {
      numeroMissioneSoreu,
      oraMissione: (invioPsRaw?.oraMissione as string) ?? '',
      codice,
      ospedaleDestinazione: (invioPsRaw?.ospedaleDestinazione as string) ?? '',
      mezzo: (invioPsRaw?.mezzo as string) ?? '',
    },
    riaffidatoA: {
      nomeCognomeAffidatario: (riaffidatoRaw?.nomeCognomeAffidatario as string) ?? '',
      relazione: (riaffidatoRaw?.relazione as string) ?? '',
    },
    consensoPrivacy: raw.consensoPrivacy === true,
    consensoGenericoCure: raw.consensoGenericoCure === true,
    dimissioneTimestamp: (raw.dimissioneTimestamp as string | null) ?? null,
  }
}

function parseTriage(raw: Record<string, unknown> | undefined): TriageScheda {
  if (!raw) return createDefaultScheda().triage

  const parametriRaw = raw.parametri
  const parametri = Array.isArray(parametriRaw)
    ? parametriRaw.map((row) => parseVitalRow(row as Record<string, unknown>))
    : []

  return {
    parametri,
    note: (raw.note as string) ?? '',
  }
}

function parseCartellaClinica(raw: Record<string, unknown> | undefined): CartellaClinicaScheda {
  return {
    anamnesi: parseAnamnesi(raw?.anamnesi as Record<string, unknown>),
    esameObiettivo: parseEsameObiettivo(raw?.esameObiettivo as Record<string, unknown>),
    parametriFarmaci: parseParametriFarmaci(raw?.parametriFarmaci as Record<string, unknown>),
  }
}

export function parseScheda(data: Record<string, unknown>): PazienteScheda {
  const raw = data.scheda as Record<string, unknown> | undefined
  if (!raw) return createDefaultScheda()

  return {
    anagrafica: parseAnagrafica(raw.anagrafica as Record<string, unknown>),
    triage: parseTriage(raw.triage as Record<string, unknown>),
    cartellaClinica: parseCartellaClinica(raw.cartellaClinica as Record<string, unknown>),
    dimissioni: parseDimissioni(raw.dimissioni as Record<string, unknown>),
  }
}

function parseEoRapidoDettagli(raw: Record<string, unknown> | undefined): EoRapidoDettagli {
  const defaults = createDefaultPmaSettings().eoRapidoDettagli
  if (!raw) return defaults

  const next = { ...defaults }
  EO_RAPIDO_VOCI.forEach((voce) => {
    const values = raw[voce]
    next[voce] = parseStringList(values)
  })
  return next
}

export function parsePmaSettings(data: Record<string, unknown> | undefined): PmaSettings {
  const defaults = createDefaultPmaSettings()
  return {
    motiviPresentazione: parseStringList(data?.motiviPresentazione),
    dettagliMotivo: parseStringList(data?.dettagliMotivo),
    eoRapidoDettagli: parseEoRapidoDettagli(data?.eoRapidoDettagli as Record<string, unknown>),
    testoRifiutoInvioPs: (data?.testoRifiutoInvioPs as string) ?? defaults.testoRifiutoInvioPs,
    testoConsensoPrivacy: (data?.testoConsensoPrivacy as string) ?? defaults.testoConsensoPrivacy,
    testoConsensoGenericoCure:
      (data?.testoConsensoGenericoCure as string) ?? defaults.testoConsensoGenericoCure,
  }
}

export function schedaToFirestore(scheda: PazienteScheda): Record<string, unknown> {
  return {
    anagrafica: scheda.anagrafica,
    triage: scheda.triage,
    cartellaClinica: scheda.cartellaClinica,
    dimissioni: scheda.dimissioni,
  }
}
