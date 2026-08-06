import { NavLink } from './NavLink'

const directories = {
  career: {
    eyebrow: 'Professional background',
    title: 'Career',
    introduction: 'Explore my engineering experience, military service, technical capabilities, and complete professional record.',
    featured: [
      { title: 'Professional Experience', description: 'Roles, responsibilities, and measurable accomplishments across my engineering career.', href: '/experience' },
      { title: 'Military Service', description: 'The leadership, discipline, and service experience that continue to shape my work.', href: '/military-service' },
      { title: 'Résumé', description: 'View the complete record online or download a concise or comprehensive PDF.', href: '/resume' },
    ],
    links: [
      { title: 'Projects', description: 'Selected architecture, automation, and infrastructure work.', href: '/projects' },
      { title: 'Technical Skills', description: 'Platforms, technologies, and engineering disciplines.', href: '/skills' },
      { title: 'Education', description: 'Formal education and continued professional development.', href: '/education' },
      { title: 'Certifications', description: 'Current credentials and professional certifications.', href: '/certifications' },
    ],
  },
  learn: {
    eyebrow: 'Beyond the résumé',
    title: 'Learn More',
    introduction: 'Get to know the experiences, interests, values, and community work behind my professional career.',
    featured: [
      { title: 'About Adrian', description: 'My background, working philosophy, interests, and the experiences that shaped me.', href: '/about' },
      { title: 'Volunteering', description: 'Community service, professional mentorship, and causes I support.', href: '/volunteering' },
      { title: 'Hobbies & Interests', description: 'What I enjoy learning, building, and doing away from the day-to-day work.', href: '/about' },
    ],
    links: [
      { title: 'Personal Projects', description: 'Hands-on work driven by curiosity and continuous learning.', href: '/projects' },
      { title: 'Leadership & Values', description: 'How I approach service, teams, accountability, and difficult decisions.', href: '/about' },
      { title: 'Start a Conversation', description: 'Reach out about opportunities, collaboration, or shared interests.', href: '/contact' },
    ],
  },
}

export function DirectoryPage({ type, onNavigate }) {
  const directory = directories[type]
  return (
    <main className="directory-page">
      <header className="directory-intro">
        <p className="eyebrow">{directory.eyebrow}</p>
        <h1>{directory.title}</h1>
        <p>{directory.introduction}</p>
      </header>
      <section className="directory-featured" aria-label={`${directory.title} highlights`}>
        {directory.featured.map((item) => (
          <NavLink className="directory-card featured" href={item.href} onNavigate={onNavigate} key={item.title}>
            <span>Explore</span><h2>{item.title}</h2><p>{item.description}</p><strong>View section →</strong>
          </NavLink>
        ))}
      </section>
      <section className="directory-links" aria-label={`More ${directory.title} sections`}>
        {directory.links.map((item) => (
          <NavLink className="directory-card" href={item.href} onNavigate={onNavigate} key={item.title}>
            <h2>{item.title}</h2><p>{item.description}</p><strong>View section →</strong>
          </NavLink>
        ))}
      </section>
    </main>
  )
}
