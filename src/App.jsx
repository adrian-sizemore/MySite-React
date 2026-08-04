import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { studioApi } from './api/studioApi'
import { ContentStudio } from './components/ContentStudio'
import { ContactPage } from './components/ContactPage'
import { DetailPage } from './components/DetailPage'
import { DirectoryPage } from './components/DirectoryPage'
import { Header } from './components/Header'
import { HomePage } from './components/HomePage'
import { LoginPage } from './components/LoginPage'
import { useRoute } from './hooks/useRoute'

const routeToResource = {
  about: 'about',
  experience: 'experience',
  'military-service': 'military',
  resume: 'resume',
  projects: 'projects',
  volunteering: 'volunteering',
  education: 'education',
  certifications: 'certifications',
  skills: 'skills',
}

function App() {
  const { route, navigate } = useRoute()
  const resourceKey = routeToResource[route]
  const [session, setSession] = useState(null)
  const expireSession = useCallback(() => setSession({ authenticated: false }), [])

  useEffect(() => {
    if (route === 'studio') studioApi.session().then(setSession).catch(() => setSession({ authenticated: false }))
  }, [route])

  if (route === 'studio') {
    if (!session) return <div className="studio-loading">Opening your private workspace…</div>
    if (!session.authenticated) return <LoginPage onAuthenticated={setSession} />
    return <ContentStudio session={session} onSessionExpired={expireSession} onLogout={async () => { await studioApi.logout(); setSession({ authenticated: false }) }} />
  }

  return (
    <div className="site-shell">
      <Header onNavigate={navigate} />
      {route === 'home' && <HomePage onNavigate={navigate} />}
      {route === 'contact' && <ContactPage />}
      {route === 'career' && <DirectoryPage type="career" onNavigate={navigate} />}
      {route === 'learn-more' && <DirectoryPage type="learn" onNavigate={navigate} />}
      {resourceKey && (
        <DetailPage key={resourceKey} resourceKey={resourceKey} onNavigate={navigate} />
      )}
      {route !== 'home' && !resourceKey && !['studio', 'contact', 'career', 'learn-more'].includes(route) && (
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
