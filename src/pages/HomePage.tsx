import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Layout } from '../components/Layout'
import { createManifestazione, formatDateTime, listManifestazioni } from '../services/firestore'
import type { Manifestazione } from '../types'

export function HomePage() {
  const [manifestazioni, setManifestazioni] = useState<Manifestazione[]>([])
  const [nome, setNome] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      setManifestazioni(await listManifestazioni())
      setError(null)
    } catch {
      setError('Impossibile caricare le manifestazioni.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!nome.trim()) return

    setCreating(true)
    setError(null)
    try {
      await createManifestazione(nome)
      setNome('')
      await load()
    } catch {
      setError('Errore durante la creazione della manifestazione.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Layout
      title="Manifestazioni"
      subtitle="Seleziona o crea una manifestazione per gestire i PMA e i pazienti."
    >
      <div className="grid-two">
        <Card>
          <h2>Nuova manifestazione</h2>
          <form className="stack-form" onSubmit={handleSubmit}>
            <label>
              Nome manifestazione
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Es. Stramilano 2026"
                required
              />
            </label>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creazione...' : 'Crea manifestazione'}
            </Button>
          </form>
          {error && <p className="error-text">{error}</p>}
        </Card>

        <Card>
          <h2>Manifestazioni esistenti</h2>
          {loading ? (
            <p>Caricamento...</p>
          ) : manifestazioni.length === 0 ? (
            <p className="muted">Nessuna manifestazione creata.</p>
          ) : (
            <ul className="item-list">
              {manifestazioni.map((manifestazione) => (
                <li key={manifestazione.id}>
                  <Link
                    to={`/manifestazioni/${manifestazione.id}`}
                    className="item-link"
                  >
                    <span className="item-title">{manifestazione.nome}</span>
                    <span className="item-meta">
                      Creata il {formatDateTime(manifestazione.createdAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Layout>
  )
}
