import { Timestamp } from 'firebase/firestore'

export interface Manifestazione {
  id: string
  nome: string
  createdAt?: Timestamp
}

export interface BedLayout {
  id: string
  number: number
  x: number
  y: number
  width: number
  height: number
}

export interface Pma {
  id: string
  manifestazioneId: string
  nome: string
  dettagli: string
  numeroLetti: number
  beds: BedLayout[]
  layoutConfigured: boolean
  createdAt?: Timestamp
}

export type PazienteStato = 'IN_ATTESA' | 'IN_CARICO' | 'DIMESSO'

export type AllergieRisposta = 'SI' | 'NO' | 'NON_NOTO'

export const ANAMNESI_RAPIDA_VOCI = [
  'NEUROLOGICA',
  'RESPIRATORIA',
  'CIRCOLATORIA',
  'METABOLICA',
  'EMATO_ONCO',
] as const

export type AnamnesiRapidaVoce = (typeof ANAMNESI_RAPIDA_VOCI)[number]

export const EO_RAPIDO_VOCI = [
  'GENERALE',
  'NEUROLOGICO',
  'TORACE',
  'CUTE',
  'ADDOME',
  'CAPO_COLLO',
] as const

export type EoRapidoVoce = (typeof EO_RAPIDO_VOCI)[number]

export const EO_RAPIDO_LABELS: Record<EoRapidoVoce, string> = {
  GENERALE: 'Generale',
  NEUROLOGICO: 'Neurologico',
  TORACE: 'Torace',
  CUTE: 'Cute',
  ADDOME: 'Addome',
  CAPO_COLLO: 'Capo/Collo',
}

export const NEGATIVO_EO = 'NEGATIVO'

export type BodyMapView = 'front' | 'back'

export interface EoBodyPoint {
  id: string
  number: number
  view: BodyMapView
  xPercent: number
  yPercent: number
  note: string
}

export interface EoRapidoSezione {
  voce: EoRapidoVoce
  selezionati: string[]
}

export interface RivalutazioneRow {
  id: string
  timestamp: string
  descrizione: string
}

export interface EsameObiettivoScheda {
  puntiCorpo: EoBodyPoint[]
  eoRapido: EoRapidoSezione[]
  dettaglioEo: string
  rivalutazioni: RivalutazioneRow[]
}

export interface FarmacoRow {
  id: string
  timestamp: string
  nome: string
  dose: string
  via: string
}

export interface ParametriFarmaciScheda {
  parametri: VitalParamRow[]
  farmaci: FarmacoRow[]
}

export const DIMISSIONE_MODALITA = [
  'DIMESSO',
  'INVIO_PS',
  'SI_ALLONTANA',
  'RIFIUTA_INVIO_PS',
  'RIAFFIDATO_A',
] as const

export type DimissioneModalita = (typeof DIMISSIONE_MODALITA)[number]

export const DIMISSIONE_MODALITA_LABELS: Record<DimissioneModalita, string> = {
  DIMESSO: 'Dimesso',
  INVIO_PS: 'Invio in PS',
  SI_ALLONTANA: 'Si allontana',
  RIFIUTA_INVIO_PS: 'Rifiuta invio in PS',
  RIAFFIDATO_A: 'Riaffidato a',
}

export type InvioPsCodice = 'V' | 'G' | 'R'

export interface InvioPsDettagli {
  numeroMissioneSoreu: number | null
  oraMissione: string
  codice: InvioPsCodice | null
  ospedaleDestinazione: string
  mezzo: string
}

export interface RiaffidatoADettagli {
  nomeCognomeAffidatario: string
  relazione: string
}

export interface DimissioniScheda {
  esito: DimissioneModalita | null
  noteDimissione: string
  invioPs: InvioPsDettagli
  riaffidatoA: RiaffidatoADettagli
  consensoPrivacy: boolean
  consensoGenericoCure: boolean
  dimissioneTimestamp: string | null
}

export type EoRapidoDettagli = Record<EoRapidoVoce, string[]>

export interface VitalParamRow {
  id: string
  timestamp: string
  gcs: number | null
  fr: number | null
  spo2Aa: number | null
  spo2O2: number | null
  fc: number | null
  paSis: number | null
  paDias: number | null
  temp: number | null
  dtx: number | null
  nrs: number | null
}

export type CodiceColore = 'B' | 'V' | 'G' | 'R'

export const CODICI_COLORE: CodiceColore[] = ['B', 'V', 'G', 'R']

export interface AnagraficaScheda {
  timestamp: string
  dataNascita: string
  comune: string
  indirizzo: string
  telefono: string
  mail: string
  motivoPresentazione: string
  dettagliMotivo: string
  codiceColore: CodiceColore | null
}

export interface TriageScheda {
  parametri: VitalParamRow[]
  note: string
}

export interface AnamnesiScheda {
  allergie: AllergieRisposta | null
  dettaglioAllergie: string
  anamnesiRapida: AnamnesiRapidaVoce[]
  apr: string
  app: string
}

export interface CartellaClinicaScheda {
  anamnesi: AnamnesiScheda
  esameObiettivo: EsameObiettivoScheda
  parametriFarmaci: ParametriFarmaciScheda
}

export interface PazienteScheda {
  anagrafica: AnagraficaScheda
  triage: TriageScheda
  cartellaClinica: CartellaClinicaScheda
  dimissioni: DimissioniScheda
}

export interface PmaSettings {
  motiviPresentazione: string[]
  dettagliMotivo: string[]
  eoRapidoDettagli: EoRapidoDettagli
  testoRifiutoInvioPs: string
  testoConsensoPrivacy: string
  testoConsensoGenericoCure: string
}

export interface Paziente {
  id: string
  manifestazioneId: string
  pmaId: string
  progressiveId: number
  nome: string
  cognome: string
  stato: PazienteStato
  aperto: boolean
  bedId: string | null
  scheda: PazienteScheda
  createdAt?: Timestamp
}

export interface PmaDraft {
  nome: string
  dettagli: string
  numeroLetti: number
}

export type DropZoneId = 'waiting' | 'no-bed' | string

export const GRID_CELL_SIZE = 24
export const BED_DEFAULT_WIDTH = GRID_CELL_SIZE * 7
export const BED_DEFAULT_HEIGHT = GRID_CELL_SIZE * 5
export const BED_GAP = GRID_CELL_SIZE

export const DROP_ZONE_WAITING = 'waiting'
export const DROP_ZONE_NO_BED = 'no-bed'
