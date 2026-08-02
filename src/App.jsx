import './App.css'
import { DetailPage } from './components/DetailPage'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { useRoute } from './hooks/useRoute'

const routeToResource = {
  about: 'about',
  experience: 'experience',
  'military-service': 'military',
  resume: 'resume',
  projects: 'projects',
}

function App() {
  const { route, navigate } = useRoute()
  const resourceKey = routeToResource[route]

  return (
    <div className="site-shell">
      <Header onNavigate={navigate} />
      {route === 'home' && <HomePage onNavigate={navigate} />}
      {resourceKey && (
        <DetailPage key={resourceKey} resourceKey={resourceKey} onNavigate={navigate} />
      )}
      {route !== 'home' && !resourceKey && (
        <main className="detail-page">
          <div className="status-panel">
            <h1>Page not found</h1>
            <button type="button" onClick={() => navigate('/')}>Return home</button>
          </div>
        </main>
      )}
    </div>
  )
}

export default App
