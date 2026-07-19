import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { firebaseInitError } from './lib/firebase'
import { HomePage } from './pages/HomePage'
import { ManifestazionePage } from './pages/ManifestazionePage'
import { PmaSettingsPage } from './pages/PmaSettingsPage'
import { PazientiElencoPage } from './pages/PazientiElencoPage'
import { PazienteFormPage } from './pages/PazienteFormPage'
import { PazienteSchedaPage } from './pages/PazienteSchedaPage'
import { PmaEditPage } from './pages/PmaEditPage'
import { PmaPage } from './pages/PmaPage'
import { PmaWizardPage } from './pages/PmaWizardPage'

export default function App() {
  return (
    <BrowserRouter>
      {firebaseInitError && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: '#fef2f2',
            borderTop: '2px solid #fca5a5',
            padding: '0.5rem 1rem',
            fontSize: '0.8rem',
            color: '#b91c1c',
            textAlign: 'center',
          }}
        >
          ⚠️ Errore Firebase: {firebaseInitError.message} — modalità offline limitata
        </div>
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/manifestazioni/:manifestazioneId" element={<ManifestazionePage />} />
        <Route
          path="/manifestazioni/:manifestazioneId/pma/nuovo"
          element={<PmaWizardPage />}
        />
        <Route path="/manifestazioni/:manifestazioneId/pma/:pmaId" element={<PmaPage />} />
        <Route
          path="/manifestazioni/:manifestazioneId/pma/:pmaId/modifica"
          element={<PmaEditPage />}
        />
        <Route
          path="/manifestazioni/:manifestazioneId/pma/:pmaId/impostazioni"
          element={<PmaSettingsPage />}
        />
        <Route
          path="/manifestazioni/:manifestazioneId/pma/:pmaId/pazienti/nuovo"
          element={<PazienteFormPage />}
        />
        <Route
          path="/manifestazioni/:manifestazioneId/pma/:pmaId/pazienti/elenco"
          element={<PazientiElencoPage />}
        />
        <Route
          path="/manifestazioni/:manifestazioneId/pma/:pmaId/pazienti/:pazienteId"
          element={<PazienteSchedaPage />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
