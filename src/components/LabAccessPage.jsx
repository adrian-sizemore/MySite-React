import { useEffect, useRef, useState } from 'react'
import { contactApi } from '../api/contactApi'

const emptyForm = {
  first_name: '',
  last_name: '',
  email: '',
  company: '',
  title: '',
  reason: '',
  website: '',
}

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-turnstile]')
    if (existing) {
      existing.addEventListener('load', resolve, { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstile = 'true'
    script.onload = resolve
    script.onerror = () => reject(new Error('The security check could not load.'))
    document.head.appendChild(script)
  })
}

export function LabAccessPage() {
  const [form, setForm] = useState(emptyForm)
  const [token, setToken] = useState('')
  const [status, setStatus] = useState({ type: '', message: '' })
  const [busy, setBusy] = useState(false)
  const widget = useRef(null)
  const container = useRef(null)

  useEffect(() => {
    let active = true
    Promise.all([contactApi.config(), loadTurnstile()]).then(([config]) => {
      if (!active) return
      if (!config.site_key) throw new Error('Lab registration is not configured yet.')
      widget.current = window.turnstile.render(container.current, {
        sitekey: config.site_key,
        action: 'contact',
        theme: 'light',
        size: 'flexible',
        callback: setToken,
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      })
    }).catch((error) => setStatus({ type: 'error', message: error.message }))
    return () => {
      active = false
      if (widget.current != null && window.turnstile) window.turnstile.remove(widget.current)
    }
  }, [])

  const update = (event) => setForm((current) => ({
    ...current,
    [event.target.name]: event.target.value,
  }))

  const submit = async (event) => {
    event.preventDefault()
    setStatus({ type: '', message: '' })
    setBusy(true)
    try {
      await contactApi.submit({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        company: form.company,
        title: form.title,
        work_phone: '',
        message: `[REMOTE LAB ACCESS REQUEST]\n\n${form.reason}`,
        website: form.website,
        turnstile_token: token,
      })
      setForm(emptyForm)
      setToken('')
      setStatus({
        type: 'success',
        message: 'Your registration was received. Access details will be sent after the request is reviewed.',
      })
      if (widget.current != null) window.turnstile.reset(widget.current)
    } catch (error) {
      setStatus({ type: 'error', message: error.message })
      setToken('')
      if (widget.current != null) window.turnstile.reset(widget.current)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="lab-access-page">
      <section className="lab-access-intro">
        <p className="eyebrow">Remote engineering lab</p>
        <h1>Request lab access</h1>
        <p>Register for temporary access to the remote multi-site data-center lab. Approved sessions are private, time-limited, and reached through the Tailscale network.</p>
        <div className="lab-access-details">
          <div><strong>Private transport</strong><span>Lab services remain behind the Tailscale tunnel.</span></div>
          <div><strong>Disposable access</strong><span>Each approved registration receives temporary session credentials.</span></div>
          <div><strong>Hands-on topology</strong><span>Explore routed fabrics, EVPN, DCI, Linux endpoints, and Arista EOS.</span></div>
        </div>
      </section>
      <section className="lab-registration-panel">
        <div className="lab-form-heading">
          <p className="eyebrow">Registration</p>
          <h2>Tell me who needs access</h2>
          <p>Every request is reviewed before temporary credentials are issued.</p>
        </div>
        <form onSubmit={submit}>
          <div className="contact-grid">
            <label>First name <span>Required</span><input name="first_name" autoComplete="given-name" required maxLength="100" value={form.first_name} onChange={update} /></label>
            <label>Last name <span>Required</span><input name="last_name" autoComplete="family-name" required maxLength="100" value={form.last_name} onChange={update} /></label>
            <label>Email <span>Required</span><input name="email" type="email" autoComplete="email" required maxLength="254" value={form.email} onChange={update} /></label>
            <label>Company <span>Required</span><input name="company" autoComplete="organization" required maxLength="200" value={form.company} onChange={update} /></label>
            <label className="contact-message">Role or title <small>Optional</small><input name="title" autoComplete="organization-title" maxLength="200" value={form.title} onChange={update} /></label>
            <label className="contact-message">Reason for access <span>Required</span><textarea name="reason" required minLength="10" maxLength="2000" rows="6" value={form.reason} onChange={update} placeholder="Describe what you would like to explore or validate in the lab." /></label>
            <label className="contact-honeypot" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={update} /></label>
          </div>
          <div ref={container} className="turnstile-container" />
          {status.message && <p className={`contact-status ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}
          <button className="contact-submit" disabled={busy || !token}>{busy ? 'Submitting…' : 'Request lab access'}</button>
        </form>
      </section>
    </main>
  )
}
