import { useEffect, useRef, useState } from 'react'
import { contactApi } from '../api/contactApi'

const emptyForm = { first_name: '', last_name: '', email: '', company: '', title: '', work_phone: '', message: '', website: '' }

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-turnstile]')
    if (existing) { existing.addEventListener('load', resolve, { once: true }); return }
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true; script.defer = true; script.dataset.turnstile = 'true'
    script.onload = resolve; script.onerror = () => reject(new Error('The security check could not load.'))
    document.head.appendChild(script)
  })
}

export function ContactPage() {
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
      if (!config.site_key) throw new Error('The contact form security check is not configured yet.')
      widget.current = window.turnstile.render(container.current, { sitekey: config.site_key, action: 'contact', theme: 'light', size: 'flexible', callback: setToken, 'expired-callback': () => setToken(''), 'error-callback': () => setToken('') })
    }).catch((error) => setStatus({ type: 'error', message: error.message }))
    return () => { active = false; if (widget.current != null && window.turnstile) window.turnstile.remove(widget.current) }
  }, [])

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  const submit = async (event) => {
    event.preventDefault(); setStatus({ type: '', message: '' }); setBusy(true)
    try {
      const result = await contactApi.submit({ ...form, turnstile_token: token })
      setForm(emptyForm); setToken(''); setStatus({ type: 'success', message: result.detail })
      if (widget.current != null) window.turnstile.reset(widget.current)
    } catch (error) {
      setStatus({ type: 'error', message: error.message }); setToken('')
      if (widget.current != null) window.turnstile.reset(widget.current)
    } finally { setBusy(false) }
  }

  return <main className="contact-page"><section className="contact-intro"><p className="eyebrow">Get in touch</p><h1>Start a conversation</h1><p>Have a role, project, or technical challenge you’d like to discuss? Send me a note and I’ll respond using the email address you provide.</p><div className="contact-privacy"><strong>Your information stays private.</strong><span>Contact submissions are stored in my protected site inbox and are not published.</span></div></section><section className="contact-form-panel"><form onSubmit={submit}><div className="contact-grid"><label>First name <span>Required</span><input name="first_name" autoComplete="given-name" required maxLength="100" value={form.first_name} onChange={update} /></label><label>Last name <span>Required</span><input name="last_name" autoComplete="family-name" required maxLength="100" value={form.last_name} onChange={update} /></label><label>Email <span>Required</span><input name="email" type="email" autoComplete="email" required maxLength="254" value={form.email} onChange={update} /></label><label>Company <small>Optional</small><input name="company" autoComplete="organization" maxLength="200" value={form.company} onChange={update} /></label><label>Title <small>Optional</small><input name="title" autoComplete="organization-title" maxLength="200" value={form.title} onChange={update} /></label><label>Work phone <small>Optional</small><input name="work_phone" type="tel" autoComplete="tel" maxLength="50" value={form.work_phone} onChange={update} /></label><label className="contact-message">Message <small>Optional</small><textarea name="message" maxLength="5000" rows="7" value={form.message} onChange={update} /></label><label className="contact-honeypot" aria-hidden="true">Website<input name="website" tabIndex="-1" autoComplete="off" value={form.website} onChange={update} /></label></div><div ref={container} className="turnstile-container" />{status.message && <p className={`contact-status ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'}>{status.message}</p>}<button className="contact-submit" disabled={busy || !token}>{busy ? 'Sending…' : 'Send message'}</button></form></section></main>
}
