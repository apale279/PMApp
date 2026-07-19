import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

// Chiedi al browser di non cancellare i dati offline (IndexedDB Firestore)
// sotto pressione di memoria. Fire-and-forget, non bloccante.
if (navigator.storage?.persist) {
  void navigator.storage.persist().then((granted) => {
    if (!granted) {
      console.warn('[PMApp] Persistent storage non concesso: i dati offline potrebbero essere eliminati dal browser.')
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
