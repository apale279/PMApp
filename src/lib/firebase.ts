import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

let _app: FirebaseApp
let _db: Firestore
let _initError: Error | null = null

try {
  _app = initializeApp(firebaseConfig)
  // persistentLocalCache + persistentMultipleTabManager: offline-first, IndexedDB,
  // multi-tab, senza usare l'API deprecata enableIndexedDbPersistence
  _db = initializeFirestore(_app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })
} catch (err) {
  _initError = err instanceof Error ? err : new Error(String(err))
  console.error('[PMApp] Errore inizializzazione Firebase:', _initError)
  // Le variabili restano undefined — l'ErrorBoundary cattura gli errori a runtime
  _app = undefined as unknown as FirebaseApp
  _db = undefined as unknown as Firestore
}

export const app = _app
export const db = _db
export const firebaseInitError = _initError
