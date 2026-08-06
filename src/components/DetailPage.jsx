import { resourceConfig } from '../api/resumeApi'
import { useApiResource } from '../hooks/useApiResource'
import '../Detail.css'
import { NavLink } from './NavLink'
import { ResourceView } from './ResourceViews'

function isEmpty(data) {
  if (data == null) return true
  if (Array.isArray(data)) return data.length === 0
  if (typeof data === 'object') return Object.keys(data).length === 0
  return false
}

export function DetailPage({ resourceKey, onNavigate }) {
  const config = resourceConfig[resourceKey]
  const { status, data, error, retry } = useApiResource(resourceKey)

  return (
    <main className="detail-page">
      <div className="detail-heading">
        <NavLink href="/" onNavigate={onNavigate}>← Back home</NavLink>
        <span className="accent-rule" aria-hidden="true" />
        <h1>{config.title}</h1>
      </div>

      {status === 'loading' && (
        <div className="status-panel" role="status">
          <span className="loading-line" />
          <span className="loading-line short" />
          <p>Loading {config.title.toLowerCase()}…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="status-panel" role="alert">
          <h2>Unable to load this section</h2>
          <p>{error}</p>
          <button type="button" onClick={retry}>Try again</button>
        </div>
      )}

      {status === 'success' && isEmpty(data) && (
        <div className="status-panel">
          <h2>Content coming soon</h2>
          <p>This section is connected and ready for its published API content.</p>
        </div>
      )}

      {status === 'success' && !isEmpty(data) && (
        <ResourceView resourceKey={resourceKey} data={data} />
      )}
    </main>
  )
}
