import { NavLink } from './NavLink'
import { useApiResource } from '../hooks/useApiResource'

const navigation = [
  { label: 'About Adrian', href: '/about' },
  { label: 'Career', href: '/career' },
  { label: 'Learn More', href: '/learn-more' },
  { label: 'Contact', href: '/contact' },
]

const labAccessUrl = 'ssh://adrian@100.76.5.32'

export function Header({ onNavigate }) {
  const { status, data } = useApiResource('about')

  return (
    <header className="site-header">
      <NavLink className="brand" href="/" onNavigate={onNavigate}>
        Adrian Sizemore
      </NavLink>
      <nav aria-label="Primary navigation">
        {status === 'success' && data?.show_opportunity_chip && (
          <span
            className="nav-opportunity-chip"
            style={{ '--chip-color': data.opportunity_chip_color || '#1c7ed6' }}
          >
            {data.opportunity_chip_text || 'Currently looking for new and exciting opportunities'}
          </span>
        )}
        {navigation.map((item) => (
          <NavLink key={item.href} href={item.href} onNavigate={onNavigate}>
            {item.label}
          </NavLink>
        ))}
        <a className="lab-access-link" href={labAccessUrl}>Access Lab</a>
        <NavLink className="login-link" href="/studio" onNavigate={onNavigate}>Login</NavLink>
      </nav>
    </header>
  )
}
