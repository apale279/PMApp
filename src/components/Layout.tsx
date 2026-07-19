import { Link } from 'react-router-dom'
import { useNetworkStatus } from '../hooks/useNetworkStatus'

interface LayoutProps {
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  children: React.ReactNode
  actions?: React.ReactNode
  wide?: boolean
}

export function Layout({
  title,
  subtitle,
  backTo,
  backLabel = 'Indietro',
  children,
  actions,
  wide = false,
}: LayoutProps) {
  const online = useNetworkStatus()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-brand">
          <Link to="/" className="brand-link">
            PMApp
          </Link>
          <span className={`connection-badge ${online ? 'connection-badge-online' : 'connection-badge-offline'}`}>
            <span className="connection-dot" />
            {online ? 'Online' : 'Offline'}
          </span>
          <span className="brand-tag">Gestione PMA</span>
        </div>
      </header>

      <main className={`app-main ${wide ? 'app-main-wide' : ''}`.trim()}>
        <div className="page-header">
          <div>
            {backTo && (
              <Link to={backTo} className="back-link">
                ← {backLabel}
              </Link>
            )}
            <h1>{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          {actions && <div className="page-actions">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}
