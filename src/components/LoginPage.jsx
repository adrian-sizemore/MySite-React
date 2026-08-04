import { useState } from 'react'
import { studioApi } from '../api/studioApi'

export function LoginPage({ onAuthenticated }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [username, setUsername] = useState('adrian')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')

  const run = async (action) => {
    setBusy(true); setError('')
    try { onAuthenticated(await action()) } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <p className="eyebrow">Private workspace</p>
        <h1>Content Studio</h1>
        <p>Sign in with your administrator password and the current six-digit code from your authenticator app.</p>
        {error && <p className="studio-error" role="alert">{error}</p>}
        <div className="enrollment-form">
          <label>Username<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          <label>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength="6" value={totpCode} onChange={(event) => setTotpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} /></label>
          <button className="primary-action" disabled={busy || !username || !password || totpCode.length !== 6} onClick={() => run(() => studioApi.login(username, password, totpCode))}>{busy ? 'Checking…' : 'Sign in securely'}</button>
        </div>
      </section>
    </main>
  )
}
