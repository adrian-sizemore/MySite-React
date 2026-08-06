import networkHero from '../assets/global-network.png'
import { homeContent } from '../content/homeContent'
import { NavLink } from './NavLink'

function CareerTimeline() {
  return (
    <div className="career-summary" aria-label="Career and service timeline">
      <p className="career-years">25+ YEARS</p>
      <p className="career-label">OF SERVICE &amp; ENGINEERING</p>
      <ol>
        {homeContent.timeline.map((item) => (
          <li className={item.type} key={`${item.dates}-${item.label}`}>
            <span>{item.dates}</span>
            <strong>{item.label}</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}

function CapabilityBand({ onNavigate }) {
  return (
    <section className="capability-band" aria-label="Technical capabilities">
      <div className="capability-intro">
        <p>{homeContent.introduction}</p>
        <NavLink href="/projects" onNavigate={onNavigate}>
          Explore the work and impact <span aria-hidden="true">→</span>
        </NavLink>
      </div>
      {homeContent.capabilities.map((capability) => (
        <div className="capability" key={capability.title}>
          <h2>{capability.title}</h2>
          <ul>
            {capability.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  )
}

function ExperiencePreview({ onNavigate }) {
  return (
    <article className="preview-block">
      <h2>Professional Experience</h2>
      {homeContent.experiencePreview.map((item) => (
        <div className="preview-entry" key={item.heading}>
          <h3>{item.heading} <span>· {item.dates}</span></h3>
          <p>{item.summary}</p>
        </div>
      ))}
      <NavLink href="/experience" onNavigate={onNavigate}>
        Explore Experience <span aria-hidden="true">→</span>
      </NavLink>
    </article>
  )
}

function MilitaryPreview({ onNavigate }) {
  return (
    <article className="preview-block military-preview">
      <h2>Military Service</h2>
      <ul>
        {homeContent.militaryPreview.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <p>A foundation in disciplined communication, accountability, and mission-focused execution.</p>
      <NavLink href="/military-service" onNavigate={onNavigate}>
        Learn More <span aria-hidden="true">→</span>
      </NavLink>
    </article>
  )
}

export function HomePage({ onNavigate }) {
  const { identity } = homeContent

  return (
    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <span className="accent-rule" aria-hidden="true" />
          <h1>{identity.title}</h1>
          <div className="hero-details">
            <div className="credential">
              <p>{identity.certification}</p>
              <strong>{identity.certificationNumber}</strong>
              <p className="tagline">{identity.tagline}</p>
            </div>
            <CareerTimeline />
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <img src={networkHero} alt="" />
        </div>
      </section>
      <CapabilityBand onNavigate={onNavigate} />
      <section className="preview-grid">
        <ExperiencePreview onNavigate={onNavigate} />
        <MilitaryPreview onNavigate={onNavigate} />
      </section>
    </main>
  )
}
