import { useEffect, useMemo, useState } from 'react'
import { studioApi } from '../api/studioApi'
import { clearAllResourceCaches } from '../api/resumeApi'
import { contentSchemas } from '../content/contentSchemas'

const pretty = (value) => JSON.stringify(value || {}, null, 2)

const relatedGroups = {
  profile: [
    ['about', 'profile', 'About', 'About record'],
    ['experience', 'profile', 'Work experiences', 'Work experience'],
    ['military-service', 'profile', 'Military service', 'Military service'],
    ['projects', 'profile', 'Projects', 'Project'],
    ['volunteering', 'profile', 'Volunteering', 'Volunteer experience'],
    ['education', 'profile', 'Education', 'Education record'],
    ['certifications', 'profile', 'Certifications', 'Certification'],
    ['skill-categories', 'profile', 'Skill categories', 'Skill category'],
  ],
  about: [['about-sections', 'about_me', 'About sections', 'About section']],
  experience: [
    ['experience-sections', 'experience', 'Experience sections', 'Experience section'],
    ['accomplishments', 'experience', 'Accomplishments and metrics', 'Accomplishment'],
  ],
  projects: [['project-sections', 'project', 'Project sections', 'Project section']],
  volunteering: [['volunteer-sections', 'volunteer_experience', 'Volunteer sections', 'Volunteer section']],
  'skill-categories': [['skills', 'category', 'Skills', 'Skill']],
}

export function ContentStudio({ session, onLogout, onSessionExpired }) {
  const [models, setModels] = useState({})
  const [schemas, setSchemas] = useState({})
  const [items, setItems] = useState([])
  const [model, setModel] = useState('experience')
  const [selectedId, setSelectedId] = useState(null)
  const [editor, setEditor] = useState('{}')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [showInbox, setShowInbox] = useState(false)
  const [messages, setMessages] = useState([])
  const visible = useMemo(() => items.filter((item) => item.model_name === model).sort((a, b) => a.draft_order - b.draft_order), [items, model])
  const selected = items.find((item) => item.id === selectedId)
  const draft = useMemo(() => {
    try { return JSON.parse(editor) } catch { return null }
  }, [editor])
  const fields = schemas[model] || contentSchemas[model] || []

  const choose = (item) => {
    if (dirty && !window.confirm('Discard the unsaved changes in this editor?')) return
    setSelectedId(item?.id ?? null)
    if (item) { setTitle(item.title); setEditor(pretty(item.draft_data)); setModel(item.model_name); setDirty(false) }
  }
  const load = async () => {
    const data = await studioApi.list(); setModels(data.models); setSchemas(data.schemas || {}); setItems(data.items)
    return data
  }
  useEffect(() => {
    studioApi.list().then((data) => {
      setModels(data.models); setSchemas(data.schemas || {}); setItems(data.items)
      if (data.items.length) {
        const item = data.items[0]
        setSelectedId(item.id); setTitle(item.title); setEditor(pretty(item.draft_data)); setModel(item.model_name)
      }
    }).catch((err) => { if (!studioApi.isAuthenticated()) onSessionExpired(); else setError(err.message) })
  }, [onSessionExpired])
  useEffect(() => {
    const warn = (event) => { if (dirty) event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const act = async (action, success, clean = false) => {
    setError(''); setMessage('')
    try { await action(); await load(); if (clean) setDirty(false); setMessage(success) } catch (err) { if (!studioApi.isAuthenticated()) onSessionExpired(); else setError(err.message) }
  }
  const currentDraft = () => {
    let draft
    try { draft = JSON.parse(editor) } catch { throw new Error('Fix the highlighted draft JSON before saving.') }
    return draft
  }
  const save = () => act(() => studioApi.save(selectedId, { title, draft_data: currentDraft() }), 'Draft saved. Nothing was published.', true)
  const publish = () => act(async () => {
    await studioApi.save(selectedId, { title, draft_data: currentDraft() })
    await studioApi.publish(selectedId)
    clearAllResourceCaches()
  }, 'Published to the live API.', true)
  const create = () => {
    if (dirty && !window.confirm('Discard the unsaved changes in this editor?')) return
    act(async () => {
      const item = await studioApi.create({ model_name: model, title: 'Untitled', draft_data: {}, draft_order: visible.length })
      setSelectedId(item.id); setTitle(item.title); setEditor(pretty(item.draft_data)); setModel(item.model_name); setDirty(false)
    }, 'New private draft created.')
  }
  const move = (index, direction) => act(async () => {
    const ids = visible.map((item) => item.id)
    const other = index + direction
    if (other < 0 || other >= ids.length) return
    ;[ids[index], ids[other]] = [ids[other], ids[index]]
    await studioApi.reorder(model, ids)
  }, 'Draft order saved. Publish changed records when ready.')
  const updateField = (field, value) => {
    const next = { ...(draft || {}) }
    if (value === '' && field.type !== 'checkbox') delete next[field.key]
    else next[field.key] = field.type === 'number' ? Number(value) : value
    setEditor(pretty(next))
    setDirty(true)
  }
  const relatedItems = (modelKey, parentField) => items
    .filter((item) => item.model_name === modelKey && String(item.draft_data?.[parentField]) === String(selected?.object_id))
    .sort((a, b) => a.draft_order - b.draft_order)
  const addRelated = (modelKey, parentField, label) => act(async () => {
    await studioApi.create({ model_name: modelKey, title: `New ${label}`, draft_data: { [parentField]: selected.object_id }, draft_order: relatedItems(modelKey, parentField).length })
  }, `New ${label.toLowerCase()} row added as a private draft.`)
  const changeRelated = (itemId, field, value) => setItems((current) => current.map((item) => item.id === itemId ? { ...item, draft_data: { ...item.draft_data, [field.key]: field.type === 'number' && value !== '' ? Number(value) : value }, has_unpublished_changes: true } : item))
  const saveRelated = (item) => act(() => studioApi.save(item.id, { title: item.draft_data.title || item.draft_data.statement || item.title, draft_data: item.draft_data }), 'Row saved as a private draft.')
  const publishRelated = (item) => act(async () => {
    await studioApi.save(item.id, { title: item.draft_data.title || item.draft_data.statement || item.title, draft_data: item.draft_data })
    await studioApi.publish(item.id); clearAllResourceCaches()
  }, item.pending_deletion ? 'Row removed from the live site.' : 'Row published to the live site.')
  const deleteRelated = (item) => window.confirm('Remove this row from the draft? It will not affect the live site until you publish the removal.') && act(() => studioApi.remove(item.id), 'Row marked for removal. Publish the removal when ready.')
  const restoreRelated = (item) => act(() => studioApi.save(item.id, { pending_deletion: false }), 'Row restored.')
  const moveRelated = (modelKey, parentField, index, direction) => act(async () => {
    const related = relatedItems(modelKey, parentField).filter((item) => !item.pending_deletion)
    const ids = related.map((item) => item.id)
    const other = index + direction
    if (other < 0 || other >= ids.length) return
    ;[ids[index], ids[other]] = [ids[other], ids[index]]
    await studioApi.reorder(modelKey, ids, { parent_field: parentField, parent_id: selected.object_id })
  }, 'Row order saved as a draft.')
  const renderRelatedRows = (modelKey, parentField, heading, addLabel) => {
    const related = relatedItems(modelKey, parentField)
    const active = related.filter((item) => !item.pending_deletion)
    const rowFields = (schemas[modelKey] || []).filter((field) => field.key !== parentField)
    return <section className="related-editor"><div className="related-heading"><div><h3>{heading}</h3><p>{related.length ? `${active.length} active row${active.length === 1 ? '' : 's'}` : 'No rows yet'}</p></div><button onClick={() => addRelated(modelKey, parentField, addLabel)}>+ Add row</button></div><div className="related-rows">{related.map((item) => {
      const activeIndex = active.findIndex((entry) => entry.id === item.id)
      return <details className={`related-row ${item.pending_deletion ? 'pending-delete' : ''}`} key={item.id}><summary><span className="row-grip">{activeIndex + 1}</span><strong>{item.draft_data.title || item.draft_data.statement || item.title}</strong><span>{item.pending_deletion ? 'Removal pending' : item.is_published ? item.has_unpublished_changes ? 'Published · draft changed' : 'Published' : 'Draft only'}</span><div className="row-order"><button disabled={item.pending_deletion || activeIndex <= 0} onClick={(event) => { event.preventDefault(); moveRelated(modelKey, parentField, activeIndex, -1) }}>↑</button><button disabled={item.pending_deletion || activeIndex === active.length - 1} onClick={(event) => { event.preventDefault(); moveRelated(modelKey, parentField, activeIndex, 1) }}>↓</button></div></summary>{item.pending_deletion ? <div className="row-actions"><button onClick={() => restoreRelated(item)}>Undo removal</button><button className="danger-action" onClick={() => publishRelated(item)}>Publish removal</button></div> : <div className="row-editor">{rowFields.map((field) => field.type === 'checkbox' ? <label className="checkbox-field" key={field.key}><input type="checkbox" checked={Boolean(item.draft_data[field.key])} onChange={(event) => changeRelated(item.id, field, event.target.checked)} />{field.label}</label> : <label key={field.key}>{field.label}{field.type === 'textarea' ? <textarea value={item.draft_data[field.key] ?? ''} onChange={(event) => changeRelated(item.id, field, event.target.value)} /> : ['choice', 'relation'].includes(field.type) ? <select value={item.draft_data[field.key] ?? ''} onChange={(event) => changeRelated(item.id, field, event.target.value)}><option value="">Choose…</option>{(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type} value={item.draft_data[field.key] ?? ''} onChange={(event) => changeRelated(item.id, field, event.target.value)} />}</label>)}<div className="row-actions"><button onClick={() => saveRelated(item)}>Save row</button><button className="publish-action" onClick={() => publishRelated(item)}>Publish row</button><button className="danger-action" onClick={() => deleteRelated(item)}>Delete row</button></div></div>}</details>
    })}</div></section>
  }

  const openInbox = async () => {
    setError('')
    try { setMessages(await studioApi.messages()); setShowInbox(true) } catch (err) { if (!studioApi.isAuthenticated()) onSessionExpired(); else setError(err.message) }
  }
  const updateMessage = async (id, status) => {
    await studioApi.updateMessage(id, status)
    setMessages(await studioApi.messages())
  }
  const deleteMessage = async (id) => {
    if (!window.confirm('Delete this contact message permanently?')) return
    await studioApi.deleteMessage(id)
    setMessages((current) => current.filter((message) => message.id !== id))
  }

  if (showInbox) return <main className="studio-page"><header className="studio-toolbar"><div><p className="eyebrow">Private workspace</p><h1>Requests & messages</h1></div><div><button onClick={() => setShowInbox(false)}>Back to content</button><button onClick={onLogout}>Sign out</button></div></header><section className="message-inbox"><div className="inbox-heading"><div><h2>Inbox</h2><p>{messages.filter((message) => message.status === 'new').length} new · {messages.filter((message) => message.request_type === 'lab_access' && message.status === 'new').length} lab access awaiting review</p></div><button onClick={openInbox}>Refresh</button></div>{!messages.length ? <div className="empty-editor"><h2>No requests yet</h2><p>New contact and lab-access submissions will appear here.</p></div> : <div className="message-list">{messages.map((message) => <article className={`message-card ${message.status} ${message.request_type === 'lab_access' ? 'lab-request' : ''}`} key={message.id}><header><div>{message.request_type === 'lab_access' && <span className="request-type-badge">Lab access request</span>}<strong>{message.first_name} {message.last_name}</strong><a href={`mailto:${message.email}`}>{message.email}</a></div><time>{new Date(message.created_at).toLocaleString()}</time></header><dl>{message.company && <><dt>Company</dt><dd>{message.company}</dd></>}{message.title && <><dt>Title</dt><dd>{message.title}</dd></>}{message.work_phone && <><dt>Work phone</dt><dd><a href={`tel:${message.work_phone}`}>{message.work_phone}</a></dd></>}</dl>{message.message && <p>{message.message.replace('[REMOTE LAB ACCESS REQUEST]\n\n', '')}</p>}<footer>{message.request_type === 'lab_access' ? <><span className={`access-decision ${message.status}`}>{message.status === 'new' ? 'Awaiting your decision' : message.status}</span>{message.status === 'new' && <><button className="publish-action" onClick={() => updateMessage(message.id, 'approved')}>Grant access</button><button onClick={() => updateMessage(message.id, 'rejected')}>Reject</button></>}</> : <select aria-label="Message status" value={message.status} onChange={(event) => updateMessage(message.id, event.target.value)}><option value="new">New</option><option value="read">Read</option><option value="archived">Archived</option></select>}<button className="danger-action" onClick={() => deleteMessage(message.id)}>Delete</button></footer></article>)}</div>}</section></main>

  return (
    <main className="studio-page">
      <header className="studio-toolbar"><div><p className="eyebrow">Private workspace</p><h1>Content Studio</h1></div><div><span>{session.user?.name || session.user?.username}</span><button onClick={openInbox}>Messages</button><button onClick={onLogout}>Sign out</button></div></header>
      <div className="studio-layout">
        <aside className="studio-sidebar">
          <label>Content model<select value={model} onChange={(event) => { if (!dirty || window.confirm('Discard the unsaved changes in this editor?')) { setModel(event.target.value); setSelectedId(null); setDirty(false) } }}>{Object.entries(models).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button className="new-draft" onClick={create}>+ New {models[model] || 'record'}</button>
          <ol className="record-list">{visible.map((item, index) => <li key={item.id} className={item.id === selectedId ? 'active' : ''}><button className="record-select" onClick={() => choose(item)}><strong>{item.title}</strong><span>{item.is_published ? (item.has_unpublished_changes ? 'Published · newer draft' : 'Published') : 'Draft only'}</span></button><div className="order-buttons"><button aria-label="Move up" disabled={!index} onClick={() => move(index, -1)}>↑</button><button aria-label="Move down" disabled={index === visible.length - 1} onClick={() => move(index, 1)}>↓</button></div></li>)}</ol>
        </aside>
        <section className="studio-editor">
          {!selected ? <div className="empty-editor"><h2>Choose or create a record</h2><p>Drafts stay private until you press Publish.</p></div> : <>
            <div className="editor-heading"><label>Editor title<input value={title} onChange={(event) => { setTitle(event.target.value); setDirty(true) }} /></label><div className="publication-state"><span className={selected.is_published ? 'live' : ''}>{selected.is_published ? 'Live' : 'Not published'}</span>{(selected.has_unpublished_changes || dirty) && <span>Unsynced draft</span>}</div></div>
            <div className="field-mode"><strong>Model fields</strong><button onClick={() => setAdvanced(!advanced)}>{advanced ? 'Use guided form' : 'Advanced JSON'}</button></div>
            {!advanced && draft && <div className="model-form">{fields.map((field) => field.type === 'checkbox' ? <label className="checkbox-field" key={field.key}><input type="checkbox" checked={Boolean(draft[field.key])} onChange={(event) => updateField(field, event.target.checked)} />{field.label}</label> : <label key={field.key}>{field.label}{field.type === 'textarea' ? <textarea required={field.required} value={draft[field.key] ?? ''} onChange={(event) => updateField(field, event.target.value)} /> : ['choice', 'relation'].includes(field.type) ? <select required={field.required} value={draft[field.key] ?? ''} onChange={(event) => updateField(field, event.target.value)}><option value="">Choose…</option>{(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input required={field.required} type={field.type} value={draft[field.key] ?? ''} onChange={(event) => updateField(field, event.target.value)} />}</label>)}</div>}
            {(advanced || !draft) && <label className="json-editor">Complete model data (JSON)<textarea spellCheck="false" value={editor} onChange={(event) => { setEditor(event.target.value); setDirty(true) }} /></label>}
            {!advanced && <p className="advanced-note">Every field in the selected backend model is available here. Advanced JSON remains available for precise bulk edits.</p>}
            {!advanced && selected.object_id && relatedGroups[model]?.length && <div className="experience-rows"><h2>{model === 'profile' ? 'Resume sections and records' : `Content inside this ${models[model]?.replace(/s$/, '').toLowerCase()}`}</h2><p>Add, edit, delete, publish, and reorder related rows without leaving this record.</p>{relatedGroups[model].map(([childModel, parentField, heading, addLabel]) => <div key={childModel}>{renderRelatedRows(childModel, parentField, heading, addLabel)}</div>)}</div>}
            {error && <p className="studio-error" role="alert">{error}</p>}{message && <p className="studio-message" role="status">{message}</p>}
            <div className="editor-actions"><button onClick={save}>Save draft</button><button className="publish-action" onClick={publish}>Publish this version</button>{selected.is_published && <button onClick={() => act(async () => { await studioApi.unpublish(selected.id); clearAllResourceCaches() }, 'Removed from the live API; draft retained.')}>Unpublish</button>}{!selected.is_published && <button className="danger-action" onClick={() => window.confirm('Delete this draft permanently?') && act(async () => { await studioApi.remove(selected.id); setSelectedId(null) }, 'Record deleted.')}>Delete</button>}</div>
          </>}
        </section>
      </div>
    </main>
  )
}
