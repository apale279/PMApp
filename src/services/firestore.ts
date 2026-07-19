import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type {
  BedLayout,
  Manifestazione,
  Paziente,
  PazienteScheda,
  PazienteStato,
  Pma,
  PmaSettings,
} from '../types'
import { BED_DEFAULT_HEIGHT, BED_DEFAULT_WIDTH } from '../types'
import { createGridBedPosition, getBedDisplaySize } from '../utils/bedGrid'

export { getBedDisplaySize }
import { createDefaultPmaSettings, createDefaultScheda } from '../utils/schedaDefaults'
import { nowDatetimeLocal } from '../utils/vitals'
import {
  parsePmaSettings,
  parseScheda,
  schedaToFirestore,
} from './schedaFirestore'

function manifestazioniRef() {
  return collection(db, 'manifestazioni')
}

function pmasRef(manifestazioneId: string) {
  return collection(db, 'manifestazioni', manifestazioneId, 'pmas')
}

function pazientiRef(manifestazioneId: string, pmaId: string) {
  return collection(db, 'manifestazioni', manifestazioneId, 'pmas', pmaId, 'pazienti')
}

function counterRef(manifestazioneId: string) {
  return doc(db, 'manifestazioni', manifestazioneId, 'counters', 'pazienti')
}

function timestampToMillis(timestamp: Timestamp | undefined | null): number {
  if (!timestamp || typeof timestamp.toMillis !== 'function') return 0
  return timestamp.toMillis()
}

function readTimestamp(value: unknown): Timestamp | undefined {
  if (!value || typeof value !== 'object') return undefined
  if (typeof (value as Timestamp).toMillis !== 'function') return undefined
  return value as Timestamp
}

function parsePaziente(
  id: string,
  manifestazioneId: string,
  pmaId: string,
  data: Record<string, unknown>,
): Paziente {
  const statoRaw = data.stato as PazienteStato | undefined
  const stato: PazienteStato =
    statoRaw === 'IN_CARICO' || statoRaw === 'DIMESSO' ? statoRaw : 'IN_ATTESA'
  const aperto = typeof data.aperto === 'boolean' ? data.aperto : stato !== 'DIMESSO'

  return {
    id,
    manifestazioneId,
    pmaId,
    progressiveId: (data.progressiveId as number) ?? 0,
    nome: (data.nome as string) ?? '',
    cognome: (data.cognome as string) ?? '',
    stato,
    aperto,
    bedId: (data.bedId as string | null | undefined) ?? null,
    scheda: parseScheda(data),
    createdAt: readTimestamp(data.createdAt),
  }
}

function pazienteRef(manifestazioneId: string, pmaId: string, pazienteId: string) {
  return doc(db, 'manifestazioni', manifestazioneId, 'pmas', pmaId, 'pazienti', pazienteId)
}

function pmaRef(manifestazioneId: string, pmaId: string) {
  return doc(db, 'manifestazioni', manifestazioneId, 'pmas', pmaId)
}

function pmaSettingsRef(manifestazioneId: string, pmaId: string) {
  return doc(db, 'manifestazioni', manifestazioneId, 'pmas', pmaId, 'settings', 'config')
}

export async function listManifestazioni(): Promise<Manifestazione[]> {
  const snapshot = await getDocs(manifestazioniRef())

  await Promise.all(
    snapshot.docs
      .filter((d) => !readTimestamp(d.data().createdAt))
      .map((d) => updateDoc(d.ref, { createdAt: serverTimestamp() })),
  )

  const refreshed = snapshot.docs.some((d) => !readTimestamp(d.data().createdAt))
    ? await getDocs(manifestazioniRef())
    : snapshot

  return refreshed.docs
    .map((d) => ({
      id: d.id,
      nome: (d.data().nome as string) ?? 'Senza nome',
      createdAt: readTimestamp(d.data().createdAt),
    }))
    .sort((a, b) => timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt))
}

export async function createManifestazione(nome: string): Promise<string> {
  const docRef = await addDoc(manifestazioniRef(), {
    nome: nome.trim(),
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getManifestazione(id: string): Promise<Manifestazione | null> {
  const snapshot = await getDoc(doc(db, 'manifestazioni', id))
  if (!snapshot.exists()) return null
  return {
    id: snapshot.id,
    nome: snapshot.data().nome as string,
    createdAt: readTimestamp(snapshot.data().createdAt),
  }
}

export async function listPmas(manifestazioneId: string): Promise<Pma[]> {
  const snapshot = await getDocs(pmasRef(manifestazioneId))
  return snapshot.docs
    .map((d) => ({
      id: d.id,
      manifestazioneId,
      nome: d.data().nome as string,
      dettagli: d.data().dettagli as string,
      numeroLetti: d.data().numeroLetti as number,
      beds: (d.data().beds as BedLayout[]) ?? [],
      layoutConfigured: d.data().layoutConfigured as boolean,
      createdAt: readTimestamp(d.data().createdAt),
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'it'))
}

export async function isPmaNameTaken(
  manifestazioneId: string,
  nome: string,
  excludeId?: string,
): Promise<boolean> {
  const q = query(pmasRef(manifestazioneId), where('nome', '==', nome.trim()))
  const snapshot = await getDocs(q)
  return snapshot.docs.some((d) => d.id !== excludeId)
}

export async function createPma(
  manifestazioneId: string,
  data: { nome: string; dettagli: string; numeroLetti: number },
): Promise<string> {
  const docRef = await addDoc(pmasRef(manifestazioneId), {
    nome: data.nome.trim(),
    dettagli: data.dettagli.trim(),
    numeroLetti: data.numeroLetti,
    beds: [],
    layoutConfigured: false,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function getPma(manifestazioneId: string, pmaId: string): Promise<Pma | null> {
  const snapshot = await getDoc(doc(db, 'manifestazioni', manifestazioneId, 'pmas', pmaId))
  if (!snapshot.exists()) return null
  return {
    id: snapshot.id,
    manifestazioneId,
    nome: snapshot.data().nome as string,
    dettagli: snapshot.data().dettagli as string,
    numeroLetti: snapshot.data().numeroLetti as number,
    beds: (snapshot.data().beds as BedLayout[]) ?? [],
    layoutConfigured: snapshot.data().layoutConfigured as boolean,
    createdAt: readTimestamp(snapshot.data().createdAt),
  }
}

export async function updatePma(
  manifestazioneId: string,
  pmaId: string,
  data: { nome: string; dettagli: string; numeroLetti: number },
): Promise<void> {
  await updateDoc(pmaRef(manifestazioneId, pmaId), {
    nome: data.nome.trim(),
    dettagli: data.dettagli.trim(),
    numeroLetti: data.numeroLetti,
  })
}

export async function savePmaLayout(
  manifestazioneId: string,
  pmaId: string,
  beds: BedLayout[],
  numeroLetti?: number,
): Promise<void> {
  await updateDoc(pmaRef(manifestazioneId, pmaId), {
    beds,
    layoutConfigured: true,
    ...(numeroLetti !== undefined ? { numeroLetti } : {}),
  })
}

export async function savePmaEdit(
  manifestazioneId: string,
  pmaId: string,
  data: { nome: string; dettagli: string; numeroLetti: number; beds: BedLayout[] },
): Promise<void> {
  const removedBedIds = await unassignPatientsFromRemovedBeds(
    manifestazioneId,
    pmaId,
    data.beds.map((bed) => bed.id),
  )

  if (removedBedIds.length > 0) {
    // patients already moved to no-bed in unassignPatientsFromRemovedBeds
  }

  await updateDoc(pmaRef(manifestazioneId, pmaId), {
    nome: data.nome.trim(),
    dettagli: data.dettagli.trim(),
    numeroLetti: data.numeroLetti,
    beds: data.beds,
    layoutConfigured: true,
  })
}

async function unassignPatientsFromRemovedBeds(
  manifestazioneId: string,
  pmaId: string,
  keptBedIds: string[],
): Promise<string[]> {
  const pazienti = await listPazienti(manifestazioneId, pmaId)
  const removed: string[] = []

  await Promise.all(
    pazienti
      .filter((p) => p.bedId && !keptBedIds.includes(p.bedId))
      .map(async (p) => {
        removed.push(p.bedId!)
        await updateDoc(pazienteRef(manifestazioneId, pmaId, p.id), {
          bedId: null,
          stato: 'IN_CARICO',
          aperto: true,
        })
      }),
  )

  return removed
}

export async function listPazienti(
  manifestazioneId: string,
  pmaId: string,
): Promise<Paziente[]> {
  const snapshot = await getDocs(pazientiRef(manifestazioneId, pmaId))
  return snapshot.docs
    .map((d) => parsePaziente(d.id, manifestazioneId, pmaId, d.data()))
    .sort((a, b) => b.progressiveId - a.progressiveId)
}

export async function createPaziente(
  manifestazioneId: string,
  pmaId: string,
  data: { nome?: string; cognome?: string } = {},
): Promise<string> {
  return runTransaction(db, async (transaction) => {
    const counterDoc = counterRef(manifestazioneId)
    const counterSnap = await transaction.get(counterDoc)
    const lastId = counterSnap.exists() ? (counterSnap.data().lastId as number) : 0
    const progressiveId = lastId + 1

    transaction.set(counterDoc, { lastId: progressiveId }, { merge: true })

    const newPazienteRef = doc(pazientiRef(manifestazioneId, pmaId))
    const scheda = createDefaultScheda()
    scheda.anagrafica.timestamp = nowDatetimeLocal()

    transaction.set(newPazienteRef, {
      nome: (data.nome ?? '').trim(),
      cognome: (data.cognome ?? '').trim(),
      progressiveId,
      stato: 'IN_ATTESA',
      aperto: true,
      bedId: null,
      scheda: schedaToFirestore(scheda),
      createdAt: serverTimestamp(),
    })

    return newPazienteRef.id
  })
}

export async function getPaziente(
  manifestazioneId: string,
  pmaId: string,
  pazienteId: string,
): Promise<Paziente | null> {
  const snapshot = await getDoc(
    doc(db, 'manifestazioni', manifestazioneId, 'pmas', pmaId, 'pazienti', pazienteId),
  )
  if (!snapshot.exists()) return null
  return parsePaziente(snapshot.id, manifestazioneId, pmaId, snapshot.data())
}

export async function updatePaziente(
  manifestazioneId: string,
  pmaId: string,
  pazienteId: string,
  data: { nome: string; cognome: string },
): Promise<void> {
  await updateDoc(pazienteRef(manifestazioneId, pmaId, pazienteId), {
    nome: data.nome.trim(),
    cognome: data.cognome.trim(),
  })
}

export async function savePazienteScheda(
  manifestazioneId: string,
  pmaId: string,
  pazienteId: string,
  data: { nome: string; cognome: string; scheda: PazienteScheda },
): Promise<void> {
  await updateDoc(pazienteRef(manifestazioneId, pmaId, pazienteId), {
    nome: data.nome.trim(),
    cognome: data.cognome.trim(),
    scheda: schedaToFirestore(data.scheda),
  })
}

export async function getPmaSettings(
  manifestazioneId: string,
  pmaId: string,
): Promise<PmaSettings> {
  const snapshot = await getDoc(pmaSettingsRef(manifestazioneId, pmaId))
  if (!snapshot.exists()) {
    return createDefaultPmaSettings()
  }
  return parsePmaSettings(snapshot.data())
}

export async function savePmaSettings(
  manifestazioneId: string,
  pmaId: string,
  settings: PmaSettings,
): Promise<void> {
  await setDoc(
    pmaSettingsRef(manifestazioneId, pmaId),
    {
      motiviPresentazione: settings.motiviPresentazione.map((v) => v.trim()).filter(Boolean),
      dettagliMotivo: settings.dettagliMotivo.map((v) => v.trim()).filter(Boolean),
      eoRapidoDettagli: settings.eoRapidoDettagli,
      testoRifiutoInvioPs: settings.testoRifiutoInvioPs.trim(),
      testoConsensoPrivacy: settings.testoConsensoPrivacy.trim(),
      testoConsensoGenericoCure: settings.testoConsensoGenericoCure.trim(),
    },
    { merge: true },
  )
}

export async function deletePaziente(
  manifestazioneId: string,
  pmaId: string,
  pazienteId: string,
): Promise<void> {
  await deleteDoc(pazienteRef(manifestazioneId, pmaId, pazienteId))
}

export async function movePaziente(
  manifestazioneId: string,
  pmaId: string,
  pazienteId: string,
  targetZone: 'waiting' | 'no-bed' | string,
): Promise<void> {
  const pazienti = await listPazienti(manifestazioneId, pmaId)
  const paziente = pazienti.find((p) => p.id === pazienteId)
  if (!paziente) throw new Error('Paziente non trovato')
  if (!paziente.aperto) throw new Error('Paziente dimesso')

  if (targetZone === 'waiting') {
    await updateDoc(pazienteRef(manifestazioneId, pmaId, pazienteId), {
      stato: 'IN_ATTESA',
      aperto: true,
      bedId: null,
    })
    return
  }

  if (targetZone === 'no-bed') {
    await updateDoc(pazienteRef(manifestazioneId, pmaId, pazienteId), {
      stato: 'IN_CARICO',
      aperto: true,
      bedId: null,
    })
    return
  }

  const occupant = pazienti.find(
    (p) => p.id !== pazienteId && p.bedId === targetZone && p.aperto,
  )
  if (occupant) throw new Error('Letto già occupato')

  await updateDoc(pazienteRef(manifestazioneId, pmaId, pazienteId), {
    stato: 'IN_CARICO',
    aperto: true,
    bedId: targetZone,
  })
}

export async function takeInChargeWithoutBed(
  manifestazioneId: string,
  pmaId: string,
  pazienteId: string,
): Promise<void> {
  await movePaziente(manifestazioneId, pmaId, pazienteId, 'no-bed')
}

export async function dimettiPaziente(
  manifestazioneId: string,
  pmaId: string,
  pazienteId: string,
  data?: { nome: string; cognome: string; scheda: PazienteScheda },
): Promise<void> {
  const update: Record<string, unknown> = {
    stato: 'DIMESSO',
    aperto: false,
    bedId: null,
  }

  if (data) {
    update.nome = data.nome.trim()
    update.cognome = data.cognome.trim()
    update.scheda = schedaToFirestore(data.scheda)
  }

  await updateDoc(pazienteRef(manifestazioneId, pmaId, pazienteId), update)
}

export function listPazientiAperti(pazienti: Paziente[]): Paziente[] {
  return pazienti.filter((p) => p.aperto)
}

export function listPazientiChiusi(pazienti: Paziente[]): Paziente[] {
  return pazienti.filter((p) => !p.aperto)
}

export function createInitialBeds(count: number): BedLayout[] {
  return Array.from({ length: count }, (_, index) => {
    const { x, y } = createGridBedPosition(index, count)
    return {
      id: crypto.randomUUID(),
      number: index + 1,
      x,
      y,
      width: BED_DEFAULT_WIDTH,
      height: BED_DEFAULT_HEIGHT,
    }
  })
}

export function resizeBeds(existing: BedLayout[], newCount: number): BedLayout[] {
  if (newCount <= existing.length) {
    return existing.slice(0, newCount)
  }

  const startIndex = existing.length
  const extra = Array.from({ length: newCount - existing.length }, (_, offset) => {
    const index = startIndex + offset
    const { x, y } = createGridBedPosition(index, newCount)
    return {
      id: crypto.randomUUID(),
      number: index + 1,
      x,
      y,
      width: BED_DEFAULT_WIDTH,
      height: BED_DEFAULT_HEIGHT,
    }
  })

  return [...existing, ...extra]
}

export function applyPatientPlacement(
  pazienti: Paziente[],
  pazienteId: string,
  zoneId: string,
): Paziente[] {
  const patient = pazienti.find((p) => p.id === pazienteId)
  if (!patient) return pazienti

  if (zoneId !== 'waiting' && zoneId !== 'no-bed') {
    const occupied = pazienti.some(
      (p) => p.id !== pazienteId && p.aperto && p.bedId === zoneId,
    )
    if (occupied) return pazienti
  }

  return pazienti.map((p) => {
    if (p.id !== pazienteId) return p

    if (zoneId === 'waiting') {
      return { ...p, stato: 'IN_ATTESA', aperto: true, bedId: null }
    }
    if (zoneId === 'no-bed') {
      return { ...p, stato: 'IN_CARICO', aperto: true, bedId: null }
    }
    return { ...p, stato: 'IN_CARICO', aperto: true, bedId: zoneId }
  })
}

export function applyPatientDismissed(pazienti: Paziente[], pazienteId: string): Paziente[] {
  return pazienti.map((p) =>
    p.id === pazienteId ? { ...p, stato: 'DIMESSO', aperto: false, bedId: null } : p,
  )
}

export function statoLabel(stato: PazienteStato): string {
  switch (stato) {
    case 'IN_ATTESA':
      return 'In attesa'
    case 'IN_CARICO':
      return 'In carico'
    case 'DIMESSO':
      return 'Dimesso'
  }
}

export function formatDateTime(timestamp: Timestamp | undefined): string {
  if (!timestamp) return '—'
  return timestamp.toDate().toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
