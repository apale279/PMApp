import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[PMApp] Errore React non gestito:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '2rem',
            textAlign: 'center',
            background: '#eef2f7',
            fontFamily: "'Segoe UI', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #fca5a5',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
            }}
          >
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>⚠️</p>
            <h1
              style={{
                margin: '0 0 0.75rem',
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#dc2626',
              }}
            >
              Si è verificato un errore
            </h1>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              {this.state.error?.message ?? 'Errore sconosciuto'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.65rem 1.5rem',
                background: '#145da0',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.875rem',
              }}
            >
              Ricarica l'app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
