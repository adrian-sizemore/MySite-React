const monthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

function formatDate(value) {
  if (!value) return ''
  return monthFormatter.format(new Date(`${value}T00:00:00Z`))
}

function formatRange(item) {
  const start = formatDate(item.start_date)
  const end = item.is_current ? 'Present' : formatDate(item.end_date)
  return [start, end].filter(Boolean).join(' – ')
}

function AboutView({ data }) {
  return (
    <div className="detail-stack">
      <div className="detail-lead">
        <p>{data.summary}</p>
        <p>{data.introduction}</p>
      </div>
      <div className="detail-grid">
        {(data.sections || []).map((section) => (
          <article className="detail-card" key={section.id}>
            <p className="eyebrow">{section.section_type?.replaceAll('_', ' ')}</p>
            <h2>{section.title}</h2>
            {section.summary && <p className="summary">{section.summary}</p>}
            <p>{section.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

function Accomplishments({ items = [] }) {
  if (!items.length) return null
  return (
    <div className="accomplishment-grid">
      {items.map((item) => (
        <div className="accomplishment" key={item.id}>
          {item.metric_value && <strong>{item.metric_value}</strong>}
          {item.metric_label && <span>{item.metric_label}</span>}
          <h3>{item.title}</h3>
          <p>{item.statement}</p>
          {item.technology_context && <small>{item.technology_context}</small>}
        </div>
      ))}
    </div>
  )
}

export function ExperienceView({ data }) {
  return (
    <div className="timeline-list">
      {data.map((role) => (
        <article className="role" key={role.id}>
          <header>
            <div>
              <p className="eyebrow">{role.company}</p>
              <h2>{role.job_title}</h2>
            </div>
            <p className="date-range">{formatRange(role)}</p>
          </header>
          <p className="role-summary">{role.role_summary}</p>
          <div className="role-sections">
            {(role.sections || []).map((section) => (
              <div key={section.id}>
                <h3>{section.title}</h3>
                <p>{section.body}</p>
              </div>
            ))}
          </div>
          <Accomplishments items={role.accomplishments} />
        </article>
      ))}
    </div>
  )
}

export function MilitaryView({ data }) {
  return (
    <div className="military-list">
      {data.map((service) => (
        <article key={service.id}>
          <p className="eyebrow">{formatRange(service) || 'Military service'}</p>
          <h2>{service.branch}</h2>
          <h3>{service.role}</h3>
          {service.summary && <p>{service.summary}</p>}
          {service.full_description && <p>{service.full_description}</p>}
        </article>
      ))}
    </div>
  )
}

export function ProjectsView({ data }) {
  return (
    <div className="project-grid">
      {data.map((project) => (
        <article className="project-card" key={project.id}>
          <p className="eyebrow">{project.project_type}</p>
          <h2>{project.name}</h2>
          <p className="summary">{project.short_summary}</p>
          <dl>
            <dt>Problem</dt><dd>{project.problem_statement}</dd>
            <dt>Approach</dt><dd>{project.solution_summary}</dd>
            <dt>Outcome</dt><dd>{project.outcome}</dd>
          </dl>
        </article>
      ))}
    </div>
  )
}

function SkillsView({ data }) {
  return (
    <div className="skill-grid">
      {data.map((category) => (
        <section key={category.id}>
          <h3>{category.name}</h3>
          <ul>{category.skills.map((skill) => <li key={skill.id}>{skill.name}</li>)}</ul>
        </section>
      ))}
    </div>
  )
}

function ResumeView({ data }) {
  return (
    <div className="resume-view">
      {data.profile && (
        <section className="detail-lead">
          <h2>{data.profile.headline}</h2>
          <p>{data.profile.full_summary}</p>
        </section>
      )}
      {!!data.experience?.length && <><h2 className="section-heading">Experience</h2><ExperienceView data={data.experience} /></>}
      {!!data.projects?.length && <><h2 className="section-heading">Projects</h2><ProjectsView data={data.projects} /></>}
      {!!data.skill_categories?.length && <><h2 className="section-heading">Skills</h2><SkillsView data={data.skill_categories} /></>}
      {!!data.military_service?.length && <><h2 className="section-heading">Military Service</h2><MilitaryView data={data.military_service} /></>}
      <ResumeFacts data={data} />
    </div>
  )
}

function ResumeFacts({ data }) {
  const facts = [
    ['Education', data.education],
    ['Certifications', data.certifications],
    ['Volunteering', data.volunteering],
  ].filter(([, items]) => items?.length)

  if (!facts.length) return null
  return (
    <div className="fact-grid">
      {facts.map(([title, items]) => (
        <section key={title}>
          <h2>{title}</h2>
          {items.map((item) => (
            <div className="fact" key={item.id}>
              <strong>{item.name || item.institution || item.organization}</strong>
              <span>{item.degree || item.issuing_organization || item.role}</span>
              <small>{item.field_of_study || item.status}</small>
            </div>
          ))}
        </section>
      ))}
    </div>
  )
}

export function ResourceView({ resourceKey, data }) {
  if (resourceKey === 'about') return <AboutView data={data} />
  if (resourceKey === 'experience') return <ExperienceView data={data} />
  if (resourceKey === 'military') return <MilitaryView data={data} />
  if (resourceKey === 'projects') return <ProjectsView data={data} />
  if (resourceKey === 'resume') return <ResumeView data={data} />
  return <p>Content is available but does not yet have a dedicated view.</p>
}
