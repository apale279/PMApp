import {
  EO_RAPIDO_VOCI,
  NEGATIVO_EO,
  type AnamnesiScheda,
  type DimissioniScheda,
  type EoRapidoSezione,
  type EsameObiettivoScheda,
  type FarmacoRow,
  type ParametriFarmaciScheda,
  type PazienteScheda,
  type PmaSettings,
  type RivalutazioneRow,
  type VitalParamRow,
} from '../types'
import { nowDatetimeLocal } from './vitals'

export function createEmptyVitalRow(): VitalParamRow {
  return {
    id: crypto.randomUUID(),
    timestamp: nowDatetimeLocal(),
    gcs: null,
    fr: null,
    spo2Aa: null,
    spo2O2: null,
    fc: null,
    paSis: null,
    paDias: null,
    temp: null,
    dtx: null,
    nrs: null,
  }
}

export function createEmptyFarmacoRow(): FarmacoRow {
  return {
    id: crypto.randomUUID(),
    timestamp: nowDatetimeLocal(),
    nome: '',
    dose: '',
    via: '',
  }
}

export function createEmptyRivalutazioneRow(): RivalutazioneRow {
  return {
    id: crypto.randomUUID(),
    timestamp: nowDatetimeLocal(),
    descrizione: '',
  }
}

export function createDefaultEoRapido(): EoRapidoSezione[] {
  return EO_RAPIDO_VOCI.map((voce) => ({
    voce,
    selezionati: [NEGATIVO_EO],
  }))
}

export function createDefaultEsameObiettivo(): EsameObiettivoScheda {
  return {
    puntiCorpo: [],
    eoRapido: createDefaultEoRapido(),
    dettaglioEo: '',
    rivalutazioni: [],
  }
}

export function createDefaultParametriFarmaci(): ParametriFarmaciScheda {
  return {
    parametri: [],
    farmaci: [],
  }
}

export function createDefaultDimissioni(): DimissioniScheda {
  return {
    esito: null,
    noteDimissione: '',
    invioPs: {
      numeroMissioneSoreu: null,
      oraMissione: '',
      codice: null,
      ospedaleDestinazione: '',
      mezzo: '',
    },
    riaffidatoA: {
      nomeCognomeAffidatario: '',
      relazione: '',
    },
    consensoPrivacy: false,
    consensoGenericoCure: false,
    dimissioneTimestamp: null,
  }
}

export function createDefaultPmaSettings(): PmaSettings {
  return {
    motiviPresentazione: [],
    dettagliMotivo: [],
    eoRapidoDettagli: {
      GENERALE: [],
      NEUROLOGICO: [],
      TORACE: [],
      CUTE: [],
      ADDOME: [],
      CAPO_COLLO: [],
    },
    testoRifiutoInvioPs: '',
    testoConsensoPrivacy: '',
    testoConsensoGenericoCure: '',
  }
}

export function createDefaultScheda(): PazienteScheda {
  return {
    anagrafica: {
      timestamp: nowDatetimeLocal(),
      dataNascita: '',
      comune: '',
      indirizzo: '',
      telefono: '',
      mail: '',
      motivoPresentazione: '',
      dettagliMotivo: '',
      codiceColore: null,
    },
    triage: {
      parametri: [],
      note: '',
    },
    cartellaClinica: {
      anamnesi: createDefaultAnamnesi(),
      esameObiettivo: createDefaultEsameObiettivo(),
      parametriFarmaci: createDefaultParametriFarmaci(),
    },
    dimissioni: createDefaultDimissioni(),
  }
}

export function createDefaultAnamnesi(): AnamnesiScheda {
  return {
    allergie: null,
    dettaglioAllergie: '',
    anamnesiRapida: [],
    apr: 'Muta',
    app: '',
  }
}
